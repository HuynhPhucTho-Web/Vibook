import React, { useState, useRef, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";

const ChatInput = ({ onSend, isLoading }) => {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
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
      className="p-3 border-t border-gray-100 dark:border-white/10 bg-white/80 dark:bg-[#15161f]/80 backdrop-blur-md"
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
          className="w-full pl-3.5 pr-11 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          aria-label="Gửi tin nhắn"
          className="absolute right-1.5 p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-40 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all shadow-xs"
        >
          <FaPaperPlane className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-gray-400">
        <span>Nhấn Enter để gửi</span>
        <span>Astro AI • Groq Powered</span>
      </div>
    </form>
  );
};

export default ChatInput;
