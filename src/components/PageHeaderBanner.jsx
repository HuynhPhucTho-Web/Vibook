import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Unified Page Header Banner
 * Standardized across VideoHub, ToolsPage, PlayGame, Events, SourcePage, FriendPage, BlogPages, Setting
 */
export default function PageHeaderBanner({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  className = "",
  onClickTitle,
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <div
      className={`rounded-2xl px-3 sm:px-4 py-3 mb-4 flex items-center justify-between gap-3 border transition-colors backdrop-blur-xl ${
        isDark
          ? "bg-[#1a1b22]/80 border-white/10"
          : "bg-white/80 border-slate-200/80 shadow-sm"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2.5 sm:gap-3 min-w-0">
        {/* Brand / Page Title on Left */}
        <div
          className={`flex items-center gap-2.5 select-none flex-shrink-0 ${
            onClickTitle ? "cursor-pointer" : ""
          }`}
          onClick={onClickTitle}
        >
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8e54e9] to-[#4776e6] flex items-center justify-center shadow-[0_0_14px_rgba(142,84,233,0.35)] text-white flex-shrink-0">
              {React.isValidElement(Icon) ? (
                Icon
              ) : typeof Icon === "function" ? (
                <Icon size={16} />
              ) : null}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`text-base sm:text-lg font-bold leading-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </span>
              {badge !== undefined && badge !== null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <span className="text-[10px] text-[#8e54e9] font-mono tracking-widest uppercase font-semibold mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Filters, Controls & Action Buttons on Right */}
        {children && (
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar flex-nowrap [&>*]:flex-1 sm:[&>*]:flex-initial [&>*]:min-w-0 [&>button]:h-[34px] [&>select]:h-[34px]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
