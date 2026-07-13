import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  FaBell,
  FaCheck,
  FaChevronRight,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaKey,
  FaLock,
  FaPalette,
  FaShieldAlt,
  FaSignOutAlt,
  FaUniversalAccess,
  FaUserCog,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { auth } from "../components/firebase";
import { LanguageContext } from "../context/LanguageContext";
import { ThemeContext } from "../context/ThemeContext";
import "../style/Setting.css";

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
  const { t, language, setLanguage } = useContext(LanguageContext);
  const { theme, setTheme, background, setBackground } = useContext(ThemeContext);
  const [activeSection, setActiveSection] = useState("appearance");
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

  const passwordProvider = auth.currentUser?.providerData?.some(
    (provider) => provider.providerId === "password",
  );

  const sections = useMemo(
    () => [
      { id: "appearance", icon: FaPalette, label: t("settingAppearance") },
      { id: "privacy", icon: FaShieldAlt, label: t("settingPrivacy") },
      { id: "notifications", icon: FaBell, label: t("settingNotifications") },
      { id: "accessibility", icon: FaUniversalAccess, label: t("settingAccessibility") },
      { id: "security", icon: FaLock, label: t("settingSecurity") },
    ],
    [t],
  );

  useEffect(() => {
    localStorage.setItem("vibook_notification_preferences", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("vibook_default_privacy", defaultPrivacy);
  }, [defaultPrivacy]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = fontSize;
    root.dataset.reducedMotion = String(reducedMotion);
    root.dataset.compact = String(compactMode);
    localStorage.setItem("vibook_font_size", fontSize);
    localStorage.setItem("vibook_reduced_motion", String(reducedMotion));
    localStorage.setItem("vibook_compact_mode", String(compactMode));
  }, [compactMode, fontSize, reducedMotion]);

  const updateNotification = (key, value) => {
    setNotifications((current) => ({ ...current, [key]: value }));
  };

  const handleLanguageChange = (code) => {
    setLanguage(code);
    auth.languageCode = code;
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (passwordForm.next.length < 6) {
      toast.error(t("settingPasswordTooShort"));
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error(t("settingPasswordMismatch"));
      return;
    }
    const user = auth.currentUser;
    if (!user?.email || !passwordProvider) {
      toast.error(t("settingPasswordProviderUnsupported"));
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordForm.next);
      setPasswordForm({ current: "", next: "", confirm: "" });
      toast.success(t("settingPasswordChanged"));
    } catch (error) {
      console.error("Unable to change password", error);
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
    if (!window.confirm(t("settingLogoutConfirm"))) return;
    await auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`setting-page setting-page--${theme}`}>
      <header className="setting-hero">
        <div className="setting-hero__icon"><FaUserCog /></div>
        <div>
          <p>{t("settingEyebrow")}</p>
          <h1>{t("settingTitle")}</h1>
          <span>{t("settingSubtitle")}</span>
        </div>
      </header>

      <div className="setting-layout">
        <nav className="setting-nav" aria-label={t("settingTitle")}>
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              className={activeSection === id ? "is-active" : ""}
              onClick={() => setActiveSection(id)}
            >
              {React.createElement(Icon)}<span>{label}</span><FaChevronRight className="setting-nav__arrow" />
            </button>
          ))}
        </nav>

        <main className="setting-content">
          {activeSection === "appearance" && (
            <section className="setting-card">
              <div className="setting-card__heading"><FaPalette /><div><h2>{t("settingAppearance")}</h2><p>{t("settingAppearanceDescription")}</p></div></div>

              <div className="setting-group">
                <h3>{t("settingTheme")}</h3>
                <div className="setting-choice-grid setting-choice-grid--two">
                  {["light", "dark"].map((mode) => (
                    <button key={mode} type="button" className={`setting-theme-choice ${theme === mode ? "is-selected" : ""}`} onClick={() => setTheme(mode)}>
                      <span className={`setting-theme-preview setting-theme-preview--${mode}`}><i /><i /><i /></span>
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
                    <button key={option.id} type="button" className={background === option.id ? "is-selected" : ""} onClick={() => setBackground(option.id)} aria-label={t(option.labelKey)}>
                      <span style={{ backgroundColor: theme === "dark" ? option.darkColor : option.color }} />
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
                    <button key={option.code} type="button" className={language === option.code ? "is-selected" : ""} onClick={() => handleLanguageChange(option.code)}>
                      <span>{option.flag}</span><strong>{option.name}</strong>{language === option.code && <FaCheck />}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSection === "privacy" && (
            <section className="setting-card">
              <div className="setting-card__heading"><FaShieldAlt /><div><h2>{t("settingPrivacy")}</h2><p>{t("settingPrivacyDescription")}</p></div></div>
              <div className="setting-group">
                <h3>{t("settingDefaultAudience")}</h3>
                <p className="setting-help">{t("settingDefaultAudienceDescription")}</p>
                <div className="setting-choice-list">
                  {[
                    { id: "public", icon: "🌐", title: t("publicVisibility"), detail: t("settingPublicDescription") },
                    { id: "friends", icon: "👥", title: t("friendsVisibility"), detail: t("settingFriendsDescription") },
                    { id: "private", icon: "🔒", title: t("privateVisibility"), detail: t("settingPrivateDescription") },
                  ].map((option) => (
                    <button key={option.id} type="button" className={defaultPrivacy === option.id ? "is-selected" : ""} onClick={() => setDefaultPrivacy(option.id)}>
                      <span className="setting-choice-list__icon">{option.icon}</span>
                      <span><strong>{option.title}</strong><small>{option.detail}</small></span>
                      <i>{defaultPrivacy === option.id && <FaCheck />}</i>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSection === "notifications" && (
            <section className="setting-card">
              <div className="setting-card__heading"><FaBell /><div><h2>{t("settingNotifications")}</h2><p>{t("settingNotificationsDescription")}</p></div></div>
              <div className="setting-list">
                {[
                  ["reactions", "settingNotifyReactions", "settingNotifyReactionsDescription"],
                  ["comments", "settingNotifyComments", "settingNotifyCommentsDescription"],
                  ["friendRequests", "settingNotifyFriends", "settingNotifyFriendsDescription"],
                  ["messages", "settingNotifyMessages", "settingNotifyMessagesDescription"],
                ].map(([key, titleKey, detailKey]) => (
                  <div className="setting-row" key={key}>
                    <div><strong>{t(titleKey)}</strong><small>{t(detailKey)}</small></div>
                    <Toggle checked={notifications[key]} onChange={(value) => updateNotification(key, value)} label={t(titleKey)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "accessibility" && (
            <section className="setting-card">
              <div className="setting-card__heading"><FaUniversalAccess /><div><h2>{t("settingAccessibility")}</h2><p>{t("settingAccessibilityDescription")}</p></div></div>
              <div className="setting-group">
                <h3>{t("settingFontSize")}</h3>
                <div className="setting-segmented" role="group" aria-label={t("settingFontSize")}>
                  {["small", "normal", "large"].map((size) => <button type="button" key={size} className={fontSize === size ? "is-selected" : ""} onClick={() => setFontSize(size)}>{t(`settingFont${size[0].toUpperCase()}${size.slice(1)}`)}</button>)}
                </div>
              </div>
              <div className="setting-list">
                <div className="setting-row"><div><strong>{t("settingReducedMotion")}</strong><small>{t("settingReducedMotionDescription")}</small></div><Toggle checked={reducedMotion} onChange={setReducedMotion} label={t("settingReducedMotion")} /></div>
                <div className="setting-row"><div><strong>{t("settingCompactMode")}</strong><small>{t("settingCompactModeDescription")}</small></div><Toggle checked={compactMode} onChange={setCompactMode} label={t("settingCompactMode")} /></div>
              </div>
            </section>
          )}

          {activeSection === "security" && (
            <section className="setting-card">
              <div className="setting-card__heading"><FaKey /><div><h2>{t("settingSecurity")}</h2><p>{t("settingSecurityDescription")}</p></div></div>
              <div className="setting-account-summary"><div><FaUserCog /></div><span><strong>{auth.currentUser?.displayName || t("anonymous")}</strong><small>{auth.currentUser?.email}</small></span></div>
              {passwordProvider ? (
                <form className="setting-password-form" onSubmit={handlePasswordChange}>
                  <h3>{t("settingChangePassword")}</h3>
                  {[
                    ["current", "settingCurrentPassword"],
                    ["next", "settingNewPassword"],
                    ["confirm", "settingConfirmNewPassword"],
                  ].map(([field, labelKey]) => (
                    <label key={field}><span>{t(labelKey)}</span><div><input type={showPasswords ? "text" : "password"} autoComplete={field === "current" ? "current-password" : "new-password"} value={passwordForm[field]} onChange={(event) => setPasswordForm((current) => ({ ...current, [field]: event.target.value }))} required /><button type="button" onClick={() => setShowPasswords((visible) => !visible)} aria-label={t(showPasswords ? "settingHidePassword" : "settingShowPassword")}>{showPasswords ? <FaEyeSlash /> : <FaEye />}</button></div></label>
                  ))}
                  <button className="setting-primary-button" type="submit" disabled={changingPassword}>{changingPassword ? t("settingSaving") : t("settingUpdatePassword")}</button>
                </form>
              ) : <div className="setting-info"><FaLock /><span><strong>{t("settingExternalAccount")}</strong><small>{t("settingExternalAccountDescription")}</small></span></div>}
              <div className="setting-danger-zone"><div><strong>{t("settingLogout")}</strong><small>{t("settingLogoutDescription")}</small></div><button type="button" onClick={handleLogout}><FaSignOutAlt />{t("logout")}</button></div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Setting;
