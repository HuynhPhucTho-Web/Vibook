import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { FaCheckCircle, FaTrash } from "react-icons/fa";
import NotificationList from "../components/notification/NotificationList";
import {
  formatTimeAgo,
  cleanupOldNotifications,
  createNotificationIfNotExists,
  setupNotificationListeners
} from "../components/notification/NotificationUtils";

const Notifications = () => {
  const { theme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    let unsubscribeAuth = null;
    let unsubscribeNotifications = null;
    const activeListeners = new Set();

    const setupListeners = async () => {
      try {
        unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
          if (user) {
            // Load user details
            const userRef = doc(db, "Users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setUserDetails(userSnap.data());
            }

            // Cleanup old notifications
            await cleanupOldNotifications(user.uid);

            // Setup notifications listener - query theo userId không cần composite index, sort client-side
            const notificationsQuery = query(
              collection(db, "Notifications"),
              where("userId", "==", user.uid)
            );

            unsubscribeNotifications = onSnapshot(
              notificationsQuery,
              (snapshot) => {
                const allNotifications = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                // Sắp xếp giảm dần theo thời gian tạo
                allNotifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                // Lấy tất cả thông báo hợp lệ của người dùng
                const allowedTypes = [
                  "friend_request",
                  "friend_post",
                  "friend_message",
                  "new_blog",
                  "post_reaction",
                  "post_like",
                  "post_comment",
                  "comment_reply",
                  "comment_reaction",
                ];
                const filteredNotifications = allNotifications.filter(
                  (notif) => allowedTypes.includes(notif.type) || Boolean(notif.content)
                );
                setNotifications(filteredNotifications);
                setIsLoading(false);
              },
              (err) => {
                console.error("Notifications snapshot error:", err);
                setIsLoading(false);
              }
            );

            // Setup listeners for creating notifications
            const { activeListeners: listeners } = setupNotificationListeners(
              user,
              createNotificationIfNotExists
            );
            activeListeners.add(...listeners);

          } else {
            setUserDetails(null);
            setNotifications([]);
            setIsLoading(false);
          }
        });

      } catch (error) {
        console.error("Setup listeners error:", error);
        toast.error("Unable to load notification", { position: "top-center" });
        setIsLoading(false);
      }
    };

    setupListeners();

    return () => {
      unsubscribeAuth && unsubscribeAuth();
      unsubscribeNotifications && unsubscribeNotifications();
      activeListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
    };
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await updateDoc(doc(db, "Notifications", notificationId), { read: true });
      toast.success("Marked as read", {
        position: "top-center",
        autoClose: 1000
      });
    } catch {
      toast.error("Cannot mark all notifications", { position: "top-center" });
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const unreadNotifications = notifications.filter((notif) => !notif.read);

      if (unreadNotifications.length === 0) {
        toast.info("Không có thông báo chưa đọc", { position: "top-center" });
        return;
      }

      setIsMarkingAll(true);
      const batch = writeBatch(db);
      unreadNotifications.forEach((notif) => {
        batch.update(doc(db, "Notifications", notif.id), { read: true });
      });

      await batch.commit();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Đã đánh dấu tất cả là đã đọc", {
        position: "top-center",
        autoClose: 1200,
      });
    } catch (error) {
      console.error("Error marking all read:", error);
      toast.error("Không thể đánh dấu đã đọc", { position: "top-center" });
    } finally {
      setIsMarkingAll(false);
    }
  }, [notifications]);

  const handleDeleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteDoc(doc(db, "Notifications", notificationId));
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Đã xóa thông báo", {
        position: "top-center",
        autoClose: 1000,
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Không thể xóa thông báo", { position: "top-center" });
    }
  }, []);

  const handleDeleteReadNotifications = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const readNotifications = notifications.filter((notif) => notif.read);

      if (readNotifications.length === 0) {
        toast.info("Không có thông báo đã đọc nào để xóa", { position: "top-center" });
        return;
      }

      const batch = writeBatch(db);
      readNotifications.forEach((notif) => {
        batch.delete(doc(db, "Notifications", notif.id));
      });

      await batch.commit();
      setNotifications((prev) => prev.filter((notif) => !notif.read));
      toast.success(`Đã xóa ${readNotifications.length} thông báo đã đọc`, {
        position: "top-center",
        autoClose: 1200,
      });
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      toast.error("Không thể xóa thông báo đã đọc", { position: "top-center" });
    }
  }, [notifications]);

  const handleDeleteOldNotifications = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const oldNotifications = notifications.filter(
        (notif) => notif.createdAt && notif.createdAt < threeDaysAgo
      );

      if (oldNotifications.length === 0) {
        toast.info("Không có thông báo cũ hơn 3 ngày để xóa", { position: "top-center" });
        return;
      }

      const batch = writeBatch(db);
      oldNotifications.forEach((notif) => {
        batch.delete(doc(db, "Notifications", notif.id));
      });

      await batch.commit();
      setNotifications((prev) =>
        prev.filter((n) => !n.createdAt || n.createdAt >= threeDaysAgo)
      );
      toast.success(`Đã xóa ${oldNotifications.length} thông báo cũ`, {
        position: "top-center",
        autoClose: 1200,
      });
    } catch (error) {
      console.error("Error deleting old notifications:", error);
      toast.error("Không thể xóa thông báo cũ", { position: "top-center" });
    }
  }, [notifications]);

  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = useMemo(
    () => notifications.filter((notif) => !notif.read).length,
    [notifications]
  );
  const readCount = useMemo(
    () => notifications.filter((notif) => notif.read).length,
    [notifications]
  );

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

  const interactionCount = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.type === "post_like" ||
        n.type === "post_reaction" ||
        n.type === "post_comment" ||
        n.type === "comment_reply" ||
        n.type === "comment_reaction" ||
        n.type === "friend_request" ||
        n.type === "friend_message" ||
        n.type === "post_tag" ||
        n.type === "share_tag"
    ).length;
  }, [notifications]);

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
      if (activeTab === "interaction") {
        return (
          notif.type === "post_like" ||
          notif.type === "post_reaction" ||
          notif.type === "post_comment" ||
          notif.type === "comment_reply" ||
          notif.type === "comment_reaction" ||
          notif.type === "friend_request" ||
          notif.type === "friend_message" ||
          notif.type === "post_tag" ||
          notif.type === "share_tag"
        );
      }
      return true;
    });
  }, [notifications, activeTab]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="page-shell">
        <h5 className="text-muted text-center">Vui lòng đăng nhập để xem thông báo</h5>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-4xl mx-auto px-3 sm:px-6 py-6">
      {/* Top Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-purple shadow-[0_0_10px_rgba(142,84,233,0.8)]" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
            VIBOOK HUB • NOTIFICATIONS
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-on-surface">
              Thông báo
            </h1>
            <p className="text-sm text-on-surface-variant opacity-80 mb-0">
              {unreadCount > 0
                ? `Bạn có ${unreadCount} thông báo chưa đọc`
                : "Bạn đã cập nhật tất cả thông báo mới nhất"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={unreadCount === 0 || isMarkingAll}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                unreadCount > 0
                  ? "bg-gradient-to-r from-neon-purple to-electric-blue hover:opacity-90 text-white shadow-[0_0_15px_rgba(142,84,233,0.3)] cursor-pointer active:scale-95"
                  : "bg-surface-bright/20 text-on-surface-variant/40 border border-glass-border cursor-not-allowed"
              }`}
              onClick={handleMarkAllAsRead}
              title={unreadCount > 0 ? "Đánh dấu tất cả thông báo là đã đọc" : "Không có thông báo chưa đọc"}
            >
              <FaCheckCircle className="text-xs" />
              <span>{isMarkingAll ? "Đang xử lý..." : "Đánh dấu đọc tất cả"}</span>
            </button>

            {readCount > 0 && (
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
                onClick={handleDeleteReadNotifications}
                title="Xóa tất cả thông báo đã đọc"
              >
                <FaTrash className="text-xs" />
                <span>Xóa đã đọc ({readCount})</span>
              </button>
            )}

            <button
              type="button"
              className="px-3 py-1.5 rounded-xl border border-glass-border text-on-surface-variant hover:bg-surface-bright/40 text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95"
              onClick={handleDeleteOldNotifications}
              title="Xóa thông báo cũ hơn 3 ngày"
            >
              <FaTrash className="text-xs opacity-60" />
              <span>Dọn dẹp (&gt;3 ngày)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-glass-border">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "all"
              ? "bg-neon-purple text-white shadow-[0_0_12px_rgba(142,84,233,0.5)]"
              : "bg-surface-bright/30 text-on-surface-variant hover:bg-surface-bright/60 hover:text-on-surface"
          }`}
        >
          Tất cả ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "unread"
              ? "bg-neon-purple text-white shadow-[0_0_12px_rgba(142,84,233,0.5)]"
              : "bg-surface-bright/30 text-on-surface-variant hover:bg-surface-bright/60 hover:text-on-surface"
          }`}
        >
          Chưa đọc ({unreadCount})
        </button>

        {studyCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("study")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "study"
                ? "bg-neon-purple text-white shadow-[0_0_12px_rgba(142,84,233,0.5)]"
                : "bg-surface-bright/30 text-on-surface-variant hover:bg-surface-bright/60 hover:text-on-surface"
            }`}
          >
            Học tập ({studyCount})
          </button>
        )}

        {interactionCount > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("interaction")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === "interaction"
                ? "bg-neon-purple text-white shadow-[0_0_12px_rgba(142,84,233,0.5)]"
                : "bg-surface-bright/30 text-on-surface-variant hover:bg-surface-bright/60 hover:text-on-surface"
            }`}
          >
            Tương tác ({interactionCount})
          </button>
        )}
      </div>

      {/* Quick banner for unread tab */}
      {activeTab === "unread" && unreadCount > 0 && (
        <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-neon-purple/10 border border-neon-purple/30 text-xs">
          <div className="flex items-center gap-2 text-on-surface">
            <span className="w-2 h-2 rounded-full bg-neon-purple animate-ping" />
            <span>Bạn có <strong>{unreadCount}</strong> thông báo chưa đọc</span>
          </div>
          <button
            type="button"
            disabled={isMarkingAll}
            onClick={handleMarkAllAsRead}
            className="text-neon-purple hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <FaCheckCircle className="text-[11px]" />
            <span>{isMarkingAll ? "Đang xử lý..." : "Đánh dấu đọc tất cả"}</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <NotificationList
        notifications={filteredNotifications}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteNotification}
        formatTimeAgo={formatTimeAgo}
      />
    </div>
  );
};

export default Notifications;
