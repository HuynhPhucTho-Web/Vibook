import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  query,
  getDocs,
  onSnapshot,
  collection,
} from "firebase/firestore";
import { db } from "../../components/firebase";
import { ThemeContext } from "../../context/ThemeContext";
import {
  FaComment,
  FaTrash,
  FaShare,
  FaFile,
  FaEllipsisH,
  FaEdit,
  FaLock,
} from "react-icons/fa";

/** helpers */
const isVideo = (url = "") =>
  /\.(mp4|webm|ogg|m4v)$/i.test(url) || url.includes("/video/");
const isDoc = (url = "") =>
  /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/i.test(url) || url.includes("/raw/");
const timeAgo = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ`;
    const day = Math.floor(h / 24);
    if (day < 7) return `${day} ngày`;
    return d.toLocaleString("vi-VN");
  } catch {
    return "";
  }
};

export default function GroupPostItem({
  post,          // { id, groupId, ... }
  groupId,       // string
  auth,          // firebase auth instance
  onPostDeleted, // optional callback(postId)
  onEditPost,    // optional callback(post)
  onPrivatePost, // optional callback(post)
}) {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === "light";

  const [localPost, setLocalPost] = useState(post);
  const [commentCount, setCommentCount] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [openComments, setOpenComments] = useState(false);

  const menuRef = useRef(null);
  const btnRef = useRef(null);

  /** realtime post & comments */
  useEffect(() => {
    if (!post?.id || !groupId) return;

    const unsubPost = onSnapshot(
      doc(db, "Groups", groupId, "Posts", post.id),
      (snap) => {
        if (snap.exists()) setLocalPost({ id: snap.id, groupId, ...snap.data() });
        else onPostDeleted?.(post.id);
      }
    );

    const unsubCmt = onSnapshot(
      query(collection(db, "Groups", groupId, "Posts", post.id, "comments")),
      (snap) => setCommentCount(snap.size)
    );

    return () => {
      unsubPost();
      unsubCmt();
    };
  }, [post?.id, groupId, onPostDeleted]);

  /** close menus outside */
  useEffect(() => {
    const onDown = (e) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (showShare && !e.target.closest?.(".share-menu")) setShowShare(false);
    };
    const onEsc = (e) => e.key === "Escape" && (setShowMenu(false), setShowShare(false), setShowReactions(false));
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showMenu, showShare]);

  /** media list: hỗ trợ cả mediaUrls (group) & mediaFiles (newsfeed) */
  const media = useMemo(() => {
    if (Array.isArray(localPost.mediaUrls)) {
      return localPost.mediaUrls.map((url) => ({ url, category: isVideo(url) ? "video" : isDoc(url) ? "document" : "image" }));
    }
    if (Array.isArray(localPost.mediaFiles)) return localPost.mediaFiles; // {url, category, ...}
    if (localPost.mediaUrl)
      return [{ url: localPost.mediaUrl, category: isVideo(localPost.mediaUrl) ? "video" : "image" }];
    return [];
  }, [localPost]);

  /** reactions */
  const reactions = {
    Like: "👍",
    Love: "❤️",
    Haha: "😂",
    Wow: "😮",
    Sad: "😢",
    Angry: "😠",
  };
  const currentReaction = localPost.reactedBy?.[auth?.currentUser?.uid];
  const totalReactions = Object.values(localPost.likes || {}).reduce((s, c) => s + c, 0);

  const handleReaction = async (reaction) => {
    if (isReacting || !auth?.currentUser) return;
    setIsReacting(true);
    try {
      const ref = doc(db, "Groups", groupId, "Posts", post.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      const uid = auth.currentUser.uid;
      const likes = { ...data.likes };
      const reactedBy = { ...data.reactedBy };

      if (reactedBy[uid]) {
        const prev = reactedBy[uid];
        likes[prev] = Math.max(0, (likes[prev] || 0) - 1);
      }
      if (reactedBy[uid] === reaction) {
        delete reactedBy[uid];
      } else {
        likes[reaction] = (likes[reaction] || 0) + 1;
        reactedBy[uid] = reaction;
      }
      await updateDoc(ref, { likes, reactedBy });
      setShowReactions(false);
    } catch (e) {
      console.error(e);
      alert("Không thể react");
    } finally {
      setIsReacting(false);
    }
  };
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


  /** delete */
  const handleDelete = async () => {
    if (!window.confirm("Xóa bài viết này?")) return;
    setIsDeleting(true);
    try {
      const ref = doc(db, "Groups", groupId, "Posts", post.id);
      const snap = await getDoc(ref);
      if (!snap.exists() || snap.data().userId !== auth?.currentUser?.uid) {
        alert("Không thể xóa");
        setIsDeleting(false);
        return;
      }
      const cSnap = await getDocs(query(collection(db, "Groups", groupId, "Posts", post.id, "comments")));
      await Promise.all([...cSnap.docs.map((d) => deleteDoc(d.ref)), deleteDoc(ref)]);
      onPostDeleted?.(post.id);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xóa");
    } finally {
      setIsDeleting(false);
    }
  };

  /** share */
  const onShare = async (type) => {
    const url = `${window.location.origin}/groups/${groupId}/posts/${post.id}`;
    const text = `${localPost.userName}: ${localPost.content || ""}\n\n${url}`;
    try {
      if (type === "copy") {
        await navigator.clipboard.writeText(url);
      } else if (type === "copyWithContent") {
        await navigator.clipboard.writeText(text);
      } else if (type === "native" && navigator.share) {
        await navigator.share({ title: `Post by ${localPost.userName}`, text: localPost.content, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (e) {
      console.error(e);
      alert("Không thể chia sẻ");
    }
    setShowShare(false);
  };

  return (
    <article
      className={`rounded-3xl mb-4 overflow-hidden transition-all ${isLight
        ? "bg-white border border-gray-100 shadow-sm hover:shadow-md"
        : "bg-zinc-900 border border-zinc-800 shadow-lg"
        }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {localPost.userPhoto ? (
            <img
              src={localPost.userPhoto}
              alt={localPost.userName || "user"}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center font-bold">
              {(localPost.userName?.[0] || "?").toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className={`font-semibold text-base truncate ${isLight ? "text-gray-900" : "text-white"}`}>
              {localPost.userName || "Anonymous"}
            </p>
            <p className="text-sm text-gray-500">{timeAgo(localPost.createdAt)}</p>
          </div>
        </div>

        {localPost.userId === auth?.currentUser?.uid && (
          <div className="relative">
            <button
              ref={btnRef}
              onClick={() => setShowMenu((s) => !s)}
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

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div
                  ref={menuRef}
                  className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-xl z-20 py-2 ${isLight
                    ? "bg-white border border-gray-100"
                    : "bg-zinc-800 border border-zinc-700"
                    }`}
                >
                  <button
                    onClick={() => {
                      onEditPost?.(localPost);
                      setShowMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                      }`}
                  >
                    <FaEdit /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      onPrivatePost?.(localPost);
                      setShowMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                      }`}
                  >
                    <FaLock /> Riêng tư
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
      {media.length > 0 && (
        <div className={media.length === 1 ? "" : "px-4 pb-3"}>
          <div className={media.length === 1 ? "" : "grid grid-cols-2 gap-2"}>
            {media.map((m, idx) => {
              const { url, category } = m;
              if (category === "image") {
                return (
                  <img
                    key={idx}
                    src={url}
                    alt="media"
                    className={`w-full cursor-pointer hover:opacity-95 transition-opacity ${media.length === 1
                      ? "object-contain max-h-[600px]"
                      : "rounded-xl object-cover aspect-square"
                      }`}
                    onClick={() => window.open(url, "_blank")}
                    style={media.length === 1 ? { display: "block" } : {}}
                  />
                );
              }
              if (category === "video") {
                return (
                  <video
                    key={idx}
                    controls
                    className={`w-full ${media.length === 1
                      ? "max-h-[600px] object-contain"
                      : "rounded-xl aspect-video object-cover"
                      }`}
                  >
                    <source src={url} type="video/mp4" />
                  </video>
                );
              }
              /* document */
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isLight
                    ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    }`}
                >
                  <FaFile className="text-blue-500" size={20} />
                  <span className={`text-sm truncate ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                    Tệp đính kèm
                  </span>
                </a>
              );
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
                .filter(([, c]) => c > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([k]) => (
                  <span key={k} className="text-lg">
                    {reactions[k]}
                  </span>
                ))}
              <span className={isLight ? "text-gray-600" : "text-gray-400"}>{totalReactions}</span>
            </div>
          )}
          {commentCount > 0 && (
            <button
              onClick={() => setOpenComments((s) => !s)}
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
        {/* Like (wrapper giữ popup) */}
        {/* Like (wrapper giữ popup, có delay khi rời chuột) */}
        <div
          className="relative flex-1"
          onMouseEnter={openReactions}
          onMouseLeave={() => closeReactionsDelayed(160)}
        >
          <button
            onClick={() => handleReaction("Like")}
            disabled={isReacting}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${currentReaction
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
              // Quan trọng: cho phép hover vào popup giữ mở
              onMouseEnter={openReactions}
              onMouseLeave={() => closeReactionsDelayed(160)}
              className={`absolute left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 rounded-full shadow-xl z-30 ${isLight ? "bg-white border border-gray-200" : "bg-zinc-800 border border-zinc-700"
                }`}
              style={{ bottom: "calc(100% + 8px)" }}  // tránh khoảng hở thay vì mb-2
            >
              {Object.entries(reactions).map(([key, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(key);
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
          onClick={() => setOpenComments((s) => !s)}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${openComments
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
            onClick={() => setShowShare((s) => !s)}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${showShare
              ? "text-blue-500 font-semibold"
              : isLight
                ? "text-gray-600 hover:bg-gray-50"
                : "text-gray-400 hover:bg-zinc-800"
              }`}
          >
            <FaShare />
            <span className="text-sm">Chia sẻ</span>
          </button>

          {showShare && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowShare(false)} />
              <div
                className={`share-menu absolute right-0 bottom-full mb-2 w-56 rounded-2xl shadow-xl z-30 py-2 ${isLight ? "bg-white border border-gray-100" : "bg-zinc-800 border border-zinc-700"
                  }`}
              >
                <button
                  onClick={() => onShare("copy")}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                >
                  Copy link
                </button>
                <button
                  onClick={() => onShare("copyWithContent")}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                >
                  Copy nội dung
                </button>
                {navigator.share && (
                  <button
                    onClick={() => onShare("native")}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
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

      {/* Comments (nếu bạn có component comment cho group, render ở đây) */}
      {openComments && (
        <div className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400">
          {/* TODO: gắn CommentSection của group vào đây nếu có */}
          Bình luận nhóm sẽ hiển thị ở đây.
        </div>
      )}
    </article>
  );
}
