import React, { memo } from "react";

const PostCardSkeleton = ({ post, isLight = false, isDetailView = false, customBgColor = "" }) => {
  const hasMedia = Array.isArray(post?.mediaFiles) && post.mediaFiles.length > 0;
  const isShare = post?.type === "share";

  return (
    <div
      id={post?.id ? `post-skeleton-${post.id}` : undefined}
      className={`post-item-container ${isLight ? "light" : "dark"} ${!isDetailView ? "mb-3 sm:mb-4" : ""}`}
      style={{
        ...(customBgColor ? { backgroundColor: customBgColor } : {}),
        padding: "1rem 1.15rem 1rem",
        overflow: "hidden",
        position: "relative",
      }}
      aria-busy="true"
      aria-label="Đang tải dữ liệu bài viết..."
    >
      {/* Header: Avatar + User info */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <div
          className="post-skeleton-shimmer rounded-circle flex-shrink-0"
          style={{ width: "40px", height: "40px" }}
        />
        <div className="d-flex flex-column gap-1 flex-grow-1">
          <div
            className="post-skeleton-shimmer rounded"
            style={{ width: "130px", height: "13px" }}
          />
          <div
            className="post-skeleton-shimmer rounded"
            style={{ width: "70px", height: "9px" }}
          />
        </div>
      </div>

      {/* Content lines */}
      <div className="d-flex flex-column gap-2 mb-3">
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "85%", height: "14px" }}
        />
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "95%", height: "12px" }}
        />
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "60%", height: "12px" }}
        />
      </div>

      {/* Media placeholder if post has media */}
      {hasMedia && (
        <div
          className="post-skeleton-shimmer rounded-3 mb-3"
          style={{
            width: "100%",
            height: "220px",
          }}
        />
      )}

      {/* Shared post placeholder if post is share */}
      {isShare && (
        <div
          className="post-skeleton-shimmer rounded-3 mb-3"
          style={{
            width: "100%",
            height: "140px",
          }}
        />
      )}

      {/* Stats bar placeholder (likes left, comments right) */}
      <div
        className="d-flex justify-content-between align-items-center pt-2 pb-2 mb-2"
        style={{
          borderBottom: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "55px", height: "13px" }}
        />
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "75px", height: "13px" }}
        />
      </div>

      {/* Action buttons placeholder */}
      <div className="d-flex justify-content-around align-items-center pt-1">
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "24%", height: "26px", borderRadius: "6px" }}
        />
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "24%", height: "26px", borderRadius: "6px" }}
        />
        <div
          className="post-skeleton-shimmer rounded"
          style={{ width: "24%", height: "26px", borderRadius: "6px" }}
        />
      </div>
    </div>
  );
};

export default memo(PostCardSkeleton);
