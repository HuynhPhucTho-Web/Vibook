import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import { toast } from "react-toastify";
import { setDoc, doc } from "firebase/firestore";

function SignInwithGoogle() {
  function googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).then(async (result) => {
      const user = result.user;
      if (user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: user.displayName,
          photo: user.photoURL,
          lastName: "",
        });
        toast.success("Đăng nhập thành công!", { position: "top-center" });
        window.location.href = "/homevibook";
      }
    });
  }

  return (
    <button
      type="button"
      onClick={googleLogin}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/60 border border-white rounded-2xl hover:bg-white transition-all duration-300"
    >
      <img src="/images/Google_Favicon_2025.svg.webp" alt="google" className="w-6 h-6" />
      <span className="font-semibold text-slate-700">Google</span>
    </button>
  );
}
export default SignInwithGoogle;