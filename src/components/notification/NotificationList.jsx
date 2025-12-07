import React from "react";
import NotificationItem from "./NotificationItem";

const NotificationList = ({ notifications, onMarkAsRead, formatTimeAgo }) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-5">
        <h5 className="text-muted">Không có thông báo nào</h5>
        <p className="text-muted">Bạn sẽ nhận thông báo khi có hoạt động mới!</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          formatTimeAgo={formatTimeAgo}
        />
      ))}
    </div>
  );
};

export default NotificationList;
