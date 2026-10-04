import React, { useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LanguageContext } from "../../context/LanguageContext";
import { ThemeContext } from "../../context/ThemeContext";
import { FaArrowLeft } from "react-icons/fa";
import AdSense from "../AdSense";

import SourceDocDetail from "./SourceDocDetail";
import SourceQuizDetail from "./SourceQuizDetail";

export default function SourceDetail({ subject, onBack }) {
  const { language } = useContext(LanguageContext);
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const { tab } = useParams();
  const navigate = useNavigate();

  // Determine active tab from URL: "quiz" or "document" (default)
  const activeTab = tab === "quiz" ? "quiz" : "document";

  useEffect(() => {
    localStorage.setItem("vibook_active_tab", activeTab);
  }, [activeTab]);

  const handleTabChange = (newTab) => {
    navigate(`/source/${subject.code.toLowerCase()}/${newTab}`);
  };

  const handleBack = () => {
    localStorage.removeItem("vibook_selected_subject_id");
    localStorage.removeItem("vibook_active_tab");
    localStorage.removeItem(`vibook_selected_doc_id_${subject.id}`);
    // Keep quiz index, mode, and module to remember progress!
    onBack();
  };

  return (
    <div className={`min-h-screen w-full px-2.5 py-3 sm:px-4 sm:py-6 md:px-8 transition-colors duration-300 relative ${
      isDark ? "bg-[#12131a] text-[#e3e1ec]" : "bg-[#faf7f2] text-[#162033]"
    }`}>
      {/* Decorative Blur Backgrounds (only in dark mode) */}
      {isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-electric-blue rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:gap-6 relative z-10 w-full">
        
        {/* Top Breadcrumb & Title Area */}
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleBack}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-sm border flex-shrink-0 ${
                isDark
                  ? "bg-glass-surface border-glass-border hover:bg-white/10 hover:border-primary/50 text-on-surface"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <FaArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                <span className="px-1.5 py-0.5 sm:px-2 rounded text-[11px] sm:text-xs font-semibold bg-primary/20 text-primary border border-primary/30 tracking-wider">
                  {subject.code}
                </span>
                <span className={`px-1.5 py-0.5 sm:px-2 rounded text-[11px] sm:text-xs font-semibold border ${
                  isDark ? "bg-tertiary/20 text-tertiary border-tertiary/30" : "bg-orange-100 text-orange-600 border-orange-200"
                }`}>
                  {subject.badge}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
                {subject.name}
              </h1>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className={`flex gap-1.5 sm:gap-2 p-1 rounded-lg sm:rounded-xl w-fit shadow-inner ${
            isDark ? "bg-[#1e1f27]" : "bg-slate-200/60"
          }`}>
            <button
              onClick={() => handleTabChange("document")}
              className={`relative px-3.5 py-1.5 sm:px-6 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 group overflow-hidden ${
                activeTab === "document"
                  ? "text-white"
                  : isDark
                    ? "text-[#cdc3d6] hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              }`}
            >
              {activeTab === "document" && (
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-electric-blue transition-opacity"></div>
              )}
              <span className="relative z-10 font-medium tracking-wide">
                {language === "vi" ? "Tài liệu học tập" : "Study Documents"}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("quiz")}
              className={`relative px-3.5 py-1.5 sm:px-6 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 group overflow-hidden ${
                activeTab === "quiz"
                  ? "text-white"
                  : isDark
                    ? "text-[#cdc3d6] hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
              }`}
            >
              {activeTab === "quiz" && (
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-electric-blue transition-opacity"></div>
              )}
              <span className="relative z-10 font-medium tracking-wide">
                {language === "vi" ? "Ngân hàng Quiz" : "Quiz Bank"}
              </span>
            </button>
          </div>
        </div>

        {/* --- Content Area --- */}
        {activeTab === "document" ? (
          <SourceDocDetail subject={subject} isDark={isDark} language={language} />
        ) : (
          <SourceQuizDetail subject={subject} isDark={isDark} language={language} />
        )}

        {/* AdSense Unit for Subject Detail */}
        <div className="source-ad-card" data-ad-card>
          {/* Note: You can replace '4399658395' with a different ad slot ID if you want a separate ad unit here */}
          <AdSense adSlot="4399658395" adFormat="auto" />
        </div>
      </div>

      {/* Embedded CSS styles inherited by subcomponents */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
          display: block;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(142, 84, 233, 0.25);
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(142, 84, 233, 0.45);
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
