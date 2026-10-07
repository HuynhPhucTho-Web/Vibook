import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCog, FaTrashAlt } from "react-icons/fa";
import ChatContextBadge from "./ChatContextBadge";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import ChatSettingsModal from "./ChatSettingsModal";

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
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop làm mờ nhẹ trên mobile / tablet */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[1099] bg-black/40 backdrop-blur-xs md:hidden"
            />

            {/* Khung chat trượt ra từ mép phải */}
            <motion.aside
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-[1100] w-full sm:w-[410px] bg-white/95 dark:bg-[#12131a]/95 backdrop-blur-xl border-l border-gray-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-white/50 dark:bg-black/20">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700/50 p-0.5 shadow-xs">
                    <img
                      src={mascotSrc}
                      alt="Astro Bot"
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#12131a]"></span>
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      Astro Assistant
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-medium">
                        AI
                      </span>
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Đồng hành & Đọc ngữ cảnh Vibook
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    title="Cài đặt Gemini API Key"
                    className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <FaCog className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={onClearMessages}
                    title="Xóa đoạn hội thoại"
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <FaTrashAlt className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    title="Đóng khung chat (Esc)"
                    className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Huy hiệu trang đang đọc */}
              <ChatContextBadge
                context={context}
                onRefresh={onRefreshContext}
                isRefreshing={isRefreshingContext}
              />

              {/* Danh sách tin nhắn */}
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                quickPrompts={quickPrompts}
                onSelectPrompt={onSendMessage}
                mascotSrc={mascotSrc}
              />

              {/* Khung nhập tin nhắn */}
              <ChatInput onSend={onSendMessage} isLoading={isLoading} />
            </motion.aside>
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
