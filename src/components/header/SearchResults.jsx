import React from "react";
import { Link } from "react-router-dom";
import { FaFileAlt, FaSearch, FaUser } from "react-icons/fa";

const formatPostDate = (value) => {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const Highlight = ({ text = "", query = "" }) => {
  const keyword = query.trim();
  if (!keyword) return text;
  const index = text.toLocaleLowerCase().indexOf(keyword.toLocaleLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="search-highlight">{text.slice(index, index + keyword.length)}</mark>
      {text.slice(index + keyword.length)}
    </>
  );
};

const SearchResults = ({ theme, t, query, results, isSearching, onSelect }) => {
  const isLight = theme === "light";
  const users = results.filter((result) => result.type === "user");
  const posts = results.filter((result) => result.type === "post");

  if (isSearching) {
    return (
      <div className="search-state" role="status">
        <span className="search-spinner" />
        <div><strong>{t("searching")}</strong><small>Đang tìm người dùng và bài viết phù hợp</small></div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="search-empty-state">
        <span className={`search-empty-icon ${isLight ? "light" : "dark"}`}><FaSearch /></span>
        <strong>{t("noResults")}</strong>
        <small>“{query}”</small>
        <p>Thử tên người dùng, tiêu đề hoặc từ khóa ngắn hơn.</p>
      </div>
    );
  }

  return (
    <div className="search-results-content">
      <div className="search-results-summary">Tìm thấy {results.length} kết quả</div>

      {!!users.length && (
        <section className="search-result-section" aria-label={t("users")}>
          <div className="search-section-heading"><span>{t("users")}</span><span>{users.length}</span></div>
          {users.map((user) => (
            <Link key={`user-${user.id}`} to={`/user/${user.id}`} className="search-result-item" onClick={onSelect}>
              {user.photoURL || user.photo ? (
                <img src={user.photoURL || user.photo} alt="" className="search-result-avatar" />
              ) : (
                <span className="search-result-avatar search-result-avatar--fallback"><FaUser /></span>
              )}
              <span className="search-result-main">
                <strong><Highlight text={user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || t("anonymous")} query={query} /></strong>
                <small>{user.email || "Xem trang cá nhân"}</small>
              </span>
              <span className="search-result-kind">Hồ sơ</span>
            </Link>
          ))}
        </section>
      )}

      {!!posts.length && (
        <section className="search-result-section" aria-label={t("posts")}>
          <div className="search-section-heading"><span>{t("posts")}</span><span>{posts.length}</span></div>
          {posts.map((post) => {
            const title = post.title || post.contentText || post.content || t("noContent");
            const excerpt = post.contentText || post.content || "";
            return (
              <Link key={`post-${post.id}`} to={`/post/${post.id}`} className="search-result-item search-result-item--post" onClick={onSelect}>
                <span className="search-post-icon"><FaFileAlt /></span>
                <span className="search-result-main">
                  <strong><Highlight text={title} query={query} /></strong>
                  {post.title && excerpt && <small><Highlight text={excerpt.slice(0, 105)} query={query} /></small>}
                  <span className="search-post-meta">{post.userName || t("anonymous")}{formatPostDate(post.createdAt) ? ` · ${formatPostDate(post.createdAt)}` : ""}</span>
                </span>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default SearchResults;
