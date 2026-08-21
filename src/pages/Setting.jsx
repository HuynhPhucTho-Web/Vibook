import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  FaBell,
  FaCheck,
  FaChevronRight,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaLock,
  FaPalette,
  FaShieldAlt,
  FaSignOutAlt,
  FaUniversalAccess,
  FaUserCog,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { auth, db } from "../components/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LanguageContext } from "../context/LanguageContext";
import { ThemeContext } from "../context/ThemeContext";
import { requireLogin } from "../utils/requireLogin";
import "../style/Setting.css";
import SEO from "../components/SEO";

/** Guest may use these (local prefs). Account-bound sections stay private. */
const PUBLIC_SECTION_IDS = new Set(["appearance", "accessibility"]);
const PRIVATE_SECTION_IDS = new Set(["privacy", "notifications", "security"]);

const readStoredObject = (key, fallback) => {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") };
  } catch {
    return fallback;
  }
};

const NOTIFICATION_DEFAULTS = {
  reactions: true,
  comments: true,
  friendRequests: true,
  messages: true,
};

const BACKGROUNDS = [
  { id: "default", color: "#f8fafc", darkColor: "#0b0f19", labelKey: "settingBackgroundDefault" },
  { id: "sky", color: "#dbeafe", darkColor: "#0b1525", labelKey: "settingBackgroundSky" },
  { id: "lavender", color: "#ede9fe", darkColor: "#171225", labelKey: "settingBackgroundLavender" },
  { id: "mint", color: "#d1fae5", darkColor: "#0c1d18", labelKey: "settingBackgroundMint" },
  { id: "warm", color: "#ffedd5", darkColor: "#21160f", labelKey: "settingBackgroundWarm" },
];

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    className={`setting-toggle${checked ? " is-on" : ""}`}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
  >
    <span />
  </button>
);

const Setting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useContext(LanguageContext);
  const { theme, setTheme, background, setBackground } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [authReady, setAuthReady] = useState(Boolean(auth.currentUser));
  const [activeSection, setActiveSection] = useState(() => {
    return location.state?.activeSection || "appearance";
  });
  const [notifications, setNotifications] = useState(() =>
    readStoredObject("vibook_notification_preferences", NOTIFICATION_DEFAULTS),
  );
  const [defaultPrivacy, setDefaultPrivacy] = useState(
    () => localStorage.getItem("vibook_default_privacy") || "public",
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
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (!user) {
        navigate("/login", { state: { from: "/settings" } });
      }
    });
    return () => unsub();
  }, [navigate]);

  const isGuest = authReady && !currentUser;

  const passwordProvider = currentUser?.providerData?.some(
    (p) => p.providerId === "password"
  );
  
  const [dbUser, setDbUser] = useState(null);
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

  const sections = useMemo(
    () => [
      { id: "appearance", icon: FaPalette, label: t("settingAppearance"), private: false },
      { id: "accessibility", icon: FaUniversalAccess, label: t("settingAccessibility"), private: false },
      { id: "privacy", icon: FaShieldAlt, label: t("settingPrivacy"), private: true },
      { id: "notifications", icon: FaBell, label: t("settingNotifications"), private: true },
      { id: "security", icon: FaLock, label: t("settingSecurity"), private: true },
    ],
    [t],
  );

  const selectedBackgroundOption = useMemo(
    () => BACKGROUNDS.find((option) => option.id === background) || BACKGROUNDS[0],
    [background],
  );

  const pageStyle = useMemo(
    () => ({
      "--setting-card": theme === "dark" ? "rgba(12, 14, 21, 0.78)" : "rgba(255, 255, 255, 0.86)",
      "--setting-border": theme === "dark" ? "rgba(255, 255, 255, 0.14)" : "rgba(15, 23, 42, 0.12)",
      "--setting-text": theme === "dark" ? "#e3e1ec" : "#162033",
      "--setting-muted": theme === "dark" ? "#cdc3d6" : "#687386",
      "--setting-accent-soft": theme === "dark" ? "rgba(142, 84, 233, 0.16)" : "rgba(142, 84, 233, 0.12)",
      "--setting-page-background": "transparent",
      "--setting-page-background-strong": "transparent",
    }),
    [theme],
  );

  useEffect(() => {
    // Only persist notification prefs when logged in (account-bound intent)
    if (!currentUser) return;
    localStorage.setItem("vibook_notification_preferences", JSON.stringify(notifications));
  }, [notifications, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem("vibook_default_privacy", defaultPrivacy);
  }, [defaultPrivacy, currentUser]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = fontSize;
    root.dataset.reducedMotion = String(reducedMotion);
    root.dataset.compact = String(compactMode);
    localStorage.setItem("vibook_font_size", fontSize);
    localStorage.setItem("vibook_reduced_motion", String(reducedMotion));
    localStorage.setItem("vibook_compact_mode", String(compactMode));
  }, [compactMode, fontSize, reducedMotion]);

  const promptLoginForPrivate = () => {
    requireLogin({
      navigate,
      title: t("loginToastTitle"),
      message: t("loginToPrivateSettings") || t("loginToSettings"),
      from: "/settings",
      loginLabel: t("login"),
    });
  };

  const openSection = (id) => {
    if (PRIVATE_SECTION_IDS.has(id) && !currentUser) {
      promptLoginForPrivate();
      setActiveSection(id); // show locked panel
      return;
    }
    setActiveSection(id);
  };

  const updateNotification = (key, value) => {
    if (!currentUser) {
      promptLoginForPrivate();
      return;
    }
    setNotifications((current) => ({ ...current, [key]: value }));
  };

  const handleLanguageChange = (code) => {
    setLanguage(code);
    if (auth.currentUser) auth.languageCode = code;
  };

  const handleDefaultPrivacy = (id) => {
    if (!currentUser) {
      promptLoginForPrivate();
      return;
    }
    setDefaultPrivacy(id);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      toast.error(t("settingLoginRequired"));
      return;
    }
    if (passwordForm.next.length < 6) {
      toast.error(t("settingPasswordTooShort"));
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error(t("settingPasswordMismatch"));
      return;
    }

    setChangingPassword(true);
    try {
      if (hasPassword) {
        if (!currentUser.email) {
          toast.error(t("settingPasswordProviderUnsupported"));
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
            toast.info("Xác thực bảo mật: Vui lòng xác nhận tài khoản Google của bạn...");
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
      toast.success(hasPassword ? t("settingPasswordChanged") : "Thiết lập mật khẩu thành công!");
    } catch (error) {
      console.error("Unable to update password", error);
      toast.error(
        error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
          ? t("settingCurrentPasswordWrong")
          : t("settingPasswordChangeFailed"),
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (!currentUser) return;
    if (!window.confirm(t("settingLogoutConfirm"))) return;
    await auth.signOut();
    navigate("/homevibook", { replace: true });
  };

  const LockedPanel = () => (
    <section className="setting-card setting-card--locked">
      <div className="setting-locked">
        <div className="setting-locked__icon">
          <FaLock />
        </div>
        <h2>{t("settingLockedTitle")}</h2>
        <p>{t("settingLockedDescription")}</p>
        <div className="setting-locked__actions">
          <button
            type="button"
            className="vb-btn vb-btn--primary"
            onClick={promptLoginForPrivate}
          >
            {t("login")}
          </button>
          <button
            type="button"
            className="vb-btn vb-btn--ghost"
            onClick={() =>
              navigate("/register", { state: { from: "/settings" } })
            }
          >
            {t("register")}
          </button>
        </div>
      </div>
    </section>
  );

  const showLocked =
    isGuest && PRIVATE_SECTION_IDS.has(activeSection) && !PUBLIC_SECTION_IDS.has(activeSection);

  return (
    <div className={`page-shell setting-page setting-page--${theme}`} style={pageStyle}>
      <SEO
        title="Cài đặt tài khoản"
        description="Quản lý thông tin tài khoản, cấu hình quyền riêng tư, cài đặt bảo mật và tùy biến giao diện trên mạng xã hội ThoDev."
        slug="/settings"
        noindex={true}
      />
      <header className="setting-hero">
        <div className="setting-hero__icon">
          <FaUserCog />
        </div>
        <div>
          <p>{t("settingEyebrow")}</p>
          <h1>{t("settingTitle")}</h1>
          <span>{isGuest ? t("settingGuestHint") : t("settingSubtitle")}</span>
        </div>
      </header>

      <div className="setting-layout">
        <nav className="setting-nav" aria-label={t("settingTitle")}>
          {sections.map(({ id, icon: Icon, label, private: isPrivate }) => (
            <button
              key={id}
              type="button"
              className={
                (activeSection === id ? "is-active " : "") +
                (isGuest && isPrivate ? "is-locked" : "")
              }
              onClick={() => openSection(id)}
            >
              {React.createElement(Icon)}
              <span>
                {label}
                {isGuest && isPrivate ? " 🔒" : ""}
              </span>
              <FaChevronRight className="setting-nav__arrow" />
            </button>
          ))}
        </nav>

        <main className="setting-content">
          {showLocked && <LockedPanel />}

          {!showLocked && activeSection === "appearance" && (
            <section className="setting-card">
              <div className="setting-card__heading">
                <FaPalette />
                <div>
                  <h2>{t("settingAppearance")}</h2>
                  <p>{t("settingAppearanceDescription")}</p>
                </div>
              </div>

              <div className="setting-group">
                <h3>{t("settingTheme")}</h3>
                <div className="setting-choice-grid setting-choice-grid--two">
                  {["light", "dark"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`setting-theme-choice ${theme === mode ? "is-selected" : ""}`}
                      onClick={() => setTheme(mode)}
                    >
                      <span className={`setting-theme-preview setting-theme-preview--${mode}`}>
                        <i />
                        <i />
                        <i />
                      </span>
                      <strong>{t(mode === "light" ? "settingLight" : "settingDark")}</strong>
                      {theme === mode && <FaCheck />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <h3>{t("settingBackground")}</h3>
                <p className="setting-help">{t("settingBackgroundDescription")}</p>
                <div className="setting-color-grid">
                  {BACKGROUNDS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={background === option.id ? "is-selected" : ""}
                      onClick={() => setBackground(option.id)}
                      aria-label={t(option.labelKey)}
                    >
                      <span
                        style={{
                          backgroundColor:
                            theme === "dark" ? option.darkColor : option.color,
                        }}
                      />
                      <small>{t(option.labelKey)}</small>
                      {background === option.id && <FaCheck />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <h3>{t("settingLanguage")}</h3>
                <div className="setting-language-grid">
                  {[
                    { code: "vi", flag: "🇻🇳", name: "Tiếng Việt" },
                    { code: "en", flag: "🇺🇸", name: "English" },
                    { code: "ja", flag: "🇯🇵", name: "日本語" },
                  ].map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      className={language === option.code ? "is-selected" : ""}
                      onClick={() => handleLanguageChange(option.code)}
                    >
                      <span>{option.flag}</span>
                      <strong>{option.name}</strong>
                      {language === option.code && <FaCheck />}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!showLocked && activeSection === "privacy" && currentUser && (
            <section className="setting-card">
              <div className="setting-card__heading">
                <FaShieldAlt />
                <div>
                  <h2>{t("settingPrivacy")}</h2>
                  <p>{t("settingPrivacyDescription")}</p>
                </div>
              </div>
              <div className="setting-group">
                <h3>{t("settingDefaultAudience")}</h3>
                <p className="setting-help">{t("settingDefaultAudienceDescription")}</p>
                <div className="setting-choice-list">
                  {[
                    {
                      id: "public",
                      icon: "🌐",
                      title: t("publicVisibility"),
                      detail: t("settingPublicDescription"),
                    },
                    {
                      id: "friends",
                      icon: "👥",
                      title: t("friendsVisibility"),
                      detail: t("settingFriendsDescription"),
                    },
                    {
                      id: "private",
                      icon: "🔒",
                      title: t("privateVisibility"),
                      detail: t("settingPrivateDescription"),
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={defaultPrivacy === option.id ? "is-selected" : ""}
                      onClick={() => handleDefaultPrivacy(option.id)}
                    >
                      <span className="setting-choice-list__icon">{option.icon}</span>
                      <span>
                        <strong>{option.title}</strong>
                        <small>{option.detail}</small>
                      </span>
                      <i>{defaultPrivacy === option.id && <FaCheck />}</i>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!showLocked && activeSection === "notifications" && currentUser && (
            <section className="setting-card">
              <div className="setting-card__heading">
                <FaBell />
                <div>
                  <h2>{t("settingNotifications")}</h2>
                  <p>{t("settingNotificationsDescription")}</p>
                </div>
              </div>
              <div className="setting-list">
                {[
                  ["reactions", "settingNotifyReactions", "settingNotifyReactionsDescription"],
                  ["comments", "settingNotifyComments", "settingNotifyCommentsDescription"],
                  ["friendRequests", "settingNotifyFriends", "settingNotifyFriendsDescription"],
                  ["messages", "settingNotifyMessages", "settingNotifyMessagesDescription"],
                ].map(([key, titleKey, detailKey]) => (
                  <div className="setting-row" key={key}>
                    <div>
                      <strong>{t(titleKey)}</strong>
                      <small>{t(detailKey)}</small>
                    </div>
                    <Toggle
                      checked={notifications[key]}
                      onChange={(value) => updateNotification(key, value)}
                      label={t(titleKey)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {!showLocked && activeSection === "accessibility" && (
            <section className="setting-card">
              <div className="setting-card__heading">
                <FaUniversalAccess />
                <div>
                  <h2>{t("settingAccessibility")}</h2>
                  <p>{t("settingAccessibilityDescription")}</p>
                </div>
              </div>
              <div className="setting-group">
                <h3>{t("settingFontSize")}</h3>
                <div className="setting-segmented" role="group" aria-label={t("settingFontSize")}>
                  {["small", "normal", "large"].map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={fontSize === size ? "is-selected" : ""}
                      onClick={() => setFontSize(size)}
                    >
                      {t(`settingFont${size[0].toUpperCase()}${size.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-list">
                <div className="setting-row">
                  <div>
                    <strong>{t("settingReducedMotion")}</strong>
                    <small>{t("settingReducedMotionDescription")}</small>
                  </div>
                  <Toggle
                    checked={reducedMotion}
                    onChange={setReducedMotion}
                    label={t("settingReducedMotion")}
                  />
                </div>
                <div className="setting-row">
                  <div>
                    <strong>{t("settingCompactMode")}</strong>
                    <small>{t("settingCompactModeDescription")}</small>
                  </div>
                  <Toggle
                    checked={compactMode}
                    onChange={setCompactMode}
                    label={t("settingCompactMode")}
                  />
                </div>
              </div>
            </section>
          )}

          {!showLocked && activeSection === "security" && currentUser && (
            <section className="setting-card">
              <div className="setting-card__heading">
                <FaKey />
                <div>
                  <h2>{t("settingSecurity")}</h2>
                  <p>{t("settingSecurityDescription")}</p>
                </div>
              </div>
              <div className="setting-account-summary">
                <div>
                  <FaUserCog />
                </div>
                <span>
                  <strong>{currentUser.displayName || t("anonymous")}</strong>
                  <small>{currentUser.email}</small>
                </span>
              </div>
              {(() => {
                const fields = hasPassword
                  ? [
                      ["current", "settingCurrentPassword"],
                      ["next", "settingNewPassword"],
                      ["confirm", "settingConfirmNewPassword"],
                    ]
                  : [
                      ["next", "settingNewPassword"],
                      ["confirm", "settingConfirmNewPassword"],
                    ];

                return (
                  <form className="setting-password-form" onSubmit={handlePasswordChange}>
                    {location.state?.forceSetPassword && !hasPassword && (
                      <div className="setting-info alert alert-info py-2 px-3 mb-3" style={{ fontSize: "14px" }}>
                        Bạn đã đăng nhập bằng Google. Hãy thiết lập mật khẩu mới để có thể đăng nhập bằng email trong tương lai.
                      </div>
                    )}
                    <h3>{hasPassword ? t("settingChangePassword") : "Thiết lập mật khẩu mới"}</h3>
                    {fields.map(([field, labelKey]) => (
                      <label key={field}>
                        <span>{t(labelKey)}</span>
                        <div>
                          <input
                            type={showPasswords ? "text" : "password"}
                            autoComplete={
                              field === "current" ? "current-password" : "new-password"
                            }
                            value={passwordForm[field]}
                            onChange={(event) =>
                              setPasswordForm((current) => ({
                                ...current,
                                [field]: event.target.value,
                              }))
                            }
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords((visible) => !visible)}
                            aria-label={t(
                              showPasswords ? "settingHidePassword" : "settingShowPassword",
                            )}
                          >
                            {showPasswords ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </label>
                    ))}
                    <button
                      className="vb-btn vb-btn--primary"
                      type="submit"
                      disabled={changingPassword}
                    >
                      {changingPassword ? t("settingSaving") : (hasPassword ? t("settingUpdatePassword") : "Thiết lập mật khẩu")}
                    </button>
                  </form>
                );
              })()}
              <div className="setting-danger-zone">
                <div>
                  <strong>{t("settingLogout")}</strong>
                  <small>{t("settingLogoutDescription")}</small>
                </div>
                <button type="button" onClick={handleLogout}>
                  <FaSignOutAlt />
                  {t("logout")}
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Setting;
