import React, { useContext, useEffect, useState, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { VideoPlayerContext } from "../../context/VideoPlayerContext";
import { FaTimes, FaExternalLinkAlt, FaMinus } from "react-icons/fa";

export default function GlobalPlayer() {
  const { selectedVideo, setSelectedVideo, isMinimized, setIsMinimized } = useContext(VideoPlayerContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [coords, setCoords] = useState(null);
  const containerRef = useRef(null);

  // Draggable position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const prevIsFloatingRef = useRef(false);

  const isVideosPage = location.pathname === "/videos";
  const isFloating = coords?.isFloating || false;

  const playerWidth = isMinimized ? 256 : 320;
  const playerHeight = isMinimized ? 56 : 180;

  // Sync layout position of the global player on top of the placeholder in VideoDetail
  useEffect(() => {
    if (!selectedVideo) return;

    if (isVideosPage) {
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
      setCoords({
        isFloating: true,
      });
    }
  }, [selectedVideo, isVideosPage]);

  // Helper to clamp position within viewport boundary with a 12px margin
  const clampPosition = (x, y, width, height) => {
    const maxX = window.innerWidth - width - 12;
    const maxY = window.innerHeight - height - 12;
    return {
      x: Math.max(12, Math.min(x, maxX)),
      y: Math.max(12, Math.min(y, maxY)),
    };
  };

  // Position initialization and clamping when state / dimension / mode changes
  useEffect(() => {
    if (isFloating) {
      if (!prevIsFloatingRef.current || (position.x === 0 && position.y === 0)) {
        const defaultX = window.innerWidth - playerWidth - 24;
        const defaultY = window.innerHeight - playerHeight - 24;
        setPosition(clampPosition(defaultX, defaultY, playerWidth, playerHeight));
      } else {
        setPosition((prev) => clampPosition(prev.x, prev.y, playerWidth, playerHeight));
      }
    }
    prevIsFloatingRef.current = isFloating;
  }, [isFloating, playerWidth, playerHeight]);

  // Handle window resizing
  useEffect(() => {
    if (!isFloating) return;
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y, playerWidth, playerHeight));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFloating, playerWidth, playerHeight]);

  // Dragging event handlers
  const handleDragStart = (e) => {
    if (!isFloating) return;

    // Do not initiate drag if clicking buttons, links, or inputs
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) {
      return;
    }

    setIsDragging(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = { x: clientX, y: clientY };
    positionStartRef.current = { ...position };

    if (e.cancelable) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      const newX = positionStartRef.current.x + deltaX;
      const newY = positionStartRef.current.y + deltaY;

      setPosition(clampPosition(newX, newY, playerWidth, playerHeight));

      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchmove", handleDragMove, { passive: false });
    document.addEventListener("touchend", handleDragEnd);

    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, playerWidth, playerHeight]);

  const handleMinimizeClick = () => {
    if (isFloating) {
      setIsMinimized(true);
    } else {
      // Go to homepage /feed and switch to floating mode
      setIsMinimized(false);
      navigate("/feed");
    }
  };

  if (!selectedVideo || !coords) return null;

  // Style and class config dynamically based on layout mode
  let style = {};
  let className = "";

  if (isFloating) {
    style = {
      position: "fixed",
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: `${playerWidth}px`,
      height: `${playerHeight}px`,
      zIndex: 9999,
    };
    if (isDragging) {
      style.transition = "none";
    }

    if (isMinimized) {
      className = "bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden flex items-center justify-between px-4 cursor-grab active:cursor-grabbing select-none";
    } else {
      className = "bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col group select-none";
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
    className = "rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 group";
  }

  return (
    <div
      style={style}
      className={className}
      ref={containerRef}
      onMouseDown={isFloating && isMinimized ? handleDragStart : undefined}
      onTouchStart={isFloating && isMinimized ? handleDragStart : undefined}
    >
      {/* Drag overlay to prevent iframe from intercepting pointer events */}
      {isDragging && (
        <div className="absolute inset-0 bg-transparent z-20 pointer-events-auto cursor-grabbing" />
      )}

      {/* Overlay header controls (only when NOT minimized) */}
      {!isMinimized && (
        <div
          onMouseDown={isFloating ? handleDragStart : undefined}
          onTouchStart={isFloating ? handleDragStart : undefined}
          className={`absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 ${
            isFloating ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {isFloating ? (
            <Link to="/videos" className="text-[11px] font-bold text-white hover:underline truncate pr-4 no-underline">
              {selectedVideo.snippet.title}
            </Link>
          ) : (
            <span className="text-[11px] font-bold text-white truncate pr-4">
              {selectedVideo.snippet.title}
            </span>
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleMinimizeClick}
              className="p-1 hover:bg-white/20 rounded text-white border-none bg-transparent cursor-pointer"
              title={isFloating ? "Thu nhỏ thành thanh nhạc" : "Thu nhỏ và về trang chủ"}
            >
              <FaMinus size={10} />
            </button>
            {isFloating && (
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="p-1 hover:bg-red-500/80 rounded text-white border-none bg-transparent cursor-pointer"
                title="Đóng video"
              >
                <FaTimes size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minimized toolbar content */}
      {isFloating && isMinimized && (
        <div className="w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 pointer-events-none">
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
