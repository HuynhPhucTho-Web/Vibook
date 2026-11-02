import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import UserAvatar from "./UserAvatar";
import {
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaArrowLeft,
  FaUser,
  FaPalette,
  FaSmile,
  FaTag,
  FaBellSlash,
  FaBell,
  FaBan,
  FaLock,
  FaShieldAlt,
  FaCheck,
  FaTimes,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import { ThemeContext } from "../../context/ThemeContext";
import "../../style/ChatHeader.css";

const THEME_PRESETS = [
  { name: "Tím Neon", bgDark: "#0e1116", bgLight: "#f4f2fb", msg: "#8e54e9" },
  { name: "Xanh Biển", bgDark: "#091422", bgLight: "#eef6ff", msg: "#2563eb" },
  { name: "Xanh Ngọc", bgDark: "#0a1a17", bgLight: "#effbf6", msg: "#059669" },
  { name: "Hoàng Hôn", bgDark: "#1d1215", bgLight: "#fff1f2", msg: "#e11d48" },
  { name: "Hổ Phách", bgDark: "#1a160d", bgLight: "#fffbeb", msg: "#d97706" },
  { name: "Huyền Bí", bgDark: "#07080c", bgLight: "#f1f5f9", msg: "#475569" },
];

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "⚡", "🎉", "💩", "👀", "✨"];

/**
 * Props:
 * - user
 * - theme: "light" | "dark"
 * - onBack?
 * - onApplyTheme?: ({ backgroundColor, messageColor }) => void
 * - initialTheme?: { backgroundColor?: string, messageColor?: string }
 */
const ChatHeader = ({
  user,
  theme,
  onBack,
  onApplyTheme,
  initialTheme,
  chatConfig,
  onUpdateChatConfig,
  currentUser,
}) => {
  const navigate = useNavigate();
  const themeCtx = useContext(ThemeContext);
  const activeTheme = theme || themeCtx?.theme || "light";
  const isDark = activeTheme === "dark";
  const isLight = !isDark;

  const { language } = useContext(LanguageContext) || { language: "vi" };
  const isVi = language === "vi";

  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // null | "theme" | "emoji" | "nickname"

  // Nicknames local editing states
  const [friendNickname, setFriendNickname] = useState("");
  const [myNickname, setMyNickname] = useState("");

  useEffect(() => {
    setFriendNickname(chatConfig?.nicknames?.[user?.uid] || "");
    setMyNickname(chatConfig?.nicknames?.[currentUser?.uid] || "");
  }, [chatConfig, user?.uid, currentUser?.uid]);

  // theme state (local)
  const [customBackgroundColor, setCustomBackgroundColor] = useState(
    initialTheme?.backgroundColor || (isDark ? "#0e1116" : "#ffffff")
  );
  const [customMessageColor, setCustomMessageColor] = useState(
    initialTheme?.messageColor || (isDark ? "#8e54e9" : "#0d6efd")
  );

  useEffect(() => {
    if (initialTheme?.backgroundColor) {
      setCustomBackgroundColor(initialTheme.backgroundColor);
    }
    if (initialTheme?.messageColor) {
      setCustomMessageColor(initialTheme.messageColor);
    }
  }, [initialTheme?.backgroundColor, initialTheme?.messageColor]);

  // Phím tắt Escape để đóng drawer hoặc quay về menu chính
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showSettingsDrawer) {
        if (activePanel) {
          setActivePanel(null);
        } else {
          setShowSettingsDrawer(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettingsDrawer, activePanel]);

  if (!user) return null;

  const closeModal = () => {
    setShowSettingsDrawer(false);
    setActivePanel(null);
  };

  const handleViewProfile = () => {
    navigate(`/profile/${user.uid}`, {
      state: {
        from: "/messenger",
        fromLabel: isVi ? "Đoạn chat" : "Chat",
        returnUser: user,
      },
    });
    closeModal();
  };

  const selectQuickEmoji = (emoji) => {
    onUpdateChatConfig?.({ quickEmoji: emoji });
    toast.success(
      isVi ? `Đã chọn biểu tượng nhanh: ${emoji}` : `Quick emoji set: ${emoji}`
    );
  };

  const saveNicknames = () => {
    onUpdateChatConfig?.({
      nicknames: {
        ...(chatConfig?.nicknames || {}),
        [user.uid]: friendNickname.trim(),
        [currentUser?.uid]: myNickname.trim(),
      },
    });
    toast.success(
      isVi ? "Đã lưu biệt danh thành công!" : "Nicknames saved successfully!"
    );
    setActivePanel(null);
  };

  const isBlocked = chatConfig?.blockedBy?.includes(currentUser?.uid);
  const toggleBlock = () => {
    const currentBlockedBy = chatConfig?.blockedBy || [];
    if (isBlocked) {
      onUpdateChatConfig?.({
        blockedBy: currentBlockedBy.filter((uid) => uid !== currentUser?.uid),
      });
      toast.info(isVi ? "Đã bỏ chặn cuộc trò chuyện" : "Conversation unblocked");
    } else {
      onUpdateChatConfig?.({
        blockedBy: [...currentBlockedBy, currentUser?.uid],
      });
      toast.warn(isVi ? "Đã chặn cuộc trò chuyện này" : "Conversation blocked");
    }
  };

  const isMuted = chatConfig?.mutedBy?.includes(currentUser?.uid);
  const toggleMute = () => {
    const currentMutedBy = chatConfig?.mutedBy || [];
    if (isMuted) {
      onUpdateChatConfig?.({
        mutedBy: currentMutedBy.filter((uid) => uid !== currentUser?.uid),
      });
      toast.info(isVi ? "Đã bật lại thông báo" : "Notifications unmuted");
    } else {
      onUpdateChatConfig?.({
        mutedBy: [...currentMutedBy, currentUser?.uid],
      });
      toast.info(isVi ? "Đã tắt thông báo cuộc trò chuyện" : "Notifications muted");
    }
  };

  const applyThemeNow = () => {
    onApplyTheme?.({
      backgroundColor: customBackgroundColor,
      messageColor: customMessageColor,
    });
    toast.success(
      isVi ? "Đã cập nhật chủ đề cuộc trò chuyện!" : "Chat theme updated successfully!"
    );
  };

  return (
    <>
      {/* 1. Header chính của Messenger */}
      <div className={`chat-header ${isLight ? "light" : "dark"}`}>
        {/* Bên trái: Nút Back + Avatar + Tên người nhận */}
        <div className="chat-header-left">
          {onBack && (
            <button
              className="btn btn-link p-0 chat-back-btn"
              onClick={onBack}
              aria-label={isVi ? "Quay lại" : "Back"}
            >
              <FaArrowLeft size={18} />
            </button>
          )}

          <div
            className="chat-header-info cursor-pointer select-none group"
            onClick={() => setShowSettingsDrawer(true)}
            title={isVi ? "Bấm để xem thông tin cuộc trò chuyện" : "Click to view chat details"}
          >
            <UserAvatar user={user} size={44} showOnline />
            <div>
              <h5 className="chat-header-name group-hover:text-purple-400 transition-colors">
                {chatConfig?.nicknames?.[user.uid] || `${user.firstName} ${user.lastName}`}
              </h5>
              <small
                className={`chat-header-status ${
                  user.isOnline ? "online" : ""
                } ${isLight ? "light" : "dark"}`}
              >
                {user.isOnline
                  ? isVi
                    ? "Đang hoạt động"
                    : "online"
                  : isVi
                  ? "Không hoạt động"
                  : "offline"}
              </small>
            </div>
          </div>
        </div>

        {/* Bên phải: Nút gọi thoại, gọi video & Menu cài đặt */}
        <div className="chat-header-actions">
          <button
            type="button"
            className="btn btn-outline-secondary rounded-circle"
            title={isVi ? "Bắt đầu cuộc gọi thoại" : "Start voice call"}
          >
            <FaPhone size={15} />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-circle"
            title={isVi ? "Bắt đầu cuộc gọi video" : "Start video call"}
          >
            <FaVideo size={15} />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-circle"
            onClick={() => setShowSettingsDrawer(true)}
            title={isVi ? "Cài đặt & Tùy chọn đoạn chat" : "Chat Settings & Options"}
            aria-label={isVi ? "Cài đặt cuộc trò chuyện" : "Chat Settings"}
          >
            <FaEllipsisV size={15} />
          </button>
        </div>
      </div>

      {/* 2. Drawer Cài đặt tin nhắn: Trượt mượt mà từ bên phải vào, bắt đầu bên dưới Header chính */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <>
            {/* Backdrop làm mờ - bắt đầu bên dưới header để không phủ thanh điều hướng */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{
                top: "var(--app-header-height, 60px)",
                height: "calc(100dvh - var(--app-header-height, 60px))",
              }}
              className="fixed left-0 right-0 bottom-0 z-[1049] bg-black/50 backdrop-blur-xs"
            />

            {/* Khung Drawer trượt từ mép phải - bắt đầu bên dưới header */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              style={{
                top: "var(--app-header-height, 60px)",
                height: "calc(100dvh - var(--app-header-height, 60px))",
              }}
              className={`fixed right-0 bottom-0 z-[1050] w-full sm:w-[380px] md:w-[410px] shadow-2xl flex flex-col overflow-hidden transition-colors ${
                isDark
                  ? "bg-[#18181b] border-l border-gray-800 text-gray-200"
                  : "bg-white border-l border-slate-200 text-slate-800"
              }`}
            >
              {/* Drawer Header - Cố định ở đầu drawer, luôn nhìn thấy rõ ràng trên mobile */}
              <div
                className={`flex items-center justify-between px-4 py-3 border-b select-none flex-shrink-0 sticky top-0 z-20 ${
                  isDark ? "bg-[#202024] border-gray-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {activePanel ? (
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className={`px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                        isDark
                          ? "bg-purple-950/60 text-purple-300 hover:bg-purple-900/60 border border-purple-800/60"
                          : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                      }`}
                    >
                      <FaChevronLeft className="w-3.5 h-3.5" />
                      <span>{isVi ? "Quay lại" : "Back"}</span>
                    </button>
                  ) : (
                    <h5
                      className={`font-bold text-sm sm:text-base m-0 truncate ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {isVi ? "Thông tin đoạn chat" : "Chat Details"}
                    </h5>
                  )}
                </div>

                {/* NÚT ĐÓNG TO RÕ RÀNG TRÊN MOBILE */}
                <button
                  type="button"
                  onClick={closeModal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-2xs ${
                    isDark
                      ? "bg-gray-800/90 hover:bg-red-500/20 text-gray-200 hover:text-red-400 border-gray-700 hover:border-red-500/50"
                      : "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border-slate-200 hover:border-red-200"
                  }`}
                  title={isVi ? "Đóng cài đặt (Esc)" : "Close (Esc)"}
                  aria-label={isVi ? "Đóng cài đặt" : "Close settings"}
                >
                  <FaTimes className="w-3.5 h-3.5" />
                  <span className="text-[11.5px] font-semibold">{isVi ? "Đóng" : "Close"}</span>
                </button>
              </div>

              {/* Drawer Body: Cuộn mượt với thanh cuộn custom */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* User Info Card (Ảnh đại diện lớn, Tên, Trạng thái) */}
                <div className="flex flex-col items-center text-center pb-2 pt-1">
                  <div className="relative mb-2.5">
                    <UserAvatar user={user} size={72} showOnline />
                  </div>
                  <h4
                    className={`text-base sm:text-lg font-bold mb-0.5 truncate max-w-full px-2 ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {chatConfig?.nicknames?.[user.uid] || `${user.firstName} ${user.lastName}`}
                  </h4>
                  {chatConfig?.nicknames?.[user.uid] && (
                    <p className={`text-xs mb-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                      ({user.firstName} {user.lastName})
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    <span
                      className={
                        user.isOnline
                          ? "text-emerald-500 font-medium"
                          : isDark
                          ? "text-gray-400"
                          : "text-slate-500"
                      }
                    >
                      {user.isOnline
                        ? isVi
                          ? "Đang hoạt động"
                          : "Active now"
                        : isVi
                        ? "Không hoạt động"
                        : "Offline"}
                    </span>
                  </div>
                </div>

                {/* Hàng 3 nút shortcut: Trang cá nhân, Đổi chủ đề, Tắt/Bật thông báo */}
                {!activePanel && (
                  <div
                    className={`flex justify-center gap-6 py-2.5 border-y ${
                      isDark ? "border-gray-800" : "border-slate-200/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleViewProfile}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group bg-transparent border-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isDark
                            ? "bg-[#27272a] text-purple-400 group-hover:bg-purple-600 group-hover:text-white"
                            : "bg-slate-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                        }`}
                      >
                        <FaUser className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          isDark ? "text-gray-300" : "text-slate-600"
                        }`}
                      >
                        {isVi ? "Trang cá nhân" : "Profile"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePanel("theme")}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group bg-transparent border-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isDark
                            ? "bg-[#27272a] text-purple-400 group-hover:bg-purple-600 group-hover:text-white"
                            : "bg-slate-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                        }`}
                      >
                        <FaPalette className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          isDark ? "text-gray-300" : "text-slate-600"
                        }`}
                      >
                        {isVi ? "Chủ đề" : "Theme"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group bg-transparent border-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isMuted
                            ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40"
                            : isDark
                            ? "bg-[#27272a] text-purple-400 group-hover:bg-purple-600 group-hover:text-white"
                            : "bg-slate-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                        }`}
                      >
                        {isMuted ? <FaBellSlash className="w-4 h-4" /> : <FaBell className="w-4 h-4" />}
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          isMuted
                            ? "text-amber-400"
                            : isDark
                            ? "text-gray-300"
                            : "text-slate-600"
                        }`}
                      >
                        {isMuted
                          ? isVi
                            ? "Bật chuông"
                            : "Unmute"
                          : isVi
                          ? "Tắt chuông"
                          : "Mute"}
                      </span>
                    </button>
                  </div>
                )}

                {/* ====== KHU VỰC SUB-PANELS ====== */}

                {/* SUB-PANEL: Đổi màu nền & Bong bóng chat */}
                {activePanel === "theme" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-2 ${
                          isDark ? "text-gray-300" : "text-slate-700"
                        }`}
                      >
                        {isVi ? "Mẫu chủ đề có sẵn:" : "Preset themes:"}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {THEME_PRESETS.map((preset) => {
                          const isSelected = customMessageColor === preset.msg;
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setCustomBackgroundColor(
                                  isDark ? preset.bgDark : preset.bgLight
                                );
                                setCustomMessageColor(preset.msg);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                                isSelected
                                  ? "border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10"
                                  : isDark
                                  ? "border-gray-800 hover:border-gray-700 bg-[#202024]/50"
                                  : "border-slate-200 hover:border-slate-300 bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                                  style={{ backgroundColor: preset.msg }}
                                />
                                <span
                                  className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                                  style={{
                                    backgroundColor: isDark
                                      ? preset.bgDark
                                      : preset.bgLight,
                                  }}
                                />
                              </div>
                              <span
                                className={`text-[11px] font-medium truncate ${
                                  isDark ? "text-gray-300" : "text-slate-700"
                                }`}
                              >
                                {preset.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bộ chọn màu tùy chỉnh */}
                    <div
                      className={`p-3.5 rounded-xl border space-y-3.5 ${
                        isDark ? "bg-[#202024]/40 border-gray-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium ${
                            isDark ? "text-gray-300" : "text-slate-700"
                          }`}
                        >
                          {isVi ? "Màu nền cuộc trò chuyện" : "Chat background"}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customBackgroundColor}
                            onChange={(e) => setCustomBackgroundColor(e.target.value)}
                            className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                          />
                          <span
                            className={`font-mono text-xs ${
                              isDark ? "text-gray-400" : "text-slate-500"
                            }`}
                          >
                            {customBackgroundColor}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium ${
                            isDark ? "text-gray-300" : "text-slate-700"
                          }`}
                        >
                          {isVi ? "Màu bong bóng tin nhắn" : "My message bubble"}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customMessageColor}
                            onChange={(e) => setCustomMessageColor(e.target.value)}
                            className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                          />
                          <span
                            className={`font-mono text-xs ${
                              isDark ? "text-gray-400" : "text-slate-500"
                            }`}
                          >
                            {customMessageColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Xem trước tin nhắn */}
                    <div>
                      <span
                        className={`block text-xs font-medium mb-1.5 ${
                          isDark ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {isVi ? "Xem trước hiển thị:" : "Preview:"}
                      </span>
                      <div
                        className="p-3.5 rounded-2xl min-h-[90px] flex flex-col justify-end gap-2 border shadow-inner transition-colors"
                        style={{
                          backgroundColor: customBackgroundColor,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.08)",
                        }}
                      >
                        <div
                          className="self-end px-3 py-1.5 rounded-2xl rounded-br-xs text-xs font-medium text-white shadow-xs max-w-[80%]"
                          style={{ backgroundColor: customMessageColor }}
                        >
                          {isVi
                            ? "Xin chào! Giao diện mới đẹp quá 👋"
                            : "Hello! Looks awesome 👋"}
                        </div>
                        <div
                          className={`self-start px-3 py-1.5 rounded-2xl rounded-bl-xs text-xs font-medium shadow-xs max-w-[80%] border ${
                            isDark
                              ? "bg-[#27272a] text-gray-200 border-gray-700/60"
                              : "bg-white text-slate-800 border-slate-200"
                          }`}
                        >
                          {isVi
                            ? "Tuyệt vời, đồng bộ theme chuẩn rồi nhé ✨"
                            : "Awesome, theme is synced ✨"}
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setActivePanel(null)}
                        className={`flex-1 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          isDark
                            ? "border-gray-800 text-gray-300 hover:bg-gray-800"
                            : "border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isVi ? "Quay lại" : "Back"}
                      </button>
                      <button
                        type="button"
                        onClick={applyThemeNow}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <FaCheck className="w-3.5 h-3.5" />
                        {isVi ? "Áp dụng ngay" : "Apply Theme"}
                      </button>
                    </div>
                  </div>
                )}

                {/* SUB-PANEL: Chọn Emoji nhanh */}
                {activePanel === "emoji" && (
                  <div className="space-y-4 animate-fadeIn">
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-slate-500"
                      }`}
                    >
                      {isVi
                        ? "Chọn biểu tượng cảm xúc để gửi nhanh bằng một chạm ở khung chat:"
                        : "Choose a quick emoji for one-click reactions in chat:"}
                    </p>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 justify-items-center py-2">
                      {EMOJI_OPTIONS.map((emoji) => {
                        const isSelected =
                          chatConfig?.quickEmoji === emoji ||
                          (!chatConfig?.quickEmoji && emoji === "👍");
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => selectQuickEmoji(emoji)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                              isSelected
                                ? "bg-purple-600/20 border-2 border-purple-500 ring-4 ring-purple-500/20 scale-105"
                                : isDark
                                ? "bg-[#202024] hover:bg-[#27272a] border border-gray-800"
                                : "bg-slate-50 hover:bg-purple-50 border border-slate-200"
                            }`}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className={`w-full py-2.5 mt-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                        isDark
                          ? "border-gray-800 text-gray-300 hover:bg-gray-800"
                          : "border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isVi ? "Xong" : "Done"}
                    </button>
                  </div>
                )}

                {/* SUB-PANEL: Đổi biệt danh */}
                {activePanel === "nickname" && (
                  <div className="space-y-4 animate-fadeIn">
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-slate-500"
                      }`}
                    >
                      {isVi
                        ? "Biệt danh chỉ hiển thị trong cuộc trò chuyện giữa hai bạn:"
                        : "Nicknames are only visible inside this conversation:"}
                    </p>

                    <div className="space-y-3.5">
                      <div>
                        <label
                          className={`block text-xs font-semibold mb-1.5 ${
                            isDark ? "text-gray-300" : "text-slate-700"
                          }`}
                        >
                          {isVi
                            ? `Biệt danh của ${user.firstName}`
                            : `${user.firstName}'s Nickname`}
                        </label>
                        <input
                          type="text"
                          value={friendNickname}
                          onChange={(e) => setFriendNickname(e.target.value)}
                          placeholder={`${user.firstName} ${user.lastName}`}
                          className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-purple-500 transition ${
                            isDark
                              ? "bg-[#121214] text-white placeholder-gray-500 border-gray-700"
                              : "bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200"
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-xs font-semibold mb-1.5 ${
                            isDark ? "text-gray-300" : "text-slate-700"
                          }`}
                        >
                          {isVi ? "Biệt danh của bạn" : "Your Nickname"}
                        </label>
                        <input
                          type="text"
                          value={myNickname}
                          onChange={(e) => setMyNickname(e.target.value)}
                          placeholder={isVi ? "Bạn" : "You"}
                          className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-purple-500 transition ${
                            isDark
                              ? "bg-[#121214] text-white placeholder-gray-500 border-gray-700"
                              : "bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setActivePanel(null)}
                        className={`flex-1 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          isDark
                            ? "border-gray-800 text-gray-300 hover:bg-gray-800"
                            : "border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isVi ? "Hủy" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={saveNicknames}
                        className="flex-1 py-2.5 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <FaCheck className="w-3.5 h-3.5" />
                        {isVi ? "Lưu biệt danh" : "Save Nicknames"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ====== MENU CHÍNH ====== */}
                {!activePanel && (
                  <div className="space-y-4">
                    {/* Nhóm 1: Tùy chỉnh đoạn chat */}
                    <div>
                      <span
                        className={`block text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 ${
                          isDark ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {isVi ? "Tùy chỉnh đoạn chat" : "Chat Customization"}
                      </span>

                      <div className="space-y-1.5">
                        {/* 1. Đổi chủ đề */}
                        <button
                          type="button"
                          onClick={() => setActivePanel("theme")}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left border ${
                            isDark
                              ? "bg-[#202024]/60 hover:bg-[#27272a] border-gray-800/80 text-gray-200 hover:border-purple-500/30"
                              : "bg-slate-50 hover:bg-purple-50/60 border-slate-200/80 text-slate-700 hover:border-purple-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                isDark
                                  ? "bg-purple-500/15 text-purple-400"
                                  : "bg-purple-100 text-purple-600"
                              }`}
                            >
                              <FaPalette />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium">
                                {isVi ? "Đổi chủ đề" : "Change Theme"}
                              </div>
                              <div
                                className={`text-[10.5px] ${
                                  isDark ? "text-gray-400" : "text-slate-500"
                                }`}
                              >
                                {isVi
                                  ? "Màu nền và màu tin nhắn"
                                  : "Background & message colors"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                              style={{ backgroundColor: customMessageColor }}
                            />
                            <FaChevronRight
                              className={`w-3 h-3 ${
                                isDark ? "text-gray-500" : "text-slate-400"
                              }`}
                            />
                          </div>
                        </button>

                        {/* 2. Biểu tượng cảm xúc nhanh */}
                        <button
                          type="button"
                          onClick={() => setActivePanel("emoji")}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left border ${
                            isDark
                              ? "bg-[#202024]/60 hover:bg-[#27272a] border-gray-800/80 text-gray-200 hover:border-purple-500/30"
                              : "bg-slate-50 hover:bg-purple-50/60 border-slate-200/80 text-slate-700 hover:border-purple-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                isDark
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              <FaSmile />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium">
                                {isVi ? "Biểu tượng nhanh" : "Quick Emoji"}
                              </div>
                              <div
                                className={`text-[10.5px] ${
                                  isDark ? "text-gray-400" : "text-slate-500"
                                }`}
                              >
                                {isVi ? "Gửi nhanh 1 chạm" : "One-click reaction"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-base">
                              {chatConfig?.quickEmoji || "👍"}
                            </span>
                            <FaChevronRight
                              className={`w-3 h-3 ${
                                isDark ? "text-gray-500" : "text-slate-400"
                              }`}
                            />
                          </div>
                        </button>

                        {/* 3. Chỉnh sửa biệt danh */}
                        <button
                          type="button"
                          onClick={() => setActivePanel("nickname")}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left border ${
                            isDark
                              ? "bg-[#202024]/60 hover:bg-[#27272a] border-gray-800/80 text-gray-200 hover:border-purple-500/30"
                              : "bg-slate-50 hover:bg-purple-50/60 border-slate-200/80 text-slate-700 hover:border-purple-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                isDark
                                  ? "bg-sky-500/15 text-sky-400"
                                  : "bg-sky-100 text-sky-600"
                              }`}
                            >
                              <FaTag />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium">
                                {isVi ? "Chỉnh sửa biệt danh" : "Edit Nicknames"}
                              </div>
                              <div
                                className={`text-[10.5px] ${
                                  isDark ? "text-gray-400" : "text-slate-500"
                                }`}
                              >
                                {chatConfig?.nicknames?.[user.uid]
                                  ? `"${chatConfig.nicknames[user.uid]}"`
                                  : isVi
                                  ? "Đặt tên gợi nhớ cho nhau"
                                  : "Set friendly names"}
                              </div>
                            </div>
                          </div>
                          <FaChevronRight
                            className={`w-3 h-3 flex-shrink-0 ${
                              isDark ? "text-gray-500" : "text-slate-400"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Nhóm 2: Quyền riêng tư & Quản lý */}
                    <div>
                      <span
                        className={`block text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 ${
                          isDark ? "text-gray-400" : "text-slate-500"
                        }`}
                      >
                        {isVi ? "Quyền riêng tư & Hỗ trợ" : "Privacy & Support"}
                      </span>

                      <div className="space-y-1.5">
                        {/* 4. Tắt/Bật thông báo */}
                        <button
                          type="button"
                          onClick={toggleMute}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left border ${
                            isMuted
                              ? isDark
                                ? "bg-amber-950/20 hover:bg-amber-950/40 border-amber-900/40 text-amber-300"
                                : "bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-700"
                              : isDark
                              ? "bg-[#202024]/60 hover:bg-[#27272a] border-gray-800/80 text-gray-200"
                              : "bg-slate-50 hover:bg-purple-50/60 border-slate-200/80 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                isMuted
                                  ? "bg-amber-500/20 text-amber-400"
                                  : isDark
                                  ? "bg-gray-800 text-gray-400"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              <FaBellSlash />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium">
                                {isMuted
                                  ? isVi
                                    ? "Bật thông báo"
                                    : "Unmute Notifications"
                                  : isVi
                                  ? "Tắt thông báo"
                                  : "Mute Notifications"}
                              </div>
                              <div
                                className={`text-[10.5px] ${
                                  isDark ? "text-gray-400" : "text-slate-500"
                                }`}
                              >
                                {isMuted
                                  ? isVi
                                    ? "Đoạn chat đang bị tắt tiếng"
                                    : "Conversation is muted"
                                  : isVi
                                  ? "Nhận thông báo khi có tin nhắn mới"
                                  : "Receive alerts for new messages"}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              isMuted
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : isDark
                                ? "bg-gray-800 text-gray-400 border-gray-700"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {isMuted
                              ? isVi
                                ? "Đang tắt"
                                : "Muted"
                              : isVi
                              ? "Đang bật"
                              : "Active"}
                          </span>
                        </button>

                        {/* 5. Chặn cuộc trò chuyện */}
                        <button
                          type="button"
                          onClick={toggleBlock}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left border ${
                            isBlocked
                              ? isDark
                                ? "bg-red-950/20 hover:bg-red-950/40 border-red-900/40 text-red-300"
                                : "bg-red-50 hover:bg-red-100/70 border-red-200 text-red-600"
                              : isDark
                              ? "bg-[#202024]/60 hover:bg-red-950/20 border-gray-800/80 text-gray-200 hover:text-red-400 hover:border-red-900/40"
                              : "bg-slate-50 hover:bg-red-50 border-slate-200/80 text-slate-700 hover:text-red-600 hover:border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                isBlocked
                                  ? "bg-red-500/20 text-red-400"
                                  : isDark
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-red-50 text-red-500"
                              }`}
                            >
                              <FaBan />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium">
                                {isBlocked
                                  ? isVi
                                    ? "Bỏ chặn cuộc trò chuyện"
                                    : "Unblock Conversation"
                                  : isVi
                                  ? "Chặn cuộc trò chuyện"
                                  : "Block Conversation"}
                              </div>
                              <div
                                className={`text-[10.5px] ${
                                  isDark ? "text-gray-400" : "text-slate-500"
                                }`}
                              >
                                {isBlocked
                                  ? isVi
                                    ? "Người này hiện đang bị chặn"
                                    : "This user is currently blocked"
                                  : isVi
                                  ? "Không nhận tin nhắn hoặc cuộc gọi"
                                  : "Stop receiving messages or calls"}
                              </div>
                            </div>
                          </div>
                          {isBlocked && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              {isVi ? "Đã chặn" : "Blocked"}
                            </span>
                          )}
                        </button>

                        {/* 6. Hạn chế */}
                        <div
                          className={`w-full flex items-center justify-between p-3 rounded-xl border opacity-75 ${
                            isDark
                              ? "bg-[#202024]/40 border-gray-800/60 text-gray-400"
                              : "bg-slate-50/70 border-slate-200/60 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                isDark
                                  ? "bg-gray-800 text-gray-400"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              <FaLock />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium">
                                {isVi ? "Hạn chế tương tác" : "Restrict"}
                              </div>
                              <div className="text-[10.5px]">
                                {isVi
                                  ? "Ẩn trạng thái hoạt động của bạn"
                                  : "Hide your online activity"}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-semibold text-gray-400">
                            {isVi ? "Bảo mật" : "Secure"}
                          </span>
                        </div>

                        {/* 7. Mã hóa đầu cuối */}
                        <div
                          className={`w-full flex items-center justify-between p-3 rounded-xl border ${
                            isDark
                              ? "bg-emerald-950/10 border-emerald-900/30 text-gray-300"
                              : "bg-emerald-50/50 border-emerald-200/50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm bg-emerald-500/20 text-emerald-400">
                              <FaShieldAlt />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                                <span>{isVi ? "Được mã hóa đầu cuối" : "End-to-End Encrypted"}</span>
                                <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                              </div>
                              <div
                                className={`text-[10.5px] ${
                                  isDark ? "text-gray-400" : "text-slate-500"
                                }`}
                              >
                                {isVi
                                  ? "Nội dung cuộc trò chuyện luôn được bảo mật"
                                  : "Messages & calls stay private"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nút đóng ở cuối danh sách (tiện lợi trên mobile) */}
                    <div className="pt-2 pb-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                          isDark
                            ? "bg-gray-800/70 hover:bg-gray-800 text-gray-300 hover:text-white border-gray-700/80"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200"
                        }`}
                      >
                        <FaTimes className="w-3.5 h-3.5" />
                        <span>{isVi ? "Đóng thông tin đoạn chat" : "Close chat details"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatHeader;
