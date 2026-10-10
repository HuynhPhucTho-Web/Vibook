import React, { useState, useContext, useEffect } from "react";
import { MorphIcon } from "morphicons/react";
import {
  Minimize2,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
} from "lucide";
import { LanguageContext } from "../../context/LanguageContext";

export default function AmbientHUD({
  selectedVideo,
  exitAmbientMode,
  ambientDim,
  setAmbientDim,
  ambientBlur,
  setAmbientBlur,
  handleExpandToDetail,
  setSelectedVideo,
  setIsDetailView,
}) {
  const { language } = useContext(LanguageContext);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Esc key shortcut to quickly exit ambient mode anytime
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        exitAmbientMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [exitAmbientMode]);

  const t = {
    normalMode: language === "vi" ? "Chế độ bình thường" : "Normal Mode",
    ambientTitle: language === "vi" ? "Nền toàn cảnh" : "Ambient Mode",
    dimming: language === "vi" ? "Độ tối nền" : "Dimming",
    blur: language === "vi" ? "Làm mờ nền" : "Blur",
    dim30: language === "vi" ? "Sáng 35%" : "Soft 35%",
    dim50: language === "vi" ? "Vừa 50%" : "Mid 50%",
    dim75: language === "vi" ? "Tối 75%" : "Dark 75%",
    blur0: language === "vi" ? "Nét (0px)" : "Sharp (0px)",
    blur4: language === "vi" ? "Mờ ảo (4px)" : "Soft (4px)",
    blur10: language === "vi" ? "Mờ sâu (10px)" : "Deep (10px)",
    detail: language === "vi" ? "Xem chi tiết" : "Video detail",
    close: language === "vi" ? "Đóng video" : "Close video",
    collapse: language === "vi" ? "Thu gọn menu" : "Collapse menu",
    expand: language === "vi" ? "Mở menu toàn cảnh" : "Open ambient menu",
    settings: language === "vi" ? "Tùy chỉnh nền" : "Adjust ambient",
    escTip: language === "vi" ? "Ấn ESC để thoát nhanh" : "Press ESC to exit",
  };

  return (
    <aside
      aria-label="Ambient Controller HUD"
      className={`fixed ${
        isExpanded ? "bottom-5" : "bottom-0"
      } left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto max-w-[95vw] select-none transition-all duration-300 ease-out`}
    >
      {/* ── COLLAPSED TAB BUTTON (MINIMAL HANDLE AT BOTTOM EDGE) ── */}
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group relative flex flex-col items-center justify-center pt-2 pb-1.5 px-6 sm:px-7 rounded-t-2xl sm:rounded-t-3xl bg-[#12131a]/85 hover:bg-[#181926]/95 backdrop-blur-2xl border-t border-x border-b-0 border-white/20 hover:border-purple-500/50 shadow-[0_-6px_25px_rgba(0,0,0,0.6),0_0_16px_rgba(142,84,233,0.25)] hover:shadow-[0_-8px_32px_rgba(142,84,233,0.5)] transition-all duration-300 active:scale-95 cursor-pointer text-white animate-in fade-in zoom-in-95"
          title={t.expand}
          aria-label={t.expand}
        >
          {/* Subtle neon glow line at top border */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80 group-hover:opacity-100 group-hover:w-12 transition-all duration-300" />

          {/* Centered Chevron with subtle breathing pulse / hover motion */}
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse" />
            <MorphIcon
              icon={ChevronUp}
              size={17}
              strokeWidth={2.4}
              className="text-white/85 group-hover:text-purple-300 transition-all duration-200 group-hover:-translate-y-0.5"
            />
          </div>

          {/* Mini hover tooltip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl bg-[#12131a]/95 text-white text-[11px] font-medium whitespace-nowrap border border-white/15 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>{t.expand}</span>
            <span className="text-white/50 text-[10px]">({t.ambientTitle})</span>
          </div>
        </button>
      ) : (
        /* ── EXPANDED DOCK ── */
        <div className="flex flex-col items-center gap-2">
          {/* Optional Settings Panel (Dimming & Blur presets) */}
          {showSettings && (
            <div className="w-full bg-[#12131a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-3 text-xs text-white/90 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Dimming controls */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-white/70 flex items-center gap-1.5 shrink-0">
                  <span>🌓</span> {t.dimming}:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: t.dim30, val: 0.35 },
                    { label: t.dim50, val: 0.5 },
                    { label: t.dim75, val: 0.75 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setAmbientDim(item.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-all ${
                        ambientDim === item.val
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur controls */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-white/70 flex items-center gap-1.5 shrink-0">
                  <span>💧</span> {t.blur}:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: t.blur0, val: 0 },
                    { label: t.blur4, val: 4 },
                    { label: t.blur10, val: 10 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setAmbientBlur(item.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-all ${
                        ambientBlur === item.val
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Dock Capsule */}
          <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-[#12131a]/90 backdrop-blur-2xl border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.7)] text-white">
            {/* 1. NÚT CHUYỂN LẠI CHẾ ĐỘ BÌNH THƯỜNG (CỰC KỲ NỔI BẬT) */}
            <button
              type="button"
              onClick={exitAmbientMode}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(142,84,233,0.5)] hover:shadow-[0_0_26px_rgba(142,84,233,0.75)] hover:scale-[1.03] active:scale-95 transition-all border-none cursor-pointer shrink-0"
              title="Quay lại chế độ phát bình thường (ESC)"
            >
              <MorphIcon icon={Minimize2} size={15} strokeWidth={2.4} />
              <span>{t.normalMode}</span>
            </button>

            {/* Video title snippet */}
            <div className="hidden md:flex items-center gap-2 max-w-[200px] lg:max-w-[280px] truncate text-white/85 text-xs px-1">
              <span className="text-purple-400 shrink-0">🎵</span>
              <span className="truncate font-medium" title={selectedVideo.snippet?.title}>
                {selectedVideo.snippet?.title || "Video đang phát"}
              </span>
            </div>

            <div className="h-5 w-[1px] bg-white/15 shrink-0" />

            {/* Ambient controls toggle button */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
                showSettings
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
              }`}
              title={t.settings}
            >
              <MorphIcon icon={SlidersHorizontal} size={13} strokeWidth={2.2} />
              <span className="hidden sm:inline">{t.settings}</span>
            </button>

            {/* Detail Link */}
            <button
              type="button"
              onClick={handleExpandToDetail}
              className="p-2 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              title={t.detail}
            >
              <MorphIcon icon={ExternalLink} size={14} strokeWidth={2.2} />
            </button>

            {/* Close Video button */}
            <button
              type="button"
              onClick={() => {
                exitAmbientMode();
                setSelectedVideo(null);
                setIsDetailView?.(false);
              }}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-colors border-none cursor-pointer"
              title={t.close}
            >
              <MorphIcon icon={X} size={14} strokeWidth={2.2} />
            </button>

            {/* Collapse HUD to tiny pill */}
            <button
              type="button"
              onClick={() => {
                setShowSettings(false);
                setIsExpanded(false);
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors border-none bg-transparent cursor-pointer ml-0.5"
              title={t.collapse}
            >
              <MorphIcon icon={ChevronDown} size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
