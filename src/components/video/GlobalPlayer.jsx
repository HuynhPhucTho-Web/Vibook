import React, { useContext, useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { VideoPlayerContext } from "../../context/VideoPlayerContext";
import { FaTimes, FaExternalLinkAlt, FaMinus } from "react-icons/fa";

export default function GlobalPlayer() {
  const { selectedVideo, setSelectedVideo, isMinimized, setIsMinimized } = useContext(VideoPlayerContext);
  const location = useLocation();
  const [coords, setCoords] = useState(null);
  const containerRef = useRef(null);

  const isVideosPage = location.pathname === "/videos";

  useEffect(() => {
    if (!selectedVideo) return;

    if (isVideosPage) {
      // Sync layout position of the global player on top of the placeholder in VideoDetail
      const checkPlaceholder = () => {
        const el = document.getElementById("video-player-portal-placeholder");
        if (el) {
          const rect = el.getBoundingClientRect();
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
            isFloating: false,
          });
        }
      };

      checkPlaceholder();
      const interval = setInterval(checkPlaceholder, 100);
      window.addEventListener("resize", checkPlaceholder);
      return () => {
        clearInterval(interval);
        window.removeEventListener("resize", checkPlaceholder);
      };
    } else {
      // Switch to floating corner player outside of "/videos" route
      setCoords({
        isFloating: true,
      });
    }
  }, [selectedVideo, isVideosPage]);

  if (!selectedVideo || !coords) return null;

  const isFloating = coords.isFloating;

  // Style and class config dynamically based on layout mode
  let style = {};
  let className = "";

  if (isFloating) {
    if (isMinimized) {
      // Small control bar style
      style = {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "256px",
        height: "56px",
        zIndex: 9999,
      };
      className = "bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden flex items-center justify-between px-4";
    } else {
      // Normal floating video card
      style = {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "320px",
        height: "180px", // aspect-video
        zIndex: 9999,
      };
      className = "bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col group";
    }
  } else {
    // Docked mode
    style = {
      position: "absolute",
      top: coords.top,
      left: coords.left,
      width: coords.width,
      height: coords.height,
      zIndex: 40,
      transition: "all 0.1s ease-out",
    };
    className = "rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10";
  }

  return (
    <div style={style} className={className} ref={containerRef}>
      {/* Overlay header controls (only when floating and NOT minimized) */}
      {isFloating && !isMinimized && (
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <Link to="/videos" className="text-[11px] font-bold text-white hover:underline truncate pr-4 no-underline">
            {selectedVideo.snippet.title}
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/20 rounded text-white border-none bg-transparent cursor-pointer"
              title="Thu nhỏ thành thanh nhạc"
            >
              <FaMinus size={10} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="p-1 hover:bg-red-500/80 rounded text-white border-none bg-transparent cursor-pointer"
              title="Đóng video"
            >
              <FaTimes size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Minimized toolbar content */}
      {isFloating && isMinimized && (
        <div className="w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-pink-500 animate-[pulse_1s_infinite] shrink-0">🎵</span>
            <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
              {selectedVideo.snippet.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer"
              title="Phóng to video"
            >
              <FaExternalLinkAlt size={10} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 hover:text-red-700 border-none bg-transparent cursor-pointer"
              title="Đóng video"
            >
              <FaTimes size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Persistently mounted iframe (never unmounted to avoid reloads) */}
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1&enablejsapi=1`}
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        className={`border-none ${
          isFloating && isMinimized ? "w-0 h-0 absolute opacity-0 pointer-events-none" : "w-full h-full"
        }`}
        title="Video Player"
      />
    </div>
  );
}
