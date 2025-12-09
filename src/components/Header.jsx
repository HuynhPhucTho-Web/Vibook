// src/components/Header.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookMessenger,
  FaBell,
  FaSearch,
  FaUser,
  FaGlobe,
  FaCheck,
  FaChevronDown,
  FaCog,
} from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

/* ---- helper: theme preview color ---- */
const getThemePreviewColor = (theme) => {
  const colors = {
    light: "linear-gradient(45deg, #f8f9fa, #e9ecef)",
    dark: "linear-gradient(45deg, #343a40, #212529)",
  };
  return colors[theme] || colors.light;
};

/* ================= ThemeDropdown (desktop header) ================= */
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
          className={`capitalize mr-1 hidden md:block ${isLight ? "text-black" : "text-white"
            }`}
        >
          {theme}
        </span>
        <FaChevronDown
          className={`text-[10px] sm:text-xs ${isLight ? "text-black" : "text-white"
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
                  className={`btn-sm w-full flex items-center justify-start text-xs px-3 py-2 rounded ${theme === option
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  onClick={() => {
                    setTheme(option);
                    setIsOpen(false);
                  }}
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

/* ================= LanguageDropdown (desktop header) ================= */
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
          <FaGlobe
            className={`text-lg sm:text-xl ${isLight ? "text-black" : "text-white"
              }`}
          />
        </div>
        <span
          className={`capitalize mr-1 hidden md:block ${isLight ? "text-black" : "text-white"
            }`}
        >
          {languageOptions.find((lang) => lang.code === language)?.flag ||
            language.toUpperCase()}
        </span>
        <FaChevronDown
          className={`text-[10px] sm:text-xs ${isLight ? "text-black" : "text-white"
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
                  className={`btn-sm w-full flex items-center justify-start text-xs px-3 py-2 rounded ${language === option.code
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  onClick={() => {
                    setLanguage(option.code);
                    setIsOpen(false);
                  }}
                >
                  <span className="mr-2">{option.flag}</span>
                  <span>{option.name}</span>
                  {language === option.code && (
                    <FaCheck className="ml-auto text-xs" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= Header ================= */
const Header = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);

  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchTimeoutRef = useRef(null);
  const userMenuTimeoutRef = useRef(null);

  /* ----- unread notifications ----- */
  useEffect(() => {
    let unsubscribe;
    if (auth.currentUser) {
      const notificationsQuery = query(
        collection(db, "Notifications"),
        where("userId", "==", auth.currentUser.uid),
        where("read", "==", false)
      );
      unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        setUnreadCount(snapshot.docs.length);
      });
    }
    return () => unsubscribe && unsubscribe();
  }, []);

  /* ----- click outside menus ----- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setMobileSettingsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ----- search logic ----- */
  useEffect(() => {
    const search = async () => {
      if (!searchValue.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchTerm = searchValue.toLowerCase().trim();

        const usersQuery = query(
          collection(db, "Users"),
          where("displayName_lowercase", ">=", searchTerm),
          where("displayName_lowercase", "<=", searchTerm + "\uf8ff"),
          limit(5)
        );

        const postsQuery = query(
          collection(db, "Posts"),
          orderBy("createdAt", "desc"),
          limit(20)
        );

        const [userSnap, postSnap] = await Promise.all([
          getDocs(usersQuery),
          getDocs(postsQuery),
        ]);

        const users = userSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "user",
        }));

        const posts = postSnap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            type: "post",
          }))
          .filter((post) => {
            const content = (post.content || "").toLowerCase();
            const userName = (post.userName || "").toLowerCase();
            return (
              content.includes(searchTerm) || userName.includes(searchTerm)
            );
          })
          .slice(0, 5);

        setSearchResults([...users, ...posts]);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchValue]);

  /* ----- auto-close mobile search after 5 seconds ----- */
  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchTimeoutRef.current = setTimeout(() => {
        setMobileSearchOpen(false);
      }, 5000);
    } else {
      if (mobileSearchTimeoutRef.current) {
        clearTimeout(mobileSearchTimeoutRef.current);
        mobileSearchTimeoutRef.current = null;
      }
    }
    return () => {
      if (mobileSearchTimeoutRef.current) {
        clearTimeout(mobileSearchTimeoutRef.current);
      }
    };
  }, [mobileSearchOpen]);

  /* ----- auto-close user menu after 5 seconds ----- */
  useEffect(() => {
    if (userMenuOpen) {
      userMenuTimeoutRef.current = setTimeout(() => {
        setUserMenuOpen(false);
        setMobileSettingsOpen(false);
      }, 5000);
    } else {
      if (userMenuTimeoutRef.current) {
        clearTimeout(userMenuTimeoutRef.current);
        userMenuTimeoutRef.current = null;
      }
    }
    return () => {
      if (userMenuTimeoutRef.current) {
        clearTimeout(userMenuTimeoutRef.current);
      }
    };
  }, [userMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-[998] transition-all duration-300 ease-out backdrop-blur-[20px] ${theme === "light"
          ? "bg-white/95 border-b border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
          : "bg-black/80 border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        }`}
    >
      {/* Giữ kích thước header như ban đầu */}
      <div className="px-4 py-4 flex items-center justify-between max-w-full">
        {/* LEFT: Logo + Search */}
        <div className="flex items-center min-w-0 flex-1 gap-3">
          {/* Logo */}
          <div className="mr-1 sm:mr-3 flex-shrink-0">
            <Link to="/homevibook" className="no-underline flex items-center">
              <h1 className="mb-0 text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                ViBook
              </h1>
            </Link>
          </div>

          {/* Search (desktop / tablet, ẩn trên mobile) */}
          <div
            ref={searchRef}
            className={`relative hidden md:block w-64 lg:w-72 ${searchFocused ? "focused" : ""
              }`}
          >
            <div className="relative flex items-center">
              <FaSearch
                className={`absolute left-3 z-10 text-sm lg:text-base ${theme === "light" ? "text-black/70" : "text-white/70"
                  }`}
              />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className={`w-full py-2 pl-9 pr-9 rounded-full border-none text-sm focus:outline-none focus:ring-2 ${theme === "light"
                    ? "bg-black/10 text-black placeholder-black/70 focus:bg-black/15 focus:ring-black/20"
                    : "bg-white/10 text-white placeholder-white/70 focus:bg-white/15 focus:ring-white/30"
                  }`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
              {searchValue && (
                <button
                  className={`absolute right-2 w-5 h-5 flex items-center justify-center text-lg cursor-pointer bg-transparent border-none ${theme === "light" ? "text-black/70" : "text-white/70"
                    }`}
                  onClick={() => setSearchValue("")}
                >
                  ×
                </button>
              )}
            </div>

            {/* SEARCH DROPDOWN */}
            {searchFocused && (searchValue || searchResults.length > 0) && (
              <div
                className={`absolute top-full left-0 w-full min-w-72 max-h-72 overflow-y-auto rounded-lg shadow-lg border mt-1 z-50 ${theme === "light"
                    ? "bg-white border-gray-200"
                    : "bg-gray-800 border-gray-700"
                  }`}
              >
                <div className="p-3">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2" />
                      <span
                        className={`text-sm ${theme === "light"
                            ? "text-gray-600"
                            : "text-gray-300"
                          }`}
                      >
                        {t("searching")}
                      </span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {/* Users Section */}
                      {searchResults.filter((r) => r.type === "user").length >
                        0 && (
                          <>
                            <h6
                              className={`text-xs font-bold uppercase mb-2 ${theme === "light"
                                  ? "text-gray-600"
                                  : "text-gray-300"
                                }`}
                            >
                              {t("users")}
                            </h6>
                            {searchResults
                              .filter((r) => r.type === "user")
                              .map((user) => (
                                <Link
                                  key={user.id}
                                  to={`/user/${user.id}`}
                                  className="block no-underline"
                                  onClick={() => {
                                    setTimeout(() => {
                                      setSearchValue("");
                                      setSearchFocused(false);
                                    }, 0);
                                  }}
                                >
                                  <div
                                    className={`flex items-center py-2 px-2 cursor-pointer transition-colors rounded hover:${theme === "light"
                                        ? "bg-gray-100"
                                        : "bg-white/10"
                                      }`}
                                  >
                                    <FaUser className={`w-8 h-8 rounded-full mr-3 flex-shrink-0 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`} />
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`text-sm font-semibold truncate ${theme === "light"
                                            ? "text-gray-900"
                                            : "text-white"
                                          }`}
                                      >
                                        {user.displayName || t("anonymous")}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                          </>
                        )}

                      {/* Posts Section */}
                      {searchResults.filter((r) => r.type === "post").length >
                        0 && (
                          <>
                            <h6
                              className={`text-xs font-bold uppercase mt-3 mb-2 ${theme === "light"
                                  ? "text-gray-600"
                                  : "text-gray-300"
                                }`}
                            >
                              {t("posts")}
                            </h6>
                            {searchResults
                              .filter((r) => r.type === "post")
                              .map((post) => (
                                <Link
                                  key={post.id}
                                  to={`/post/${post.id}`}
                                  className="block no-underline"
                                  onClick={() => {
                                    setTimeout(() => {
                                      setSearchValue("");
                                      setSearchFocused(false);
                                    }, 0);
                                  }}
                                >
                                  <div
                                    className={`flex items-start py-2 px-2 cursor-pointer transition-colors rounded hover:${theme === "light"
                                        ? "bg-gray-100"
                                        : "bg-white/10"
                                      }`}
                                  >
                                    <FaUser className={`w-8 h-8 rounded-full mr-3 flex-shrink-0 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`} />
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`text-sm font-semibold truncate ${theme === "light"
                                            ? "text-gray-900"
                                            : "text-white"
                                          }`}
                                      >
                                        {post.userName || t("anonymous")}
                                      </p>
                                      <p
                                        className={`text-xs truncate ${theme === "light"
                                            ? "text-gray-600"
                                            : "text-gray-300"
                                          }`}
                                      >
                                        {post.content?.substring(0, 50) ||
                                          t("noContent")}
                                        ...
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                          </>
                        )}
                    </>
                  ) : searchValue ? (
                    <div className="text-center py-4">
                      <span
                        className={`text-sm ${theme === "light"
                            ? "text-gray-500"
                            : "text-gray-400"
                          }`}
                      >
                        {t("noResults")} "{searchValue}"
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Notifications + Avatar + (desktop theme/lang) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile Search Icon */}
          <button
            className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${theme === "light"
                ? "bg-black/10 hover:bg-black/20"
                : "bg-white/10 hover:bg-white/20"
              }`}
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              setUserMenuOpen(false);
              setMobileSettingsOpen(false);
            }}
            title="Search"
          >
            <FaSearch
              className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`}
            />
          </button>

          {/* Mobile Search Input */}
          {mobileSearchOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="relative flex items-center">
                <FaSearch
                  className={`absolute left-3 z-10 text-sm ${theme === "light" ? "text-black/70" : "text-white/70"}`}
                />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className={`w-full py-3 pl-9 pr-9 rounded-full border-none text-sm focus:outline-none focus:ring-2 ${theme === "light"
                      ? "bg-black/10 text-black placeholder-black/70 focus:bg-black/15 focus:ring-black/20"
                      : "bg-white/10 text-white placeholder-white/70 focus:bg-white/15 focus:ring-white/30"
                    }`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoFocus
                />
                {searchValue && (
                  <button
                    className={`absolute right-2 w-6 h-6 flex items-center justify-center text-lg cursor-pointer bg-transparent border-none ${theme === "light" ? "text-black/70" : "text-white/70"}`}
                    onClick={() => setSearchValue("")}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Mobile Search Results */}
              {(searchValue || searchResults.length > 0) && (
                <div className="mt-3 max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2" />
                      <span className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                        {t("searching")}
                      </span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {/* Users Section */}
                      {searchResults.filter((r) => r.type === "user").length > 0 && (
                        <>
                          <h6 className={`text-xs font-bold uppercase mb-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                            {t("users")}
                          </h6>
                          {searchResults
                            .filter((r) => r.type === "user")
                            .map((user) => (
                              <Link
                                key={user.id}
                                to={`/user/${user.id}`}
                                className="block no-underline"
                                onClick={() => {
                                  setTimeout(() => {
                                    setSearchValue("");
                                    setMobileSearchOpen(false);
                                  }, 0);
                                }}
                              >
                                <div className={`flex items-center py-2 px-2 cursor-pointer transition-colors rounded hover:${theme === "light" ? "bg-gray-100" : "bg-white/10"}`}>
                                  <img
                                    src={user.photoURL || "/default-avatar.png"}
                                    alt={user.displayName}
                                    className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold truncate ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                      {user.displayName || t("anonymous")}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                        </>
                      )}

                      {/* Posts Section */}
                      {searchResults.filter((r) => r.type === "post").length > 0 && (
                        <>
                          <h6 className={`text-xs font-bold uppercase mt-3 mb-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                            {t("posts")}
                          </h6>
                          {searchResults
                            .filter((r) => r.type === "post")
                            .map((post) => (
                              <Link
                                key={post.id}
                                to={`/post/${post.id}`}
                                className="block no-underline"
                                onClick={() => {
                                  setTimeout(() => {
                                    setSearchValue("");
                                    setMobileSearchOpen(false);
                                  }, 0);
                                }}
                              >
                                <div className={`flex items-start py-2 px-2 cursor-pointer transition-colors rounded hover:${theme === "light" ? "bg-gray-100" : "bg-white/10"}`}>
                                  <FaUser className={`w-8 h-8 rounded-full mr-3 flex-shrink-0 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`} />
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold truncate ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                      {post.userName || t("anonymous")}
                                    </p>
                                    <p className={`text-xs truncate ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                                      {post.content?.substring(0, 50) || t("noContent")}...
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                        </>
                      )}
                    </>
                  ) : searchValue ? (
                    <div className="text-center py-4">
                      <span className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                        {t("noResults")} "{searchValue}"
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Messenger icon - hidden on mobile */}
          <Link to="/messenger" title="Messenger" className="hidden md:block">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${theme === "light"
                  ? "bg-black/10 hover:bg-black/20"
                  : "bg-white/10 hover:bg-white/20"
                }`}
            >
              <FaFacebookMessenger
                className={`text-lg ${theme === "light" ? "text-black" : "text-white"
                  }`}
              />
            </div>
          </Link>

          {/* Notifications icon */}
          <Link
            to="/notifications"
            className="relative"
            title="Notifications"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${theme === "light"
                  ? "bg-black/5 hover:bg-black/10"
                  : "bg-white/10 hover:bg-white/20"
                }`}
            >
              <FaBell
                className={`text-lg ${theme === "light" ? "text-black" : "text-white"
                  }`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {unreadCount > 9 ? unreadCount : ""}
                </span>
              )}
            </div>
          </Link>

          {/* Avatar + radial menu */}
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
                  className={`absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 ${theme === "light" ? "border-white" : "border-black"
                    }`}
                />
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-3 md:hidden">
                <div
                  className={`relative w-36 h-36 rounded-full shadow-xl border ${theme === "light"
                      ? "bg-white border-gray-200"
                      : "bg-gray-900 border-gray-700"
                    }`}
                >
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
                      <FaFacebookMessenger className="text-lg text-blue-500" />
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
                        <CiSun className="text-xl text-yellow-500" />
                      ) : (
                        <GiMoon className="text-xl text-blue-300" />
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
                      <FaGlobe className="text-lg text-blue-500 dark:text-blue-300" />
                    </div>
                  </button>

                  {/* Language Select Panel */}
                  {mobileSettingsOpen && (
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 w-48 max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl border p-3 text-sm ${theme === "light"
                          ? "bg-white border-gray-200 text-gray-800"
                          : "bg-gray-900 border-gray-700 text-gray-100"
                        }`}
                    >
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
                            className={`w-full flex items-center justify-start px-3 py-2 rounded-lg text-xs border ${language === option.code
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                              }`}
                            onClick={() => {
                              setLanguage(option.code);
                              setMobileSettingsOpen(false);
                              setUserMenuOpen(false);
                            }}
                          >
                            <span className="mr-2">{option.flag}</span>
                            <span>{option.name}</span>
                            {language === option.code && (
                              <FaCheck className="ml-auto text-[10px]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* DESKTOP: dropdown vuông thông tin user */}
            {userMenuOpen && (
              <ul
                className={`hidden md:block absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50`}
              >
                <li className="p-3">
                  <div className="flex items-center">
                    <img
                      src={auth.currentUser?.photoURL || "/default-avatar.png"}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h6
                        className={`mb-0 text-sm font-semibold truncate ${theme === "light" ? "text-black" : "text-white"
                          }`}
                      >
                        {auth.currentUser?.displayName || "User"}
                      </h6>
                      <small
                        className={`text-xs ${theme === "light"
                            ? "text-gray-600"
                            : "text-gray-300"
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

          {/* Theme + Language dropdown trên desktop */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2 ml-1">
            <ThemeDropdown />
            <LanguageDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
