import React, { useState, useEffect, useContext, useCallback } from "react";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
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

            // Setup notifications listener - lấy tất cả notifications của user, filter client-side
            const notificationsQuery = query(
              collection(db, "Notifications"),
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc"),
              limit(50)
            );

            unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
              const allNotifications = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              // Filter chỉ lấy friend_request, friend_post, friend_message
              const filteredNotifications = allNotifications.filter(notif =>
                ["friend_request", "friend_post", "friend_message"].includes(notif.type)
              );
              setNotifications(filteredNotifications);
              setIsLoading(false);
            });

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
        toast.info("No unread notifications", { position: "top-center" });
        return;
      }

      const batch = writeBatch(db);
      unreadNotifications.forEach((notif) => {
        batch.update(doc(db, "Notifications", notif.id), { read: true });
      });

      await batch.commit();
      toast.success(`Bookmarked ${unreadNotifications.length} notification is read`, {
        position: "top-center"
      });
    } catch {
      toast.error("Cannot mark all notifications", { position: "top-center" });
    }
  }, [notifications]);

  const handleDeleteOldNotifications = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      const oldNotificationsQuery = query(
        collection(db, "Notifications"),
        where("userId", "==", auth.currentUser.uid),
        where("createdAt", "<", threeDaysAgo)
      );

      const snapshot = await getDocs(oldNotificationsQuery);

      if (snapshot.empty) {
        toast.info("No old messages to delete", { position: "top-center" });
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast.success(`Deleteda ${snapshot.size} old notice`, { position: "top-center" });
    } catch {
      toast.error("Cannot mark all notifications", { position: "top-center" });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className={`container py-4 ${theme}`}>
        <h5 className="text-muted text-center">Please login to view notifications</h5>
      </div>
    );
  }

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className={`container py-4 ${theme}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Notifications</h1>
          {unreadCount > 0 && (
            <small className="text-muted">
              {unreadCount} unread notification
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          {unreadCount > 0 && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleMarkAllAsRead}
            >
              <FaCheckCircle className="me-1" /> Mark all
            </button>
          )}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleDeleteOldNotifications}
            title="Xóa thông báo cũ hơn 3 ngày"
          >
            <FaTrash className="me-1" /> Clear up
          </button>
        </div>
      </div>

      <NotificationList
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        formatTimeAgo={formatTimeAgo}
      />
    </div>
  );
};

export default Notifications;
