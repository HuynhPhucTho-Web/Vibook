import React from "react";
import { Lock, Cookie, Database, ShieldAlert } from "lucide-react";

export default function PrivacyPolicy({ isLight, onBack }) {
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
          Chính Sách Quyền Riêng Tư (Privacy Policy)
        </h1>
        <p className={`text-base max-w-2xl leading-relaxed ${subTextColor}`}>
          Cam kết bảo mật thông tin cá nhân, minh bạch hóa việc thu thập dữ liệu và công khai sử dụng Cookie để phân phối quảng cáo trên ViBook.
        </p>
      </header>

      {/* Main Content */}
      <div className="space-y-6">
        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-purple-500">
            <Database size={22} /> 1. Thu thập dữ liệu người dùng (Data Collection)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            ViBook thu thập và lưu trữ thông tin của người dùng một cách tối thiểu và an toàn thông qua cơ sở dữ liệu Firebase:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-sm">
            <li className={subTextColor}><strong>Thông tin đăng ký:</strong> Địa chỉ Email, Họ và Tên (phục vụ hiển thị và xác minh tài khoản).</li>
            <li className={subTextColor}><strong>Nội dung đăng tải:</strong> Bài đăng, bình luận, tin nhắn chat và các tệp đa phương tiện do chính bạn tải lên.</li>
            <li className={subTextColor}><strong>Lịch sử hoạt động:</strong> Lịch sử lưu bài viết, thông tin đặt mua sản phẩm trên Marketplace để cung cấp dịch vụ.</li>
            <li className={subTextColor}>Chúng tôi cam kết không bán hoặc chia sẻ bất kỳ thông tin cá nhân nào của bạn cho bên thứ ba.</li>
          </ul>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-500">
            <Cookie size={22} /> 2. Chính sách về Cookie & Google AdSense (AdSense Cookie Policy)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            ViBook hiển thị quảng cáo từ các đối tác thứ ba như Google AdSense. Do đó, bạn cần hiểu rõ các điều khoản về Cookie quảng cáo:
          </p>
          <div className={`p-4 rounded-xl border ${borderColor} bg-white/5 space-y-3 text-sm`}>
            <p className="opacity-90">
              - <strong>Google sử dụng cookie:</strong> Google và các đối tác quảng cáo sử dụng cookie (như cookie DoubleClick) để phân phối quảng cáo dựa trên lịch sử truy cập của bạn tại ViBook hoặc các trang web khác trên Internet.
            </p>
            <p className="opacity-90">
              - <strong>Cá nhân hóa quảng cáo:</strong> Việc sử dụng cookie cho phép Google hiển thị quảng cáo được cá nhân hóa, phù hợp với sở thích của riêng bạn.
            </p>
            <p className="opacity-90">
              - <strong>Quyền từ chối của người dùng:</strong> Bạn có thể tắt tính năng cá nhân hóa quảng cáo bằng cách truy cập trang <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">Cài đặt quảng cáo của Google</a> hoặc tắt cookie của bên thứ ba thông qua trình duyệt web của mình.
            </p>
          </div>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-500">
            <Lock size={22} /> 3. Bảo mật thông tin (Data Security)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            ViBook triển khai các biện pháp bảo mật hiện đại nhằm ngăn chặn truy cập trái phép, rò rỉ dữ liệu hoặc thay đổi dữ liệu của bạn:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-sm">
            <li className={subTextColor}>Toàn bộ lưu lượng truy cập trang web được mã hóa bằng giao thức bảo mật <strong>SSL/HTTPS</strong>.</li>
            <li className={subTextColor}>Quản lý định danh người dùng được thực hiện thông qua dịch vụ đám mây an toàn <strong>Firebase Authentication</strong>.</li>
            <li className={subTextColor}>Cấu hình phân quyền truy cập Firestore (Security Rules) chặt chẽ, chỉ cho phép người dùng sửa đổi dữ liệu thuộc quyền sở hữu của chính họ.</li>
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
