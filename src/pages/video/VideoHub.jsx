import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

const API_KEY = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;

function VideoPlayer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [comments, setComments] = useState([]); // Lưu bình luận
  const [channelImage, setChannelImage] = useState(''); // Lưu avatar kênh đang xem
  const [loading, setLoading] = useState(false);
  const { theme } = useContext(ThemeContext);

  // 1. Hàm lấy danh sách video (giữ nguyên logic cũ)
  const fetchVideos = async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${API_KEY}`
      );
      const data = await response.json();
      if (data.items) {
        setVideos(data.items);
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error("Lỗi search:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Hàm lấy Avatar của kênh (khi chọn video)
  const fetchChannelData = async (channelId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`
      );
      const data = await response.json();
      setChannelImage(data.items[0]?.snippet?.thumbnails?.default?.url);
    } catch {
      console.log("Lỗi lấy avatar kênh");
    }
  };
  // 3. Hàm lấy danh sách Bình luận (khi chọn video)
  const fetchComments = async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=10&key=${API_KEY}`
      );
      const data = await response.json();
      setComments(data.items || []);
    } catch {
      console.log("Video này có thể đã tắt tính năng bình luận");
      setComments([]);
    }
  };

  // Tự động gọi dữ liệu chi tiết khi người dùng click vào video
  useEffect(() => {
    if (selectedVideo) {
      fetchChannelData(selectedVideo.snippet.channelId);
      fetchComments(selectedVideo.id.videoId);
      window.scrollTo(0, 0);
    }
  }, [selectedVideo]);

  useEffect(() => { fetchVideos("Lofi music 2026"); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchVideos(searchTerm); };

  return (
    <div className={`min-h-screen ${theme === "light" ? "bg-white text-gray-900" : "bg-[#0f0f0f] text-gray-100"}`}>
      {/* HEADER */}
      <header className={`border-b border-gray-800 sticky top-0 z-50 py-3 ${theme === "light" ? "bg-white" : "bg-[#0f0f0f]"}`}>
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSelectedVideo(null)}>
            <span className="text-3xl font-black text-red-600">V</span>
            <span className="text-xl font-bold tracking-tight hidden md:block">VideoTube</span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
            <input
              type="text" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className={`w-full border border-gray-700 rounded-full py-2 px-11 focus:outline-none focus:border-blue-500 ${theme === "light" ? "bg-gray-100" : "bg-[#121212]"}`}
            />
          </form>
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center font-bold">U</div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {!selectedVideo ? (
          /* DANH SÁCH GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((video) => (
              <div key={video.id.videoId} className="cursor-pointer" onClick={() => setSelectedVideo(video)}>
                <img src={video.snippet.thumbnails.medium.url} className="w-full aspect-video rounded-xl mb-3 object-cover" alt="" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-600 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-bold line-clamp-2 leading-tight">{video.snippet.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{video.snippet.channelTitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* CHI TIẾT VIDEO */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                  frameBorder="0" allowFullScreen
                ></iframe>
              </div>
              
              {/* PHẦN CHI TIẾT KÊNH (CÓ AVATAR) */}
              <div>
                <h1 className="text-xl font-bold">{selectedVideo.snippet.title}</h1>
                <div className="mt-4 flex items-center gap-4 border-b border-gray-800 pb-4">
                  <img src={channelImage} className="w-11 h-11 rounded-full border border-gray-700" alt="avatar" />
                  <div className="flex-1">
                    <p className="font-bold">{selectedVideo.snippet.channelTitle}</p>
                    <p className="text-xs text-gray-400">Đã tải lên: {new Date(selectedVideo.snippet.publishedAt).toLocaleDateString()}</p>
                  </div>
                  <button className="bg-red-600 text-white px-5 py-2 rounded-full font-bold hover:bg-red-700">Đăng ký</button>
                </div>
              </div>

              {/* PHẦN BÌNH LUẬN (COMMENTS) */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-4">{comments.length} Bình luận</h3>
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <img 
                        src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl} 
                        className="w-10 h-10 rounded-full" 
                        alt="" 
                      />
                      <div>
                        <p className="text-sm font-bold">
                          {comment.snippet.topLevelComment.snippet.authorDisplayName}
                          <span className="ml-2 font-normal text-gray-500 text-xs">
                            {new Date(comment.snippet.topLevelComment.snippet.publishedAt).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="text-sm mt-1">{comment.snippet.topLevelComment.snippet.textDisplay}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-4">
              <h3 className="font-bold">Video khác</h3>
              {videos.filter(v => v.id.videoId !== selectedVideo.id.videoId).map((video) => (
                <div key={video.id.videoId} className="flex gap-2 cursor-pointer hover:bg-white/5 p-1 rounded-lg" onClick={() => setSelectedVideo(video)}>
                  <img src={video.snippet.thumbnails.medium.url} className="w-32 aspect-video object-cover rounded-lg flex-shrink-0" alt="" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold line-clamp-2">{video.snippet.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">{video.snippet.channelTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VideoPlayer;