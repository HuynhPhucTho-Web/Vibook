import React, { useContext } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import { toast } from "react-toastify";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { clearLoginRedirect, getLoginRedirect } from "../utils/requireLogin";
import { ThemeContext } from "../context/ThemeContext";

function SignInwithGoogle() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getLoginRedirect(location.state?.from);
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext ? themeContext.theme === "dark" : true;

  function googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then(async (result) => {
      const user = result.user;
      if (user) {
        const userRef = doc(db, "Users", user.uid);
        const snap = await getDoc(userRef);
        const hasPassword = snap.exists() ? snap.data().hasPassword : false;

        await setDoc(userRef, {
          email: user.email,
          firstName: user.displayName,
          photo: user.photoURL,
          lastName: "",
        }, { merge: true });

        toast.success("Đăng nhập thành công!");
        clearLoginRedirect();

        if (!hasPassword) {
          navigate("/settings", {
            state: { activeSection: "security", forceSetPassword: true },
            replace: true,
          });
        } else {
          navigate(redirectTo, { replace: true });
        }
      }
    }).catch((error) => {
      toast.error(error.message || "Google sign-in failed");
    });
  }

  return (
    <button
      type="button"
      onClick={googleLogin}
      className={`w-full flex items-center justify-center gap-2.5 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-xs backdrop-blur-md cursor-pointer border ${
        isDark
          ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
          : "bg-white/90 hover:bg-white border-slate-200/90 text-slate-700 shadow-slate-200/40 hover:shadow-slate-300/60"
      }`}
    >
      <img src="/images/Google_Favicon_2025.svg.webp" alt="Đăng nhập bằng Google" className="w-5 h-5" />
      <span className={`font-semibold ${isDark ? "text-slate-100" : "text-slate-700"}`}>Google</span>
    </button>
  );
}
export default SignInwithGoogle;
