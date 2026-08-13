import React, { useEffect, useState, useMemo } from "react";
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
import SEO from "./SEO";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getLoginRedirect(location.state?.from);

  // Anti-bot Slider Captcha States
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [sliderVal, setSliderVal] = useState(0);

  // Rate Limiting States (5 failed attempts = 60s lockout)
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const attempts = parseInt(localStorage.getItem("vibook_login_failures") || "0");
    const lockTime = parseInt(localStorage.getItem("vibook_login_locktime") || "0");
    if (lockTime && Date.now() < lockTime) {
      return attempts;
    }
    return 0;
  });
  const [lockoutTime, setLockoutTime] = useState(() => {
    const lockTime = parseInt(localStorage.getItem("vibook_login_locktime") || "0");
    if (lockTime && Date.now() < lockTime) {
      return lockTime;
    }
    return 0;
  });

  // Countdown timer for lockout duration
  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      const remaining = lockoutTime - Date.now();
      if (remaining <= 0) {
        setLockoutTime(0);
        setFailedAttempts(0);
        localStorage.removeItem("vibook_login_failures");
        localStorage.removeItem("vibook_login_locktime");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

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
    if (lockoutTime && Date.now() < lockoutTime) {
      const secs = Math.ceil((lockoutTime - Date.now()) / 1000);
      toast.error(`Đăng nhập tạm thời bị khóa. Vui lòng thử lại sau ${secs} giây.`, { position: "top-center" });
      return;
    }
    if (!captchaVerified) {
      toast.error("Vui lòng hoàn thành xác minh bảo mật (anti-bot)!", { position: "top-center" });
      return;
    }

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

      // Success -> Reset failed attempts
      setFailedAttempts(0);
      localStorage.removeItem("vibook_login_failures");
      localStorage.removeItem("vibook_login_locktime");

      toast.success("Đăng nhập thành công!", { position: "top-center" });
      clearLoginRedirect();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      localStorage.setItem("vibook_login_failures", nextAttempts.toString());
      if (nextAttempts >= 5) {
        const lockUntil = Date.now() + 60000; // 60 seconds lock
        setLockoutTime(lockUntil);
        localStorage.setItem("vibook_login_locktime", lockUntil.toString());
        toast.error("Tài khoản đã nhập sai mật khẩu 5 lần. Tạm khóa đăng nhập trong 60 giây để phòng chống Brute-Force.", { position: "top-center", autoClose: 8000 });
      } else {
        toast.error(`${error.message} (Còn ${5 - nextAttempts} lần thử trước khi bị khóa)`, { position: "bottom-center" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 overflow-hidden p-4 sm:p-6">
      <SEO
        title="Đăng nhập"
        description="Đăng nhập tài khoản ViBook để kết nối bạn bè, chia sẻ tài liệu học tập và trải nghiệm các tiện ích học thuật trực tuyến."
        slug="/login"
        noindex={true}
      />
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
                  autoComplete="username"
                  inputMode="email"
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

              {/* Nút Đăng nhập chính */}
              <button
                type="submit"
                disabled={submitting || !captchaVerified || (lockoutTime && Date.now() < lockoutTime)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {lockoutTime && Date.now() < lockoutTime ? (
                  `Tạm khóa (${Math.ceil((lockoutTime - Date.now()) / 1000)}s)`
                ) : submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  "Đăng nhập"
                )}
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