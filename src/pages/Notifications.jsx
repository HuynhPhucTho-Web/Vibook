import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
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

const Notifications = () => {
  const { theme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs để theo dõi các listener và tránh duplicate
  const listenersRef = useRef(new Set());
  const processedNotificationsRef = useRef(new Set());
  const lastCleanupRef = useRef(0);

  // Component cho avatar với fallback
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

  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "";
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes}p trước`;
    if (hours < 24) return `${hours}h trước`;
    if (days < 7) return `${days}d trước`;
    return new Date(timestamp).toLocaleDateString("vi-VN", { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }, []);

  // Tự động xóa thông báo cũ (7 ngày)
  const cleanupOldNotifications = useCallback(async (userId) => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Chỉ cleanup mỗi 1 giờ để tránh spam
    if (now - lastCleanupRef.current < 3600000) return;
    lastCleanupRef.current = now;

    try {
      const oldNotificationsQuery = query(
        collection(db, "Notifications"),
        where("userId", "==", userId),
        where("createdAt", "<", sevenDaysAgo)
      );
      
      const snapshot = await getDocs(oldNotificationsQuery);
      
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${snapshot.size} old notifications`);
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
    }
  }, []);

  // Tạo thông báo với kiểm tra duplicate
  const createNotificationIfNotExists = useCallback(async (notificationData) => {
    const notificationKey = `${notificationData.type}_${notificationData.actorId}_${notificationData.postId || 'global'}_${Math.floor(notificationData.createdAt / 60000)}`; // Group theo phút
    
    if (processedNotificationsRef.current.has(notificationKey)) {
      return; // Đã xử lý rồi, bỏ qua
    }
    
    processedNotificationsRef.current.add(notificationKey);

    try {
      await addDoc(collection(db, "Notifications"), notificationData);
    } catch (error) {
      console.error("Error creating notification:", error);
      // Remove from processed set nếu lỗi để có thể thử lại
      processedNotificationsRef.current.delete(notificationKey);
    }
  }, []);

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

            // Setup notifications listener
            const notificationsQuery = query(
              collection(db, "Notifications"),
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc"),
              limit(50) // Giới hạn 50 thông báo
            );
            
            unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
              const notificationList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setNotifications(notificationList);
              setIsLoading(false);
            });

            // Setup post listeners với debounce
            let postChangeTimeout;
            const postsQuery = query(collection(db, "Posts"), orderBy("createdAt", "desc"), limit(20));
            const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
              clearTimeout(postChangeTimeout);
              postChangeTimeout = setTimeout(() => {
                snapshot.docChanges().forEach((change) => {
                  if (change.type === "added") {
                    const postData = change.doc.data();
                    const postCreatedAt = postData.createdAt;
                    
                    // Chỉ tạo thông báo cho bài viết mới (trong vòng 5 phút)
                    if (postData.userId !== user.uid && 
                        postCreatedAt && 
                        (Date.now() - postCreatedAt) < 300000) {
                      
                      createNotificationIfNotExists({
                        userId: user.uid,
                        type: "new_post",
                        actorId: postData.userId,
                        actorName: postData.userName || "Anonymous",
                        actorPhoto: postData.userPhoto || null,
                        postId: change.doc.id,
                        content: `${postData.userName || "Ai đó"} đã đăng một bài viết mới`,
                        createdAt: Date.now(),
                        read: false,
                      });
                    }
                  }
                });
              }, 1000); // Debounce 1 giây
            });
            activeListeners.add(unsubscribePosts);

            // Setup user posts listener cho likes và comments
            const userPostsQuery = query(
              collection(db, "Posts"),
              where("userId", "==", user.uid),
              limit(10) // Giới hạn theo dõi 10 bài viết gần nhất
            );
            
            const unsubscribeUserPosts = onSnapshot(userPostsQuery, (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                const postData = change.doc.data();
                const postId = change.doc.id;

                // Handle likes
                if (change.type === "modified") {
                  const newReactedBy = postData.reactedBy || {};
                  const oldReactedBy = change.oldDoc ? (change.oldDoc.data().reactedBy || {}) : {};
                  
                  Object.entries(newReactedBy).forEach(([actorId, reaction]) => {
                    if (actorId !== user.uid && !oldReactedBy[actorId]) {
                      // Get actor info từ reaction object
                      const actorName = reaction.userName || "Ai đó";
                      const actorPhoto = reaction.userPhoto || null;
                      
                      createNotificationIfNotExists({
                        userId: user.uid,
                        type: "like",
                        actorId,
                        actorName,
                        actorPhoto,
                        postId,
                        content: `${actorName} đã thích bài viết của bạn`,
                        createdAt: Date.now(),
                        read: false,
                      });
                    }
                  });
                }

                // Setup comments listener cho từng post
                const listenerId = `comments_${postId}`;
                if (!listenersRef.current.has(listenerId)) {
                  listenersRef.current.add(listenerId);
                  
                  const commentsQuery = query(
                    collection(db, "Posts", postId, "comments"),
                    orderBy("createdAt", "desc"),
                    limit(5) // Chỉ theo dõi 5 comments gần nhất
                  );
                  
                  const unsubscribeComments = onSnapshot(commentsQuery, (commentSnapshot) => {
                    commentSnapshot.docChanges().forEach((commentChange) => {
                      if (commentChange.type === "added") {
                        const commentData = commentChange.doc.data();
                        const commentCreatedAt = commentData.createdAt;
                        
                        // Chỉ tạo thông báo cho comment mới (trong vòng 2 phút)
                        if (commentData.userId !== user.uid && 
                            commentCreatedAt && 
                            (Date.now() - commentCreatedAt) < 120000) {
                          
                          createNotificationIfNotExists({
                            userId: user.uid,
                            type: "comment",
                            actorId: commentData.userId,
                            actorName: commentData.userName || "Ai đó",
                            actorPhoto: commentData.userPhoto || null,
                            postId,
                            content: `${commentData.userName || "Ai đó"} đã bình luận: "${commentData.content.slice(0, 30)}${commentData.content.length > 30 ? "..." : ""}"`,
                            createdAt: Date.now(),
                            read: false,
                          });
                        }
                      }
                    });
                  });
                  
                  activeListeners.add(unsubscribeComments);
                }
              });
            });
            activeListeners.add(unsubscribeUserPosts);

          } else {
            setUserDetails(null);
            setNotifications([]);
            setIsLoading(false);
          }
        });

      } catch (error) {
        console.error("Setup listeners error:", error);
        toast.error("Không thể tải thông báo", { position: "top-center" });
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
      listenersRef.current.clear();
      processedNotificationsRef.current.clear();
    };
  }, [cleanupOldNotifications, createNotificationIfNotExists]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await updateDoc(doc(db, "Notifications", notificationId), { read: true });
      toast.success("Đã đánh dấu là đã đọc", { 
        position: "top-center", 
        autoClose: 1000 
      });
    } catch (error) {
      toast.error("Không thể đánh dấu thông báo", { position: "top-center" });
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
      toast.success(`Đã đánh dấu ${unreadNotifications.length} thông báo là đã đọc`, { 
        position: "top-center" 
      });
    } catch (error) {
      toast.error("Không thể đánh dấu tất cả thông báo", { position: "top-center" });
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
        toast.info("Không có thông báo cũ để xóa", { position: "top-center" });
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      toast.success(`Đã xóa ${snapshot.size} thông báo cũ`, { position: "top-center" });
    } catch (error) {
      toast.error("Không thể xóa thông báo cũ", { position: "top-center" });
    }
  }, []);

  // Memoized notifications list
  const notificationsList = React.useMemo(() => 
    notifications.map((notification) => (
      <div
        key={notification.id}
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
              onClick={() => handleMarkAsRead(notification.id)}
              title="Đánh dấu là đã đọc"
              style={{ fontSize: '14px' }}
            >
              <FaCheckCircle />
            </button>
          )}
        </div>
      </div>
    )), [notifications, handleMarkAsRead, formatTimeAgo]);

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
        <h5 className="text-muted text-center">Vui lòng đăng nhập để xem thông báo</h5>
      </div>
    );
  }

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className={`container py-4 ${theme}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Thông báo</h1>
          {unreadCount > 0 && (
            <small className="text-muted">
              {unreadCount} thông báo chưa đọc
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          {unreadCount > 0 && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleMarkAllAsRead}
            >
              <FaCheckCircle className="me-1" /> Đọc tất cả
            </button>
          )}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleDeleteOldNotifications}
            title="Xóa thông báo cũ hơn 3 ngày"
          >
            <FaTrash className="me-1" /> Dọn dẹp
          </button>
        </div>
      </div>
      
      {notifications.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {notificationsList}
        </div>
      ) : (
        <div className="text-center py-5">
          <h5 className="text-muted">Không có thông báo nào</h5>
          <p className="text-muted">Bạn sẽ nhận thông báo khi có hoạt động mới!</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;