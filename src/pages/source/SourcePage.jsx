import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sourceData } from "./sourceData";
import SourceDetail from "../../components/source/SourceDetail";
import { LanguageContext } from "../../context/LanguageContext";
import SEO from "../../components/SEO";
import { ThemeContext } from "../../context/ThemeContext";
import AdSense from "../../components/AdSense";
import {
  FaSearch,
  FaFilter,
  FaFileAlt,
  FaQuestionCircle,
  FaSitemap,
  FaLaptopCode,
  FaServer,
  FaMicrochip,
  FaFolderOpen,
  FaTerminal,
  FaBug,
  FaDatabase,
  FaBrain,
  FaProjectDiagram,
  FaWifi,
  FaShieldAlt,
  FaNetworkWired,
  FaDesktop,
  FaCog,
  FaLanguage,
  FaComments,
  FaBullhorn,
  FaVolumeUp,
  FaChartBar,
  FaBriefcase,
  FaLightbulb,
  FaBook,
  FaGraduationCap
} from "react-icons/fa";

export default function SourcePage() {
  const { t, language } = useContext(LanguageContext);
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const { subjectCode } = useParams();
  const navigate = useNavigate();

  // Find subject by code
  const activeSubject = subjectCode
    ? sourceData.find((s) => s.code.toLowerCase() === subjectCode.toLowerCase())
    : null;

  // Filter subjects based on query and hide subjects with 0 docs (Thin Content protection)
  const filteredSubjects = sourceData.filter((subject) => {
    if (subject.docsCount === 0) return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query)
    );
  });

  // Helper to map color names to Tailwind color configuration
  const getColorClasses = (colorName) => {
    switch (colorName) {
      case "neon-purple":
        return {
          glow: isDark
            ? "hover:shadow-[0_20px_40px_-10px_rgba(142,84,233,0.15)] hover:border-neon-purple/50"
            : "hover:shadow-[0_12px_24px_-4px_rgba(142,84,233,0.08)] hover:border-neon-purple/50",
          border: isDark ? "group-hover:border-neon-purple/50 border-white/10" : "group-hover:border-neon-purple/50 border-black/10",
          text: "text-neon-purple",
          accentText: isDark ? "group-hover:text-primary" : "group-hover:text-neon-purple",
          grad: "from-neon-purple to-electric-blue",
          bgGlow: isDark ? "group-hover:bg-neon-purple/30" : "group-hover:bg-neon-purple/10",
          radialGlow: isDark ? "bg-neon-purple/20" : "bg-neon-purple/5"
        };
      case "electric-blue":
        return {
          glow: isDark
            ? "hover:shadow-[0_20px_40px_-10px_rgba(71,118,230,0.15)] hover:border-electric-blue/50"
            : "hover:shadow-[0_12px_24px_-4px_rgba(71,118,230,0.08)] hover:border-electric-blue/50",
          border: isDark ? "group-hover:border-electric-blue/50 border-white/10" : "group-hover:border-electric-blue/50 border-black/10",
          text: "text-electric-blue",
          accentText: isDark ? "group-hover:text-secondary-fixed" : "group-hover:text-electric-blue",
          grad: "from-electric-blue to-secondary-fixed",
          bgGlow: isDark ? "group-hover:bg-electric-blue/30" : "group-hover:bg-electric-blue/10",
          radialGlow: isDark ? "bg-electric-blue/20" : "bg-electric-blue/5"
        };
      case "tertiary":
        return {
          glow: isDark
            ? "hover:shadow-[0_20px_40px_-10px_rgba(255,185,85,0.15)] hover:border-tertiary/50"
            : "hover:shadow-[0_12px_24px_-4px_rgba(255,185,85,0.08)] hover:border-tertiary/50",
          border: isDark ? "group-hover:border-tertiary/50 border-white/10" : "group-hover:border-tertiary/50 border-black/10",
          text: "text-tertiary",
          accentText: "group-hover:text-tertiary",
          grad: "from-tertiary to-tertiary-fixed-dim",
          bgGlow: isDark ? "group-hover:bg-tertiary/30" : "group-hover:bg-tertiary/10",
          radialGlow: isDark ? "bg-tertiary/20" : "bg-tertiary/5"
        };
      case "primary":
      default:
        return {
          glow: isDark
            ? "hover:shadow-[0_20px_40px_-10px_rgba(213,186,255,0.15)] hover:border-primary/50"
            : "hover:shadow-[0_12px_24px_-4px_rgba(213,186,255,0.08)] hover:border-primary/50",
          border: isDark ? "group-hover:border-primary/50 border-white/10" : "group-hover:border-primary/50 border-black/10",
          text: "text-primary",
          accentText: isDark ? "group-hover:text-primary" : "group-hover:text-primary-container",
          grad: "from-primary to-primary-fixed",
          bgGlow: isDark ? "group-hover:bg-primary/30" : "group-hover:bg-primary/10",
          radialGlow: isDark ? "bg-primary/20" : "bg-primary/5"
        };
    }
  };

  // Helper to get matching react icon component for subject
  const getSubjectIcon = (iconName) => {
    switch (iconName) {
      // 1. CS & Programming
      case "laptop_code":
      case "code":
        return FaLaptopCode;
      case "terminal":
        return FaTerminal;
      case "bug":
        return FaBug;
      case "database":
      case "storage":
        return FaDatabase;
      case "brain":
      case "smart_toy":
        return FaBrain;

      // 2. Data Structures
      case "account_tree":
        return FaSitemap;
      case "project_diagram":
        return FaProjectDiagram;

      // 3. Networking & Security
      case "router":
        return FaServer;
      case "wifi":
        return FaWifi;
      case "shield":
      case "security":
        return FaShieldAlt;
      case "network_wired":
        return FaNetworkWired;

      // 4. Systems & Hardware
      case "memory":
      case "hardware":
        return FaMicrochip;
      case "desktop":
        return FaDesktop;
      case "cog":
      case "settings":
        return FaCog;

      // 5. Foreign Languages & Speech
      case "language":
      case "translate":
        return FaLanguage;
      case "comments":
      case "forum":
        return FaComments;
      case "bullhorn":
        return FaBullhorn;
      case "volume_up":
        return FaVolumeUp;

      // 6. Business & General Edu
      case "chart_bar":
      case "trending_up":
        return FaChartBar;
      case "briefcase":
        return FaBriefcase;
      case "lightbulb":
        return FaLightbulb;
      case "book":
        return FaBook;
      case "graduation_cap":
        return FaGraduationCap;

      default:
        return FaFileAlt;
    }
  };

  if (activeSubject) {
    return (
      <div className="page-shell">
        <SEO
          title={activeSubject.name}
          description={`Tải tài liệu môn học ${activeSubject.name} (${activeSubject.code}) - Giáo trình, đề cương, câu hỏi ôn tập tại ThoDev.`}
          slug={`/source/${activeSubject.code.toLowerCase()}`}
          noindex={true}
        />
        <SourceDetail
          subject={activeSubject}
          onBack={() => navigate("/source")}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full px-4 py-8 md:px-8 transition-colors duration-300 z-10 ${
      isDark ? "bg-[#12131a] text-[#e3e1ec]" : "bg-[#faf7f2] text-[#162033]"
    }`}>
      <SEO
        title="Kho Tài Liệu Học Tập"
        description="Kho tài liệu ôn thi học thuật, đề cương, giáo trình và ngân hàng câu hỏi ôn tập trắc nghiệm trực tuyến chất lượng tại ThoDev."
        slug="/source"
        noindex={true}
      />
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Background Decorative Blobs (visible in dark mode only) */}
        {isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15 z-0">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-electric-blue rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
          </div>
        )}

        {/* Page Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_10px_rgba(142,84,233,0.8)]"></div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                KNOWLEDGE NEXUS
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "vi" ? "Kho Tài Liệu Học Tập" : "Subject Modules"}
            </h1>
            <p className={`font-body-md text-body-md opacity-85 mt-1 ${isDark ? "text-[#cdc3d6]" : "text-slate-600"}`}>
              {language === "vi"
                ? "Truy cập và ôn tập toàn bộ tài liệu học tập, slide bài giảng, bài tập và hệ thống câu hỏi trắc nghiệm tự luyện."
                : "Access and review all enrolled course materials, documentation, and assessments."}
            </p>
          </div>

          {/* Filter Input wrapper */}
          <div className="w-full md:w-80 relative group z-10">
            {isDark && (
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-electric-blue/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-focus-within:opacity-100"></div>
            )}
            <div className={`relative rounded-xl border p-1 transition-colors flex items-center ${
              isDark
                ? "bg-surface/80 border-glass-border group-focus-within:border-electric-blue/50"
                : "bg-white border-slate-300 group-focus-within:border-primary/50 shadow-sm"
            }`}>
              <FaSearch className={`ml-3 ${isDark ? "text-outline" : "text-slate-400"}`} size={16} />
              <input
                className={`w-full bg-transparent border-none focus:outline-none font-body-md py-2 px-3 ${
                  isDark ? "text-on-surface placeholder:text-outline/70" : "text-slate-900 placeholder:text-slate-400"
                }`}
                placeholder={language === "vi" ? "Tìm kiếm môn học..." : "Filter subjects..."}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className={`rounded-lg p-2 transition-colors mr-1 flex items-center justify-center ${
                isDark ? "bg-surface-bright/50 hover:bg-surface-bright" : "bg-slate-100 hover:bg-slate-200"
              }`}>
                <FaFilter className={`${isDark ? "text-on-surface-variant" : "text-slate-600"}`} size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid List of Subject Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 z-10">
          {filteredSubjects.map((subject, index) => {
            const colors = getColorClasses(subject.color);
            const IconComponent = getSubjectIcon(subject.icon);
            return (
              <React.Fragment key={subject.id}>
                {/* In-feed Ad unit (displays after every 4 subjects) */}
                {index > 0 && index % 4 === 0 && (
                  <div className="col-span-full my-2" style={{
                    padding: "15px",
                    background: isDark ? "rgba(30, 31, 39, 0.6)" : "white",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: "1rem"
                  }}>
                    <AdSense adSlot="4399658395" adLayoutKey="-fm-19-1a-f8+16e" />
                  </div>
                )}
                <button
                  onClick={() => navigate("/source/" + subject.code.toLowerCase())}
                  className={`group text-left relative flex flex-col h-full rounded-2xl border p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 min-h-[250px] ${
                    isDark
                      ? "bg-[#1e1f27]/60 border-white/10 hover:bg-[#1e1f27]/90"
                      : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                  } ${colors.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-white/5" : "from-black/[0.02]"} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className={`absolute -right-12 -top-12 w-40 h-40 ${colors.radialGlow} rounded-full blur-[40px] ${colors.bgGlow} transition-colors`}></div>
                  
                  {/* Card Header Info */}
                  <div className="relative flex justify-between items-start mb-10 w-full">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm transition-colors border ${
                      isDark ? "bg-surface-bright/40" : "bg-slate-50"
                    } ${colors.border}`}>
                      <IconComponent className={`${colors.text}`} size={26} />
                    </div>
                    <span className={`font-label-sm text-label-sm px-3 py-1 rounded-full border ${
                      isDark ? "text-outline-variant bg-surface-bright/50 border-glass-border" : "text-slate-500 bg-slate-50 border-slate-200"
                    }`}>
                      {subject.code}
                    </span>
                  </div>

                  {/* Card Footer Info */}
                  <div className="relative mt-auto w-full">
                    <h3 className={`text-xl font-bold tracking-tight mb-4 transition-colors line-clamp-2 ${
                      isDark ? "text-on-surface" : "text-slate-900"
                    } ${colors.accentText}`}>
                      {subject.name}
                    </h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <FaFileAlt className={`${isDark ? "text-outline" : "text-slate-400"}`} size={16} />
                        <span className={`font-label-sm text-label-sm ${isDark ? "text-on-surface-variant" : "text-slate-500"}`}>
                          {subject.docsCount} {language === "vi" ? "Tài liệu" : "Docs"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaQuestionCircle className={`${isDark ? "text-outline" : "text-slate-400"}`} size={16} />
                        <span className={`font-label-sm text-label-sm ${isDark ? "text-on-surface-variant" : "text-slate-500"}`}>
                          {subject.quizzesCount} Quizzes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover highlight bottom bar */}
                  <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r ${colors.grad} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-20 z-10 flex flex-col items-center justify-center">
            <FaFolderOpen className="text-[64px] text-outline opacity-40 mb-4 animate-bounce" />
            <p className={`text-body-md ${isDark ? "text-on-surface-variant" : "text-slate-500"}`}>
              {language === "vi" ? "Không tìm thấy môn học nào." : "No subjects found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
