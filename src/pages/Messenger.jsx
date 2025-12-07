import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
  limit,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";

import UserList from "../components/messenger/UserList";
import ChatHeader from "../components/messenger/ChatHeader";
import MessageList from "../components/messenger/MessageList";
import MessageInput from "../components/messenger/MessageInput";
import WelcomeScreen from "../components/messenger/WelcomeScreen";
import "../style/Messenger.css";

const Messenger = () => {
  const { theme } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const unsubscribeRefs = useRef({});
  const lastChatId = useRef(null);

  const createChatId = useCallback((uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  }, []);

  const cleanup = useCallback(() => {
    Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') unsubscribe();
    });
    unsubscribeRefs.current = {};
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        cleanup();
        setUsers([]);
        setMessages([]);
        setSelectedUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (!currentUser) return;

    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const usersQuery = query(collection(db, "Users"), limit(50));
        const snapshot = await getDocs(usersQuery);

        const userList = snapshot.docs
          .map((doc) => ({
            uid: doc.id,
            firstName: doc.data().firstName || 'Unknown',
            lastName: doc.data().lastName || '',
            email: doc.data().email || '',
            photo: doc.data().photo || null,
            isOnline: Math.random() > 0.5,
            lastSeen: Date.now() - Math.random() * 3600000,
          }))
          .filter((u) => u.uid !== currentUser.uid);

        setUsers(userList);

      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Could not load users.", { position: "top-center" });
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    if (lastChatId.current === chatId && messages.length > 0) return;

    setIsLoadingMessages(true);
    lastChatId.current = chatId;

    if (unsubscribeRefs.current.messages) {
      unsubscribeRefs.current.messages();
    }

    const messagesQuery = query(
      collection(db, "Messages", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(50)
    );

    unsubscribeRefs.current.messages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messageList);
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error(`Error fetching messages:`, error);
        setIsLoadingMessages(false);
      }
    );

    return () => {
      if (unsubscribeRefs.current.messages) {
        unsubscribeRefs.current.messages();
      }
    };
  }, [currentUser, selectedUser, createChatId, messages.length]);

  const handleSendMessage = useCallback(async (content, mediaFiles = []) => {
    if (!content.trim() && mediaFiles.length === 0) return;

    const chatId = createChatId(currentUser.uid, selectedUser.uid);

    try {
      await addDoc(collection(db, "Messages", chatId, "messages"), {
        senderId: currentUser.uid,
        receiverId: selectedUser.uid,
        content: content,
        mediaFiles: mediaFiles, // Include mediaFiles here
        createdAt: Date.now(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error sending message:`, error);
      toast.error("Could not send message.", { position: "top-center" });
    }
  }, [selectedUser, currentUser, createChatId]); // Removed messageText from dependencies as it's passed as content

  const handleUserSelect = useCallback((user) => {
    if (selectedUser?.uid === user.uid) return;
    setSelectedUser(user);
    setMessages([]);
    lastChatId.current = null;
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <WelcomeScreen theme={theme} />;
  }

  const isChatActive = !!selectedUser;

  return (
    <div className={`messenger-container ${theme}`}>
        <div className={`sidebar-container ${isChatActive ? 'chat-active' : ''}`}>
            <UserList 
                users={filteredUsers}
                selectedUser={selectedUser}
                onUserSelect={handleUserSelect}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                theme={theme}
            />
        </div>
        <div className={`chat-container ${isChatActive ? 'chat-active' : ''}`}>
            {selectedUser ? (
                <>
                    <ChatHeader user={selectedUser} theme={theme} />
                    <MessageList 
                        messages={messages}
                        currentUser={currentUser}
                        selectedUser={selectedUser}
                        theme={theme}
                    />
                    <MessageInput 
                        messageText={messageText}
                        onMessageChange={setMessageText}
                        onSendMessage={handleSendMessage}
                        theme={theme}
                    />
                </>
            ) : (
                <WelcomeScreen theme={theme} />
            )}
        </div>
    </div>
  );
};

export default Messenger;