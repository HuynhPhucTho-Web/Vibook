import React, { useState, useEffect, useRef, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const POSITION_STORAGE_KEY = "vibook_mascot_fab_position";

const clampX = (x) => {
  const max = Math.max(16, (typeof window !== "undefined" ? window.innerWidth : 1024) - 90);
  return Math.min(Math.max(16, x), max);
};

const clampY = (y) => {
  const max = Math.max(76, (typeof window !== "undefined" ? window.innerHeight : 768) - 105);
  return Math.min(Math.max(76, y), max);
};

const MascotTrigger = ({
  onClick,
  isDrawerOpen,
  mascotSrc = "/images/mascot/mascot_1.png",
  onHideChatbot,
}) => {
  const { theme } = useContext(ThemeContext) || { theme: "light" };
  const isDark = theme === "dark";
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasDismissedTooltip, setHasDismissedTooltip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Vị trí icon mascot (mặc định góc dưới bên phải, lưu vào localStorage)
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return {
            x: clampX(parsed.x),
            y: clampY(parsed.y),
          };
        }
      }
    } catch {}
    const defaultX = typeof window !== "undefined" ? window.innerWidth - 96 : 900;
    const defaultY = typeof window !== "undefined" ? window.innerHeight - 110 : 650;
    return {
      x: clampX(defaultX),
      y: clampY(defaultY),
    };
  });

  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);
  const isPointerDownRef = useRef(false);

  // Tự động điều chỉnh vị trí khi resize màn hình
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: clampX(prev.x),
        y: clampY(prev.y),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tự động chào nhẹ sau 2.5 giây khi mới vào trang
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasDismissedTooltip && !isDrawerOpen) {
        setShowTooltip(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [hasDismissedTooltip, isDrawerOpen]);

  // Tự động ẩn tooltip sau 8 giây nếu người dùng không tương tác
  useEffect(() => {
    if (showTooltip) {
      const autoHide = setTimeout(() => {
        setShowTooltip(false);
      }, 8000);
      return () => clearTimeout(autoHide);
    }
  }, [showTooltip]);

  if (isDrawerOpen) return null;

  // Xử lý kéo thả (Pointer Events: chuột + cảm ứng)
  const handlePointerDown = (e) => {
    // Chỉ nhận chuột trái hoặc touch/pen
    if (e.button !== undefined && e.button !== 0) return;

    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    if (!hasMovedRef.current && Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
      setShowTooltip(false); // Ẩn tooltip khi bắt đầu kéo
    }

    if (hasMovedRef.current) {
      const newX = clampX(dragStartRef.current.posX + dx);
      const newY = clampY(dragStartRef.current.posY + dy);
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (hasMovedRef.current) {
      // Lưu vị trí mới vào localStorage
      try {
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
      } catch {}
      // Trì hoãn một chút để native click event sau pointerup không trigger mở chat
      setTimeout(() => {
        setIsDragging(false);
        hasMovedRef.current = false;
      }, 120);
    } else {
      setIsDragging(false);
    }
  };

  const handleClick = (e) => {
    if (hasMovedRef.current || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  // Xác định hướng hiển thị tooltip dựa trên vị trí hiện tại
  const isNearLeft = position.x < 240;
  const isNearTop = position.y < 160;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      className="fixed z-[1050] select-none"
    >
      <div className="relative">
        {/* Bong bóng chào hỏi (Speech bubble) */}
        <AnimatePresence>
          {showTooltip && !isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: isNearTop ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: isNearTop ? -10 : 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`absolute ${
                isNearTop ? "top-full mt-3" : "bottom-full mb-3"
              } ${
                isNearLeft ? "left-0" : "right-0"
              } w-52 sm:w-60 p-3 rounded-2xl shadow-xl border text-xs z-10 transition-colors ${
                isDark
                  ? "bg-[#18181b] text-gray-200 border-gray-800"
                  : "bg-white text-gray-800 border-purple-200/80"
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-semibold text-purple-500 dark:text-purple-400 flex items-center gap-1">
                  Astro AI
                </span>
                <div className="flex items-center gap-1">
                  {onHideChatbot && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onHideChatbot();
                      }}
                      title="Tắt icon trợ lý (Bật lại trong Cài đặt > Khả năng tiếp cận)"
                      className={`px-1.5 py-0.5 text-[10.5px] rounded-md font-medium transition-colors cursor-pointer border ${
                        isDark
                          ? "bg-purple-950/60 text-purple-300 hover:bg-red-500 hover:text-white border-purple-800/50"
                          : "bg-purple-100 text-purple-700 hover:bg-red-500 hover:text-white border-purple-200"
                      }`}
                    >
                      Tắt icon
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTooltip(false);
                      setHasDismissedTooltip(true);
                    }}
                    title="Đóng lời nhắc"
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <FaTimes className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <p className={`leading-relaxed text-[11.5px] my-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Cần tớ đọc và giải thích nội dung trang này không? Bấm vào tớ nhé! (Nhấn giữ để di chuyển)
              </p>

              {onHideChatbot && (
                <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[11px] ${
                  isDark ? "border-gray-800" : "border-purple-100"
                }`}>
                  <span className="text-gray-400 text-[10px]">Cài đặt &gt; Khả năng tiếp cận</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHideChatbot();
                    }}
                    className={`font-medium transition-colors bg-transparent border-none p-0 cursor-pointer ${
                      isDark ? "text-purple-400 hover:text-red-400" : "text-purple-600 hover:text-red-500"
                    }`}
                  >
                    Ẩn icon trợ lý
                  </button>
                </div>
              )}

              {/* Mũi nhọn speech bubble */}
              <div
                className={`absolute ${
                  isNearTop ? "-top-2 border-l border-t" : "-bottom-2 border-r border-b"
                } ${
                  isNearLeft ? "left-8" : "right-8"
                } w-3.5 h-3.5 transform rotate-45 ${
                  isDark
                    ? "bg-[#18181b] border-gray-800"
                    : "bg-white border-purple-200/80"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nút Mascot tương tác & di chuyển */}
        <motion.div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onMouseEnter={() => !hasDismissedTooltip && !isDragging && setShowTooltip(true)}
          animate={
            isDragging
              ? { scale: 1.12, rotate: 4 }
              : { y: [0, -6, 0] }
          }
          transition={
            isDragging
              ? { duration: 0.15 }
              : {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          whileHover={{
            scale: 1.08,
            rotate: -2,
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.95 }}
          title="Bấm để mở chat • Nhấn giữ kéo để di chuyển"
          aria-label="Trợ lý Astro AI. Nhấn giữ để di chuyển vị trí"
          className={`relative group select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } focus:outline-hidden`}
        >
          {/* Nút tắt/ẩn nhanh icon mascot hiển thị khi rê chuột */}
          {onHideChatbot && !isDragging && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHideChatbot();
              }}
              title="Tắt icon trợ lý (Bật lại trong Cài đặt > Khả năng tiếp cận)"
              className="absolute -top-1.5 -right-1.5 z-30 w-5 h-5 rounded-full bg-slate-900/90 dark:bg-black/90 hover:bg-red-500 text-gray-300 hover:text-white border border-white/20 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <FaTimes className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Hiệu ứng hào quang phát sáng nhẹ xung quanh mascot */}
          <div
            className={`absolute inset-0 rounded-full bg-purple-500/25 dark:bg-purple-600/35 blur-xl transition-all ${
              isDragging ? "scale-125 bg-purple-500/50" : "group-hover:bg-purple-500/40"
            }`}
          />

          {/* Hình ảnh Mascot */}
          <div
            className={`relative w-16 h-18 sm:w-20 sm:h-22 filter transition-shadow duration-200 ${
              isDragging
                ? "drop-shadow-[0_16px_28px_rgba(142,84,233,0.65)]"
                : "drop-shadow-[0_8px_16px_rgba(142,84,233,0.35)]"
            }`}
          >
            <img
              src={mascotSrc}
              alt="Astro Chatbot Mascot"
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            {/* Chấm Online nhỏ */}
            <span className="absolute top-2 right-1 flex h-3 w-3 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#12131a]"></span>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MascotTrigger;
