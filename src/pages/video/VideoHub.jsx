import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { FaSearch, FaUser } from 'react-icons/fa';

const API_KEY = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;

function VideoPlayer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [videoStats, setVideoStats] = useState(null);
  const [user, setUser] = useState(null); // Quản lý user đăng nhập
  const [isMobileSearch, setIsMobileSearch] = useState(false);
  const { theme } = useContext(ThemeContext);

  // Giả lập Đăng nhập (Trong thực tế nên dùng @react-oauth/google)
  const handleLogin = () => {
    setUser({ name: "User Name", avatar: "https://ui-avatars.com/api/?name=User" });
  };

  // 1. Lấy danh sách video kèm theo dữ liệu Channel để lấy Avatar ngay từ đầu
  const fetchVideos = async (query) => {
    if (!query) return;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${API_KEY}`);
      const data = await res.json();

      // Lấy thêm stats và channel avatar cho danh sách
      const channelIds = data.items.map(v => v.snippet.channelId).join(',');

      // Fetch song song avatar kênh
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${API_KEY}`);
      const channelData = await channelRes.json();

      const enrichedVideos = data.items.map(video => ({
        ...video,
        channelAvatar: channelData.items.find(c => c.id === video.snippet.channelId)?.snippet?.thumbnails?.default?.url
      }));

      setVideos(enrichedVideos);
      setSelectedVideo(null);
    } catch (error) { console.error(error); }
  };

  // 2. Lấy Like count cho video đang xem
  const fetchVideoDetails = async (videoId) => {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`);
    const data = await res.json();
    setVideoStats(data.items[0]?.statistics);
  };

  const fetchComments = async (videoId) => {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=10&key=${API_KEY}`);
      const data = await res.json();
      setComments(data.items || []);
    } catch { setComments([]); }
  };

  useEffect(() => {
    if (selectedVideo) {
      fetchVideoDetails(selectedVideo.id.videoId);
      fetchComments(selectedVideo.id.videoId);
      window.scrollTo(0, 0);
    }
  }, [selectedVideo]);

  useEffect(() => { fetchVideos("Lofi music 2026"); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVideos(searchTerm);
    setIsMobileSearch(false);
  };

  return (
    <div className={`min-h-screen ${theme === "light" ? "bg-white text-gray-900" : "bg-[#0f0f0f] text-gray-100"}`}>

      {/* HEADER TỐI ƯU MOBILE */}
      <header className={`border-b ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-[#0f0f0f]'} sticky top-0 z-50 py-2`}>
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between">

          {!isMobileSearch && (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSelectedVideo(null)}>
              <span className="text-2xl font-black text-red-600">V</span>
              <span className="text-lg font-bold tracking-tighter hidden sm:block">VideoTube</span>
            </div>
          )}

          <form onSubmit={handleSearch} className={`${isMobileSearch ? 'flex' : 'hidden md:flex'} flex-1 max-w-2xl mx-4 relative items-center`}>
            <input
              type="text" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className={`w-full border border-gray-700 rounded-full py-1.5 px-5 focus:outline-none focus:border-blue-500 ${theme === "light" ? "bg-gray-100 text-gray-900" : "bg-[#121212] text-gray-100"}`}
            />
            {isMobileSearch && <button type="button" onClick={() => setIsMobileSearch(false)} className="ml-2 text-sm">Hủy</button>}
          </form>

          <div className="flex items-center gap-3">
            <button className="md:hidden p-2" onClick={() => setIsMobileSearch(true)}><FaSearch /></button>
            {user ? (
              <img src={user.avatar} className="w-8 h-8 rounded-full border border-gray-500" alt="user" />
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-2 border border-blue-500 text-blue-500 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-500/10">
                <FaUser/> Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {!selectedVideo ? (
          /* GRID VIDEO: Font chữ tiêu đề nhỏ lại (text-sm) */
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
        ) : (
          /* CHI TIẾT VIDEO */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
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

            {/* SIDEBAR */}
            <div className="space-y-3">
              {videos.filter(v => v.id.videoId !== selectedVideo.id.videoId).map((video) => (
                <div key={video.id.videoId} className="flex gap-2 cursor-pointer" onClick={() => setSelectedVideo(video)}>
                  <img src={video.snippet.thumbnails.medium.url} className="w-40 aspect-video object-cover rounded-lg flex-shrink-0" alt="" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold line-clamp-2 leading-tight">{video.snippet.title}</h4>
                    <p className="text-[12px] text-gray-500 mt-1">{video.snippet.channelTitle}</p>
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