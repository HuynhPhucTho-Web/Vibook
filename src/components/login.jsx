import React, { useEffect, useState } from "react";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import SignInwithGoogle from "./signInWIthGoogle";
import InteractiveBlob from "./InteractiveBlob";
import "../style/auth.css";
import { clearLoginRedirect, getLoginRedirect } from "../utils/requireLogin";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getLoginRedirect(location.state?.from);

  // Prefill email after register + show verify reminder
  useEffect(() => {
    const st = location.state;
    if (st?.email) setEmail(st.email);
    if (st?.needsEmailVerification || st?.fromRegister) {
      toast.info(
        "Hãy xác nhận email (link trong hộp thư) rồi đăng nhập lại tại đây.",
        { position: "top-center", autoClose: 9000 }
      );
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Always refresh flags (user may have just clicked verify link)
      await user.reload();
      const fresh = auth.currentUser;
      if (!fresh?.emailVerified) {
        try {
          await sendEmailVerification(fresh);
          toast.warning(
            "Tài khoản chưa xác nhận email. Chúng tôi đã gửi lại link xác nhận — kiểm tra hộp thư rồi đăng nhập lại.",
            { position: "top-center", autoClose: 9000 }
          );
        } catch {
          toast.warning(
            "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email trước khi đăng nhập!",
            { position: "top-center", autoClose: 8000 }
          );
        }
        await signOut(auth);
        return;
      }

      // Sync verified flag in profile doc
      try {
        await setDoc(
          doc(db, "Users", fresh.uid),
          { emailVerified: true },
          { merge: true }
        );
      } catch {
        // non-blocking
      }

      toast.success("Đăng nhập thành công!", { position: "top-center" });
      clearLoginRedirect();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 overflow-hidden p-4 sm:p-6">
      {/* Hiệu ứng nước nền */}
      <InteractiveBlob color="#60a5fa" size={450} offset={{ x: -200, y: -200 }} />
      <InteractiveBlob color="#d8b4fe" size={400} offset={{ x: 200, y: 200 }} />
      <InteractiveBlob color="#fda4af" size={300} offset={{ x: 0, y: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-container relative z-10 w-full max-w-[960px] flex flex-col md:flex-row rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* CỘT TRÁI: FORM ĐĂNG NHẬP */}
        <div className="flex-1 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Header Form */}
            {/* <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 shadow-md shadow-pink-500/20" />
                <span className="font-extrabold text-slate-800 text-lg tracking-tight">ViBook</span>
              </div>
              <Link
                to="/homevibook"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-white/80 border border-slate-200/60 shadow-sm hover:bg-white hover:text-pink-600 hover:scale-[1.02] active:scale-95 transition-all no-underline"
              >
                ← Trang chủ
              </Link>
            </div> */}

            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đăng nhập</h1>
              <p className="text-slate-500 text-sm mt-1">
                Chào mừng trở lại! Vui lòng nhập thông tin của bạn.
              </p>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm shadow-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* Tùy chọn Quên Mật Khẩu & Duy trì đăng nhập */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500 accent-pink-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                    Duy trì đăng nhập
                  </span>
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-pink-600 hover:text-pink-700 transition-colors"
                  onClick={() => toast.info("Chức năng đang phát triển")}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Nút Đăng nhập chính */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 transition-all cursor-pointer"
              >
                {submitting ? "Đang xử lý..." : "Đăng nhập"}
              </button>

              {/* Dải phân cách */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300/60" />
                </div>
                <span className="relative px-3 bg-white/50 backdrop-blur-sm text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Hoặc đăng nhập bằng
                </span>
              </div>

              {/* Google Login Component */}
              <div className="w-full flex justify-center">
                <SignInwithGoogle />
              </div>
            </form>
          </div>

          {/* Navigation Links ở chân Form */}
          <div className="mt-8 pt-4 border-t border-slate-200/40 space-y-2 text-center text-xs">
            <p className="text-slate-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-pink-600 font-bold hover:underline ml-1">
                Tạo tài khoản mới
              </Link>
            </p>
            <p>
              <Link
                to="/homevibook"
                className="text-slate-500 font-medium hover:text-slate-800 hover:underline transition-colors"
              >
                Khám phá với tư cách khách →
              </Link>
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: BANNER TRANG TRÍ */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-white/40 to-white/10 p-10 flex-col justify-between items-center text-center border-l border-white/40">
          <div />

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex flex-col items-center"
          >
            {/* Khối Glassmorphism Hero */}
            <div className="w-72 h-72 rounded-full bg-white/30 backdrop-blur-md border border-white/60 shadow-xl flex items-center justify-center p-8 relative">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800 italic leading-snug">
                  “Kết nối đam mê, chia sẻ khoảnh khắc.”
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cộng đồng ViBook luôn sẵn sàng đồng hành cùng bạn.
                </p>
              </div>

              {/* Các Bong Bóng Trang Trí */}
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-400/40 rounded-full blur-xs" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-400/40 rounded-full blur-xs" />
            </div>
          </motion.div>

          {/* Footer thương hiệu */}
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/60 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              V
            </div>
            <div className="text-left">
              <p className="font-bold text-xs text-slate-800">ViBook</p>
              <p className="text-[10px] text-slate-500">UI Designed by Tho Web</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;