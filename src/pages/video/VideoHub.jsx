import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import VideoHeader from '../../components/video/VideoHeader';
import VideoGrid from '../../components/video/VideoGrid';
import VideoDetail from '../../components/video/VideoDetail';
import VideoSidebar from '../../components/video/VideoSidebar';
import { useSearch } from '../../context/SearchContext';
import SEO from '../../components/SEO';
import { VideoPlayerContext } from '../../context/VideoPlayerContext';

const API_KEY = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;

function VideoPlayer() {
  const { keyword: searchTerm, setSearchConfig } = useSearch();

  useEffect(() => {
    setSearchConfig({
      placeholder: "Tìm kiếm video...",
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig]);

  useEffect(() => {
    if (searchTerm) {
      fetchVideos(searchTerm);
      setSelectedVideo(null); // Trở về danh sách lưới khi người dùng gõ tìm kiếm mới
    }
  }, [searchTerm]);
  const {
    videos, setVideos,
    selectedVideo, setSelectedVideo,
    comments, setComments,
    videoStats, setVideoStats
  } = useContext(VideoPlayerContext);
  const [isMobileSearch, setIsMobileSearch] = useState(false);
  const { theme } = useContext(ThemeContext);

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

  useEffect(() => {
    // Chỉ tải danh sách mặc định khi ứng dụng khởi tạo nguội (chưa có video nào)
    if (videos.length === 0) {
      fetchVideos("Lofi music 2026");
    }
  }, []);



  const videoSchema = useMemo(() => {
    if (!videos || videos.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": videos.map((video, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "VideoObject",
          "name": video.snippet.title,
          "description": video.snippet.description || "Video chia sẻ học tập/giải trí tại ThoDev",
          "thumbnailUrl": [video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url],
          "uploadDate": video.snippet.publishedAt || new Date().toISOString(),
          "embedUrl": `https://www.youtube.com/embed/${video.id.videoId}`
        }
      }))
    };
  }, [videos]);

  return (
    <div className="page-shell">
      <SEO
        title="Kho Video & Nhạc Lofi Relax"
        description="Thư giãn cùng kho video nhạc Lofi học tập, làm việc cực chất và các video chia sẻ công nghệ hữu ích tại ThoDev."
        slug="/videos"
        schema={videoSchema}
      />

      <VideoHeader
        theme={theme}
        onLogoClick={() => setSelectedVideo(null)}
      />

      <main className="mx-auto py-6">
        {!selectedVideo ? (
          <VideoGrid videos={videos} setSelectedVideo={setSelectedVideo} />
        ) : (
          /* CHI TIẾT VIDEO */
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <VideoDetail selectedVideo={selectedVideo} videoStats={videoStats} comments={comments} />
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <VideoSidebar videos={videos} selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VideoPlayer;