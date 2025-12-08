// src/components/Register.jsx
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "./firebase";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "../style/auth.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters!", {
        position: "bottom-center",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!", {
        position: "bottom-center",
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "Users", user.uid), {
        email: user.email,
        firstName: fname,
        lastName: lname,
        photo: "",
      });

      toast.success("User Registered Successfully!", {
        position: "top-center",
      });
      navigate("/homevibook", { replace: true });
    } catch (error) {
      console.error("Register error:", error.code, error.message);
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-inner">
          {/* LEFT: REGISTER FORM */}
          <div className="auth-left">
            <div className="auth-logo-pill">
              <span className="dot dot-1" />
              <span className="dot dot-2" />
            </div>

            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">
              Join us and start exploring today.
            </p>

            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-row gap">
                <div className="auth-field">
                  <label>First name</label>
                  <div className="auth-input-wrap">
                    <input
                      type="text"
                      placeholder="First name"
                      onChange={(e) => setFname(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Last name</label>
                  <div className="auth-input-wrap">
                    <input
                      type="text"
                      placeholder="Last name"
                      onChange={(e) => setLname(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrap">
                  <input
                    type="email"
                    placeholder="johndoe@gmail.com"
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
                    placeholder="Min 8 characters"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Confirm password</label>
                <div className="auth-input-wrap">
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-primary-btn">
                Create account
              </button>

              <p className="auth-bottom-text">
                Already have an account?{" "}
                <Link to="/login" className="auth-bottom-link">
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          {/* RIGHT: CARD GIỐNG LOGIN (có thể thay nội dung khác nếu muốn) */}
          <div className="auth-right">
            <div className="auth-right-inner">
              <p className="auth-right-label">Why join us?</p>
              <h2 className="auth-right-title">
                “Be among the first founders to<br />experience the easiest way.”
              </h2>
              <p className="auth-right-quote">
                Create your account now and manage your learning, jobs and
                community from a single place.
              </p>

              <div className="auth-right-user">
                <div className="avatar-circle">H</div>
                <div>
                  <p className="auth-right-name">Happy User</p>
                  <p className="auth-right-role">Early adopter</p>
                </div>
              </div>

              <div className="auth-right-footer-card">
                <h3>Start your journey today</h3>
                <p>
                  Just one account to sign in, apply, learn, and grow with us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
