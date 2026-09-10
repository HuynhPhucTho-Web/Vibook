import React from "react";
import NotificationItem from "./NotificationItem";
import { Bell } from "lucide-react";

const NotificationList = ({ notifications, onMarkAsRead, onDelete, formatTimeAgo }) => {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-surface-bright/20 border border-glass-border">
        <div className="w-14 h-14 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center mx-auto mb-3 text-neon-purple shadow-[0_0_15px_rgba(142,84,233,0.2)]">
          <Bell className="w-7 h-7 opacity-75" />
        </div>
        <h5 className="text-base font-bold mb-1">Không có thông báo nào</h5>
        <p className="text-sm text-on-surface-variant opacity-70 mb-0">
          Bạn sẽ nhận thông báo khi có hoạt động mới!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          formatTimeAgo={formatTimeAgo}
        />
      ))}
    </div>
  );
};

export default NotificationList;
