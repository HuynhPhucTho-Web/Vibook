import React, { useState, useEffect, useContext, useRef } from "react";
import { doc, updateDoc, getDoc, deleteDoc, query, getDocs, onSnapshot, collection } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaComment, FaTrash, FaShare, FaFile, FaTimes, FaEllipsisH, FaEdit, FaLock } from "react-icons/fa";
import CommentSection from "./CommentSection";

const PostItem = ({ post, auth, userDetails, onPostDeleted, handleEditPost, handlePrivatePost }) => {
  const { theme } = useContext(ThemeContext);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const videoRef = useRef(null);

  const isLight = theme === "light";

  // Real-time listeners
  useEffect(() => {
    if (!post.id) return;
    const unsubPost = onSnapshot(doc(db, "Posts", post.id), (snap) => {
      if (snap.exists()) {
        setLocalPost({ ...snap.data(), id: snap.id });
      } else {
        onPostDeleted?.(post.id);
      }
    });
    return () => unsubPost();
  }, [post.id, onPostDeleted]);

  useEffect(() => {
    const unsubComments = onSnapshot(query(collection(db, "Posts", post.id, "comments")), (snap) => {
      setCommentCount(snap.docs.length);
    });
    return () => unsubComments();
  }, [post.id]);

  // Handlers
  const handleReaction = async (postId, reaction) => {
    if (isReacting || !auth.currentUser) return;
    setIsReacting(true);
    try {
      const postRef = doc(db, "Posts", postId);
      const snap = await getDoc(postRef);
      if (!snap.exists()) {
        toast.error("Bài viết không tồn tại");
        return;
      }

      const data = snap.data();
      const userId = auth.currentUser.uid;
      const likes = { ...data.likes };
      const reactedBy = { ...data.reactedBy };

      if (reactedBy[userId]) {
        const prev = reactedBy[userId];
        likes[prev] = Math.max(0, (likes[prev] || 0) - 1);
      }

      if (reactedBy[userId] === reaction) {
        delete reactedBy[userId];
      } else {
        likes[reaction] = (likes[reaction] || 0) + 1;
        reactedBy[userId] = reaction;
      }

      await updateDoc(postRef, { likes, reactedBy });
      setShowReactions(false);
    } catch (error) {
      console.error("React error:", error);
      toast.error("Không thể react");
    } finally {
      setIsReacting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Xóa bài viết này?")) return;
    setIsDeleting(true);
    try {
      const postRef = doc(db, "Posts", post.id);
      const snap = await getDoc(postRef);
      if (!snap.exists() || snap.data().userId !== auth.currentUser?.uid) {
        toast.error("Không thể xóa");
        return;
      }

      const commentsSnap = await getDocs(query(collection(db, "Posts", post.id, "comments")));
      await Promise.all([
        ...commentsSnap.docs.map((d) => deleteDoc(d.ref)),
        deleteDoc(postRef),
      ]);

      toast.success("Đã xóa bài viết");
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi khi xóa");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async (type) => {
    const url = `${window.location.origin}/Post/${post.id}`;
    const text = `${post.userName}: ${post.content}\n\n${url}`;

    try {
      switch (type) {
        case "copy":
          await navigator.clipboard.writeText(url);
          toast.success("Đã copy link");
          break;
        case "copyWithContent":
          await navigator.clipboard.writeText(text);
          toast.success("Đã copy nội dung");
          break;
        case "native":
          if (navigator.share) {
            await navigator.share({ title: `Post by ${post.userName}`, text: post.content, url });
          } else {
            await navigator.clipboard.writeText(text);
            toast.success("Đã copy");
          }
          break;
        default:
          await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Không thể chia sẻ");
    }
    setShowShareMenu(false);
  };

  // Helper functions
  const reactions = {
    Like: "👍",
    Love: "❤️",
    Haha: "😂",
    Wow: "😮",
    Sad: "😢",
    Angry: "😠",
  };

  const getMediaFiles = () => {
    if (localPost.mediaFiles?.length) return localPost.mediaFiles;
    if (localPost.mediaUrl) {
      return [{ url: localPost.mediaUrl, category: getMediaCategory(localPost.mediaUrl) }];
    }
    return [];
  };

  const getMediaCategory = (url) => {
    if (!url) return "unknown";
    if (/\.(jpg|jpeg|png|gif|webp)/i.test(url) || url.includes("/image/")) return "image";
    if (/\.(mp4|webm|ogg)/i.test(url) || url.includes("/video/")) return "video";
    if (/\.(pdf|doc|docx)/i.test(url) || url.includes("/raw/")) return "document";
    return "unknown";
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút`;
    if (hrs < 24) return `${hrs} giờ`;
    if (days < 7) return `${days} ngày`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
  };

  const currentReaction = localPost.reactedBy?.[auth.currentUser?.uid];
  const totalReactions = Object.values(localPost.likes || {}).reduce((s, c) => s + c, 0);

  return (
    <div
      className={`rounded-3xl mb-4 overflow-hidden transition-all ${
        isLight
          ? "bg-white border border-gray-100 shadow-sm hover:shadow-md"
          : "bg-zinc-900 border border-zinc-800 shadow-lg"
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={localPost.userPhoto || "https://via.placeholder.com/48"}
            alt={localPost.userName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-gray-200"
          />
          <div>
            <p className={`font-semibold text-base ${isLight ? "text-gray-900" : "text-white"}`}>
              {localPost.userName}
            </p>
            <p className="text-sm text-gray-500">{formatTimeAgo(localPost.createdAt)}</p>
          </div>
        </div>

        {localPost.userId === auth.currentUser?.uid && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isDeleting}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                isLight ? "hover:bg-gray-100" : "hover:bg-zinc-800"
              }`}
            >
              {isDeleting ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <FaEllipsisH className={isLight ? "text-gray-600" : "text-gray-400"} />
              )}
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl z-20 py-2 ${
                    isLight ? "bg-white border border-gray-100" : "bg-zinc-800 border border-zinc-700"
                  }`}
                >
                  <button
                    onClick={() => {
                      handleEditPost();
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                  >
                    <FaEdit /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      handlePrivatePost();
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                  >
                    <FaLock /> Riêng tư
                  </button>
                  <button
                    onClick={() => {
                      handleDeletePost();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <FaTrash /> Xóa
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {localPost.content && (
        <div className={`px-4 pb-3 ${isLight ? "text-gray-800" : "text-gray-100"}`}>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{localPost.content}</p>
        </div>
      )}

      {/* Media */}
      {getMediaFiles().length > 0 && (
        <div className={getMediaFiles().length === 1 ? "" : "px-4 pb-3"}>
          <div className={getMediaFiles().length === 1 ? "" : "grid grid-cols-2 gap-2"}>
            {getMediaFiles().map((item, idx) => {
              if (item.category === "image") {
                return (
                  <img
                    key={idx}
                    src={item.url}
                    alt={item.originalName || "Image"}
                    className={`w-full cursor-pointer hover:opacity-95 transition-opacity ${
                      getMediaFiles().length === 1 
                        ? "object-contain max-h-[600px]" 
                        : "rounded-xl object-cover aspect-square"
                    }`}
                    onClick={() => window.open(item.url, "_blank")}
                    style={getMediaFiles().length === 1 ? { display: "block" } : {}}
                  />
                );
              }
              if (item.category === "video") {
                return (
                  <video
                    key={idx}
                    ref={videoRef}
                    controls
                    className={`w-full ${
                      getMediaFiles().length === 1 
                        ? "max-h-[600px] object-contain" 
                        : "rounded-xl aspect-video object-cover"
                    }`}
                    onMouseEnter={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    onMouseLeave={() => {
                      if (videoRef.current) videoRef.current.pause();
                    }}
                  >
                    <source src={item.url} type="video/mp4" />
                  </video>
                );
              }
              if (item.category === "document") {
                return (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isLight
                        ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        : "bg-zinc-800 border-zinc-700 hover:bg-zinc-750"
                    }`}
                  >
                    <FaFile className="text-blue-500" size={20} />
                    <span className={`text-sm truncate ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                      {item.originalName || "Document"}
                    </span>
                  </a>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      {(totalReactions > 0 || commentCount > 0) && (
        <div className="px-4 pb-2 flex items-center justify-between text-sm">
          {totalReactions > 0 && (
            <div className="flex items-center gap-2">
              {Object.entries(localPost.likes || {})
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([reaction]) => (
                  <span key={reaction} className="text-lg">
                    {reactions[reaction]}
                  </span>
                ))}
              <span className={isLight ? "text-gray-600" : "text-gray-400"}>{totalReactions}</span>
            </div>
          )}
          {commentCount > 0 && (
            <button
              onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
              className="text-gray-500 hover:text-blue-500 transition-colors"
            >
              {commentCount} bình luận
            </button>
          )}
        </div>
      )}

      {/* Divider */}
      <div className={`mx-4 border-t ${isLight ? "border-gray-100" : "border-zinc-800"}`} />

      {/* Actions */}
      <div className="p-2 flex items-center justify-around">
        {/* Like */}
        <div className="relative flex-1">
          <button
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setTimeout(() => setShowReactions(false), 200)}
            onClick={() => handleReaction(post.id, "Like")}
            disabled={isReacting}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              currentReaction
                ? "text-blue-500 font-semibold"
                : isLight
                ? "text-gray-600 hover:bg-gray-50"
                : "text-gray-400 hover:bg-zinc-800"
            }`}
          >
            <span className="text-lg">{currentReaction ? reactions[currentReaction] : "👍"}</span>
            <span className="text-sm">{currentReaction || "Thích"}</span>
          </button>

          {showReactions && (
            <div
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-2 px-3 py-2 rounded-full shadow-xl z-30 ${
                isLight ? "bg-white border border-gray-200" : "bg-zinc-800 border border-zinc-700"
              }`}
            >
              {Object.entries(reactions).map(([key, icon]) => (
                <button
                  key={key}
                  onClick={() => handleReaction(post.id, key)}
                  className="text-2xl hover:scale-125 transition-transform"
                  disabled={isReacting}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment */}
        <button
          onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            selectedPostId === post.id
              ? "text-blue-500 font-semibold"
              : isLight
              ? "text-gray-600 hover:bg-gray-50"
              : "text-gray-400 hover:bg-zinc-800"
          }`}
        >
          <FaComment />
          <span className="text-sm">Bình luận</span>
        </button>

        {/* Share */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              showShareMenu
                ? "text-blue-500 font-semibold"
                : isLight
                ? "text-gray-600 hover:bg-gray-50"
                : "text-gray-400 hover:bg-zinc-800"
            }`}
          >
            <FaShare />
            <span className="text-sm">Chia sẻ</span>
          </button>

          {showShareMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowShareMenu(false)} />
              <div
                className={`absolute right-0 bottom-full mb-2 w-56 rounded-2xl shadow-xl z-30 py-2 ${
                  isLight ? "bg-white border border-gray-100" : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                <button
                  onClick={() => handleShare("copy")}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                  }`}
                >
                  Copy link
                </button>
                <button
                  onClick={() => handleShare("copyWithContent")}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                  }`}
                >
                  Copy nội dung
                </button>
                {navigator.share && (
                  <button
                    onClick={() => handleShare("native")}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                  >
                    Chia sẻ hệ thống
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comments */}
      {selectedPostId === post.id && (
        <CommentSection
          postId={post.id}
          auth={auth}
          userDetails={userDetails}
          isCommentSectionOpen={true}
          toggleCommentSection={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
};

export default PostItem;