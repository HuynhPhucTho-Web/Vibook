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
      // Firebase auto-signs-in on create — we will sign out after verification email is sent
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
      });

      // Rule: chưa xác nhận email → không giữ session, bắt đăng nhập lại sau verify
      await auth.signOut();

      toast.success(
        "Đăng ký thành công! Vui lòng mở email và xác nhận tài khoản trước khi đăng nhập.",
        {
          position: "top-center",
          autoClose: 9000,
        },
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
      // Nếu tạo user rồi mà bước sau lỗi, tránh kẹt session chưa verify
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#f8fafc] overflow-hidden p-4">
      {/* Background Blobs (Giữ nguyên để tạo sự đồng nhất) */}
      <InteractiveBlob color="#60a5fa" size={450} offset={{ x: -250, y: -150 }} />
      <InteractiveBlob color="#f472b6" size={400} offset={{ x: 250, y: 150 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-container relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row rounded-[40px] overflow-hidden"
      >
        {/* LEFT: FORM ĐĂNG KÝ */}
        <div className="flex-[1.2] p-8 md:p-12 bg-white/20">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 shadow-lg shadow-blue-200" />
              <div className="w-3 h-3 rounded-full bg-pink-400" />
            </div>
            <Link
              to="/homevibook"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 bg-white/70 border border-white/80 shadow-sm hover:bg-white hover:scale-[1.02] active:scale-95 transition-all no-underline"
            >
              ← Về trang chủ
            </Link>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-500 mb-8">Tham gia cộng đồng ViBook ngay hôm nay.</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 ml-1 mb-1">Họ</label>
                <input
                  type="text"
                  className="liquid-input"
                  placeholder="Nguyễn"
                  onChange={(e) => setFname(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 ml-1 mb-1">Tên</label>
                <input
                  type="text"
                  className="liquid-input"
                  placeholder="Văn A"
                  onChange={(e) => setLname(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 ml-1 mb-1">Email</label>
              <input
                type="email"
                className="liquid-input"
                placeholder="example@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 ml-1 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  className="liquid-input"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 ml-1 mb-1">Xác nhận</label>
                <input
                  type="password"
                  className="liquid-input"
                  placeholder="••••••••"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="vb-btn vb-btn--primary w-full mt-4 py-4 text-lg disabled:opacity-60"
            >
              {submitting ? "Đang đăng ký..." : "Đăng ký ngay"}
            </button>

            <p className="text-center text-slate-600 pt-4">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập</Link>
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

        {/* RIGHT: INFO DECORATION */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-white/10 to-transparent p-12 flex-col justify-center items-center text-center border-l border-white/20">
          <div className="space-y-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="w-48 h-48 mx-auto rounded-[30% 70% 70% 30% / 30% 30% 70% 70%] bg-gradient-to-tr from-blue-400/30 to-pink-400/30 backdrop-blur-xl border border-white/50 flex items-center justify-center p-6 shadow-2xl"
            >
              <p className="text-slate-800 font-medium italic">
                “Bắt đầu hành trình của bạn tại đây, nơi kết nối những tâm hồn sáng tạo.”
              </p>
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Tại sao chọn ViBook?</h3>
              <ul className="text-sm text-slate-600 space-y-2 text-left inline-block">
                <li className="flex items-center gap-2">✨ Giao diện hiện đại, mượt mà</li>
                <li className="flex items-center gap-2">🔒 Bảo mật tuyệt đối với Firebase</li>
                <li className="flex items-center gap-2">🚀 Kết nối cộng đồng Designer</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;