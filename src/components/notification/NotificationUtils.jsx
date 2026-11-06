import {
  collection,
  collectionGroup,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../components/firebase";

export const normalizeTimestamp = (timestamp) => {
  if (!timestamp) return 0;
  if (typeof timestamp === "number") return timestamp;
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  const parsed = new Date(timestamp).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

export const formatTimeAgo = (timestamp) => {
  const time = normalizeTimestamp(timestamp);
  if (!time) return "";

  const now = Date.now();
  const diff = now - time;
  if (diff < 0) return "Vừa xong";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(time).toLocaleDateString("vi-VN", {
    day: '2-digit',
    month: '2-digit'
  });
};

export const isSameNotificationList = (prevList = [], newList = []) => {
  if (prevList === newList) return true;
  if (!prevList || !newList) return false;
  if (prevList.length !== newList.length) return false;
  for (let i = 0; i < prevList.length; i++) {
    const a = prevList[i];
    const b = newList[i];
    if (
      a.id !== b.id ||
      a.read !== b.read ||
      a.type !== b.type ||
      a.content !== b.content ||
      a.actorPhoto !== b.actorPhoto ||
      a.actorName !== b.actorName ||
      a.subjectCode !== b.subjectCode ||
      normalizeTimestamp(a.createdAt) !== normalizeTimestamp(b.createdAt)
    ) {
      return false;
    }
  }
  return true;
};

export const cleanupOldNotifications = async (userId) => {
  if (!userId) return;
  const storageKey = `vibook_last_notif_cleanup_${userId}`;
  try {
    const lastCleanup = Number(localStorage.getItem(storageKey) || 0);
    const now = Date.now();
    // Chạy dọn dẹp tối đa 1 lần mỗi 24 giờ để tránh query và snapshot loop liên tục
    if (now - lastCleanup < 24 * 60 * 60 * 1000) {
      return;
    }
    localStorage.setItem(storageKey, String(now));

    const allNotificationsQuery = query(
      collection(db, "Notifications"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(allNotificationsQuery);
    if (snapshot.empty) return;

    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oldNotifications = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      const time = normalizeTimestamp(data.createdAt);
      return time && time < sevenDaysAgo;
    });

    if (oldNotifications.length === 0) return;

    const batch = writeBatch(db);
    oldNotifications.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
  }
};

const processedNotifications = new Set();

export const createNotificationIfNotExists = async (notificationData) => {
  if (!notificationData || !notificationData.userId) return;

  // Không gửi thông báo cho chính mình
  if (notificationData.actorId && notificationData.userId === notificationData.actorId) {
    return;
  }

  const uniqueId =
    notificationData.requestId ||
    notificationData.messageId ||
    notificationData.postId ||
    notificationData.blogId ||
    notificationData.quizId ||
    notificationData.docId ||
    `${normalizeTimestamp(notificationData.createdAt)}`;

  // Khóa ổn định theo nội dung/thực thể, KHÔNG hết hạn theo từng phút để tránh spam lặp lại
  const notificationKey = `${notificationData.type}_${notificationData.userId}_${notificationData.actorId || "system"}_${uniqueId}`;

  if (processedNotifications.has(notificationKey)) {
    return; // Đã xử lý, bỏ qua
  }
  processedNotifications.add(notificationKey);

  try {
    const currentUid = auth.currentUser?.uid;
    const createdAtNum = normalizeTimestamp(notificationData.createdAt) || Date.now();

    // Nếu thông báo gửi cho chính mình hoặc có quyền kiểm tra bằng deterministic ID:
    if (currentUid && notificationData.userId === currentUid) {
      const safeKey = notificationKey.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
      const notifDocRef = doc(db, "Notifications", `notif_${safeKey}`);
      try {
        const existingDoc = await getDoc(notifDocRef);
        if (existingDoc.exists()) {
          return;
        }
      } catch (readErr) {
        // Bỏ qua lỗi đọc nếu có hạn chế rules
      }

      await setDoc(notifDocRef, {
        ...notificationData,
        read: false,
        createdAt: createdAtNum,
      });
      return;
    }

    // Gửi thông báo cho người dùng khác
    await addDoc(collection(db, "Notifications"), {
      ...notificationData,
      read: false,
      createdAt: createdAtNum,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

const getActorDisplayName = (actorUser, actorDetails) => {
  if (actorDetails) {
    const fullName = `${actorDetails.firstName || ""} ${actorDetails.lastName || ""}`.trim();
    if (fullName) return fullName;
    if (actorDetails.displayName) return actorDetails.displayName;
    if (actorDetails.name) return actorDetails.name;
  }
  if (actorUser?.displayName) return actorUser.displayName;
  if (actorUser?.email) return actorUser.email.split("@")[0];
  return "Người dùng Vibook";
};

const getActorPhotoURL = (actorUser, actorDetails) => {
  return actorDetails?.photo || actorDetails?.photoURL || actorUser?.photoURL || null;
};

// Map nhãn cảm xúc tiếng Việt
const REACTION_LABELS = {
  like: "thích",
  love: "yêu thích",
  care: "thương thương",
  haha: "haha",
  wow: "wow",
  sad: "buồn",
  angry: "phẫn nộ",
  Like: "thích",
  Love: "yêu thích",
  Care: "thương thương",
  Haha: "haha",
  Wow: "wow",
  Sad: "buồn",
  Angry: "phẫn nộ",
};

const REACTION_EMOJIS = {
  Like: "👍",
  Love: "❤️",
  Care: "🥰",
  Haha: "😆",
  Wow: "😮",
  Sad: "😢",
  Angry: "😡",
  like: "👍",
  love: "❤️",
  care: "🥰",
  haha: "😆",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

/**
 * Tạo thông báo khi có người thả cảm xúc vào bài viết
 */
export const notifyPostReaction = async ({ postId, postOwnerId, reaction, actorUser, actorDetails }) => {
  const actorId = actorUser?.uid || auth.currentUser?.uid;
  if (!postOwnerId || !actorId || postOwnerId === actorId) return;

  const actorName = getActorDisplayName(actorUser, actorDetails);
  const actorPhoto = getActorPhotoURL(actorUser, actorDetails);
  const reactionKey = reaction || "Like";
  const reactionWord = REACTION_LABELS[reactionKey] || "thích";
  const emoji = REACTION_EMOJIS[reactionKey] || "👍";

  await createNotificationIfNotExists({
    userId: postOwnerId,
    type: "post_reaction",
    reaction: reactionKey,
    actorId,
    actorName,
    actorPhoto,
    postId,
    content: `${actorName} đã bày tỏ cảm xúc ${emoji} (${reactionWord}) về bài viết của bạn.`,
    createdAt: Date.now(),
  });
};

/**
 * Tạo thông báo khi có người bình luận vào bài viết
 */
export const notifyPostComment = async ({ postId, postOwnerId, commentText, actorUser, actorDetails }) => {
  const actorId = actorUser?.uid || auth.currentUser?.uid;
  if (!postOwnerId || !actorId || postOwnerId === actorId) return;

  const actorName = getActorDisplayName(actorUser, actorDetails);
  const actorPhoto = getActorPhotoURL(actorUser, actorDetails);
  const snippet = commentText ? (commentText.length > 55 ? `${commentText.slice(0, 55)}...` : commentText) : "";

  await createNotificationIfNotExists({
    userId: postOwnerId,
    type: "post_comment",
    actorId,
    actorName,
    actorPhoto,
    postId,
    content: snippet
      ? `${actorName} đã bình luận về bài viết của bạn: "${snippet}"`
      : `${actorName} đã bình luận về bài viết của bạn.`,
    createdAt: Date.now(),
  });
};

/**
 * Tạo thông báo khi có người trả lời bình luận của bạn
 */
export const notifyCommentReply = async ({ postId, targetUserId, commentText, actorUser, actorDetails }) => {
  const actorId = actorUser?.uid || auth.currentUser?.uid;
  if (!targetUserId || !actorId || targetUserId === actorId) return;

  const actorName = getActorDisplayName(actorUser, actorDetails);
  const actorPhoto = getActorPhotoURL(actorUser, actorDetails);
  const snippet = commentText ? (commentText.length > 55 ? `${commentText.slice(0, 55)}...` : commentText) : "";

  await createNotificationIfNotExists({
    userId: targetUserId,
    type: "comment_reply",
    actorId,
    actorName,
    actorPhoto,
    postId,
    content: snippet
      ? `${actorName} đã trả lời bình luận của bạn: "${snippet}"`
      : `${actorName} đã trả lời bình luận của bạn.`,
    createdAt: Date.now(),
  });
};

/**
 * Tạo thông báo khi có người gắn thẻ bạn trong bài viết hoặc bài viết chia sẻ
 */
export const notifyTaggedInPost = async ({
  postId,
  taggedUserId,
  actorUser,
  actorDetails,
  isShare = false,
}) => {
  const actorId = actorUser?.uid || auth.currentUser?.uid;
  if (!taggedUserId || !actorId || taggedUserId === actorId) return;

  const actorName = getActorDisplayName(actorUser, actorDetails);
  const actorPhoto = getActorPhotoURL(actorUser, actorDetails);

  const content = isShare
    ? `${actorName} đã gắn thẻ bạn trong một bài viết chia sẻ.`
    : `${actorName} đã gắn thẻ bạn trong một bài viết.`;

  await createNotificationIfNotExists({
    userId: taggedUserId,
    type: isShare ? "share_tag" : "post_tag",
    actorId,
    actorName,
    actorPhoto,
    postId,
    content,
    createdAt: Date.now(),
  });
};

export const setupNotificationListeners = (user, createNotificationIfNotExists) => {
  const activeListeners = new Set();
  if (!user || !user.uid) return { activeListeners };

  // Setup post listeners với debounce và bỏ qua snapshot ban đầu
  let isInitialPosts = true;
  let postChangeTimeout;
  const postsQuery = query(collection(db, "Posts"), orderBy("createdAt", "desc"), limit(20));
  const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
    if (isInitialPosts) {
      isInitialPosts = false;
      return;
    }
    clearTimeout(postChangeTimeout);
    postChangeTimeout = setTimeout(() => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const postData = change.doc.data();
          const postCreatedAt = normalizeTimestamp(postData.createdAt);

          // Chỉ tạo thông báo cho bài viết mới từ bạn bè (trong vòng 5 phút)
          if (
            postData.userId !== user.uid &&
            postCreatedAt &&
            Date.now() - postCreatedAt < 300000
          ) {
            createNotificationIfNotExists({
              userId: user.uid,
              type: "friend_post",
              actorId: postData.userId,
              actorName: postData.userName || "Anonymous",
              actorPhoto: postData.userPhoto || null,
              postId: change.doc.id,
              content: `${postData.userName || "Someone"} posted a new article`,
              createdAt: postCreatedAt || Date.now(),
              read: false,
            });
          }
        }
      });
    }, 1000);
  });
  activeListeners.add(unsubscribePosts);

  // Setup friend requests listener - bỏ qua snapshot ban đầu
  let isInitialFriendRequests = true;
  const friendRequestsQuery = query(
    collection(db, "FriendRequests"),
    where("toUserId", "==", user.uid),
    where("status", "==", "pending")
  );

  const unsubscribeFriendRequests = onSnapshot(friendRequestsQuery, (snapshot) => {
    if (isInitialFriendRequests) {
      isInitialFriendRequests = false;
      return;
    }
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
          content: `${requestData.fromUserName || "Người dùng"} sent you a friend request`,
          createdAt: normalizeTimestamp(requestData.createdAt) || Date.now(),
          read: false,
        });
      }
    });
  });
  activeListeners.add(unsubscribeFriendRequests);

  // Setup messages listener - bỏ qua snapshot ban đầu
  let isInitialMessages = true;
  const messagesQuery = query(
    collectionGroup(db, "messages"),
    where("receiverId", "==", user.uid)
  );

  const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    if (isInitialMessages) {
      isInitialMessages = false;
      return;
    }
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const messageData = change.doc.data();
        const msgCreatedAt = normalizeTimestamp(messageData.createdAt);

        // Chỉ tạo thông báo cho tin nhắn mới (trong vòng 5 phút)
        if (
          messageData.senderId !== user.uid &&
          msgCreatedAt &&
          Date.now() - msgCreatedAt < 300000
        ) {
          createNotificationIfNotExists({
            userId: user.uid,
            type: "friend_message",
            actorId: messageData.senderId,
            actorName: messageData.senderName || "Someone",
            actorPhoto: messageData.senderPhoto || null,
            messageId: change.doc.id,
            content: `${messageData.senderName || "Someone"} sent you a message`,
            createdAt: msgCreatedAt || Date.now(),
            read: false,
          });
        }
      }
    });
  });
  activeListeners.add(unsubscribeMessages);

  // Setup blog post listeners - bỏ qua snapshot ban đầu
  let isInitialBlogs = true;
  let blogChangeTimeout;
  const blogsQuery = query(collection(db, "BlogPosts"), orderBy("createdAt", "desc"), limit(20));
  const unsubscribeBlogs = onSnapshot(blogsQuery, (snapshot) => {
    if (isInitialBlogs) {
      isInitialBlogs = false;
      return;
    }
    clearTimeout(blogChangeTimeout);
    blogChangeTimeout = setTimeout(() => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const blogData = change.doc.data();
          const blogCreatedAt = normalizeTimestamp(blogData.createdAt);

          // Chỉ tạo thông báo cho bài viết mới từ người khác (trong vòng 5 phút)
          if (
            blogData.author &&
            blogData.author !== user.uid &&
            blogCreatedAt &&
            Date.now() - blogCreatedAt < 300000
          ) {
            let authorName = "Tác giả";
            let authorPhoto = null;
            try {
              const authorSnap = await getDoc(doc(db, "Users", blogData.author));
              if (authorSnap.exists()) {
                authorName = authorSnap.data().displayName || authorSnap.data().name || "Anonymous";
                authorPhoto = authorSnap.data().photoURL || null;
              }
            } catch (err) {
              console.error("Error fetching blog author details", err);
            }

            createNotificationIfNotExists({
              userId: user.uid,
              type: "new_blog",
              actorId: blogData.author,
              actorName: authorName,
              actorPhoto: authorPhoto,
              blogId: change.doc.id,
              blogSlug: blogData.slug || "",
              content: `${authorName} đã đăng bài viết blog mới: "${blogData.title}"`,
              createdAt: blogCreatedAt || Date.now(),
              read: false,
            });
          }
        }
      });
    }, 1000);
  });
  activeListeners.add(unsubscribeBlogs);

  return { activeListeners };
};
