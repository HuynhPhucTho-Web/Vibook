import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaUsers,
  FaCalendarAlt,
  FaVideo,
  FaGamepad ,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "../components/firebase";
import { toast } from "react-toastify";
import "../style/Sidebar.css";
import { ThemeContext } from "../context/ThemeContext";

const Sidebar = () => {
  const { theme } = useContext(ThemeContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsCollapsed(false);
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully", { position: "top-center" });
    } catch (error) {
      toast.error("Failed to log out: " + error.message, { position: "top-center" });
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const menuItems = [
    { path: "/homevibook", icon: FaHome, label: "Home" },
    { path: "/profile", icon: FaUser, label: "Profile" },
    { path: "/groups", icon: FaUsers, label: "Groups" },
    { path: "/events", icon: FaCalendarAlt, label: "Events" },
    { path: "/story", icon: FaVideo, label: "Story" },
    { path: "/playgame", icon: FaGamepad, label: "Play-Game" },
  ];

  const isActive = (path) => location.pathname === path;
  const sidebarWidth = isCollapsed ? "70px" : "280px";

  // Dynamic styles based on theme
  const headerHeight = 80;

  const modernSidebarStyles = {
    width: sidebarWidth,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "fixed",
    top: `${headerHeight}px`,
    left: 0,
    height: `calc(100vh - ${headerHeight}px)`,
    background: theme === 'light'
      ? "rgba(255, 255, 255, 0.95)"
      : "rgba(0, 0, 0, 0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
    borderLeft: "none",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    zIndex: 1001,
  };

  const headerStyles = {
    padding: "1.5rem 1rem",
    borderBottom: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
    background: theme === 'light'
      ? "rgba(0, 0, 0, 0.03)"
      : "rgba(255, 255, 255, 0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const toggleButtonStyles = {
    background: theme === 'light'
      ? "rgba(0, 0, 0, 0.1)"
      : "rgba(255, 255, 255, 0.1)",
    border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
    borderRadius: "12px",
    padding: "8px",
    color: theme === 'light' ? "#000" : "#fff",
    transition: "all 0.3s ease",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const menuContainerStyles = {
    padding: "1rem 0.5rem",
    height: "calc(100vh - 100px)",
    overflowY: "auto",
  };

  const menuItemStyles = (active) => ({
    margin: "0.25rem 0.5rem",
    borderRadius: "16px",
    overflow: "hidden",
    background: active
      ? (theme === 'light' ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)")
      : "transparent",
    border: active
      ? `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`
      : "1px solid transparent",
    transition: "all 0.3s ease",
    position: "relative",
  });

  const linkStyles = (active) => ({
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: active
      ? (theme === 'light' ? "#000" : "#fff")
      : (theme === 'light' ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)"),
    transition: "all 0.3s ease",
    fontWeight: active ? "600" : "500",
    fontSize: "0.9rem",
    position: "relative",
  });

  const iconStyles = {
    fontSize: "1.1rem",
    minWidth: "20px",
    marginRight: isCollapsed && !isMobile ? "0" : "12px",
  };

  const logoutButtonStyles = {
    background: "rgba(220, 53, 69, 0.1)",
    border: "1px solid rgba(220, 53, 69, 0.3)",
    borderRadius: "12px",
    color: "rgba(220, 53, 69, 0.9)",
    padding: "12px 16px",
    margin: "0.5rem",
    fontWeight: "500",
    transition: "all 0.3s ease",
  };

  const mobileToggleStyles = {
    position: "fixed",
    top: "1rem",
    left: "1rem",
    zIndex: 1002,
    background: theme === 'light'
      ? "rgba(0, 0, 0, 0.1)"
      : "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
    borderRadius: "12px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme === 'light' ? "#000" : "#fff",
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          className={`position-fixed w-100 h-100 ${isMobileOpen ? "d-block" : "d-none"}`}
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            top: 0,
            left: 0,
          }}
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="btn"
          onClick={toggleSidebar}
          style={mobileToggleStyles}
        >
          <FaBars />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`${isMobile
          ? isMobileOpen
            ? "d-block"
            : "d-none"
          : "d-block"
          }`}
        style={modernSidebarStyles}
      >
        {/* Header */}
        <div style={headerStyles}>
          <button
            style={toggleButtonStyles}
            onClick={isMobile ? closeMobileSidebar : toggleSidebar}
            onMouseOver={(e) => {
              e.target.style.background = theme === 'light'
                ? "rgba(0, 0, 0, 0.2)"
                : "rgba(255, 255, 255, 0.2)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = theme === 'light'
                ? "rgba(0, 0, 0, 0.1)"
                : "rgba(255, 255, 255, 0.1)";
            }}
          >
            {(isMobile || !isCollapsed) ? <FaTimes /> : <FaBars />}
          </button>

          {(!isCollapsed || isMobile) && (
            <h5
              className="mb-0 ms-3"
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
            </h5>
          )}
        </div>

        {/* Menu */}
        <div style={menuContainerStyles}>
          <ul className="list-unstyled mb-0">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path} style={menuItemStyles(active)}>
                  <Link
                    to={item.path}
                    style={{
                      ...linkStyles(active),
                      justifyContent: isCollapsed && !isMobile ? "center" : "flex-start",
                    }}
                    title={isCollapsed && !isMobile ? item.label : ""}
                    onClick={closeMobileSidebar}
                    onMouseOver={(e) => {
                      if (!active) {
                        e.currentTarget.closest("li").style.background =
                          theme === 'light'
                            ? "rgba(0, 0, 0, 0.08)"
                            : "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.closest("li").style.border =
                          `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'}`;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!active) {
                        e.currentTarget.closest("li").style.background = "transparent";
                        e.currentTarget.closest("li").style.border =
                          "1px solid transparent";
                      }
                    }}
                  >
                    <IconComponent
                      style={{
                        ...iconStyles,
                        marginRight: isCollapsed && !isMobile ? "0" : "12px",
                      }}
                    />
                    {/* Chỉ hiển thị label khi không thu nhỏ */}
                    {(!isCollapsed || isMobile) && (
                      <span style={{ opacity: active ? 1 : 0.9 }}>{item.label}</span>
                    )}

                    {/* Highlight bar chỉ hiện khi sidebar mở */}
                    {active && (!isCollapsed || isMobile) && (
                      <div
                        style={{
                          position: "absolute",
                          right: "8px",
                          width: "4px",
                          height: "20px",
                          background: "linear-gradient(135deg, #667eea, #764ba2)",
                          borderRadius: "2px",
                          boxShadow: "0 0 10px rgba(102, 126, 234, 0.4)",
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Logout */}
          <button
            style={logoutButtonStyles}
            className={`btn w-100 d-flex align-items-center logout-btn ${isCollapsed && !isMobile ? "justify-content-center" : "justify-content-start"
              }`}
            onClick={handleLogout}
            disabled={!auth.currentUser}
            title={isCollapsed && !isMobile ? "Logout" : ""}
          >
            <FaSignOutAlt style={iconStyles} />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>

        </div>
      </aside>

      {/* Spacer */}
      {!isMobile && (
        <div
          style={{
            width: sidebarWidth,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
          }}
        />
      )}

      {/* Custom Styles */}
      <style jsx>{`
        /* Scrollbar cho theme light */
        ${theme === 'light' ? `
          div::-webkit-scrollbar {
            width: 6px;
          }
          
          div::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.5);
          }
        ` : `
          div::-webkit-scrollbar {
            width: 6px;
          }
          
          div::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}

        /* Animation cho menu items */
        li {
          transform: translateX(0);
          transition: all 0.3s ease;
        }
        
        li:hover {
          transform: translateX(4px);
        }
        
        /* Smooth transitions */
        * {
          transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          aside {
            width: 280px !important;
          }
        }

        /* Focus states */
        button:focus,
        a:focus {
          outline: 2px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
};

export default Sidebar;