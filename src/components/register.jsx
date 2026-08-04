// src/components/Register.jsx
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InteractiveBlob from "./InteractiveBlob";
import "../style/auth.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự!", { position: "bottom-center" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!", { position: "bottom-center" });
      return;
    }

    setSubmitting(true);
    try {
      // Firebase auto-signs-in on create — sign out after verification email is sent
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        firstName: fname,
        lastName: lname,
        photo: "",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        hasPassword: true,
      });

      // Rule: chưa xác nhận email → không giữ session
      await auth.signOut();

      toast.success(
        "Đăng ký thành công! Vui lòng mở email và xác nhận tài khoản trước khi đăng nhập.",
        {
          position: "top-center",
          autoClose: 9000,
        }
      );

      navigate("/login", {
        replace: true,
        state: {
          fromRegister: true,
          email: email.trim(),
          needsEmailVerification: true,
        },
      });
    } catch (error) {
      try {
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          await auth.signOut();
        }
      } catch {
        // ignore
      }
      toast.error(error.message, { position: "bottom-center" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 overflow-hidden p-4 sm:p-6">
      {/* Background Blobs (Đồng bộ với trang Login) */}
      <InteractiveBlob color="#60a5fa" size={450} offset={{ x: -250, y: -150 }} />
      <InteractiveBlob color="#f472b6" size={400} offset={{ x: 250, y: 150 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-container relative z-10 w-full max-w-[960px] flex flex-col md:flex-row rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* CỘT TRÁI: FORM ĐĂNG KÝ */}
        <div className="flex-[1.2] p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Header Form */}
            {/* <div className="flex items-center justify-between mb-6">
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
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Đăng ký</h1>
              <p className="text-slate-500 text-sm mt-1">
                Tạo tài khoản để tham gia cộng đồng ViBook ngay hôm nay.
              </p>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Họ & Tên chung 1 hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm shadow-sm"
                    placeholder="Nguyễn"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm shadow-sm"
                    placeholder="Văn A"
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm shadow-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Mật khẩu & Xác nhận chung 1 hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Xác nhận
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all text-sm shadow-sm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Nút Đăng ký */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 transition-all cursor-pointer"
              >
                {submitting ? "Đang xử lý..." : "Tạo tài khoản"}
              </button>
            </form>
          </div>

          {/* Navigation Links ở chân Form */}
          <div className="mt-6 pt-4 border-t border-slate-200/40 space-y-1.5 text-center text-xs">
            <p className="text-slate-600">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-pink-600 font-bold hover:underline ml-1">
                Đăng nhập ngay
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
            <div className="w-72 h-72 rounded-full bg-white/30 backdrop-blur-md border border-white/60 shadow-xl flex items-center justify-center p-6 relative">
              <div className="space-y-3">
                <p className="text-slate-800 font-bold italic text-base leading-snug">
                  “Bắt đầu hành trình của bạn tại đây, nơi kết nối những tâm hồn sáng tạo.”
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 text-left inline-block pt-2">
                  <li className="flex items-center gap-1.5">✨ Giao diện hiện đại, mượt mà</li>
                  <li className="flex items-center gap-1.5">🔒 Bảo mật tuyệt đối với Firebase</li>
                  <li className="flex items-center gap-1.5">🚀 Kết nối cộng đồng Designer</li>
                </ul>
              </div>

              {/* Các Bong Bóng Trang Trí */}
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-pink-400/30 rounded-full blur-xs" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400/30 rounded-full blur-xs" />
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

export default Register;