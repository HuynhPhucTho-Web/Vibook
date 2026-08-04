import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

const API_KEY = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;

function VideoPlayer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useContext(ThemeContext);

  // Hàm gọi API tìm kiếm
  const fetchVideos = async (query) => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${API_KEY}`
      );
      const data = await response.json();
      if (data.items) {
        setVideos(data.items);
        setSelectedVideo(null); // Reset về trang danh sách khi tìm kiếm mới
      }
    } catch (error) {
      console.error("Lỗi gọi YouTube API:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load mặc định khi vào trang
  useEffect(() => {
    fetchVideos("Trending now");
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVideos(searchTerm);
  };

  return (
    <div className="page-shell">
      
      {/* HEADER: Thanh tìm kiếm cố định */}
      <header className="vb-glass sticky top-0 z-50 py-3 mb-4 rounded-xl">
        <div className="mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSelectedVideo(null)}>
            <span className="text-3xl font-black text-red-600">V</span>
            <span className="text-xl font-bold tracking-tight hidden md:block">VideoTube</span>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm video..."
              className="w-full vb-input rounded-full py-2 px-11 focus:outline-none"
            />
            <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>

          <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white">U</div>
        </div>
      </header>

      <main className="mx-auto py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-600"></div>
          </div>
        ) : !selectedVideo ? (
          /* --- GIAO DIỆN 1: DANH SÁCH VIDEO (GRID) --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((video) => (
              <div 
                key={video.id.videoId} 
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedVideo(video);
                  window.scrollTo(0, 0);
                }}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                  <img 
                    src={video.snippet.thumbnails.medium.url} 
                    alt={video.snippet.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-semibold">
                    {video.snippet.channelTitle?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold line-clamp-2 leading-tight mb-1">{video.snippet.title}</h3>
                    <p className="text-sm opacity-75">{video.snippet.channelTitle}</p>
                    <p className="text-xs opacity-50">Video mới</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- GIAO DIỆN 2: CHI TIẾT VIDEO (WATCH PAGE) --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player chính */}
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <iframe
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                  title="YouTube video player" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{selectedVideo.snippet.title}</h1>
                <div className="mt-4 flex items-center justify-between border-b border-purple-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">C</div>
                    <div>
                      <p className="font-bold">{selectedVideo.snippet.channelTitle}</p>
                      <p className="text-xs opacity-70">1.2M subscribers</p>
                    </div>
                  </div>
                  <button className="vb-btn vb-btn--primary py-2 px-4 rounded-full font-bold">Subscribe</button>
                </div>
                <div className="mt-4 p-4 vb-glass rounded-xl text-sm">
                  <p className="font-bold mb-1">Mô tả video:</p>
                  <p className="whitespace-pre-wrap">{selectedVideo.snippet.description}</p>
                </div>
              </div>
            </div>

            {/* Sidebar danh sách đề xuất (Lấy từ kết quả tìm kiếm hiện tại) */}
            <div className="space-y-4">
              <h3 className="font-bold mb-2">Video liên quan</h3>
              {videos.filter(v => v.id.videoId !== selectedVideo.id.videoId).map((video) => (
                <div 
                  key={video.id.videoId} 
                  className="flex gap-2 cursor-pointer p-1.5 rounded-lg transition hover:bg-purple-500/10"
                  onClick={() => {
                    setSelectedVideo(video);
                    window.scrollTo(0, 0);
                  }}
                >
                  <img 
                    src={video.snippet.thumbnails.medium.url} 
                    className="w-40 aspect-video object-cover rounded-lg flex-shrink-0" 
                    alt="" 
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold line-clamp-2 leading-tight">{video.snippet.title}</h4>
                    <p className="text-xs mt-1 opacity-70">{video.snippet.channelTitle}</p>
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