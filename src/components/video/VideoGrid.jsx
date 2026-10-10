import React, { useState, useEffect, useContext, useMemo } from 'react';
import { MorphIcon } from 'morphicons/react';
import {
  Play,
  Clock,
  Share2,
  Music,
  GraduationCap,
  Laptop,
  Gamepad2,
  Flame,
  ChevronDown,
  RefreshCw,
  Search,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { getFallbackVideosByTopic, FALLBACK_VIDEOS } from './videoFallbackData';

const API_KEY = import.meta.env.VITE_REACT_APP_YOUTUBE_API_KEY;

const timeAgo = (dateStr, lang) => {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (lang === 'vi') {
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return `${Math.floor(diff / 2592000)} tháng trước`;
  }
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
};

// Định nghĩa các chủ đề phân chia riêng biệt theo hàng
const TOPIC_CONFIGS = [
  {
    id: 'music',
    titleVi: 'Âm nhạc & Thư giãn',
    titleEn: 'Music & Chill',
    descVi: 'Giai điệu thư giãn, MV hot và playlist lofi tập trung',
    descEn: 'Chill beats, top hits and study playlists',
    badgeVi: 'ÂM NHẠC',
    badgeEn: 'MUSIC',
    icon: Music,
    accentBorder: 'from-pink-500 to-purple-500',
    badgeColor: 'bg-pink-500/15 text-pink-400',
    categoryId: '10', // YouTube Category 10 = Music
    query: 'nhạc trẻ remix lofi chill học tập',
  },
  {
    id: 'education',
    titleVi: 'Học tập & Lập trình',
    titleEn: 'Study & Coding',
    descVi: 'Khóa học lập trình, cấu trúc dữ liệu, thuật toán và bài giảng',
    descEn: 'Coding tutorials, algorithms and tech lectures',
    badgeVi: 'HỌC TẬP',
    badgeEn: 'EDUCATION',
    icon: GraduationCap,
    accentBorder: 'from-blue-500 to-indigo-500',
    badgeColor: 'bg-blue-500/15 text-blue-400',
    categoryId: '27', // YouTube Category 27 = Education
    query: 'lập trình web tutorial học lập trình công nghệ',
  },
  {
    id: 'tech',
    titleVi: 'Khoa học & Công nghệ',
    titleEn: 'Science & Technology',
    descVi: 'Trí tuệ nhân tạo, đánh giá thiết bị và đột phá khoa học',
    descEn: 'AI breakthroughs, tech reviews and smart devices',
    badgeVi: 'CÔNG NGHỆ',
    badgeEn: 'TECH',
    icon: Laptop,
    accentBorder: 'from-cyan-500 to-blue-500',
    badgeColor: 'bg-cyan-500/15 text-cyan-400',
    categoryId: '28', // YouTube Category 28 = Science & Technology
    query: 'công nghệ ai review thiết bị số',
  },
  {
    id: 'gaming',
    titleVi: 'Giải trí & Gaming',
    titleEn: 'Gaming & Entertainment',
    descVi: 'Khoảnh khắc esports đỉnh cao, video game và giải trí thú vị',
    descEn: 'Top esports moments, gaming videos and entertainment',
    badgeVi: 'GIẢI TRÍ',
    badgeEn: 'GAMING',
    icon: Gamepad2,
    accentBorder: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-500/15 text-purple-400',
    categoryId: '20', // YouTube Category 20 = Gaming
    query: 'gaming highlight esport giải trí',
  },
];

const VideoCard = ({ video, onClick, theme, language }) => {
  const isDark = theme === 'dark';

  return (
    <article
      className={`group flex flex-col rounded-2xl transition-all overflow-hidden cursor-pointer ${
        isDark
          ? 'bg-[#1a1b22]/70 hover:bg-[#1e1f27] border border-white/5'
          : 'bg-white hover:bg-slate-50 border border-slate-200/70 shadow-sm'
      }`}
      onClick={() => onClick(video)}
    >
      <div className={`relative aspect-video w-full overflow-hidden ${isDark ? 'bg-[#292931]' : 'bg-slate-100'}`}>
        <img
          src={video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || `https://i.ytimg.com/vi/${video.id.videoId}/hqdefault.jpg`}
          alt={video.snippet?.title || 'Thumbnail'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `https://i.ytimg.com/vi/${video.id.videoId}/hqdefault.jpg`;
          }}
        />

        {video.isDirectLink && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-purple-600/90 text-white text-[10px] font-semibold backdrop-blur-md shadow-md flex items-center gap-1">
            <MorphIcon icon={Sparkles} size={11} strokeWidth={2.4} />
            <span>{language === 'vi' ? 'Link phát trực tiếp' : 'Direct link'}</span>
          </div>
        )}

        {/* Quick action buttons on hover */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            className={`p-1.5 rounded-lg transition-colors border-none cursor-pointer ${
              isDark
                ? 'bg-[#0c0d14]/85 hover:bg-[#8e54e9] text-white'
                : 'bg-white/95 hover:bg-purple-600 hover:text-white text-slate-700 shadow-sm'
            }`}
            title={language === 'vi' ? 'Xem sau' : 'Watch later'}
            onClick={(e) => e.stopPropagation()}
          >
            <MorphIcon icon={Clock} size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className={`p-1.5 rounded-lg transition-colors border-none cursor-pointer ${
              isDark
                ? 'bg-[#0c0d14]/85 hover:bg-[#4776e6] text-white'
                : 'bg-white/95 hover:bg-blue-600 hover:text-white text-slate-700 shadow-sm'
            }`}
            title={language === 'vi' ? 'Chia sẻ' : 'Share'}
            onClick={(e) => e.stopPropagation()}
          >
            <MorphIcon icon={Share2} size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 flex gap-3 flex-1">
        <div className="shrink-0 pt-0.5">
          <div className={`w-9 h-9 rounded-xl overflow-hidden ${isDark ? 'bg-[#34343c]' : 'bg-slate-200'}`}>
            {video.channelAvatar ? (
              <img
                src={video.channelAvatar}
                alt={video.snippet?.channelTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center font-bold text-sm ${
                  isDark ? 'text-[#d5baff]' : 'text-purple-600'
                }`}
              >
                {video.snippet?.channelTitle?.charAt(0) || 'V'}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[#8e54e9] transition-colors ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {video.snippet?.title}
          </h3>
          <p className={`text-xs mt-1.5 truncate ${isDark ? 'text-[#cdc3d6]' : 'text-slate-500'}`}>
            {video.snippet?.channelTitle}
          </p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#968d9f]' : 'text-slate-400'}`}>
            {timeAgo(video.snippet?.publishedAt, language)}
          </p>
        </div>
      </div>
    </article>
  );
};

const VideoGrid = ({
  videos,
  setSelectedVideo,
  searchTerm,
  quotaExceeded,
  onClearSearch,
  onSelectTag,
}) => {
  const { theme } = useContext(ThemeContext);
  const { language } = useContext(LanguageContext);
  const isDark = theme === 'dark';

  const [searchCategory, setSearchCategory] = useState('all');

  // State quản lý video theo từng chủ đề riêng biệt (khởi tạo với kho dữ liệu fallback phong phú)
  const [topicState, setTopicState] = useState(() => {
    const initial = {};
    TOPIC_CONFIGS.forEach((t) => {
      initial[t.id] = {
        items: getFallbackVideosByTopic(t.id),
        visibleCount: 4,
        nextPageToken: null,
        loading: false,
        loaded: true,
      };
    });
    return initial;
  });

  // State cho section Trending
  const [trendingVisibleCount, setTrendingVisibleCount] = useState(4);

  const hero = videos[0];
  const trendingVideos = videos.slice(1);

  const handleSelectVideoAndSync = (video) => {
    setSelectedVideo(video);
  };

  const t = {
    spotlight: language === 'vi' ? 'TIÊU ĐIỂM HÔM NAY' : 'TODAY SPOTLIGHT',
    hd: '4K HDR',
    watchNow: language === 'vi' ? 'Xem video ngay' : 'Watch now',
    trendingTitle: language === 'vi' ? 'Thịnh hành hôm nay' : 'Trending Today',
    trendingDesc:
      language === 'vi'
        ? 'Các video xu hướng được xem và thảo luận nhiều nhất'
        : 'Most viewed and discussed trending videos',
    trendingBadge: language === 'vi' ? 'XU HƯỚNG' : 'TRENDING',
    loadMore: language === 'vi' ? 'Xem thêm video' : 'Load more videos',
    loading: language === 'vi' ? 'Đang tải thêm...' : 'Loading more...',
  };

  // Helper fetch video theo chủ đề (an toàn, chỉ dùng videos.list chart=mostPopular, không gọi search endpoint)
  const fetchTopicVideos = async (topic, pageToken = '') => {
    const fallbackList = getFallbackVideosByTopic(topic.id);
    try {
      if (!API_KEY || !topic.categoryId || pageToken) {
        return { items: fallbackList, nextPageToken: null };
      }

      // mostPopular chart sử dụng quota videos.list (1 unit) chứ không tốn search_list (100 units)
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=${topic.categoryId}&regionCode=VN&maxResults=8&key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        return { items: fallbackList, nextPageToken: null };
      }

      const data = await res.json();
      if (!data?.items || data.items.length === 0) {
        return { items: fallbackList, nextPageToken: null };
      }

      const normalized = data.items.map((item) => {
        const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
        return {
          ...item,
          id: { videoId },
        };
      });

      const channelIds = normalized
        .map((v) => v.snippet?.channelId)
        .filter(Boolean)
        .join(',');

      let channelData = null;
      if (channelIds) {
        try {
          const cRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${API_KEY}`
          );
          channelData = await cRes.json();
        } catch (e) {
          console.error(e);
        }
      }

      const enriched = normalized.map((v) => ({
        ...v,
        channelAvatar: channelData?.items?.find((c) => c.id === v.snippet?.channelId)
          ?.snippet?.thumbnails?.default?.url,
      }));

      return {
        items: enriched,
        nextPageToken: data.nextPageToken || null,
      };
    } catch (err) {
      console.error('Fetch topic error:', topic.id, err);
      return { items: [], nextPageToken: null };
    }
  };

  // Tải dữ liệu ban đầu cho các chủ đề khi vào trang
  useEffect(() => {
    let cancelled = false;

    TOPIC_CONFIGS.forEach(async (topic) => {
      setTopicState((prev) => ({
        ...prev,
        [topic.id]: { ...prev[topic.id], loading: true },
      }));

      const { items, nextPageToken } = await fetchTopicVideos(topic);

      if (!cancelled) {
        setTopicState((prev) => ({
          ...prev,
          [topic.id]: {
            ...prev[topic.id],
            items,
            nextPageToken,
            loading: false,
            loaded: true,
          },
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Xử lý khi nhấn "Xem thêm / Tải thêm" của một chủ đề
  const handleLoadMoreTopic = async (topic) => {
    const current = topicState[topic.id];
    if (current.loading) return;

    if (current.items.length > current.visibleCount) {
      setTopicState((prev) => ({
        ...prev,
        [topic.id]: {
          ...prev[topic.id],
          visibleCount: Math.min(prev[topic.id].visibleCount + 4, current.items.length),
        },
      }));
      return;
    }

    setTopicState((prev) => ({
      ...prev,
      [topic.id]: { ...prev[topic.id], loading: true },
    }));

    const { items: newItems, nextPageToken } = await fetchTopicVideos(
      topic,
      current.nextPageToken
    );

    setTopicState((prev) => {
      const mergedItems = [...prev[topic.id].items, ...newItems];
      return {
        ...prev,
        [topic.id]: {
          ...prev[topic.id],
          items: mergedItems,
          visibleCount: prev[topic.id].visibleCount + 4,
          nextPageToken,
          loading: false,
        },
      };
    });
  };

  // Lọc theo danh mục trong kết quả tìm kiếm nếu người dùng bấm pill lọc
  const filteredSearchVideos = React.useMemo(() => {
    if (!searchTerm) return videos;
    if (searchCategory === 'all') return videos;
    return videos.filter((v) => {
      if (v.topic === searchCategory) return true;
      const topicConf = TOPIC_CONFIGS.find((tc) => tc.id === searchCategory);
      if (!topicConf) return false;
      const tWords = (topicConf.query || '').toLowerCase().split(' ');
      const title = (v.snippet?.title || '').toLowerCase();
      const desc = (v.snippet?.description || '').toLowerCase();
      return tWords.some((w) => w.length > 2 && (title.includes(w) || desc.includes(w)));
    });
  }, [videos, searchCategory, searchTerm]);

  // Nếu người dùng đang tìm kiếm từ khóa -> Hiển thị dạng Search Results
  if (searchTerm) {
    return (
      <div className="space-y-6">
        {/* Thanh tiêu đề tìm kiếm & Nút xóa / quay lại */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            isDark ? 'bg-[#1a1b22]/80 border-white/10' : 'bg-white border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-[#8e54e9] shrink-0">
              <MorphIcon icon={Search} size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {language === 'vi' ? 'Kết quả tìm kiếm cho:' : 'Search results for:'}{' '}
                <span className="text-[#8e54e9]">"{searchTerm}"</span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {filteredSearchVideos.length}{' '}
                {language === 'vi' ? 'video phù hợp' : 'matching videos'}
              </p>
            </div>
          </div>

          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer self-start sm:self-auto ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <MorphIcon icon={X} size={14} strokeWidth={2.4} />
              <span>{language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}</span>
            </button>
          )}
        </div>

        {/* Cảnh báo hạn mức YouTube API nếu bị 429 */}
        {quotaExceeded && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-colors ${
              isDark
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="shrink-0 p-1.5 rounded-xl bg-amber-500/20 text-amber-500 mt-0.5">
              <MorphIcon icon={AlertCircle} size={18} strokeWidth={2.2} />
            </div>
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-semibold text-amber-400 dark:text-amber-300">
                {language === 'vi'
                  ? 'Hạn mức tìm kiếm YouTube API hôm nay đã đạt giới hạn (100 lượt/ngày của Google)'
                  : 'Daily YouTube Search Quota Exceeded (Google 100 queries/day limit)'}
              </p>
              <p className="mt-1 opacity-90 leading-relaxed text-xs">
                {language === 'vi'
                  ? 'ViBook đang tìm kiếm siêu tốc trên kho video sẵn có và tuyển chọn. Bạn cũng có thể dán trực tiếp link video YouTube (URL) hoặc Video ID vào ô tìm kiếm để phát bất kỳ video nào ngay lập tức!'
                  : 'ViBook is searching across preloaded and curated video library. You can also paste any direct YouTube URL or Video ID to play it instantly!'}
              </p>
            </div>
          </div>
        )}

        {/* Nút lọc nhanh theo danh mục trong kết quả tìm kiếm */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setSearchCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              searchCategory === 'all'
                ? 'bg-[#8e54e9] text-white border-transparent shadow-[0_0_12px_rgba(142,84,233,0.35)]'
                : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            {language === 'vi' ? 'Tất cả' : 'All'}
          </button>
          {TOPIC_CONFIGS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSearchCategory(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                searchCategory === t.id
                  ? 'bg-[#8e54e9] text-white border-transparent shadow-[0_0_12px_rgba(142,84,233,0.35)]'
                  : isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <MorphIcon icon={t.icon} size={13} strokeWidth={2.2} />
              <span>{language === 'vi' ? t.titleVi : t.titleEn}</span>
            </button>
          ))}
        </div>

        {/* Lưới video kết quả tìm kiếm */}
        {filteredSearchVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredSearchVideos.map((v) => (
              <VideoCard
                key={v.id.videoId}
                video={v}
                onClick={handleSelectVideoAndSync}
                theme={theme}
                language={language}
              />
            ))}
          </div>
        ) : (
          /* Trạng thái không tìm thấy & Gợi ý từ khóa hot */
          <div
            className={`py-12 px-6 rounded-3xl border flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-4 ${
              isDark ? 'bg-[#1a1b22]/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-600/15 text-[#8e54e9] flex items-center justify-center">
              <MorphIcon icon={Sparkles} size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {language === 'vi'
                  ? `Không tìm thấy video nào cho "${searchTerm}"`
                  : `No videos found for "${searchTerm}"`}
              </h3>
              <p className={`text-xs mt-1 max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'vi'
                  ? 'Hãy thử tìm bằng từ khóa khác hoặc bấm vào các chủ đề gợi ý bên dưới:'
                  : 'Try searching with another keyword or explore suggested tags below:'}
              </p>
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {[
                { label: 'lofi chill', vi: 'Lofi Chill' },
                { label: 'react tutorial', vi: 'React JS' },
                { label: 'nhạc học tập', vi: 'Nhạc Học Tập' },
                { label: 'công nghệ ai', vi: 'Trí Tuệ AI' },
                { label: 'gaming', vi: 'Gaming' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => onSelectTag?.(chip.label)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-purple-600/15 border-purple-500/25 text-purple-300 hover:bg-purple-600/25'
                      : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  ⚡ {language === 'vi' ? chip.vi : chip.label}
                </button>
              ))}
            </div>

            {onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#8e54e9] hover:bg-[#7b42d6] text-white border-none cursor-pointer transition-all shadow-md"
              >
                {language === 'vi' ? 'Quay lại danh sách video' : 'Back to video list'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* ── 1. Hero Spotlight Banner ── */}
      {hero && (
        <section
          className={`relative w-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer group transition-all ${
            isDark ? 'bg-[#1a1b22]' : 'bg-slate-900 text-white'
          }`}
          onClick={() => handleSelectVideoAndSync(hero)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d14] via-[#1a1b22]/90 to-transparent z-10" />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 md:p-10 z-20">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#8e54e9] text-white text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(142,84,233,0.4)]">
                  ⚡ {t.spotlight}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-[#b2c5ff] text-xs font-mono font-semibold">
                  {t.hd}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight line-clamp-3">
                {hero.snippet?.title}
              </h1>

              <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {hero.snippet?.description}
              </p>

              <div className="flex items-center gap-3">
                {hero.channelAvatar ? (
                  <img
                    src={hero.channelAvatar}
                    alt={hero.snippet?.channelTitle}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center font-bold text-white">
                    {hero.snippet?.channelTitle?.charAt(0) || 'V'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{hero.snippet?.channelTitle}</p>
                  <p className="text-xs text-slate-400">{timeAgo(hero.snippet?.publishedAt, language)}</p>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#8e54e9] to-[#4776e6] text-white font-semibold text-sm shadow-[0_0_20px_rgba(142,84,233,0.4)] hover:shadow-[0_0_28px_rgba(142,84,233,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all border-none cursor-pointer"
              >
                <MorphIcon icon={Play} size={18} strokeWidth={2.4} />
                <span>{t.watchNow}</span>
              </button>
            </div>

            <div className="lg:col-span-5">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={hero.snippet?.thumbnails?.high?.url || hero.snippet?.thumbnails?.medium?.url}
                  alt={hero.snippet?.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#8e54e9]/85 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_24px_rgba(142,84,233,0.7)] group-hover:scale-110 group-hover:bg-[#8e54e9] transition-all">
                    <MorphIcon icon={Play} size={30} strokeWidth={2.6} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Hàng Thịnh hành hôm nay ── */}
      {trendingVideos.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white shadow-md">
                <MorphIcon icon={Flame} size={20} strokeWidth={2.4} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {t.trendingTitle}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-mono text-[11px] font-semibold">
                    {t.trendingBadge}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.trendingDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {trendingVideos.slice(0, trendingVisibleCount).map((v) => (
              <VideoCard
                key={v.id.videoId}
                video={v}
                onClick={handleSelectVideoAndSync}
                theme={theme}
                language={language}
              />
            ))}
          </div>

          {trendingVideos.length > trendingVisibleCount && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setTrendingVisibleCount((prev) => prev + 4)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  isDark
                    ? 'bg-[#1a1b22] hover:bg-[#252631] text-white border-white/10'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm'
                }`}
              >
                <MorphIcon icon={ChevronDown} size={15} strokeWidth={2.2} />
                <span>{language === 'vi' ? 'Xem thêm thịnh hành' : 'Load more trending'}</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── 3. Các hàng phân chia riêng biệt theo từng chủ đề ── */}
      {TOPIC_CONFIGS.map((topic) => {
        const state = topicState[topic.id];
        const displayVideos = state.items.slice(0, state.visibleCount);
        const title = language === 'vi' ? topic.titleVi : topic.titleEn;
        const desc = language === 'vi' ? topic.descVi : topic.descEn;
        const badge = language === 'vi' ? topic.badgeVi : topic.badgeEn;
        const TopicIcon = topic.icon;

        return (
          <section key={topic.id} className="space-y-5">
            {/* Header của từng hàng chủ đề */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${topic.accentBorder} flex items-center justify-center text-white shadow-md`}
                >
                  <MorphIcon icon={TopicIcon} size={19} strokeWidth={2.4} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {title}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${topic.badgeColor}`}>
                      {badge}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Danh sách video 4 cột của chủ đề này */}
            {state.loading && state.items.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`aspect-video rounded-2xl animate-pulse ${
                      isDark ? 'bg-[#1a1b22]' : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {displayVideos.map((v) => (
                  <VideoCard
                    key={v.id.videoId}
                    video={v}
                    onClick={handleSelectVideoAndSync}
                    theme={theme}
                    language={language}
                  />
                ))}
              </div>
            )}

            {/* Nút Xem thêm / Tải thêm riêng cho từng chủ đề */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => handleLoadMoreTopic(topic)}
                disabled={state.loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  isDark
                    ? 'bg-[#1a1b22] hover:bg-[#252631] text-white border-white/10 disabled:opacity-50'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-sm disabled:opacity-50'
                }`}
              >
                {state.loading ? (
                  <>
                    <MorphIcon icon={RefreshCw} size={14} className="animate-spin" />
                    <span>{t.loading}</span>
                  </>
                ) : (
                  <>
                    <MorphIcon icon={ChevronDown} size={15} strokeWidth={2.2} />
                    <span>
                      {language === 'vi' ? `Xem thêm ${topic.titleVi.toLowerCase()}` : `Load more ${topic.titleEn}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default VideoGrid;
