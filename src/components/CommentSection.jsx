import React, { useState, useEffect, useContext, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { toast } from "react-toastify";
import { FaReply, FaTimes, FaChevronDown, FaChevronUp, FaRegSmile, FaPaperPlane } from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext";
import { db } from "../components/firebase";
import Picker from "emoji-picker-react";
import { LanguageContext } from "../context/LanguageContext";
import { SlLike } from "react-icons/sl";

const REACTIONS = {
  like: { emoji: "👍", label: "Thích" },
  love: { emoji: "❤️", label: "Yêu thích" },
  haha: { emoji: "😂", label: "Haha" },
  wow: { emoji: "😮", label: "Wow" },
  sad: { emoji: "😢", label: "Buồn" },
  angry: { emoji: "😠", label: "Phẫn nộ" }
};

const ReactionPicker = ({ isOpen, onClose, onSelect, targetRef }) => {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === "light";
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) && 
          targetRef.current && !targetRef.current.contains(e.target)) {
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

const ReplyInput = ({ commentId, postId, auth, userDetails, onCancel, onSuccess, replyToName }) => {
  const { theme } = useContext(ThemeContext);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);
  const inputRef = useRef(null);
  const isLight = theme === "light";

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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const replyData = {
        userId: auth.currentUser.uid,
        userName: userDetails
          ? `${userDetails.firstName}${userDetails.lastName ? " " + userDetails.lastName : ""}`
          : auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "User",
        userPhoto: userDetails?.photo || auth.currentUser.photoURL || "/default-avatar.png",
        content: replyText.trim(),
        createdAt: serverTimestamp(),
        reactions: {},
        reactionCount: 0,
        replyCount: 0
      };

      await addDoc(collection(db, "Posts", postId, "comments", commentId, "replies"), replyData);
      await updateDoc(doc(db, "Posts", postId, "comments", commentId), { replyCount: increment(1) });

      setReplyText("");
      toast.success("Đã thêm phản hồi!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Không thể thêm phản hồi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    const cursorPosition = inputRef.current?.selectionStart || replyText.length;
    const newText = replyText.slice(0, cursorPosition) + emojiData.emoji + replyText.slice(cursorPosition);
    setReplyText(newText);
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = cursorPosition + emojiData.emoji.length;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="mt-2 ml-12">
      <div className="flex gap-2 items-end">
        <img
          src={userDetails?.photo || auth.currentUser?.photoURL || "/default-avatar.png"}
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={replyToName ? `Phản hồi ${replyToName}...` : "Viết phản hồi..."}
            className={`w-full rounded-full pl-4 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLight ? "bg-gray-100" : "bg-zinc-800"
            }`}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ${
                isLight ? "text-gray-600" : "text-gray-400"
              }`}
            >
              <FaRegSmile size={16} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!replyText.trim() || isSubmitting}
              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full disabled:opacity-50 transition-colors"
            >
              <FaPaperPlane size={14} />
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
                maxWidth: "calc(100vw - 2rem)"
              }}
            >
              <div className={`rounded-2xl overflow-hidden ${isLight ? 'ring-1 ring-gray-200' : 'ring-1 ring-gray-700'}`}>
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
        <button
          onClick={onCancel}
          className={`px-3 py-1.5 rounded-lg text-xs ${
            isLight ? "hover:bg-gray-200 text-gray-600" : "hover:bg-zinc-700 text-gray-400"
          }`}
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

const CommentItem = ({ comment, postId, auth, userDetails, isReply = false, parentCommentId = null, depth = 0 }) => {
  const { theme } = useContext(ThemeContext);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const likeButtonRef = useRef(null);
  const isLight = theme === "light";
  
  const handleReaction = async (reactionType) => {
    if (!auth.currentUser) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      let targetRef = isReply
        ? doc(db, "Posts", postId, "comments", parentCommentId, "replies", comment.id)
        : doc(db, "Posts", postId, "comments", comment.id);

      const currentReactions = comment.reactions || {};
      const userCurrentReaction = Object.keys(currentReactions).find(type =>
        currentReactions[type]?.includes(userId)
      );

      let updateData = {};

      if (userCurrentReaction === reactionType) {
        updateData = {
          [`reactions.${reactionType}`]: arrayRemove(userId),
          reactionCount: increment(-1)
        };
      } else {
        updateData = {
          [`reactions.${reactionType}`]: arrayUnion(userId),
          reactionCount: increment(userCurrentReaction ? 0 : 1)
        };
        if (userCurrentReaction) {
          updateData[`reactions.${userCurrentReaction}`] = arrayRemove(userId);
        }
      }

      await updateDoc(targetRef, updateData);
      setShowReactionPicker(false);
    } catch (error) {
      console.error(error);
      toast.error("Không thể thả cảm xúc");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Xóa bình luận này?")) return;

    try {
      let targetRef = isReply
        ? doc(db, "Posts", postId, "comments", parentCommentId, "replies", comment.id)
        : doc(db, "Posts", postId, "comments", comment.id);

      if (isReply) {
        await updateDoc(doc(db, "Posts", postId, "comments", parentCommentId), { replyCount: increment(-1) });
      }

      await deleteDoc(targetRef);
      toast.success("Đã xóa!");
    } catch (error) {
      console.error(error);
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
    return Object.keys(reactions).find(type =>
      reactions[type]?.includes(auth.currentUser?.uid)
    );
  };

  const getTopReactions = () => {
    const reactions = comment.reactions || {};
    return Object.entries(reactions)
      .map(([type, users]) => ({ type, count: users?.length || 0 }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const userReaction = getUserReaction();
  const topReactions = getTopReactions();
  const totalReactions = Object.values(comment.reactions || {}).reduce((sum, users) => sum + (users?.length || 0), 0);
  const marginLeft = depth > 0 ? "ml-12" : "";
  const { t } = useContext(LanguageContext);

  return (
    <div className={`${depth > 0 ? marginLeft + " mt-2" : "mb-3"}`}>
      <div className="flex gap-2">
        <img
          src={comment.userPhoto || "/default-avatar.png"}
          alt="Avatar"
          className={`${depth > 0 ? "w-8 h-8" : "w-10 h-10"} rounded-full object-cover flex-shrink-0`}
        />
        <div className="flex-1 min-w-0">
          <div className={`inline-block rounded-2xl px-3 py-2 ${
            isLight ? "bg-gray-100" : "bg-zinc-800"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold text-sm ${isLight ? "text-gray-900" : "text-white"}`}>
                {comment.userName}
              </span>
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
              {auth.currentUser?.uid === comment.userId && (
                <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 ml-auto">
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
                onMouseEnter={() => setShowReactionPicker(true)}
                onClick={() => !userReaction && handleReaction("like")}
                className={`flex items-center gap-1 transition-colors ${
                  userReaction ? "text-blue-500" : isLight ? "text-gray-600 hover:text-blue-500" : "text-gray-400 hover:text-blue-400"
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

            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className={`text-xs font-medium flex items-center gap-1 ${
                isLight ? "text-gray-600 hover:text-blue-500" : "text-gray-400 hover:text-blue-400"
              }`}
            >
              <FaReply size={12} />
              <span>{t("respond")}</span>
            </button>

            {totalReactions > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                {topReactions.map(({ type }) => (
                  <span key={type} className="text-sm">{REACTIONS[type].emoji}</span>
                ))}
                <span className="text-xs text-gray-500">{totalReactions}</span>
              </div>
            )}
          </div>

          {showReplyInput && (
            <ReplyInput
              commentId={isReply ? parentCommentId : comment.id}
              postId={postId}
              auth={auth}
              userDetails={userDetails}
              replyToName={comment.userName}
              onCancel={() => setShowReplyInput(false)}
              onSuccess={() => {
                setShowReplyInput(false);
                setShowReplies(true);
              }}
            />
          )}

          {comment.replyCount > 0 && (
            <>
              <button
                onClick={() => setShowReplies(!showReplies)}
                className={`text-xs font-medium flex items-center gap-1 mt-2 ml-2 ${
                  isLight ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300"
                }`}
              >
                {showReplies ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                <span>{showReplies ? t("hidden") : t("view")} {comment.replyCount} {t("respond")} </span>
              </button>

              {showReplies && comment.replies?.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  auth={auth}
                  userDetails={userDetails}
                  isReply={true}
                  parentCommentId={isReply ? parentCommentId : comment.id}
                  depth={depth + 1}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CommentSection = ({ postId, auth, userDetails, isCommentSectionOpen }) => {
  const { theme } = useContext(ThemeContext);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const emojiRef = useRef(null);
  const inputRef = useRef(null);
  const isLight = theme === "light";
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
        const commentsData = [];
        let totalCount = snapshot.docs.length;

        for (const commentDoc of snapshot.docs) {
          const commentData = { id: commentDoc.id, ...commentDoc.data(), replies: [] };
          totalCount += commentData.replyCount || 0;

          onSnapshot(
            query(collection(db, "Posts", postId, "comments", commentDoc.id, "replies"), orderBy("createdAt", "asc")),
            (repliesSnap) => {
              commentData.replies = repliesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              setComments(prev => prev.map(c => c.id === commentDoc.id ? { ...c, replies: commentData.replies } : c));
            }
          );

          commentsData.push(commentData);
        }
        setComments(commentsData);
        setTotalCommentCount(totalCount);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isCommentSectionOpen, postId]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addDoc(collection(db, "Posts", postId, "comments"), {
        userId: auth.currentUser.uid,
        userName: userDetails
          ? `${userDetails.firstName}${userDetails.lastName ? " " + userDetails.lastName : ""}`
          : auth.currentUser.displayName || "User",
        userPhoto: userDetails?.photo || auth.currentUser.photoURL || "/default-avatar.png",
        content: commentText.trim(),
        createdAt: serverTimestamp(),
        reactions: {},
        reactionCount: 0,
        replyCount: 0
      });

      setCommentText("");
      toast.success("Đã thêm bình luận!");
    } catch (error) {
      console.error(error);
      toast.error("Không thể thêm bình luận");
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
    <div className={`border-t ${isLight ? "border-gray-100" : "border-zinc-800"}`}>
      {totalCommentCount > 0 && (
        <div className={`px-4 pt-3 pb-2 text-sm font-semibold ${isLight ? "text-gray-700" : "text-gray-300"}`}>
          {totalCommentCount} {t("comment")}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
        </div>
      ) : (
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              auth={auth}
              userDetails={userDetails}
            />
          ))}
        </div>
      )}

      <div className={`p-4 border-t ${isLight ? "border-gray-100" : "border-zinc-800"}`}>
        <div className="flex gap-2 items-end">
          <img
            src={userDetails?.photo || auth.currentUser?.photoURL || "/default-avatar.png"}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit(e)}
              placeholder={t("writeComment")}
              className={`w-full rounded-full pl-4 pr-24 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isLight ? "bg-gray-100" : "bg-zinc-800"
              }`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ${
                  isLight ? "text-gray-600" : "text-gray-400"
                }`}
              >
                <FaRegSmile size={18} />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!commentText.trim()}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full disabled:opacity-50 transition-colors"
              >
                <FaPaperPlane size={16} />
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
                  maxWidth: "calc(100vw - 2rem)"
                }}
              >
                <div className={`rounded-2xl overflow-hidden ${isLight ? 'ring-1 ring-gray-200' : 'ring-1 ring-gray-700'}`}>
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