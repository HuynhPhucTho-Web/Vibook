import {
  collection,
  collectionGroup,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../components/firebase";

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
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

const processedNotifications = new Set();

export const createNotificationIfNotExists = async (notificationData) => {
  if (!notificationData || !notificationData.userId) return;

  // Không gửi thông báo cho chính mình
  if (notificationData.actorId && notificationData.userId === notificationData.actorId) {
    return;
  }

  const uniqueId = notificationData.requestId || notificationData.messageId || notificationData.postId || notificationData.blogId || 'global';
  const notificationKey = `${notificationData.type}_${notificationData.userId}_${notificationData.actorId}_${uniqueId}_${Math.floor((notificationData.createdAt || Date.now()) / 60000)}`;

  if (processedNotifications.has(notificationKey)) {
    return; // Đã xử lý trong phút này, bỏ qua để tránh spam
  }

  processedNotifications.add(notificationKey);

  try {
    // CHỈ kiểm tra trùng lặp trong DB nếu người đang đăng nhập là chủ sở hữu của thông báo đó.
    // (Firestore security rules chỉ cho phép chủ sở hữu đọc collection Notifications của mình,
    // nếu người dùng A truy vấn Notifications của người dùng B sẽ bị Permission Denied).
    const currentUid = auth.currentUser?.uid;
    if (currentUid && notificationData.userId === currentUid) {
      let q = null;
      if (notificationData.type === "friend_request" && notificationData.requestId) {
        q = query(
          collection(db, "Notifications"),
          where("userId", "==", notificationData.userId),
          where("type", "==", "friend_request"),
          where("requestId", "==", notificationData.requestId)
        );
      } else if (notificationData.type === "friend_message" && notificationData.messageId) {
        q = query(
          collection(db, "Notifications"),
          where("userId", "==", notificationData.userId),
          where("type", "==", "friend_message"),
          where("messageId", "==", notificationData.messageId)
        );
      } else if (notificationData.type === "friend_post" && notificationData.postId) {
        q = query(
          collection(db, "Notifications"),
          where("userId", "==", notificationData.userId),
          where("type", "==", "friend_post"),
          where("postId", "==", notificationData.postId)
        );
      } else if ((notificationData.type === "post_tag" || notificationData.type === "share_tag") && notificationData.postId) {
        q = query(
          collection(db, "Notifications"),
          where("userId", "==", notificationData.userId),
          where("type", "==", notificationData.type),
          where("postId", "==", notificationData.postId)
        );
      } else if (notificationData.type === "new_blog" && notificationData.blogId) {
        q = query(
          collection(db, "Notifications"),
          where("userId", "==", notificationData.userId),
          where("type", "==", "new_blog"),
          where("blogId", "==", notificationData.blogId)
        );
      }

      if (q) {
        const snap = await getDocs(q);
        if (!snap.empty) {
          return; // Đã tồn tại trong DB, không tạo lại
        }
      }
    }

    await addDoc(collection(db, "Notifications"), {
      ...notificationData,
      read: false,
      createdAt: notificationData.createdAt || Date.now(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    // Remove from processed set nếu lỗi để có thể thử lại
    processedNotifications.delete(notificationKey);
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
    collectionGroup(db, "messages"),
    where("receiverId", "==", user.uid)
  );

  const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const messageData = change.doc.data();

        // Chỉ tạo thông báo cho tin nhắn mới (trong vòng 5 phút)
        if (messageData.senderId !== user.uid &&
          messageData.createdAt &&
          (Date.now() - messageData.createdAt) < 300000) {

          createNotificationIfNotExists({
            userId: user.uid,
            type: "friend_message",
            actorId: messageData.senderId,
            actorName: messageData.senderName || "Someone",
            actorPhoto: messageData.senderPhoto || null,
            messageId: change.doc.id,
            content: `${messageData.senderName || "Someone"} sent you a message`,
            createdAt: Date.now(),
            read: false,
          });
        }
      }
    });
  });
  activeListeners.add(unsubscribeMessages);

  // Setup blog post listeners
  let blogChangeTimeout;
  const blogsQuery = query(collection(db, "BlogPosts"), orderBy("createdAt", "desc"), limit(20));
  const unsubscribeBlogs = onSnapshot(blogsQuery, (snapshot) => {
    clearTimeout(blogChangeTimeout);
    blogChangeTimeout = setTimeout(() => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const blogData = change.doc.data();
          const blogCreatedAt = blogData.createdAt?.toDate ? blogData.createdAt.toDate() : (blogData.createdAt instanceof Date ? blogData.createdAt : new Date(blogData.createdAt));

          // Chỉ tạo thông báo cho bài viết mới từ người khác (trong vòng 5 phút)
          if (blogData.author && 
              blogData.author !== user.uid &&
              blogCreatedAt &&
              (Date.now() - blogCreatedAt.getTime()) < 300000) {

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
              createdAt: Date.now(),
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
