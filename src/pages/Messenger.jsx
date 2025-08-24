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
import {
  FaPaperPlane,
  FaPhone,
  FaVideo,
  FaSmile,
  FaPaperclip,
  FaSearch,
  FaEllipsisV,
  FaUserCircle,
  FaTimes,
  FaMicrophone,
  FaHeart,
  FaThumbsUp,
  FaLaugh,
  FaSadTear,
  FaAngry
} from "react-icons/fa";

const Messenger = () => {
  const { theme } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Refs để tránh re-subscription không cần thiết
  const unsubscribeRefs = useRef({});
  const messagesEndRef = useRef(null);
  const lastChatId = useRef(null);

  // Emoji reactions
  const quickEmojis = ['😀', '😂', '😍', '🤔', '👍', '👋', '🎉', '❤️'];

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
            isOnline: Math.random() > 0.5, // Mock online status
            lastSeen: Date.now() - Math.random() * 3600000,
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
      limit(50)
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

  // Handle emoji click
  const handleEmojiClick = useCallback((emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Optimized send message
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    const chatId = createChatId(currentUser.uid, selectedUser.uid);
    const messageContent = messageText.trim();

    // Clear input immediately for better UX
    setMessageText("");
    setShowEmojiPicker(false);

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
    if (selectedUser?.uid === user.uid) return;
    setSelectedUser(user);
    setMessages([]);
    lastChatId.current = null;
    setShowEmojiPicker(false);
  }, [selectedUser]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Component cho avatar với online status
  const UserAvatar = React.memo(({ user, size = 40, showOnline = false }) => {
    const [imageError, setImageError] = useState(false);

    const getInitials = (firstName, lastName) => {
      const first = firstName?.charAt(0)?.toUpperCase() || '';
      const last = lastName?.charAt(0)?.toUpperCase() || '';
      return first + last || '?';
    };

    const avatarStyle = {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: '#0d6efd',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.35}px`,
      fontWeight: '600',
    };

    return (
      <div className="position-relative">
        {user.photo && !imageError ? (
          <img
            src={user.photo}
            alt={user.firstName}
            className="rounded-circle border"
            style={{ width: `${size}px`, height: `${size}px`, objectFit: "cover" }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="rounded-circle shadow-sm" style={avatarStyle}>
            {getInitials(user.firstName, user.lastName)}
          </div>
        )}
        {showOnline && user.isOnline && (
          <span
            className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
            style={{ width: '12px', height: '12px' }}
          ></span>
        )}
      </div>
    );
  });

  // Memoized users list với design mới
  const usersList = useMemo(() =>
    filteredUsers.map((user) => (
      <div
        key={user.uid}
        className={`p-3 border-bottom user-item ${selectedUser?.uid === user.uid ? "bg-primary bg-opacity-10 border-primary" : ""
          }`}
        onClick={() => handleUserSelect(user)}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderLeft: selectedUser?.uid === user.uid ? '3px solid #0d6efd' : '3px solid transparent'
        }}
      >
        <div className="d-flex align-items-center">
          <div className="me-3">
            <UserAvatar user={user} size={46} showOnline={true} />
          </div>
          <div className="flex-grow-1 text-start">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-semibold text-truncate mb-1" style={{ maxWidth: "140px", fontSize: '0.95rem' }}>
                  {user.firstName} {user.lastName}
                </div>
                <small className="text-muted text-truncate d-block" style={{ maxWidth: "140px", fontSize: '0.8rem' }}>
                  {user.isOnline ? (
                    <span className="text-success">
                      <i className="fas fa-circle" style={{ fontSize: '8px' }}></i> Đang hoạt động
                    </span>
                  ) : (
                    `Hoạt động ${formatTimeAgo(user.lastSeen)}`
                  )}
                </small>
              </div>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {formatTimeAgo(Date.now() - Math.random() * 86400000)}
              </small>
            </div>
          </div>
        </div>
      </div>
    )), [filteredUsers, selectedUser, handleUserSelect, formatTimeAgo]);

  // Memoized messages list với design mới
  const messagesList = useMemo(() =>
    messages.map((message, index) => {
      const isOwnMessage = message.senderId === currentUser?.uid;
      const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;

      return (
        <div
          key={message.id}
          className={`d-flex mb-3 ${isOwnMessage ? "justify-content-end" : "justify-content-start"
            }`}
        >
          {!isOwnMessage && showAvatar && (
            <div className="me-2 align-self-end">
              <UserAvatar user={selectedUser} size={32} />
            </div>
          )}
          {!isOwnMessage && !showAvatar && (
            <div style={{ width: '40px' }}></div>
          )}

          <div
            className={`position-relative shadow-sm ${isOwnMessage
                ? "bg-primary text-white"
                : "bg-light text-dark border"
              }`}
            style={{
              maxWidth: "75%",
              wordBreak: "break-word",
              borderRadius: isOwnMessage ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
              padding: '12px 16px',
              fontSize: '0.9rem',
              lineHeight: '1.4'
            }}
          >
            <div className="message-content mb-1">{message.content}</div>
            <div
              className={`d-flex align-items-center justify-content-end mt-2 ${isOwnMessage ? "text-white-50" : "text-muted"
                }`}
              style={{ fontSize: "0.7rem" }}
            >
              <span>{formatTimeAgo(message.createdAt)}</span>
              {isOwnMessage && (
                <span className="ms-1">
                  <i className="fas fa-check-double"></i>
                </span>
              )}
            </div>
          </div>

          {isOwnMessage && showAvatar && (
            <div className="ms-2 align-self-end">
              <UserAvatar user={{
                firstName: currentUser.displayName?.split(' ')[0] || 'You',
                lastName: currentUser.displayName?.split(' ')[1] || '',
                photo: currentUser.photoURL
              }} size={32} />
            </div>
          )}
          {isOwnMessage && !showAvatar && (
            <div style={{ width: '40px' }}></div>
          )}
        </div>
      );
    }), [messages, currentUser, selectedUser, formatTimeAgo]);

  // Loading states
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`container py-5 text-center ${theme}`}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <FaUserCircle size={80} className="text-muted mb-3" />
            <h4 className="text-muted mb-3">Chưa đăng nhập</h4>
            <p className="text-muted">Vui lòng đăng nhập để sử dụng tính năng nhắn tin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme}`} style={{ height: "100vh", overflow: "hidden" }}>
      <div className="row g-0 h-100">
        {/* Sidebar - Danh sách users */}
        <div className="col-md-4 col-lg-3 border-end bg-white" style={{ height: "100vh", overflowY: "auto" }}>
          {/* Header sidebar */}
          <div className="p-3 border-bottom bg-light">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold text-primary">Tin nhắn</h5>
              <span className="badge bg-primary rounded-pill">{users.length}</span>
            </div>

            {/* Search bar */}
            <div className="position-relative">
              <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5 rounded-pill"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Users list */}
          <div className="users-list" style={{ height: "calc(100vh - 140px)", overflowY: "auto" }}>
            {filteredUsers.length > 0 ? (
              usersList
            ) : (
              <div className="text-center p-4">
                <FaUserCircle size={50} className="text-muted mb-3" />
                <p className="text-muted mb-0">
                  {searchTerm ? "Không tìm thấy người dùng" : "Không có người dùng nào"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="col-md-8 col-lg-9 d-flex flex-column bg-white">
          {selectedUser ? (
            <>
              {/* Chat header với các action buttons */}
              <div className="border-bottom bg-white px-4 py-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <UserAvatar user={selectedUser} size={50} showOnline={true} />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-semibold">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h5>
                      <small className="text-muted">
                        {selectedUser.isOnline ? (
                          <span className="text-success">
                            <i className="fas fa-circle me-1" style={{ fontSize: '8px' }}></i>
                            Đang hoạt động
                          </span>
                        ) : (
                          `Hoạt động ${formatTimeAgo(selectedUser.lastSeen)}`
                        )}
                      </small>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm rounded-circle p-2" title="Gọi điện">
                      <FaPhone size={14} />
                    </button>
                    <button className="btn btn-outline-primary btn-sm rounded-circle p-2" title="Gọi video">
                      <FaVideo size={14} />
                    </button>
                    <button className="btn btn-outline-secondary btn-sm rounded-circle p-2" title="Tùy chọn">
                      <FaEllipsisV size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages area với background pattern */}
              <div
                className="flex-grow-1 overflow-auto px-4 py-3"
                style={{
                  maxHeight: "calc(100vh - 200px)",
                  backgroundColor: '#f8f9fa',
                  backgroundImage: `
                    radial-gradient(circle at 25px 25px, #e9ecef 2px, transparent 0),
                    radial-gradient(circle at 75px 75px, #e9ecef 2px, transparent 0)
                  `,
                  backgroundSize: '50px 50px'
                }}
              >
                {isLoadingMessages ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading messages...</span>
                    </div>
                    <p className="text-muted small mb-0">Đang tải tin nhắn...</p>
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    <div className="text-center py-3">
                      <small className="text-muted bg-white px-3 py-1 rounded-pill shadow-sm">
                        Hôm nay
                      </small>
                    </div>
                    {messagesList}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div className="bg-white rounded-4 p-4 shadow-sm mx-auto" style={{ maxWidth: '300px' }}>
                      <FaUserCircle size={60} className="text-primary mb-3" />
                      <h6 className="text-dark mb-2">Bắt đầu cuộc trò chuyện</h6>
                      <p className="text-muted small mb-0">
                        Gửi tin nhắn đầu tiên để bắt đầu trò chuyện với {selectedUser.firstName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message input area với enhanced UI */}
              <div className="bg-white border-top px-4 py-3">
                {/* Quick emoji reactions */}
                <div className="d-flex gap-1 mb-2">
                  {quickEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="btn btn-outline-light btn-sm rounded-circle p-1"
                      onClick={() => handleEmojiClick(emoji)}
                      style={{ width: '32px', height: '32px', fontSize: '14px' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="d-flex align-items-end gap-2">
                  <div className="flex-grow-1 position-relative">
                    <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 border">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="form-control border-0 bg-transparent"
                        autoComplete="off"
                        maxLength={500}
                        style={{ fontSize: '0.9rem' }}
                      />
                      <div className="d-flex gap-1 ms-2">
                        <button
                          type="button"
                          className="btn btn-sm p-1"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          title="Emoji"
                        >
                          <FaSmile className="text-muted" size={18} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm p-1"
                          title="Đính kèm"
                        >
                          <FaPaperclip className="text-muted" size={18} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm p-1"
                          title="Ghi âm"
                        >
                          <FaMicrophone className="text-muted" size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Emoji picker */}
                    {showEmojiPicker && (
                      <div className="position-absolute bottom-100 end-0 mb-2 bg-white border rounded-3 shadow-lg p-3" style={{ zIndex: 1000 }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted fw-semibold">Emoji</small>
                          <button
                            type="button"
                            className="btn btn-sm p-0"
                            onClick={() => setShowEmojiPicker(false)}
                          >
                            <FaTimes className="text-muted" size={12} />
                          </button>
                        </div>
                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '250px' }}>
                          {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'].map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              className="btn btn-sm p-1 rounded"
                              onClick={() => handleEmojiClick(emoji)}
                              style={{ width: '30px', height: '30px', fontSize: '16px' }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary rounded-circle p-3 shadow-sm"
                    disabled={!messageText.trim()}
                    style={{ width: '48px', height: '48px' }}
                  >
                    <FaPaperPlane size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 bg-light">
              <div className="text-center">
                <div className="bg-white rounded-4 p-5 shadow-sm mx-auto" style={{ maxWidth: '400px' }}>
                  <div className="text-primary mb-4">
                    <FaUserCircle size={80} />
                  </div>
                  <h4 className="text-dark mb-3">Chào mừng đến với Messenger</h4>
                  <p className="text-muted mb-4">
                    Chọn một người từ danh sách bên trái để bắt đầu cuộc trò chuyện
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <div className="text-center">
                      <div className="bg-light rounded-circle p-3 mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <FaPhone className="text-primary" size={20} />
                      </div>
                      <small className="text-muted">Gọi điện</small>
                    </div>
                    <div className="text-center">
                      <div className="bg-light rounded-circle p-3 mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <FaVideo className="text-primary" size={20} />
                      </div>
                      <small className="text-muted">Video call</small>
                    </div>
                    <div className="text-center">
                      <div className="bg-light rounded-circle p-3 mb-2 mx-auto" style={{ width: '50px', height: '50px' }}>
                        <FaPaperPlane className="text-primary" size={20} />
                      </div>
                      <small className="text-muted">Nhắn tin</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messenger;