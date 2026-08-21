                                                                                                                             import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  setDoc,
  orderBy,
  serverTimestamp,
  limit,
  where,
  doc,
  getDoc,
  getDocs,
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

const getDefaultChatTheme = (theme) =>
  theme === "dark"
    ? { backgroundColor: "#0e1116", messageColor: "#8e54e9" }
    : { backgroundColor: "#eef0f5", messageColor: "#0d6efd" };

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
  const [chatTheme, setChatTheme] = useState(() => getDefaultChatTheme(theme));
  const chatThemeCustomizedRef = useRef(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [recallMessageId, setRecallMessageId] = useState(null);

  // Sync settings with Firestore Messages/{chatId} configuration doc
  const [chatConfig, setChatConfig] = useState(null);
  // Real-time metadata maps for sidebar display
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [allChatConfigs, setAllChatConfigs] = useState({});

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
      setChatConfig(null);
      return;
    }

    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const configRef = doc(db, "Messages", chatId);

    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setChatConfig(data);
        if (data.theme) {
          setChatTheme(data.theme);
          chatThemeCustomizedRef.current = true;
        } else {
          setChatTheme(getDefaultChatTheme(theme));
          chatThemeCustomizedRef.current = false;
        }
      } else {
        setChatConfig(null);
        setChatTheme(getDefaultChatTheme(theme));
        chatThemeCustomizedRef.current = false;
      }
    }, (error) => {
      console.error("Error listening to chat config:", error);
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser, theme, createChatId]);

  // Listen to last messages, unread counts, and configurations for all sidebar users in real-time
  useEffect(() => {
    if (!currentUser || users.length === 0) {
      setLastMessages({});
      setUnreadCounts({});
      setAllChatConfigs({});
      return;
    }

    const unsubscribes = [];

    users.forEach((friend) => {
      const chatId = createChatId(currentUser.uid, friend.uid);
      const messagesRef = collection(db, "Messages", chatId, "messages");
      const configRef = doc(db, "Messages", chatId);

      // 1. Last message listener
      const lastMsgQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(1));
      const unsubLastMsg = onSnapshot(lastMsgQuery, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setLastMessages(prev => ({
            ...prev,
            [friend.uid]: {
              id: docSnap.id,
              ...docSnap.data()
            }
          }));
        } else {
          setLastMessages(prev => {
            const next = { ...prev };
            delete next[friend.uid];
            return next;
          });
        }
      }, (err) => {
        console.error("Error fetching last message for", friend.uid, err);
      });
      unsubscribes.push(unsubLastMsg);

      // 2. Unread messages listener (messages sent to currentUser which currentUser has not read)
      const unreadQuery = query(
        messagesRef,
        where("receiverId", "==", currentUser.uid)
      );
      const unsubUnread = onSnapshot(unreadQuery, (snapshot) => {
        const unreadCount = snapshot.docs.filter(docSnap => {
          const data = docSnap.data();
          return !data.readBy || !data.readBy.includes(currentUser.uid);
        }).length;
        
        setUnreadCounts(prev => ({
          ...prev,
          [friend.uid]: unreadCount
        }));
      }, (err) => {
        console.error("Error fetching unread count for", friend.uid, err);
      });
      unsubscribes.push(unsubUnread);

      // 3. Configuration listener for nicknames, mute/block state sync
      const unsubConfig = onSnapshot(configRef, (snapshot) => {
        if (snapshot.exists()) {
          setAllChatConfigs(prev => ({
            ...prev,
            [friend.uid]: snapshot.data()
          }));
        } else {
          setAllChatConfigs(prev => {
            const next = { ...prev };
            delete next[friend.uid];
            return next;
          });
        }
      }, (err) => {
        console.error("Error fetching config for friend", friend.uid, err);
      });
      unsubscribes.push(unsubConfig);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, users, createChatId]);

  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setMessages([]);
      return;
    }

    const chatId = createChatId(currentUser.uid, selectedUser.uid);

    // Mark ALL older unread messages from selectedUser in this chat as read to clean header badge
    const messagesRef = collection(db, "Messages", chatId, "messages");
    const unreadQuery = query(
      messagesRef,
      where("senderId", "==", selectedUser.uid)
    );
    getDocs(unreadQuery).then((unreadSnapshot) => {
      const docsToUpdate = unreadSnapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        return !data.readBy || !data.readBy.includes(currentUser.uid);
      });
      if (docsToUpdate.length > 0) {
        const updatePromises = docsToUpdate.map(docSnap =>
          updateDoc(doc(db, "Messages", chatId, "messages", docSnap.id), {
            readBy: [...(docSnap.data().readBy || []), currentUser.uid]
          })
        );
        return Promise.all(updatePromises);
      }
    }).catch(err => {
      console.error("Error marking all messages as read on select:", err);
    });

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
          Promise.all(updatePromises).catch(err => {
            console.error("Error marking messages as read in Firestore:", err);
          });
        }

        // Mark corresponding notifications as read in background to clear header notifications badge
        const notificationsQuery = query(
          collection(db, "Notifications"),
          where("userId", "==", currentUser.uid),
          where("type", "==", "friend_message"),
          where("actorId", "==", selectedUser.uid),
          where("read", "==", false)
        );
        getDocs(notificationsQuery).then((notifSnapshot) => {
          if (!notifSnapshot.empty) {
            const notifPromises = notifSnapshot.docs.map(docSnap =>
              updateDoc(doc(db, "Notifications", docSnap.id), { read: true })
            );
            return Promise.all(notifPromises);
          }
        }).catch(err => {
          console.error("Error marking message notifications as read:", err);
        });

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
    let result = users;
    if (searchTerm) {
      result = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by last message creation time descending, so newest active chats are at the top
    return [...result].sort((a, b) => {
      const timeA = lastMessages[a.uid]?.createdAt || 0;
      const timeB = lastMessages[b.uid]?.createdAt || 0;
      return timeB - timeA;
    });
  }, [users, searchTerm, lastMessages]);

  const handleReaction = useCallback(async (messageId, reactionType) => {
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const messageRef = doc(db, "Messages", chatId, "messages", messageId);

    try {
      const messageSnap = await getDoc(messageRef);
      if (messageSnap.exists()) {
        const messageData = messageSnap.data();
        const reactions = messageData.reactions || [];
        const existingReactionIndex = reactions.findIndex(r => r.userId === currentUser.uid);

        if (existingReactionIndex >= 0) {
          const currentReaction = reactions[existingReactionIndex];
          if (currentReaction.type === reactionType) {
            // Toggle off if already reacted with the exact same emoji
            reactions.splice(existingReactionIndex, 1);
          } else {
            // Update to the new emoji
            reactions[existingReactionIndex].type = reactionType;
          }
        } else {
          // Push new reaction object
          reactions.push({ userId: currentUser.uid, type: reactionType });
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

  const handleUpdateChatConfig = useCallback(async (updates) => {
    if (!currentUser || !selectedUser) return;
    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const configRef = doc(db, "Messages", chatId);

    try {
      const docSnap = await getDoc(configRef);
      if (!docSnap.exists()) {
        await setDoc(configRef, { ...updates }, { merge: true });
      } else {
        await updateDoc(configRef, updates);
      }
    } catch (error) {
      console.error("Error updating chat config:", error);
      toast.error("Failed to save chat settings.");
    }
  }, [currentUser, selectedUser, createChatId]);

  const handleApplyTheme = useCallback((newTheme) => {
    chatThemeCustomizedRef.current = true;
    setChatTheme(newTheme);
    handleUpdateChatConfig({ theme: newTheme });
  }, [handleUpdateChatConfig]);

  // Re-sync chat theme to the app theme default when the theme changes,
  // unless the user has explicitly applied a custom chat theme.
  useEffect(() => {
    if (chatThemeCustomizedRef.current) return;
    setChatTheme(getDefaultChatTheme(theme));
  }, [theme]);

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
    <div className={`page-shell messenger-container ${theme}`}>
        <div className={`sidebar-container ${isChatActive ? 'chat-active' : ''}`}>
            <UserList 
                users={filteredUsers}
                selectedUser={selectedUser}
                onUserSelect={handleUserSelect}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                theme={theme}
                lastMessages={lastMessages}
                unreadCounts={unreadCounts}
                allChatConfigs={allChatConfigs}
            />
        </div>
        <div className={`chat-container ${isChatActive ? 'chat-active' : ''}`}>
            {selectedUser ? (
                <>
                    <ChatHeader
                        user={selectedUser}
                        theme={theme}
                        onBack={() => setSelectedUser(null)}
                        onApplyTheme={handleApplyTheme}
                        initialTheme={chatTheme}
                        chatConfig={chatConfig}
                        onUpdateChatConfig={handleUpdateChatConfig}
                        currentUser={currentUser}
                    />
                    <MessageList
                        messages={messages}
                        currentUser={currentUser}
                        selectedUser={selectedUser}
                        theme={theme}
                        chatTheme={chatTheme}
                        onReaction={handleReaction}
                        onReply={handleReply}
                        onRecallMessage={handleRecallMessage}
                        chatConfig={chatConfig}
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
                        chatConfig={chatConfig}
                        onUpdateChatConfig={handleUpdateChatConfig}
                    />
                </>
            ) : (
                <WelcomeScreen theme={theme} />
            )}
        </div>

        {/* Recall Confirmation Modal */}
        {showRecallModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="vb-glass p-6 max-w-sm mx-4 rounded-xl text-inherit">
              <h3 className="text-lg font-semibold mb-4">
                Thu hồi tin nhắn
              </h3>
              <p className="opacity-75 mb-6">
                Bạn có muốn thu hồi tin nhắn này không?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRecallModal(false);
                    setRecallMessageId(null);
                  }}
                  className="vb-btn vb-btn--ghost vb-btn--sm"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmRecallMessage}
                  className="vb-btn vb-btn--primary vb-btn--sm bg-red-600 border-red-500 hover:bg-red-700"
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