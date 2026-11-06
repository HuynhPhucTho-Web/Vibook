import React, { useState, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaCog,
  FaTrashAlt,
  FaEyeSlash,
  FaSyncAlt,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import ChatSettingsModal from "./ChatSettingsModal";
import { getActiveAiProvider, hasConfiguredApiKey } from "../../services/geminiChatService";

const ChatDrawer = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  context,
  onRefreshContext,
  isRefreshingContext,
  onClearMessages,
  quickPrompts,
  mascotSrc = "/images/mascot/mascot_1.png",
  onHideChatbot,
}) => {
  const { theme } = useContext(ThemeContext) || { theme: "light" };
  const isDark = theme === "dark";
  const [showSettings, setShowSettings] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const currentProvider = getActiveAiProvider();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop làm mờ nhẹ trên mobile khi mở lớn */}
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[1099] bg-black/40 backdrop-blur-xs md:hidden"
              />
            )}

            {/* Khung Chat Bot Container */}
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className={`fixed z-[1100] flex flex-col transition-all duration-300 overflow-hidden shadow-2xl border
                /* Trên Mobile: Chiếm toàn màn hình phía dưới (85vh) hoặc thu gọn (60px) */
                left-0 right-0 bottom-0 w-full ${
                  isMinimized
                    ? "h-[60px] rounded-t-2xl border-t"
                    : "h-[85vh] rounded-t-2xl border-t"
                }
                /* Trên Desktop (md trở lên): Cố định kích thước gọn gàng góc phải */
                md:left-auto md:bottom-4 md:right-4 ${
                  isMinimized
                    ? "md:w-[340px] md:h-[60px] md:rounded-2xl"
                    : "md:w-[380px] md:h-[600px] md:rounded-2xl"
                }
                ${isDark ? "bg-[#18181b] border-gray-800 text-gray-200" : "bg-white border-slate-200 text-slate-800"}`}
            >
              {/* Thanh gạt drag handle trên mobile để thu gọn/mở rộng */}
              <div
                onClick={() => setIsMinimized((prev) => !prev)}
                className={`pt-2 pb-0.5 cursor-pointer md:hidden flex justify-center ${isDark ? "bg-[#202024]" : "bg-slate-50"} select-none`}
                title={isMinimized ? "Nhấn để mở rộng" : "Nhấn để thu gọn"}
              >
                <div className="w-10 h-1 bg-gray-400/40 hover:bg-purple-500 rounded-full transition-colors" />
              </div>

              {/* 1. Header của Chat Bot */}
              <div className={`flex items-center justify-between px-3.5 py-2.5 ${isDark ? "bg-[#202024] border-gray-800" : "bg-slate-50 border-slate-200"} border-b select-none`}>
                <div
                  className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 pr-2"
                  onClick={() => isMinimized && setIsMinimized(false)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={mascotSrc}
                      alt="Astro Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-purple-500 bg-purple-950/20"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-50 dark:border-[#202024]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        Astro Assistant
                      </h3>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium flex-shrink-0 ${isDark ? "bg-purple-950 text-purple-300 border-purple-800" : "bg-purple-100 text-purple-700 border-purple-300"}`}>
                        {hasConfiguredApiKey() ? (currentProvider === "gemini" ? "Gemini AI" : "Groq AI") : "Astro AI"}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] truncate max-w-[170px] sm:max-w-[210px] ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      title={context?.title ? `Đang đọc: ${context.title}` : "Đang đọc trang hiện tại"}
                    >
                      {context?.title ? `Đang đọc: ${context.title}` : "Đang đọc trang hiện tại"}
                    </p>
                  </div>
                </div>

                {/* Các nút công cụ Header & Nút đóng mở */}
                <div className="flex items-center gap-0.5 sm:gap-1 text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {/* Nút quét lại nội dung trang */}
                  {onRefreshContext && !isMinimized && (
                    <button
                      type="button"
                      onClick={onRefreshContext}
                      disabled={isRefreshingContext}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? "hover:text-white hover:bg-gray-800 text-gray-400" : "hover:text-slate-900 hover:bg-slate-200/60 text-gray-500"}`}
                      title="Quét lại nội dung trang này"
                    >
                      <FaSyncAlt className={`w-3.5 h-3.5 ${isRefreshingContext ? "animate-spin" : ""}`} />
                    </button>
                  )}

                  {/* Nút xóa đoạn chat */}
                  {!isMinimized && (
                    <button
                      type="button"
                      onClick={onClearMessages}
                      className="p-1.5 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                      title="Xóa đoạn hội thoại"
                    >
                      <FaTrashAlt className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Nút cài đặt AI */}
                  {!isMinimized && (
                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="p-1.5 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-slate-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                      title="Cài đặt AI (Google Gemini & Groq)"
                    >
                      <FaCog className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Nút Ẩn chatbot vĩnh viễn */}
                  {onHideChatbot && !isMinimized && (
                    <button
                      type="button"
                      onClick={onHideChatbot}
                      className="p-1.5 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                      title="Ẩn biểu tượng Astro (Bật lại trong Cài đặt)"
                    >
                      <FaEyeSlash className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Nút thu gọn / mở rộng */}
                  <button
                    type="button"
                    onClick={() => setIsMinimized((prev) => !prev)}
                    className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                    title={isMinimized ? "Mở rộng khung chat" : "Thu gọn khung chat"}
                  >
                    {isMinimized ? (
                      <FaChevronUp className="w-3.5 h-3.5 text-purple-500" />
                    ) : (
                      <FaChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Nút đóng khung chat */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                    title="Đóng chat (Esc)"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. Khu vực hiển thị tin nhắn (Scrollable) */}
              {!isMinimized && (
                <>
                  <ChatMessageList
                    messages={messages}
                    isLoading={isLoading}
                    quickPrompts={quickPrompts}
                    onSelectPrompt={onSendMessage}
                    mascotSrc={mascotSrc}
                  />

                  {/* 3. Thanh nhập nội dung (Input Footer) */}
                  <ChatInput onSend={onSendMessage} isLoading={isLoading} />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal cấu hình API Key */}
      <ChatSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default ChatDrawer;
