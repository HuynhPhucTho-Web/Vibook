import React from "react";
import { CheckCircle, Layers, Smartphone, Sparkles } from "lucide-react";

export default function OtherStandards({ isLight, onBack }) {
  const textColor = isLight ? "text-slate-800" : "text-slate-100";
  const subTextColor = isLight ? "text-slate-600" : "text-slate-300";
  const borderColor = isLight ? "border-slate-200" : "border-zinc-800";
  const headerBg = isLight
    ? "linear-gradient(135deg, rgba(142, 84, 233, 0.05) 0%, rgba(71, 118, 230, 0.05) 100%)"
    : "linear-gradient(135deg, rgba(142, 84, 233, 0.1) 0%, rgba(71, 118, 230, 0.1) 100%)";

  return (
    <article className="space-y-8 animate-fadeIn">
      {/* Header */}
      <header
        className="p-6 md:p-8 rounded-3xl border text-center md:text-left relative overflow-hidden"
        style={{
          background: headerBg,
          borderColor: isLight ? "rgba(142, 84, 233, 0.15)" : "rgba(168, 85, 247, 0.2)",
        }}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2 block">
          Chính sách Tuân thủ AdSense
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          Các Yêu Cầu & Tiêu Chuẩn Khác (Other Standards)
        </h1>
        <p className={`text-base max-w-2xl leading-relaxed ${subTextColor}`}>
          Báo cáo về thiết lập cấu trúc trang web, tính nguyên bản của nội dung, khả năng tương thích di động và tối ưu hóa hiệu năng kỹ thuật của ThoDev.
        </p>
      </header>

      {/* Main Content */}
      <div className="space-y-6">
        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-purple-500">
            <Layers size={22} /> 1. Cơ cấu điều hướng rõ ràng (Clear Site Navigation)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            Google AdSense yêu cầu các trang web phải có hệ thống điều hướng trực quan. ThoDev đáp ứng tiêu chí này bằng cách:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-sm">
            <li className={subTextColor}><strong>Thanh Sidebar cố định:</strong> Giúp người dùng chuyển nhanh giữa Bảng tin, Blog, Messenger, Marketplace, Sự kiện và Trò chơi chỉ với 1 click.</li>
            <li className={subTextColor}><strong>Thanh Header đa năng:</strong> Tích hợp công cụ Tìm kiếm nhanh bài viết/người dùng và menu phím tắt truy cập nhanh trang cá nhân.</li>
            <li className={subTextColor}><strong>Trang lỗi 404 thân thiện:</strong> Có trang thông báo rõ ràng kèm nút điều hướng quay về trang chủ nếu liên kết bị hỏng.</li>
          </ul>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-500">
            <CheckCircle size={22} /> 2. Giá trị & Tính nguyên bản của nội dung (Original Content Value)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            ThoDev cam kết duy trì chất lượng bài viết cao trên toàn nền tảng, loại bỏ vấn đề "nội dung mỏng" (thin content) hoặc copy sao chép:
          </p>
          <ol className={`list-decimal pl-5 text-sm space-y-2 ${subTextColor}`}>
            <li><strong>Khuyến khích nguyên bản:</strong> Mục Blog của chúng tôi tạo không gian cho các blogger và chuyên gia tự viết bài phân tích chuyên sâu chất lượng cao.</li>
            <li><strong>Chống spam tự động:</strong> Sử dụng cơ chế giới hạn tần suất đăng bài (Rate Limit) để chặn các hành vi spam bài viết từ bot tự động.</li>
            <li><strong>Không sử dụng bài viết copy:</strong> Nghiêm cấm các bài viết sao chép hàng loạt từ nguồn khác mà không mang lại giá trị gia tăng nào cho người dùng.</li>
          </ol>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-500">
            <Smartphone size={22} /> 3. Tối ưu tương thích di động (Mobile Friendliness)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            Là mạng xã hội đa nền tảng, giao diện của ThoDev được thiết kế tương thích hoàn hảo trên mọi thiết bị:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-sm">
            <li className={subTextColor}><strong>Responsive Design:</strong> Giao diện tự động co giãn từ màn hình PC siêu rộng cho tới điện thoại cầm tay kích thước nhỏ.</li>
            <li className={subTextColor}><strong>Tối ưu hóa dung lượng:</strong> Nén dung lượng hình ảnh tải lên tự động, áp dụng Lazy Loading cho hình ảnh/video để giảm băng thông mạng di động.</li>
            <li className={subTextColor}><strong>Tương thích Capacitor app:</strong> Mã nguồn sạch, thân thiện và hỗ trợ đóng gói hoạt động mượt mà như một ứng dụng Native trên iOS và Android.</li>
          </ul>
        </section>
      </div>

      {/* Footer / Back */}
      <footer className="pt-4 flex justify-start">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md hover:shadow-purple-500/20"
        >
          Quay lại trang Giới thiệu
        </button>
      </footer>
    </article>
  );
}
