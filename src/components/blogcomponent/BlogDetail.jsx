import React from "react";
import { Link } from "react-router-dom";
import ReactQuill from "react-quill-new";
import { FaHeart, FaRegHeart, FaArrowLeft, FaEye } from "react-icons/fa";

const BlogDetail = ({ post, isFavorite, onToggleFavorite, t, getReadTime, tocItems, onBack }) => {
  const favoriteCount = post.favoriteCount || 0;

  return (
    <div className="blog-detail-page">
      <div className="detail-header">
        <button type="button" className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1" onClick={onBack}>
          <FaArrowLeft /> Quay lại
        </button>
        <div className="detail-meta d-flex align-items-center flex-wrap gap-3">
          <span className="category-badge">{post.category}</span>
          <span className="date">{post.createdAt?.toLocaleDateString?.() || ""}</span>
          <span className="read-time">{t("readTime").replace("{time}", getReadTime(post.content))}</span>
          <span className="views">
            <FaEye className="me-1" style={{ verticalAlign: "middle" }} />
            {t("views")}: {post.views || 0}
          </span>
          <span className="favorites-count-meta text-danger d-inline-flex align-items-center gap-1">
            <FaHeart style={{ fontSize: "13px" }} />
            {favoriteCount} {t("favorites") || "yêu thích"}
          </span>
          
          <button
            type="button"
            className={`blog-action-fav-btn ${isFavorite ? "active" : ""}`}
            onClick={() => onToggleFavorite(post)}
            title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
          >
            {isFavorite ? <FaHeart className="heart-icon active" /> : <FaRegHeart className="heart-icon" />}
          </button>
          
          {post.isStatic && <span className="static-badge">Bài viết mẫu</span>}
        </div>
        <h1 className="detail-title">{post.title}</h1>
        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="detail-cover" />
        )}
      </div>

      <div className="detail-content">
        <div className="detail-article-body">
          <div className="detail-article-row">
            <div className="toc-sidebar">
              <h4>Contents</h4>
              <ul>
                {tocItems.map((item, idx) => (
                  <li key={idx} style={{ paddingLeft: `${(item.level - 1) * 10}px` }}>
                    <a href={`#${item.id || ""}`} onClick={(e) => e.preventDefault()}>
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="article-content">
              <ReactQuill
                value={post.content}
                readOnly={true}
                theme="snow"
                modules={{ toolbar: false }}
              />
            </div>
          </div>

          <div className="tags-section">
            <h4>{t("tags")}</h4>
            <div className="tag-cloud">
              {(post.tags || []).map((tag) => (
                <Link key={tag} to={`/tag/${tag}`} className="tag-link">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
