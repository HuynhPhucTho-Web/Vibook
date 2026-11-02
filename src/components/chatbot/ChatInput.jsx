import React, { useState, useRef, useEffect, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { getActiveEngineLabel } from "../../services/geminiChatService";

const ChatInput = ({ onSend, isLoading }) => {
  const { theme } = useContext(ThemeContext) || { theme: "light" };
  const isDark = theme === "dark";
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const [engineLabel, setEngineLabel] = useState(() => getActiveEngineLabel());

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
    setEngineLabel(getActiveEngineLabel());
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-3 border-t ${isDark ? "bg-[#202024] border-gray-800" : "bg-slate-50 border-slate-200"}`}
    >
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi Astro về nội dung trang này..."
          disabled={isLoading}
          className={`w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border focus:outline-none focus:border-purple-500 transition disabled:opacity-60 ${isDark ? "bg-[#121214] text-white placeholder-gray-500 border-gray-700" : "bg-white text-slate-900 placeholder-slate-400 border-slate-200"}`}
        />

        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          aria-label="Gửi tin nhắn"
          className="absolute right-1.5 p-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <div className="flex justify-between items-center mt-1.5 px-1">
        <span className="text-[10px] text-gray-500">Nhấn Enter để gửi</span>
        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
          Astro AI • {engineLabel}
        </span>
      </div>
    </form>
  );
};

export default ChatInput;
