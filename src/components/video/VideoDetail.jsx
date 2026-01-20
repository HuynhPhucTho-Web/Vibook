import React from 'react';

const VideoDetail = ({ selectedVideo, videoStats, comments, user }) => {
  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative">
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
      </div>

      <div>
        <h1 className="text-lg font-bold leading-tight">{selectedVideo.snippet.title}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <img src={selectedVideo.channelAvatar} className="w-10 h-10 rounded-full" alt="avatar" />
            <div>
              <p className="text-sm font-bold">{selectedVideo.snippet.channelTitle}</p>
              <p className="text-[11px] text-gray-500">1.2M sub</p>
            </div>
            <button className="ml-4 bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200">Đăng ký</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 flex items-center rounded-full px-3 py-1.5 text-sm font-medium">
              👍 {parseInt(videoStats?.likeCount).toLocaleString() || 'Like'} | 👎
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN COMMENT - Giao diện Youtube thật */}
      <div className="mt-6">
        <h3 className="font-bold mb-4">{comments.length} Bình luận</h3>
        {user && (
          <div className="flex gap-4 mb-8">
            <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
            <input type="text" placeholder="Viết bình luận..." className="flex-1 bg-transparent border-b border-gray-600 focus:border-white outline-none text-sm" />
          </div>
        )}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <img src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl} className="w-10 h-10 rounded-full" alt="" />
              <div>
                <p className="text-xs font-bold">
                  {comment.snippet.topLevelComment.snippet.authorDisplayName}
                  <span className="ml-2 font-normal text-gray-500">{new Date(comment.snippet.topLevelComment.snippet.publishedAt).toLocaleDateString()}</span>
                </p>
                <p className="text-sm mt-1">{comment.snippet.topLevelComment.snippet.textDisplay}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    
  );
};

export default VideoDetail;
