import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  getDocs,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../components/firebase";

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just finished";
  if (minutes < 60) return `${minutes}minutes ago`;
  if (hours < 24) return `${hours}hour ago`;
  if (days < 7) return `${days}the day before`;
  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: '2-digit',
    month: '2-digit'
  });
};

export const cleanupOldNotifications = async (userId) => {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

  try {
    // First try to get all notifications for this user (simple query)
    const allNotificationsQuery = query(
      collection(db, "Notifications"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(allNotificationsQuery);

    if (snapshot.empty) return;

    // Filter old notifications client-side
    const oldNotifications = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.createdAt && data.createdAt < sevenDaysAgo;
    });

    if (oldNotifications.length === 0) return;

    const batch = writeBatch(db);
    oldNotifications.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${oldNotifications.length} old notifications`);
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
  }
};

export const createNotificationIfNotExists = async (notificationData) => {
  const processedNotifications = new Set();
  const notificationKey = `${notificationData.type}_${notificationData.actorId}_${notificationData.postId || 'global'}_${Math.floor(notificationData.createdAt / 60000)}`; // Group theo phút

  if (processedNotifications.has(notificationKey)) {
    return; // Đã xử lý rồi, bỏ qua
  }

  processedNotifications.add(notificationKey);

  try {
    await addDoc(collection(db, "Notifications"), notificationData);
  } catch (error) {
    console.error("Error creating notification:", error);
    // Remove from processed set nếu lỗi để có thể thử lại
    processedNotifications.delete(notificationKey);
  }
};

export const setupNotificationListeners = (user, createNotificationIfNotExists) => {
  const activeListeners = new Set();

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

          // Chỉ tạo thông báo cho bài viết mới từ bạn bè (trong vòng 5 phút)
          if (postData.userId !== user.uid &&
            postCreatedAt &&
            (Date.now() - postCreatedAt) < 300000) {

            // Kiểm tra xem có phải bạn bè không
            // (Bạn cần implement logic kiểm tra friendship ở đây)

            createNotificationIfNotExists({
              userId: user.uid,
              type: "friend_post",
              actorId: postData.userId,
              actorName: postData.userName || "Anonymous",
              actorPhoto: postData.userPhoto || null,
              postId: change.doc.id,
              content: `${postData.userName || "Someone"} posted a new article`,
              createdAt: Date.now(),
              read: false,
            });
          }
        }
      });
    }, 1000);
  });
  activeListeners.add(unsubscribePosts);

  // Setup friend requests listener
  const friendRequestsQuery = query(
    collection(db, "FriendRequests"),
    where("toUserId", "==", user.uid),
    where("status", "==", "pending")
  );

  const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const requestData = change.doc.data();

        createNotificationIfNotExists({
          userId: user.uid,
          type: "friend_request",
          actorId: requestData.fromUserId,
          actorName: requestData.fromUserName,
          actorPhoto: requestData.fromUserPhoto,
          requestId: change.doc.id,
          content: `${requestData.fromUserName} sent you a friend request`,
          createdAt: Date.now(),
          read: false,
        });
      }
    });
  });
  activeListeners.add(unsubscribeFriendRequests);

  // Setup messages listener (từ bạn bè)
  const messagesQuery = query(
    collection(db, "Messages"),
    where("receiverId", "==", user.uid),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const messageData = change.doc.data();

        // Kiểm tra xem có phải từ bạn bè không
        // (Bạn cần implement logic kiểm tra friendship ở đây)

        createNotificationIfNotExists({
          userId: user.uid,
          type: "friend_message",
          actorId: messageData.senderId,
          actorName: messageData.senderName,
          actorPhoto: messageData.senderPhoto,
          messageId: change.doc.id,
          content: `${messageData.senderName} sent you a message`,
          createdAt: Date.now(),
          read: false,
        });
      }
    });
  });
  activeListeners.add(unsubscribeMessages);

  return { activeListeners };
};
