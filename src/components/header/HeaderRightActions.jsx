// src/components/header/HeaderRightActions.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaBell, FaFacebookMessenger } from "react-icons/fa";
import UserMenu from "./UserMenu";
import { auth } from "../firebase";

const HeaderRightActions = ({
  theme,
  setTheme,
  language,
  setLanguage,
  t,

  unreadCount,
  isAuthenticated = Boolean(auth.currentUser),

  userMenuOpen,
  setUserMenuOpen,

  mobileSettingsOpen,
  setMobileSettingsOpen,

  userMenuRef,

  closeAllPopups,
}) => {
  const isLight = theme === "light";

  // Guest: Login only (hide messenger / notifications / user menu)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link
          to="/login"
          onClick={closeAllPopups}
          className="vb-btn vb-btn--primary vb-btn--sm vb-btn--pill no-underline"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {/* Messenger icon - hidden on mobile */}
      <Link to="/messenger" title="Messenger" className="hidden md:block">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
            isLight
              ? "bg-black/5 hover:bg-black/10"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <FaFacebookMessenger
            className={`text-base sm:text-lg ${isLight ? "text-black" : "text-white"}`}
          />
        </div>
      </Link>

      {/* Notifications icon */}
      <Link to="/notifications" className="relative" title="Notifications">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
            isLight
              ? "bg-black/5 hover:bg-black/10"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <FaBell
            className={`text-base sm:text-lg ${isLight ? "text-black" : "text-white"}`}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-sm">
              {unreadCount}
            </span>
          )}
        </div>
      </Link>

      {/* Avatar + menus */}
      <UserMenu
        theme={theme}
        setTheme={setTheme}
        language={language}
        setLanguage={setLanguage}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        mobileSettingsOpen={mobileSettingsOpen}
        setMobileSettingsOpen={setMobileSettingsOpen}
        userMenuRef={userMenuRef}
        t={t}
        closeAllPopups={closeAllPopups}
      />
    </div>
  );
};

export default HeaderRightActions;
