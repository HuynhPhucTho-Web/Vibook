import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import { toast } from "react-toastify";
import { confirmDialog } from "../utils/confirmDialog";
import { auth, db } from "../components/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LanguageContext } from "../context/LanguageContext";
import { ThemeContext } from "../context/ThemeContext";
import { requireLogin } from "../utils/requireLogin";
import "../style/Setting.css";
import SEO from "../components/SEO";
import PageHeaderBanner from "../components/PageHeaderBanner";
import { FaUserCog } from "react-icons/fa";

const NOTIFICATION_DEFAULTS = {
  reactions: true,
  comments: true,
  friendRequests: true,
  messages: true,
};

const BACKGROUND_OPTIONS = [
  { id: "default", name: "Mặc định", subtitle: "Obsidian", colorClass: "bg-[#0c0d14]" },
  { id: "sky", name: "Xanh trời", subtitle: "Sky Blue", colorClass: "bg-secondary-container" },
  { id: "lavender", name: "Oải hương", subtitle: "Lavender", colorClass: "bg-primary-container" },
  { id: "mint", name: "Bạc hà", subtitle: "Mint", colorClass: "bg-surface-bright" },
  { id: "warm", name: "Ấm áp", subtitle: "Amber Glow", colorClass: "bg-tertiary-container" },
];

const Setting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useContext(LanguageContext);
  const { theme, setTheme, background, setBackground } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [authReady, setAuthReady] = useState(Boolean(auth.currentUser));
  const [dbUser, setDbUser] = useState(null);

  // Active section for scroll spy
  const [activeNavSection, setActiveNavSection] = useState("appearance");

  // Setting States
  const [notifications, setNotifications] = useState(() => {
    try {
      return { ...NOTIFICATION_DEFAULTS, ...JSON.parse(localStorage.getItem("vibook_notification_preferences") || "{}") };
    } catch {
      return NOTIFICATION_DEFAULTS;
    }
  });

  const [defaultPrivacy, setDefaultPrivacy] = useState(
    () => localStorage.getItem("vibook_default_privacy") || "friends",
  );

  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("vibook_font_size") || "normal",
  );

  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem("vibook_reduced_motion") === "true",
  );

  const [compactMode, setCompactMode] = useState(
    () => localStorage.getItem("vibook_compact_mode") === "true",
  );

  const [showChatbot, setShowChatbot] = useState(
    () => localStorage.getItem("vibook_show_chatbot") !== "false",
  );

  // Password States
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // Toast HUD simulation state
  const [toastMsg, setToastMsg] = useState("");
  const [toastActive, setToastActive] = useState(false);
  const toastTimeoutRef = useRef(null);

  const showCockpitToast = (message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg(message);
    setToastActive(true);
    toastTimeoutRef.current = setTimeout(() => {
      setToastActive(false);
    }, 2800);
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isGuest = authReady && !currentUser;

  const passwordProvider = currentUser?.providerData?.some(
    (p) => p.providerId === "password"
  );
  const hasPassword = passwordProvider || dbUser?.hasPassword;

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, "Users", currentUser.uid);
    getDoc(userRef).then((snap) => {
      if (snap.exists()) {
        setDbUser(snap.data());
      }
    });
  }, [currentUser]);

  // Persist Font, Motion, Compact Mode
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = fontSize;
    root.dataset.reducedMotion = String(reducedMotion);
    root.dataset.compact = String(compactMode);
    localStorage.setItem("vibook_font_size", fontSize);
    localStorage.setItem("vibook_reduced_motion", String(reducedMotion));
    localStorage.setItem("vibook_compact_mode", String(compactMode));
  }, [compactMode, fontSize, reducedMotion]);

  // Persist Chatbot
  useEffect(() => {
    localStorage.setItem("vibook_show_chatbot", String(showChatbot));
    window.dispatchEvent(
      new CustomEvent("vibook_chatbot_visibility_change", { detail: showChatbot }),
    );
  }, [showChatbot]);

  useEffect(() => {
    const handleChatbotVisibility = (e) => {
      if (e.detail !== undefined) {
        setShowChatbot(Boolean(e.detail));
      } else {
        setShowChatbot(localStorage.getItem("vibook_show_chatbot") !== "false");
      }
    };
    window.addEventListener("vibook_chatbot_visibility_change", handleChatbotVisibility);
    window.addEventListener("storage", handleChatbotVisibility);
    return () => {
      window.removeEventListener("vibook_chatbot_visibility_change", handleChatbotVisibility);
      window.removeEventListener("storage", handleChatbotVisibility);
    };
  }, []);

  // Smooth Scroll Spy via Intersection Observer
  useEffect(() => {
    const sectionIds = ["appearance", "accessibility", "privacy", "notifications", "account"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "");
            setActiveNavSection(id);
          }
        });
      },
      {
        rootMargin: "-15% 0px -65% 0px",
        threshold: 0,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(`section-${id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setActiveNavSection(sectionId);
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const promptLogin = () => {
    requireLogin({
      navigate,
      title: "Đăng nhập ThoDev",
      message: "Vui lòng đăng nhập để cấu hình tài khoản và quyền riêng tư cá nhân.",
      from: "/settings",
      loginLabel: "Đăng nhập",
    });
  };

  const handleLanguageChange = (code) => {
    setLanguage(code);
    if (auth.currentUser) auth.languageCode = code;
    showCockpitToast("Đã chuyển ngôn ngữ hiển thị thành công!");
  };

  const handleTintChange = (id) => {
    setBackground(id);
    showCockpitToast("Đã chuyển màu nền & ánh sắc giao diện!");
  };

  const handleThemeModeChange = (mode) => {
    setTheme(mode);
    showCockpitToast(`Đã chuyển sang chế độ ${mode === "dark" ? "Tối (Dark Obsidian)" : "Sáng (Light Mode)"}!`);
  };

  const handlePrivacyChange = (mode) => {
    if (!currentUser) {
      promptLogin();
      return;
    }
    setDefaultPrivacy(mode);
    localStorage.setItem("vibook_default_privacy", mode);
    showCockpitToast("Đã cập nhật đối tượng mặc định cho bài viết!");
  };

  const handleToggleNotification = (key) => {
    if (!currentUser) {
      promptLogin();
      return;
    }
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("vibook_notification_preferences", JSON.stringify(updated));
      return updated;
    });
    showCockpitToast("Đã cập nhật tùy chọn thông báo!");
  };

  // Reset to default
  const handleResetDefaults = () => {
    setTheme("dark");
    setBackground("default");
    setLanguage("vi");
    setFontSize("normal");
    setReducedMotion(false);
    setCompactMode(false);
    setShowChatbot(true);
    setDefaultPrivacy("friends");
    setNotifications(NOTIFICATION_DEFAULTS);

    localStorage.setItem("theme", "dark");
    localStorage.setItem("app_background", "default");
    localStorage.setItem("vibook_font_size", "normal");
    localStorage.setItem("vibook_reduced_motion", "false");
    localStorage.setItem("vibook_compact_mode", "false");
    localStorage.setItem("vibook_show_chatbot", "true");
    localStorage.setItem("vibook_default_privacy", "friends");
    localStorage.setItem("vibook_notification_preferences", JSON.stringify(NOTIFICATION_DEFAULTS));

    showCockpitToast("Đã khôi phục cài đặt gốc mặc định!");
    toast.success("Đã khôi phục cài đặt gốc mặc định!");
  };

  // Export Settings Backup
  const handleExportBackup = () => {
    const backupData = {
      app: "ThoDev Ecosystem",
      version: "2.4.9",
      exportedAt: new Date().toISOString(),
      user: {
        uid: currentUser?.uid || "guest",
        displayName: currentUser?.displayName || dbUser?.name || "ThoDev User",
        email: currentUser?.email || "anonymous@thodev.online",
      },
      preferences: {
        theme,
        background,
        language,
        fontSize,
        reducedMotion,
        compactMode,
        showChatbot,
        defaultPrivacy,
        notifications,
      },
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thodev-settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a);
    showCockpitToast("Đã tải tệp sao lưu thiết lập hệ thống!");
  };

  // Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      promptLogin();
      return;
    }
    if (passwordForm.next.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error("Mật khẩu mới không trùng khớp.");
      return;
    }

    setChangingPassword(true);
    try {
      if (hasPassword) {
        if (!currentUser.email) {
          toast.error("Tài khoản này không hỗ trợ mật khẩu email.");
          return;
        }
        const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.current);
        await reauthenticateWithCredential(currentUser, credential);
      }

      try {
        await updatePassword(currentUser, passwordForm.next);
      } catch (err) {
        if (err.code === "auth/requires-recent-login") {
          if (!hasPassword) {
            const provider = new GoogleAuthProvider();
            toast.info("Xác thực bảo mật: Vui lòng xác nhận tài khoản Google...");
            await reauthenticateWithPopup(currentUser, provider);
            await updatePassword(currentUser, passwordForm.next);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      await setDoc(doc(db, "Users", currentUser.uid), { hasPassword: true }, { merge: true });
      setDbUser((prev) => ({ ...prev, hasPassword: true }));
      setPasswordForm({ current: "", next: "", confirm: "" });
      showCockpitToast("Mật khẩu mới đã được cập nhật an toàn!");
      toast.success(hasPassword ? "Đã cập nhật mật khẩu thành công!" : "Thiết lập mật khẩu thành công!");
    } catch (error) {
      console.error("Unable to update password", error);
      toast.error(
        error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
          ? "Mật khẩu hiện tại không đúng."
          : "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!currentUser) return;
    const ok = await confirmDialog("Bạn có chắc chắn muốn đăng xuất trên thiết bị này không?", {
      title: "Đăng xuất tài khoản",
      confirmText: "Đăng xuất",
      type: "warning",
    });
    if (!ok) return;
    await auth.signOut();
    navigate("/homevibook", { replace: true });
  };

  const userAvatarUrl =
    currentUser?.photoURL ||
    dbUser?.avatar ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA1u2ylPniW82TbfVr6S2dIQiz2twxjHfQvrWupHOIqzFoVjP5KhrgZJVLp6a7Thk5mrcq3wOUHlobyK3db4fmGayt2oZ0xwu-mmFvvz4CrsDw7QBsU1kHYCHd63ZGXW6lGs3C4F38vXsr0CpyQ1L2VdUeNbHAmasA47K7rUrf9BeoQ69AfwPQqpMORLm2QVgXjTQ3MPLu2aUCd0A2MMc-oLx1vzLHMesl3PA-oWSg";

  const userDisplayName =
    currentUser?.displayName || dbUser?.name || "Anh Thợ Code";

  const userEmail =
    currentUser?.email || "thohpce181027@fpt.edu.vn";

  const userRole =
    dbUser?.role || "Pro Dev";

  const userSchool =
    dbUser?.university || dbUser?.school || "Đã xác minh FPT Edu";

  return (
    <div className={`cockpit-page w-full min-h-screen text-on-surface font-body-md transition-colors duration-300 ${theme === "light" ? "setting-cockpit--light" : ""}`}>
      <SEO
        title="Cài đặt hệ thống ThoDev | Digital Cockpit"
        description="Cá nhân hóa ThoDev, tùy chỉnh giao diện, quyền riêng tư, khả năng tiếp cận và bảo mật tài khoản tại buồng lái kỹ thuật số."
        slug="/settings"
        noindex={true}
      />

      <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-4">
        {/* Standardized Page Header Banner */}
        <PageHeaderBanner
          icon={FaUserCog}
          title={t("settingTitle") || "Cài đặt hệ thống"}
          subtitle="SETTINGS HUB"
          badge="v2.4.9"
        >
          <button
            type="button"
            className="vb-btn vb-btn--ghost !min-h-[34px] !py-1.5 !text-xs sm:!text-sm flex items-center gap-1.5 cursor-pointer"
            id="resetBtn"
            onClick={handleResetDefaults}
            title="Khôi phục mặc định"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            <span className="hidden sm:inline">Khôi phục mặc định</span>
            <span className="sm:hidden">Mặc định</span>
          </button>
        </PageHeaderBanner>

        {/* Main Content Layout with Internal Nav & Panes */}
        <div className="w-full pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Internal Anchor Navigation Pill Bar (Sticky Sidebar) */}
          <nav className="lg:col-span-3 space-y-4 lg:sticky lg:top-24 h-fit cockpit-sidebar-nav">
            <div className="bg-surface-container/60 backdrop-blur-xl p-3 rounded-2xl shadow-xl space-y-1 border border-glass-border">
              <p className="px-4 py-2 font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Danh mục cài đặt
              </p>
              <a
                className={`settings-nav-item flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 no-underline cursor-pointer ${
                  activeNavSection === "appearance"
                    ? "text-primary bg-primary/15 shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                href="#section-appearance"
                onClick={(e) => scrollToSection(e, "appearance")}
              >
                <span className="material-symbols-outlined text-xl">palette</span>
                <span className="font-body-md text-sm">Giao diện &amp; ngôn ngữ</span>
              </a>
              <a
                className={`settings-nav-item flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 no-underline cursor-pointer ${
                  activeNavSection === "accessibility"
                    ? "text-primary bg-primary/15 shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                href="#section-accessibility"
                onClick={(e) => scrollToSection(e, "accessibility")}
              >
                <span className="material-symbols-outlined text-xl">accessibility_new</span>
                <span className="font-body-md text-sm">Khả năng tiếp cận</span>
              </a>
              <a
                className={`settings-nav-item flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 no-underline cursor-pointer ${
                  activeNavSection === "privacy"
                    ? "text-primary bg-primary/15 shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                href="#section-privacy"
                onClick={(e) => scrollToSection(e, "privacy")}
              >
                <span className="material-symbols-outlined text-xl">shield_lock</span>
                <span className="font-body-md text-sm">Quyền riêng tư</span>
              </a>
              <a
                className={`settings-nav-item flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 no-underline cursor-pointer ${
                  activeNavSection === "notifications"
                    ? "text-primary bg-primary/15 shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                href="#section-notifications"
                onClick={(e) => scrollToSection(e, "notifications")}
              >
                <span className="material-symbols-outlined text-xl">notifications_active</span>
                <span className="font-body-md text-sm">Thông báo</span>
              </a>
              <a
                className={`settings-nav-item flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 no-underline cursor-pointer ${
                  activeNavSection === "account"
                    ? "text-primary bg-primary/15 shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                href="#section-account"
                onClick={(e) => scrollToSection(e, "account")}
              >
                <span className="material-symbols-outlined text-xl">badge</span>
                <span className="font-body-md text-sm">Tài khoản &amp; bảo mật</span>
              </a>
            </div>

            {/* Quick Telemetry HUD */}
            <div className="bg-surface-container-low/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg space-y-3 border border-glass-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline">Đồng bộ Cloud</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-sm text-[10px] bg-electric-blue/20 text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse"></span> Đồng bộ
                </span>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant">
                Lần sửa gần nhất: Vừa xong từ ThoDev Web Cockpit.
              </p>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-electric-blue h-full w-[84%] transition-all duration-500"></div>
              </div>
            </div>
          </nav>

          {/* Settings Sections Stream */}
          <div className="lg:col-span-9 space-y-12">
            {/* SECTION 1: GIAO DIỆN & NGÔN NGỮ */}
            <section className="scroll-mt-28 space-y-6" id="section-appearance">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-6 rounded-full bg-primary-container"></span>
                    <h2 className="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface m-0">
                      Giao diện &amp; ngôn ngữ
                    </h2>
                  </div>
                  <p className="font-body-md text-sm sm:text-body-md text-on-surface-variant ml-5 mt-1">
                    Chọn cách ThoDev hiển thị và ngôn ngữ bạn muốn sử dụng.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shrink-0">
                  #01 THEME
                </span>
              </div>

              {/* Mode Selector */}
              <div className="bg-surface-container/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4 border border-glass-border">
                <h3 className="font-headline-lg text-sm font-semibold text-on-surface uppercase tracking-wider m-0">
                  Chế độ hiển thị (Theme Mode)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Light Card */}
                  <label
                    className="cursor-pointer group block"
                    onClick={() => handleThemeModeChange("light")}
                  >
                    <input
                      className="peer sr-only"
                      name="theme_mode"
                      type="radio"
                      value="light"
                      checked={theme === "light"}
                      readOnly
                    />
                    <div
                      className={`p-5 rounded-xl transition-all duration-200 relative overflow-hidden border ${
                        theme === "light"
                          ? "bg-primary/15 border-primary shadow-lg ring-1 ring-primary"
                          : "bg-surface-container-low/70 hover:bg-surface-container-high/60 border-glass-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-2xl ${
                              theme === "light" ? "text-primary cockpit-fill-icon" : "text-outline group-hover:text-on-surface"
                            }`}
                          >
                            light_mode
                          </span>
                          <div>
                            <p className="font-headline-lg text-base font-bold text-on-surface m-0">
                              Sáng (Light Mode)
                            </p>
                            <p className="font-body-md text-xs text-outline m-0">
                              Độ tương phản cao cho môi trường nhiều ánh sáng
                            </p>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            theme === "light"
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-surface-container-highest"
                          }`}
                        >
                          {theme === "light" && <span className="material-symbols-outlined text-xs">done</span>}
                        </span>
                      </div>
                      <div className="h-16 rounded-lg bg-surface-bright/50 p-2 flex gap-2">
                        <div className="w-1/3 h-full rounded bg-surface-container-highest/60"></div>
                        <div className="w-2/3 h-full rounded bg-surface-variant/40 flex flex-col gap-1.5 p-2">
                          <div className="w-3/4 h-2 bg-outline/40 rounded"></div>
                          <div className="w-1/2 h-2 bg-outline/20 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Dark Card */}
                  <label
                    className="cursor-pointer group block"
                    onClick={() => handleThemeModeChange("dark")}
                  >
                    <input
                      className="peer sr-only"
                      name="theme_mode"
                      type="radio"
                      value="dark"
                      checked={theme === "dark"}
                      readOnly
                    />
                    <div
                      className={`p-5 rounded-xl transition-all duration-200 relative overflow-hidden border ${
                        theme === "dark"
                          ? "bg-primary-container/20 border-primary shadow-lg ring-1 ring-primary"
                          : "bg-surface-container-low/70 hover:bg-surface-container-high/60 border-glass-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-2xl ${
                              theme === "dark" ? "text-primary cockpit-fill-icon" : "text-outline group-hover:text-on-surface"
                            }`}
                          >
                            dark_mode
                          </span>
                          <div>
                            <p className="font-headline-lg text-base font-bold text-on-surface m-0">
                              Tối (Dark Obsidian - Active)
                            </p>
                            <p className="font-body-md text-xs text-primary-fixed-dim m-0">
                              Giao diện buồng lái kỹ thuật số bảo vệ mắt
                            </p>
                          </div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            theme === "dark"
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-surface-container-highest"
                          }`}
                        >
                          {theme === "dark" && <span className="material-symbols-outlined text-xs">done</span>}
                        </span>
                      </div>
                      <div className="h-16 rounded-lg bg-surface-container-lowest/80 p-2 flex gap-2">
                        <div className="w-1/3 h-full rounded bg-surface-container-low/90"></div>
                        <div className="w-2/3 h-full rounded bg-surface-container/90 flex flex-col gap-1.5 p-2">
                          <div className="w-3/4 h-2 bg-primary/70 rounded"></div>
                          <div className="w-1/2 h-2 bg-electric-blue/50 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Background Tint Accent */}
              <div className="bg-surface-container/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4 border border-glass-border">
                <div>
                  <h3 className="font-headline-lg text-sm font-semibold text-on-surface uppercase tracking-wider m-0">
                    Màu nền &amp; Ánh sắc (Background Tint/Accent)
                  </h3>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    Màu này được áp dụng cho toàn bộ không gian ThoDev và hệ thống kính mờ.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" id="tintContainer">
                  {BACKGROUND_OPTIONS.map((opt) => {
                    const isSelected = background === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleTintChange(opt.id)}
                        className={`tint-option p-3.5 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                          isSelected
                            ? "bg-surface-container-high/90 ring-2 ring-primary border-primary shadow-md"
                            : "bg-surface-container-low/60 hover:bg-surface-container-high/50 border-glass-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-6 h-6 rounded-lg ${opt.colorClass} shadow-inner border border-white/10`}></div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-sm text-primary cockpit-fill-icon">
                              check_circle
                            </span>
                          )}
                        </div>
                        <p className="font-headline-lg text-sm font-bold text-on-surface m-0">{opt.name}</p>
                        <p className="font-label-sm text-[11px] text-outline m-0">{opt.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Pill Cards */}
              <div className="bg-surface-container/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4 border border-glass-border">
                <h3 className="font-headline-lg text-sm font-semibold text-on-surface uppercase tracking-wider m-0">
                  Ngôn ngữ hiển thị (Display Language)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="langSelector">
                  {/* Tiếng Việt */}
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("vi")}
                    className={`lang-btn flex items-center justify-between p-4 rounded-xl font-semibold transition-all duration-200 border cursor-pointer ${
                      language === "vi"
                        ? "bg-primary/15 border-primary text-on-surface shadow-md"
                        : "bg-surface-container-low/60 hover:bg-surface-container-high border-glass-border text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇻🇳</span>
                      <div className="text-left">
                        <p className="font-headline-lg text-sm font-bold text-on-surface m-0">Tiếng Việt</p>
                        <p className="font-label-sm text-xs text-primary m-0">Mặc định hệ thống</p>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-xl ${
                        language === "vi" ? "text-primary" : "text-outline"
                      }`}
                    >
                      {language === "vi" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </button>

                  {/* English */}
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    className={`lang-btn flex items-center justify-between p-4 rounded-xl font-semibold transition-all duration-200 border cursor-pointer ${
                      language === "en"
                        ? "bg-primary/15 border-primary text-on-surface shadow-md"
                        : "bg-surface-container-low/60 hover:bg-surface-container-high border-glass-border text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇺🇸</span>
                      <div className="text-left">
                        <p className="font-headline-lg text-sm font-bold text-on-surface m-0">English</p>
                        <p className="font-label-sm text-xs text-outline m-0">United States</p>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-xl ${
                        language === "en" ? "text-primary" : "text-outline"
                      }`}
                    >
                      {language === "en" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </button>

                  {/* 日本語 */}
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("ja")}
                    className={`lang-btn flex items-center justify-between p-4 rounded-xl font-semibold transition-all duration-200 border cursor-pointer ${
                      language === "ja"
                        ? "bg-primary/15 border-primary text-on-surface shadow-md"
                        : "bg-surface-container-low/60 hover:bg-surface-container-high border-glass-border text-on-surface"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇯🇵</span>
                      <div className="text-left">
                        <p className="font-headline-lg text-sm font-bold text-on-surface m-0">日本語</p>
                        <p className="font-label-sm text-xs text-outline m-0">Japanese</p>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-xl ${
                        language === "ja" ? "text-primary" : "text-outline"
                      }`}
                    >
                      {language === "ja" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 2: KHẢ NĂNG TIẾP CẬN */}
            <section className="scroll-mt-28 space-y-6" id="section-accessibility">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-6 rounded-full bg-electric-blue"></span>
                    <h2 className="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface m-0">
                      Khả năng tiếp cận
                    </h2>
                  </div>
                  <p className="font-body-md text-sm sm:text-body-md text-on-surface-variant ml-5 mt-1">
                    Điều chỉnh ThoDev để sử dụng thoải mái hơn.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-electric-blue/10 px-3 py-1 rounded-full border border-electric-blue/20 shrink-0">
                  #02 A11Y
                </span>
              </div>

              <div className="bg-surface-container/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6 border border-glass-border">
                {/* Font Size Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-lg text-sm font-semibold text-on-surface uppercase tracking-wider m-0">
                      Cỡ chữ (Font Size)
                    </h3>
                    <span className="font-label-sm text-xs text-secondary">
                      Đang áp dụng: {fontSize === "small" ? "Nhỏ (14px)" : fontSize === "large" ? "Lớn (18px)" : "Tiêu chuẩn (16px)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFontSize("small");
                        showCockpitToast("Đã chọn cỡ chữ Nhỏ!");
                      }}
                      className={`p-4 rounded-xl text-center transition-all duration-200 border cursor-pointer ${
                        fontSize === "small"
                          ? "bg-primary-container/20 border-primary shadow-lg ring-1 ring-primary"
                          : "bg-surface-container-low/60 hover:bg-surface-container-high border-glass-border text-on-surface"
                      }`}
                    >
                      <span className="font-headline-lg text-xs font-semibold text-on-surface block mb-1">A</span>
                      <span className={`font-body-md text-sm ${fontSize === "small" ? "text-primary font-bold" : "text-on-surface-variant font-medium"}`}>
                        Nhỏ
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFontSize("normal");
                        showCockpitToast("Đã chọn cỡ chữ Tiêu chuẩn!");
                      }}
                      className={`p-4 rounded-xl text-center transition-all duration-200 border cursor-pointer ${
                        fontSize === "normal"
                          ? "bg-primary-container/20 border-primary shadow-lg ring-1 ring-primary"
                          : "bg-surface-container-low/60 hover:bg-surface-container-high border-glass-border text-on-surface"
                      }`}
                    >
                      <span className="font-headline-lg text-base font-bold text-primary block mb-1">A</span>
                      <span className={`font-body-md text-sm ${fontSize === "normal" ? "text-primary font-bold" : "text-on-surface-variant font-medium"}`}>
                        Tiêu chuẩn
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFontSize("large");
                        showCockpitToast("Đã chọn cỡ chữ Lớn!");
                      }}
                      className={`p-4 rounded-xl text-center transition-all duration-200 border cursor-pointer ${
                        fontSize === "large"
                          ? "bg-primary-container/20 border-primary shadow-lg ring-1 ring-primary"
                          : "bg-surface-container-low/60 hover:bg-surface-container-high border-glass-border text-on-surface"
                      }`}
                    >
                      <span className="font-headline-lg text-xl font-bold text-on-surface block mb-1">A</span>
                      <span className={`font-body-md text-sm ${fontSize === "large" ? "text-primary font-bold" : "text-on-surface-variant font-medium"}`}>
                        Lớn
                      </span>
                    </button>
                  </div>
                  {/* Typography Preview Box */}
                  <div className="p-4 rounded-xl bg-surface-container-lowest/80 text-on-surface-variant space-y-1 border border-glass-border">
                    <p className="font-label-sm text-xs text-outline m-0">Bản xem trước kiểu chữ ThoDev:</p>
                    <p
                      className="font-body-md text-on-surface font-normal leading-relaxed m-0"
                      style={{
                        fontSize: fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px",
                      }}
                    >
                      "ThoDev kết nối trải nghiệm đọc mã nguồn và tri thức tương tác với độ trễ phản hồi cực thấp."
                    </p>
                  </div>
                </div>

                {/* Glassmorphic Switch Toggles */}
                <div className="space-y-4 pt-4 border-t border-glass-border">
                  {/* Toggle 1: Astro AI */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-container-low/80 hover:bg-surface-container-high/60 transition-all duration-200 border border-glass-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-container to-electric-blue flex items-center justify-center shadow-lg relative shrink-0">
                        <span className="material-symbols-outlined text-white text-2xl cockpit-fill-icon">
                          smart_toy
                        </span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-tertiary shadow-sm animate-pulse"></span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-headline-lg text-base font-bold text-on-surface m-0">
                            Trợ lý Astro AI
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-label-sm bg-primary/20 text-primary border border-primary/30">
                            Linh vật tương tác
                          </span>
                        </div>
                        <p className="font-body-md text-xs text-on-surface-variant m-0">
                          Hiển thị nút linh vật trợ lý ảo ở góc màn hình để hỗ trợ giải thích nội dung và tài liệu.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showChatbot}
                      className={`cockpit-switch mt-1 ${showChatbot ? "is-checked" : ""}`}
                      onClick={() => {
                        setShowChatbot((prev) => !prev);
                        showCockpitToast(!showChatbot ? "Đã bật trợ lý Astro AI!" : "Đã ẩn trợ lý Astro AI!");
                      }}
                    />
                  </div>

                  {/* Toggle 2: Giảm chuyển động */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-container-low/80 hover:bg-surface-container-high/60 transition-all duration-200 border border-glass-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-outline text-2xl">
                          motion_photos_off
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-headline-lg text-base font-bold text-on-surface m-0">
                          Giảm chuyển động
                        </h4>
                        <p className="font-body-md text-xs text-on-surface-variant m-0">
                          Hạn chế hiệu ứng chuyển động và hoạt ảnh trong ứng dụng để giảm mỏi mắt.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reducedMotion}
                      className={`cockpit-switch mt-1 ${reducedMotion ? "is-checked" : ""}`}
                      onClick={() => {
                        setReducedMotion((prev) => !prev);
                        showCockpitToast(!reducedMotion ? "Đã bật chế độ giảm chuyển động!" : "Đã tắt chế độ giảm chuyển động!");
                      }}
                    />
                  </div>

                  {/* Toggle 3: Bố cục gọn */}
                  <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-container-low/80 hover:bg-surface-container-high/60 transition-all duration-200 border border-glass-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-outline text-2xl">
                          density_medium
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-headline-lg text-base font-bold text-on-surface m-0">
                          Bố cục gọn
                        </h4>
                        <p className="font-body-md text-xs text-on-surface-variant m-0">
                          Giảm khoảng cách padding và margins để hiển thị nhiều thông tin hơn trên một khung hình.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={compactMode}
                      className={`cockpit-switch mt-1 ${compactMode ? "is-checked" : ""}`}
                      onClick={() => {
                        setCompactMode((prev) => !prev);
                        showCockpitToast(!compactMode ? "Đã bật chế độ bố cục gọn!" : "Đã tắt chế độ bố cục gọn!");
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: QUYỀN RIÊNG TƯ */}
            <section className="scroll-mt-28 space-y-6" id="section-privacy">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-6 rounded-full bg-tertiary"></span>
                    <h2 className="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface m-0">
                      Quyền riêng tư
                    </h2>
                  </div>
                  <p className="font-body-md text-sm sm:text-body-md text-on-surface-variant ml-5 mt-1">
                    Kiểm soát đối tượng mặc định cho bài viết mới.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary bg-tertiary-container/30 px-3 py-1 rounded-full border border-tertiary/30 shrink-0">
                  #03 PRIVACY
                </span>
              </div>

              <div className="bg-surface-container/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-5 border border-glass-border">
                <div>
                  <h3 className="font-headline-lg text-sm font-semibold text-on-surface uppercase tracking-wider m-0">
                    Đối tượng mặc định của bài viết
                  </h3>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    Bài viết mới sẽ dùng lựa chọn này. Bạn vẫn có thể đổi riêng từng bài trước khi xuất bản.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="privacyOptions">
                  {/* Public */}
                  <button
                    type="button"
                    onClick={() => handlePrivacyChange("public")}
                    className={`privacy-card p-5 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                      defaultPrivacy === "public"
                        ? "bg-primary-container/20 border-primary shadow-lg ring-1 ring-primary"
                        : "bg-surface-container-low/70 hover:bg-surface-container-high/60 border-glass-border text-on-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-2xl">public</span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-xl ${
                          defaultPrivacy === "public" ? "text-primary" : "text-outline"
                        }`}
                      >
                        {defaultPrivacy === "public" ? "radio_button_checked" : "radio_button_unchecked"}
                      </span>
                    </div>
                    <p className="font-headline-lg text-base font-bold text-on-surface mb-1 m-0">Công khai</p>
                    <p className="font-body-md text-xs text-on-surface-variant m-0">
                      Mọi người trong hoặc ngoài ThoDev đều có thể xem.
                    </p>
                  </button>

                  {/* Friends Only */}
                  <button
                    type="button"
                    onClick={() => handlePrivacyChange("friends")}
                    className={`privacy-card p-5 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                      defaultPrivacy === "friends"
                        ? "bg-primary-container/20 border-primary shadow-lg ring-1 ring-primary"
                        : "bg-surface-container-low/70 hover:bg-surface-container-high/60 border-glass-border text-on-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">group</span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-xl ${
                          defaultPrivacy === "friends" ? "text-primary" : "text-outline"
                        }`}
                      >
                        {defaultPrivacy === "friends" ? "radio_button_checked" : "radio_button_unchecked"}
                      </span>
                    </div>
                    <p className="font-headline-lg text-base font-bold text-on-surface mb-1 m-0">Bạn bè</p>
                    <p className="font-body-md text-xs text-primary-fixed-dim m-0">
                      Chỉ bạn bè trên ThoDev có thể xem (Khuyên dùng).
                    </p>
                  </button>

                  {/* Only Me */}
                  <button
                    type="button"
                    onClick={() => handlePrivacyChange("private")}
                    className={`privacy-card p-5 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                      defaultPrivacy === "private"
                        ? "bg-primary-container/20 border-primary shadow-lg ring-1 ring-primary"
                        : "bg-surface-container-low/70 hover:bg-surface-container-high/60 border-glass-border text-on-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline text-2xl">lock</span>
                      </div>
                      <span
                        className={`material-symbols-outlined text-xl ${
                          defaultPrivacy === "private" ? "text-primary" : "text-outline"
                        }`}
                      >
                        {defaultPrivacy === "private" ? "radio_button_checked" : "radio_button_unchecked"}
                      </span>
                    </div>
                    <p className="font-headline-lg text-base font-bold text-on-surface mb-1 m-0">Chỉ mình tôi</p>
                    <p className="font-body-md text-xs text-on-surface-variant m-0">
                      Chỉ mình bạn có thể xem các ghi chú &amp; bài viết.
                    </p>
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 4: THÔNG BÁO */}
            <section className="scroll-mt-28 space-y-6" id="section-notifications">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-6 rounded-full bg-primary-fixed-dim"></span>
                    <h2 className="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface m-0">
                      Thông báo
                    </h2>
                  </div>
                  <p className="font-body-md text-sm sm:text-body-md text-on-surface-variant ml-5 mt-1">
                    Chọn những cập nhật xã hội bạn muốn nhận.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shrink-0">
                  #04 NOTIFS
                </span>
              </div>

              <div className="bg-surface-container/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4 border border-glass-border">
                {/* Notification 1: Cảm xúc */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/80 hover:bg-surface-container-high/50 transition-all duration-200 border border-glass-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl cockpit-fill-icon">favorite</span>
                    </div>
                    <div>
                      <h4 className="font-headline-lg text-sm font-bold text-on-surface m-0">Cảm xúc</h4>
                      <p className="font-body-md text-xs text-on-surface-variant m-0">
                        Khi ai đó bày tỏ cảm xúc với bài viết hoặc trích đoạn của bạn.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications.reactions}
                    className={`cockpit-switch ${notifications.reactions ? "is-checked" : ""}`}
                    onClick={() => handleToggleNotification("reactions")}
                  />
                </div>

                {/* Notification 2: Bình luận */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/80 hover:bg-surface-container-high/50 transition-all duration-200 border border-glass-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-electric-blue/15 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">forum</span>
                    </div>
                    <div>
                      <h4 className="font-headline-lg text-sm font-bold text-on-surface m-0">Bình luận</h4>
                      <p className="font-body-md text-xs text-on-surface-variant m-0">
                        Khi ai đó bình luận bài viết của bạn hoặc phản hồi trong luồng.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications.comments}
                    className={`cockpit-switch ${notifications.comments ? "is-checked" : ""}`}
                    onClick={() => handleToggleNotification("comments")}
                  />
                </div>

                {/* Notification 3: Lời mời kết bạn */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/80 hover:bg-surface-container-high/50 transition-all duration-200 border border-glass-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 text-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">person_add</span>
                    </div>
                    <div>
                      <h4 className="font-headline-lg text-sm font-bold text-on-surface m-0">Lời mời kết bạn</h4>
                      <p className="font-body-md text-xs text-on-surface-variant m-0">
                        Lời mời mới và xác nhận kết bạn từ cộng đồng lập trình viên.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications.friendRequests}
                    className={`cockpit-switch ${notifications.friendRequests ? "is-checked" : ""}`}
                    onClick={() => handleToggleNotification("friendRequests")}
                  />
                </div>

                {/* Notification 4: Tin nhắn */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/80 hover:bg-surface-container-high/50 transition-all duration-200 border border-glass-border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">chat</span>
                    </div>
                    <div>
                      <h4 className="font-headline-lg text-sm font-bold text-on-surface m-0">Tin nhắn</h4>
                      <p className="font-body-md text-xs text-on-surface-variant m-0">
                        Tin nhắn mới và cập nhật cuộc trò chuyện trực tiếp từ đồng nghiệp.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications.messages}
                    className={`cockpit-switch ${notifications.messages ? "is-checked" : ""}`}
                    onClick={() => handleToggleNotification("messages")}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 5: TÀI KHOẢN & BẢO MẬT */}
            <section className="scroll-mt-28 space-y-6" id="section-account">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-6 rounded-full bg-error"></span>
                    <h2 className="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface m-0">
                      Tài khoản &amp; bảo mật
                    </h2>
                  </div>
                  <p className="font-body-md text-sm sm:text-body-md text-on-surface-variant ml-5 mt-1">
                    Bảo vệ tài khoản và quản lý việc đăng nhập.
                  </p>
                </div>
                <span className="font-label-sm text-label-sm text-error bg-error-container/40 px-3 py-1 rounded-full border border-error/30 shrink-0">
                  #05 SECURITY
                </span>
              </div>

              {isGuest ? (
                /* Guest Locked Card */
                <div className="bg-surface-container/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl text-center space-y-4 border border-glass-border">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-container to-electric-blue flex items-center justify-center mx-auto text-white shadow-lg">
                    <span className="material-symbols-outlined text-3xl">lock</span>
                  </div>
                  <h3 className="font-headline-lg text-xl font-bold text-on-surface m-0">
                    Yêu cầu đăng nhập tài khoản
                  </h3>
                  <p className="font-body-md text-sm text-on-surface-variant max-w-md mx-auto m-0">
                    Các tính năng đổi mật khẩu, quản lý hồ sơ kỹ sư và bảo mật chỉ khả dụng khi bạn đăng nhập vào hệ sinh thái ThoDev.
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={promptLogin}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-container to-electric-blue text-white font-headline-lg text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/register", { state: { from: "/settings" } })}
                      className="px-6 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-headline-lg text-sm font-semibold transition-all cursor-pointer"
                    >
                      Tạo tài khoản mới
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* User Profile Card */}
                  <div className="bg-gradient-to-r from-surface-container/90 to-surface-container-high/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-glass-border">
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <img
                          className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-white/10"
                          alt="Avatar portrait of developer"
                          src={userAvatarUrl}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://lh3.googleusercontent.com/aida-public/AB6AXuA1u2ylPniW82TbfVr6S2dIQiz2twxjHfQvrWupHOIqzFoVjP5KhrgZJVLp6a7Thk5mrcq3wOUHlobyK3db4fmGayt2oZ0xwu-mmFvvz4CrsDw7QBsU1kHYCHd63ZGXW6lGs3C4F38vXsr0CpyQ1L2VdUeNbHAmasA47K7rUrf9BeoQ69AfwPQqpMORLm2QVgXjTQ3MPLu2aUCd0A2MMc-oLx1vzLHMesl3PA-oWSg";
                          }}
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-electric-blue flex items-center justify-center text-white text-xs shadow-md">
                          <span className="material-symbols-outlined text-[13px] cockpit-fill-icon">
                            verified
                          </span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-headline-lg text-xl font-bold text-on-surface m-0">
                            {userDisplayName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-secondary font-label-sm text-[11px] font-semibold">
                            {userRole}
                          </span>
                        </div>
                        <p className="font-body-md text-sm text-on-surface-variant m-0">{userEmail}</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-lowest font-label-sm text-xs text-primary border border-primary/20">
                          <span className="material-symbols-outlined text-sm text-primary">school</span>
                          <span>{userSchool}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2">
                      <button
                        className="px-4 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-headline-lg text-xs font-semibold transition-all border border-glass-border cursor-pointer"
                        type="button"
                        onClick={() => navigate("/profile")}
                      >
                        Chỉnh sửa hồ sơ
                      </button>
                      <button
                        className="px-4 py-2.5 rounded-xl bg-surface-container-lowest text-outline hover:text-on-surface font-headline-lg text-xs font-semibold transition-all border border-glass-border cursor-pointer"
                        type="button"
                        onClick={handleExportBackup}
                      >
                        Tải dữ liệu sao lưu
                      </button>
                    </div>
                  </div>

                  {/* Password Change Form Card */}
                  <div className="bg-surface-container/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6 border border-glass-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">password</span>
                      </div>
                      <div>
                        <h3 className="font-headline-lg text-base font-bold text-on-surface m-0">Đổi mật khẩu</h3>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1 m-0">
                          Nên dùng mật khẩu có ít nhất 10 ký tự kết hợp chữ, số và ký tự đặc biệt.
                        </p>
                      </div>
                    </div>

                    {!hasPassword && (
                      <div className="p-3.5 rounded-xl bg-electric-blue/15 border border-electric-blue/30 text-secondary text-xs font-body-md flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-lg shrink-0">info</span>
                        <span>
                          Bạn đã đăng nhập bằng Google. Hãy thiết lập mật khẩu mới để có thể đăng nhập bằng email trong tương lai.
                        </span>
                      </div>
                    )}

                    <form className="space-y-4 max-w-2xl" id="passwordForm" onSubmit={handlePasswordSubmit}>
                      {/* Current Password (if hasPassword) */}
                      {hasPassword && (
                        <div className="space-y-1.5">
                          <label className="font-headline-lg text-xs font-semibold text-on-surface uppercase tracking-wider block">
                            Mật khẩu hiện tại
                          </label>
                          <div className="relative flex items-center">
                            <input
                              className="w-full bg-bg-deep rounded-xl px-4 py-3 text-on-surface font-body-md text-sm placeholder-outline focus:outline-none focus:ring-2 focus:ring-electric-blue transition-all border border-glass-border"
                              id="curPass"
                              placeholder="••••••••••••"
                              type={showCurrentPass ? "text" : "password"}
                              value={passwordForm.current}
                              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
                              required
                            />
                            <button
                              className="toggle-password absolute right-4 text-outline hover:text-on-surface bg-transparent border-none cursor-pointer flex items-center"
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {showCurrentPass ? "visibility_off" : "visibility"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* New Password Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-headline-lg text-xs font-semibold text-on-surface uppercase tracking-wider block">
                            Mật khẩu mới
                          </label>
                          <div className="relative flex items-center">
                            <input
                              className="w-full bg-bg-deep rounded-xl px-4 py-3 text-on-surface font-body-md text-sm placeholder-outline focus:outline-none focus:ring-2 focus:ring-electric-blue transition-all border border-glass-border"
                              id="newPass"
                              placeholder="Nhập mật khẩu mới"
                              type={showNewPass ? "text" : "password"}
                              value={passwordForm.next}
                              onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
                              required
                            />
                            <button
                              className="toggle-password absolute right-4 text-outline hover:text-on-surface bg-transparent border-none cursor-pointer flex items-center"
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {showNewPass ? "visibility_off" : "visibility"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-headline-lg text-xs font-semibold text-on-surface uppercase tracking-wider block">
                            Xác nhận mật khẩu mới
                          </label>
                          <div className="relative flex items-center">
                            <input
                              className="w-full bg-bg-deep rounded-xl px-4 py-3 text-on-surface font-body-md text-sm placeholder-outline focus:outline-none focus:ring-2 focus:ring-electric-blue transition-all border border-glass-border"
                              id="confirmPass"
                              placeholder="Nhập lại mật khẩu mới"
                              type={showConfirmPass ? "text" : "password"}
                              value={passwordForm.confirm}
                              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                              required
                            />
                            <button
                              className="toggle-password absolute right-4 text-outline hover:text-on-surface bg-transparent border-none cursor-pointer flex items-center"
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {showConfirmPass ? "visibility_off" : "visibility"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          className="px-6 py-3 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-headline-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 border border-glass-border cursor-pointer disabled:opacity-60"
                          type="submit"
                          disabled={changingPassword}
                        >
                          <span className="material-symbols-outlined text-lg">key</span>
                          <span>{changingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Danger Zone: Signout on This Device */}
                  <div className="bg-error-container/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-error/30">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2 text-error">
                        <span className="material-symbols-outlined">logout</span>
                        <h3 className="font-headline-lg text-base font-bold m-0">Đăng xuất trên thiết bị này</h3>
                      </div>
                      <p className="font-body-md text-xs text-on-surface-variant m-0">
                        Bạn sẽ cần đăng nhập lại để sử dụng ThoDev tại đây. Tất cả các tab đang hoạt động sẽ kết thúc phiên làm việc.
                      </p>
                    </div>
                    <button
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-error-container to-error text-white font-headline-lg text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 border-none cursor-pointer"
                      id="logoutBtn"
                      type="button"
                      onClick={handleLogout}
                    >
                      <span className="material-symbols-outlined text-lg">power_settings_new</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Notification Toast Simulation */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 pointer-events-none ${
          toastActive ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
        id="toastNotification"
      >
        <div className="bg-surface-container-high/95 backdrop-blur-2xl text-on-surface px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-glass-border">
          <span className="material-symbols-outlined text-primary text-xl cockpit-fill-icon">check_circle</span>
          <p className="font-body-md text-sm font-medium text-on-surface m-0" id="toastMsg">
            {toastMsg}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Setting;
