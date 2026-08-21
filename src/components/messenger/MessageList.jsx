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
  const messagesEndRef = useRef(null);

  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [openPickerFor, setOpenPickerFor] = useState(null); // messageId đang mở picker

  const getUserName = (uid) => {
    if (uid === currentUser?.uid) {
      return chatConfig?.nicknames?.[currentUser.uid] || t("you") || "Bạn";
    }
    return chatConfig?.nicknames?.[selectedUser?.uid] || `${selectedUser?.firstName} ${selectedUser?.lastName}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // đóng picker khi click ra ngoài
  useEffect(() => {
    if (!openPickerFor) return;

    const onDown = (e) => {
      // nếu click bên trong picker thì không đóng
      if (e.target.closest?.(".reaction-picker")) return;
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
    <div className={`message-list-container ${isLight ? "light" : "dark"}`} style={{ backgroundColor: chatTheme.backgroundColor }}>
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
                setOpenPickerFor(null); // rời bubble thì đóng picker luôn cho gọn
              }}
            >
              {message.mediaFiles && message.mediaFiles.length > 0 && (
                <div className="message-media-files mb-2">
                  {message.mediaFiles.map((file, idx) => {
                    const category = file.category || getMediaCategory(file.url);
                    return (
                      <div key={idx} className="message-media-item">
                        {category === "image" && (
                          <img src={file.url} alt="Attached" className="message-image" />
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
              {hoveredMessage === message.id && (
                <div className="message-actions">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenPickerFor((prev) => (prev === message.id ? null : message.id));
                    }}
                    title="Thả cảm xúc"
                  >
                    <FaHeart size={14} />
                  </button>

                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReply(message);
                    }}
                    title="Trả lời"
                  >
                    <FaReply size={14} />
                  </button>

                  {isOwnMessage && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRecallMessage(message.id);
                      }}
                      title="Thu hồi tin nhắn"
                    >
                      <FaUndo size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Reaction picker (nhiều icon) */}
              {openPickerFor === message.id && (
                <div className={`reaction-picker ${isLight ? "" : "dark"}`}>
                  {REACTIONS.map((r) => (
                    <button
                      key={r.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReactionClick(message.id, r.type);
                        setOpenPickerFor(null);
                      }}
                      title={r.label}
                      aria-label={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Display reactions (hiển thị emoji theo type) */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="message-reactions">
                  {message.reactions.map((reaction, idx) => (
                    <span key={idx} className="reaction-icon" title={reaction.type}>
                      {getEmojiByType(reaction.type)}
                    </span>
                  ))}
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
