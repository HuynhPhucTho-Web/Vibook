// src/components/Header.jsx
import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
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

import { FaSearch, FaUser } from "react-icons/fa";
import SearchBox from "../components/header/SearchBox";
import HeaderRightActions from "../components/header/HeaderRightActions";
import "../style/Header.css";

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
  const mobileSearchRef = useRef(null);

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
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ----- listen for close mobile search event ----- */
  useEffect(() => {
    const handleCloseMobileSearch = () => setMobileSearchOpen(false);
    window.addEventListener("closeMobileSearch", handleCloseMobileSearch);
    return () => window.removeEventListener("closeMobileSearch", handleCloseMobileSearch);
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
            return content.includes(searchTerm) || userName.includes(searchTerm);
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

  /* ----- auto-close mobile search after 5 seconds (only when no results) ----- */
  useEffect(() => {
    if (mobileSearchOpen && searchResults.length === 0) {
      mobileSearchTimeoutRef.current = setTimeout(() => {
        setMobileSearchOpen(false);
      }, 5000);
    } else if (mobileSearchTimeoutRef.current) {
      clearTimeout(mobileSearchTimeoutRef.current);
      mobileSearchTimeoutRef.current = null;
    }
    return () => {
      if (mobileSearchTimeoutRef.current) clearTimeout(mobileSearchTimeoutRef.current);
    };
  }, [mobileSearchOpen, searchResults.length]);

  /* ----- auto-close user menu after 5 seconds ----- */
  useEffect(() => {
    if (userMenuOpen) {
      userMenuTimeoutRef.current = setTimeout(() => {
        setUserMenuOpen(false);
        setMobileSettingsOpen(false);
      }, 5000);
    } else if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current);
      userMenuTimeoutRef.current = null;
    }
    return () => {
      if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current);
    };
  }, [userMenuOpen]);

  const closeAllPopups = useCallback(() => {
    setUserMenuOpen(false);
    setMobileSettingsOpen(false);
    setMobileSearchOpen(false);
    setSearchFocused(false);
  }, []);

  const onOpenMobileSearch = useCallback(() => {
    setUserMenuOpen(false);
    setMobileSettingsOpen(false);
    window.dispatchEvent(new CustomEvent("closeSidebar"));
  }, []);

  return (
    <header
      className={`sticky top-0 z-[998] transition-all duration-300 ease-out backdrop-blur-[20px] ${
        theme === "light"
          ? "bg-white/95 border-b border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
          : "bg-black/80 border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      }`}
    >
      {/* ✅ relative để panel mobile bám đúng header */}
      <div className="px-4 py-4 flex items-center gap-4 w-full relative">
        {/* LEFT: Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link to="/homevibook" className="no-underline flex items-center">
            <h1 className="mb-0 font-extrabold tracking-tight text-2xl sm:text-3xl lg:text-3xl bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
              ViBook
            </h1>
          </Link>
        </div>

        {/* CENTER: Search (DESKTOP ONLY) */}
        <div className="hidden md:flex flex-1 min-w-0 pl-8 lg:pl-14">
          <div className="header-search-wrap">
            <SearchBox
              theme={theme}
              t={t}
              searchRef={searchRef}
              mobileSearchRef={mobileSearchRef}
              searchFocused={searchFocused}
              setSearchFocused={setSearchFocused}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              searchResults={searchResults}
              isSearching={isSearching}
              mobileSearchOpen={mobileSearchOpen}
              setMobileSearchOpen={setMobileSearchOpen}
              onOpenMobileSearch={onOpenMobileSearch}
            />
          </div>
        </div>

        {/* RIGHT: Group icons */}
        <div className="flex items-center flex-shrink-0 ml-auto">
          <div
            className={[
              "flex items-center rounded-full px-1.5 py-1",
              "gap-2 sm:gap-3",
              theme === "light" ? "bg-black/5" : "bg-white/10",
              "backdrop-blur-xl",
            ].join(" ")}
          >
            {/* ✅ MOBILE SEARCH ICON (chỉ icon, panel ở ngoài group) */}
            <button
              type="button"
              className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                theme === "light"
                  ? "bg-black/10 hover:bg-black/20"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              onClick={() => {
                setMobileSearchOpen((v) => !v);
                onOpenMobileSearch();
              }}
              title="Search"
              aria-label="Search"
            >
              <FaSearch className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`} />
            </button>

            <HeaderRightActions
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
              t={t}
              unreadCount={unreadCount}
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              mobileSettingsOpen={mobileSettingsOpen}
              setMobileSettingsOpen={setMobileSettingsOpen}
              mobileSearchOpen={mobileSearchOpen}
              setMobileSearchOpen={setMobileSearchOpen}
              userMenuRef={userMenuRef}
              closeAllPopups={closeAllPopups}
            />
          </div>
        </div>

        {/* ✅ MOBILE SEARCH PANEL: bung to như cũ (full ngang header) */}
        {mobileSearchOpen && (
          <div
            ref={mobileSearchRef}
            className={[
              "md:hidden absolute top-full left-0 right-0 z-[1010]",
              "p-4 border-b shadow-lg backdrop-blur-xl",
              theme === "light"
                ? "bg-white/75 border-white/45"
                : "bg-slate-900/55 border-white/10",
              "shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
            ].join(" ")}
          >
            <div className="relative flex items-center">
              <FaSearch
                className={[
                  "absolute left-3 z-10 text-sm",
                  theme === "light" ? "text-black/65" : "text-white/70",
                ].join(" ")}
              />

              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className={[
                  "w-full py-3 pl-9 pr-9 rounded-full text-sm",
                  "outline-none transition-all duration-150",
                  "ring-1 focus:ring-2",
                  theme === "light"
                    ? "bg-black/10 text-black placeholder-black/60 ring-black/10 focus:bg-black/15 focus:ring-black/20"
                    : "bg-white/10 text-white placeholder-white/60 ring-white/10 focus:bg-white/15 focus:ring-white/25",
                ].join(" ")}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
              />

              {searchValue && (
                <button
                  type="button"
                  className={[
                    "absolute right-2 w-7 h-7 rounded-full",
                    "flex items-center justify-center text-lg",
                    "transition active:scale-95",
                    theme === "light"
                      ? "text-black/65 hover:bg-black/10"
                      : "text-white/70 hover:bg-white/10",
                  ].join(" ")}
                  onClick={() => setSearchValue("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Results */}
            {(searchValue || searchResults.length > 0) && (
              <div
                className={[
                  "mt-3 max-h-60 overflow-y-auto rounded-2xl p-2 border",
                  "shadow-[0_10px_30px_rgba(0,0,0,0.18)]",
                  "backdrop-blur-xl",
                  theme === "light"
                    ? "bg-white/75 border-white/45"
                    : "bg-slate-900/55 border-white/10",
                ].join(" ")}
              >
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <div
                      className={[
                        "animate-spin h-4 w-4 border-2 rounded-full mr-2",
                        theme === "light"
                          ? "border-gray-400 border-t-transparent"
                          : "border-white/30 border-t-transparent",
                      ].join(" ")}
                    />
                    <span
                      className={[
                        "text-sm",
                        theme === "light" ? "text-gray-600" : "text-gray-200",
                      ].join(" ")}
                    >
                      {t("searching")}
                    </span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {/* Users */}
                    {searchResults.filter((r) => r.type === "user").length > 0 && (
                      <>
                        <h6
                          className={[
                            "text-xs font-bold uppercase mb-2 px-2",
                            theme === "light" ? "text-gray-600" : "text-gray-200/90",
                          ].join(" ")}
                        >
                          {t("users")}
                        </h6>

                        {searchResults
                          .filter((r) => r.type === "user")
                          .map((user) => (
                            <Link
                              key={`user-${user.id}`}
                              to={`/user/${user.id}`}
                              className="block no-underline touch-manipulation pointer-events-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimeout(() => {
                                  setSearchValue("");
                                  setMobileSearchOpen(false);
                                }, 80);
                              }}
                            >
                              <div
                                className={[
                                  "flex items-center py-2 px-2 cursor-pointer rounded-xl",
                                  "transition-all duration-150 active:scale-[0.99]",
                                  theme === "light"
                                    ? "hover:bg-black/5 active:bg-black/10"
                                    : "hover:bg-white/10 active:bg-white/15",
                                ].join(" ")}
                              >
                                <img
                                  src={user.photoURL || "/default-avatar.png"}
                                  alt={user.displayName}
                                  className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={[
                                      "text-sm font-semibold truncate",
                                      theme === "light" ? "text-gray-900" : "text-white",
                                    ].join(" ")}
                                  >
                                    {user.displayName || t("anonymous")}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                      </>
                    )}

                    {/* Posts */}
                    {searchResults.filter((r) => r.type === "post").length > 0 && (
                      <>
                        <h6
                          className={[
                            "text-xs font-bold uppercase mt-3 mb-2 px-2",
                            theme === "light" ? "text-gray-600" : "text-gray-200/90",
                          ].join(" ")}
                        >
                          {t("posts")}
                        </h6>

                        {searchResults
                          .filter((r) => r.type === "post")
                          .map((post) => (
                            <Link
                              key={`post-${post.id}`}
                              to={`/post/${post.id}`}
                              className={[
                                "block no-underline flex items-start py-2 px-2 cursor-pointer rounded-xl",
                                "transition-all duration-150 touch-manipulation pointer-events-auto",
                                theme === "light"
                                  ? "hover:bg-black/5 active:bg-black/10"
                                  : "hover:bg-white/10 active:bg-white/15",
                              ].join(" ")}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimeout(() => {
                                  setSearchValue("");
                                  setMobileSearchOpen(false);
                                }, 80);
                              }}
                            >
                              <FaUser
                                className={[
                                  "w-8 h-8 rounded-full mr-3 flex-shrink-0",
                                  theme === "light" ? "text-gray-500" : "text-gray-300",
                                ].join(" ")}
                              />
                              <div className="min-w-0 flex-1">
                                <p
                                  className={[
                                    "text-sm font-semibold truncate",
                                    theme === "light" ? "text-gray-900" : "text-white",
                                  ].join(" ")}
                                >
                                  {post.userName || t("anonymous")}
                                </p>
                                <p
                                  className={[
                                    "text-xs truncate",
                                    theme === "light" ? "text-gray-600" : "text-gray-300",
                                  ].join(" ")}
                                >
                                  {(post.content || "").substring(0, 50) || t("noContent")}...
                                </p>
                              </div>
                            </Link>
                          ))}
                      </>
                    )}
                  </>
                ) : searchValue ? (
                  <div className="text-center py-5">
                    <span
                      className={[
                        "text-sm",
                        theme === "light" ? "text-gray-500" : "text-gray-300",
                      ].join(" ")}
                    >
                      {t("noResults")} "{searchValue}"
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
