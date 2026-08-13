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
import SEO from "./SEO";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Custom Slider Captcha & Terms states
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [sliderVal, setSliderVal] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!agreeTerms) {
      toast.error("Bạn phải đồng ý với Điều khoản và Chính sách để đăng ký!", { position: "bottom-center" });
      return;
    }

    if (!captchaVerified) {
      toast.error("Vui lòng xác minh bạn không phải robot!", { position: "bottom-center" });
      return;
    }

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
      <SEO
        title="Đăng ký tài khoản"
        description="Đăng ký tài khoản ViBook miễn phí để chia sẻ kiến thức, lưu trữ tài liệu học tập và tham gia các sự kiện công nghệ sôi nổi."
        slug="/register"
        noindex={true}
      />
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
                to="/feed"
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
                    autoComplete="family-name"
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
                    autoComplete="given-name"
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
                  autoComplete="username"
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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Terms and conditions agreement checkbox */}
              <div className="flex items-start gap-2.5 py-1.5">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500 accent-pink-500 cursor-pointer"
                  required
                />
                <label htmlFor="agreeTerms" className="text-xs text-slate-600 leading-normal cursor-pointer select-none">
                  Tôi đồng ý với{" "}
                  <Link to="/terms-of-service" target="_blank" className="text-pink-600 hover:underline font-semibold">
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy-policy" target="_blank" className="text-pink-600 hover:underline font-semibold">
                    Chính sách quyền riêng tư
                  </Link>{" "}
                  của ViBook.
                </label>
              </div>

              {/* Custom Anti-Abuse Glassmorphic Slider Captcha */}
              <div className="bg-white/30 border border-white/60 p-3 rounded-2xl shadow-sm backdrop-blur-md">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">
                  Xác minh bảo mật (Anti-Bot)
                </label>
                {captchaVerified ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 font-semibold text-xs animate-[pulse_1.5s_infinite]">
                    <span>🛡️</span> Đã xác minh là con người
                  </div>
                ) : (
                  <div className="relative flex items-center bg-slate-100/50 dark:bg-slate-900/10 border border-slate-200/50 rounded-xl h-10 overflow-hidden select-none">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 transition-all duration-75"
                      style={{ width: `${sliderVal}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-semibold text-slate-500">
                      Kéo thanh trượt sang phải để mở khóa
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderVal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSliderVal(val);
                        if (val >= 98) {
                          setCaptchaVerified(true);
                          setSliderVal(100);
                        }
                      }}
                      onMouseUp={() => {
                        if (sliderVal < 98) {
                          setSliderVal(0);
                        }
                      }}
                      onTouchEnd={() => {
                        if (sliderVal < 98) {
                          setSliderVal(0);
                        }
                      }}
                      className="w-full h-full opacity-0 cursor-ew-resize absolute inset-0 z-20"
                    />
                    <div 
                      className="absolute top-1 bottom-1 w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-md flex items-center justify-center text-xs font-bold text-slate-600 pointer-events-none z-10 transition-all duration-75"
                      style={{ left: `calc(${sliderVal}% - ${sliderVal * 0.32}px + 4px)` }}
                    >
                      ➔
                    </div>
                  </div>
                )}
              </div>

              {/* Nút Đăng ký */}
              <button
                type="submit"
                disabled={submitting || !captchaVerified || !agreeTerms}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  "Tạo tài khoản"
                )}
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
                to="/feed"
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