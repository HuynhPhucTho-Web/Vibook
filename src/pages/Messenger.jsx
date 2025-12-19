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
  updateDoc,
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
  const [replyMessage, setReplyMessage] = useState(null);
  const [chatTheme, setChatTheme] = useState({ backgroundColor: "#ffffff", messageColor: "#0d6efd" });
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [recallMessageId, setRecallMessageId] = useState(null);

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
      async (snapshot) => {
        const messageList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Mark messages as read if current user is receiver
        const unreadMessages = messageList.filter(msg =>
          msg.senderId !== currentUser.uid &&
          (!msg.readBy || !msg.readBy.includes(currentUser.uid))
        );

        if (unreadMessages.length > 0) {
          const chatId = createChatId(currentUser.uid, selectedUser.uid);
          const updatePromises = unreadMessages.map(msg =>
            updateDoc(doc(db, "Messages", chatId, "messages", msg.id), {
              readBy: [...(msg.readBy || []), currentUser.uid]
            })
          );
          await Promise.all(updatePromises);
        }

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
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempMessageId,
      senderId: currentUser.uid,
      receiverId: selectedUser.uid,
      content: content,
      mediaFiles: mediaFiles,
      replyTo: replyMessage ? replyMessage.id : null,
      createdAt: Date.now(),
      timestamp: { seconds: Date.now() / 1000 },
      isOptimistic: true, // Flag to indicate this is a temporary message
    };

    // Optimistically add the message to the UI
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const docRef = await addDoc(collection(db, "Messages", chatId, "messages"), {
        senderId: currentUser.uid,
        receiverId: selectedUser.uid,
        content: content,
        mediaFiles: mediaFiles,
        replyTo: replyMessage ? replyMessage.id : null,
        createdAt: Date.now(),
        timestamp: serverTimestamp(),
      });

      // Replace the optimistic message with the real one
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId ? { ...optimisticMessage, id: docRef.id, isOptimistic: false } : msg
      ));

      setReplyMessage(null); // Clear reply after sending
    } catch (error) {
      console.error(`Error sending message:`, error);
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      toast.error(t("couldNotSendMessage"), { position: "top-center" });
    }
  }, [selectedUser, currentUser, createChatId, t, replyMessage]);

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

  const handleReaction = useCallback(async (messageId) => {
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const messageRef = doc(db, "Messages", chatId, "messages", messageId);

    try {
      const messageSnap = await getDoc(messageRef);
      if (messageSnap.exists()) {
        const messageData = messageSnap.data();
        const reactions = messageData.reactions || [];
        const existingReactionIndex = reactions.findIndex(r => r.userId === currentUser.uid);

        if (existingReactionIndex >= 0) {
          // Toggle off if already reacted
          reactions.splice(existingReactionIndex, 1);
        } else {
          reactions.push({ userId: currentUser.uid, type: 'heart' });
        }

        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error(t("couldNotAddReaction"), { position: "top-center" });
    }
  }, [currentUser, selectedUser, createChatId, t]);

  const handleReply = useCallback((message) => {
    setReplyMessage(message);
  }, []);

  const handleApplyTheme = useCallback((newTheme) => {
    setChatTheme(newTheme);
  }, []);

  const handleRecallMessage = useCallback((messageId) => {
    // Show confirmation modal
    setRecallMessageId(messageId);
    setShowRecallModal(true);
  }, []);

  const confirmRecallMessage = useCallback(async () => {
    if (!recallMessageId) return;

    const messageId = recallMessageId;
    setShowRecallModal(false);
    setRecallMessageId(null);

    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const messageRef = doc(db, "Messages", chatId, "messages", messageId);

    // Optimistically update the UI first
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, content: "This message was recalled", isRecalled: true, recalledAt: Date.now() }
        : msg
    ));

    try {
      const messageSnap = await getDoc(messageRef);
      if (messageSnap.exists()) {
        const messageData = messageSnap.data();

        // Check if message is from current user
        if (messageData.senderId !== currentUser.uid) {
          // Revert optimistic update
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: messageData.content, isRecalled: false, recalledAt: null }
              : msg
          ));
          toast.error("You can only recall your own messages.");
          return;
        }

        // Check read status and time
        const isRead = messageData.readBy && messageData.readBy.includes(selectedUser.uid);
        const messageTime = messageData.createdAt;
        const currentTime = Date.now();
        const timeDiff = currentTime - messageTime;

        if (isRead && timeDiff > 3 * 60 * 1000) { // 3 minutes
          // Revert optimistic update
          setMessages(prev => prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: messageData.content, isRecalled: false, recalledAt: null }
              : msg
          ));
          toast.error("You can only recall messages within 3 minutes after they are read.");
          return;
        }

        // Update Firestore
        await updateDoc(messageRef, {
          content: "This message was recalled",
          isRecalled: true,
          recalledAt: serverTimestamp()
        });

        toast.success("Message recalled successfully.");
      }
    } catch (error) {
      console.error("Error recalling message:", error);
      // Revert optimistic update on error
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          // Try to get original content from Firestore or revert to previous state
          return { ...msg, content: msg.originalContent || msg.content, isRecalled: false, recalledAt: null };
        }
        return msg;
      }));
      toast.error("Failed to recall message.");
    }
  }, [recallMessageId, currentUser, selectedUser, createChatId]);

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
                    <ChatHeader user={selectedUser} theme={theme} onBack={() => setSelectedUser(null)} onApplyTheme={handleApplyTheme} initialTheme={chatTheme} />
                    <MessageList
                        messages={messages}
                        currentUser={currentUser}
                        selectedUser={selectedUser}
                        theme={theme}
                        chatTheme={chatTheme}
                        onReaction={handleReaction}
                        onReply={handleReply}
                        onRecallMessage={handleRecallMessage}
                    />
                    <MessageInput
                        messageText={messageText}
                        onMessageChange={setMessageText}
                        onSendMessage={handleSendMessage}
                        replyMessage={replyMessage}
                        onCancelReply={() => setReplyMessage(null)}
                        theme={theme}
                        currentUser={currentUser}
                        selectedUser={selectedUser}
                    />
                </>
            ) : (
                <WelcomeScreen theme={theme} />
            )}
        </div>

        {/* Recall Confirmation Modal */}
        {showRecallModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Thu hồi tin nhắn
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Bạn có muốn thu hồi tin nhắn này không?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRecallModal(false);
                    setRecallMessageId(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmRecallMessage}
                  className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
                >
                  Thu hồi
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Messenger;