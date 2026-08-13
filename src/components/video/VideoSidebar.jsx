import React from 'react';

const VideoSidebar = ({ videos, selectedVideo, setSelectedVideo }) => {
  return (
    <div className="max-h-screen overflow-y-auto">
      <div className="space-y-3">
        {videos.filter(v => v.id.videoId !== selectedVideo.id.videoId).map((video) => (
          <div key={video.id.videoId} className="flex gap-2 cursor-pointer" onClick={() => setSelectedVideo(video)}>
            <img src={video.snippet.thumbnails.medium.url} className="w-40 aspect-video object-cover rounded-lg flex-shrink-0" alt={`Thumbnail của video: ${video.snippet.title}`} loading="lazy" />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold line-clamp-2 leading-tight">{video.snippet.title}</h4>
              <p className="text-[12px] text-gray-500 mt-1">{video.snippet.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoSidebar;
