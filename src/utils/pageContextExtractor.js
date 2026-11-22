/**
 * Trích xuất ngữ cảnh văn bản hiển thị trên trang hiện tại để gửi cho AI Chatbot.
 * Đọc trực tiếp từ Live DOM an toàn, không clone/chèn phần tử vào document.body để tránh layout shift và lỗi innerText rỗng.
 */

export const getActivePageContext = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      url: "/",
      title: "Vibook",
      category: "Chung",
      content: "",
    };
  }

  const pathname = window.location.pathname;

  // 1. Xác định chuyên mục đang duyệt
  let category = "Trang chủ / Bảng tin";
  if (pathname.startsWith("/source")) category = "Ngân hàng đề & Tài liệu ôn thi";
  else if (pathname.startsWith("/blog")) category = "Bài viết kỹ thuật & Blog";
  else if (pathname.startsWith("/market") || pathname.startsWith("/product")) category = "Cửa hàng & Sản phẩm";
  else if (pathname.startsWith("/friends")) category = "Bạn bè & Kết nối cộng đồng";
  else if (pathname.startsWith("/profile") || pathname.startsWith("/user")) category = "Trang cá nhân";
  else if (pathname.startsWith("/messenger")) category = "Tin nhắn trực tuyến";
  else if (pathname.startsWith("/about")) category = "Giới thiệu nền tảng ThoDev / Vibook";
  else if (pathname.startsWith("/settings")) category = "Cài đặt tài khoản & Hệ thống";

  // 2. Tìm vùng nội dung chính trên màn hình
  const contentEl =
    document.querySelector(".app-shell__content") ||
    document.querySelector(".cockpit-page") ||
    document.querySelector("main") ||
    document.querySelector("#root");

  let extractedText = "";

  if (contentEl) {
    // Nếu là vùng nội dung trang độc lập (.app-shell__content hoặc .cockpit-page)
    // Các vùng này nằm hoàn toàn bên ngoài MascotChatbot nên an toàn tuyệt đối khi đọc innerText trực tiếp
    const isIsolatedPage =
      contentEl.classList.contains("app-shell__content") ||
      contentEl.classList.contains("cockpit-page") ||
      Boolean(contentEl.closest(".app-shell__content"));

    if (isIsolatedPage && contentEl.innerText) {
      extractedText = contentEl.innerText;
    } else {
      // Trường hợp đọc từ main hoặc #root: dùng TreeWalker duyệt live DOM trực tiếp
      // Bỏ qua các thành phần chatbot, script, style mà KHÔNG chèn/xóa phần tử vào document.body
      const walker = document.createTreeWalker(
        contentEl,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node;
              const tag = (el.tagName || "").toLowerCase();
              if (tag === "script" || tag === "style" || tag === "noscript") {
                return NodeFilter.FILTER_REJECT;
              }
              if (
                (el.matches && el.matches("[data-chatbot], .mascot-chatbot, .chat-drawer, [aria-hidden='true']")) ||
                (el.getAttribute("aria-label") || "").toLowerCase().includes("chatbot") ||
                (el.getAttribute("aria-label") || "").toLowerCase().includes("astro")
              ) {
                return NodeFilter.FILTER_REJECT;
              }
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const parts = [];
      let curr = walker.nextNode();
      while (curr) {
        if (curr.nodeType === Node.TEXT_NODE) {
          const val = curr.nodeValue ? curr.nodeValue.trim() : "";
          if (val) parts.push(val);
        }
        curr = walker.nextNode();
      }
      extractedText = parts.join("\n");
    }
  }

  // 3. Trích xuất chuyên sâu khi đang ở trang Quiz / Đề ôn thi (/source)
  let structuredDetail = "";
  if (pathname.startsWith("/source")) {
    const questionHeading = document.querySelector("h2");
    if (questionHeading) {
      const qText = questionHeading.innerText?.trim();

      // Tìm phần giải thích nếu có
      const noteBlocks = Array.from(document.querySelectorAll("div, p, section")).filter((el) => {
        const text = el.innerText || "";
        return (
          (text.includes("GIẢI THÍCH") || text.includes("Giải thích bài học") || text.includes("Explanation")) &&
          text.length < 1000
        );
      });

      const noteText = noteBlocks.length > 0 ? noteBlocks[noteBlocks.length - 1].innerText.trim() : "";

      if (qText) {
        structuredDetail = `\n[CÂU HỎI TRÊN MÀN HÌNH]:\n${qText}\n`;
        if (noteText) {
          structuredDetail += `\n[PHẦN GIẢI THÍCH HIỆN CÓ]:\n${noteText}\n`;
        }
      }
    }
  }

  // 4. Làm sạch văn bản: giữ lại dòng để AI hiểu cấu trúc danh sách / câu hỏi / đáp án
  // Lọc thêm các dòng đặc trưng của chatbot UI để tránh AI đọc nhầm giao diện chat
  const CHATBOT_UI_PATTERNS = [
    "Astro AI",
    "Astro Assistant",
    "Astro •",
    "Cần tớ đọc và giải thích",
    "Nhấn Enter để gửi",
    "Groq Powered",
    "Gemini Powered",
    "Google Gemini",
    "Google AI Studio",
    "Hỏi Astro về",
    "Đồng hành & Đọc ngữ cảnh",
    "Đang đọc:",
    "Quét lại",
    "Xóa đoạn hội thoại",
    "Cài đặt Gemini",
    "Cài đặt AI",
    "Vừa xong",
  ];

  const cleanLines = extractedText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l || l.length === 0) return false;
      return !CHATBOT_UI_PATTERNS.some((pattern) => l.includes(pattern));
    });

  const cleanedText = cleanLines.join("\n").slice(0, 1500);

  const finalContent = structuredDetail
    ? `${structuredDetail}\n[NỘI DUNG VĂN BẢN TRÊN TRANG]:\n${cleanedText}`
    : cleanedText;

  // Xác định tiêu đề trang phù hợp
  let pageTitle = document.title || "Vibook Platform";
  if (!pageTitle || pageTitle.includes("Software Engineer & Web Developer")) {
    const headingEl = document.querySelector("h1, h2");
    if (headingEl && headingEl.innerText?.trim()) {
      pageTitle = `${headingEl.innerText.trim()} | ThoDev`;
    } else if (pathname.startsWith("/settings")) {
      pageTitle = "Cài đặt hệ thống ThoDev | Digital Cockpit";
    }
  }

  // Debug log để kiểm tra trong Console (F12)
  console.log("Astro Scanner - Đã đọc ngữ cảnh UI:", {
    url: pathname,
    title: pageTitle,
    contentLength: finalContent.length,
    preview: finalContent.slice(0, 200),
  });

  return {
    url: pathname,
    title: pageTitle,
    category,
    content: finalContent || "Trang hiện tại chưa có nội dung văn bản cụ thể.",
  };
};

/**
 * Gợi ý các câu hỏi nhanh (Quick Prompts) dựa theo trang người dùng đang mở
 */
export const getContextualQuickPrompts = (pathname = "") => {
  if (pathname.startsWith("/source")) {
    return [
      "Giải thích chi tiết câu hỏi này",
      "Tại sao đáp án này lại đúng?",
      "Tóm tắt các khái niệm cốt lõi trong câu này",
      "Các môn học có sẵn trên Vibook",
      "Giới thiệu các tính năng nổi bật của Vibook",
    ];
  }
  if (pathname.startsWith("/blog")) {
    return [
      "Tóm tắt bài viết trong 3 ý chính",
      "Giải thích kỹ thuật được nhắc đến",
      "Giới thiệu các tính năng nổi bật của Vibook",
      "Hướng dẫn tìm kiếm tài liệu học tập",
    ];
  }
  if (pathname.startsWith("/market") || pathname.startsWith("/product")) {
    return [
      "Hướng dẫn cách đặt hàng và thanh toán",
      "Sản phẩm này có những tính năng gì?",
      "Giới thiệu các tính năng nổi bật của Vibook",
    ];
  }
  if (pathname.startsWith("/friends")) {
    return [
      "Làm sao để tìm kiếm và kết bạn nhanh?",
      "Giới thiệu các tính năng nổi bật của Vibook",
      "Hướng dẫn tìm kiếm tài liệu học tập",
    ];
  }
  if (pathname.startsWith("/settings")) {
    return [
      "Hướng dẫn tùy chỉnh giao diện và cỡ chữ",
      "Giới thiệu các tính năng nổi bật của Vibook",
      "Hướng dẫn tìm kiếm tài liệu học tập",
    ];
  }
  return [
    "Giới thiệu các tính năng nổi bật của Vibook",
    "Hướng dẫn tìm kiếm tài liệu học tập",
    "Các môn học có sẵn trên Vibook",
    "Trò chuyện & Giải đáp thắc mắc",
  ];
};
