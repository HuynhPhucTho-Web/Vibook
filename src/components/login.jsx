// src/components/Login.jsx
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "./firebase";
import { toast } from "react-toastify";
import SignInwithGoogle from "./signInWIthGoogle";
import "../style/auth.css";    // dùng chung cho login + register

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("User logged in Successfully", {
        position: "top-center",
      });
      navigate("/homevibook", { replace: true });
    } catch (error) {
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-inner">
          {/* LEFT: LOGIN FORM */}
          <div className="auth-left">
            <div className="auth-logo-pill">
              <span className="dot dot-1" />
              <span className="dot dot-2" />
            </div>

            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">
              Please enter your account details.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrap">
                  <input
                    type="email"
                    placeholder="johndoe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-row between">
                <label className="auth-checkbox">
                  <input type="checkbox" />
                  <span>Keep me logged in</span>
                </label>
                <button
                  type="button"
                  className="auth-link-text"
                  onClick={() => toast.info("Chức năng quên mật khẩu đang phát triển")}
                >
                  Forgot password
                </button>
              </div>

              <button type="submit" className="auth-primary-btn">
                Sign in
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <div className="auth-social-row">
                <SignInwithGoogle />
                {/* Có thể thêm GitHub / Facebook icon sau nếu muốn */}
              </div>

              <p className="auth-bottom-text">
                New here?{" "}
                <Link to="/register" className="auth-bottom-link">
                  Create an account
                </Link>
              </p>
            </form>
          </div>

          {/* RIGHT: TESTIMONIAL / INFO */}
          <div className="auth-right">
            <div className="auth-right-inner">
              <p className="auth-right-label">Người dùng của chúng tôi nói</p>
              <h2 className="auth-right-title">
                “Tìm kiếm sự thú vị nằm ở đây<br />dễ dàng hơn bạn tưởng.”
              </h2>
              <p className="auth-right-quote">
                Bạn chỉ cần đăng nhập vào và trải nghiệm.  
                Chúng tôi sẽ giúp bạn hết muộn phiền.
              </p>

              <div className="auth-right-user">
                <div className="avatar-circle">M</div>
                <div>
                  <p className="auth-right-name">ViBook</p>
                  <p className="auth-right-role">UI Designer By Huynh Phuc Tho Web</p>
                </div>
              </div>

              <div className="auth-right-footer-card">
                <h3>Truy cập ngay bây giờ để không bỏ lỡ từng khoảnh khắc</h3>
                <p>
                 Thể hiện bản thân bạn, kết nối với cộng đồng và khám phá những điều thú vị mỗi ngày cùng ViBook!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
