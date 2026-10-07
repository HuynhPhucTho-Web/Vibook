/**
 * Trích xuất ngữ cảnh văn bản hiển thị trên trang hiện tại để gửi cho AI Chatbot.
 * Sửa lỗi cloneNode.innerText rỗng trong trình duyệt bằng cách đọc trực tiếp từ live DOM.
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
  else if (pathname.startsWith("/settings")) category = "Cài đặt tài khoản";

  // 2. Tìm vùng nội dung chính trên màn hình
  const contentEl =
    document.querySelector(".app-shell__content") ||
    document.querySelector("main") ||
    document.querySelector("#root");

  let extractedText = "";

  if (contentEl) {
    // Đọc TRỰC TIẾP innerText từ phần tử đang hiển thị trên màn hình
    // TUYỆT ĐỐI không dùng cloneNode().innerText vì trình duyệt không tính layout cho detached node dẫn đến chuỗi rỗng!
    extractedText = contentEl.innerText || "";
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
  const cleanLines = extractedText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("Astro AI") && !l.includes("Cần tớ đọc và giải thích"));

  const cleanedText = cleanLines.join("\n").slice(0, 3000);

  const finalContent = structuredDetail
    ? `${structuredDetail}\n[NỘI DUNG VĂN BẢN TRÊN TRANG]:\n${cleanedText}`
    : cleanedText;

  // Debug log để kiểm tra trong Console (F12)
  console.log("Astro Scanner - Đã đọc ngữ cảnh UI:", {
    url: pathname,
    title: document.title,
    contentLength: finalContent.length,
    preview: finalContent.slice(0, 200),
  });

  return {
    url: pathname,
    title: document.title || "Vibook Platform",
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
      "Mẹo ghi nhớ kiến thức phần này",
    ];
  }
  if (pathname.startsWith("/blog")) {
    return [
      "Tóm tắt bài viết trong 3 ý chính",
      "Giải thích kỹ thuật được nhắc đến",
      "Đánh giá bài viết này có gì nổi bật?",
    ];
  }
  if (pathname.startsWith("/market") || pathname.startsWith("/product")) {
    return [
      "Sản phẩm này có những tính năng gì?",
      "Hướng dẫn cách đặt hàng và thanh toán",
      "Đánh giá chi tiết về sản phẩm này",
    ];
  }
  if (pathname.startsWith("/friends")) {
    return [
      "Làm sao để tìm kiếm và kết bạn nhanh?",
      "Gợi ý bạn bè cùng khoa / sở thích",
    ];
  }
  return [
    "Giới thiệu các tính năng nổi bật của Vibook",
    "Hướng dẫn tìm kiếm tài liệu học tập",
    "Trò chuyện & Giải đáp thắc mắc",
  ];
};
