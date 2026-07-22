import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useMemo,
  memo,
  useCallback,
} from "react";
import {
  FaBookmark,
  FaComment,
  FaRegBookmark,
  FaShare,
  FaLink,
  FaCopy,
  FaTimes,
} from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import { SlLike } from "react-icons/sl";

const REACTION_ICONS = {
  Like: "👍",
  Love: "❤️",
  Haha: "😂",
  Wow: "😮",
  Sad: "😢",
  Angry: "😠",
};

const REACTION_I18N = {
  Like: "like",
  Love: "love",
  Haha: "haha",
  Wow: "wow",
  Sad: "sad",
  Angry: "angry",
};

const isCoarsePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(hover: none), (pointer: coarse)").matches;

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
  isSaved,
  isSavingPost,
  onToggleSave,
}) => {
  const hoverTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const { t } = useContext(LanguageContext);
  const uid = auth?.currentUser?.uid;
  const [shareOpen, setShareOpen] = useState(false);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const openReactions = useCallback(() => {
    clearHoverTimer();
    setShowReactions(true);
  }, [setShowReactions]);

  const closeReactionsDelayed = useCallback(
    (delay = 220) => {
      clearHoverTimer();
      hoverTimerRef.current = setTimeout(() => {
        setShowReactions(false);
        hoverTimerRef.current = null;
      }, delay);
    },
    [setShowReactions],
  );

  useEffect(
    () => () => {
      clearHoverTimer();
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    },
    [],
  );

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (!showReactions && !shareOpen) return undefined;
    if (!isCoarsePointer()) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showReactions, shareOpen]);

  const currentReaction = useMemo(
    () => (uid ? post.reactedBy?.[uid] : undefined),
    [post.reactedBy, uid],
  );

  const getReactionLabel = (key) => {
    const k = REACTION_I18N[key];
    return k ? t(k) : key;
  };

  const isLikeActive = currentReaction === "Like";
  const isAnyReactionActive = Boolean(currentReaction);
  const isCommentActive = selectedPostId === post.id;

  const renderLikeIcon = () => {
    if (!currentReaction || currentReaction === "Like") {
      return <SlLike className="post-action__icon-svg" />;
    }
    return (
      <span className="post-action__emoji" aria-hidden>
        {REACTION_ICONS[currentReaction] || "👍"}
      </span>
    );
  };

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Long-press already opened picker — don't double-toggle like
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onReaction(post.id, "Like");
  };

  const handlePickReaction = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    setShowReactions(false);
    onReaction(post.id, key);
  };

  const onLikePointerDown = (e) => {
    // Mobile long-press → reaction sheet
    if (e.pointerType === "mouse") return;
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      openReactions();
      if (navigator.vibrate) navigator.vibrate(12);
    }, 380);
  };

  const onLikePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const themeClass = isLight ? "is-light" : "is-dark";

  return (
    <div className={`post-actions ${themeClass}`}>
      {/* LIKE */}
      <div
        className="post-actions__slot post-actions__slot--like"
        onMouseEnter={() => {
          if (!isCoarsePointer()) openReactions();
        }}
        onMouseLeave={() => {
          if (!isCoarsePointer()) closeReactionsDelayed(200);
        }}
      >
        <button
          type="button"
          className={`post-action-btn ${isAnyReactionActive ? "is-active" : ""} ${
            isReacting ? "is-busy" : ""
          }`}
          onClick={handleLikeClick}
          onPointerDown={onLikePointerDown}
          onPointerUp={onLikePointerUp}
          onPointerCancel={onLikePointerUp}
          onPointerLeave={onLikePointerUp}
          aria-label={
            currentReaction
              ? getReactionLabel(currentReaction)
              : t("like")
          }
          aria-pressed={isAnyReactionActive}
          aria-busy={isReacting || undefined}
        >
          <span
            className={`post-action-btn__icon ${
              isLikeActive || isAnyReactionActive ? "is-reacted" : ""
            }`}
          >
            {renderLikeIcon()}
          </span>
          <span className="post-action-btn__label">
            {currentReaction ? getReactionLabel(currentReaction) : t("like")}
          </span>
        </button>

        {/* Desktop hover picker */}
        {showReactions && !isCoarsePointer() && (
          <div
            className={`reaction-picker reaction-picker--desktop ${themeClass}`}
            onMouseEnter={openReactions}
            onMouseLeave={() => closeReactionsDelayed(180)}
            role="toolbar"
            aria-label="Reactions"
          >
            {Object.entries(REACTION_ICONS).map(([key, icon]) => (
              <button
                key={key}
                type="button"
                className={`reaction-picker__btn ${
                  currentReaction === key ? "is-selected" : ""
                }`}
                onClick={(e) => handlePickReaction(e, key)}
                title={getReactionLabel(key)}
                aria-label={getReactionLabel(key)}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* COMMENT */}
      <div className="post-actions__slot">
        <button
          type="button"
          className={`post-action-btn ${isCommentActive ? "is-active" : ""}`}
          onClick={() =>
            setSelectedPostId(selectedPostId === post.id ? null : post.id)
          }
          aria-label={t("comment")}
          aria-pressed={isCommentActive}
        >
          <span className="post-action-btn__icon">
            <FaComment className="post-action__icon-svg" />
          </span>
          <span className="post-action-btn__label">{t("comment")}</span>
        </button>
      </div>

      {/* SAVE / FAVORITE */}
      <div className="post-actions__slot">
        <button
          type="button"
          className={`post-action-btn ${isSaved ? "is-active is-saved" : ""}`}
          onClick={onToggleSave}
          disabled={isSavingPost}
          aria-label={isSaved ? t("unsavePost") : t("savePost")}
          aria-pressed={isSaved}
        >
          <span className="post-action-btn__icon">
            {isSaved ? (
              <FaBookmark className="post-action__icon-svg" />
            ) : (
              <FaRegBookmark className="post-action__icon-svg" />
            )}
          </span>
          <span className="post-action-btn__label">
            {isSaved ? t("saved") : t("save")}
          </span>
        </button>
      </div>

      {/* SHARE */}
      <div className="post-actions__slot">
        <button
          type="button"
          className={`post-action-btn ${shareOpen ? "is-active" : ""}`}
          onClick={() => setShareOpen(true)}
          aria-label={t("share")}
          aria-expanded={shareOpen}
        >
          <span className="post-action-btn__icon">
            <FaShare className="post-action__icon-svg" />
          </span>
          <span className="post-action-btn__label">{t("share")}</span>
        </button>
      </div>

      {/* Mobile reaction bottom sheet */}
      {showReactions && isCoarsePointer() && (
        <div
          className="post-sheet-backdrop"
          role="presentation"
          onClick={() => setShowReactions(false)}
        >
          <div
            className={`post-sheet reaction-sheet ${themeClass}`}
            role="dialog"
            aria-label="Reactions"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="post-sheet__handle" />
            <p className="post-sheet__title">{t("like")}</p>
            <div className="reaction-sheet__row">
              {Object.entries(REACTION_ICONS).map(([key, icon]) => (
                <button
                  key={key}
                  type="button"
                  className={`reaction-sheet__btn ${
                    currentReaction === key ? "is-selected" : ""
                  }`}
                  onClick={(e) => handlePickReaction(e, key)}
                  aria-label={getReactionLabel(key)}
                >
                  <span className="reaction-sheet__emoji">{icon}</span>
                  <span className="reaction-sheet__name">
                    {getReactionLabel(key)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share sheet / popover */}
      {shareOpen && (
        <SharePanel
          isLight={isLight}
          onClose={() => setShareOpen(false)}
          onShare={(mode) => {
            onShare(mode);
            setShareOpen(false);
          }}
          onRepost={() => {
            setShareOpen(false);
            onRepostToTimeline();
          }}
        />
      )}
    </div>
  );
};

function SharePanel({ isLight, onClose, onShare, onRepost }) {
  const { t } = useContext(LanguageContext);
  const themeClass = isLight ? "is-light" : "is-dark";
  const mobile = isCoarsePointer();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items = [
    {
      key: "copy",
      icon: <FaLink />,
      label: t("copyLink"),
      onClick: () => onShare("copy"),
    },
    {
      key: "copyContent",
      icon: <FaCopy />,
      label: t("copyContent"),
      onClick: () => onShare("copyWithContent"),
    },
    ...(typeof navigator !== "undefined" && navigator.share
      ? [
          {
            key: "native",
            icon: <FaShare />,
            label: t("systemShare"),
            onClick: () => onShare("native"),
          },
        ]
      : []),
    {
      key: "repost",
      icon: (
        <span className="share-panel__at" aria-hidden>
          @
        </span>
      ),
      label: t("shareToTimeline"),
      onClick: onRepost,
      accent: true,
    },
  ];

  return (
    <div
      className="post-sheet-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`post-sheet share-sheet ${themeClass} ${
          mobile ? "share-sheet--mobile" : "share-sheet--desktop"
        }`}
        role="dialog"
        aria-label={t("share")}
        onClick={(e) => e.stopPropagation()}
      >
        {mobile && <div className="post-sheet__handle" />}
        <div className="share-sheet__header">
          <p className="post-sheet__title">{t("share")}</p>
          <button
            type="button"
            className="share-sheet__close"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        <div className="share-sheet__list">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`share-sheet__item ${item.accent ? "is-accent" : ""}`}
              onClick={item.onClick}
            >
              <span className="share-sheet__item-icon">{item.icon}</span>
              <span className="share-sheet__item-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(PostActions);
