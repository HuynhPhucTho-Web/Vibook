import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import MascotTrigger from "./MascotTrigger";
import ChatDrawer from "./ChatDrawer";
import {
  getActivePageContext,
  getContextualQuickPrompts,
} from "../../utils/pageContextExtractor";
import { sendMessageToGemini } from "../../services/geminiChatService";

const STORAGE_KEY = "vibook_astro_chat_messages";
const MASCOT_IMAGE = "/images/mascot/mascot_1.png";

const MascotChatbot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState(() => getActivePageContext());
  const [isRefreshingContext, setIsRefreshingContext] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState(() =>
    getContextualQuickPrompts(window.location.pathname)
  );

  // Cập nhật ngữ cảnh khi người dùng điều hướng sang trang khác
  useEffect(() => {
    // Đợi 200ms để DOM trang mới render hoàn chỉnh
    const timer = setTimeout(() => {
      const ctx = getActivePageContext();
      setPageContext(ctx);
      setQuickPrompts(getContextualQuickPrompts(location.pathname));
    }, 250);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Lưu lịch sử chat vào sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // bỏ qua lỗi nếu quota đầy
    }
  }, [messages]);

  // Phím tắt Escape để đóng khung chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Quét lại nội dung trang hiện tại thủ công
  const handleRefreshContext = useCallback(() => {
    setIsRefreshingContext(true);
    setTimeout(() => {
      const updated = getActivePageContext();
      setPageContext(updated);
      setQuickPrompts(getContextualQuickPrompts(window.location.pathname));
      setIsRefreshingContext(false);
    }, 300);
  }, []);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Đảm bảo lấy ngữ cảnh mới nhất tại thời điểm gửi
      const currentCtx = getActivePageContext();
      setPageContext(currentCtx);

      const botReply = await sendMessageToGemini({
        messages: newMessages,
        context: currentCtx,
      });

      const botMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        content: botReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn cho bot:", err);
      const errorMessage = {
        id: `bot_err_${Date.now()}`,
        sender: "bot",
        content: "⚠️ Đã xảy ra lỗi khi kết nối. Bạn thử lại nhé!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xóa lịch sử trò chuyện
  const handleClearMessages = () => {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="astro-chatbot-container">
      {/* Nút mascot lơ lửng góc dưới bên phải */}
      <MascotTrigger
        onClick={() => setIsOpen(true)}
        isDrawerOpen={isOpen}
        mascotSrc={MASCOT_IMAGE}
      />

      {/* Khung chat trượt từ mép phải */}
      <ChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        context={pageContext}
        onRefreshContext={handleRefreshContext}
        isRefreshingContext={isRefreshingContext}
        onClearMessages={handleClearMessages}
        quickPrompts={quickPrompts}
        mascotSrc={MASCOT_IMAGE}
      />
    </div>
  );
};

export default MascotChatbot;
