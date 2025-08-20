import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { toast } from "react-toastify";
import SignInwithGoogle from "./signInWIthGoogle";
import "../style/login.css";
import { ThemeContext } from "../context/ThemeContext";

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
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <h3 className="text-center mb-4">Login</h3>

        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="d-grid mb-3">
          <button type="submit" className="btn btn-primary">Login</button>
        </div>

        <p className="auth-link text-center mb-3">
          New user? <a href="/register" className="text-primary">Register here</a>
        </p>

        <div className="divider text-center mb-3">
          <span className="bg-light px-2">or</span>
        </div>
        <SignInwithGoogle />
      </form>
  );
}

export default Login;