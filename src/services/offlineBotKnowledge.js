/**
 * offlineBotKnowledge.js
 * ─────────────────────────────────────────────────────────────
 * Kho dữ liệu tri thức và câu trả lời mẫu cho Astro AI khi chưa
 * kết nối API (hoặc khi API gặp sự cố/mất mạng), đảm bảo trải nghiệm
 * chat liên tục, đầy đủ thông tin và không bị gián đoạn.
 * ─────────────────────────────────────────────────────────────
 */

export const OFFLINE_TOPICS = {
  FEATURES: "Giới thiệu các tính năng nổi bật của Vibook",
  STUDY_GUIDE: "Hướng dẫn tìm kiếm tài liệu học tập",
  CHAT_HELP: "Trò chuyện & Giải đáp thắc mắc",
  COURSES: "Các môn học có sẵn trên Vibook",
  FRIENDS: "Làm sao để tìm kiếm và kết bạn nhanh?",
  MARKET: "Hướng dẫn cách đặt hàng và thanh toán",
  SETTINGS: "Hướng dẫn tùy chỉnh giao diện và cỡ chữ",
  EXPLAIN_QUIZ: "Giải thích chi tiết câu hỏi này",
  WHY_CORRECT: "Tại sao đáp án này lại đúng?",
  BLOG_SUMMARY: "Tóm tắt bài viết trong 3 ý chính",
};

/**
 * Danh sách gợi ý câu hỏi tiếp theo (Follow-up prompts)
 */
export const FOLLOW_UP_SUGGESTIONS = {
  default: [
    "Giới thiệu các tính năng nổi bật của Vibook",
    "Hướng dẫn tìm kiếm tài liệu học tập",
    "Các môn học có sẵn trên Vibook",
    "Làm sao để tìm kiếm và kết bạn nhanh?",
    "Hướng dẫn cách đặt hàng và thanh toán",
    "Hướng dẫn tùy chỉnh giao diện và cỡ chữ",
  ],
  source: [
    "Giải thích chi tiết câu hỏi này",
    "Tại sao đáp án này lại đúng?",
    "Mẹo ghi nhớ kiến thức phần này",
    "Các môn học có sẵn trên Vibook",
    "Giới thiệu các tính năng nổi bật của Vibook",
  ],
  blog: [
    "Tóm tắt bài viết trong 3 ý chính",
    "Giải thích kỹ thuật được nhắc đến",
    "Giới thiệu các tính năng nổi bật của Vibook",
    "Hướng dẫn tìm kiếm tài liệu học tập",
  ],
  market: [
    "Hướng dẫn cách đặt hàng và thanh toán",
    "Sản phẩm này có những tính năng gì?",
    "Chính sách bảo hành và đổi trả",
    "Giới thiệu các tính năng nổi bật của Vibook",
  ],
  settings: [
    "Hướng dẫn tùy chỉnh giao diện và cỡ chữ",
    "Cách bảo vệ tài khoản và đổi mật khẩu",
    "Giới thiệu các tính năng nổi bật của Vibook",
  ],
};

/**
 * Trả về danh sách gợi ý phù hợp dựa vào câu hỏi trước đó và URL
 */
export const getNextSuggestions = (userQuery = "", pathname = "") => {
  const q = userQuery.toLowerCase();
  const baseSuggestions = pathname.startsWith("/source")
    ? FOLLOW_UP_SUGGESTIONS.source
    : pathname.startsWith("/blog")
    ? FOLLOW_UP_SUGGESTIONS.blog
    : pathname.startsWith("/market")
    ? FOLLOW_UP_SUGGESTIONS.market
    : pathname.startsWith("/settings")
    ? FOLLOW_UP_SUGGESTIONS.settings
    : FOLLOW_UP_SUGGESTIONS.default;

  // Lọc bỏ câu vừa hỏi để gợi ý những chủ đề mới
  return baseSuggestions.filter((item) => !q.includes(item.toLowerCase())).slice(0, 4);
};

/**
 * Tạo câu trả lời chi tiết và phong phú khi chưa kết nối API
 */
export const getOfflineResponse = (userMessage = "", context = {}) => {
  const text = (userMessage || "").trim().toLowerCase();
  const pageTitle = context.title || "Vibook";
  const pageContent = context.content || "";

  // 1. GIỚI THIỆU CÁC TÍNH NĂNG NỔI BẬT CỦA VIBOOK
  if (
    text.includes("tính năng") ||
    text.includes("nổi bật") ||
    text.includes("giới thiệu vibook") ||
    text.includes("vibook có gì") ||
    text.includes("chức năng")
  ) {
    return `🌟 **Vibook – Mạng xã hội & Hệ sinh thái số sáng tạo bởi Huỳnh Phúc Thọ (ThoDev)**

Dưới đây là các phân hệ tính năng nổi bật hàng đầu bạn có thể trải nghiệm ngay:

📰 **1. Bảng tin Công nghệ & Chia sẻ tri thức (/homevibook)**
- Đăng tải bài viết, dự án, đoạn code kỹ thuật, hình ảnh và video.
- Hệ thống tương tác cảm xúc 7 sắc thái (Like, Love, Care, Haha, Wow, Sad, Angry) và bình luận thời gian thực.
- Lưu trữ bài viết yêu thích và chia sẻ bài đăng lên dòng thời gian.

📚 **2. Ngân hàng đề thi & Kho tài liệu ôn tập (/source)**
- Kho đề trắc nghiệm phong phú các môn đại cương & chuyên ngành: Triết học (MLN131), Tư tưởng HCM (HCM202), Lịch sử Đảng (VNR202), Kỹ thuật phần mềm (DPS201c, ITE302c)...
- Chấm điểm và hiển thị giải thích chi tiết ngay khi chọn đáp án.
- Tải bộ tài liệu, slide giáo trình PDF tốc độ cao qua liên kết Google Drive trực tiếp.

📝 **3. Blog Kỹ thuật & Devlog chuyên sâu (/blog)**
- Chuyên trang tổng hợp bài viết chất lượng về Frontend (React, Vite, Tailwind), Backend (Firebase, Node.js), AI/ML và kiến trúc sản phẩm số.
- Hỗ trợ lọc theo danh mục, thẻ tag và ước tính thời gian đọc bài.

👥 **4. Nhóm học tập & Cộng đồng (/groups)**
- Không gian giao lưu, lập nhóm đồ án, thảo luận bài tập chuyên ngành theo từng nhóm sở thích hoặc lớp học.

🛒 **5. ThoDev Market & Cửa hàng (/market)**
- Sàn trao đổi sản phẩm công nghệ, giáo trình, thiết bị điện tử. Hỗ trợ giỏ hàng (/cart), đơn mua (/my-orders) và kênh người bán (/seller-dashboard).

🎮 **6. Gaming Hub & Thư giãn (/playgame)**
- Bộ sưu tập mini game giải trí nhẹ nhàng (2048, Flappy, Snake...) giúp nạp lại năng lượng sau những giờ học và lập trình căng thẳng.

💬 **7. Tin nhắn trực tuyến Messenger (/messenger)**
- Nhắn tin bảo mật, trò chuyện trao đổi học tập tốc độ cao và gửi media tiện lợi.

⚙️ **8. Digital Cockpit & Cá nhân hóa (/settings)**
- Tự do chuyển đổi giao diện Sáng / Tối (Dark Obsidian), chọn 5 màu ánh sắc nền (Lavender, Mint, Sky, Warm).
- Điều chỉnh kích thước cỡ chữ, bố cục gọn và tùy chỉnh trợ lý Astro AI.

---
*(💡 Bạn có thể bấm vào các gợi ý bên dưới để Astro hướng dẫn chi tiết từng tính năng nhé!)*`;
  }

  // 2. HƯỚNG DẪN TÌM KIẾM TÀI LIỆU HỌC TẬP & ÔN THI
  if (
    text.includes("tìm kiếm tài liệu") ||
    text.includes("tài liệu học tập") ||
    text.includes("tài liệu") ||
    text.includes("ôn thi") ||
    text.includes("ngân hàng đề") ||
    text.includes("luyện thi")
  ) {
    return `📚 **Hướng dẫn tìm kiếm và ôn luyện tài liệu tại Kho tài liệu (/source):**

Vibook được tích hợp sẵn trung tâm ôn thi trắc nghiệm thông minh, giúp bạn tự học hiệu quả qua các bước sau:

1️⃣ **Truy cập Kho tài liệu:**
- Nhấn vào biểu tượng cuốn sách trên thanh điều hướng bên trái hoặc truy cập thẳng vào đường dẫn **/source**.

2️⃣ **Lựa chọn môn học cần ôn luyện:**
- **MLN131:** Triết học Mác - Lênin (Đầy đủ các chương thế giới quan, quy luật, cặp phạm trù).
- **HCM202:** Tư tưởng Hồ Chí Minh (Cơ sở hình thành, độc lập dân tộc, đại đoàn kết toàn dân).
- **VNR202:** Lịch sử Đảng Cộng sản Việt Nam (Các giai đoạn đấu tranh, đường lối đổi mới).
- **Chuyên ngành CNTT:** Kỹ thuật phần mềm, Quản trị dự án, Lập trình ứng dụng...

3️⃣ **Luyện đề trực tiếp & Xem giải thích:**
- Nhấp chọn câu trả lời, hệ thống sẽ báo ngay kết quả đúng (xanh) hoặc sai (đỏ).
- Đọc kỹ khung **"Giải thích bài học"** bên dưới để hiểu sâu bản chất lý thuyết, không cần học vẹt!

4️⃣ **Tải trọn bộ Slide & PDF:**
- Ở thanh đầu mối trang môn học có nút dẫn trực tiếp tới thư mục Google Drive để bạn tải giáo trình, đề cương tóm tắt về máy học offline.

5️⃣ **Đồng hành cùng Astro AI:**
- Bất cứ khi nào gặp câu hỏi khó, bạn chỉ cần mở khung chat Astro và chọn *"Giải thích chi tiết câu hỏi này"*, Astro sẽ đọc câu hỏi trên màn hình và phân tích cho bạn!`;
  }

  // 3. CÁC MÔN HỌC CÓ SẴN TRÊN VIBOOK
  if (
    text.includes("môn học") ||
    text.includes("danh sách môn") ||
    text.includes("môn nào") ||
    text.includes("mln131") ||
    text.includes("hcm202") ||
    text.includes("vnr202")
  ) {
    return `🎓 **Danh sách các môn học & bộ đề ôn luyện có sẵn trên Vibook:**

Hệ thống kho tài liệu hiện đang hỗ trợ toàn diện các môn học trọng điểm:

📘 **1. Triết học Mác - Lênin (Mã môn: MLN131)**
- Nội dung: Chủ nghĩa duy vật biện chứng, phép biện chứng duy vật, 3 quy luật cơ bản, 6 cặp phạm trù, chủ nghĩa duy vật lịch sử.
- Đi kèm hàng trăm câu hỏi trắc nghiệm có giải thích luận điểm chi tiết.

📕 **2. Tư tưởng Hồ Chí Minh (Mã môn: HCM202)**
- Nội dung: Cơ sở, quá trình hình thành tư tưởng Hồ Chí Minh; độc lập dân tộc gắn liền với CNXH; đại đoàn kết dân tộc; xây dựng Đảng và Nhà nước của dân, do dân, vì dân.

📗 **3. Lịch sử Đảng Cộng sản Việt Nam (Mã môn: VNR202)**
- Nội dung: Quá trình thành lập Đảng (1930), các cao trào cách mạng giải phóng dân tộc (1930 - 1945), hai cuộc kháng chiến chống Pháp - Mỹ và thời kỳ đổi mới đi lên CNXH.

💻 **4. Các môn chuyên ngành Công nghệ thông tin:**
- **DPS201c:** Kỹ năng tư duy thiết kế và giải quyết vấn đề số.
- **ITE302c:** Đạo đức nghề nghiệp và chuẩn mực trong ngành CNTT.
- **PMG201c:** Quản trị dự án phần mềm cơ bản.

👉 Bạn có thể vào ngay mục **/source** để chọn môn và bắt đầu làm bài luyện tập nhé!`;
  }

  // 4. TRÒ CHUYỆN & GIẢI ĐÁP THẮC MẮC (VỀ ASTRO AI)
  if (
    text.includes("trò chuyện") ||
    text.includes("giải đáp") ||
    text.includes("astro là ai") ||
    text.includes("bạn là ai") ||
    text.includes("astro làm được gì")
  ) {
    return `🤖 **Xin chào! Mình là Astro – Trợ lý AI đồng hành cùng bạn trên Vibook!**

Mình là chú phi hành gia vũ trụ với bộ đồ trắng xanh đáng yêu. Mình được thiết kế để hỗ trợ tối đa cho việc học tập và trải nghiệm mạng xã hội của bạn:

✨ **Những điều Astro có thể giúp bạn:**
- 🔍 **Đọc ngữ cảnh trang hiện tại:** Mình tự động đọc tiêu đề, bài viết, câu hỏi trắc nghiệm đang hiển thị trên màn hình bạn để tóm tắt và giải đáp tức thời.
- 📖 **Giải đáp học thuật:** Phân tích câu hỏi khó, giải thích thuật ngữ Triết học, Lịch sử, Code và Công nghệ.
- 🧭 **Chỉ dẫn nền tảng:** Hướng dẫn kết bạn, tạo nhóm, quản lý cài đặt tài khoản, mở cửa hàng trên Market.
- ⚡ **Hoạt động liên tục:** Ngay cả khi chưa gắn API Key bên ngoài, mình vẫn có sẵn bộ tri thức nền tảng phong phú để trò chuyện cùng bạn!

*(💡 Bạn cũng có thể mở nút ⚙️ Cài đặt ở góc trên khung chat này để cấu hình thêm Gemini hoặc Groq API Key nếu muốn mình tự do suy luận và sáng tạo nhiều hơn nữa nhé!)*`;
  }

  // 5. GIẢI THÍCH CHI TIẾT CÂU HỎI & TẠI SAO ĐÁP ÁN NÀY ĐÚNG (DÀNH CHO /source)
  if (
    text.includes("giải thích chi tiết câu hỏi") ||
    text.includes("tại sao đáp án này lại đúng") ||
    text.includes("giải thích câu hỏi") ||
    text.includes("mẹo ghi nhớ")
  ) {
    if (pageContent && pageContent.length > 20) {
      return `💡 **Phân tích câu hỏi đang hiển thị:**

Dựa vào nội dung trên màn hình bạn đang xem:
> *${pageContent.slice(0, 350)}...*

📌 **Phương pháp chọn đáp án chuẩn xác:**
1. **Xác định từ khóa nòng cốt:** Chú ý các cụm từ định hướng (như *"bản chất là"*, *"quy luật nào"*, *"nguyên nhân sâu xa"*, *"tính tất yếu"*).
2. **Loại trừ phương án bẫy:**
   - Loại các đáp án mang tính tuyệt đối hóa, phiến diện hoặc dùng từ sai ngữ cảnh kinh điển.
   - Các đáp án chỉ đúng một phần hoặc thuộc về phạm trù khác sẽ bị loại trừ.
3. **Mẹo ghi nhớ lâu dài:**
   - Với câu hỏi định nghĩa: Gắn liền với tên tác giả hoặc luận điểm cốt lõi trong giáo trình.
   - Với câu hỏi quy luật: Nhớ rõ quy luật Lượng - Chất chỉ cách thức, Mâu thuẫn chỉ nguồn gốc, Phủ định chỉ khuynh hướng phát triển.`;
    }

    return `💡 **Mẹo phân tích câu hỏi trắc nghiệm đại cương:**

Khi làm bài trắc nghiệm trên Vibook:
1. **Đọc kỹ yêu cầu câu hỏi:** Xác định câu hỏi thuộc chuyên đề nào (Triết học, Tư tưởng HCM hay Lịch sử Đảng).
2. **Tìm từ khóa hạt nhân:** Các câu hỏi thường xoay quanh bản chất, nguyên nhân, mục tiêu hoặc ý nghĩa lịch sử.
3. **Sử dụng phương pháp loại suy:** Đối chiếu 4 phương án, loại bỏ ngay 2 phương án sai lệch rõ rệt, sau đó cân nhắc kỹ 2 phương án còn lại dựa theo giáo trình chuẩn.
4. **Nhấn chọn đáp án trên màn hình:** Hệ thống sẽ ngay lập tức mở ra phần *"Giải thích bài học"* chi tiết từ các giảng viên!`;
  }

  // 6. TÓM TẮT BÀI VIẾT BLOG (/blog)
  if (
    text.includes("tóm tắt") ||
    text.includes("ý chính") ||
    text.includes("nội dung bài viết")
  ) {
    if (pageContent && pageContent.length > 50) {
      return `📄 **Tóm tắt 3 điểm cốt lõi từ nội dung đang hiển thị:**

1. 🎯 **Mục tiêu & Đặt vấn đề:**
   Nội dung bài viết tập trung phân tích và giải quyết bài toán: *"**${pageTitle}**"*, hướng đến nâng cao hiệu quả kỹ thuật và tối ưu trải nghiệm.

2. ⚙️ **Giải pháp & Kiến trúc kỹ thuật:**
   Áp dụng các công nghệ hiện đại, phân tách module logic rõ ràng, tối ưu tốc độ phản hồi và cấu trúc dữ liệu minh bạch.

3. 💡 **Đúc kết thực tiễn cho Developer:**
   Giúp người đọc áp dụng ngay vào dự án thực tế, tránh các lỗi phổ biến (pitfalls) và xây dựng mã nguồn bền vững, dễ bảo trì.`;
    }

    return `📄 **Tóm tắt nhanh nội dung trang:**\n\nBạn hiện đang ở trang **${pageTitle}** (Chuyên mục: *${context.category || "Hệ sinh thái ThoDev"}*).\n\nNội dung tại đây được thiết kế nhằm tối ưu hóa quy trình học tập, chia sẻ mã nguồn và phát triển sản phẩm công nghệ cho cộng đồng lập trình viên!`;
  }

  // 7. BẠN BÈ & KẾT NỐI (/friends)
  if (
    text.includes("kết bạn") ||
    text.includes("bạn bè") ||
    text.includes("tìm bạn")
  ) {
    return `🤝 **Hướng dẫn tìm kiếm và kết nối bạn bè trên Vibook:**

1. **Tìm kiếm bạn bè:** Nhập họ tên hoặc email vào ô tìm kiếm toàn trang (Header) hoặc mục **"Find Friends"** tại **/friends**.
2. **Gửi lời mời:** Nhấn nút **"Thêm bạn"** (Add Friend) trên thẻ người dùng.
3. **Chấp nhận kết bạn:** Khi nhận được yêu cầu, bạn vào thẻ **"Lời mời kết bạn"** để xác nhận kết nối.
4. **Giao lưu & Nhắn tin:** Sau khi trở thành bạn bè, bài viết của họ sẽ hiển thị ưu tiên trên Feed và bạn có thể mở khung chat Messenger (/messenger) để trò chuyện trực tiếp!`;
  }

  // 8. CỬA HÀNG & MUA BÁN (/market)
  if (
    text.includes("mua hàng") ||
    text.includes("đặt hàng") ||
    text.includes("market") ||
    text.includes("thanh toán") ||
    text.includes("cửa hàng")
  ) {
    return `🛒 **Hướng dẫn mua sắm và bán hàng trên ThoDev Market:**

1. **Duyệt sản phẩm:** Truy cập mục **Cửa hàng** (/market) để xem danh sách phụ kiện, sách, linh kiện và đồ công nghệ.
2. **Thêm vào giỏ hàng:** Nhấn **"Thêm vào giỏ"** hoặc **"Mua ngay"** tại trang chi tiết sản phẩm.
3. **Đặt hàng (/checkout):** Điền chính xác thông tin người nhận, số điện thoại và địa chỉ giao hàng.
4. **Theo dõi đơn (/my-orders):** Quản lý tình trạng đơn hàng: Chờ duyệt, Đang giao, Đã giao thành công.
5. **Kênh người bán (/seller-dashboard):** Nếu bạn muốn đăng bán sản phẩm của mình, hãy vào Kênh người bán để đăng tải hình ảnh và mô tả sản phẩm!`;
  }

  // 9. CÀI ĐẶT GIAO DIỆN & TÀI KHOẢN (/settings)
  if (
    text.includes("cài đặt") ||
    text.includes("giao diện") ||
    text.includes("cỡ chữ") ||
    text.includes("đổi mật khẩu") ||
    text.includes("màu nền")
  ) {
    return `⚙️ **Hướng dẫn sử dụng trang Cài đặt hệ thống (/settings):**

Trang cài đặt mới được thiết kế theo phong cách **Digital Cockpit** hiện đại:
- 🎨 **Giao diện & Ngôn ngữ:** Chọn chế độ Sáng hoặc Tối (Dark Obsidian), đổi 5 màu ánh sắc nền (Mặc định, Xanh trời, Oải hương, Bạc hà, Ấm áp) và chuyển đổi ngôn ngữ (Tiếng Việt, English, 日本語).
- 🔤 **Khả năng tiếp cận:** Điều chỉnh cỡ chữ (Nhỏ 14px, Tiêu chuẩn 16px, Lớn 18px) với khung xem trước trực quan. Bật/tắt trợ lý Astro AI, giảm chuyển động và bố cục gọn.
- 🔒 **Quyền riêng tư:** Tùy chọn đối tượng mặc định cho bài viết mới (Công khai, Bạn bè, Chỉ mình tôi).
- 🔔 **Thông báo:** Quản lý thông báo cảm xúc, bình luận, lời mời kết bạn và tin nhắn.
- 🛡️ **Bảo mật & Tài khoản:** Cập nhật mật khẩu mới và xuất tệp sao lưu cấu hình cá nhân (.json).

*(Mọi thay đổi giao diện đều được lưu tự động ngay khi bạn thao tác!)*`;
  }

  // 10. TÁC GIẢ HUỲNH PHÚC THỌ (THODEV)
  if (
    text.includes("tác giả") ||
    text.includes("huỳnh phúc thọ") ||
    text.includes("thodev") ||
    text.includes("ai tạo ra")
  ) {
    return `👨‍💻 **Về tác giả và nhà sáng lập ThoDev:**

Nền tảng **Vibook** được thiết kế và phát triển bởi **Huỳnh Phúc Thọ (ThoDev)**:
- **Vị trí:** Software Engineer & Web Developer tại Việt Nam.
- **Chuyên môn:** React, JavaScript, Firebase, Cloud Services, AI Integration và phát triển sản phẩm số.
- **Tầm nhìn:** Kiến tạo hệ sinh thái mạng xã hội kết hợp học tập toàn diện, nơi sinh viên và lập trình viên có thể cùng nhau kết nối, chia sẻ mã nguồn và nâng cao kỹ năng công nghệ mỗi ngày!
- Bạn có thể xem chi tiết tại trang **Giới thiệu** (/about).`;
  }

  // 11. CHÀO HỎI THÂN THIỆN
  if (
    text.includes("chào") ||
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return `👋 **Chào bạn! Mình là Astro – Trợ lý AI của Vibook!**

Rất vui được đồng hành cùng bạn. Mình đang theo dõi trang **"${pageTitle}"** cùng bạn đây!

Bạn có thể bấm vào các thẻ gợi ý bên dưới hoặc hỏi mình về:
- 🌟 Tính năng nổi bật của Vibook
- 📚 Hướng dẫn tìm tài liệu ôn thi (Triết học, Tư tưởng HCM, Sử Đảng...)
- 👥 Cách kết bạn, tạo nhóm và nhắn tin
- 🎨 Tùy biến giao diện buồng lái kỹ thuật số

Bạn cần mình hỗ trợ điều gì nào?`;
  }

  // 12. PHẢN HỒI MẶC ĐỊNH THÔNG MINH KÈM NGỮ CẢNH TRANG
  if (pageContent && pageContent.length > 30) {
    return `🤖 **Astro ghi nhận câu hỏi của bạn về trang "${pageTitle}":**

Dựa vào nội dung bạn đang mở trên màn hình:
> *${pageContent.slice(0, 260)}...*

📌 **Gợi ý từ Astro:**
- Nếu bạn cần giải thích hoặc tóm tắt nội dung này, hãy thử bấm nút **"Tóm tắt bài viết trong 3 ý chính"** hoặc **"Giải thích chi tiết câu hỏi này"**.
- Bạn cũng có thể chọn các chủ đề gợi ý phổ biến ở bên dưới để khám phá trọn vẹn nền tảng Vibook nhé!

*(💡 Bạn có thể cấu hình thêm Gemini API Key trong nút ⚙️ Cài đặt để Astro trò chuyện linh hoạt hơn nữa!)*`;
  }

  return `🤖 **Astro luôn sẵn sàng đồng hành cùng bạn!**

Mình đã sẵn sàng giải đáp mọi thắc mắc học tập và tính năng trên Vibook. Hãy thử chọn một trong các gợi ý bên dưới để mình hướng dẫn ngay nhé:

- 🌟 **Giới thiệu các tính năng nổi bật của Vibook**
- 📚 **Hướng dẫn tìm kiếm tài liệu học tập**
- 🎓 **Các môn học có sẵn trên Vibook**
- 🤝 **Làm sao để tìm kiếm và kết bạn nhanh?**`;
};
