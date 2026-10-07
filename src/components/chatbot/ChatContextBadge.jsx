import React from "react";
import { FaSyncAlt, FaCompass } from "react-icons/fa";

const ChatContextBadge = ({ context, onRefresh, isRefreshing }) => {
  if (!context) return null;

  return (
    <div className="flex items-center justify-between px-3.5 py-2 mx-3.5 my-2 rounded-xl bg-purple-500/10 dark:bg-purple-900/20 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
      <div className="flex items-center gap-2 truncate pr-2">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <FaCompass className="text-purple-500 flex-shrink-0" />
        <span
          className="font-medium truncate"
          title={`Đang đọc: ${context.title} (Đã nạp ${context.content?.length || 0} ký tự nội dung)`}
        >
          Đang đọc: <span className="font-semibold text-gray-900 dark:text-white">{context.title}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        title="Quét lại nội dung màn hình hiện tại"
        className="flex items-center gap-1 flex-shrink-0 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors p-1 rounded-md hover:bg-purple-500/10"
      >
        <FaSyncAlt className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Quét lại</span>
      </button>
    </div>
  );
};

export default ChatContextBadge;
