import React, { useState, useEffect, useContext, useCallback } from "react";
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
    try {
      const unreadNotifications = notifications.filter((notif) => !notif.read);

      if (unreadNotifications.length === 0) {
        toast.info("Không có thông báo chưa đọc", { position: "top-center" });
        return;
      }

      const batch = writeBatch(db);
      unreadNotifications.forEach((notif) => {
        batch.update(doc(db, "Notifications", notif.id), { read: true });
      });

      await batch.commit();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success(`Đã đánh dấu ${unreadNotifications.length} thông báo là đã đọc`, {
        position: "top-center",
        autoClose: 1000,
      });
    } catch {
      toast.error("Không thể đánh dấu đã đọc", { position: "top-center" });
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

  const unreadCount = notifications.filter((notif) => !notif.read).length;
  const readCount = notifications.filter((notif) => notif.read).length;

  return (
    <div className="page-shell">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-0">Thông báo</h1>
          {unreadCount > 0 ? (
            <small className="text-muted">
              {unreadCount} thông báo chưa đọc
            </small>
          ) : (
            <small className="text-muted">
              Tất cả thông báo đã được đọc
            </small>
          )}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleMarkAllAsRead}
            >
              <FaCheckCircle className="me-1" /> Đánh dấu đã đọc
            </button>
          )}
          {readCount > 0 && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleDeleteReadNotifications}
              title="Xóa tất cả thông báo đã đọc"
            >
              <FaTrash className="me-1" /> Xóa đã đọc ({readCount})
            </button>
          )}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleDeleteOldNotifications}
            title="Xóa thông báo cũ hơn 3 ngày"
          >
            <FaTrash className="me-1" /> Dọn dẹp (&gt;3 ngày)
          </button>
        </div>
      </div>

      <NotificationList
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteNotification}
        formatTimeAgo={formatTimeAgo}
      />
    </div>
  );
};

export default Notifications;
