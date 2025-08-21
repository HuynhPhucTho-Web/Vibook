import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaFacebookMessenger, FaBell, FaSearch, FaUser, FaBars } from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import { FaPalette, FaCheck, FaChevronDown } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { auth, db } from "../components/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import '../style/Header.css';

const ThemeDropdown = () => {
  const { 
    theme, 
    setTheme, 
    colorOptions, 
    extendedColorOptions, 
    setBodyBackground, 
    bodyBackground 
  } = useContext(ThemeContext);
  
  const [isOpen, setIsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dropdownRef = useRef(null);
  
  const themeOptions = [
    "light", "dark", "red", "blue", "green", "yellow", 
    "purple", "pink", "indigo", "teal", "orange", "cyan"
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleColorSelect = (color) => {
    setBodyBackground(color);
    // Don't close the dropdown immediately to allow multiple selections
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowColorPicker(false);
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-link text-white d-flex align-items-center theme-toggle p-2"
        type="button"
        onClick={toggleDropdown}
        style={{ border: 'none', background: 'none' }}
      >
        <div className="theme-icon-container me-2">
          {theme === "light" ? <CiSun className="theme-icon fs-5" /> : <GiMoon className="theme-icon fs-5" />}
        </div>
        <span className="theme-text text-capitalize d-none d-md-block me-1">{theme}</span>
        <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ fontSize: '0.7rem' }} />
      </button>
      
      {isOpen && (
        <div 
          className="theme-dropdown-menu position-absolute bg-white rounded shadow-lg border"
          style={{ 
            top: '100%', 
            right: 0, 
            minWidth: '340px',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '8px'
          }}
        >
          {/* Theme Options */}
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <CiSun className="me-2 text-primary" />
              <h6 className="mb-0 text-muted fw-bold small text-uppercase">Theme Style</h6>
            </div>
            <div className="row g-2">
              {themeOptions.map((option) => (
                <div key={option} className="col-6">
                  <button
                    className={`btn btn-sm w-100 d-flex align-items-center justify-content-start ${
                      theme === option ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => setTheme(option)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  >
                    <div 
                      className="theme-preview me-2 rounded" 
                      style={{
                        width: '16px',
                        height: '16px',
                        background: getThemePreviewColor(option)
                      }}
                    ></div>
                    <span className="text-capitalize">{option}</span>
                    {theme === option && <FaCheck className="ms-auto" style={{ fontSize: '0.7rem' }} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <hr className="my-2" />
          
          {/* Background Color Section */}
          <div className="p-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center">
                <FaPalette className="me-2 text-primary" />
                <h6 className="mb-0 text-muted fw-bold small text-uppercase">Background Color</h6>
              </div>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{ fontSize: '0.7rem' }}
              >
                {showColorPicker ? 'Hide' : 'More'}
              </button>
            </div>
            
            {/* Quick Color Options */}
            <div className="row g-1 mb-3">
              {colorOptions.map((color) => (
                <div key={color.value} className="col-2">
                  <button
                    className="color-option w-100 border rounded position-relative"
                    style={{ 
                      backgroundColor: color.value,
                      height: '32px',
                      border: bodyBackground === color.value ? '3px solid #0d6efd' : '2px solid #dee2e6',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    title={color.name}
                    onClick={() => handleColorSelect(color.value)}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {bodyBackground === color.value && (
                      <FaCheck 
                        className="position-absolute top-50 start-50 translate-middle text-primary" 
                        style={{ fontSize: '0.7rem', textShadow: '0 0 3px white' }}
                      />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Extended Color Picker */}
            {showColorPicker && (
              <div className="extended-color-picker border-top pt-3">
                {renderColorSection("Neutral Colors", extendedColorOptions.slice(0, 10), 2)}
                {renderColorSection("Blue Tones", extendedColorOptions.slice(10, 14), 3)}
                {renderColorSection("Green Tones", extendedColorOptions.slice(14, 18), 3)}
                {renderColorSection("Purple & Pink", extendedColorOptions.slice(18, 26), 3)}
                {renderColorSection("Warm Colors", extendedColorOptions.slice(26, 38), 2)}
              </div>
            )}
            
            {/* Current Background Preview */}
            <div className="current-bg-preview mt-3 p-2 border rounded bg-light">
              <div className="d-flex align-items-center">
                <div 
                  className="current-color-preview me-2 border rounded"
                  style={{ 
                    backgroundColor: bodyBackground, 
                    width: '24px', 
                    height: '24px',
                    boxShadow: '0 0 0 2px #fff, 0 0 0 3px #dee2e6'
                  }}
                ></div>
                <div>
                  <small className="text-muted fw-bold">Current Background</small>
                  <div className="small text-muted font-monospace">{bodyBackground}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .theme-toggle:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
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

  function renderColorSection(title, colors, colSize) {
    return (
      <div className="mb-3">
        <small className="text-muted fw-bold">{title}</small>
        <div className="row g-1 mt-1">
          {colors.map((color) => (
            <div key={color.value} className={`col-${colSize}`}>
              <button
                className="color-option w-100 border rounded position-relative"
                style={{ 
                  backgroundColor: color.value,
                  height: '28px',
                  border: bodyBackground === color.value ? '2px solid #0d6efd' : '1px solid #dee2e6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={color.name}
                onClick={() => handleColorSelect(color.value)}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                {bodyBackground === color.value && (
                  <FaCheck 
                    className="position-absolute top-50 start-50 translate-middle text-primary" 
                    style={{ fontSize: '0.6rem', textShadow: '0 0 3px white' }}
                  />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

// Helper function for theme preview colors
const getThemePreviewColor = (theme) => {
  const colors = {
    light: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
    dark: 'linear-gradient(45deg, #343a40, #212529)',
    red: 'linear-gradient(45deg, #dc3545, #c82333)',
    blue: 'linear-gradient(45deg, #007bff, #0056b3)',
    green: 'linear-gradient(45deg, #28a745, #1e7e34)',
    yellow: 'linear-gradient(45deg, #ffc107, #e0a800)',
    purple: 'linear-gradient(45deg, #6f42c1, #563d7c)',
    pink: 'linear-gradient(45deg, #e83e8c, #d91a72)',
    indigo: 'linear-gradient(45deg, #6610f2, #520dc2)',
    teal: 'linear-gradient(45deg, #20c997, #1aa179)',
    orange: 'linear-gradient(45deg, #fd7e14, #e8650e)',
    cyan: 'linear-gradient(45deg, #17a2b8, #138496)',
  };
  return colors[theme] || colors.light;
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
    <header className={`modern-header sticky-top ${headerThemes[theme]}`} style={{ zIndex: 1001, position: 'sticky', top: 0 }}>
      <div className="header-background">
        <div className="header-gradient"></div>
      </div>
      
      <div className="header-content container-fluid">
        <div className="header-left d-flex align-items-center">
          <button 
            className="btn btn-link text-white d-md-none sidebar-mobile-toggle me-2"
            onClick={onSidebarToggle}
          >
            <FaBars className="fs-5" />
          </button>
          <div className="logo-container me-4">
            <Link to="/homevibook" className="text-decoration-none">
              <h1 className="logo-title mb-0 text-white">
                <span className="logo-vi">Vi</span>
                <span className="logo-book">Book</span>
              </h1>
              <small className="logo-subtitle text-white-50">Developed by HuynhPhucTho-Web</small>
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
              <div className="search-dropdown position-absolute bg-white rounded shadow-lg border mt-1">
                <div className="search-section p-3">
                  <h6 className="search-section-title text-muted">Recent Searches</h6>
                  <div className="search-item d-flex align-items-center py-2">
                    <FaSearch className="search-item-icon me-2 text-muted" />
                    <span>React tutorials</span>
                  </div>
                  <div className="search-item d-flex align-items-center py-2">
                    <FaSearch className="search-item-icon me-2 text-muted" />
                    <span>Web development</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="header-right d-flex align-items-center">
          <div className="nav-icons d-flex align-items-center me-3">
            <Link to="/profile" className="nav-icon-link me-2" title="Profile">
              <div className="nav-icon-container">
                <FaUser className="nav-icon" />
              </div>
            </Link>
            <Link to="/messenger" className="nav-icon-link me-2" title="Messenger">
              <div className="nav-icon-container">
                <FaFacebookMessenger className="nav-icon" />
              </div>
            </Link>
            <Link to="/notifications" className="nav-icon-link position-relative me-2" title="Notifications">
              <div className="nav-icon-container">
                <FaBell className="nav-icon" />
                {unreadCount > 0 && (
                  <span className={`notification-badge position-absolute ${unreadCount > 9 ? 'with-count' : 'pulse'}`}>
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
                    className="avatar-img rounded-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                  <div className="online-indicator"></div>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end user-menu">
                <li className="user-menu-header p-3">
                  <div className="d-flex align-items-center">
                    <img 
                      src={auth.currentUser?.photoURL || "/default-avatar.png"} 
                      alt="User Avatar"
                      className="user-menu-avatar rounded-circle me-2"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
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

      {/* Custom Styles for Header */}
      <style jsx>{`
        .nav-icon-container {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .nav-icon-container:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        
        .nav-icon {
          color: white;
          font-size: 1.1rem;
        }
        
        .notification-badge {
          top: 0;
          right: 0;
          background-color: #dc3545;
          color: white;
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
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
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
        
        .search-input {
          width: 100%;
          padding: 8px 40px 8px 35px;
          border: none;
          border-radius: 20px;
          background-color: rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 0.9rem;
        }
        
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .search-input:focus {
          outline: none;
          background-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          color: rgba(255, 255, 255, 0.7);
          z-index: 1;
        }
        
        .search-clear {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
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
          background-color: #f8f9fa;
        }
        
        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background-color: #28a745;
          border-radius: 50%;
          border: 2px solid white;
        }
        
        .user-avatar {
          position: relative;
        }
        
        .logo-vi {
          color: #ff6b6b;
          font-weight: bold;
        }
        
        .logo-book {
          color: #4ecdc4;
          font-weight: bold;
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