import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
  increment,
} from "firebase/firestore";
import { FaSearch, FaTimes } from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { auth, db } from "../components/firebase";
import SearchBox from "./header/SearchBox";
import SearchResults from "./header/SearchResults";
import HeaderRightActions from "./header/HeaderRightActions";
import { normalizeSearchText } from "../utils/postContent";
import { useSearch } from "../context/SearchContext";
import "../style/Header.css";

const Header = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const location = useLocation();
  const [authUser, setAuthUser] = useState(() => auth.currentUser);
  const [unreadCount, setUnreadCount] = useState(0);
  const { keyword: searchValue, setKeyword: setSearchValue, searchConfig } = useSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef(null);
  const appHeaderRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const [onlineCount, setOnlineCount] = useState(1);

  // Manage user presence registration
  useEffect(() => {
    let sessionId = sessionStorage.getItem("vibook_session_id");
    if (!sessionId) {
      sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("vibook_session_id", sessionId);
    }

    const userDocRef = doc(db, "OnlineUsers", sessionId);

    const updatePresence = async () => {
      try {
        await setDoc(userDocRef, {
          lastActive: new Date(),
          userId: auth.currentUser?.uid || "guest",
        }, { merge: true });
      } catch (e) {
        console.error("Error updating presence:", e);
      }
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    const removePresence = async () => {
      try {
        await deleteDoc(userDocRef);
      } catch (e) {
        console.error("Error removing presence:", e);
      }
    };

    window.addEventListener("beforeunload", removePresence);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener("beforeunload", removePresence);
      removePresence();
    };
  }, []);

  // Query online user counts
  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const oneMinuteAgo = new Date(Date.now() - 60000);
        const q = query(
          collection(db, "OnlineUsers"),
          where("lastActive", ">=", oneMinuteAgo)
        );
        const snapshot = await getDocs(q);
        setOnlineCount(Math.max(1, snapshot.size));
      } catch (e) {
        console.error("Error fetching online count:", e);
      }
    };

    fetchOnlineCount();
    const countInterval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(countInterval);
  }, []);

  // Calculate fake display count that fluctuates naturally
  const displayOnlineCount = useMemo(() => {
    const now = new Date();
    const min = now.getMinutes();
    const hour = now.getHours();
    const baseOffset = 25 + ((min + hour) % 15) + (hour % 6);
    return onlineCount + baseOffset;
  }, [onlineCount]);

  const searchMode = useMemo(() => {
    if (location.pathname.startsWith("/friends")) return "friends";
    return "global";
  }, [location.pathname]);

  const searchPlaceholder = useMemo(() => {
    if (searchConfig?.placeholder) return searchConfig.placeholder;
    if (searchMode === "friends") return "Tìm bạn bè";
    return t("searchPlaceholder") || "Tìm kiếm người dùng, bài viết...";
  }, [searchMode, searchConfig, t]);

  useEffect(() => {
    const header = appHeaderRef.current;
    if (!header) return undefined;
    const syncHeaderHeight = () =>
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${header.offsetHeight}px`,
      );
    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  // Keep header in sync when user logs in/out without remounting layout
  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setAuthUser(user);
      if (!user) setUnreadCount(0);
    });
  }, []);

  useEffect(() => {
    if (!authUser) {
      setUnreadCount(0);
      return undefined;
    }
    return onSnapshot(
      query(
        collection(db, "Notifications"),
        where("userId", "==", authUser.uid),
        where("read", "==", false),
      ),
      (snapshot) => setUnreadCount(snapshot.docs.length),
    );
  }, [authUser]);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
        setMobileSettingsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target))
        setSearchFocused(false);
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      )
        setMobileSearchOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    const onKeyboard = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchFocused(true);
        requestAnimationFrame(() =>
          searchRef.current?.querySelector("input")?.focus(),
        );
      }
      if (event.key === "Escape") {
        setSearchFocused(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyboard);
    return () => window.removeEventListener("keydown", onKeyboard);
  }, []);

  useEffect(() => {
    const keyword = searchValue.trim();
    if (!keyword || searchConfig?.onSearch) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const normalized = normalizeSearchText(keyword);
      const userTerm = keyword.toLocaleLowerCase();
      try {
        if (searchMode === "friends") {
          const snapshot = await getDocs(
            query(
              collection(db, "Users"),
              where("displayName_lowercase", ">=", userTerm),
              where("displayName_lowercase", "<=", `${userTerm}\uf8ff`),
              limit(10),
            ),
          );
          if (!cancelled) {
            const users = snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
              type: "user",
            }));
            setSearchResults(users);
          }
          return;
        }

        const requests = await Promise.allSettled([
          getDocs(
            query(
              collection(db, "Users"),
              where("displayName_lowercase", ">=", userTerm),
              where("displayName_lowercase", "<=", `${userTerm}\uf8ff`),
              limit(6),
            ),
          ),
          getDocs(
            query(
              collection(db, "Posts"),
              orderBy("searchText"),
              where("searchText", ">=", normalized),
              where("searchText", "<=", `${normalized}\uf8ff`),
              limit(8),
            ),
          ),
          getDocs(
            query(
              collection(db, "Posts"),
              orderBy("createdAt", "desc"),
              limit(40),
            ),
          ),
        ]);
        if (cancelled) return;

        const users =
          requests[0].status === "fulfilled"
            ? requests[0].value.docs.map((item) => ({
                id: item.id,
                ...item.data(),
                type: "user",
              }))
            : [];
        const indexedPosts =
          requests[1].status === "fulfilled" ? requests[1].value.docs : [];
        const recentPosts =
          requests[2].status === "fulfilled" ? requests[2].value.docs : [];
        const postMap = new Map();
        [...indexedPosts, ...recentPosts].forEach((item) => {
          const post = { id: item.id, ...item.data(), type: "post" };
          const searchable =
            post.searchText ||
            normalizeSearchText(
              `${post.title || ""} ${post.contentText || post.content || ""} ${post.userName || ""}`,
            );
          if (searchable.includes(normalized)) postMap.set(post.id, post);
        });
        const posts = [...postMap.values()]
          .sort((left, right) => {
            const leftTitle = normalizeSearchText(left.title || "");
            const rightTitle = normalizeSearchText(right.title || "");
            return (
              Number(rightTitle.startsWith(normalized)) -
              Number(leftTitle.startsWith(normalized))
            );
          })
          .slice(0, 8);
        setSearchResults([...users, ...posts]);
      } catch (error) {
        console.error("Search error", error);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchValue, searchMode]);

  const closeAllPopups = useCallback(() => {
    setUserMenuOpen(false);
    setMobileSettingsOpen(false);
    setMobileSearchOpen(false);
    setSearchFocused(false);
  }, []);

  const closeSearch = () => {
    setSearchValue("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
  };

  return (
    <header
      ref={appHeaderRef}
      data-app-header
      className={`sticky top-0 z-[998] transition-all duration-300 backdrop-blur-[20px] ${theme === "light" ? "bg-white/95 border-b border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]" : "bg-black/80 border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"}`}
    >
      <div className="header-row relative">
        <div className="flex items-center flex-shrink-0 gap-3">
          <Link to="/homevibook" className="no-underline flex items-center">
            <h1 className="mb-0 font-extrabold tracking-tight text-2xl sm:text-3xl bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
              ViBook
            </h1>
          </Link>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none ${theme === "light" ? "bg-green-50 text-green-700 border border-green-200" : "bg-green-950/40 text-green-400 border border-green-900/30"}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>{displayOnlineCount} <span className="online-count-text">{language === "vi" ? "đang online" : "online"}</span></span>
          </div>
        </div>

        <div className="header-search-slot hidden md:flex flex-1 min-w-0">
          <div className="header-search-wrap">
            <SearchBox
              theme={theme}
              t={t}
              searchRef={searchRef}
              searchFocused={searchFocused}
              setSearchFocused={setSearchFocused}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              searchResults={searchResults}
              isSearching={isSearching}
              placeholder={searchPlaceholder}
              mode={searchMode}
            />
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 ml-auto">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              className={`md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${theme === "light" ? "bg-black/5 hover:bg-black/10" : "bg-white/10 hover:bg-white/20"}`}
              onClick={() => {
                setMobileSearchOpen((open) => !open);
                setUserMenuOpen(false);
                setMobileSettingsOpen(false);
              }}
              aria-label="Tìm kiếm"
            >
              <FaSearch
                className={`text-base sm:text-lg ${theme === "light" ? "text-black" : "text-white"}`}
              />
            </button>
            <HeaderRightActions
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
              t={t}
              unreadCount={unreadCount}
              isAuthenticated={Boolean(authUser)}
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              mobileSettingsOpen={mobileSettingsOpen}
              setMobileSettingsOpen={setMobileSettingsOpen}
              mobileSearchOpen={mobileSearchOpen}
              userMenuRef={userMenuRef}
              closeAllPopups={closeAllPopups}
            />
          </div>
        </div>

        {mobileSearchOpen && (
          <div
            ref={mobileSearchRef}
            className={`mobile-search-panel md:hidden absolute top-full left-0 right-0 z-[1010] border-b shadow-2xl ${theme === "light" ? "light" : "dark"}`}
          >
            <div className="mobile-search-input-wrap">
              <FaSearch aria-hidden="true" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  searchConfig?.onSearch?.(e.target.value);
                }}
                onFocus={() => setSearchFocused(true)}
                aria-label={searchPlaceholder}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue("")}
                  aria-label="Xóa nội dung tìm kiếm"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            {searchValue.trim() && !searchConfig ? (
              <div className="mobile-search-results">
                <SearchResults
                  theme={theme}
                  t={t}
                  query={searchValue}
                  results={searchResults}
                  isSearching={isSearching}
                  onSelect={closeSearch}
                  mode={searchMode}
                />
              </div>
            ) : !searchConfig ? (
              <div className="mobile-search-hint">
                Nhập tên người dùng, tiêu đề hoặc nội dung bài viết.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
