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
import { ThemeContext } from "../contexts/ThemeContext";
import { FaPaperPlane } from "react-icons/fa";

const Messenger = () => {
  const { theme } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Refs để tránh re-subscription không cần thiết
  const unsubscribeRefs = useRef({});
  const messagesEndRef = useRef(null);
  const lastChatId = useRef(null);

  // Memoized function tạo chatId
  const createChatId = useCallback((uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  }, []);

  // Memoized format time
  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "";
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString("vi-VN", { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') unsubscribe();
    });
    unsubscribeRefs.current = {};
  }, []);

  // Auth listener - chỉ setup một lần
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

  // Load users - chỉ load một lần và cache
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
          }))
          .filter((u) => u.uid !== currentUser.uid);
        
        setUsers(userList);
        
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Không thể tải danh sách người dùng", { 
          position: "top-center",
          autoClose: 3000 
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [currentUser]);

  // Messages listener - tối ưu hóa
  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    
    // Tránh re-subscribe cho cùng một chat
    if (lastChatId.current === chatId && messages.length > 0) return;
    
    setIsLoadingMessages(true);
    lastChatId.current = chatId;

    // Cleanup previous messages listener
    if (unsubscribeRefs.current.messages) {
      unsubscribeRefs.current.messages();
    }

    const messagesQuery = query(
      collection(db, "Messages", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(50) // Giảm xuống 50 messages
    );
    
    unsubscribeRefs.current.messages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList = snapshot.docs.map((doc) => ({
          id: doc.id,
          senderId: doc.data().senderId,
          receiverId: doc.data().receiverId,
          content: doc.data().content,
          createdAt: doc.data().createdAt,
        }));
        
        setMessages(messageList);
        setIsLoadingMessages(false);
        
        // Auto scroll to bottom - debounced
        if (messageList.length > 0) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
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
  }, [currentUser, selectedUser, createChatId]);

  // Optimized send message
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const messageContent = messageText.trim();
    
    // Clear input immediately for better UX
    setMessageText("");

    try {
      await addDoc(collection(db, "Messages", chatId, "messages"), {
        senderId: currentUser.uid,
        receiverId: selectedUser.uid,
        content: messageContent,
        createdAt: Date.now(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error sending message:`, error);
      // Restore message text on error
      setMessageText(messageContent);
      toast.error("Không thể gửi tin nhắn", { 
        position: "top-center",
        autoClose: 3000 
      });
    }
  }, [messageText, selectedUser, currentUser, createChatId]);

  // Memoized user selection handler
  const handleUserSelect = useCallback((user) => {
    if (selectedUser?.uid === user.uid) return; // Tránh re-select
    setSelectedUser(user);
    setMessages([]); // Clear messages ngay lập tức
    lastChatId.current = null; // Reset chatId
  }, [selectedUser]);

  // Component cho avatar
  const UserAvatar = React.memo(({ user, size = 40 }) => {
    const [imageError, setImageError] = useState(false);
    
    const getInitials = (firstName, lastName) => {
      const first = firstName?.charAt(0)?.toUpperCase() || '';
      const last = lastName?.charAt(0)?.toUpperCase() || '';
      return first + last || '?';
    };

    const avatarStyle = {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: '#6c757d',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.4}px`,
      fontWeight: 'bold',
    };

    if (user.photo && !imageError) {
      return (
        <img
          src={user.photo}
          alt={user.firstName}
          className="rounded-circle"
          style={{ width: `${size}px`, height: `${size}px`, objectFit: "cover" }}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <div className="rounded-circle" style={avatarStyle}>
        {getInitials(user.firstName, user.lastName)}
      </div>
    );
  });

  // Memoized users list
  const usersList = useMemo(() => 
    users.map((user) => (
      <button
        key={user.uid}
        className={`list-group-item list-group-item-action ${
          selectedUser?.uid === user.uid ? "active" : ""
        }`}
        onClick={() => handleUserSelect(user)}
      >
        <div className="d-flex align-items-center">
          <div className="me-2">
            <UserAvatar user={user} size={40} />
          </div>
          <div className="text-start">
            <div className="fw-bold text-truncate" style={{ maxWidth: "150px" }}>
              {user.firstName} {user.lastName}
            </div>
            <small className="text-muted text-truncate d-block" style={{ maxWidth: "150px" }}>
              {user.email}
            </small>
          </div>
        </div>
      </button>
    )), [users, selectedUser, handleUserSelect]);

  // Memoized messages list
  const messagesList = useMemo(() => 
    messages.map((message) => {
      const isOwnMessage = message.senderId === currentUser?.uid;
      return (
        <div
          key={message.id}
          className={`d-flex mb-2 ${
            isOwnMessage ? "justify-content-end" : "justify-content-start"
          }`}
        >
          <div
            className={`p-2 rounded-3 ${
              isOwnMessage 
                ? "bg-primary text-white ms-auto" 
                : "bg-light text-dark me-auto"
            }`}
            style={{ 
              maxWidth: "70%", 
              wordBreak: "break-word",
              borderRadius: isOwnMessage ? "18px 18px 4px 18px" : "18px 18px 18px 4px"
            }}
          >
            <div className="mb-1">{message.content}</div>
            <small 
              className={`${isOwnMessage ? "text-white-50" : "text-muted"}`}
              style={{ fontSize: "0.7rem" }}
            >
              {formatTimeAgo(message.createdAt)}
            </small>
          </div>
        </div>
      );
    }), [messages, currentUser, formatTimeAgo]);

  // Loading states
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`container py-4 ${theme}`}>
        <h5 className="text-muted text-center">Vui lòng đăng nhập để nhắn tin</h5>
      </div>
    );
  }

  return (
    <div className={`container-fluid py-4 ${theme}`} style={{ minHeight: "80vh" }}>
      <div className="row h-100">
        {/* Sidebar - Danh sách users */}
        <div className="col-md-4 col-lg-3 border-end">
          <h4 className="mb-3">Người dùng ({users.length})</h4>
          {users.length > 0 ? (
            <div className="list-group" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {usersList}
            </div>
          ) : (
            <div className="text-center p-3">
              <p className="text-muted">Không có người dùng nào khác</p>
            </div>
          )}
        </div>

        {/* Main chat area */}
        <div className="col-md-8 col-lg-9 d-flex flex-column">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="border-bottom pb-2 mb-3">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <UserAvatar user={selectedUser} size={50} />
                  </div>
                  <div>
                    <h4 className="mb-0">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <small className="text-muted">{selectedUser.email}</small>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div 
                className="flex-grow-1 overflow-auto mb-3 p-2" 
                style={{ maxHeight: "60vh", minHeight: "300px" }}
              >
                {isLoadingMessages ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading messages...</span>
                    </div>
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messagesList}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                )}
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="d-flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="form-control rounded-pill"
                  autoComplete="off"
                  maxLength={500}
                />
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-3"
                  disabled={!messageText.trim()}
                  style={{ minWidth: "50px" }}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-5">
              <div className="text-muted">
                <h5>Chọn một người dùng để bắt đầu trò chuyện</h5>
                <p>Danh sách người dùng hiển thị bên trái</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;