// src/components/header/NotificationPopover.jsx
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  X,
  ChevronRight,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Heart,
  UserPlus,
  FileText,
  Clock,
  Award,
  Tag,
} from "lucide-react";
import { formatTimeAgo } from "../notification/NotificationUtils";

const NotificationPopover = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  theme = "dark",
  onMarkAsRead,
  onMarkAllAsRead,
  latestNewNotificationId = null,
}) => {
  const navigate = useNavigate();
  const isLight = theme === "light";

  // Filter state: 'all' | 'unread' | 'study'
  const [activeTab, setActiveTab] = useState("all");

  // Filter notifications based on tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeTab === "unread") return !notif.read;
      if (activeTab === "study") {
        return (
          notif.type === "quiz" ||
          notif.type === "course" ||
          notif.type === "subject_quiz" ||
          notif.type === "subject_doc" ||
          notif.type === "document" ||
          Boolean(notif.subjectCode)
        );
      }
      return true;
    });
  }, [notifications, activeTab]);

  const studyCount = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.type === "quiz" ||
        n.type === "course" ||
        n.type === "subject_quiz" ||
        n.type === "subject_doc" ||
        n.type === "document" ||
        Boolean(n.subjectCode)
    ).length;
  }, [notifications]);

  // Handle clicking a notification item
  const handleItemClick = (notif) => {
    if (!notif.read && onMarkAsRead) {
      onMarkAsRead(notif.id);
    }
    onClose?.();

    if (notif.type === "friend_request") {
      navigate("/friends");
    } else if (notif.type === "friend_message") {
      navigate("/messenger");
    } else if (notif.type === "new_blog") {
      if (notif.blogSlug) navigate(`/blog/${notif.blogSlug}`);
      else navigate("/blog");
    } else if (
      notif.type === "subject_quiz" ||
      notif.type === "subject_doc" ||
      notif.type === "quiz" ||
      notif.subjectCode
    ) {
      const code = (notif.subjectCode || "dps201c").toLowerCase();
      const tab = notif.type === "quiz" || notif.type === "subject_quiz" ? "quiz" : "document";
      navigate(`/source/${code}/${tab}`);
    } else if (notif.postId) {
      navigate(`/post/${notif.postId}`);
    } else {
      navigate("/notifications");
    }
  };

  // Helper to render type icons for avatar badge or fallback
  const renderItemIcon = (type, isSmall = false) => {
    const size = isSmall ? "w-2.5 h-2.5" : "w-4 h-4";
    switch (type) {
      case "subject_quiz":
      case "quiz":
        return <Award className={`${size} text-white`} />;
      case "subject_doc":
      case "document":
        return <FileText className={`${size} text-white`} />;
      case "friend_request":
        return <UserPlus className={`${size} text-white`} />;
      case "friend_message":
        return <MessageSquare className={`${size} text-white`} />;
      case "post_reaction":
      case "post_like":
        return <Heart className={`${size} text-white`} />;
      case "post_comment":
      case "comment_reply":
      case "comment_reaction":
        return <MessageSquare className={`${size} text-white`} />;
      case "new_blog":
        return <BookOpen className={`${size} text-white`} />;
      case "post_tag":
      case "share_tag":
        return <Tag className={`${size} text-white`} />;
      default:
        return <Bell className={`${size} text-white`} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="notification-popover-box"
          initial={{ opacity: 0, scale: 0.94, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{
            type: "spring",
            stiffness: 440,
            damping: 32,
            mass: 0.7,
          }}
          className={`hidden md:block absolute right-0 top-full mt-2 w-[360px] sm:w-[385px] max-w-[94vw] rounded-[20px] z-[1000] overflow-hidden origin-top-right ${
            isLight
              ? "bg-white text-gray-900 border border-gray-100 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.16),0_0_1px_rgba(0,0,0,0.08)]"
              : "bg-[#151622] text-[#e3e1ec] border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),0_0_16px_rgba(142,84,233,0.15)]"
          }`}
        >
          {/* Header (Compact) */}
          <div
            className={`px-4 py-2.5 flex items-center justify-between border-b ${
              isLight ? "border-gray-100" : "border-white/5"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <h4 className="text-[15px] font-bold tracking-tight text-gray-900 dark:text-white mb-0">
                Thông báo
              </h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-neon-purple bg-neon-purple/15 border border-neon-purple/30 px-1.5 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAllAsRead?.();
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium transition-all ${
                    isLight
                      ? "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      : "text-purple-400 hover:text-purple-300 hover:bg-purple-950/40"
                  }`}
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đọc tất cả</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onClose?.()}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isLight
                    ? "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    : "text-outline hover:text-white hover:bg-white/10"
                }`}
                title="Đóng"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs (Compact) */}
          <div
            className={`flex items-center gap-1.5 px-4 py-2 border-b text-[11px] font-medium ${
              isLight ? "border-gray-100" : "border-white/5"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-full transition-all duration-200 ${
                activeTab === "all"
                  ? isLight
                    ? "bg-purple-100 text-purple-700 font-bold shadow-sm"
                    : "bg-purple-900/50 text-purple-200 border border-purple-500/30 font-bold"
                  : isLight
                  ? "text-gray-500 hover:text-gray-800 hover:bg-gray-100/80"
                  : "text-on-surface-variant hover:text-white hover:bg-white/5"
              }`}
            >
              Tất cả ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1 rounded-full transition-all duration-200 ${
                activeTab === "unread"
                  ? isLight
                    ? "bg-purple-100 text-purple-700 font-bold shadow-sm"
                    : "bg-purple-900/50 text-purple-200 border border-purple-500/30 font-bold"
                  : isLight
                  ? "text-gray-500 hover:text-gray-800 hover:bg-gray-100/80"
                  : "text-on-surface-variant hover:text-white hover:bg-white/5"
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>

            {studyCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("study")}
                className={`px-3 py-1 rounded-full transition-all duration-200 ${
                  activeTab === "study"
                    ? isLight
                      ? "bg-purple-100 text-purple-700 font-bold shadow-sm"
                      : "bg-purple-900/50 text-purple-200 border border-purple-500/30 font-bold"
                    : isLight
                    ? "text-gray-500 hover:text-gray-800 hover:bg-gray-100/80"
                    : "text-on-surface-variant hover:text-white hover:bg-white/5"
                }`}
              >
                Học tập ({studyCount})
              </button>
            )}
          </div>

          {/* Notifications List (Compact Max-Height: 250px) */}
          <div
            className="max-h-[250px] overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 py-0.5 px-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: isLight ? "#c084fc transparent" : "#7c3aed transparent",
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 flex items-center justify-center mx-auto mb-2 text-neon-purple shadow-sm">
                  <Bell className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
                  Không có thông báo nào
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {activeTab === "unread"
                    ? "Bạn đã đọc hết mọi thông báo!"
                    : "Bạn sẽ nhận thông báo khi có hoạt động mới."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isHighlight =
                  !notif.read || notif.id === latestNewNotificationId;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer relative group my-0.5 ${
                      isHighlight
                        ? isLight
                          ? "bg-purple-50/50 hover:bg-purple-100/50"
                          : "bg-purple-950/20 hover:bg-purple-900/30"
                        : isLight
                        ? "hover:bg-gray-50/90 opacity-90 hover:opacity-100"
                        : "hover:bg-white/5 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Avatar / Icon with small bottom-right badge */}
                      <div className="relative shrink-0 mt-0.5">
                        {notif.actorPhoto ? (
                          <img
                            src={notif.actorPhoto}
                            alt={notif.actorName || "Avatar"}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-black/5 dark:border-white/10 shadow-sm"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                              isLight
                                ? "bg-blue-50 text-blue-500 border-blue-100"
                                : "bg-purple-900/40 text-purple-300 border-purple-700/30"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </div>
                        )}

                        {/* Soft rounded badge on avatar bottom-right */}
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-md bg-neon-purple text-white flex items-center justify-center text-[8px] shadow-sm">
                          {renderItemIcon(notif.type, true)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide truncate">
                            {notif.subjectCode
                              ? `${notif.subjectCode}`
                              : notif.actorName || "VIBOOK"}
                          </span>

                          <div className="flex items-center gap-1 shrink-0 text-gray-400 dark:text-gray-500 text-[10px] font-normal">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTimeAgo(notif.createdAt) || "Vừa xong"}</span>
                          </div>
                        </div>

                        <p
                          className={`text-[12px] leading-snug line-clamp-2 ${
                            isHighlight
                              ? "font-medium text-gray-800 dark:text-gray-100"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {notif.content || "Bạn có thông báo mới."}
                        </p>

                        {/* Action button for quiz/study */}
                        {(notif.type === "quiz" ||
                          notif.type === "subject_quiz" ||
                          notif.subjectCode) && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              type="button"
                              className="px-2 py-0.5 bg-gradient-to-r from-neon-purple to-electric-blue hover:opacity-95 text-white rounded-md text-[11px] font-semibold shadow-[0_0_8px_rgba(142,84,233,0.3)] transition-opacity flex items-center gap-1"
                            >
                              <span>Vào làm ngay</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[10px] text-gray-400">Hạn: Hôm nay</span>
                          </div>
                        )}
                      </div>

                      {/* Unread pulsing dot */}
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-purple shrink-0 mt-1.5 shadow-[0_0_6px_rgba(142,84,233,1)]" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer (Compact) */}
          <div
            className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] ${
              isLight ? "border-gray-100 bg-gray-50/40" : "border-white/5 bg-white/[0.02]"
            }`}
          >
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllAsRead?.();
                }}
                className={`font-semibold flex items-center gap-1.5 transition-colors ${
                  isLight
                    ? "text-purple-600 hover:text-purple-700"
                    : "text-neon-purple hover:text-purple-300"
                }`}
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đánh dấu đọc tất cả</span>
              </button>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium">
                <CheckCheck className="w-3.5 h-3.5 opacity-60" />
                <span>Đã đọc tất cả</span>
              </span>
            )}

            <Link
              to="/notifications"
              onClick={() => onClose?.()}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-bold flex items-center gap-0.5 hover:gap-1 transition-all"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPopover;
