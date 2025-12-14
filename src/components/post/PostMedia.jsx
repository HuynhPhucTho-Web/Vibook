import React, { useRef, useEffect, useState } from "react";
import { FaFile, FaEye } from "react-icons/fa";

const PostMedia = ({ post, isLight }) => {
  const videoRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  const getMediaFiles = () => {
    if (post.mediaFiles?.length) return post.mediaFiles;
    if (post.mediaUrl) {
      return [{ url: post.mediaUrl, category: getMediaCategory(post.mediaUrl) }];
    }
    return [];
  };

  const getMediaCategory = (url) => {
    if (!url) return "unknown";
    if (/\.(jpg|jpeg|png|gif|webp)/i.test(url) || url.includes("/image/")) return "image";
    if (/\.(mp4|webm|ogg)/i.test(url) || url.includes("/video/")) return "video";
    if (/\.(pdf|doc|docx)/i.test(url) || url.includes("/raw/")) return "document";
    return "unknown";
  };

  const mediaFiles = getMediaFiles();

  // Intersection Observer for mobile autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-play video on mobile when in view
  useEffect(() => {
    if (isInView && !hasPlayed && window.innerWidth <= 768) {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().then(() => {
          setHasPlayed(true);
          setViewCount(prev => prev + 1);
        }).catch(() => {});
      }
    }
  }, [isInView, hasPlayed]);

  if (mediaFiles.length === 0) return null;

  return (
    <div className={mediaFiles.length === 1 ? "" : "px-4 pb-3"}>
      <div className={mediaFiles.length === 1 ? "" : "grid grid-cols-2 gap-2"}>
        {mediaFiles.map((item, idx) => {
          if (item.category === "image") {
            return (
              <img
                key={idx}
                src={item.url}
                alt={item.originalName || "Image"}
                className={`w-full cursor-pointer hover:opacity-95 transition-opacity ${mediaFiles.length === 1
                  ? "object-contain max-h-[600px]"
                  : "rounded-xl object-cover aspect-square"
                  }`}
                onClick={() => window.open(item.url, "_blank")}
                style={mediaFiles.length === 1 ? { display: "block" } : {}}
              />
            );
          }
          if (item.category === "video") {
            return (
              <div key={idx} className="relative">
                <video
                  ref={videoRef}
                  controls
                  className={`w-full ${mediaFiles.length === 1
                    ? "max-h-[600px] object-contain"
                    : "rounded-xl aspect-video object-cover"
                    }`}
                  onMouseEnter={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                      videoRef.current.play().catch(() => { });
                    }
                  }}
                  onMouseLeave={() => {
                    if (videoRef.current) videoRef.current.pause();
                  }}
                >
                  <source src={item.url} type="video/mp4" />
                </video>
                {/* View count overlay */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  <FaEye size={12} />
                  <span>{viewCount}</span>
                </div>
              </div>
            );
          }
          if (item.category === "document") {
            return (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isLight
                  ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  : "bg-zinc-800 border-zinc-700 hover:bg-zinc-750"
                  }`}
              >
                <FaFile className="text-blue-500" size={20} />
                <span className={`text-sm truncate ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                  {item.originalName || "Document"}
                </span>
              </a>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default PostMedia;
