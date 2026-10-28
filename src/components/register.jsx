// src/components/Register.jsx
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import React, { useState, useContext } from "react";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import CursorGrid from "./CursorGrid";
import "../style/auth.css";
import SEO from "./SEO";
import { ThemeContext } from "../context/ThemeContext";

function Register() {
  const { theme, setTheme, toggleTheme } = useContext(ThemeContext) || { theme: "light", setTheme: () => {}, toggleTheme: () => {} };
  const isDark = theme === "dark";

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
    <div 
      className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden p-3 sm:p-5 transition-colors duration-500 ${
        isDark ? "bg-[#0c0d14] text-white" : "bg-[#f4f2fb] text-slate-800"
      }`}
      style={{ backgroundColor: "var(--app-background)" }}
    >
      <SEO
        title="Đăng ký tài khoản"
        description="Đăng ký tài khoản ThoDev miễn phí để chia sẻ kiến thức, lưu trữ tài liệu học tập và tham gia các sự kiện công nghệ sôi nổi."
        slug="/register"
        noindex={true}
      />

      {/* Segmented Theme Switcher ở góc trên */}
      <div 
        className={`absolute top-4 right-4 z-20 flex items-center p-1 rounded-full border backdrop-blur-md transition-all duration-200 shadow-xs ${
          isDark 
            ? "bg-white/[0.08] border-white/15" 
            : "bg-white/90 border-slate-200/90 shadow-slate-200/50"
        }`}
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            !isDark
              ? "bg-amber-500/15 text-amber-700 border border-amber-500/30 shadow-xs font-bold"
              : "text-slate-400 hover:text-white"
          }`}
          title="Chuyển sang giao diện Sáng"
          aria-pressed={!isDark}
        >
          <CiSun className={`text-base ${!isDark ? "text-amber-500" : "text-slate-400"}`} />
          <span>Sáng</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            isDark
              ? "bg-indigo-500/25 text-indigo-200 border border-indigo-400/35 shadow-xs font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
          title="Chuyển sang giao diện Tối"
          aria-pressed={isDark}
        >
          <GiMoon className={`text-base ${isDark ? "text-indigo-300" : "text-slate-500"}`} />
          <span>Tối</span>
        </button>
      </div>

      {/* Hào quang nền trang trí đồng bộ với theme */}
      <div 
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDark ? "bg-purple-600/15" : "bg-purple-300/35"
        }`} 
      />
      <div 
        className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isDark ? "bg-blue-600/15" : "bg-blue-200/35"
        }`} 
      />

      {/* Nền động tương tác CursorGrid đồng bộ theo theme */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <CursorGrid
          key={theme}
          cellSize={60}
          color={isDark ? "#ffffff" : "#8e54e9"}
          gridColor={isDark ? "#ffffff" : "#64748b"}
          highlight="area"
          gridStyle="lines"
          radius={160}
          holdTime={400}
          fadeDuration={800}
          fillOpacity={isDark ? 0.12 : 0.15}
          gridOpacity={isDark ? 0.10 : 0.12}
          spotlight={isDark ? 0.75 : 0.55}
          ambient={isDark ? 0.06 : 0.04}
          lightMode={!isDark}
          clickPulse
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`glass-container relative z-10 w-full max-w-[920px] flex flex-col md:flex-row rounded-3xl backdrop-blur-2xl transition-all duration-300 overflow-hidden ${
          isDark
            ? "border border-white/20 bg-white/[0.07] shadow-2xl shadow-black/80"
            : "border border-slate-200/90 bg-white/80 shadow-2xl shadow-slate-300/50"
        }`}
      >
        {/* CỘT TRÁI: FORM ĐĂNG KÝ */}
        <div className="flex-[1.2] p-5 sm:p-7 md:p-8 flex flex-col justify-between">
          <div>
            <div className="mb-3.5">
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Đăng ký
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-slate-300/80" : "text-slate-600"}`}>
                Tạo tài khoản để tham gia cộng đồng ThoDev ngay hôm nay.
              </p>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleRegister} className="space-y-2.5">
              {/* Họ & Tên chung 1 hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Họ
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3.5 py-2 rounded-xl border transition-all text-sm shadow-inner backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/80 ${
                      isDark
                        ? "border-white/15 bg-white/[0.08] text-white placeholder-slate-400 focus:bg-white/[0.12]"
                        : "border-slate-300/80 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                    placeholder="Nguyễn"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Tên
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3.5 py-2 rounded-xl border transition-all text-sm shadow-inner backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/80 ${
                      isDark
                        ? "border-white/15 bg-white/[0.08] text-white placeholder-slate-400 focus:bg-white/[0.12]"
                        : "border-slate-300/80 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
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
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Email
                </label>
                <input
                  type="email"
                  className={`w-full px-3.5 py-2 rounded-xl border transition-all text-sm shadow-inner backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/80 ${
                    isDark
                      ? "border-white/15 bg-white/[0.08] text-white placeholder-slate-400 focus:bg-white/[0.12]"
                      : "border-slate-300/80 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                  }`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              {/* Mật khẩu & Xác nhận chung 1 hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3.5 py-2 rounded-xl border transition-all text-sm shadow-inner backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/80 ${
                      isDark
                        ? "border-white/15 bg-white/[0.08] text-white placeholder-slate-400 focus:bg-white/[0.12]"
                        : "border-slate-300/80 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Xác nhận
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3.5 py-2 rounded-xl border transition-all text-sm shadow-inner backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/80 ${
                      isDark
                        ? "border-white/15 bg-white/[0.08] text-white placeholder-slate-400 focus:bg-white/[0.12]"
                        : "border-slate-300/80 bg-slate-50/70 text-slate-900 placeholder-slate-400 focus:bg-white"
                    }`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Terms and conditions agreement checkbox */}
              <div className="flex items-start gap-2 py-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className={`mt-0.5 w-3.5 h-3.5 rounded text-pink-500 focus:ring-pink-500 accent-pink-500 cursor-pointer ${
                    isDark ? "border-white/30 bg-white/10" : "border-slate-300 bg-white"
                  }`}
                  required
                />
                <label htmlFor="agreeTerms" className={`text-xs leading-snug cursor-pointer select-none ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Tôi đồng ý với{" "}
                  <Link to="/terms-of-service" target="_blank" className={`font-semibold hover:underline ${isDark ? "text-pink-400 hover:text-pink-300" : "text-pink-600 hover:text-pink-700"}`}>
                    Điều khoản
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy-policy" target="_blank" className={`font-semibold hover:underline ${isDark ? "text-pink-400 hover:text-pink-300" : "text-pink-600 hover:text-pink-700"}`}>
                    Chính sách quyền riêng tư
                  </Link>{" "}
                  của ThoDev.
                </label>
              </div>

              {/* Custom Anti-Abuse Glassmorphic Slider Captcha */}
              <div className={`p-2 sm:p-2.5 rounded-xl shadow-xs backdrop-blur-md border ${
                isDark ? "bg-white/[0.05] border-white/15" : "bg-slate-100/70 border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-1 px-0.5">
                  <label className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}>
                    Xác minh bảo mật (Anti-Bot)
                  </label>
                  {captchaVerified && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    }`}>
                      ✓ Đã xác minh
                    </span>
                  )}
                </div>
                {captchaVerified ? (
                  <div className={`flex items-center justify-center gap-1.5 py-1.5 font-semibold text-xs rounded-lg border ${
                    isDark 
                      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" 
                      : "text-emerald-700 bg-emerald-100/60 border-emerald-300"
                  }`}>
                    <span>🛡️</span> Đã xác minh là con người
                  </div>
                ) : (
                  <div className={`relative flex items-center rounded-lg h-8 overflow-hidden select-none border ${
                    isDark ? "bg-black/40 border-white/15" : "bg-slate-200/80 border-slate-300"
                  }`}>
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-500/30 to-rose-500/30 transition-all duration-75"
                      style={{ width: `${sliderVal}%` }}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] font-medium ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}>
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
                      className={`absolute top-1 bottom-1 w-7 h-6 rounded-md shadow-md flex items-center justify-center text-[10px] font-bold pointer-events-none z-10 transition-all duration-75 ${
                        isDark 
                          ? "bg-white border border-white/80 text-slate-800" 
                          : "bg-white border border-slate-300 text-slate-800"
                      }`}
                      style={{ left: `calc(${sliderVal}% - ${sliderVal * 0.28}px + 2px)` }}
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
                className="w-full mt-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
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
          <div className={`mt-3.5 pt-2.5 border-t space-y-1 text-center text-xs ${
            isDark ? "border-white/15" : "border-slate-200"
          }`}>
            <p className={isDark ? "text-slate-300" : "text-slate-600"}>
              Đã có tài khoản?{" "}
              <Link to="/login" className={`font-bold hover:underline ml-1 ${
                isDark ? "text-pink-400 hover:text-pink-300" : "text-pink-600 hover:text-pink-500"
              }`}>
                Đăng nhập ngay
              </Link>
            </p>
            <p>
              <Link
                to="/feed"
                className={`font-medium hover:underline transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Khám phá với tư cách khách →
              </Link>
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: MASCOT & BANNER TRANG TRÍ */}
        <div className={`hidden md:flex flex-1 p-6 lg:p-8 flex-col justify-between items-center text-center border-l relative overflow-hidden transition-colors ${
          isDark 
            ? "bg-gradient-to-br from-white/[0.04] to-transparent border-white/10" 
            : "bg-gradient-to-br from-purple-50/50 to-slate-50/30 border-slate-200/80"
        }`}>
          <div />

          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 1, 0, -1, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex flex-col items-center justify-center my-auto w-full"
          >
            {/* Hào quang ánh sáng công nghệ sau lưng Mascot */}
            <div className={`absolute w-48 h-48 rounded-full blur-2xl pointer-events-none transition-all duration-700 ${
              isDark
                ? "bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20"
                : "bg-gradient-to-tr from-pink-400/20 via-purple-300/25 to-blue-300/20"
            }`} />

            {/* Mascot 3D Robot Image */}
            <div className="relative z-10 flex flex-col items-center">
              <img
                src="/images/mascot/robot_browser_mascot.webp"
                alt="ThoDev Robot Mascot"
                className="w-48 h-48 lg:w-56 lg:h-56 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.3)] select-none pointer-events-none"
                loading="eager"
              />
              <div className="mt-2 space-y-1 text-center">
                <p className={`text-sm font-bold italic leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
                  “Bắt đầu hành trình sáng tạo cùng ThoDev”
                </p>
                <p className={`text-xs leading-relaxed max-w-[260px] ${isDark ? "text-slate-300/80" : "text-slate-600"}`}>
                  Cộng đồng kết nối đam mê, chia sẻ kiến thức công nghệ.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Footer thương hiệu */}
          <div className={`flex items-center gap-2.5 backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow-xs relative z-10 ${
            isDark 
              ? "bg-white/[0.08] border-white/15" 
              : "bg-white/80 border-slate-200/80 shadow-slate-200/50"
          }`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              V
            </div>
            <div className="text-left">
              <p className={`font-bold text-xs leading-tight ${isDark ? "text-white" : "text-slate-800"}`}>ThoDev</p>
              <p className={`text-[10px] leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>UI Designed by Tho Web</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
