import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactQuill from "react-quill-new";
import { FaHeart, FaRegHeart, FaArrowLeft, FaEye, FaUser } from "react-icons/fa";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const BlogDetail = ({ post, isFavorite, onToggleFavorite, t, getReadTime, tocItems, onBack }) => {
  const favoriteCount = post.favoriteCount || 0;
  const [authorProfile, setAuthorProfile] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error state on post change
  useEffect(() => {
    setAvatarError(false);
  }, [post.author]);

  // Fetch author profile details
  useEffect(() => {
    if (!post.author || post.isStatic) {
      setAuthorProfile(null);
      return;
    }
    const fetchAuthor = async () => {
      try {
        const docSnap = await getDoc(doc(db, "Users", post.author));
        if (docSnap.exists()) {
          setAuthorProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching blog author profile", err);
      }
    };
    fetchAuthor();
  }, [post.author, post.isStatic]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll handler for TOC using index-based heading matching
  const handleTocClick = (e, index) => {
    e.preventDefault();
    const qlEditor = document.querySelector(".article-content .ql-editor");
    if (qlEditor) {
      const headings = qlEditor.querySelectorAll("h1, h2, h3");
      const element = headings[index];
      if (element) {
        const yOffset = -80; // offset for sticky nav/header
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
        return;
      }
    }

    // Fallback using generated element id
    if (tocItems[index]) {
      const element = document.getElementById(tocItems[index].id);
      if (element) {
        const yOffset = -80;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="blog-detail-page">
      {/* Fixed top reading progress bar */}
      <div 
        className="reading-progress-bar-fixed" 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: `${readingProgress}%`,
          height: "4px",
          background: "var(--vb-gradient, linear-gradient(135deg, #8e54e9, #4776e6))",
          zIndex: 9999,
          transition: "width 0.1s ease-out",
          boxShadow: "0 0 8px var(--vb-primary, #8e54e9)"
        }}
      />

      <div className="detail-header">
        <button 
          type="button" 
          className="blog-detail-back-btn" 
          onClick={onBack}
        >
          <FaArrowLeft className="arrow-icon" /> <span>Quay lại</span>
        </button>

        <div className="detail-meta d-flex align-items-center flex-wrap gap-3 mb-4">
          <span className="category-badge">{post.category}</span>
          
          {/* Author Widget */}
          {authorProfile ? (
            <div className="author-meta-widget d-inline-flex align-items-center gap-2">
              {((authorProfile.photo || authorProfile.photoURL) && !avatarError) ? (
                <img 
                  src={authorProfile.photo || authorProfile.photoURL} 
                  alt="Tác giả" 
                  className="author-avatar-img"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="author-avatar-icon-placeholder d-flex align-items-center justify-content-center">
                  <FaUser size={10} />
                </div>
              )}
              <span className="author-name-text">
                {((authorProfile.firstName || "") + " " + (authorProfile.lastName || "")).trim() || authorProfile.displayName || authorProfile.name || "Anonymous"}
              </span>
            </div>
          ) : post.isStatic ? (
            <div className="author-meta-widget d-inline-flex align-items-center gap-2">
              <div className="author-avatar-icon-placeholder d-flex align-items-center justify-content-center">
                <FaUser size={10} />
              </div>
              <span className="author-name-text">Tác giả ViBook</span>
            </div>
          ) : null}

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
          <div className="detail-cover-container">
            <img
              src={getOptimizedCloudinaryUrl(post.coverImage, 1200)}
              alt={post.title}
              className="detail-cover"
              fetchPriority="high"
              loading="eager"
            />
          </div>
        )}
      </div>

      <div className="detail-content">
        <div className="detail-article-body">
          <div className="detail-article-row">
            {tocItems.length > 0 && (
              <div className="toc-sidebar">
                <h4>Nội dung bài viết</h4>
                <ul>
                  {tocItems.map((item, idx) => (
                    <li key={idx} style={{ paddingLeft: `${(item.level - 1) * 10}px` }}>
                      <a href={`#heading-${idx}`} onClick={(e) => handleTocClick(e, idx)}>
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
