import React, { useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeContext";

const RightSideDrawer = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  width = "w-full sm:w-[480px] md:w-[540px]",
}) => {
  const { theme } = useContext(ThemeContext) || { theme: "light" };
  const isDark = theme === "dark";

  // Phím tắt Escape để đóng drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Khóa cuộn trang khi drawer đang mở
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop làm mờ bên dưới header để không che header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              top: "var(--app-header-height, 60px)",
              height: "calc(100dvh - var(--app-header-height, 60px))",
            }}
            className="fixed left-0 right-0 bottom-0 z-[1049] bg-black/50 backdrop-blur-xs"
          />

          {/* Khung Drawer trượt từ bên phải */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{
              top: "var(--app-header-height, 60px)",
              height: "calc(100dvh - var(--app-header-height, 60px))",
            }}
            className={`fixed right-0 bottom-0 z-[1050] ${width} max-w-full shadow-2xl flex flex-col overflow-hidden transition-colors ${
              isDark
                ? "bg-[#18181b] border-l border-gray-800 text-gray-200"
                : "bg-white border-l border-slate-200 text-slate-800"
            }`}
          >
            {/* Header của Drawer với tiêu đề và nút đóng icon */}
            <div
              className={`flex items-center justify-between px-4 py-3.5 border-b select-none flex-shrink-0 sticky top-0 z-20 ${
                isDark ? "bg-[#202024] border-gray-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {Icon && (
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                      isDark
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : "bg-purple-100 text-purple-600 border border-purple-200"
                    }`}
                  >
                    {React.isValidElement(Icon) ? Icon : <Icon size={13} />}
                  </div>
                )}
                <h3
                  className={`text-sm sm:text-base font-bold m-0 truncate ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {title}
                </h3>
              </div>

              {/* Nút đóng bằng icon */}
              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                  isDark
                    ? "text-gray-400 hover:text-white hover:bg-gray-800 border-gray-700/60 hover:border-gray-600"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 border-slate-200 hover:border-slate-300"
                }`}
                title="Đóng (Esc)"
                aria-label="Đóng"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Nội dung bên trong Drawer (cuộn mượt) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default RightSideDrawer;
