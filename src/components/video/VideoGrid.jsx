import React from 'react';

const VideoGrid = ({ videos, setSelectedVideo }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
      {videos.map((video) => (
        <div key={video.id.videoId} className="cursor-pointer group" onClick={() => setSelectedVideo(video)}>
          <img src={video.snippet.thumbnails.medium.url} className="w-full aspect-video rounded-xl mb-3 object-cover group-hover:rounded-none transition-all" alt="" />
          <div className="flex gap-3">
            <img src={video.channelAvatar} className="w-9 h-9 rounded-full bg-gray-200" alt="" />
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold line-clamp-2 leading-5 mb-1">{video.snippet.title}</h3>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">{video.snippet.channelTitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
