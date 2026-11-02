import React, { useEffect, useRef, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { motion } from "framer-motion";
import { FaUser, FaRobot, FaLightbulb } from "react-icons/fa";

/**
 * Hàm định dạng Markdown cơ bản (bold, italic, list, quotes, links)
 */
const renderFormattedText = (text = "") => {
  if (!text) return null;

  // Tách dòng
  const lines = text.split("\n");

  return lines.map((line, idx) => {
    // Quote
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={idx}
          className="border-l-2 border-purple-500 pl-2.5 py-0.5 my-1 text-gray-600 dark:text-gray-300 italic bg-purple-500/5 rounded-r"
        >
          {line.replace(/^>\s*/, "")}
        </blockquote>
      );
    }

    // List item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const itemContent = line.replace(/^[-*]\s*/, "");
      return (
        <li key={idx} className="ml-4 list-disc my-0.5">
          <FormatInline text={itemContent} />
        </li>
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const itemContent = line.replace(/^\d+\.\s*/, "");
      return (
        <li key={idx} className="ml-4 list-decimal my-0.5">
          <FormatInline text={itemContent} />
        </li>
      );
    }

    return (
      <p key={idx} className={line.trim() === "" ? "h-2" : "my-1 leading-relaxed"}>
        <FormatInline text={line} />
      </p>
    );
  });
};

const FormatInline = ({ text = "" }) => {
  // Thay thế bold **text**
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-gray-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={i} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-gray-100 dark:bg-black/40 text-purple-600 dark:text-purple-400 font-mono text-[11px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
};

const ChatMessageList = ({
  messages = [],
  isLoading = false,
  quickPrompts = [],
  onSelectPrompt,
  mascotSrc = "/images/mascot/mascot_1.png",
}) => {
  const { theme } = useContext(ThemeContext) || { theme: "light" };
  const isDark = theme === "dark";
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs sm:text-sm custom-scrollbar">
      {/* Lời chào mở đầu từ Mascot */}
      <div className="flex gap-3 items-start">
        <div className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 p-0.5">
          <img
            src={mascotSrc}
            alt="Astro Mascot"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1">
          <div className="bg-slate-100 dark:bg-[#27272a] text-slate-800 dark:text-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-xs border border-slate-200/80 dark:border-gray-800/60">
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              Xin chào! Tớ là Astro
            </p>
            <p className="leading-relaxed">
              Tớ là trợ lý AI của Vibook. Tớ có thể đọc nội dung bạn đang xem trên màn hình để tóm tắt, giải thích kiến thức, hoặc hướng dẫn dùng tính năng!
            </p>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 ml-1 inline-block">Astro • Vừa xong</span>
        </div>
      </div>

      {/* Danh sách tin nhắn trò chuyện */}
      {messages.map((msg, idx) => {
        const isUser = msg.sender === "user";

        return (
          <motion.div
            key={msg.id || idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 items-start ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs overflow-hidden ${
                isUser
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs"
                  : "bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 p-0.5"
              }`}
            >
              {isUser ? (
                <FaUser className="w-3 h-3" />
              ) : (
                <img src={mascotSrc} alt="Bot" className="w-full h-full object-contain" />
              )}
            </div>

            {/* Bubble */}
            <div className={`max-w-[82%] sm:max-w-[78%]`}>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                  isUser
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm"
                    : "bg-slate-100 dark:bg-[#27272a] text-slate-800 dark:text-gray-200 rounded-tl-sm border border-slate-200/80 dark:border-gray-800/60"
                }`}
              >
                {renderFormattedText(msg.content)}
              </div>
              <div
                className={`text-[10px] text-gray-400 mt-1 ${
                  isUser ? "text-right mr-1" : "text-left ml-1"
                }`}
              >
                {msg.time || "Vừa xong"}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Typing Indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2.5 items-center"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 p-0.5">
            <img src={mascotSrc} alt="Bot" className="w-full h-full object-contain" />
          </div>
          <div className="bg-slate-100 dark:bg-[#27272a] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 border border-slate-200/80 dark:border-gray-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1.5">
              Astro đang suy nghĩ...
            </span>
          </div>
        </motion.div>
      )}

      {/* Quick Prompts gợi ý thông minh */}
      {quickPrompts.length > 0 && !isLoading && (
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            <FaLightbulb className="text-amber-500 flex-shrink-0" />
            <span>Gợi ý cho bạn:</span>
          </div>
          <div className="flex md:flex-wrap gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-nowrap">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="text-xs bg-purple-50 hover:bg-purple-100 dark:bg-[#202024] dark:hover:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/50 px-3 py-1.5 rounded-lg whitespace-nowrap text-left transition flex-shrink-0 cursor-pointer shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessageList;
