import React, { useContext } from 'react';
import { MorphIcon } from 'morphicons/react';
import { Radio, Play } from 'lucide';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

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

const VideoSidebar = ({ videos, selectedVideo, setSelectedVideo }) => {
  const { theme } = useContext(ThemeContext);
  const { language } = useContext(LanguageContext);
  const isDark = theme === 'dark';

  const t = {
    playlist: language === 'vi' ? 'Danh sách học phần & liên quan' : 'Playlist & Related',
    related: language === 'vi' ? 'Video liên quan' : 'Related Videos',
    autoPlay: language === 'vi' ? 'Tự động phát bài kế tiếp' : 'Autoplay next video',
    nextUp: language === 'vi' ? 'BÀI TIẾP THEO' : 'NEXT UP',
    loadMore: language === 'vi' ? 'Tải thêm bài học liên quan' : 'Load more related videos',
  };

  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-[#cdc3d6]' : 'text-slate-600';
  const textMute = isDark ? 'text-[#968d9f]' : 'text-slate-400';
  const cardBg = isDark
    ? 'bg-[#1a1b22]/90 border border-white/10'
    : 'bg-white border border-slate-200/80 shadow-sm';

  const related = videos.filter((v) => v.id.videoId !== selectedVideo?.id?.videoId);
  const nextUp = related[0];
  const rest = related.slice(1);

  return (
    <div
      className="flex flex-col gap-5 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* ── PLAYLIST HEADER CARD ── */}
      <div className={`rounded-3xl backdrop-blur-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-[#8e54e9] uppercase tracking-wider font-semibold">
              {t.playlist}
            </span>
            <h3 className={`text-base font-bold mt-0.5 ${textPrimary}`}>
              {selectedVideo?.snippet?.channelTitle || t.related}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-600/15 flex items-center justify-center text-[#8e54e9]">
            <MorphIcon icon={Radio} size={18} strokeWidth={2.4} />
          </div>
        </div>

        {/* Autoplay Switcher */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className={`text-xs font-medium ${textPrimary}`}>{t.autoPlay}</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input defaultChecked type="checkbox" className="sr-only peer" />
            <div className="w-9 h-5 bg-slate-700/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8e54e9]" />
          </label>
        </div>
      </div>

      {/* ── UPCOMING VIDEO LIST ── */}
      <div className="flex flex-col gap-3.5">
        {/* Next Up Video Card */}
        {nextUp && (
          <div
            className={`group flex gap-3 p-2.5 rounded-2xl transition-all cursor-pointer shadow-md ${
              isDark
                ? 'bg-[#1a1b22]/70 hover:bg-[#1e1f27] border border-white/5'
                : 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm'
            }`}
            onClick={() => setSelectedVideo(nextUp)}
          >
            <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-slate-800 shrink-0">
              <img
                src={nextUp.snippet.thumbnails.medium?.url}
                alt={nextUp.snippet.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#8e54e9]/90 text-white text-[9px] font-mono font-semibold uppercase tracking-wider">
                {t.nextUp}
              </span>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <MorphIcon icon={Play} size={22} className="text-white" strokeWidth={2.4} />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
              <h4
                className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover:text-[#8e54e9] transition-colors ${textPrimary}`}
              >
                {nextUp.snippet.title}
              </h4>
              <div className="mt-1">
                <p className={`text-xs truncate ${textSub}`}>{nextUp.snippet.channelTitle}</p>
                <p className={`text-[11px] mt-0.5 ${textMute}`}>{timeAgo(nextUp.snippet.publishedAt, language)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rest of playlist */}
        {rest.map((video) => (
          <div
            key={video.id.videoId}
            className={`group flex gap-3 p-2 rounded-2xl transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1a1b22]/40 hover:bg-[#1e1f27] border border-white/5'
                : 'bg-white/60 hover:bg-white border border-slate-100'
            }`}
            onClick={() => setSelectedVideo(video)}
          >
            <div className="relative w-32 aspect-video rounded-xl overflow-hidden bg-slate-800 shrink-0">
              <img
                src={video.snippet.thumbnails.medium?.url}
                alt={video.snippet.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <MorphIcon icon={Play} size={18} className="text-white" strokeWidth={2.4} />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
              <h4
                className={`text-xs font-semibold line-clamp-2 leading-snug group-hover:text-[#8e54e9] transition-colors ${textPrimary}`}
              >
                {video.snippet.title}
              </h4>
              <div className="mt-1">
                <p className={`text-[11px] truncate ${textSub}`}>{video.snippet.channelTitle}</p>
                <p className={`text-[10px] mt-0.5 ${textMute}`}>{timeAgo(video.snippet.publishedAt, language)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <button
        type="button"
        className={`w-full py-3 rounded-2xl text-xs font-semibold transition-all text-center border-none cursor-pointer ${
          isDark
            ? 'bg-[#1a1b22] hover:bg-[#1e1f27] text-white border border-white/5'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
        }`}
      >
        {t.loadMore}
      </button>
    </div>
  );
};

export default VideoSidebar;
