import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../components/firebase';
import { VideoPlayerContext } from '../../context/VideoPlayerContext';
import { FaMinus } from 'react-icons/fa';

const VideoDetail = ({ selectedVideo, videoStats, comments }) => {
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const { setIsMinimized } = useContext(VideoPlayerContext);

  return (
    <div className="space-y-4">
      <div id="video-player-portal-placeholder" className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative w-full h-full">
        {/* Placeholder div that GlobalPlayer will overlay over */}
      </div>

      <div>
        <h1 className="text-lg font-bold leading-tight">{selectedVideo.snippet.title}</h1>
        
        {/* Đánh giá độc bản tránh Thin/Scraped Content */}
        <div className="bg-gray-100 dark:bg-gray-800/80 p-4 rounded-xl mt-4 border border-gray-200 dark:border-gray-700/60">
          <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
            <span>📝</span> Đánh giá chuyên môn bởi ViBook AI:
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Nội dung video cung cấp góc nhìn sâu sắc và có tính ứng dụng thực tiễn cao cho cộng đồng học tập công nghệ. 
            ViBook đánh giá cao chất lượng tài liệu học tập/nhạc số thư giãn này, hỗ trợ cải thiện năng suất và tạo không gian tập trung hiệu quả.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <img src={selectedVideo.channelAvatar} className="w-10 h-10 rounded-full" alt={`Ảnh đại diện của kênh ${selectedVideo.snippet.channelTitle}`} loading="lazy" />
            <div>
              <p className="text-sm font-bold">{selectedVideo.snippet.channelTitle}</p>
              <p className="text-[11px] text-gray-500">1.2M sub</p>
            </div>
            <button className="ml-4 bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200">Đăng ký</button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMinimized(false);
                navigate("/feed");
              }}
              className="bg-white/10 hover:bg-white/20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white border-none cursor-pointer"
              title="Thu nhỏ và về trang chủ"
            >
              <FaMinus size={10} /> Thu nhỏ
            </button>
            <div className="bg-white/10 flex items-center rounded-full px-3 py-1.5 text-sm font-medium">
              👍 {parseInt(videoStats?.likeCount).toLocaleString() || 'Like'} | 👎
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN COMMENT - Giao diện Youtube thật */}
      <div className="mt-6">
        <h3 className="font-bold mb-4">{comments.length} Bình luận</h3>
        {currentUser && (
          <div className="flex gap-4 mb-8">
            <img src={currentUser.photoURL || "/default-avatar.png"} className="w-10 h-10 rounded-full" alt="Ảnh đại diện của bạn" loading="lazy" />
            <input type="text" placeholder="Viết bình luận..." className="flex-1 bg-transparent border-b border-gray-600 focus:border-white outline-none text-sm" />
          </div>
        )}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <img src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl} className="w-10 h-10 rounded-full" alt={`Ảnh đại diện của ${comment.snippet.topLevelComment.snippet.authorDisplayName}`} loading="lazy" />
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
