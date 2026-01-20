import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import VideoHeader from '../../components/video/VideoHeader';
import VideoGrid from '../../components/video/VideoGrid';
import VideoDetail from '../../components/video/VideoDetail';
import VideoSidebar from '../../components/video/VideoSidebar';

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

      <VideoHeader
        theme={theme}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        isMobileSearch={isMobileSearch}
        setIsMobileSearch={setIsMobileSearch}
        user={user}
        handleLogin={handleLogin}
        onLogoClick={() => setSelectedVideo(null)}
      />

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {!selectedVideo ? (
          <VideoGrid videos={videos} setSelectedVideo={setSelectedVideo} />
        ) : (
          /* CHI TIẾT VIDEO */
          <div className="flex gap-6">
            <div className="flex-1">
              <VideoDetail selectedVideo={selectedVideo} videoStats={videoStats} comments={comments} user={user} />
            </div>
            <div className="w-64 flex-shrink-0">
              <VideoSidebar videos={videos} selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VideoPlayer;