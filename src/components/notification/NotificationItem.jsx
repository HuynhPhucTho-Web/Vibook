import React, { useState } from "react";
import { FaCheckCircle, FaHeart, FaThumbsUp, FaCommentDots, FaUserPlus, FaEnvelope, FaNewspaper, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UserAvatar = React.memo(({ src, alt, size = 40 }) => {
  const [imageError, setImageError] = useState(false);

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

  if (src && !imageError && !src.includes('via.placeholder.com')) {
    return (
      <img
        src={src}
        alt={alt}
        className="rounded-circle"
        style={{ width: `${size}px`, height: `${size}px`, objectFit: "cover" }}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className="rounded-circle" style={avatarStyle}>
      {alt?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
});

const NotificationItem = ({ notification, onMarkAsRead, onDelete, formatTimeAgo }) => {
  const navigate = useNavigate();

  const handleItemClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    switch (notification.type) {
      case "friend_request":
        navigate("/friends");
        break;
      case "friend_message":
        navigate("/messenger");
        break;
      case "new_blog":
        if (notification.blogSlug) navigate(`/blog/${notification.blogSlug}`);
        else navigate("/blog");
        break;
      case "friend_post":
      case "post_reaction":
      case "post_like":
      case "post_comment":
      case "comment_reply":
      case "comment_reaction":
      default:
        if (notification.postId) navigate(`/post/${notification.postId}`);
        break;
    }
  };

  const getReactionBadge = () => {
    // Lấy tên reaction từ field hoặc dò từ nội dung
    let r = (notification.reaction || "").toLowerCase();
    if (!r && notification.content) {
      const c = notification.content.toLowerCase();
      if (c.includes("yêu thích") || c.includes("❤️") || c.includes("love")) r = "love";
      else if (c.includes("haha") || c.includes("😂")) r = "haha";
      else if (c.includes("wow") || c.includes("😮")) r = "wow";
      else if (c.includes("buồn") || c.includes("😢") || c.includes("sad")) r = "sad";
      else if (c.includes("phẫn nộ") || c.includes("😠") || c.includes("angry")) r = "angry";
      else if (c.includes("thích") || c.includes("👍") || c.includes("like")) r = "like";
    }

    switch (r) {
      case "love":
        return (
          <span
            className="position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 20, height: 20, fontSize: 10, backgroundColor: "#f02849", color: "#fff", transform: "translate(20%, 20%)" }}
            title="Yêu thích"
          >
            <FaHeart />
          </span>
        );
      case "haha":
        return (
          <span
            className="position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center"
            style={{ width: 20, height: 20, fontSize: 13, transform: "translate(20%, 20%)", lineHeight: 1 }}
            title="Haha"
          >
            😂
          </span>
        );
      case "wow":
        return (
          <span
            className="position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center"
            style={{ width: 20, height: 20, fontSize: 13, transform: "translate(20%, 20%)", lineHeight: 1 }}
            title="Wow"
          >
            😮
          </span>
        );
      case "sad":
        return (
          <span
            className="position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center"
            style={{ width: 20, height: 20, fontSize: 13, transform: "translate(20%, 20%)", lineHeight: 1 }}
            title="Buồn"
          >
            😢
          </span>
        );
      case "angry":
        return (
          <span
            className="position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center"
            style={{ width: 20, height: 20, fontSize: 13, transform: "translate(20%, 20%)", lineHeight: 1 }}
            title="Phẫn nộ"
          >
            😠
          </span>
        );
      case "like":
      default:
        return (
          <span
            className="position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 20, height: 20, fontSize: 10, backgroundColor: "#1877f2", color: "#fff", transform: "translate(20%, 20%)" }}
            title="Thích"
          >
            <FaThumbsUp />
          </span>
        );
    }
  };

  const renderBadge = () => {
    switch (notification.type) {
      case "post_reaction":
      case "post_like":
      case "comment_reaction":
        return getReactionBadge();
      case "post_comment":
      case "comment_reply":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 20, height: 20, fontSize: 10, transform: "translate(20%, 20%)" }}
            title="Bình luận"
          >
            <FaCommentDots />
          </span>
        );
      case "friend_request":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 20, height: 20, fontSize: 10, transform: "translate(20%, 20%)" }}
            title="Kết bạn"
          >
            <FaUserPlus />
          </span>
        );
      case "friend_message":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-info text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 20, height: 20, fontSize: 10, transform: "translate(20%, 20%)" }}
            title="Tin nhắn"
          >
            <FaEnvelope />
          </span>
        );
      case "new_blog":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 20, height: 20, fontSize: 10, transform: "translate(20%, 20%)" }}
            title="Blog"
          >
            <FaNewspaper />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={handleItemClick}
      className={`vb-glass d-flex align-items-center p-3 rounded-xl transition-all ${
        notification.read
          ? "opacity-80"
          : "border-purple-500/40 bg-purple-500/5 shadow-sm"
      }`}
      style={{
        border: "1px solid var(--vb-glass-border, rgba(255, 255, 255, 0.12))",
        borderRadius: "12px",
        cursor: "pointer"
      }}
    >
      <div className="position-relative flex-shrink-0">
        <UserAvatar
          src={notification.actorPhoto}
          alt={notification.actorName}
          size={42}
        />
        {renderBadge()}
      </div>
      <div className="flex-grow-1 ms-3 min-w-0">
        <p className="mb-0 text-inherit" style={{
          fontSize: "0.9rem",
          fontWeight: notification.read ? "normal" : "600",
          wordBreak: "break-word"
        }}>
          {notification.content}
        </p>
        <small className="text-muted block mt-1 opacity-75">
          {formatTimeAgo(notification.createdAt)}
        </small>
      </div>
      <div className="d-flex align-items-center gap-1 ms-2 flex-shrink-0">
        {!notification.read && (
          <button
            className="btn btn-link text-primary p-1"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Đánh dấu đã đọc"
            style={{ fontSize: '14px' }}
          >
            <FaCheckCircle />
          </button>
        )}
        <button
          className="btn btn-link text-danger p-1 opacity-50 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(notification.id);
          }}
          title="Xóa thông báo"
          style={{ fontSize: '13px' }}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
