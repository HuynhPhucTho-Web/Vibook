import React, { useState, useRef, useEffect } from "react";
import { FaComment, FaShare } from "react-icons/fa";

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
  onRepostToTimeline
}) => {
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

  const reactions = {
    Like: "👍",
    Love: "❤️",
    Haha: "😂",
    Wow: "😮",
    Sad: "😢",
    Angry: "😠",
  };

  const currentReaction = post.reactedBy?.[auth.currentUser?.uid];

  return (
    <div className="post-item-actions">
      {/* Like */}
      <div
        className="relative flex-1"
        onMouseEnter={openReactions}
        onMouseLeave={() => closeReactionsDelayed(160)}
      >
        <button
          onClick={() => onReaction(post.id, "Like")}
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
                  onReaction(post.id, key);
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
      <PostShareMenu
        post={post}
        auth={auth}
        isLight={isLight}
        onShare={onShare}
        onRepostToTimeline={onRepostToTimeline}
      />
    </div>
  );
};

const PostShareMenu = ({ post, auth, isLight, onShare, onRepostToTimeline }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  return (
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

            <button
              onClick={onRepostToTimeline}
              className="w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Chia sẻ lên trang cá nhân
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PostActions;
