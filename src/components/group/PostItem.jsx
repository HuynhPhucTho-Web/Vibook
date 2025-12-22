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
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import GroupCommentSection from "./GroupCommentSection";

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
  post,
  groupId,
  auth,
  onPostDeleted,
  onPrivatePost,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const shareBtnRef = useRef(null);
  const shareMenuRef = useRef(null);

  // ===== Mobile detect (touch-friendly) =====
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(max-width: 640px)")?.matches ?? window.innerWidth <= 640;
  });

  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 640px)");
    const handler = () => setIsMobile(mq?.matches ?? window.innerWidth <= 640);
    handler();
    mq?.addEventListener?.("change", handler);
    window.addEventListener("resize", handler);
    return () => {
      mq?.removeEventListener?.("change", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

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
      (snap) => {
        setCommentCount(snap.size);
      }
    );

    return () => {
      unsubPost();
      unsubCmt();
    };
  }, [post?.id, groupId, onPostDeleted]);

  useEffect(() => {
    if (isEditing) {
      setEditedContent(localPost.content || "");
    }
  }, [isEditing, localPost.content]);

  /** media list */
  const media = useMemo(() => {
    if (Array.isArray(localPost.mediaUrls)) {
      return localPost.mediaUrls.map((url) => ({
        url,
        category: isVideo(url) ? "video" : isDoc(url) ? "document" : "image",
      }));
    }
    if (Array.isArray(localPost.mediaFiles)) return localPost.mediaFiles;
    if (localPost.mediaUrl)
      return [{
        url: localPost.mediaUrl,
        category: isVideo(localPost.mediaUrl) ? "video" : "image",
      }];
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

      // Optimistic update
      setLocalPost(prev => ({ ...prev, likes, reactedBy }));

      await updateDoc(ref, { likes, reactedBy });
      setShowReactions(false);
    } catch (e) {
      console.error(e);
      alert("Không thể react");
      // Revert on error if needed, but for simplicity, rely on onSnapshot
    } finally {
      setIsReacting(false);
    }
  };

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
      if (type === "copy") await navigator.clipboard.writeText(url);
      else if (type === "copyWithContent") await navigator.clipboard.writeText(text);
      else if (type === "native" && navigator.share) await navigator.share({ title: `Post by ${localPost.userName}`, text: localPost.content, url });
      else await navigator.clipboard.writeText(url);
    } catch (e) {
      console.error(e);
      alert("Không thể chia sẻ");
    }
    setShowShare(false);
  };



  /** edit post */
  const handleSaveEdit = async () => {
    if (!auth?.currentUser || editedContent.trim() === localPost.content) {
      setIsEditing(false);
      return;
    }
    const newContent = editedContent.trim();
    // Optimistic update
    setLocalPost(prev => ({ ...prev, content: newContent }));
    setIsEditing(false);
    try {
      const ref = doc(db, "Groups", groupId, "Posts", post.id);
      await updateDoc(ref, { content: newContent });
    } catch (e) {
      console.error(e);
      alert("Không thể lưu thay đổi");
      // Revert on error
      setLocalPost(prev => ({ ...prev, content: localPost.content }));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(localPost.content);
    setIsEditing(false);
  };

  // ===== Menu positioning (FIXED overlay - never clipped) =====
  const [menuStyle, setMenuStyle] = useState(null);
  const [shareStyle, setShareStyle] = useState(null);

  const placeFloating = (anchorEl, width = 220) => {
    if (!anchorEl) return { top: 0, left: 0 };
    const r = anchorEl.getBoundingClientRect();
    const padding = 8;
    const vw = window.innerWidth || 375;
    const vh = window.innerHeight || 700;

    let left = r.right - width; // align right
    left = Math.max(padding, Math.min(left, vw - width - padding));

    // try place below
    let top = r.bottom + 8;
    // if overflow bottom, place above
    const estHeight = 120; // reduced height estimate for mobile
    if (top + estHeight > vh - padding) {
      top = Math.max(padding, r.top - estHeight - 8);
    }

    return { top, left };
  };

  useEffect(() => {
    const recalc = () => {
      // Sử dụng requestAnimationFrame để mượt mà hơn khi scroll
      requestAnimationFrame(() => {
        if (showMenu && btnRef.current) {
          const pos = placeFloating(btnRef.current, isMobile ? Math.min(280, window.innerWidth - 24) : 220);
          setMenuStyle(prev => ({
            ...prev,
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 60,
            width: isMobile ? `min(280px, calc(100vw - 24px))` : "220px",
          }));
        }
        if (showShare && shareBtnRef.current) {
          const pos = placeFloating(shareBtnRef.current, isMobile ? Math.min(280, window.innerWidth - 24) : 240);
          setShareStyle(prev => ({
            ...prev,
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 60,
            width: isMobile ? `min(280px, calc(100vw - 24px))` : "240px",
          }));
        }
      });
    };

    if (showMenu || showShare) {
      recalc();
      // Lắng nghe scroll trên toàn bộ window và các phần tử cha
      window.addEventListener("scroll", recalc, true);
      window.addEventListener("resize", recalc);
    }

    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [showMenu, showShare, isMobile]);

  /** close menus outside + esc */
  useEffect(() => {
    const onDown = (e) => {
      if (showMenu) {
        const insideMenu = menuRef.current?.contains(e.target);
        const insideBtn = btnRef.current?.contains(e.target);
        if (!insideMenu && !insideBtn) setShowMenu(false);
      }

      if (showShare) {
        const insideShare = shareMenuRef.current?.contains(e.target);
        const insideShareBtn = shareBtnRef.current?.contains(e.target);
        if (!insideShare && !insideShareBtn) setShowShare(false);
      }

      if (showReactions) {
        const insideReac = e.target.closest?.(".reaction-pop");
        const insideLikeBtn = e.target.closest?.(".like-btn");
        if (!insideReac && !insideLikeBtn) setShowReactions(false);
      }
    };

    const onEsc = (e) => {
      if (e.key === "Escape") {
        setShowMenu(false);
        setShowShare(false);
        setShowReactions(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showMenu, showShare, showReactions]);

  // ===== Reaction hover (desktop) + click (mobile) =====
  const hoverTimerRef = useRef(null);
  const openReactions = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowReactions(true);
  };
  const closeReactionsDelayed = (delay = 160) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowReactions(false);
      hoverTimerRef.current = null;
    }, delay);
  };
  useEffect(() => () => hoverTimerRef.current && clearTimeout(hoverTimerRef.current), []);

  return (
    <article
      className={`rounded-3xl mb-4 transition-all w-full max-w-full ${isLight ? "bg-white border border-gray-100 shadow-sm" : "bg-zinc-900 border border-zinc-800 shadow-lg"
        }`}
      // Thay overflow-hidden bằng overflow-visible để popup không bị cắt
      style={{ boxSizing: "border-box", overflow: "visible" }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3" style={{ minWidth: 0 }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile/${localPost.userId}`} className="no-underline hover:no-underline">
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
          </Link>

          <div className="min-w-0">
            <Link to={`/profile/${localPost.userId}`} className="no-underline hover:no-underline">
              <p className={`font-semibold text-base truncate ${isLight ? "text-gray-900" : "text-white"}`}>
                {localPost.userName || "Anonymous"}
              </p>
            </Link>
            <p className="text-sm text-gray-500">{timeAgo(localPost.createdAt)}</p>
          </div>
        </div>

        {localPost.userId === auth?.currentUser?.uid && (
          <div className="relative shrink-0">
            <button
              ref={btnRef}
              onClick={() => {
                setShowShare(false);
                setShowReactions(false);
                setShowMenu((s) => !s);
              }}
              disabled={isDeleting}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${isLight ? "hover:bg-gray-100" : "hover:bg-zinc-800"
                }`}
              aria-label="Post menu"
            >
              {isDeleting ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <FaEllipsisH className={isLight ? "text-gray-600" : "text-gray-400"} />
              )}
            </button>

            {/* MENU FIXED (không bị khuất, không bị parent overflow cắt) */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[55]" onClick={() => setShowMenu(false)} />
                <div
                  ref={menuRef}
                  style={menuStyle || { position: "fixed", top: 80, left: 16, zIndex: 60, width: isMobile ? "calc(100vw - 24px)" : 220 }}
                  className={`rounded-2xl shadow-xl py-2 ${isLight
                    ? "bg-white border border-gray-100"
                    : "bg-zinc-800 border border-zinc-700"
                    }`}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
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
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className={`w-full p-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLight
                  ? "bg-gray-50 border-gray-200 text-gray-900"
                  : "bg-zinc-800 border-zinc-700 text-gray-100"
                  }`}
                rows={4}
                placeholder="Nhập nội dung bài viết..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
                    }`}
                >
                  <FaTimes size={14} />
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 transition-colors"
                >
                  <FaSave size={14} />
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{localPost.content}</p>
          )}
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
                  <span key={k} className="text-lg">{reactions[k]}</span>
                ))}
              <span className={isLight ? "text-gray-600" : "text-gray-400"}>{totalReactions}</span>
            </div>
          )}

          <button
            onClick={() => setOpenComments((s) => !s)}
            className={`transition-colors ${commentCount > 0 ? "text-gray-500 hover:text-blue-500" : "text-gray-400"}`}
          >
            {commentCount} bình luận
          </button>
        </div>
      )}

      {/* Divider */}
      <div className={`mx-4 border-t ${isLight ? "border-gray-100" : "border-zinc-800"}`} />

      {/* Actions */}
      <div className="p-2 flex items-center justify-around">
        {/* Like */}
        <div
          className="relative flex-1"
          onMouseEnter={!isMobile ? openReactions : undefined}
          onMouseLeave={!isMobile ? () => closeReactionsDelayed(160) : undefined}
        >
          <button
            className={`like-btn w-full py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${currentReaction
              ? "text-blue-500 font-semibold"
              : isLight
                ? "text-gray-600 hover:bg-gray-50"
                : "text-gray-400 hover:bg-zinc-800"
              }`}
            onClick={() => {
              if (isMobile) {
                // mobile: click toggle popup
                setShowShare(false);
                setShowMenu(false);
                setShowReactions((s) => !s);
              } else {
                // desktop: click quick like
                handleReaction("Like");
              }
            }}
            disabled={isReacting}
          >
            <span className="text-lg">{currentReaction ? reactions[currentReaction] : "👍"}</span>
            <span className="text-sm">{currentReaction || "Thích"}</span>
          </button>

          {showReactions && (
            <div
              className={`reaction-pop absolute flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl z-50 ${isLight ? "bg-white border border-gray-200" : "bg-zinc-800 border border-zinc-700"
                }`}
              style={{
                bottom: "calc(100% + 10px)",
                // Thay đổi ở đây:
                left: isMobile ? "0" : "50%",
                transform: isMobile ? "none" : "translateX(-50%)",

                // Quan trọng để không bị cuộn:
                width: "max-content",
                minWidth: "max-content",
                whiteSpace: "nowrap",
                display: "flex",
                flexDirection: "row",

                // Giới hạn để không lệch khỏi màn hình điện thoại
                maxWidth: isMobile ? "90vw" : "none",
                overflow: "visible"
              }}
              onMouseEnter={!isMobile ? openReactions : undefined}
              onMouseLeave={!isMobile ? () => closeReactionsDelayed(160) : undefined}
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
                  // flex-shrink-0 để icon không bao giờ bị bóp nhỏ
                  className="text-2xl sm:text-3xl hover:scale-125 transition-transform duration-200 flex-shrink-0"
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
          onClick={() => {
            setShowShare(false);
            setShowMenu(false);
            setOpenComments((s) => !s);
          }}
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
            ref={shareBtnRef}
            onClick={() => {
              setShowMenu(false);
              setShowReactions(false);
              setShowShare((s) => !s);
            }}
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
              <div className="fixed inset-0 z-[55]" onClick={() => setShowShare(false)} />
              <div
                ref={shareMenuRef}
                style={shareStyle || { position: "fixed", top: 120, left: 16, zIndex: 60, width: isMobile ? "calc(100vw - 24px)" : 240 }}
                className={`rounded-2xl shadow-xl py-2 ${isLight
                  ? "bg-white border border-gray-100"
                  : "bg-zinc-800 border border-zinc-700"
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

      {openComments && (
        <GroupCommentSection
          groupId={groupId}
          postId={post.id}
          auth={auth}
          isCommentSectionOpen={openComments}
        />
      )}
    </article>
  );
}
