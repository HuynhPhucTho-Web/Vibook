import React, { useState } from "react";
import {
  FaCheckCircle,
  FaHeart,
  FaCommentDots,
  FaUserPlus,
  FaEnvelope,
  FaNewspaper,
  FaTrash,
  FaGraduationCap,
  FaFileAlt,
  FaTag,
} from "react-icons/fa";
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

const NotificationItem = React.memo(({ notification, onMarkAsRead, onDelete, formatTimeAgo }) => {
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
      case "subject_quiz":
      case "quiz":
      case "subject_doc":
      case "document":
        if (notification.subjectCode) {
          const tab = notification.type === "quiz" || notification.type === "subject_quiz" ? "quiz" : "document";
          navigate(`/source/${notification.subjectCode.toLowerCase()}/${tab}`);
        } else {
          navigate("/source");
        }
        break;
      case "friend_post":
      case "post_reaction":
      case "post_like":
      case "post_comment":
      case "comment_reply":
      case "comment_reaction":
      case "post_tag":
      case "share_tag":
      default:
        if (notification.postId) navigate(`/post/${notification.postId}`);
        break;
    }
  };

  const renderBadge = () => {
    switch (notification.type) {
      case "subject_quiz":
      case "quiz":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
            title="Bài tập / Quiz"
          >
            <FaGraduationCap />
          </span>
        );
      case "subject_doc":
      case "document":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-info text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
            title="Tài liệu"
          >
            <FaFileAlt />
          </span>
        );
      case "post_reaction":
      case "post_like":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
            title="Cảm xúc"
          >
            <FaHeart />
          </span>
        );
      case "post_comment":
      case "comment_reply":
      case "comment_reaction":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
            title="Bình luận"
          >
            <FaCommentDots />
          </span>
        );
      case "friend_request":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
            title="Kết bạn"
          >
            <FaUserPlus />
          </span>
        );
      case "friend_message":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-info text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
            title="Tin nhắn"
          >
            <FaEnvelope />
          </span>
        );
      case "post_tag":
      case "share_tag":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-purple-600 text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
            title="Gắn thẻ"
          >
            <FaTag />
          </span>
        );
      case "new_blog":
        return (
          <span
            className="position-absolute bottom-0 end-0 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: 18, height: 18, fontSize: 9, transform: "translate(20%, 20%)" }}
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
      className={`group relative flex items-center p-3.5 sm:p-4 rounded-2xl transition-colors duration-150 cursor-pointer border ${
        notification.read
          ? "opacity-80 hover:opacity-100 bg-surface-bright/20 hover:bg-surface-bright/40 border-glass-border"
          : "border-neon-purple/40 bg-neon-purple/10 hover:bg-neon-purple/15 shadow-[0_4px_20px_rgba(142,84,233,0.12)]"
      }`}
    >
      <div className="relative flex-shrink-0">
        <UserAvatar
          src={notification.actorPhoto}
          alt={notification.actorName}
          size={44}
        />
        {renderBadge()}
      </div>

      <div className="flex-grow-1 ms-3 min-w-0">
        <p
          className={`mb-1 text-inherit leading-snug ${
            notification.read ? "font-normal opacity-90" : "font-semibold text-on-surface"
          }`}
          style={{
            fontSize: "0.92rem",
            wordBreak: "break-word",
          }}
        >
          {notification.content}
        </p>
        <div className="flex items-center gap-2 text-xs opacity-70">
          <span>{formatTimeAgo(notification.createdAt)}</span>
          {!notification.read && (
            <span className="inline-flex items-center gap-1 text-[10px] text-neon-purple font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-ping" />
              Mới
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 ms-2 flex-shrink-0">
        {!notification.read && (
          <button
            type="button"
            className="p-2 rounded-lg text-neon-purple hover:bg-neon-purple/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Đánh dấu đã đọc"
          >
            <FaCheckCircle className="text-sm" />
          </button>
        )}
        <button
          type="button"
          className="p-2 rounded-lg text-rose-400 opacity-60 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(notification.id);
          }}
          title="Xóa thông báo"
        >
          <FaTrash className="text-xs" />
        </button>
      </div>
    </div>
  );
});

NotificationItem.displayName = "NotificationItem";

export default NotificationItem;
