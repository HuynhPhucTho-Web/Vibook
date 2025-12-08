import React, { useState, useRef, useEffect } from "react";
import { FaComment, FaShare, FaLink, FaCopy } from "react-icons/fa";

/** Helper chung cho 3 nút action */
const getActionButtonClass = (isLight, isActive) => {
  const base =
    "w-full h-9 inline-flex items-center justify-center gap-2 px-3 text-sm " +
    "font-medium rounded-lg transition-colors duration-150 select-none";

  if (isActive) {
    // Active: chỉ đổi màu icon + chữ, không nền
    return `${base} text-blue-500 font-semibold`;
  }

  return `${base} ${
    isLight
      ? "text-gray-600 hover:bg-gray-100"
      : "text-gray-400 hover:bg-zinc-800"
  }`;
};

const PostActions = ({
  post,
  auth,
  isLight,
  selectedPostId,
  setSelectedPostId,
  showReactions,
  setShowReactions,
  isReacting,
  onReaction,
  onShare,
  onRepostToTimeline,
}) => {
  const hoverTimerRef = useRef(null);

  const openReactions = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowReactions(true);
  };

  const closeReactionsDelayed = (delay = 220) => {
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

  const reactions = {
    Like: "👍",
    Love: "❤️",
    Haha: "😂",
    Wow: "😮",
    Sad: "😢",
    Angry: "😠",
  };

  const currentReaction = post.reactedBy?.[auth.currentUser?.uid];
  const barBorder = isLight ? "border-gray-200" : "border-zinc-800";

  return (
    <div
      className={`post-item-actions grid grid-cols-3 border-t ${barBorder} pt-1`}
    >
      {/* LIKE */}
      <div
        className="relative col-span-1 flex items-center justify-center"
        onMouseEnter={openReactions}
        onMouseLeave={() => closeReactionsDelayed(220)}
      >
        <button
          onClick={() => onReaction(post.id, "Like")}
          disabled={isReacting}
          className={getActionButtonClass(isLight, !!currentReaction)}
        >
          <span className="text-lg">
            {currentReaction ? reactions[currentReaction] : "👍"}
          </span>
          <span>{currentReaction || "Thích"}</span>
        </button>

        {/* REACTION POPUP */}
        {showReactions && (
          <div
            onMouseEnter={openReactions}
            onMouseLeave={() => closeReactionsDelayed(220)}
            className={`absolute -top-14 left-1/2 -translate-x-1/2 z-30 
              flex items-center gap-2 px-3 py-2 rounded-full border shadow-[0_12px_28px_rgba(0,0,0,0.25)]
              ${isLight ? "bg-white border-gray-200" : "bg-zinc-900 border-zinc-700"}`}
          >
            {/* mũi tên nhỏ */}
            <div
              className={`absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -mt-1 rotate-45 
              ${isLight ? "bg-white border-b border-r border-gray-200" : "bg-zinc-900 border-b border-r border-zinc-700"}`}
            />

            {Object.entries(reactions).map(([key, icon]) => (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(post.id, key);
                  setShowReactions(false);
                }}
                disabled={isReacting}
                aria-label={key}
                className="h-9 w-9 flex items-center justify-center rounded-full text-2xl
                           hover:scale-125 transition-transform duration-150"
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* COMMENT */}
      <div className="col-span-1 flex items-center justify-center">
        <button
          onClick={() =>
            setSelectedPostId(selectedPostId === post.id ? null : post.id)
          }
          className={getActionButtonClass(
            isLight,
            selectedPostId === post.id
          )}
        >
          <FaComment className="text-base" />
          <span>Bình luận</span>
        </button>
      </div>

      {/* SHARE */}
      <PostShareMenu
        isLight={isLight}
        onShare={onShare}
        onRepostToTimeline={onRepostToTimeline}
      />
    </div>
  );
};

const PostShareMenu = ({ isLight, onShare, onRepostToTimeline }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const baseItem =
    "w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors";

  return (
    <div className="relative col-span-1 flex items-center justify-center">
      <button
        onClick={() => setShowShareMenu((prev) => !prev)}
        className={getActionButtonClass(isLight, showShareMenu)}
      >
        <FaShare className="text-base" />
        <span>Chia sẻ</span>
      </button>

      {showShareMenu && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowShareMenu(false)}
          />

          <div
            className={`absolute right-0 bottom-full mb-2 w-60 max-w-[calc(100vw-2rem)]
              rounded-2xl border shadow-[0_12px_28px_rgba(0,0,0,0.25)] z-30 py-2
              ${isLight ? "bg-white border-gray-100" : "bg-zinc-900 border-zinc-700"}`}
          >
            <button
              onClick={() => onShare("copy")}
              className={`${baseItem} ${
                isLight
                  ? "hover:bg-gray-50 text-gray-700"
                  : "hover:bg-zinc-800 text-gray-100"
              }`}
            >
              <FaLink className="text-sm" />
              <span>Sao chép link</span>
            </button>

            <button
              onClick={() => onShare("copyWithContent")}
              className={`${baseItem} ${
                isLight
                  ? "hover:bg-gray-50 text-gray-700"
                  : "hover:bg-zinc-800 text-gray-100"
              }`}
            >
              <FaCopy className="text-sm" />
              <span>Copy nội dung</span>
            </button>

            {navigator.share && (
              <button
                onClick={() => onShare("native")}
                className={`${baseItem} ${
                  isLight
                    ? "hover:bg-gray-50 text-gray-700"
                    : "hover:bg-zinc-800 text-gray-100"
                }`}
              >
                <FaShare className="text-sm" />
                <span>Chia sẻ hệ thống</span>
              </button>
            )}

            <button
              onClick={onRepostToTimeline}
              className={`${baseItem} text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-500">
                @
              </span>
              <span>Chia sẻ lên trang cá nhân</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PostActions;
