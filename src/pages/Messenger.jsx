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
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

import UserList from "../components/messenger/UserList";
import ChatHeader from "../components/messenger/ChatHeader";
import MessageList from "../components/messenger/MessageList";
import MessageInput from "../components/messenger/MessageInput";
import WelcomeScreen from "../components/messenger/WelcomeScreen";
import "../style/Messenger.css";

const Messenger = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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

    const loadFriends = async () => {
      try {
        setIsLoading(true);
        const friendshipsQuery = query(
          collection(db, "Friendships"),
          where("participants", "array-contains", currentUser.uid),
          where("status", "==", "accepted")
        );

        const unsubscribe = onSnapshot(
          friendshipsQuery,
          async (snapshot) => {
            try {
              if (snapshot.empty) {
                // No friends, set empty list without error
                setUsers([]);
                setIsLoading(false);
                return;
              }

              const friendPromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                const participants = data.participants || [];
                const friendId = participants.find((id) => id !== currentUser.uid);
                if (!friendId) return null;

                const userRef = doc(db, "Users", friendId);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) return null;

                return {
                  uid: friendId,
                  friendshipId: docSnap.id,
                  firstName: userSnap.data().firstName || 'Unknown',
                  lastName: userSnap.data().lastName || '',
                  email: userSnap.data().email || '',
                  photo: userSnap.data().photo || null,
                  isOnline: Math.random() > 0.5,
                  lastSeen: Date.now() - Math.random() * 3600000,
                };
              });

              const friendsData = (await Promise.all(friendPromises)).filter(Boolean);
              setUsers(friendsData);
              setIsLoading(false);
            } catch (error) {
              console.error("Error loading friends:", error);
              toast.error("Failed to load friends.");
              setIsLoading(false);
            }
          },
          (error) => {
            console.error("Error listening to friendships:", error);
            // Only show error for actual permission issues, not empty results
            if (error.code !== 'permission-denied' || error.message.includes('insufficient')) {
              toast.error(t("failedToLoadFriends"));
            }
            setUsers([]);
            setIsLoading(false);
          }
        );

        unsubscribeRefs.current.friends = unsubscribe;
      } catch (error) {
        console.error("Error setting up friends listener:", error);
        toast.error(t("couldNotLoadFriends"), { position: "top-center" });
        setIsLoading(false);
      }
    };

    loadFriends();
  }, [currentUser, t]);

  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setMessages([]);
      return;
    }

    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    if (lastChatId.current === chatId && messages.length > 0) return;

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
      },
      (error) => {
        console.error(`Error fetching messages:`, error);
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
      toast.error(t("couldNotSendMessage"), { position: "top-center" });
    }
  }, [selectedUser, currentUser, createChatId, t]); // Removed messageText from dependencies as it's passed as content

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