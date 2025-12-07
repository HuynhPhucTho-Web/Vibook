// src/components/Header.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaFacebookMessenger, FaBell, FaSearch, FaUser } from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import { FaCheck, FaChevronDown } from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext";
import { auth, db } from "../components/firebase";
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from "firebase/firestore";

/* ---- helper: theme preview color ---- */
const getThemePreviewColor = (theme) => {
  const colors = {
    light: "linear-gradient(45deg, #f8f9fa, #e9ecef)",
    dark: "linear-gradient(45deg, #343a40, #212529)",
  };
  return colors[theme] || colors.light;
};

/* ================= ThemeDropdown ================= */
const ThemeDropdown = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const themeOptions = ["light", "dark"];
  const isLight = theme === "light"; // Added isLight for explicit color control

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
        <div className="mr-2">
          {isLight ? ( // Use isLight for explicit icon color
            <CiSun className={`text-xl ${isLight ? "text-black" : "text-white"}`} />
          ) : (
            <GiMoon className={`text-xl ${isLight ? "text-black" : "text-white"}`} />
          )}
        </div>
        <span className={`capitalize mr-1 hidden md:block ${isLight ? "text-black" : "text-white"}`}>
          {theme}
        </span>
        <FaChevronDown
          className={`text-xs ${isLight ? "text-black" : "text-white"} transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 min-w-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mt-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-3">
            <div className="flex items-center mb-3">
              <CiSun className="mr-2 text-blue-500 dark:text-blue-400" />
              <h6 className="mb-0 font-bold text-xs uppercase text-gray-600 dark:text-gray-300">
                Theme Style
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

/* ================= Header ================= */
const Header = () => {
  const { theme } = useContext(ThemeContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search functionality
  useEffect(() => {
    const search = async () => {
      if (!searchValue.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchTerm = searchValue.toLowerCase().trim();

        // Search for users
        const usersQuery = query(
          collection(db, "Users"),
          where("displayName_lowercase", ">=", searchTerm),
          where("displayName_lowercase", "<=", searchTerm + '\uf8ff'),
          limit(5)
        );

        // Search for posts
        const postsQuery = query(
          collection(db, "Posts"),
          orderBy("createdAt", "desc"),
          limit(20)
        );

        const [userSnap, postSnap] = await Promise.all([
          getDocs(usersQuery),
          getDocs(postsQuery),
        ]);

        const users = userSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'user',
        }));

        const posts = postSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'post',
          }))
          .filter(post => {
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

  return (
    <header
      className={`sticky top-0 z-[1001] transition-all duration-300 ease-out backdrop-blur-[20px] ${
        theme === "light"
          ? "bg-white/95 border-b border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
          : "bg-black/8 border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between max-w-full">
        <div className="flex items-center min-w-0 flex-1">
          {/* Logo */}
          <div className="mr-4">
            <Link to="/homevibook" className="no-underline">
              <h1
                className="mb-0 text-xl font-bold tracking-tight bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent"
              >
                ViBook
              </h1>
              <small className={`text-xs ${theme === "light" ? "text-black/50" : "text-white/50"} hidden sm:block`}>
                Developed by HuynhPhucTho-Web
              </small>
            </Link>
          </div>

          {/* Search */}
          <div ref={searchRef} className={`relative w-72 hidden md:block ${searchFocused ? "focused" : ""}`}>
            <div className="relative flex items-center">
              <FaSearch className={`absolute left-3 z-10 text-lg ${theme === "light" ? "text-black/70" : "text-white/70"}`} />
              <input
                type="text"
                placeholder="Search people, posts, groups..."
                className={`w-full py-2 pl-9 pr-10 rounded-full border-none text-sm focus:outline-none focus:ring-2 ${
                  theme === "light"
                    ? "bg-black/15 text-black placeholder-black/70 focus:bg-black/25 focus:ring-black/30"
                    : "bg-white/15 text-white placeholder-white/70 focus:bg-white/25 focus:ring-white/30"
                }`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
              {searchValue && (
                <button
                  className={`absolute right-2 w-5 h-5 flex items-center justify-center text-lg cursor-pointer bg-transparent border-none ${
                    theme === "light" ? "text-black/70" : "text-white/70"
                  }`}
                  onClick={() => setSearchValue("")}
                >
                  ×
                </button>
              )}
            </div>

            {searchFocused && (searchValue || searchResults.length > 0) && (
              <div className={`absolute top-full left-0 w-full min-w-72 max-h-72 overflow-y-auto rounded-lg shadow-lg border mt-1 z-50 ${
                theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"
              }`}>
                <div className="p-3">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                      <span className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {/* Users Section */}
                      {searchResults.filter(r => r.type === 'user').length > 0 && (
                        <>
                          <h6 className={`text-xs font-bold uppercase mb-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                            Users
                          </h6>
                          {searchResults.filter(r => r.type === 'user').map((user) => (
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
                              <div className={`flex items-center py-2 px-2 cursor-pointer transition-colors rounded hover:${
                                theme === "light" ? "bg-gray-100" : "bg-white/10"
                              }`}>
                                <img
                                  src={user.photoURL || "/default-avatar.png"}
                                  alt={user.displayName}
                                  className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-semibold truncate ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                    {user.displayName || "Anonymous"}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </>
                      )}

                      {/* Posts Section */}
                      {searchResults.filter(r => r.type === 'post').length > 0 && (
                        <>
                          <h6 className={`text-xs font-bold uppercase mt-3 mb-2 ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                            Posts
                          </h6>
                          {searchResults.filter(r => r.type === 'post').map((post) => (
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
                              <div className={`flex items-start py-2 px-2 cursor-pointer transition-colors rounded hover:${
                                theme === "light" ? "bg-gray-100" : "bg-white/10"
                              }`}>
                                <img
                                  src={post.userPhoto || "/default-avatar.png"}
                                  alt={post.userName}
                                  className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-semibold truncate ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                    {post.userName || "Anonymous"}
                                  </p>
                                  <p className={`text-xs truncate ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                                    {post.content?.substring(0, 50) || "No content"}...
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
                        No results found for "{searchValue}"
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <Link to="/profile" className="mr-2" title="Profile">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
                theme === "light" ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20"
              }`}>
                <FaUser className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`} />
              </div>
            </Link>

            <Link to="/messenger" className="mr-2" title="Messenger">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
                theme === "light" ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20"
              }`}>
                <FaFacebookMessenger className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`} />
              </div>
            </Link>

            <Link to="/notifications" className="mr-2 relative" title="Notifications">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
                theme === "light" ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20"
              }`}>
                <FaBell className={`text-lg ${theme === "light" ? "text-black" : "text-white"}`} />
                {unreadCount > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold ${
                    unreadCount > 9 ? "" : "animate-pulse"
                  }`}>
                    {unreadCount > 9 ? unreadCount : ""}
                  </span>
                )}
              </div>
            </Link>

            <ThemeDropdown />
          </div>

          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="p-0 border-none bg-transparent"
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="relative">
                <img
                  src={auth.currentUser?.photoURL || "/default-avatar.png"}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className={`absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 ${
                  theme === "light" ? "border-white" : "border-black"
                }`} />
              </div>
            </button>

            {userMenuOpen && (
              <ul className={`absolute right-0 top-full mt-2 w-64 sm:w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${
                theme === "light" ? "" : "dark"
              }`}>
                <li className="p-3">
                  <div className="flex items-center">
                    <img
                      src={auth.currentUser?.photoURL || "/default-avatar.png"}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h6 className={`mb-0 text-sm font-semibold truncate ${theme === "light" ? "text-black" : "text-white"}`}>
                        {auth.currentUser?.displayName || "User"}
                      </h6>
                      <small className={`text-xs ${theme === "light" ? "text-gray-600" : "text-gray-300"}`}>
                        {auth.currentUser?.email}
                      </small>
                    </div>
                  </div>
                </li>
                {/* <li><hr className="border-gray-200 dark:border-gray-700" /></li>
                <li><Link className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" to="/profile" onClick={() => setUserMenuOpen(false)}>View Profile</Link></li>
                <li><Link className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700" to="/settings" onClick={() => setUserMenuOpen(false)}>Settings</Link></li>
                <li><hr className="border-gray-200 dark:border-gray-700" /></li>
                <li><button className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { auth.signOut(); setUserMenuOpen(false); }}>Sign Out</button></li> */}
              </ul>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
