import React, {useContext} from "react";
import { LanguageContext } from "../../context/LanguageContext";


const PostStats = ({ post, commentCount, isLight, onCommentClick }) => {
  const reactions = {
    Like: "👍",
    Love: "❤️",
    Haha: "😂",
    Wow: "😮",
    Sad: "😢",
    Angry: "😠",
  };
  const { t } = useContext(LanguageContext);

  const totalReactions = Object.values(post.likes || {}).reduce((s, c) => s + c, 0);
  const saveCount = post.saveCount || 0;
  const shareCount = post.shareCount || 0;

  if (totalReactions === 0 && commentCount === 0 && saveCount === 0 && shareCount === 0) return null;

  return (
    <div className="post-stats px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
      {totalReactions > 0 && (
        <div className="post-stats__likes flex items-center gap-1.5 min-w-0">
          <span className="post-stats__emoji-stack flex items-center -space-x-1">
            {Object.entries(post.likes || {})
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([reaction]) => (
                <span
                  key={reaction}
                  className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800 text-[0.85rem] sm:text-base shadow-sm ring-1 ring-black/5"
                >
                  {reactions[reaction]}
                </span>
              ))}
          </span>
          <span className={isLight ? "text-gray-600" : "text-gray-400"}>
            {totalReactions}
          </span>
        </div>
      )}
      <div className="post-stats__meta flex items-center gap-3 ml-auto shrink-0 text-gray-500">
        {commentCount > 0 && (
          <button
            type="button"
            onClick={onCommentClick}
            className="hover:text-blue-500 transition-colors py-1 px-1 min-h-[32px]"
          >
            {commentCount} {t("comment")}
          </button>
        )}
        {saveCount > 0 && (
          <span className="py-1 px-1">
            {saveCount} {t("saveCountLabel") === "saveCountLabel" ? "lượt lưu" : t("saveCountLabel")}
          </span>
        )}
        {shareCount > 0 && (
          <span className="py-1 px-1">
            {shareCount} {t("shareCountLabel") === "shareCountLabel" ? "chia sẻ" : t("shareCountLabel")}
          </span>
        )}
      </div>
    </div>
  );
};

export default PostStats;
