import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { confirmDialog } from "../utils/confirmDialog";
import { FaReply, FaTimes, FaChevronDown, FaChevronUp, FaRegSmile, FaPaperPlane, FaUser } from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext";
import { db } from "../components/firebase";
import Picker from "emoji-picker-react";
import { LanguageContext } from "../context/LanguageContext";
import { SlLike } from "react-icons/sl";
import { requireLogin } from "../utils/requireLogin";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";
import { notifyPostComment, notifyCommentReply } from "./notification/NotificationUtils";
import { setCachedCommentCount, getCachedCommentCount } from "../utils/postCommentCache";

const REACTIONS = {
  like: { emoji: "👍", label: "Thích" },
  love: { emoji: "❤️", label: "Yêu thích" },
  haha: { emoji: "😂", label: "Haha" },
  wow: { emoji: "😮", label: "Wow" },
  sad: { emoji: "😢", label: "Buồn" },
  angry: { emoji: "😠", label: "Phẫn nộ" },
};

// Safe Avatar component with automatic fallback to FaUser on missing or broken images
const UserAvatar = ({ photo, name, size = "w-10 h-10", iconSize = 18 }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photo]);

  if (!photo || photo === "/default-avatar.png" || hasError) {
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-300 ring-1 ring-black/5 dark:ring-white/10`}
        title={name || "User"}
      >
        <FaUser size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={getOptimizedCloudinaryUrl(photo, 100)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={`${size} rounded-full object-cover flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10`}
    />
  );
};

const ReactionPicker = ({ isOpen, onClose, onSelect, targetRef }) => {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === "light";
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        targetRef.current &&
        !targetRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, targetRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className={`absolute bottom-full left-0 mb-2 flex gap-2 px-3 py-2 rounded-full shadow-2xl z-50 ${
        isLight ? "bg-white border border-gray-200" : "bg-zinc-800 border border-zinc-700"
      }`}
      onMouseLeave={onClose}
    >
      {Object.entries(REACTIONS).map(([type, reaction]) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="text-2xl hover:scale-125 transition-transform"
          title={reaction.label}
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  );
};

const CommentItem = ({
  comment,
  postId,
  auth,
  userDetails,
  isReply = false,
  parentCommentId = null,
  depth = 0,
  onReply,
  forceOpenReplyId,
}) => {
  const { theme } = useContext(ThemeContext);
  const [showReplies, setShowReplies] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const likeButtonRef = useRef(null);
  const isLight = theme === "light";
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  // Auto-expand replies when user submits a reply to this comment
  useEffect(() => {
    if (forceOpenReplyId === comment.id) {
      setShowReplies(true);
    }
  }, [forceOpenReplyId, comment.id]);

  useEffect(() => {
    if (!showReplies || isReply) return undefined;

    setRepliesLoading(true);
    const repliesQuery = query(
      collection(db, "Posts", postId, "comments", comment.id, "replies"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      repliesQuery,
      (snap) => {
        setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setRepliesLoading(false);
      },
      (err) => {
        console.error("Error loading replies:", err);
        setRepliesLoading(false);
      }
    );

    return () => unsub();
  }, [showReplies, postId, comment.id, isReply]);

  const handleReaction = async (reactionType) => {
    const user = requireLogin({
      navigate,
      message: "Vui lòng đăng nhập",
    });
    if (!user) return;

    try {
      const userId = user.uid;
      let targetRef = isReply
        ? doc(db, "Posts", postId, "comments", parentCommentId, "replies", comment.id)
        : doc(db, "Posts", postId, "comments", comment.id);

      const currentReactions = comment.reactions || {};
      const userCurrentReaction = Object.keys(currentReactions).find((type) =>
        currentReactions[type]?.includes(userId)
      );

      let updateData = {};

      if (userCurrentReaction === reactionType) {
        updateData = {
          [`reactions.${reactionType}`]: arrayRemove(userId),
          reactionCount: increment(-1),
        };
      } else {
        updateData = {
          [`reactions.${reactionType}`]: arrayUnion(userId),
          reactionCount: increment(userCurrentReaction ? 0 : 1),
        };
        if (userCurrentReaction) {
          updateData[`reactions.${userCurrentReaction}`] = arrayRemove(userId);
        }
      }

      await updateDoc(targetRef, updateData);
      setShowReactionPicker(false);
    } catch (error) {
      console.error("Comment reaction error:", error);
      toast.error("Không thể thả cảm xúc");
    }
  };

  const handleDelete = async () => {
    const ok = await confirmDialog("Xóa bình luận này?", { confirmText: "Xóa" });
    if (!ok) return;

    try {
      let targetRef = isReply
        ? doc(db, "Posts", postId, "comments", parentCommentId, "replies", comment.id)
        : doc(db, "Posts", postId, "comments", comment.id);

      if (isReply) {
        try {
          await updateDoc(doc(db, "Posts", postId, "comments", parentCommentId), { replyCount: increment(-1) });
        } catch (e) {
          console.warn(e);
        }
        try {
          await updateDoc(doc(db, "Posts", postId), { commentCount: increment(-1) });
          const cur = getCachedCommentCount(postId);
          if (typeof cur === "number") setCachedCommentCount(postId, Math.max(0, cur - 1), true);
        } catch (e) {
          console.warn(e);
        }
      } else {
        const repliesSnapshot = await getDocs(collection(db, "Posts", postId, "comments", comment.id, "replies"));
        await Promise.all(repliesSnapshot.docs.map((replyDocument) => deleteDoc(replyDocument.ref)));
        const deletedCount = 1 + Math.max(comment.replyCount || 0, repliesSnapshot.docs.length);
        try {
          await updateDoc(doc(db, "Posts", postId), { commentCount: increment(-deletedCount) });
          const cur = getCachedCommentCount(postId);
          if (typeof cur === "number") setCachedCommentCount(postId, Math.max(0, cur - deletedCount), true);
        } catch (e) {
          console.warn(e);
        }
      }

      await deleteDoc(targetRef);
      toast.success("Đã xóa!");
    } catch (error) {
      console.error("Delete comment error:", error);
      toast.error("Không thể xóa");
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Vừa xong";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Date.now() - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút`;
    if (hrs < 24) return `${hrs} giờ`;
    if (days < 7) return `${days} ngày`;
    return date.toLocaleDateString("vi-VN");
  };

  const getUserReaction = () => {
    const reactions = comment.reactions || {};
    return Object.keys(reactions).find((type) => reactions[type]?.includes(auth.currentUser?.uid));
  };

  const getTopReactions = () => {
    const reactions = comment.reactions || {};
    return Object.entries(reactions)
      .map(([type, users]) => ({ type, count: users?.length || 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const userReaction = getUserReaction();
  const topReactions = getTopReactions();
  const totalReactions = Object.values(comment.reactions || {}).reduce(
    (sum, users) => sum + (users?.length || 0),
    0
  );
  const marginLeft = depth > 0 ? "ml-10 sm:ml-12" : "";

  return (
    <div className={`${depth > 0 ? marginLeft + " mt-2" : "mb-3"}`}>
      <div className="flex gap-2.5">
        <UserAvatar
          photo={comment.userPhoto}
          name={comment.userName}
          size={depth > 0 ? "w-8 h-8" : "w-9 h-9 sm:w-10 sm:h-10"}
          iconSize={depth > 0 ? 14 : 16}
        />

        <div className="flex-1 min-w-0">
          <div className={`inline-block rounded-2xl px-3.5 py-2 ${isLight ? "bg-gray-100" : "bg-zinc-800"}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`font-semibold text-xs sm:text-sm ${isLight ? "text-gray-900" : "text-white"}`}>
                {comment.userName}
              </span>
              <span className="text-[11px] text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
              {auth.currentUser?.uid === comment.userId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-gray-400 hover:text-red-500 ml-auto p-0.5"
                  title="Xóa bình luận"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
            <p className={`text-sm whitespace-pre-wrap break-words ${isLight ? "text-gray-800" : "text-gray-200"}`}>
              {comment.content}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-1 ml-2">
            <div className="relative">
              <button
                ref={likeButtonRef}
                type="button"
                onMouseEnter={() => setShowReactionPicker(true)}
                onClick={() => !userReaction && handleReaction("like")}
                className={`flex items-center gap-1 transition-colors ${
                  userReaction
                    ? "text-blue-500"
                    : isLight
                    ? "text-gray-600 hover:text-blue-500"
                    : "text-gray-400 hover:text-blue-400"
                }`}
              >
                <span className="text-base">{userReaction ? REACTIONS[userReaction].emoji : <SlLike />}</span>
              </button>

              <ReactionPicker
                isOpen={showReactionPicker}
                onClose={() => setShowReactionPicker(false)}
                onSelect={handleReaction}
                targetRef={likeButtonRef}
              />
            </div>

            {/* Unified Reply Button: activates outer comment bar */}
            <button
              type="button"
              onClick={() =>
                onReply?.({
                  commentId: isReply ? parentCommentId : comment.id,
                  userName: comment.userName,
                  targetUserId: comment.userId,
                })
              }
              className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                isLight ? "text-gray-600 hover:text-blue-500" : "text-gray-400 hover:text-blue-400"
              }`}
            >
              <FaReply size={11} />
              <span>{t("respond") || "Phản hồi"}</span>
            </button>

            {totalReactions > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                {topReactions.map(({ type }) => (
                  <span key={type} className="text-sm">
                    {REACTIONS[type].emoji}
                  </span>
                ))}
                <span className="text-xs text-gray-500">{totalReactions}</span>
              </div>
            )}
          </div>

          {/* Nested Replies list */}
          {comment.replyCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowReplies(!showReplies)}
                className={`text-xs font-semibold flex items-center gap-1 mt-2 ml-2 transition-colors ${
                  isLight ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300"
                }`}
              >
                {showReplies ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                <span>
                  {showReplies ? t("hidden") || "Ẩn" : t("view") || "Xem"} {comment.replyCount}{" "}
                  {t("respond") || "phản hồi"}
                </span>
              </button>

              {showReplies &&
                (repliesLoading && replies.length === 0 ? (
                  <div className="text-xs text-gray-500 py-1.5 ml-4 animate-pulse">Đang tải câu trả lời...</div>
                ) : (
                  replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      auth={auth}
                      userDetails={userDetails}
                      isReply={true}
                      parentCommentId={isReply ? parentCommentId : comment.id}
                      depth={depth + 1}
                      onReply={onReply}
                      forceOpenReplyId={forceOpenReplyId}
                    />
                  ))
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({ postId, postOwnerId, auth, userDetails, isCommentSectionOpen }) => {
  const { theme } = useContext(ThemeContext);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, userName, targetUserId }
  const [forceOpenReplyId, setForceOpenReplyId] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const emojiRef = useRef(null);
  const inputRef = useRef(null);
  const isLight = theme === "light";
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  useEffect(() => {
    if (!isCommentSectionOpen) return;

    setLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, "Posts", postId, "comments"), orderBy("createdAt", "desc")),
      async (snapshot) => {
        let totalCount = snapshot.docs.length;
        const commentsData = await Promise.all(
          snapshot.docs.map(async (commentDoc) => {
            const data = commentDoc.data();
            let replyCount = typeof data.replyCount === "number" ? data.replyCount : 0;
            if (replyCount === 0) {
              try {
                const rSnap = await getDocs(
                  collection(db, "Posts", postId, "comments", commentDoc.id, "replies")
                );
                if (!rSnap.empty) {
                  replyCount = rSnap.docs.length;
                  if (auth.currentUser) {
                    updateDoc(doc(db, "Posts", postId, "comments", commentDoc.id), {
                      replyCount,
                    }).catch(() => {});
                  }
                }
              } catch {}
            }
            totalCount += replyCount;
            return { id: commentDoc.id, ...data, replyCount };
          })
        );

        setComments(commentsData);
        setTotalCommentCount(totalCount);
        setCachedCommentCount(postId, totalCount, true);
        setLoading(false);

        // Self-healing: persist the verified total count to Posts/{postId} so all views see the correct number
        if (auth.currentUser) {
          updateDoc(doc(db, "Posts", postId), { commentCount: totalCount }).catch(() => {});
        }
      },
      (err) => {
        console.error("Error loading comments:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isCommentSectionOpen, postId]);

  const handleReplyTo = useCallback((replyTarget) => {
    setReplyingTo(replyTarget);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting) return;
    if (!requireLogin({ navigate, message: "Vui lòng đăng nhập để bình luận" })) return;

    setIsSubmitting(true);
    const currentReplyingTo = replyingTo;

    try {
      const userDisplayName = userDetails
        ? `${userDetails.firstName || ""}${userDetails.lastName ? " " + userDetails.lastName : ""}`.trim()
        : auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "User";
      const userPhotoUrl = userDetails?.photo || auth.currentUser.photoURL || null;

      if (currentReplyingTo) {
        // Send Reply
        const replyData = {
          userId: auth.currentUser.uid,
          userName: userDisplayName || "User",
          userPhoto: userPhotoUrl,
          content: trimmed,
          createdAt: serverTimestamp(),
          reactions: {},
          reactionCount: 0,
          replyCount: 0,
        };

        await addDoc(
          collection(db, "Posts", postId, "comments", currentReplyingTo.commentId, "replies"),
          replyData
        );

        // Safely update replyCount on comment
        try {
          await updateDoc(doc(db, "Posts", postId, "comments", currentReplyingTo.commentId), {
            replyCount: increment(1),
          });
        } catch (err) {
          console.warn("Could not update comment replyCount:", err);
        }

        // Safely update commentCount on post
        try {
          await updateDoc(doc(db, "Posts", postId), {
            commentCount: increment(1),
          });
          const cur = getCachedCommentCount(postId) ?? totalCommentCount;
          setCachedCommentCount(postId, (cur || 0) + 1, true);
        } catch (err) {
          console.warn("Could not update post commentCount:", err);
        }

        setForceOpenReplyId(currentReplyingTo.commentId);
        toast.success("Đã thêm phản hồi!");

        // Gửi thông báo cho người được phản hồi (nếu không phải chính mình)
        if (currentReplyingTo.targetUserId && currentReplyingTo.targetUserId !== auth.currentUser.uid) {
          notifyCommentReply({
            postId,
            targetUserId: currentReplyingTo.targetUserId,
            commentText: trimmed,
            actorUser: auth.currentUser,
            actorDetails: userDetails,
          }).catch((err) => console.error("notifyCommentReply error:", err));
        }
      } else {
        // Send Comment
        await addDoc(collection(db, "Posts", postId, "comments"), {
          userId: auth.currentUser.uid,
          userName: userDisplayName || "User",
          userPhoto: userPhotoUrl,
          content: trimmed,
          createdAt: serverTimestamp(),
          reactions: {},
          reactionCount: 0,
          replyCount: 0,
        });

        // Safely update commentCount on post
        try {
          await updateDoc(doc(db, "Posts", postId), {
            commentCount: increment(1),
          });
          const cur = getCachedCommentCount(postId) ?? totalCommentCount;
          setCachedCommentCount(postId, (cur || 0) + 1, true);
        } catch (err) {
          console.warn("Could not update post commentCount:", err);
        }

        // Gửi thông báo cho chủ bài viết (nếu không phải chính mình)
        let ownerId = postOwnerId;
        if (!ownerId) {
          try {
            const postSnap = await getDoc(doc(db, "Posts", postId));
            if (postSnap.exists()) {
              ownerId = postSnap.data()?.userId;
            }
          } catch (_) {}
        }
        if (ownerId && ownerId !== auth.currentUser.uid) {
          notifyPostComment({
            postId,
            postOwnerId: ownerId,
            commentText: trimmed,
            actorUser: auth.currentUser,
            actorDetails: userDetails,
          }).catch((err) => console.error("notifyPostComment error:", err));
        }
      }

      // Clear input & reply state cleanly
      setCommentText("");
      setReplyingTo(null);
      setShowEmoji(false);
    } catch (error) {
      console.error("Submit comment/reply error:", error);
      toast.error(currentReplyingTo ? "Không thể gửi phản hồi" : "Không thể gửi bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    const cursorPosition = inputRef.current?.selectionStart || commentText.length;
    const newText = commentText.slice(0, cursorPosition) + emojiData.emoji + commentText.slice(cursorPosition);
    setCommentText(newText);
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = cursorPosition + emojiData.emoji.length;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  if (!isCommentSectionOpen) return null;

  return (
    <div className={`mt-3 border-t ${isLight ? "border-gray-200" : "border-zinc-800"}`}>
      {totalCommentCount > 0 && (
        <div className={`px-4 pt-3 pb-2 text-sm font-semibold ${isLight ? "text-gray-700" : "text-gray-300"}`}>
          {totalCommentCount} {t("comment") || "Bình luận"}
        </div>
      )}

      {loading ? (
        <div className="p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          {t("noCommentsYet") || "Chưa có bình luận nào."}
        </div>
      ) : (
        <div className="p-4 max-h-[420px] overflow-y-auto">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              auth={auth}
              userDetails={userDetails}
              onReply={handleReplyTo}
              forceOpenReplyId={forceOpenReplyId}
            />
          ))}
        </div>
      )}

      {/* Unified Bottom Comment/Reply Bar */}
      <div className={`p-3 sm:p-4 border-t ${isLight ? "border-gray-100 bg-white" : "border-zinc-800 bg-zinc-900/40"}`}>
        {/* Reply Target Banner */}
        {replyingTo && (
          <div
            className={`flex items-center justify-between px-3.5 py-1.5 mb-2.5 rounded-xl text-xs font-medium transition-all ${
              isLight
                ? "bg-blue-50 text-blue-700 border border-blue-100"
                : "bg-blue-950/40 text-blue-300 border border-blue-900/50"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FaReply size={11} className="text-blue-500" />
              <span>
                Đang trả lời <strong>{replyingTo.userName}</strong>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Hủy trả lời"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}

        <div className="flex gap-2.5 items-end">
          <UserAvatar
            photo={userDetails?.photo || auth.currentUser?.photoURL}
            name={auth.currentUser?.displayName}
            size="w-9 h-9 sm:w-10 sm:h-10"
            iconSize={16}
          />

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              disabled={isSubmitting}
              onChange={(e) => {
                if (!auth.currentUser) {
                  requireLogin({ navigate, message: "Vui lòng đăng nhập để bình luận" });
                  return;
                }
                setCommentText(e.target.value);
              }}
              onFocus={() => {
                if (!auth.currentUser) {
                  requireLogin({ navigate, message: "Vui lòng đăng nhập để bình luận" });
                  inputRef.current?.blur();
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
              placeholder={
                replyingTo
                  ? `Trả lời ${replyingTo.userName}...`
                  : auth.currentUser
                  ? t("writeComment") || "Viết bình luận..."
                  : "Vui lòng đăng nhập để bình luận..."
              }
              className={`w-full rounded-full pl-4 pr-24 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isLight ? "bg-gray-100 text-gray-900 placeholder-gray-400" : "bg-zinc-800 text-white placeholder-gray-500"
              }`}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                disabled={isSubmitting}
                className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ${
                  isLight ? "text-gray-600" : "text-gray-400"
                }`}
                title="Chọn biểu tượng cảm xúc"
              >
                <FaRegSmile size={18} />
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!commentText.trim() || isSubmitting}
                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full disabled:opacity-40 transition-colors"
                title="Gửi"
              >
                <FaPaperPlane size={15} />
              </button>
            </div>

            {showEmoji && (
              <div
                ref={emojiRef}
                className="fixed z-50 shadow-2xl rounded-2xl overflow-hidden"
                style={{
                  bottom: "80px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  maxWidth: "calc(100vw - 2rem)",
                }}
              >
                <div className={`rounded-2xl overflow-hidden ${isLight ? "ring-1 ring-gray-200" : "ring-1 ring-gray-700"}`}>
                  <Picker
                    onEmojiClick={handleEmojiClick}
                    theme={isLight ? "light" : "dark"}
                    previewConfig={{ showPreview: false }}
                    searchPlaceHolder="Tìm emoji..."
                    width="350px"
                    height="450px"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
