import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MorphIcon } from 'morphicons/react';
import { ArrowLeft, House, Play, ExternalLink, Sparkles } from 'lucide';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import VideoGrid from '../../components/video/VideoGrid';
import VideoDetail from '../../components/video/VideoDetail';
import VideoSidebar from '../../components/video/VideoSidebar';
import { useSearch } from '../../context/SearchContext';
import SEO from '../../components/SEO';
import { VideoPlayerContext } from '../../context/VideoPlayerContext';
import {
  FALLBACK_VIDEOS,
  extractYouTubeVideoId,
  createVideoFromDirectId,
  searchVideosLocally,
} from '../../components/video/videoFallbackData';

const API_KEY = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;

function VideoPlayer() {
  const { keyword: searchTerm, setKeyword, setSearchConfig } = useSearch();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const { language } = useContext(LanguageContext);

  const {
    videos,
    setVideos,
    selectedVideo,
    setSelectedVideo,
    comments,
    setComments,
    videoStats,
    setVideoStats,
    isDetailView,
    setIsDetailView,
    isAmbientMode,
    toggleAmbientMode,
  } = useContext(VideoPlayerContext);

  const [searchResults, setSearchResults] = useState(null);
  const [quotaExceeded, setQuotaExceeded] = useState(() => {
    return sessionStorage.getItem('vibook_yt_quota_exceeded') === new Date().toDateString();
  });

  const searchCacheRef = useRef({});
  const debounceTimerRef = useRef(null);

  const isDark = theme === 'dark';

  const t = {
    backToList: language === 'vi' ? 'Quay lại danh sách' : 'Back to videos',
    home: language === 'vi' ? 'Trang chủ' : 'Home',
    expand: language === 'vi' ? 'Xem chi tiết' : 'Expand',
    ambientMode: language === 'vi' ? 'Nền toàn cảnh' : 'Ambient Mode',
    normalMode: language === 'vi' ? 'Chế độ bình thường' : 'Normal Mode',
    searchPlaceholder: language === 'vi' ? 'Tìm video hoặc dán link/ID YouTube...' : 'Search video or paste YouTube URL/ID...',
    pageTitle: language === 'vi' ? 'ViBook Video Hub - Khám phá & Thịnh hành' : 'ViBook Video Hub - Explore & Trending',
    pageDesc: language === 'vi'
      ? 'Khám phá các video thịnh hành, bài giảng học tập, công nghệ và giải trí chất lượng cao trên ViBook.'
      : 'Explore trending videos, tutorials, tech insights, and entertainment on ViBook.',
  };

  useEffect(() => {
    setSearchConfig({
      placeholder: t.searchPlaceholder,
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig, language]);

  // Khởi tạo danh sách ban đầu với kho video chất lượng cao dự phòng
  useEffect(() => {
    if (videos.length === 0) {
      setVideos(FALLBACK_VIDEOS);
      fetchPopularVideos();
    }
  }, []);

  // Lấy video thịnh hành online từ YouTube (sử dụng chart=mostPopular không tốn quota search_list)
  const fetchPopularVideos = async () => {
    try {
      if (!API_KEY) return;
      const popularRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=VN&maxResults=20&key=${API_KEY}`
      );
      if (popularRes.status === 429) {
        setQuotaExceeded(true);
        sessionStorage.setItem('vibook_yt_quota_exceeded', new Date().toDateString());
        return;
      }
      const data = await popularRes.json();
      if (!data?.items || data.items.length === 0) return;

      const normalizedItems = data.items.map((item) => {
        const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
        return {
          ...item,
          id: { videoId },
        };
      });

      // Lấy avatar kênh
      const channelIds = normalizedItems
        .map((v) => v.snippet?.channelId)
        .filter(Boolean)
        .join(',');

      let channelData = null;
      if (channelIds) {
        try {
          const channelRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${API_KEY}`
          );
          if (channelRes.ok) {
            channelData = await channelRes.json();
          }
        } catch {
          // ignore channel avatar error
        }
      }

      const enrichedVideos = normalizedItems.map((video) => ({
        ...video,
        channelAvatar: channelData?.items?.find(
          (c) => c.id === video.snippet?.channelId
        )?.snippet?.thumbnails?.default?.url,
      }));

      // Gộp video mới với fallback (ưu tiên video mới)
      const mergedMap = new Map();
      enrichedVideos.forEach((v) => mergedMap.set(v.id.videoId, v));
      FALLBACK_VIDEOS.forEach((v) => {
        if (!mergedMap.has(v.id.videoId)) mergedMap.set(v.id.videoId, v);
      });

      setVideos(Array.from(mergedMap.values()));
    } catch {
      // Giữ nguyên FALLBACK_VIDEOS nếu có lỗi mạng
    }
  };

  // ── XỬ LÝ TÌM KIẾM TỨC THÌ (INSTANT LOCAL SEARCH) + DEBOUNCED ONLINE SEARCH ──
  useEffect(() => {
    const query = searchTerm ? searchTerm.trim() : '';

    if (!query) {
      setSearchResults(null);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    // 1. TÌM KIẾM TỨC THÌ (0ms latency) TRÊN DANH SÁCH VIDEO HIỆN CÓ
    const directVideoId = extractYouTubeVideoId(query);
    const directVideo = directVideoId ? createVideoFromDirectId(directVideoId, query) : null;

    // Gom toàn bộ video đã biết (videos + FALLBACK_VIDEOS)
    const knownPoolMap = new Map();
    (videos || []).forEach((v) => knownPoolMap.set(v.id.videoId, v));
    FALLBACK_VIDEOS.forEach((v) => {
      if (!knownPoolMap.has(v.id.videoId)) knownPoolMap.set(v.id.videoId, v);
    });
    const candidateList = Array.from(knownPoolMap.values());

    let immediateResults = searchVideosLocally(candidateList, query);

    // Nếu người dùng nhập URL hoặc ID YouTube trực tiếp, ghim lên đầu kết quả
    if (directVideo) {
      immediateResults = [
        directVideo,
        ...immediateResults.filter((v) => v.id.videoId !== directVideoId),
      ];
    }

    setSearchResults(immediateResults);
    setIsDetailView(false);

    // 2. TÌM KIẾM ONLINE (Debounce 600ms, Cache, chống lỗi 429 Quota Exceeded)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    // Nếu đã dán trực tiếp link video YouTube, không cần gọi endpoint search (tiết kiệm quota)
    if (directVideoId) return;

    // Nếu quota hôm nay đã bị cạn kiệt, không gửi thêm request search để tránh lỗi 429
    if (quotaExceeded) return;

    debounceTimerRef.current = setTimeout(async () => {
      const cleanKey = query.toLowerCase();

      // Kiểm tra bộ nhớ đệm (Cache)
      if (searchCacheRef.current[cleanKey]) {
        const cached = searchCacheRef.current[cleanKey];
        const merged = Array.from(
          new Map([...cached, ...immediateResults].map((v) => [v.id.videoId, v])).values()
        );
        setSearchResults(merged);
        return;
      }

      if (!API_KEY) return;

      try {
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            query
          )}&type=video&maxResults=16&key=${API_KEY}`
        );

        if (searchRes.status === 429) {
          setQuotaExceeded(true);
          sessionStorage.setItem('vibook_yt_quota_exceeded', new Date().toDateString());
          return;
        }

        const data = await searchRes.json();

        if (data?.error?.code === 429 || data?.error?.status === 'RESOURCE_EXHAUSTED') {
          setQuotaExceeded(true);
          sessionStorage.setItem('vibook_yt_quota_exceeded', new Date().toDateString());
          return;
        }

        if (!data?.items || data.items.length === 0) return;

        const normalizedItems = data.items.map((item) => {
          const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
          return {
            ...item,
            id: { videoId },
          };
        });

        // Lấy avatar kênh
        const channelIds = normalizedItems
          .map((v) => v.snippet?.channelId)
          .filter(Boolean)
          .join(',');

        let channelData = null;
        if (channelIds) {
          try {
            const cRes = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${API_KEY}`
            );
            if (cRes.ok) channelData = await cRes.json();
          } catch {
            // ignore
          }
        }

        const enriched = normalizedItems.map((video) => ({
          ...video,
          channelAvatar: channelData?.items?.find(
            (c) => c.id === video.snippet?.channelId
          )?.snippet?.thumbnails?.default?.url,
        }));

        // Lưu vào cache
        searchCacheRef.current[cleanKey] = enriched;

        // Gộp kết quả online với kết quả local đã hiển thị
        const mergedMap = new Map();
        enriched.forEach((v) => mergedMap.set(v.id.videoId, v));
        immediateResults.forEach((v) => {
          if (!mergedMap.has(v.id.videoId)) mergedMap.set(v.id.videoId, v);
        });

        setSearchResults(Array.from(mergedMap.values()));
      } catch (err) {
        console.warn('YouTube search API error, falling back to local results:', err);
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm, quotaExceeded]);

  // Fetch video details (thống kê view, like)
  const fetchVideoDetails = async (videoId) => {
    try {
      if (!API_KEY) return;
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`
      );
      if (res.status === 429) return;
      const data = await res.json();
      setVideoStats(data.items?.[0]?.statistics);
    } catch {
      // ignore
    }
  };

  const fetchComments = async (videoId) => {
    try {
      if (!API_KEY) return;
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=10&key=${API_KEY}`
      );
      if (res.status === 429) return;
      const data = await res.json();
      setComments(data.items || []);
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    if (selectedVideo) {
      fetchVideoDetails(selectedVideo.id.videoId);
      fetchComments(selectedVideo.id.videoId);
      if (isDetailView) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedVideo]);


  const videoSchema = useMemo(() => {
    if (!videos || videos.length === 0) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: videos.map((video, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'VideoObject',
          name: video.snippet.title,
          description: video.snippet.description || 'Video ThoDev',
          thumbnailUrl: [
            video.snippet.thumbnails?.medium?.url ||
              video.snippet.thumbnails?.default?.url,
          ],
          uploadDate: video.snippet.publishedAt || new Date().toISOString(),
          embedUrl: `https://www.youtube.com/embed/${video.id.videoId}`,
        },
      })),
    };
  }, [videos]);

  const showDetail = Boolean(selectedVideo && isDetailView);

  return (
    <div className={`page-shell ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <SEO
        title={t.pageTitle}
        description={t.pageDesc}
        slug="/videos"
        schema={videoSchema}
      />

      {/* ── Main Container: max-w-[1200px] đồng bộ chuẩn với Home.jsx ── */}
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-4 box-border">
        {/* ── Top Navigation Bar (Gọn gàng, không trùng lặp nút) ── */}
        <div
          className={`rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border transition-colors backdrop-blur-xl ${
            isDark
              ? 'bg-[#1a1b22]/80 border-white/10'
              : 'bg-white/80 border-slate-200/80 shadow-sm'
          }`}
        >
          {showDetail ? (
            <div className="flex items-center justify-between w-full gap-3 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 1. Nút Quay lại danh sách video (Video vẫn phát và tự động thu nhỏ nổi) */}
                <button
                  type="button"
                  onClick={() => setIsDetailView(false)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${
                    isDark
                      ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                  }`}
                  title={t.backToList}
                >
                  <MorphIcon icon={ArrowLeft} size={15} strokeWidth={2.4} />
                  <span>{t.backToList}</span>
                </button>

                {/* 2. Nút Về Trang chủ Home /feed (Video vẫn phát và thu nhỏ nổi) */}
                <button
                  type="button"
                  onClick={() => navigate('/feed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                  title={t.home}
                >
                  <MorphIcon icon={House} size={15} strokeWidth={2.2} />
                  <span className="hidden sm:inline">{t.home}</span>
                </button>
              </div>

              {/* Title hint */}
              <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 justify-end text-xs truncate opacity-75">
                <span className="truncate max-w-[360px] font-medium">
                  {selectedVideo.snippet.title}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-4">
              {/* Brand Logo */}
              <div
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => setIsDetailView(false)}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8e54e9] to-[#4776e6] flex items-center justify-center shadow-[0_0_14px_rgba(142,84,233,0.35)] text-white">
                  <MorphIcon icon={Play} size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-base font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Tho-Dev
                  </span>
                  <span className="text-[10px] text-[#8e54e9] font-mono tracking-widest uppercase font-semibold">
                    Video Hub
                  </span>
                </div>
              </div>

              {/* Nếu đang có video phát nổi, hiển thị shortcut quay lại chi tiết */}
              {selectedVideo && !isDetailView && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAmbientMode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isAmbientMode
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-purple-500/30'
                        : isDark
                          ? 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
                          : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                    }`}
                    title={isAmbientMode ? t.normalMode : t.ambientMode}
                  >
                    <MorphIcon icon={Sparkles} size={13} strokeWidth={2.2} />
                    <span className="hidden sm:inline">
                      {isAmbientMode ? t.normalMode : t.ambientMode}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDetailView(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
                        : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                    }`}
                    title={t.expand}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="truncate max-w-[130px] sm:max-w-[240px]">
                      {selectedVideo.snippet.title}
                    </span>
                    <MorphIcon icon={ExternalLink} size={13} strokeWidth={2.2} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Main View: Grid hoặc Detail ── */}
        <main className="w-full">
          {!showDetail ? (
            <VideoGrid
              videos={searchResults !== null ? searchResults : videos}
              searchTerm={searchTerm}
              quotaExceeded={quotaExceeded}
              onClearSearch={() => setKeyword('')}
              onSelectTag={(tag) => setKeyword(tag)}
              setSelectedVideo={(video) => {
                setSelectedVideo(video);
                setIsDetailView(true);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
                <VideoDetail
                  selectedVideo={selectedVideo}
                  videoStats={videoStats}
                  comments={comments}
                />
              </div>
              <div className="lg:col-span-4 flex flex-col gap-6">
                <VideoSidebar
                  videos={videos}
                  selectedVideo={selectedVideo}
                  setSelectedVideo={(video) => {
                    setSelectedVideo(video);
                    setIsDetailView(true);
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default VideoPlayer;