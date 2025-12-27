// src/components/header/UserMenu.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaCheck, FaFacebookMessenger, FaGlobe, FaUser } from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import { auth } from "../../components/firebase";

const UserMenu = ({
  theme,
  setTheme,
  language,
  setLanguage,

  userMenuOpen,
  setUserMenuOpen,

  mobileSettingsOpen,
  setMobileSettingsOpen,

  setMobileSearchOpen,

  userMenuRef,
}) => {
  return (
    <div className="relative" ref={userMenuRef}>
      <button
        className="p-0 border-none bg-transparent"
        type="button"
        onClick={() => {
          setUserMenuOpen((v) => !v);
          setMobileSettingsOpen(false);
          setMobileSearchOpen(false);
        }}
      >
        <div className="relative">
          <img
            src={auth.currentUser?.photoURL || "/default-avatar.png"}
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div
            className={`absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 ${
              theme === "light" ? "border-white" : "border-black"
            }`}
          />
        </div>
      </button>

      {/* ===== Mobile radial menu ===== */}
      <div
        className={[
          "absolute right-0 top-full mt-3 md:hidden z-50",
          "transition-all duration-200 ease-out origin-top-right",
          userMenuOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-2 scale-95 pointer-events-none",
        ].join(" ")}
      >
        <div
          className={[
            "relative w-36 h-36 rounded-full",
            "border shadow-[0_18px_50px_rgba(0,0,0,0.25)]",
            theme === "light"
              ? "bg-white/70 border-white/40 backdrop-blur-xl"
              : "bg-slate-900/55 border-white/10 backdrop-blur-xl",
          ].join(" ")}
        >
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 to-transparent dark:from-white/10" />

          {/* Avatar middle */}
          <div className="absolute inset-[30%] rounded-full overflow-hidden border border-gray-300/40">
            <img
              src={auth.currentUser?.photoURL || "/default-avatar.png"}
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Profile – TOP */}
          <Link
            to="/profile"
            onClick={() => setUserMenuOpen(false)}
            className="absolute top-1 left-1/2 -translate-x-1/2"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 shadow">
              <FaUser className="text-lg text-black dark:text-white" />
            </div>
          </Link>

          {/* Messenger – LEFT */}
          <Link
            to="/messenger"
            onClick={() => setUserMenuOpen(false)}
            className="absolute top-1/2 -translate-y-1/2 left-1"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 shadow">
              <FaFacebookMessenger
                className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`}
              />
            </div>
          </Link>

          {/* Theme – RIGHT */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="absolute top-1/2 -translate-y-1/2 right-1"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 shadow">
              {theme === "light" ? (
                <CiSun className="text-xl text-black" />
              ) : (
                <GiMoon className="text-xl text-white" />
              )}
            </div>
          </button>

          {/* Language – BOTTOM */}
          <button
            type="button"
            onClick={() => setMobileSettingsOpen((v) => !v)}
            className="absolute bottom-1 left-1/2 -translate-x-1/2"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 shadow">
              <FaGlobe
                className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`}
              />
            </div>
          </button>

          {/* ===== Language Settings Panel (mobileSettingsOpen) ===== */}
          <div
            className={[
              "absolute left-1/2 -translate-x-1/2 top-full mt-3",
              "w-52 max-w-[calc(100vw-2rem)] rounded-2xl p-3 text-sm",
              "transition-all duration-200 ease-out origin-top",
              mobileSettingsOpen
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none",
              "backdrop-blur-xl",
              theme === "light" ? "bg-white/65" : "bg-slate-900/55",
              "border",
              theme === "light" ? "border-white/40" : "border-white/10",
              "shadow-[0_18px_50px_rgba(0,0,0,0.25)]",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 to-transparent dark:from-white/10" />

            <div className="relative">
              <div className="flex items-center mb-2">
                <FaGlobe className="mr-2 text-blue-400" />
                <span className="font-semibold text-xs uppercase tracking-wide">
                  Language
                </span>
              </div>

              <div className="space-y-1">
                {[
                  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
                  { code: "en", name: "English", flag: "🇺🇸" },
                  { code: "ja", name: "日本語", flag: "🇯🇵" },
                ].map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    className={[
                      "relative w-full overflow-hidden",
                      "flex items-center justify-start gap-2",
                      "px-3 py-2 rounded-xl text-xs border",
                      "transition-all duration-150",
                      "active:scale-[0.98]",
                      language === option.code
                        ? "bg-blue-500/15 border-blue-400/40 text-blue-700 dark:text-blue-200"
                        : "bg-white/40 dark:bg-white/5 border-white/30 dark:border-white/10 text-gray-800 dark:text-gray-100",
                      "hover:bg-white/55 dark:hover:bg-white/10",
                    ].join(" ")}
                    onPointerDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
                      e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
                    }}
                    onClick={() => {
                      setLanguage(option.code);
                      setMobileSettingsOpen(false);
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="ripple-layer pointer-events-none absolute inset-0" />
                    <span className="text-base leading-none">{option.flag}</span>
                    <span className="font-medium">{option.name}</span>

                    <span
                      className={[
                        "ml-auto flex items-center",
                        "transition-all duration-200",
                        language === option.code
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-2",
                      ].join(" ")}
                    >
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.65)]" />
                      <FaCheck className="text-[10px]" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP: dropdown vuông thông tin user */}
      {userMenuOpen && (
        <ul className="hidden md:block absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <li className="p-3">
            <div className="flex items-center">
              <img
                src={auth.currentUser?.photoURL || "/default-avatar.png"}
                alt="User Avatar"
                className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h6
                  className={`mb-0 text-sm font-semibold truncate ${
                    theme === "light" ? "text-black" : "text-white"
                  }`}
                >
                  {auth.currentUser?.displayName || "User"}
                </h6>
                <small
                  className={`text-xs ${
                    theme === "light" ? "text-gray-600" : "text-gray-300"
                  }`}
                >
                  {auth.currentUser?.email}
                </small>
              </div>
            </div>
          </li>
        </ul>
      )}
    </div>
  );
};

export default UserMenu;
