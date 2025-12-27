// src/components/header/HeaderRightActions.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaBell, FaFacebookMessenger } from "react-icons/fa";
import UserMenu from "./UserMenu";
import ThemeLanguageControls from "./ThemeLanguageControls";

const HeaderRightActions = ({
  theme,
  setTheme,
  language,
  setLanguage,
  t,

  unreadCount,

  userMenuOpen,
  setUserMenuOpen,

  mobileSettingsOpen,
  setMobileSettingsOpen,
  
  setMobileSearchOpen,

  userMenuRef,

  closeAllPopups,
}) => {
  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {/* Messenger icon - hidden on mobile */}
      <Link to="/messenger" title="Messenger" className="hidden md:block">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
            theme === "light"
              ? "bg-black/10 hover:bg-black/20"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <FaFacebookMessenger
            className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`}
          />
        </div>
      </Link>

      {/* Notifications icon */}
      <Link to="/notifications" className="relative" title="Notifications">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
            theme === "light"
              ? "bg-black/5 hover:bg-black/10"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <FaBell className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {unreadCount > 9 ? unreadCount : ""}
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
        setMobileSearchOpen={setMobileSearchOpen}
        userMenuRef={userMenuRef}
        t={t}
        closeAllPopups={closeAllPopups}
      />

      {/* Theme + Language dropdown trên desktop */}
      <ThemeLanguageControls />
    </div>
  );
};

export default HeaderRightActions;
