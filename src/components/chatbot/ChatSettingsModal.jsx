import React, { useState } from "react";
import {
  FaKey,
  FaExternalLinkAlt,
  FaTimes,
  FaCheck,
  FaBolt,
  FaGoogle,
  FaRobot,
} from "react-icons/fa";
import {
  getStoredApiKey,
  setStoredApiKey,
  getStoredGroqApiKey,
  setStoredGroqApiKey,
  getActiveAiProvider,
  setActiveAiProvider,
  isGeminiEnvKey,
  isGroqEnvKey,
} from "../../services/geminiChatService";

const ChatSettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("gemini");
  const [provider, setProvider] = useState(() => getActiveAiProvider());
  const [geminiKey, setGeminiKey] = useState(() => getStoredApiKey());
  const [groqKey, setGroqKey] = useState(() => getStoredGroqApiKey());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const isGeminiEnv = isGeminiEnvKey();
  const isGroqEnv = isGroqEnvKey();

  const handleSave = (e) => {
    e.preventDefault();
    setStoredApiKey(geminiKey);
    setStoredGroqApiKey(groqKey);
    setActiveAiProvider(provider);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  const handleClearGemini = () => {
    setGeminiKey("");
    setStoredApiKey("");
  };

  const handleClearGroq = () => {
    setGroqKey("");
    setStoredGroqApiKey("");
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a1b26] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FaRobot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                Cài đặt Trợ lý AI Astro
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Google Gemini (AI Studio) & Groq Cloud
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-4 overflow-y-auto pr-1">
          {/* Chọn Provider mặc định */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nhà cung cấp AI mặc định:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setProvider("gemini");
                  setActiveTab("gemini");
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  provider === "gemini"
                    ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30"
                    : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                <FaGoogle className="text-purple-500" />
                <span>Google Gemini</span>
                {provider === "gemini" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider("groq");
                  setActiveTab("groq");
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  provider === "groq"
                    ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30"
                    : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                <FaBolt className="text-indigo-500" />
                <span>Groq Cloud</span>
                {provider === "groq" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                )}
              </button>
            </div>
          </div>

          {/* Tabs cấu hình Key */}
          <div className="flex border-b border-gray-100 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("gemini")}
              className={`pb-2 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "gemini"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <FaGoogle className="w-3 h-3" />
              <span>Cấu hình Gemini</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("groq")}
              className={`pb-2 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "groq"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <FaBolt className="w-3 h-3" />
              <span>Cấu hình Groq</span>
            </button>
          </div>

          {/* Tab Nội dung Gemini */}
          {activeTab === "gemini" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Gemini API Key (AIzaSy...)
                  </label>
                  {isGeminiEnv && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">
                      Đã nạp từ .env
                    </span>
                  )}
                </div>

                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Key được ưu tiên đọc trực tiếp từ biến môi trường <code className="text-purple-600 dark:text-purple-400 font-semibold">VITE_GEMINI_API_KEY</code> trong file <code className="text-purple-600 dark:text-purple-400">.env</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30 text-xs text-purple-900 dark:text-purple-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <FaKey className="text-purple-600 dark:text-purple-400" />
                  Hướng dẫn lấy Gemini API Key miễn phí:
                </span>
                <p className="mt-1 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Google cung cấp miễn phí API cho các model thông minh <strong>Gemini 2.0 Flash</strong> và <strong>Gemini 1.5 Flash</strong>. API Key chuẩn của Google AI Studio thường bắt đầu bằng tiền tố <code>AIzaSy...</code>
                </p>
                <div className="mt-2.5">
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-medium text-xs hover:bg-purple-700 transition-colors shadow-xs"
                  >
                    <span>Lấy API Key tại Google AI Studio</span>
                    <FaExternalLinkAlt className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {geminiKey && (
                <button
                  type="button"
                  onClick={handleClearGemini}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 underline"
                >
                  Xóa Key Gemini lưu tạm
                </button>
              )}
            </div>
          )}

          {/* Tab Nội dung Groq */}
          {activeTab === "groq" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Groq API Key (gsk_...)
                  </label>
                  {isGroqEnv && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">
                      Đã nạp từ .env
                    </span>
                  )}
                </div>

                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Key được đọc từ biến môi trường <code className="text-indigo-600 dark:text-indigo-400 font-semibold">VITE_GROQ_API_KEY</code> trong file .env.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/30 text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <FaBolt className="text-indigo-600 dark:text-indigo-400" />
                  Groq Cloud LPU:
                </span>
                <p className="mt-1 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Groq cho tốc độ phản hồi siêu nhanh với các mô hình mã nguồn mở như LLaMA 3.1, Mixtral. Thích hợp khi bạn cần phản hồi tức thì.
                </p>
                <div className="mt-2.5">
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    <span>Quản lý Key tại Groq Console</span>
                    <FaExternalLinkAlt className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {groqKey && (
                <button
                  type="button"
                  onClick={handleClearGroq}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 underline"
                >
                  Xóa Key Groq lưu tạm
                </button>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {saved ? (
                <>
                  <FaCheck /> Đã lưu
                </>
              ) : (
                "Lưu cấu hình"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatSettingsModal;

