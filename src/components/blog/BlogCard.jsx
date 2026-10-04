import React from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaEdit, FaTrash, FaEye, FaRegClock, FaArrowRight } from "react-icons/fa";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

const BlogCard = ({ post, isFavorite, onToggleFavorite, onEdit, onDelete, t, getReadTime, auth, index = 1 }) => {
  const isAuthor = auth.currentUser && auth.currentUser.uid === post.author;
  const favoriteCount = post.favoriteCount || 0;
  const rawReadTime = post.readTime || (getReadTime ? getReadTime(post.content) : 1);
  const formattedDate = post.createdAt?.toLocaleDateString?.() || "—";

  return (
    <div className="blog-card">
      {post.coverImage && (
        <Link to={`/blog/${post.slug}`} className="blog-card__cover-container" aria-label={post.title}>
          <img
            src={getOptimizedCloudinaryUrl(post.coverImage, 500)}
            alt={post.title}
            className="cover-image"
            fetchPriority={index === 0 ? "high" : "auto"}
            loading={index === 0 ? "eager" : "lazy"}
          />
          {post.isStatic && (
            <span className="blog-card__static-badge">
              Mẫu
            </span>
          )}
        </Link>
      )}

      <div className="card-content">
        {/* Tầng 1: category + ngày */}
        <div className="card-meta-top">
          {post.category && (
            <span className="category-pill">
              {post.category}
            </span>
          )}
          <span className="date-text">
            {formattedDate}
          </span>
        </div>

        {/* Tầng 2: tiêu đề (có link trực tiếp) */}
        <h3 className="card-title">
          <Link to={`/blog/${post.slug}`} className="card-title-link" title={post.title}>
            {post.title}
          </Link>
        </h3>

        {/* Tầng 3: mô tả ngắn gọn (giới hạn 2 dòng) */}
        {post.description && (
          <p className="card-desc">
            {post.description}
          </p>
        )}

        {/* Tầng 4: tags gọn gàng (tối đa 2 tag) */}
        {(post.tags || []).length > 0 && (
          <div className="card-tags">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag-pill">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Tầng 5: Footer hợp nhất (Stats bên trái, Actions bên phải) */}
        <div className="card-footer">
          <div className="card-stats">
            <span className="stat-item" title={t("readTime").replace("{time}", rawReadTime)}>
              <FaRegClock className="stat-icon" />
              <span>{rawReadTime}p</span>
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-item" title={t("views") || "Lượt xem"}>
              <FaEye className="stat-icon" />
              <span>{post.views || 0}</span>
            </span>
          </div>

          <div className="card-actions-compact">
            {/* Nút thích tích hợp số lượng tim */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(post);
              }}
              title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
              className={`fav-chip-btn ${isFavorite ? "active" : ""}`}
            >
              {isFavorite ? (
                <FaHeart className="fav-icon heart-filled" />
              ) : (
                <FaRegHeart className="fav-icon" />
              )}
              {favoriteCount > 0 && <span className="fav-count">{favoriteCount}</span>}
            </button>

            {/* Tác giả: sửa / xóa */}
            {isAuthor && !post.isStatic && (
              <div className="author-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(post);
                  }}
                  title={t("editPost") || "Chỉnh sửa bài viết"}
                  className="author-icon-btn edit-btn"
                >
                  <FaEdit />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(post.id, post.isStatic);
                  }}
                  title={t("deletePost") || "Xóa bài viết"}
                  className="author-icon-btn delete-btn"
                >
                  <FaTrash />
                </button>
              </div>
            )}

            {/* Nút đọc bài viết gọn gàng */}
            <Link
              to={`/blog/${post.slug}`}
              className="read-more-link"
              title={t("readArticle") || "Đọc bài viết"}
            >
              <span>{t("readArticle") || "Đọc"}</span>
              <FaArrowRight className="arrow-icon" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;