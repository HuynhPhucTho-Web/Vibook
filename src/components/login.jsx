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
        { position: "top-center", autoClose: 9000 },
      );
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Always refresh flags (user may have just clicked verify link)
      await user.reload();
      const fresh = auth.currentUser;
      if (!fresh?.emailVerified) {
        try {
          await sendEmailVerification(fresh);
          toast.warning(
            "Tài khoản chưa xác nhận email. Chúng tôi đã gửi lại link xác nhận — kiểm tra hộp thư rồi đăng nhập lại.",
            { position: "top-center", autoClose: 9000 },
          );
        } catch {
          toast.warning(
            "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email trước khi đăng nhập!",
            { position: "top-center", autoClose: 8000 },
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
          { merge: true },
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#f8fafc] overflow-hidden p-4">
      {/* Hiệu ứng nước nền */}
      <InteractiveBlob color="#60a5fa" size={450} offset={{ x: -200, y: -200 }} />
      <InteractiveBlob color="#d8b4fe" size={400} offset={{ x: 200, y: 200 }} />
      <InteractiveBlob color="#fda4af" size={300} offset={{ x: 0, y: 0 }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-container relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row rounded-[40px] overflow-hidden"
      >
        {/* CỘT TRÁI: FORM */}
        <div className="flex-1 p-8 md:p-14 bg-white/20">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-pink-500 shadow-lg shadow-pink-200" />
              <div className="w-4 h-4 rounded-full bg-blue-400" />
            </div>
            <Link
              to="/homevibook"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 bg-white/70 border border-white/80 shadow-sm hover:bg-white hover:scale-[1.02] active:scale-95 transition-all no-underline"
            >
              ← Về trang chủ
            </Link>
          </div>

          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Sign in</h1>
          <p className="text-slate-500 mb-8">Vui lòng nhập thông tin tài khoản của bạn.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Email</label>
              <input
                type="email"
                className="liquid-input"
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Mật khẩu</label>
              <input
                type="password"
                className="liquid-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded accent-pink-500" />
                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Duy trì đăng nhập</span>
              </label>
              <button
                type="button"
                className="text-pink-600 font-bold hover:text-pink-700 transition-colors"
                onClick={() => toast.info("Chức năng đang phát triển")}
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="vb-btn vb-btn--primary w-full py-4 text-lg disabled:opacity-60"
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-300"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-500">Hoặc tiếp tục với</span></div>
            </div>

            <SignInwithGoogle />

            <p className="text-center text-slate-600 pt-4">
              Bạn chưa có tài khoản?{" "}
              <Link to="/register" className="text-pink-600 font-bold hover:underline">Tạo ngay</Link>
            </p>

            <p className="text-center pt-2">
              <Link
                to="/homevibook"
                className="text-slate-500 text-sm font-medium hover:text-blue-600 hover:underline"
              >
                Tiếp tục xem với tư cách khách →
              </Link>
            </p>
          </form>
        </div>

        {/* CỘT PHẢI: DECORATION */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-white/30 to-white/10 p-12 flex-col justify-center items-center text-center">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Hình tròn lớn giả lập giọt nước */}
            <div className="w-64 h-64 rounded-full bg-white/40 shadow-inner border border-white/50 backdrop-blur-md flex items-center justify-center p-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 italic leading-tight">
                  “Tìm kiếm sự thú vị dễ dàng hơn bạn tưởng.”
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Trải nghiệm kết nối cộng đồng hoàn toàn mới cùng ViBook.
                </p>
              </div>
            </div>
            {/* Các bong bóng nhỏ trang trí xung quanh */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-300/50 rounded-full blur-sm" />
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-purple-300/50 rounded-full blur-sm" />
          </motion.div>

          <div className="mt-12 flex items-center gap-4 bg-white/40 p-4 rounded-3xl border border-white/50">
            <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-xl">V</div>
            <div className="text-left">
              <p className="font-bold text-slate-800">ViBook</p>
              <p className="text-xs text-slate-500">UI Designer By Tho Web</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;