import React from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaEdit, FaTrash, FaEye, FaRegClock } from "react-icons/fa";

const BlogCard = ({ post, isFavorite, onToggleFavorite, onEdit, onDelete, t, getReadTime, auth }) => {
  const isAuthor = auth.currentUser && auth.currentUser.uid === post.author;
  const favoriteCount = post.favoriteCount || 0;

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Ảnh bìa + badge overlay */}
      {post.coverImage && (
        <div className="relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full aspect-video object-cover"
          />
          {post.isStatic && (
            <span className="absolute top-2.5 right-2.5 bg-black/65 text-white text-[11px] px-2 py-0.5 rounded-full">
              Mẫu
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        {/* Tầng 1: category + ngày */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
            {post.category}
          </span>
          <span className="text-xs text-gray-400">
            {post.createdAt?.toLocaleDateString?.() || "—"}
          </span>
        </div>

        {/* Tầng 2: tiêu đề + mô tả */}
        <h3 className="text-[17px] font-bold leading-snug line-clamp-2">
          {post.title}
        </h3>
        <p className="text-[13.5px] text-gray-500 leading-relaxed line-clamp-2">
          {post.description}
        </p>

        {/* Tầng 3: tags */}
        {(post.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-blue-600">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Tầng 4: số liệu phụ - tách khỏi nội dung bằng border-top mờ */}
        <div className="flex items-center gap-3.5 text-xs text-gray-400 pt-2 mt-1 border-t border-dashed border-gray-100">
          <span className="inline-flex items-center gap-1">
            <FaRegClock className="text-[12px]" />
            {t("readTime").replace("{time}", getReadTime(post.content))}
          </span>
          <span className="inline-flex items-center gap-1">
            <FaEye className="text-[12px]" />
            {post.views || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <FaHeart className="text-[12px] text-red-500" />
            {favoriteCount}
          </span>
        </div>
      </div>

      {/* Tầng 5: actions - tách hẳn khỏi nội dung */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
          >
            {t("readArticle")}
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(post);
            }}
            title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {isFavorite ? (
              <FaHeart className="text-red-500 text-sm" />
            ) : (
              <FaRegHeart className="text-gray-400 text-sm" />
            )}
          </button>
        </div>

        {isAuthor && !post.isStatic && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(post)}
              title={t("editPost")}
              className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <FaEdit className="text-sm" />
            </button>
            <button
              onClick={() => onDelete(post.id, post.isStatic)}
              title={t("deletePost")}
              className="p-1.5 rounded-md border border-gray-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              <FaTrash className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCard;