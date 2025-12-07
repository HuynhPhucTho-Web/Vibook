import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

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

const NotificationItem = ({ notification, onMarkAsRead, formatTimeAgo }) => {
  return (
    <div
      className={`card shadow-sm ${notification.read ? "bg-light" : "bg-primary-subtle border-primary"}`}
      style={{ borderRadius: "12px", overflow: "hidden" }}
    >
      <div className="card-body d-flex align-items-center p-3">
        <UserAvatar
          src={notification.actorPhoto}
          alt={notification.actorName}
          size={40}
        />
        <div className="flex-grow-1 ms-3">
          <p className="mb-0" style={{
            fontSize: "0.9rem",
            fontWeight: notification.read ? "normal" : "600"
          }}>
            {notification.content}
          </p>
          <small className="text-muted">
            {formatTimeAgo(notification.createdAt)}
          </small>
        </div>
        {!notification.read && (
          <button
            className="btn btn-link text-primary p-1 ms-2"
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
            style={{ fontSize: '14px' }}
          >
            <FaCheckCircle />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
