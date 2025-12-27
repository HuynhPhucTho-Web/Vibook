// src/components/header/ThemeLanguageControls.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { FaCheck, FaChevronDown, FaGlobe } from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";

/* ---- helper: theme preview color ---- */
const getThemePreviewColor = (theme) => {
  const colors = {
    light: "linear-gradient(45deg, #f8f9fa, #e9ecef)",
    dark: "linear-gradient(45deg, #343a40, #212529)",
  };
  return colors[theme] || colors.light;
};

const ThemeDropdown = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const themeOptions = ["light", "dark"];
  const isLight = theme === "light";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center p-2 border-none bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="mr-1 sm:mr-2">
          {isLight ? (
            <CiSun className="text-lg sm:text-xl text-black" />
          ) : (
            <GiMoon className="text-lg sm:text-xl text-white" />
          )}
        </div>
        <span
          className={`capitalize mr-1 hidden md:block ${
            isLight ? "text-black" : "text-white"
          }`}
        >
          {theme}
        </span>
        <FaChevronDown
          className={`text-[10px] sm:text-xs ${
            isLight ? "text-black" : "text-white"
          } transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 min-w-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mt-2 z-50">
          <div className="p-3">
            <div className="flex items-center mb-3">
              <CiSun className="mr-2 text-blue-500 dark:text-blue-400" />
              <h6 className="mb-0 font-bold text-xs uppercase text-gray-600 dark:text-gray-300">
                {t("themeStyle")}
              </h6>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option}
                  className={`btn-sm w-full flex items-center justify-start text-xs px-3 py-2 rounded ${
                    theme === option
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  onClick={() => {
                    setTheme(option);
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <div
                    className="w-4 h-4 rounded mr-2"
                    style={{ background: getThemePreviewColor(option) }}
                  />
                  <span className="capitalize">{option}</span>
                  {theme === option && <FaCheck className="ml-auto text-xs" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LanguageDropdown = () => {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { theme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const languageOptions = [
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
  ];
  const isLight = theme === "light";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center p-2 border-none bg-transparent hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="mr-1 sm:mr-2">
          <FaGlobe className={`text-lg sm:text-xl ${isLight ? "text-black" : "text-white"}`} />
        </div>
        <span className={`capitalize mr-1 hidden md:block ${isLight ? "text-black" : "text-white"}`}>
          {languageOptions.find((lang) => lang.code === language)?.flag ||
            language.toUpperCase()}
        </span>
        <FaChevronDown
          className={`text-[10px] sm:text-xs ${
            isLight ? "text-black" : "text-white"
          } transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 min-w-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mt-2 z-50">
          <div className="p-3">
            <div className="flex items-center mb-3">
              <FaGlobe className="mr-2 text-blue-500 dark:text-blue-400" />
              <h6 className="mb-0 font-bold text-xs uppercase text-gray-600 dark:text-gray-300">
                {t("language")}
              </h6>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  className={`btn-sm w-full flex items-center justify-start text-xs px-3 py-2 rounded ${
                    language === option.code
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  onClick={() => {
                    setLanguage(option.code);
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <span className="mr-2">{option.flag}</span>
                  <span>{option.name}</span>
                  {language === option.code && <FaCheck className="ml-auto text-xs" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ThemeLanguageControls = () => {
  return (
    <div className="hidden sm:flex items-center gap-1 sm:gap-2 ml-1">
      <ThemeDropdown />
      <LanguageDropdown />
    </div>
  );
};

export default ThemeLanguageControls;
