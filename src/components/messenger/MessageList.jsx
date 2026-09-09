import React, { useEffect, useRef, useState, useContext } from "react";
import UserAvatar from "./UserAvatar";
import { FaFile, FaHeart, FaReply, FaUndo } from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import "../../style/MessageList.css";

// Danh sách icon reaction cơ bản
const REACTIONS = [
  { type: "like", emoji: "👍", label: "Thích" },
  { type: "heart", emoji: "❤️", label: "Yêu thích" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Buồn" },
  { type: "angry", emoji: "😡", label: "Giận" },
];

const MessageList = ({ messages, currentUser, selectedUser, theme, chatTheme, onReaction, onReply, onRecallMessage, chatConfig }) => {
  const { t } = useContext(LanguageContext);
  const isLight = theme === "light";
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevUserRef = useRef(selectedUser?.uid);

  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [openPickerFor, setOpenPickerFor] = useState(null); // messageId đang mở picker
  const pickerRef = useRef(null);

  const getUserName = (uid) => {
    if (uid === currentUser?.uid) {
      return chatConfig?.nicknames?.[currentUser.uid] || t("you") || "Bạn";
    }
    return chatConfig?.nicknames?.[selectedUser?.uid] || `${selectedUser?.firstName} ${selectedUser?.lastName}`;
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom < 120;
  };

  // Cuộn ngay xuống cuối khi chuyển bạn bè trò chuyện
  useEffect(() => {
    if (prevUserRef.current !== selectedUser?.uid) {
      prevUserRef.current = selectedUser?.uid;
      isNearBottomRef.current = true;
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [selectedUser?.uid]);

  // Tự động cuộn xuống khi có tin nhắn mới nếu đang ở đáy hoặc tin nhắn do chính mình gửi
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const isOwnLastMessage = lastMsg?.senderId === currentUser?.uid;

    if (isNearBottomRef.current || isOwnLastMessage) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, currentUser?.uid]);

  // đóng picker khi click ra ngoài
  useEffect(() => {
    if (!openPickerFor) return;

    const onDown = (e) => {
      // nếu click bên trong picker thì không đóng
      if (pickerRef.current && pickerRef.current.contains(e.target)) return;
      // nếu click vào nút toggle thả cảm xúc thì để button tự xử lý
      if (e.target.closest?.(`[data-reaction-btn="${openPickerFor}"]`)) return;
      setOpenPickerFor(null);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [openPickerFor]);

  if (!selectedUser) return null;

  const getMediaCategory = (url) => {
    if (!url) return "unknown";
    if (/\.(jpg|jpeg|png|gif|webp)/i.test(url)) return "image";
    if (/\.(mp3|wav|m4a|aac|ogg)/i.test(url)) return "audio";
    if (/\.(mp4|webm|avi|mov)/i.test(url)) return "video";
    if (/\.(pdf|doc|docx|xls|xlsx|txt)/i.test(url)) return "document";
    return "unknown";
  };

  const handleReactionClick = (messageId, type) => {
    // Gọi lên component cha để update Firestore
    onReaction(messageId, type);
  };

  const getEmojiByType = (type) => {
    return REACTIONS.find((r) => r.type === type)?.emoji || "❤️";
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`message-list-container ${isLight ? "light" : "dark"}`}
      style={{ backgroundColor: chatTheme.backgroundColor }}
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUser?.uid;
        const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;

        return (
          <div key={message.id} className={`message-group ${isOwnMessage ? "sent" : "received"}`}>
            {!isOwnMessage && (
              <div className="message-avatar">
                {showAvatar && <UserAvatar user={selectedUser} size={32} />}
              </div>
            )}

            <div
              className={`message-bubble ${isOwnMessage ? "sent" : "received"} ${isLight ? "light" : "dark"} ${message.isRecalled ? "recalled" : ""}`}
              style={message.isRecalled ?
                { backgroundColor: 'rgba(128, 128, 128, 0.3)', color: '#666' } :
                (isOwnMessage ? { backgroundColor: chatTheme.messageColor, color: '#fff' } : undefined)
              }
              onMouseEnter={() => !message.isRecalled && setHoveredMessage(message.id)}
              onMouseLeave={() => {
                setHoveredMessage(null);
              }}
              onClick={() => {
                if (window.innerWidth <= 768 && !message.isRecalled) {
                  setHoveredMessage((prev) => (prev === message.id ? null : message.id));
                }
              }}
            >
              {message.mediaFiles && message.mediaFiles.length > 0 && (
                <div className="message-media-files mb-2">
                  {message.mediaFiles.map((file, idx) => {
                    const category = file.category || getMediaCategory(file.url);
                    return (
                      <div key={idx} className="message-media-item">
                        {category === "image" && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="message-image-link"
                            onClick={(e) => e.stopPropagation()}
                            title="Xem ảnh đầy đủ"
                          >
                            <img
                              src={file.url}
                              alt="Attached"
                              className="message-image"
                              loading="lazy"
                            />
                          </a>
                        )}
                        {category === "audio" && (
                          <div className="message-audio-wrap mt-1 mb-1">
                            <audio src={file.url} controls className="message-audio" style={{ maxWidth: "240px", borderRadius: "12px" }} />
                          </div>
                        )}
                        {category === "video" && (
                          <video src={file.url} controls className="message-video" />
                        )}
                        {category === "document" && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="message-document"
                          >
                            <FaFile size={20} />
                            <span>{file.originalName || "Document"}</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {message.replyTo && (() => {
                const repliedMessage = messages.find(m => m.id === message.replyTo);
                const senderName = repliedMessage ? getUserName(repliedMessage.senderId) : "...";
                return (
                  <div className="reply-indicator mb-1" style={{ fontSize: "0.78rem", borderLeft: "2px solid rgba(255,255,255,0.3)", paddingLeft: "6px", marginBottom: "4px" }}>
                    <span className="opacity-75">
                      {t("replyingTo") || "Trả lời"} <strong>{senderName}</strong>: {repliedMessage ? (repliedMessage.isRecalled ? (t("messageRecalled") || "tin nhắn đã thu hồi") : repliedMessage.content) : (t("messageRecalled") || "tin nhắn đã thu hồi")}
                    </span>
                  </div>
                );
              })()}
              {message.content && <div className="message-content mb-1">{message.content}</div>}

              <div className="message-time">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {isOwnMessage && (
                  <span className="read-status" title={message.readBy && message.readBy.includes(selectedUser.uid) ? "Đã xem" : "Chưa xem"}>
                    {message.readBy && message.readBy.includes(selectedUser.uid) ? "✓✓" : "✓"}
                  </span>
                )}
              </div>

              {/* Actions */}
              {(hoveredMessage === message.id || openPickerFor === message.id) && !message.isRecalled && (
                <div className={`message-actions ${isOwnMessage ? "sent" : "received"} ${openPickerFor === message.id ? "is-active" : ""}`}>
                  <div className="reaction-trigger-wrap">
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary reaction-trigger-btn ${openPickerFor === message.id ? "active" : ""}`}
                      data-reaction-btn={message.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenPickerFor((prev) => (prev === message.id ? null : message.id));
                      }}
                      title="Thả cảm xúc"
                    >
                      <FaHeart size={13} />
                    </button>

                    {/* Reaction picker (floating toolbar directly below heart icon) */}
                    {openPickerFor === message.id && (
                      <div
                        ref={pickerRef}
                        className={`reaction-picker popup-below ${isLight ? "light" : "dark"} ${isOwnMessage ? "sent" : "received"}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {REACTIONS.map((r) => {
                          const isMyReaction = Array.isArray(message.reactions) && message.reactions.some(
                            (rx) => rx.userId === currentUser?.uid && rx.type === r.type
                          );
                          return (
                            <button
                              key={r.type}
                              type="button"
                              className={isMyReaction ? "active" : ""}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleReactionClick(message.id, r.type);
                                setOpenPickerFor(null);
                              }}
                              title={r.label}
                              aria-label={r.label}
                            >
                              {r.emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onReply(message);
                    }}
                    title="Trả lời"
                  >
                    <FaReply size={13} />
                  </button>

                  {isOwnMessage && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRecallMessage(message.id);
                      }}
                      title="Thu hồi tin nhắn"
                    >
                      <FaUndo size={13} />
                    </button>
                  )}
                </div>
              )}

              {/* Display reactions */}
              {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                <div
                  className={`message-reactions-badge ${isOwnMessage ? "sent" : "received"} ${
                    message.reactions.some((rx) => rx.userId === currentUser?.uid) ? "has-my-reaction" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenPickerFor((prev) => (prev === message.id ? null : message.id));
                  }}
                  title={message.reactions
                    .map((r) => `${r.userId === currentUser?.uid ? (t("you") || "Bạn") : getUserName(r.userId)}: ${r.type}`)
                    .join("\n")}
                >
                  {Array.from(new Set(message.reactions.map((r) => r.type))).map((type) => (
                    <span key={type} className="reaction-badge-emoji">
                      {getEmojiByType(type)}
                    </span>
                  ))}
                  {message.reactions.length > 1 && (
                    <span className="reaction-badge-count">{message.reactions.length}</span>
                  )}
                </div>
              )}
            </div>

            {isOwnMessage && (
              <div className="message-avatar">
                {showAvatar && <UserAvatar user={currentUser} size={32} />}
              </div>
            )}
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
