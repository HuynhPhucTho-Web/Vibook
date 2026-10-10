import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MorphIcon } from 'morphicons/react';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Minimize2,
  ListPlus,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide';
import { VideoPlayerContext } from '../../context/VideoPlayerContext';
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

const VideoDetail = ({ selectedVideo, videoStats, comments }) => {
  const navigate = useNavigate();
  const {
    setIsMinimized,
    setIsDetailView,
    setSelectedVideo,
    isAmbientMode,
    toggleAmbientMode,
  } = useContext(VideoPlayerContext);
  const { theme } = useContext(ThemeContext);
  const { language } = useContext(LanguageContext);

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    setIsDescExpanded(false);
  }, [selectedVideo?.id?.videoId]);

  const isDark = theme === 'dark';

  const t = {
    backList: language === 'vi' ? 'Quay lại danh sách' : 'Back to list',
    home: language === 'vi' ? 'Trang chủ' : 'Home',
    backPrev: language === 'vi' ? 'Trang trước' : 'Previous',
    subscribe: language === 'vi' ? 'Đã đăng ký' : 'Subscribed',
    like: language === 'vi' ? 'Thích' : 'Like',
    share: language === 'vi' ? 'Chia sẻ' : 'Share',
    minimize: language === 'vi' ? 'Thu nhỏ video' : 'Minimize video',
    ambientMode: language === 'vi' ? 'Nền toàn cảnh' : 'Ambient Mode',
    normalMode: language === 'vi' ? 'Chế độ bình thường' : 'Normal Mode',
    closeVideo: language === 'vi' ? 'Đóng video' : 'Close video',
    playlist: language === 'vi' ? 'Lưu danh sách' : 'Save playlist',
    views: language === 'vi' ? 'lượt xem' : 'views',
    aiLabel: language === 'vi' ? 'Đánh giá chuyên môn bởi Tho-Dev AI:' : 'Expert review by Tho-Dev AI:',
    aiText:
      language === 'vi'
        ? 'Nội dung video cung cấp góc nhìn sâu sắc và có tính ứng dụng thực tiễn cao cho cộng đồng học tập công nghệ. Tho-Dev đánh giá cao chất lượng tài liệu học tập/nhạc số này, hỗ trợ cải thiện năng suất và tạo không gian tập trung hiệu quả.'
        : 'This video provides insightful and practical content for the tech and study community. Tho-Dev rates this material highly for productivity and focus.',
    comments: language === 'vi' ? 'bình luận' : 'comments',
    writeComment: language === 'vi' ? 'Viết bình luận thảo luận...' : 'Write a comment to discuss...',
    cancel: language === 'vi' ? 'Hủy' : 'Cancel',
    post: language === 'vi' ? 'Gửi bình luận' : 'Post comment',
    reply: language === 'vi' ? 'Trả lời' : 'Reply',
    noComments: language === 'vi' ? 'Chưa có bình luận nào.' : 'No comments yet.',
    noDesc: language === 'vi' ? 'Không có mô tả chi tiết.' : 'No description available.',
    showMoreDesc: language === 'vi' ? 'Xem thêm mô tả' : 'Show more',
    showLessDesc: language === 'vi' ? 'Thu gọn mô tả' : 'Show less',
  };

  // Theme-aware styles
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-[#cdc3d6]' : 'text-slate-600';
  const textMute = isDark ? 'text-[#968d9f]' : 'text-slate-400';
  const cardBg = isDark
    ? 'bg-[#1a1b22]/70 border border-white/10'
    : 'bg-white border border-slate-200/80 shadow-sm';
  const btnNeutral = isDark
    ? 'bg-white/10 hover:bg-white/15 text-white'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-800';
  const divider = isDark ? 'border-white/10' : 'border-slate-200';

  const likeCount = videoStats?.likeCount
    ? parseInt(videoStats.likeCount).toLocaleString('vi-VN')
    : null;
  const viewCount = videoStats?.viewCount
    ? parseInt(videoStats.viewCount).toLocaleString('vi-VN')
    : null;

  return (
    <div className="space-y-6">
      {/* ── VIDEO PLAYER BOX WITH PORTAL PLACEHOLDER ── */}
      <div className="relative group rounded-3xl overflow-hidden bg-black shadow-2xl">
        <div
          id="video-player-portal-placeholder"
          className="aspect-video bg-black w-full relative"
        />
      </div>

      {/* ── VIDEO TITLE & AUTHOR INFO ── */}
      <div className="space-y-4">
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold leading-snug tracking-tight ${textPrimary}`}>
          {selectedVideo.snippet.title}
        </h1>

        <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${divider}`}>
          {/* Channel block */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0 ${isDark ? 'bg-[#292931]' : 'bg-slate-200'}`}>
              {selectedVideo.channelAvatar ? (
                <img
                  src={selectedVideo.channelAvatar}
                  alt={selectedVideo.snippet.channelTitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-base text-[#8e54e9]">
                  {selectedVideo.snippet.channelTitle?.charAt(0) || 'V'}
                </div>
              )}
            </div>
            <div>
              <p className={`text-sm font-bold leading-tight ${textPrimary}`}>
                {selectedVideo.snippet.channelTitle}
              </p>
              <p className={`text-xs mt-0.5 ${textMute}`}>
                {timeAgo(selectedVideo.snippet.publishedAt, language)}
              </p>
            </div>
            <button
              type="button"
              className={`ml-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${btnNeutral}`}
            >
              ✓ {t.subscribe}
            </button>
          </div>

          {/* Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Like / Dislike Split Button */}
            <div
              className={`flex items-center rounded-xl shadow-md overflow-hidden ${
                isDark ? 'bg-[#1a1b22] border border-white/5' : 'bg-slate-100 border border-slate-200'
              }`}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold transition-colors border-none cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-800'
                }`}
              >
                <MorphIcon icon={ThumbsUp} size={15} strokeWidth={2.2} />
                <span>{likeCount || t.like}</span>
              </button>
              <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
              <button
                type="button"
                className={`px-3 py-2 text-xs transition-colors border-none cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-[#cdc3d6]' : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                <MorphIcon icon={ThumbsDown} size={15} strokeWidth={2.2} />
              </button>
            </div>

            {/* Share */}
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer shadow-md ${btnNeutral}`}
            >
              <MorphIcon icon={Share2} size={15} strokeWidth={2.2} />
              <span>{t.share}</span>
            </button>

            {/* Bookmark playlist */}
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer shadow-md ${btnNeutral}`}
              title={t.playlist}
            >
              <MorphIcon icon={ListPlus} size={16} strokeWidth={2.2} />
              <span className="hidden md:inline">{t.playlist}</span>
            </button>

            {/* Thu nhỏ video (vẫn tiếp tục phát nổi) */}
            <button
              type="button"
              onClick={() => setIsDetailView(false)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer shadow-md ${btnNeutral}`}
              title={t.minimize}
            >
              <MorphIcon icon={Minimize2} size={15} strokeWidth={2.2} />
              <span className="hidden sm:inline">{t.minimize}</span>
            </button>

            {/* Chế độ nền toàn cảnh / Chế độ bình thường */}
            <button
              type="button"
              onClick={toggleAmbientMode}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer shadow-md ${
                isAmbientMode
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/30 ring-2 ring-purple-400/50'
                  : btnNeutral
              }`}
              title={isAmbientMode ? t.normalMode : t.ambientMode}
            >
              <MorphIcon icon={Sparkles} size={15} strokeWidth={2.2} />
              <span className="hidden sm:inline">
                {isAmbientMode ? t.normalMode : t.ambientMode}
              </span>
            </button>

            {/* Đóng video */}
            <button
              type="button"
              onClick={() => {
                setSelectedVideo(null);
                setIsDetailView(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300"
              title={t.closeVideo}
            >
              <MorphIcon icon={X} size={14} strokeWidth={2.2} />
              <span className="hidden sm:inline">{t.closeVideo}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── METADATA & AI INSIGHT CARD (ẨN MÔ TẢ & XEM THÊM) ── */}
      <div
        className={`rounded-3xl backdrop-blur-xl p-4 sm:p-5 shadow-lg space-y-3 transition-all cursor-pointer ${cardBg}`}
        onClick={() => {
          if (!isDescExpanded) setIsDescExpanded(true);
        }}
      >
        <div className={`flex flex-wrap items-center justify-between gap-3 font-semibold text-xs font-mono ${textPrimary}`}>
          <div className="flex items-center gap-2 flex-wrap">
            {viewCount && (
              <span className="text-[#4776e6]">
                {viewCount} {t.views}
              </span>
            )}
            {viewCount && <span className={textMute}>•</span>}
            <span className={textSub}>{timeAgo(selectedVideo.snippet.publishedAt, language)}</span>
          </div>

          {/* Nút Xem thêm / Thu gọn ở góc */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDescExpanded(!isDescExpanded);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-[#8e54e9] hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            <span>{isDescExpanded ? t.showLessDesc : t.showMoreDesc}</span>
            <MorphIcon
              icon={ChevronDown}
              size={14}
              className={`transition-transform duration-200 ${isDescExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Nội dung mô tả (ẩn bớt bằng line-clamp-2 khi thu gọn) */}
        <p
          className={`text-sm leading-relaxed whitespace-pre-line ${textSub} ${
            !isDescExpanded ? 'line-clamp-2' : ''
          }`}
        >
          {selectedVideo.snippet.description || t.noDesc}
        </p>

        {/* AI Insight Section (chỉ mở ra khi bấm xem thêm) */}
        {isDescExpanded && (
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all mt-3 ${
              isDark
                ? 'bg-[#0c0d14]/70 border-purple-500/20'
                : 'bg-purple-50/70 border-purple-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-[#8e54e9] font-mono font-semibold text-xs uppercase tracking-wider">
              <MorphIcon icon={Sparkles} size={16} strokeWidth={2.2} />
              <span>{t.aiLabel}</span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${textSub}`}>{t.aiText}</p>
          </div>
        )}
      </div>

      {/* ── COMMENTS COMMUNITY MODULE ── */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center gap-3">
          <h3 className={`text-xl font-bold tracking-tight ${textPrimary}`}>
            {comments.length} {t.comments}
          </h3>
          <span className="w-2.5 h-2.5 rounded-full bg-[#8e54e9] animate-pulse" />
        </div>

        {/* Comment Thread List (Chỉ hiện bình luận, không hiện viết bình luận) */}
        <div className="space-y-4">
          {comments.map((comment) => {
            const s = comment.snippet?.topLevelComment?.snippet;
            if (!s) return null;
            return (
              <div
                key={comment.id}
                className={`flex gap-3.5 p-4 sm:p-5 rounded-3xl transition-all overflow-hidden max-w-full ${
                  isDark ? 'bg-[#1a1b22]/40 hover:bg-[#1a1b22]/60' : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-100'
                }`}
              >
                <img
                  src={s.authorProfileImageUrl || '/default-avatar.png'}
                  className="w-10 h-10 rounded-2xl shrink-0 object-cover shadow-sm"
                  alt={s.authorDisplayName}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-sm font-semibold truncate max-w-[240px] ${textPrimary}`}>
                      {s.authorDisplayName}
                    </span>
                    <span className={`text-xs ${textMute}`}>{timeAgo(s.publishedAt, language)}</span>
                  </div>
                  <div
                    className={`text-sm leading-relaxed break-words break-all [word-break:break-word] [overflow-wrap:anywhere] max-w-full overflow-hidden whitespace-pre-wrap ${textSub}`}
                  >
                    {s.textOriginal || s.textDisplay}
                  </div>
                  <div className={`flex items-center gap-4 mt-2.5 text-xs font-mono ${textMute}`}>
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-[#8e54e9] transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <MorphIcon icon={ThumbsUp} size={13} strokeWidth={2.2} />
                      <span>{s.likeCount || 0}</span>
                    </button>
                    <button
                      type="button"
                      className={`hover:${textPrimary} font-semibold transition-colors border-none bg-transparent cursor-pointer font-sans`}
                    >
                      {t.reply}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {comments.length === 0 && (
            <p className={`text-sm text-center py-8 ${textMute}`}>{t.noComments}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
