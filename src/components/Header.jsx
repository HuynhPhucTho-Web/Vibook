import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebookMessenger, FaBell, FaSearch, FaUser, FaBars } from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { auth, db } from "../components/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import '../style/Header.css';

const ThemeDropdown = () => {
  const { theme, setTheme, colorOptions, setBodyBackground } = useContext(ThemeContext);
  const themeOptions = [
    "light", "dark", "red", "blue", "green", "yellow", 
    "purple", "pink", "indigo", "teal", "orange", "cyan"
  ];

  return (
    <div className="dropdown theme-dropdown">
      <button
        className="btn btn-link text-white d-flex align-items-center theme-toggle"
        type="button"
        id="themeDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <div className="theme-icon-container">
          {theme === "light" ? <CiSun className="theme-icon" /> : <GiMoon className="theme-icon" />}
        </div>
        <span className="theme-text text-capitalize d-none d-md-block">{theme}</span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end theme-menu" aria-labelledby="themeDropdown">
        <div className="theme-grid">
          {themeOptions.map((option) => (
            <li key={option}>
              <button
                className={`dropdown-item theme-option ${theme === option ? "active" : ""}`}
                onClick={() => setTheme(option)}
              >
                <div className={`theme-preview theme-${option}`}></div>
                <span className="text-capitalize">{option}</span>
              </button>
            </li>
          ))}
        </div>
        <hr className="dropdown-divider" />
        <div className="p-2">
          <h6 className="dropdown-header text-sm font-semibold text-gray-600">Background Color</h6>
          <div className="grid grid-cols-3 gap-2 p-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                className="w-8 h-8 rounded border border-gray-300 hover:scale-110 active:scale-95 transition-transform duration-200"
                style={{ backgroundColor: color.value }}
                title={color.name}
                onClick={() => setBodyBackground(color.value)}
              />
            ))}
          </div>
        </div>
      </ul>
    </div>
  );
};

const Header = ({ onSidebarToggle }) => {
  const { headerThemes, theme } = useContext(ThemeContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    let unsubscribe;
    const setupNotifications = async () => {
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
    };
    setupNotifications();
    return () => unsubscribe && unsubscribe();
  }, []);

  const handleSearchFocus = () => setSearchFocused(true);
  const handleSearchBlur = () => setSearchFocused(false);

  return (
    <header className="modern-header sticky-top" style={{ zIndex: 1001, position: 'sticky', top: 0 }}>
      <div className="header-background">
        <div className="header-gradient"></div>
      </div>
      
      <div className="header-content">
        <div className="header-left">
          <button 
            className="btn btn-link text-white d-md-none sidebar-mobile-toggle"
            onClick={onSidebarToggle}
          >
            <FaBars className="fs-5" />
          </button>
          <div className="logo-container">
            <Link to="/homevibook" className="text-decoration-none">
              <h1 className="logo-title mb-0">
                <span className="logo-vi">Vi</span>
                <span className="logo-book">Book</span>
              </h1>
              <small className="logo-subtitle">Developed by HuynhPhucTho-Web</small>
            </Link>
          </div>
          <div className={`search-container ${searchFocused ? 'focused' : ''}`}>
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search people, posts, groups..."
                className="search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              {searchValue && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchValue("")}
                >
                  ×
                </button>
              )}
            </div>
            {searchFocused && (
              <div className="search-dropdown">
                <div className="search-section">
                  <h6 className="search-section-title">Recent Searches</h6>
                  <div className="search-item">
                    <FaSearch className="search-item-icon" />
                    <span>React tutorials</span>
                  </div>
                  <div className="search-item">
                    <FaSearch className="search-item-icon" />
                    <span>Web development</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="nav-icons">
            <Link to="/profile" className="nav-icon-link" title="Profile">
              <div className="nav-icon-container">
                <FaUser className="nav-icon" />
              </div>
            </Link>
            <Link to="/messenger" className="nav-icon-link" title="Messenger">
              <div className="nav-icon-container">
                <FaFacebookMessenger className="nav-icon" />
              </div>
            </Link>
            <Link to="/notifications" className="nav-icon-link position-relative" title="Notifications">
              <div className="nav-icon-container">
                <FaBell className="nav-icon" />
                {unreadCount > 0 && (
                  <span className={`notification-badge ${unreadCount > 9 ? 'with-count' : 'pulse'}`}>
                    {unreadCount > 9 ? unreadCount : ''}
                  </span>
                )}
              </div>
            </Link>
            <ThemeDropdown />
          </div>
          <div className="user-profile">
            <div className="dropdown">
              <button
                className="btn btn-link p-0 user-avatar-btn"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="user-avatar">
                  <img 
                    src={auth.currentUser?.photoURL || "/default-avatar.png"} 
                    alt="User Avatar"
                    className="avatar-img"
                  />
                  <div className="online-indicator"></div>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end user-menu">
                <li className="user-menu-header">
                  <div className="d-flex align-items-center">
                    <img 
                      src={auth.currentUser?.photoURL || "/default-avatar.png"} 
                      alt="User Avatar"
                      className="user-menu-avatar"
                    />
                    <div>
                      <h6 className="mb-0">{auth.currentUser?.displayName || "User"}</h6>
                      <small className="text-muted">{auth.currentUser?.email}</small>
                    </div>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li><Link className="dropdown-item" to="/profile">View Profile</Link></li>
                <li><Link className="dropdown-item" to="/settings">Settings</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item text-danger"
                    onClick={() => auth.signOut()}
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;