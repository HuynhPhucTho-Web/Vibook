import React, { useState } from "react";
import { FaKey, FaExternalLinkAlt, FaTimes, FaCheck, FaBolt } from "react-icons/fa";
import {
  getStoredGroqApiKey,
  setStoredGroqApiKey,
} from "../../services/geminiChatService";

const ChatSettingsModal = ({ isOpen, onClose }) => {
  const [groqKey, setGroqKey] = useState(() => getStoredGroqApiKey());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const isEnvKey = Boolean(import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_REACT_APP_GROQ_API_KEY);

  const handleSave = (e) => {
    e.preventDefault();
    setStoredGroqApiKey(groqKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  const handleClear = () => {
    setGroqKey("");
    setStoredGroqApiKey("");
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1b26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FaBolt />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                Cấu hình Groq AI
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Llama / Mixtral • Tốc độ phản hồi cực nhanh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Groq API Key (gsk_...)
              </label>
              {isEnvKey && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">
                  Đã tải từ .env
                </span>
              )}
            </div>

            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Key được ưu tiên đọc trực tiếp từ biến môi trường <code className="text-purple-600 dark:text-purple-400">VITE_GROQ_API_KEY</code> trong file .env.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30 text-xs text-purple-800 dark:text-purple-300">
            <span className="font-semibold">💡 Giới thiệu Groq Cloud:</span>
            <p className="mt-1 text-gray-600 dark:text-gray-300 leading-relaxed">
              Groq sử dụng vi xử lý LPU cho tốc độ suy luận ~300 tokens/giây, trả lời gần như tức thì với các mô hình tiên tiến từ Meta & Mistral.
            </p>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              Quản lý API Key tại Groq Console <FaExternalLinkAlt className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex items-center justify-between pt-2">
            {groqKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
              >
                Xóa Key lưu tạm
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md transition-all"
              >
                {saved ? (
                  <>
                    <FaCheck /> Đã lưu
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatSettingsModal;
