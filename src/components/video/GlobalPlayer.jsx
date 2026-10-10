import React, { useContext, useEffect, useState, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { MorphIcon } from "morphicons/react";
import { X, ExternalLink, Minus, Sparkles } from "lucide";
import { VideoPlayerContext } from "../../context/VideoPlayerContext";
import { ThemeContext } from "../../context/ThemeContext";
import AmbientHUD from "./AmbientHUD";

export default function GlobalPlayer() {
  const {
    selectedVideo,
    setSelectedVideo,
    isMinimized,
    setIsMinimized,
    isDetailView,
    setIsDetailView,
    isAmbientMode,
    setIsAmbientMode,
    ambientDim,
    setAmbientDim,
    ambientBlur,
    setAmbientBlur,
    toggleAmbientMode,
    exitAmbientMode,
  } = useContext(VideoPlayerContext);
  const { theme } = useContext(ThemeContext);
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

  // Resizable size state
  const MIN_W = 240;
  const MIN_H = 140;
  const MAX_W = 680;
  const MAX_H = 420;
  const DEFAULT_W = 340;
  const DEFAULT_H = 224;
  const [playerSize, setPlayerSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H });

  // Controls visibility (fast: 150ms hide delay on mouse leave)
  const [showControls, setShowControls] = useState(false);
  const hideTimerRef = useRef(null);

  const isVideosPage = location.pathname === "/videos";
  const isFloating = coords?.isFloating || false;

  const playerWidth = isMinimized ? 290 : playerSize.w;
  const playerHeight = isMinimized ? 56 : playerSize.h;

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
        } else {
          // Placeholder not present (e.g. browsing grid on /videos) -> Float!
          setCoords({
            isFloating: true,
          });
        }
      };

      checkPlaceholder();
      const interval = setInterval(checkPlaceholder, 100);
      window.addEventListener("resize", checkPlaceholder);
      window.addEventListener("scroll", checkPlaceholder, { passive: true });
      return () => {
        clearInterval(interval);
        window.removeEventListener("resize", checkPlaceholder);
        window.removeEventListener("scroll", checkPlaceholder);
      };
    } else {
      setCoords({
        isFloating: true,
      });
    }
  }, [selectedVideo, isVideosPage, isDetailView]);

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

  // Resize handle handlers
  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = { x: clientX, y: clientY, w: playerSize.w, h: playerSize.h };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - resizeStartRef.current.x;
      const dy = clientY - resizeStartRef.current.y;
      const newW = Math.max(MIN_W, Math.min(MAX_W, resizeStartRef.current.w + dx));
      const newH = Math.max(MIN_H, Math.min(MAX_H, resizeStartRef.current.h + dy));
      setPlayerSize({ w: newW, h: newH });
      if (e.cancelable) e.preventDefault();
    };

    const handleResizeEnd = () => setIsResizing(false);

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
    document.addEventListener("touchmove", handleResizeMove, { passive: false });
    document.addEventListener("touchend", handleResizeEnd);
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.removeEventListener("touchmove", handleResizeMove);
      document.removeEventListener("touchend", handleResizeEnd);
    };
  }, [isResizing]);

  // Controls show/hide (fast: 150ms hide delay)
  const handleMouseEnterPlayer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
  };

  const handleMouseLeavePlayer = () => {
    hideTimerRef.current = setTimeout(() => setShowControls(false), 150);
  };

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  const handleExpandToDetail = () => {
    setIsMinimized(false);
    setIsDetailView?.(true);
    navigate("/videos");
  };

  if (!selectedVideo || !coords) return null;

  const isDark = theme === "dark";

  // Style and class config dynamically based on layout mode
  let style = {};
  let className = "";

  if (isAmbientMode) {
    // Ambient Mode: Fullscreen live background wallpaper underneath UI
    style = {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 0,
      pointerEvents: "none",
      overflow: "hidden",
    };
    className = "fixed inset-0 w-screen h-screen overflow-hidden z-0 select-none bg-black pointer-events-none";
  } else if (isFloating) {
    style = {
      position: "fixed",
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: `${playerWidth}px`,
      height: `${playerHeight}px`,
      zIndex: 9999,
    };
    if (isDragging || isResizing) {
      style.transition = "none";
    }

    if (isMinimized) {
      className = isDark
        ? "bg-slate-900/95 border border-slate-800/80 text-white rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-150 overflow-hidden flex items-center justify-between px-4 cursor-grab active:cursor-grabbing select-none"
        : "bg-white/95 border border-slate-200/80 text-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-150 overflow-hidden flex items-center justify-between px-4 cursor-grab active:cursor-grabbing select-none";
    } else {
      className = isDark
        ? "bg-slate-900 border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-150 overflow-hidden flex flex-col select-none"
        : "bg-slate-950 border border-slate-300/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-150 overflow-hidden flex flex-col select-none";
    }
  } else {
    // Docked mode on /videos: firmly fixed to placeholder with zero animation lag
    style = {
      position: "absolute",
      top: coords.top,
      left: coords.left,
      width: coords.width,
      height: coords.height,
      zIndex: 40,
    };
    className = "rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10";
  }

  return (
    <>
      <div
        style={style}
        className={className}
        ref={containerRef}
        onMouseDown={!isAmbientMode && isFloating && isMinimized ? handleDragStart : undefined}
        onTouchStart={!isAmbientMode && isFloating && isMinimized ? handleDragStart : undefined}
        onMouseEnter={!isAmbientMode && isFloating && !isMinimized ? handleMouseEnterPlayer : undefined}
        onMouseLeave={!isAmbientMode && isFloating && !isMinimized ? handleMouseLeavePlayer : undefined}
      >
        {/* Drag / resize overlay to prevent iframe from intercepting pointer events */}
        {!isAmbientMode && (isDragging || isResizing) && (
          <div className="absolute inset-0 bg-transparent z-20 pointer-events-auto cursor-grabbing" />
        )}

        {/* Floating mini-player header bar: shows on hover, hides fast */}
        {!isAmbientMode && isFloating && !isMinimized && (
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className={`h-[34px] px-2.5 bg-slate-900/95 dark:bg-slate-950/95 border-b border-white/10 flex items-center justify-between text-white select-none cursor-grab active:cursor-grabbing shrink-0 transition-opacity duration-150 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <span className="text-xs text-purple-400 shrink-0">🎬</span>
              <button
                type="button"
                onClick={handleExpandToDetail}
                className="text-[11px] font-semibold text-white/90 hover:text-white truncate bg-transparent border-none p-0 cursor-pointer text-left"
                title={selectedVideo.snippet?.title || "Video"}
              >
                {selectedVideo.snippet?.title || "Video đang phát"}
              </button>
            </div>

            <div
              className="flex items-center gap-1 shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleExpandToDetail}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/15 text-white/80 hover:text-white transition-colors duration-100 border-none bg-transparent cursor-pointer"
                title="Phóng to / Xem chi tiết"
              >
                <MorphIcon icon={ExternalLink} size={12} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={toggleAmbientMode}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/15 text-purple-300 hover:text-white transition-colors duration-100 border-none bg-transparent cursor-pointer"
                title="Bật nền toàn cảnh (Ambient Mode)"
              >
                <MorphIcon icon={Sparkles} size={12} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/15 text-white/80 hover:text-white transition-colors duration-100 border-none bg-transparent cursor-pointer"
                title="Thu nhỏ thành thanh nhạc"
              >
                <MorphIcon icon={Minus} size={12} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedVideo(null);
                  setIsDetailView?.(false);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-red-500/25 hover:bg-red-500 text-red-200 hover:text-white transition-colors duration-100 border-none cursor-pointer ml-0.5"
                title="Đóng video"
              >
                <MorphIcon icon={X} size={12} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        )}

        {/* Minimized toolbar content (Audio bar mode) */}
        {!isAmbientMode && isFloating && isMinimized && (
          <div className="w-full h-full flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 pointer-events-none">
              <span className="text-pink-500 animate-[pulse_1s_infinite] shrink-0">🎵</span>
              <p className="text-xs font-bold truncate mb-0">
                {selectedVideo.snippet?.title || "Audio"}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 shrink-0 ml-2"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={toggleAmbientMode}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-purple-400 hover:text-purple-300 border-none bg-transparent cursor-pointer transition-colors duration-100"
                title="Bật nền toàn cảnh (Ambient Mode)"
              >
                <MorphIcon icon={Sparkles} size={12} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 border-none bg-transparent cursor-pointer transition-colors duration-100"
                title="Phóng to video"
              >
                <MorphIcon icon={ExternalLink} size={12} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedVideo(null);
                  setIsDetailView?.(false);
                }}
                className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-none cursor-pointer transition-colors duration-100"
                title="Đóng video"
              >
                <MorphIcon icon={X} size={12} strokeWidth={2.2} />
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
            isAmbientMode
              ? "w-full h-full scale-[1.18] pointer-events-none object-cover"
              : isFloating && isMinimized
                ? "w-0 h-0 absolute opacity-0 pointer-events-none"
                : "w-full flex-1"
          }`}
          style={
            isAmbientMode
              ? {
                  width: "100vw",
                  height: "100vh",
                  transform: "scale(1.18)",
                  transformOrigin: "center center",
                }
              : undefined
          }
          title="Video Player"
        />

        {/* Ambient Contrast Protection Overlay (Dimming + Blur) */}
        {isAmbientMode && (
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              background: `radial-gradient(circle at center, rgba(12, 13, 20, ${ambientDim * 0.7}) 0%, rgba(12, 13, 20, ${ambientDim}) 100%)`,
              backdropFilter: `blur(${ambientBlur}px)`,
              WebkitBackdropFilter: `blur(${ambientBlur}px)`,
            }}
          />
        )}

        {/* Resize handle — bottom-right corner, only when floating & not minimized & not ambient */}
        {!isAmbientMode && isFloating && !isMinimized && (
          <div
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            title="Kéo để thay đổi kích thước"
            className={`absolute bottom-0 right-0 z-30 w-5 h-5 cursor-se-resize transition-opacity duration-150 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            style={{ pointerEvents: showControls ? "auto" : "none" }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-full h-full">
              <line x1="4" y1="15" x2="15" y2="4" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="15" x2="15" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="12" y1="15" x2="15" y2="12" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Floating HUD Controller when in Ambient Mode */}
      {isAmbientMode && (
        <AmbientHUD
          selectedVideo={selectedVideo}
          exitAmbientMode={exitAmbientMode}
          ambientDim={ambientDim}
          setAmbientDim={setAmbientDim}
          ambientBlur={ambientBlur}
          setAmbientBlur={setAmbientBlur}
          handleExpandToDetail={handleExpandToDetail}
          setSelectedVideo={setSelectedVideo}
          setIsDetailView={setIsDetailView}
        />
      )}
    </>
  );
}
