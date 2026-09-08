import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaFile, FaEye, FaTimes, FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

const PostMedia = ({ post, isLight }) => {
  const videoRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const getMediaCategory = (url) => {
    if (!url || typeof url !== "string") return "unknown";
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)/i.test(url) || url.includes("/image/")) return "image";
    if (/\.(mp4|webm|ogg|mov)/i.test(url) || url.includes("/video/")) return "video";
    if (/\.(pdf|doc|docx|xls|xlsx|txt)/i.test(url) || url.includes("/raw/")) return "document";
    return "unknown";
  };

  const getMediaFiles = () => {
    if (Array.isArray(post.mediaFiles) && post.mediaFiles.length > 0) {
      return post.mediaFiles.map((m) => {
        if (typeof m === "string") {
          return { url: m, category: getMediaCategory(m) };
        }
        return {
          ...m,
          url: m.url || m.preview || "",
          category: m.category || getMediaCategory(m.url || m.preview),
          originalName: m.originalName || m.name || "",
        };
      });
    }
    if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
      return post.mediaUrls.map((url) => {
        if (typeof url === "string") {
          return { url, category: getMediaCategory(url) };
        }
        return {
          ...url,
          url: url.url || "",
          category: url.category || getMediaCategory(url.url),
        };
      });
    }
    if (post.mediaUrl) {
      return [{ url: post.mediaUrl, category: getMediaCategory(post.mediaUrl) }];
    }
    return [];
  };

  const mediaFiles = getMediaFiles();
  const imageFiles = mediaFiles.filter((m) => m.category === "image");
  const videoFiles = mediaFiles.filter((m) => m.category === "video");
  const documentFiles = mediaFiles.filter((m) => m.category === "document");

  // Intersection Observer for video autoplay & pause offscreen
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = Boolean(entry?.isIntersecting);
        setIsInView(intersecting);
        if (!intersecting && el && !el.paused) {
          el.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto-play video on mobile when in view; pause when out of view
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isInView) {
      if (!hasPlayed && window.innerWidth <= 768) {
        el.muted = true;
        el.play()
          .then(() => {
            setHasPlayed(true);
            setViewCount((prev) => prev + 1);
          })
          .catch(() => {});
      }
    } else {
      if (!el.paused) {
        el.pause();
      }
    }
  }, [isInView, hasPlayed]);

  // Lightbox key controls & lock body scroll
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : imageFiles.length - 1));
  }, [imageFiles.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev < imageFiles.length - 1 ? prev + 1 : 0));
  }, [imageFiles.length]);

  const touchStartXRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext(); // swipe left -> next
      } else {
        handlePrev(); // swipe right -> prev
      }
    }
    touchStartXRef.current = null;
  };

  useEffect(() => {
    if (lightboxIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, closeLightbox, handlePrev, handleNext]);

  if (mediaFiles.length === 0) return null;

  // Render Facebook-style Image Grid
  const renderImageGrid = () => {
    const count = imageFiles.length;
    if (count === 0) return null;

    // 1 Image: Max height constrained, scaled nicely to fit post
    if (count === 1) {
      const img = imageFiles[0];
      return (
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-zinc-900 flex items-center justify-center cursor-pointer group"
          style={{ maxHeight: "1000px" }}
          onClick={() => openLightbox(0)}
        >
          <img
            src={getOptimizedCloudinaryUrl(img.url, 1000)}
            alt={img.originalName || "Post image"}
            loading="lazy"
            decoding="async"
            className="w-full max-h-[1000px] object-cover sm:object-contain group-hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      );
    }

    // 2 Images: 2 columns side by side
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden h-[300px] sm:h-[500px]">
          {imageFiles.map((img, idx) => (
            <div
              key={idx}
              className="relative w-full h-full overflow-hidden cursor-pointer group bg-black/5 dark:bg-zinc-900"
              onClick={() => openLightbox(idx)}
            >
              <img
                src={getOptimizedCloudinaryUrl(img.url, 600)}
                alt={img.originalName || `Image ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      );
    }

    // 3 Images: 1 large top + 2 bottom
    if (count === 3) {
      return (
        <div className="flex flex-col gap-1.5 rounded-2xl overflow-hidden">
          {/* Top row: 1 image */}
          <div
            className="relative w-full h-[230px] sm:h-[280px] overflow-hidden cursor-pointer group bg-black/5 dark:bg-zinc-900"
            onClick={() => openLightbox(0)}
          >
            <img
              src={getOptimizedCloudinaryUrl(imageFiles[0].url, 800)}
              alt={imageFiles[0].originalName || "Image 1"}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {/* Bottom row: 2 images */}
          <div className="grid grid-cols-2 gap-1.5 h-[150px] sm:h-[180px]">
            {imageFiles.slice(1, 3).map((img, idx) => (
              <div
                key={idx + 1}
                className="relative w-full h-full overflow-hidden cursor-pointer group bg-black/5 dark:bg-zinc-900"
                onClick={() => openLightbox(idx + 1)}
              >
                <img
                  src={getOptimizedCloudinaryUrl(img.url, 500)}
                  alt={img.originalName || `Image ${idx + 2}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4 or More Images (Max 4 slots in 2x2 grid; 4th slot has dark overlay +N for remaining images)
    if (count >= 4) {
      const visibleImages = imageFiles.slice(0, 4);
      const remainingCount = count - 4;

      return (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
          {visibleImages.map((img, idx) => {
            const isFourth = idx === 3;
            const hasOverlay = isFourth && remainingCount > 0;

            return (
              <div
                key={idx}
                className="relative w-full h-[170px] sm:h-[500px] overflow-hidden cursor-pointer group bg-black/5 dark:bg-zinc-900"
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={getOptimizedCloudinaryUrl(img.url, 500)}
                  alt={img.originalName || `Image ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {hasOverlay && (
                  <div
                    className="absolute inset-0 bg-black/60 hover:bg-black/50 transition-colors flex flex-col items-center justify-center text-white font-bold text-2xl sm:text-3xl select-none"
                    title={`+${remainingCount} xem thêm`}
                  >
                    <span>+{remainingCount}</span>
                    <span className="text-xs font-normal text-white/90 sm:hidden">xem thêm</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className="px-4 pb-3 flex flex-col gap-3">
      {/* 1. Images Grid */}
      {renderImageGrid()}

      {/* 2. Videos */}
      {videoFiles.map((item, idx) => (
        <div key={`video-${idx}`} className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-zinc-900">
          <video
            ref={videoRef}
            controls
            preload="none"
            muted
            playsInline
            className="w-full max-h-[500px] object-contain rounded-2xl bg-black"
            onMouseEnter={() => {
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.play().catch(() => {});
              }
            }}
            onMouseLeave={() => {
              if (videoRef.current) videoRef.current.pause();
            }}
          >
            <source src={item.url} type="video/mp4" />
          </video>
          {/* View count overlay */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 shadow">
            <FaEye size={12} />
            <span>{viewCount}</span>
          </div>
        </div>
      ))}

      {/* 3. Documents */}
      {documentFiles.map((item, idx) => (
        <a
          key={`doc-${idx}`}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
            isLight
              ? "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:shadow-sm text-gray-800"
              : "bg-zinc-800/80 border-zinc-700 hover:bg-zinc-750 hover:border-zinc-600 text-gray-200"
          }`}
        >
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <FaFile size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.originalName || "Tệp đính kèm"}</p>
            <span className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1 mt-0.5">
              Tải xuống <FaExternalLinkAlt size={10} />
            </span>
          </div>
        </a>
      ))}

      {/* 4. Fullscreen Lightbox Modal */}
      {lightboxIndex !== null &&
        imageFiles[lightboxIndex] &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none"
            onClick={closeLightbox}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 to-transparent z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-white/90 text-sm sm:text-base font-semibold tracking-wide">
                {lightboxIndex + 1} / {imageFiles.length}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href={imageFiles[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Mở ảnh gốc"
                >
                  <FaExternalLinkAlt size={14} />
                </a>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Đóng (Esc)"
                  aria-label="Đóng"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            {/* Main Stage */}
            <div
              className="relative flex-1 flex items-center justify-center px-2 sm:px-12 py-2 overflow-hidden"
              onClick={closeLightbox}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Prev Button */}
              {imageFiles.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 sm:left-6 z-10 p-3 sm:p-3.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-sm shadow-lg hover:scale-110 active:scale-95"
                  title="Ảnh trước (Mũi tên trái)"
                  aria-label="Ảnh trước"
                >
                  <FaChevronLeft size={20} />
                </button>
              )}

              {/* Active Image */}
              <div
                className="max-h-[82vh] max-w-[94vw] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getOptimizedCloudinaryUrl(imageFiles[lightboxIndex].url, 1600)}
                  alt={imageFiles[lightboxIndex].originalName || `Ảnh ${lightboxIndex + 1}`}
                  className="max-h-[82vh] max-w-[94vw] object-contain rounded-lg shadow-2xl transition-all duration-300"
                />
              </div>

              {/* Next Button */}
              {imageFiles.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 sm:right-6 z-10 p-3 sm:p-3.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-sm shadow-lg hover:scale-110 active:scale-95"
                  title="Ảnh tiếp theo (Mũi tên phải)"
                  aria-label="Ảnh tiếp theo"
                >
                  <FaChevronRight size={20} />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails */}
            {imageFiles.length > 1 && (
              <div
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-t from-black/80 to-transparent overflow-x-auto max-w-full z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {imageFiles.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative rounded-lg overflow-hidden shrink-0 transition-all duration-200 ${
                      idx === lightboxIndex
                        ? "ring-2 ring-blue-500 scale-105 opacity-100 shadow-md"
                        : "opacity-45 hover:opacity-80"
                    }`}
                  >
                    <img
                      src={getOptimizedCloudinaryUrl(img.url, 150)}
                      alt=""
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default PostMedia;
