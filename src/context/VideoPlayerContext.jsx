import React, { createContext, useState } from "react";

export const VideoPlayerContext = createContext();

export function VideoPlayerProvider({ children }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoStats, setVideoStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

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
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}
