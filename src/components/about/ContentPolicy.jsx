import React from "react";
import { AlertTriangle, ShieldCheck, EyeOff, Ban } from "lucide-react";

export default function ContentPolicy({ isLight, onBack }) {
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
          Chính Sách Nội Dung (Content Policy)
        </h1>
        <p className={`text-base max-w-2xl leading-relaxed ${subTextColor}`}>
          Báo cáo chi tiết về cơ chế quản lý, kiểm duyệt nội dung và các quy tắc cộng đồng trên ThoDev
          nhằm đảm bảo môi trường quảng cáo an toàn, tuân thủ nghiêm ngặt Chính sách nội dung của Google AdSense.
        </p>
      </header>

      {/* Main Content */}
      <div className="space-y-6">
        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-purple-500">
            <EyeOff size={22} /> 1. Nội dung bị cấm hoàn toàn (Prohibited Content)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            ThoDev thiết lập bộ lọc tự động và đội ngũ kiểm duyệt thường trực để loại bỏ hoàn toàn các loại nội dung sau khỏi nền tảng:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-sm">
            <li className={subTextColor}>Nội dung người lớn, khiêu dâm, kích dục hoặc ngôn từ thô tục phản cảm.</li>
            <li className={subTextColor}>Nội dung bạo lực ghê rợn, cổ xúy tự hại hoặc khủng bố.</li>
            <li className={subTextColor}>Ngôn từ kích động thù địch, phân biệt chủng tộc, tôn giáo, giới tính hoặc bắt nạt cá nhân.</li>
            <li className={subTextColor}>Nội dung vi phạm bản quyền thương hiệu, phần mềm crack, hàng giả, hàng nhái.</li>
            <li className={subTextColor}>Buôn bán hàng cấm, vũ khí, chất gây nghiện hoặc các dịch vụ bất hợp pháp.</li>
            <li className={subTextColor}>Thông tin sai lệch gây hoang mang dư luận hoặc các trò gian lận tài chính.</li>
          </ul>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-500">
            <ShieldCheck size={22} /> 2. Cơ chế kiểm duyệt & Báo cáo (Moderation & Reporting)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            Để duy trì nội dung sạch phục vụ đối tác quảng cáo AdSense, ThoDev vận hành cơ chế kiểm duyệt 3 lớp:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${borderColor} bg-white/5`}>
              <h4 className="font-bold text-sm mb-2 text-purple-400">Lớp 1: Bộ lọc tự động</h4>
              <p className="text-xs opacity-75">
                Quét từ khóa vi phạm (regex list) và sử dụng AI kiểm duyệt hình ảnh tải lên trước khi bài đăng được công khai.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${borderColor} bg-white/5`}>
              <h4 className="font-bold text-sm mb-2 text-blue-400">Lớp 2: Báo cáo cộng đồng</h4>
              <p className="text-xs opacity-75">
                Mỗi bài viết, bình luận đều tích hợp nút "Báo cáo" để người dùng gửi phản hồi lập tức về cho quản trị viên xử lý.
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${borderColor} bg-white/5`}>
              <h4 className="font-bold text-sm mb-2 text-green-400">Lớp 3: Admin Review</h4>
              <p className="text-xs opacity-75">
                Bảng quản trị Admin xử lý các báo cáo vi phạm 24/7, có quyền khóa tài khoản hoặc xóa bài viết vi phạm trong vòng 10 phút.
              </p>
            </div>
          </div>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-500">
            <AlertTriangle size={22} /> 3. Biện pháp xử lý vi phạm (Enforcement)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            Tất cả các tài khoản vi phạm chính sách nội dung sẽ bị áp dụng các hình phạt nghiêm khắc tùy theo mức độ:
          </p>
          <ol className={`list-decimal pl-5 text-sm space-y-2 ${subTextColor}`}>
            <li><strong>Nhắc nhở & Ẩn nội dung:</strong> Đối với các vi phạm nhẹ hoặc vô ý lần đầu.</li>
            <li><strong>Khóa tài khoản tạm thời (7-30 ngày):</strong> Không cho phép đăng bài hay bình luận nếu tái phạm.</li>
            <li><strong>Khóa vĩnh viễn (IP/Email Ban):</strong> Đối với hành vi cố ý phát tán spam, khiêu dâm hoặc lừa đảo.</li>
          </ol>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass flex items-start gap-4`}>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <Ban size={24} />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">Cam kết về An toàn Thương hiệu (Brand Safety Commitment)</h4>
            <p className="text-xs opacity-75 leading-relaxed">
              ThoDev cam kết bảo vệ thương hiệu của các nhà quảng cáo Google AdSense bằng cách không bao giờ hiển thị quảng cáo bên cạnh
              hoặc trên các nội dung vi phạm chính sách nêu trên. Hệ thống Ad Placement được cấu hình tự động ẩn vùng quảng cáo nếu trang
              bị người dùng báo cáo vi phạm đang chờ duyệt.
            </p>
          </div>
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
