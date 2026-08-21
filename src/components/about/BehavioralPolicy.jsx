import React from "react";
import { MousePointer, ShieldAlert, Sparkles, Layout } from "lucide-react";

export default function BehavioralPolicy({ isLight, onBack }) {
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
          Chính Sách Về Hành Vi (Behavioral Policy)
        </h1>
        <p className={`text-base max-w-2xl leading-relaxed ${subTextColor}`}>
          Báo cáo về cách bố trí vị trí quảng cáo và kiểm soát tương tác trên ThoDev nhằm ngăn chặn
          lưu lượng truy cập không hợp lệ và click tặc theo tiêu chuẩn Google AdSense.
        </p>
      </header>

      {/* Main Content */}
      <div className="space-y-6">
        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-purple-500">
            <Layout size={22} /> 1. Bố cục quảng cáo chuẩn mực (Deceptive Layouts Prevention)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            ThoDev cam kết thiết kế giao diện minh bạch, tách biệt hoàn toàn giữa nội dung tương tác của người dùng và khu vực hiển thị quảng cáo:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-sm">
            <li className={subTextColor}><strong>Nhãn quảng cáo rõ ràng:</strong> Mọi khung quảng cáo đều được gắn nhãn "Quảng cáo" hoặc "Advertisement" dễ nhận biết.</li>
            <li className={subTextColor}><strong>Khoảng cách an toàn (Safe Margin):</strong> Quảng cáo được đặt cách xa các nút tương tác (Thích, Bình luận, Chia sẻ) tối thiểu 24px để tránh nhấp chuột nhầm (accidental clicks).</li>
            <li className={subTextColor}><strong>Không đẩy bố cục đột ngột (CLS Prevention):</strong> Cố định kích thước khung chứa quảng cáo (Ad slots) trước khi tải quảng cáo, ngăn việc thay đổi giao diện đột ngột gây kích nhầm.</li>
            <li className={subTextColor}><strong>Không che khuất nội dung:</strong> Quảng cáo không bao giờ đè lên văn bản, thanh menu điều hướng hoặc các nút bấm chức năng quan trọng.</li>
          </ul>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-500">
            <ShieldAlert size={22} /> 2. Ngăn chặn nhấp chuột không hợp lệ (Invalid Clicks Protection)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            ThoDev chủ động triển khai các kỹ thuật giám sát lưu lượng truy cập để bảo vệ quyền lợi của các nhà quảng cáo:
          </p>
          <ol className={`list-decimal pl-5 text-sm space-y-2 ${subTextColor}`}>
            <li><strong>Không khuyến khích nhấp chuột:</strong> Không sử dụng các từ ngữ kích động như "Hãy click quảng cáo để ủng hộ", "Click để xem thêm", hoặc treo thưởng ảo khi xem quảng cáo.</li>
            <li><strong>Chặn nhấp chuột trùng lặp:</strong> Sử dụng mã Javascript để tạm thời ẩn hoặc ngắt tương tác trên quảng cáo đối với các tài khoản có hành vi nhấp chuột liên tiếp trong thời gian ngắn (chống click tặc).</li>
            <li><strong>Lọc lưu lượng bot:</strong> Sử dụng Cloudflare và các giải pháp lọc lưu lượng để phát hiện, ngăn chặn và loại trừ lượng truy cập tự động từ botnet, click farm.</li>
          </ol>
        </section>

        <section className={`p-6 rounded-2xl border ${borderColor} vb-glass space-y-4`}>
          <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-500">
            <Sparkles size={22} /> 3. Điều hướng an toàn & Không xâm nhập (User Navigation Safety)
          </h2>
          <p className={`text-sm leading-relaxed ${subTextColor}`}>
            Trải nghiệm điều hướng trên ThoDev tuân thủ tuyệt đối chuẩn mực bảo mật người dùng:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 list-disc text-sm">
            <li className={subTextColor}>Không sử dụng cửa sổ bật lên (Pop-ups) hay cửa sổ bật xuống (Pop-unders) tự động chứa quảng cáo.</li>
            <li className={subTextColor}>Không tự ý chuyển hướng (Redirect) người dùng đến các trang web lạ khi họ chưa nhấp chuột đồng ý.</li>
            <li className={subTextColor}>Không cài đặt bất kỳ phần mềm độc hại, mã đào coin ẩn hoặc tự động tải xuống tệp tin trái phép.</li>
            <li className={subTextColor}>Hệ thống menu điều hướng rõ ràng, minh bạch giúp người dùng dễ dàng chuyển trang mà không bị đánh lừa.</li>
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
