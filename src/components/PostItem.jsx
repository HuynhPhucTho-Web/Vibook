 import React, { useState, useEffect, useContext, useRef } from "react";
import { addDoc, doc, updateDoc, getDoc, deleteDoc, query, getDocs, onSnapshot, collection } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaComment, FaTrash, FaShare, FaFile, FaTimes, FaEllipsisH, FaEdit, FaLock } from "react-icons/fa";
import CommentSection from "./CommentSection";
import { Link } from "react-router-dom";
import "../style/PostItem.css";

const PostItem = ({ post, auth, userDetails, onPostDeleted, handleEditPost, handlePrivatePost, isDetailView = false, customBgColor = '' }) => {
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
  const [authorName, setAuthorName] = useState(localPost.userName || "");

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


  const handleRepostToTimeline = async () => {
    if (!auth?.currentUser) {
      toast.error("Bạn cần đăng nhập để chia sẻ");
      return;
    }
    try {
      const me = auth.currentUser;
      // Tạo post mới thuộc về người đang share
      await addDoc(collection(db, "Posts"), {
        userId: me.uid,
        userName: me.displayName || "Anonymous",
        userPhoto: me.photoURL || null,
        type: "share",
        content: "",             // cho phép người dùng chỉnh nội dung ở chỗ khác nếu muốn
        createdAt: Date.now(),   // hoặc serverTimestamp(), miễn rules không chặn
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
        // Trỏ về bài gốc để UI có thể hiển thị “đây là bài chia sẻ từ…”
        sharedFrom: {
          postId: localPost.id,
          userId: localPost.userId,
          userName: authorName || localPost.userName || "Anonymous",
        },
        // Nếu post gốc dùng mediaFiles:
        mediaFiles: Array.isArray(localPost.mediaFiles) ? localPost.mediaFiles : undefined,
        // Nếu post gốc dùng mediaUrls:
        mediaUrls: Array.isArray(localPost.mediaUrls) ? localPost.mediaUrls : undefined,
        status: "public",
      });
      toast.success("Đã chia sẻ lên trang cá nhân!");
      setShowShareMenu(false);
    } catch (e) {
      console.error("repost error", e);
      toast.error("Chia sẻ thất bại");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Nếu đã có sẵn trong post thì dùng luôn
        if (localPost.userName && localPost.userPhoto) {
          if (mounted) {
            setAuthorName(localPost.userName);
          }
          return;
        }
        // Fetch từ Users/{userId} nếu thiếu
        if (localPost.userId) {
          const snap = await getDoc(doc(db, "Users", localPost.userId));
          if (mounted && snap.exists()) {
            const u = snap.data();
            setAuthorName(u.displayName || u.name || "Anonymous");
          }
        }
      } catch (e) {
        // bỏ qua lỗi: fallback phía dưới sẽ hiển thị "Anonymous"
        console.log("fetch author error", e);
      }
    })();
    return () => { mounted = false; };
  }, [localPost.userId, localPost.userName, localPost.userPhoto]);

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

  // giữ popup reaction mở khi rê chuột giữa nút và popup
  const hoverTimerRef = useRef(null);

  const openReactions = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowReactions(true);
  };

  const closeReactionsDelayed = (delay = 160) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowReactions(false);
      hoverTimerRef.current = null;
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);



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
      id={`post-${post.id}`}
      className={`post-item-container ${isLight ? 'light' : 'dark'} ${!isDetailView ? "mb-3 sm:mb-4" : ""}`}
      style={customBgColor ? { backgroundColor: customBgColor } : {}}
    >
      {/* Header */}
      <div className="post-item-header">
        <div className="post-item-author">
          <Link to={`/profile/${localPost.userId}`} className="no-underline hover:no-underline">
            <img
              src={localPost.userPhoto || "/default-avatar.png"}
              alt={localPost.userName}
              className="post-item-avatar"
            />
          </Link>

          <div>
            <Link to={`/profile/${localPost.userId}`} className="no-underline hover:no-underline">
              <p className={`font-semibold text-base ${isLight ? "text-gray-900" : "text-white"}`}>
                {localPost.userName}
              </p>
            </Link>
            <p className="text-sm text-gray-500">{formatTimeAgo(localPost.createdAt)}</p>
          </div>
        </div>

        {localPost.userId === auth.currentUser?.uid && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isDeleting}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${isLight ? "hover:bg-gray-100" : "hover:bg-zinc-800"
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
                  className={`absolute right-0 mt-2 w-48 max-w-[90vw] rounded-2xl shadow-xl z-20 py-2 ${isLight ? "bg-white border border-gray-100" : "bg-zinc-800 border border-zinc-700"
                    }`}
                >
                  <button
                    onClick={() => {
                      handleEditPost();
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                      }`}
                  >
                    <FaEdit /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      handlePrivatePost();
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
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
        <div className={`post-item-content ${isLight ? "text-gray-800" : "text-gray-100"}`}>
          <p>{localPost.content}</p>
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
                    className={`w-full cursor-pointer hover:opacity-95 transition-opacity ${getMediaFiles().length === 1
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
                    className={`w-full ${getMediaFiles().length === 1
                      ? "max-h-[600px] object-contain"
                      : "rounded-xl aspect-video object-cover"
                      }`}
                    onMouseEnter={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.play().catch(() => { });
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
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isLight
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
      <div className="post-item-actions">
        {/* Like */}
        <div
          className="relative flex-1"
          onMouseEnter={openReactions}
          onMouseLeave={() => closeReactionsDelayed(160)}
        >
          <button
            onClick={() => handleReaction(post.id, "Like")}
            disabled={isReacting}
            className={`post-item-action-btn ${currentReaction
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
              onMouseEnter={openReactions}
              onMouseLeave={() => closeReactionsDelayed(160)}
              className={`absolute left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 rounded-full shadow-xl z-30 max-w-[calc(100vw-2rem)] ${isLight ? "bg-white border border-gray-200" : "bg-zinc-800 border border-zinc-700"
                }`}
              style={{ bottom: "calc(100% + 8px)" }}
            >
              {Object.entries(reactions).map(([key, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(post.id, key);
                    setShowReactions(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform"
                  disabled={isReacting}
                  aria-label={key}
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
          className={`post-item-action-btn ${selectedPostId === post.id
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
            className={`post-item-action-btn ${showShareMenu
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
              <div className={`absolute right-0 bottom-full mb-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl z-30 py-2 ${isLight ? "bg-white border border-gray-100" : "bg-zinc-800 border border-zinc-700"
                }`}>
                <button
                  onClick={() => handleShare("copy")}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                >
                  Copy link
                </button>

                <button
                  onClick={() => handleShare("copyWithContent")}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                >
                  Copy nội dung
                </button>

                {navigator.share && (
                  <button
                    onClick={() => handleShare("native")}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                      }`}
                  >
                    Chia sẻ hệ thống
                  </button>
                )}

                {/* 👉 Thêm item share lên trang cá nhân */}
                <button
                  onClick={handleRepostToTimeline}
                  className="w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Chia sẻ lên trang cá nhân
                </button>
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
