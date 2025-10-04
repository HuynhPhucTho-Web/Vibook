// src/components/Header.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaFacebookMessenger, FaBell, FaSearch, FaUser } from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import { FaCheck, FaChevronDown } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { auth, db } from "../components/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../style/Header.css";

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
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-link d-flex align-items-center theme-toggle p-2"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          border: "none",
          background: "none",
          color: theme === "light" ? "#000" : "#fff",
        }}
      >
        <div className="theme-icon-container me-2">
          {theme === "light" ? (
            <CiSun className="theme-icon fs-5" style={{ color: theme === "light" ? "#000" : "#fff" }} />
          ) : (
            <GiMoon className="theme-icon fs-5" style={{ color: theme === "light" ? "#000" : "#fff" }} />
          )}
        </div>
        <span
          className="theme-text text-capitalize d-none d-md-block me-1"
          style={{ color: theme === "light" ? "#000" : "#fff" }}
        >
          {theme}
        </span>
        <FaChevronDown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ fontSize: "0.7rem", color: theme === "light" ? "#000" : "#fff" }}
        />
      </button>

      {isOpen && (
        <div
          className={`theme-dropdown-menu position-absolute rounded shadow-lg border ${
            theme === "light" ? "bg-white" : "bg-dark"
          }`}
          style={{ top: "100%", right: 0, minWidth: "240px", zIndex: 1000, marginTop: "8px" }}
        >
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <CiSun className={`me-2 ${theme === "light" ? "text-primary" : "text-info"}`} />
              <h6 className={`mb-0 fw-bold small text-uppercase ${theme === "light" ? "text-muted" : "text-light"}`}>
                Theme Style
              </h6>
            </div>
            <div className="row g-2">
              {themeOptions.map((option) => (
                <div key={option} className="col-6">
                  <button
                    className={`btn btn-sm w-100 d-flex align-items-center justify-content-start ${
                      theme === option ? "btn-primary" : theme === "light" ? "btn-outline-secondary" : "btn-outline-light"
                    }`}
                    onClick={() => {
                      setTheme(option);
                      setIsOpen(false);
                    }}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.4rem 0.6rem",
                      color: theme === option ? "#fff" : theme === "light" ? "#000" : "#fff",
                    }}
                  >
                    <div
                      className="theme-preview me-2 rounded"
                      style={{ width: "16px", height: "16px", background: getThemePreviewColor(option) }}
                    />
                    <span className="text-capitalize">{option}</span>
                    {theme === option && <FaCheck className="ms-auto" style={{ fontSize: "0.7rem" }} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* inline css for dropdown */}
      <style jsx>{`
        .theme-toggle:hover {
          background-color: ${theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"} !important;
          border-radius: 8px;
        }
        .transition-transform {
          transition: transform 0.2s ease;
        }
        .rotate-180 {
          transform: rotate(180deg);
        }
        .theme-dropdown-menu {
          animation: dropdownFadeIn 0.15s ease-out;
        }
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

/* ================= Header ================= */
const Header = () => {
  const { theme } = useContext(ThemeContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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

  const headerBackgroundStyle =
    theme === "light"
      ? {
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }
      : {
          background: "rgba(0, 0, 0, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        };

  const textColor = theme === "light" ? "#000" : "#fff";
  const iconColor = theme === "light" ? "#000" : "#fff";
  const navIconBg = theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)";
  const navIconHoverBg = theme === "light" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)";

  return (
    <header
      className="modern-header sticky-top"
      style={{ zIndex: 1001, position: "sticky", top: 0, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", ...headerBackgroundStyle }}
    >
      <div className="header-content container-fluid">
        <div className="header-left d-flex align-items-center">
          {/* 🔥 ĐÃ BỎ NÚT FaBars MỞ SIDEBAR Ở HEADER */}

          {/* Logo */}
          <div className="logo-container me-4">
            <Link to="/homevibook" className="text-decoration-none">
              <h1
                className="logo-title mb-0"
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: "700",
                  fontSize: "1.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                ViBook
              </h1>
              <small className="logo-subtitle" style={{ color: theme === "light" ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)" }}>
                Developed by HuynhPhucTho-Web
              </small>
            </Link>
          </div>

          {/* Search */}
          <div className={`search-container ${searchFocused ? "focused" : ""}`}>
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" style={{ color: theme === "light" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)" }} />
              <input
                type="text"
                placeholder="Search people, posts, groups..."
                className="search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  backgroundColor: theme === "light" ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)",
                  color: textColor,
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 40px 8px 35px",
                  width: "100%",
                  fontSize: "0.9rem",
                }}
              />
              {searchValue && (
                <button
                  className="search-clear"
                  onClick={() => setSearchValue("")}
                  style={{ color: theme === "light" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)" }}
                >
                  ×
                </button>
              )}
            </div>

            {searchFocused && (
              <div className={`search-dropdown position-absolute rounded shadow-lg border mt-1 ${theme === "light" ? "bg-white" : "bg-dark"}`}>
                <div className="search-section p-3">
                  <h6 className={`search-section-title ${theme === "light" ? "text-muted" : "text-light"}`}>Recent Searches</h6>
                  <div className="search-item d-flex align-items-center py-2">
                    <FaSearch className={`search-item-icon me-2 ${theme === "light" ? "text-muted" : "text-light"}`} />
                    <span style={{ color: textColor }}>React tutorials</span>
                  </div>
                  <div className="search-item d-flex align-items-center py-2">
                    <FaSearch className={`search-item-icon me-2 ${theme === "light" ? "text-muted" : "text-light"}`} />
                    <span style={{ color: textColor }}>Web development</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="header-right d-flex align-items-center">
          <div className="nav-icons d-flex align-items-center me-3">
            <Link to="/profile" className="nav-icon-link me-2" title="Profile">
              <div className="nav-icon-container" style={{ backgroundColor: navIconBg }}>
                <FaUser className="nav-icon" style={{ color: iconColor }} />
              </div>
            </Link>

            <Link to="/messenger" className="nav-icon-link me-2" title="Messenger">
              <div className="nav-icon-container" style={{ backgroundColor: navIconBg }}>
                <FaFacebookMessenger className="nav-icon" style={{ color: iconColor }} />
              </div>
            </Link>

            <Link to="/notifications" className="nav-icon-link position-relative me-2" title="Notifications">
              <div className="nav-icon-container" style={{ backgroundColor: navIconBg }}>
                <FaBell className="nav-icon" style={{ color: iconColor }} />
                {unreadCount > 0 && (
                  <span className={`notification-badge position-absolute ${unreadCount > 9 ? "with-count" : "pulse"}`}>
                    {unreadCount > 9 ? unreadCount : ""}
                  </span>
                )}
              </div>
            </Link>

            <ThemeDropdown />
          </div>

          {/* user dropdown */}
          <div className="user-profile">
            <div className="dropdown">
              <button className="btn btn-link p-0 user-avatar-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <div className="user-avatar">
                  <img
                    src={auth.currentUser?.photoURL || "/default-avatar.png"}
                    alt="User Avatar"
                    className="avatar-img rounded-circle"
                    style={{ width: "40px", height: "40px", objectFit: "cover" }}
                  />
                  <div className="online-indicator" />
                </div>
              </button>

              <ul className={`dropdown-menu dropdown-menu-end user-menu ${theme === "light" ? "" : "dropdown-menu-dark"}`}>
                <li className="user-menu-header p-3">
                  <div className="d-flex align-items-center">
                    <img
                      src={auth.currentUser?.photoURL || "/default-avatar.png"}
                      alt="User Avatar"
                      className="user-menu-avatar rounded-circle me-2"
                      style={{ width: "32px", height: "32px", objectFit: "cover" }}
                    />
                    <div>
                      <h6 className="mb-0" style={{ color: textColor }}>
                        {auth.currentUser?.displayName || "User"}
                      </h6>
                      <small className={theme === "light" ? "text-muted" : "text-light"}>{auth.currentUser?.email}</small>
                    </div>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link className="dropdown-item" to="/profile">
                    View Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/settings">
                    Settings
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={() => auth.signOut()}>
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* inline css for header */}
      <style jsx>{`
        .nav-icon-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${navIconBg};
          transition: all 0.3s ease;
        }
        .nav-icon-container:hover {
          background-color: ${navIconHoverBg} !important;
          transform: scale(1.05);
        }
        .nav-icon {
          color: ${iconColor};
          font-size: 1.1rem;
        }
        .notification-badge {
          top: 0;
          right: 0;
          background-color: #dc3545;
          color: #fff;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: bold;
        }
        .notification-badge.pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        .search-container {
          position: relative;
          width: 300px;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-input::placeholder {
          color: ${theme === "light" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"};
        }
        .search-input:focus {
          outline: none;
          background-color: ${theme === "light" ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.25)"} !important;
          box-shadow: 0 0 0 2px ${theme === "light" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)"};
        }
        .search-icon {
          position: absolute;
          left: 12px;
          z-index: 1;
        }
        .search-clear {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-dropdown {
          width: 100%;
          min-width: 300px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
        }
        .search-item {
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .search-item:hover {
          background-color: ${theme === "light" ? "#f8f9fa" : "rgba(255, 255, 255, 0.1)"};
        }
        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background-color: #28a745;
          border-radius: 50%;
          border: 2px solid ${theme === "light" ? "#fff" : "#000"};
        }
        .user-avatar {
          position: relative;
        }
        .header-content {
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        @media (max-width: 768px) {
          .search-container {
            display: none;
          }
          .theme-text {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
