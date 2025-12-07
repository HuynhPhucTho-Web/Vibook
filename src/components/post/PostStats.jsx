import React from "react";

const PostStats = ({ post, commentCount, isLight, onCommentClick }) => {
  const reactions = {
    Like: "👍",
    Love: "❤️",
    Haha: "😂",
    Wow: "😮",
    Sad: "😢",
    Angry: "😠",
  };

  const totalReactions = Object.values(post.likes || {}).reduce((s, c) => s + c, 0);

  if (totalReactions === 0 && commentCount === 0) return null;

  return (
    <div className="px-4 pb-2 flex items-center justify-between text-sm">
      {totalReactions > 0 && (
        <div className="flex items-center gap-2">
          {Object.entries(post.likes || {})
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
          onClick={onCommentClick}
          className="text-gray-500 hover:text-blue-500 transition-colors"
        >
          {commentCount} bình luận
        </button>
      )}
    </div>
  );
};

export default PostStats;
