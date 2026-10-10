/**
 * vibookKnowledgeBase.js
 * ─────────────────────────────────────────────────────────────
 * Tri thức tĩnh (static knowledge) của nền tảng Vibook.
 * File này được inject vào system prompt của Astro AI để bot
 * luôn hiểu rõ dữ liệu, tính năng và quy tắc của web.
 *
 * Khi cập nhật tính năng / môn học mới → sửa file này.
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════
// 1. TỔNG QUAN NỀN TẢNG
// ═══════════════════════════════════════════════════════════
export const PLATFORM_INFO = `
**Vibook** là mạng xã hội & hệ sinh thái học tập được phát triển bởi **Huỳnh Phúc Thọ (ThoDev)**.
Phiên bản hiện tại: **2.0** — Status: Production.

**Mục tiêu:** Cho phép người dùng đọc tin tức, xem hồ sơ, tham gia nhóm, xem video, xem story,
mua bán, chơi game, kết bạn và nhắn tin — tất cả trên một nền tảng duy nhất.

**Nguyên tắc UX cốt lõi (Browse First):**
- Người dùng luôn có thể duyệt nội dung trước khi đăng nhập.
- Chỉ chặn tại thời điểm thực hiện hành động ghi dữ liệu (Write Action).
- Không ép đăng nhập ngay khi truy cập trang công khai.
- Lưu state.from / sessionStorage.vibook_login_from để quay lại đúng vị trí sau đăng nhập.
`;

// ═══════════════════════════════════════════════════════════
// 2. TÍNH NĂNG CÁC MODULE
// ═══════════════════════════════════════════════════════════
export const FEATURES = `
**Các tính năng chính của Vibook:**

📰 **Feed / Bảng tin** (/homevibook)
  - Xem bài đăng từ bạn bè, nhóm, trang
  - Guest: chỉ xem | Thành viên: like, comment, share, save, report, tạo bài

👤 **Hồ sơ cá nhân** (/profile, /user/:uid)
  - Xem ảnh đại diện, bài đăng, bạn bè, giới thiệu
  - /profile → trang cá nhân của chính mình (cần đăng nhập)
  - /user/:uid → xem hồ sơ người khác (công khai)

👥 **Nhóm (Groups)** (/groups, /groups/:id)
  - Guest: xem danh sách, bài viết, thành viên
  - Thành viên: tham gia (Join), đăng bài, bình luận, tạo nhóm

📅 **Sự kiện (Events)** (/events)
  - Guest: xem sự kiện, xem người tham gia
  - Thành viên: tham gia (Join), tạo sự kiện

🎥 **Video** (/videos)
  - Xem video từ cộng đồng
  - Guest: xem tự do

📖 **Story** (/story)
  - Xem story ngắn từ bạn bè
  - Thành viên: tạo story

🤝 **Bạn bè (Friends)** (/friends)
  - Guest: chỉ xem "Find Friends" (tìm kiếm người dùng)
  - Guest KHÔNG xem được: My Friends, Friend Requests → sẽ hiện Login Toast
  - Thành viên: kết bạn, chấp nhận/từ chối lời mời, follow

💬 **Messenger** (/messenger) — CẦN ĐĂNG NHẬP
  - Tin nhắn real-time
  - Guest truy cập /messenger → bị chuyển đến trang đăng nhập (RequireAuth)

🛒 **Marketplace / Cửa hàng** (/market, /product/:id)
  - Guest: xem sản phẩm, tìm kiếm, lọc
  - Thành viên: thêm vào giỏ, checkout, đánh giá

🛍️ **Store (Cart, Checkout, Orders)**
  - /cart → cần đăng nhập
  - /checkout → cần đăng nhập
  - /my-orders → xem lịch sử đơn hàng (cần đăng nhập)
  - /seller-dashboard → quản lý cửa hàng (cần đăng nhập)
  - /manage-products → quản lý sản phẩm (cần đăng nhập)

🎮 **Game** (/playgame)
  - Guest: xem & chơi game demo
  - Thành viên: tạo game, lưu điểm

⚙️ **Cài đặt** (/settings)
  - Guest nhìn thấy menu nhưng click → Login Toast (không redirect)
  - Thành viên: thay đổi thông tin, mật khẩu, thông báo, bảo mật

🔔 **Thông báo** (/notifications) — CẦN ĐĂNG NHẬP

📚 **Ngân hàng đề & Tài liệu** (/source) — Tính năng học tập nổi bật
  - Ôn tập trắc nghiệm theo môn học
  - Tải tài liệu PDF từ Google Drive
  - Xem giải thích đáp án chi tiết
`;

// ═══════════════════════════════════════════════════════════
// 3. QUYỀN TRUY CẬP (GUEST vs THÀNH VIÊN)
// ═══════════════════════════════════════════════════════════
export const ACCESS_RULES = `
**Phân quyền truy cập:**

✅ **Guest (chưa đăng nhập) ĐƯỢC phép:**
  Xem Feed, Post, Group, Event, Video, Story, Game, Marketplace, Friend Directory, trang /source

❌ **Guest KHÔNG được phép (sẽ hiện Login Toast thay vì redirect ngay):**
  Nhắn tin, bình luận, like, follow, kết bạn, checkout, tạo nội dung bất kỳ

🔒 **Route cần đăng nhập bắt buộc (RequireAuth — redirect đến /login):**
  /messenger, /notifications, /cart, /checkout, /my-orders, /seller-dashboard, /manage-products
  (Riêng /profile nếu không có :uid cũng cần đăng nhập)

🌐 **Route công khai (không cần đăng nhập):**
  /homevibook, /post/:id, /user/:uid, /groups, /groups/:id/*, /events,
  /videos, /story, /playgame, /market, /product/:id, /friends, /settings (route level)

**Flow khi Guest thực hiện Write Action:**
  Click → requireLogin() → Toast "Bạn cần đăng nhập" [Đăng nhập][Đăng ký][Đóng]
  → Người dùng vẫn ở nguyên trang → Sau đăng nhập → Quay lại đúng vị trí
`;

// ═══════════════════════════════════════════════════════════
// 4. NGÂN HÀNG ĐỀ & MÔN HỌC (/source)
// ═══════════════════════════════════════════════════════════
export const SUBJECTS_INFO = `
**Ngân hàng đề & Tài liệu (/source) — Danh sách môn học hiện có:**

| Mã môn | Tên môn | Ghi chú |
|--------|---------|---------|
| MLN131 | Chủ nghĩa xã hội khoa học (Scientific Socialism) | CORE — có quiz + tài liệu Slot 1–30 |
| MLN111 | Triết học Mác - Lênin | có quiz + tài liệu |
| MLN122 | Kinh tế chính trị Mác - Lênin | có quiz + tài liệu |
| HCM202 | Tư tưởng Hồ Chí Minh | có quiz + tài liệu |
| VNR202 | Lịch sử Đảng Cộng sản Việt Nam | có quiz + tài liệu |
| LAE101 | Tiếng Anh cơ bản (Law & Academic English) | có quiz + tài liệu |
| DPS201C | Digital Platform & Services | có quiz + tài liệu |
| ITE302C | Công nghệ thông tin | có quiz + tài liệu |
| PMG201C | Quản lý dự án (Project Management) | có quiz + tài liệu |

**Cấu trúc dữ liệu môn học:**
- Mỗi môn có: subject → modules → documents (PDF) + quizzes (câu hỏi trắc nghiệm)
- Tài liệu PDF được lưu trên Google Drive, tải trực tiếp qua link
- Câu hỏi quiz có: đề bài, 4 đáp án (A/B/C/D), đáp án đúng, ghi chú giải thích

**Các module đặc biệt:**
- MLN131: "SU26 - B5 - FE" (đề thi cuối kỳ) + "ÔN TẬP ALL" (toàn bộ)
- Mỗi quiz kèm phần giải thích chi tiết (field: note/note_vi)

**Hướng dẫn sử dụng /source:**
1. Chọn môn học → chọn module → xem tài liệu PDF hoặc làm quiz
2. Trong quiz: đọc câu hỏi → chọn đáp án → xem giải thích
3. Có thể quét lại ngữ cảnh bằng nút "Quét lại" trên chatbot để Astro đọc câu hỏi đang hiển thị
`;

// ═══════════════════════════════════════════════════════════
// 5. THÔNG TIN KỸ THUẬT & LIÊN HỆ
// ═══════════════════════════════════════════════════════════
export const TECH_INFO = `
**Thông tin kỹ thuật Vibook:**
- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Chatbot AI: Astro Assistant — Groq API (LLaMA) + Gemini fallback
- Dữ liệu: Firebase Firestore + Google Drive (tài liệu PDF)
- Phát triển bởi: Huỳnh Phúc Thọ (ThoDev)
- Website: Vibook Platform

**Hỗ trợ & liên hệ:**
- Mọi phản hồi, báo lỗi → liên hệ ThoDev qua trang /about
- Chatbot Astro chỉ hỗ trợ giải đáp nội dung trong nền tảng Vibook
`;

// ═══════════════════════════════════════════════════════════
// 6. NAVIGATION — HEADER & SIDEBAR
// ═══════════════════════════════════════════════════════════
export const NAVIGATION_INFO = `
**Điều hướng Vibook:**

**Sidebar (Guest thấy):** Home, Friends, Groups, Events, Videos, Story, PlayGame, Market
**Sidebar (Thành viên):** Tất cả + Messenger, Notifications, Profile, Settings

**Header (Guest):** Chỉ thấy nút Đăng nhập & Đăng ký
**Header (Thành viên):** Avatar, Messenger icon, Notification icon (với badge số chưa đọc), User Menu

**Trang mặc định:** / → redirect → /homevibook (Home luôn là trang đầu tiên, KHÔNG mở Login)
`;

// ═══════════════════════════════════════════════════════════
// BUILD: Tổng hợp thành 1 chuỗi để inject vào system prompt
// ═══════════════════════════════════════════════════════════

/**
 * Trả về phần tri thức Vibook phù hợp với trang hiện tại (pathname).
 * Chỉ inject những mục cần thiết để tiết kiệm token.
 *
 * @param {string} [pathname=""] - window.location.pathname
 * @returns {string}
 */
export const buildVibookKnowledge = (pathname = "") => {
  const always = [
    "═══════════════════════════════════════════════════════════",
    "TRI THỨC NỀN TẢNG VIBOOK",
    "═══════════════════════════════════════════════════════════",
    PLATFORM_INFO.trim(),
    "",
    ACCESS_RULES.trim(),
    "═══════════════════════════════════════════════════════════",
  ];

  // Inject thêm mục chi tiết theo trang đang xem
  const extras = [];

  if (pathname.startsWith("/source")) {
    extras.push(SUBJECTS_INFO.trim());
  } else if (
    pathname.startsWith("/groups") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/friends")
  ) {
    // Chỉ cần phần tính năng cộng đồng — lấy từ FEATURES
    extras.push(
      "**Tính năng cộng đồng:**\n" +
      "- Groups (/groups): Guest xem danh sách/bài/thành viên; Thành viên: Join, Post, Comment\n" +
      "- Events (/events): Guest xem sự kiện; Thành viên: Join, Create\n" +
      "- Friends (/friends): Guest chỉ Find Friends; Thành viên: kết bạn, follow"
    );
  } else if (pathname.startsWith("/market") || pathname.startsWith("/product")) {
    extras.push(
      "**Marketplace:** Guest xem/tìm kiếm/lọc sản phẩm.\n" +
      "Thành viên: thêm giỏ hàng (/cart), thanh toán (/checkout), xem đơn (/my-orders).\n" +
      "Người bán: /seller-dashboard, /manage-products."
    );
  } else if (pathname.startsWith("/messenger")) {
    extras.push("**Messenger** (/messenger): Yêu cầu đăng nhập bắt buộc. Real-time chat với bạn bè.");
  } else {
    // Trang chủ / trang chung — inject FEATURES tóm tắt
    extras.push(FEATURES.trim());
  }

  if (extras.length > 0) {
    always.splice(-1, 0, "", ...extras, "");
  }

  return always.join("\n");
};

