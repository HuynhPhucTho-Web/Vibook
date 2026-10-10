import React, { createContext, useState, useEffect, useCallback } from "react";

export const VideoPlayerContext = createContext();

export function VideoPlayerProvider({ children }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoStats, setVideoStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);

  // Ambient Video Wallpaper Mode State
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  const [ambientDim, setAmbientDim] = useState(0.5); // 0.2 to 0.85
  const [ambientBlur, setAmbientBlur] = useState(4); // 0 to 12 px

  // Toggle or exit Ambient Mode
  const toggleAmbientMode = useCallback(() => {
    setIsAmbientMode((prev) => !prev);
  }, []);

  const exitAmbientMode = useCallback(() => {
    setIsAmbientMode(false);
  }, []);

  // Sync ambient mode state with DOM root classes & CSS variables
  useEffect(() => {
    if (isAmbientMode && selectedVideo) {
      document.body.classList.add("ambient-mode-active");
      document.documentElement.classList.add("ambient-mode-active");
      document.documentElement.style.setProperty("--ambient-dim", String(ambientDim));
      document.documentElement.style.setProperty("--ambient-blur", `${ambientBlur}px`);
    } else {
      document.body.classList.remove("ambient-mode-active");
      document.documentElement.classList.remove("ambient-mode-active");
    }

    return () => {
      document.body.classList.remove("ambient-mode-active");
      document.documentElement.classList.remove("ambient-mode-active");
    };
  }, [isAmbientMode, selectedVideo, ambientDim, ambientBlur]);

  // If video is closed or cleared, ensure ambient mode safely turns off
  useEffect(() => {
    if (!selectedVideo && isAmbientMode) {
      setIsAmbientMode(false);
    }
  }, [selectedVideo, isAmbientMode]);

  // Press ESC to quickly exit ambient mode back to normal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isAmbientMode) {
        exitAmbientMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAmbientMode, exitAmbientMode]);

  return (
    <VideoPlayerContext.Provider
      value={{
        selectedVideo,
        setSelectedVideo,
        videoStats,
        setVideoStats,
        comments,
        setComments,
        videos,
        setVideos,
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
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}
