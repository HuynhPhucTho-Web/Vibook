import React from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaEdit, FaTrash, FaEye, FaRegClock } from "react-icons/fa";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

const BlogCard = ({ post, isFavorite, onToggleFavorite, onEdit, onDelete, t, getReadTime, auth, index = 1 }) => {
  const isAuthor = auth.currentUser && auth.currentUser.uid === post.author;
  const favoriteCount = post.favoriteCount || 0;

  return (
    <div className="blog-card">
      {post.coverImage && (
        <div className="blog-card__cover-container">
          <img
            src={getOptimizedCloudinaryUrl(post.coverImage, 500)}
            alt={post.title}
            className="cover-image"
            fetchPriority={index === 0 ? "high" : "auto"}
            loading={index === 0 ? "eager" : "lazy"}
          />
          {post.isStatic && (
            <span 
              className="absolute bg-black/65 text-white text-[11px] px-2 py-0.5 rounded-full" 
              style={{ position: "absolute", top: "10px", right: "10px" }}
            >
              Mẫu
            </span>
          )}
        </div>
      )}

      <div className="card-content">
        {/* Tầng 1: category + ngày */}
        <div className="card-meta">
          <span className="category">
            {post.category}
          </span>
          <span className="date">
            {post.createdAt?.toLocaleDateString?.() || "—"}
          </span>
        </div>

        {/* Tầng 2: tiêu đề + mô tả */}
        <h3 className="card-title">
          {post.title}
        </h3>
        <p className="card-desc">
          {post.description}
        </p>

        {/* Tầng 3: tags */}
        {(post.tags || []).length > 0 && (
          <div className="tags">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Tầng 4: số liệu phụ - tách khỏi nội dung bằng border-top mờ */}
        <div 
          className="card-meta" 
          style={{ 
            marginTop: "auto", 
            paddingTop: "8px", 
            borderTop: "1px dashed var(--vb-glass-border, rgba(255,255,255,0.08))",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <span className="inline-flex items-center gap-1" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <FaRegClock style={{ fontSize: "12px" }} />
            {t("readTime").replace("{time}", getReadTime(post.content))}
          </span>
          <span className="inline-flex items-center gap-1" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <FaEye style={{ fontSize: "12px" }} />
            {post.views || 0}
          </span>
          <span 
            className="inline-flex items-center gap-1 text-danger" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "4px", 
              color: "var(--vb-error, #ffb4ab)" 
            }}
          >
            <FaHeart style={{ fontSize: "12px" }} />
            {favoriteCount}
          </span>
        </div>
      </div>

      {/* Tầng 5: actions - tách hẳn khỏi nội dung */}
      <div className="card-actions" style={{ borderTop: "1px solid var(--vb-glass-border, rgba(255,255,255,0.08))", marginTop: "auto" }}>
        <Link
          to={`/blog/${post.slug}`}
          className="read-btn"
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
          className={`blog-action-fav-btn ${isFavorite ? "active" : ""}`}
          style={{ 
            width: "36px", 
            height: "36px", 
            borderRadius: "8px", 
            border: "1px solid var(--vb-glass-border, rgba(255,255,255,0.08))",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0"
          }}
        >
          {isFavorite ? (
            <FaHeart className="heart-icon active" style={{ color: "#ef4444" }} />
          ) : (
            <FaRegHeart className="heart-icon" />
          )}
        </button>

        {isAuthor && !post.isStatic && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
            <button
              onClick={() => onEdit(post)}
              title={t("editPost")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px"
              }}
            >
              <FaEdit />
            </button>
            <button
              className="delete-btn"
              onClick={() => onDelete(post.id, post.isStatic)}
              title={t("deletePost")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px"
              }}
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCard;