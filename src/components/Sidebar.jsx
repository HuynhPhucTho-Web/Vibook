import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaUsers, FaCalendarAlt, FaVideo, FaStore, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import { auth } from "../components/firebase";
import { toast } from "react-toastify";
import '../style/Sidebar.css';
import { ThemeProvider } from "../context/ThemeProvider";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsCollapsed(false); // Reset collapsed state on mobile
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out:", auth.currentUser);
      await auth.signOut();
      console.log("Logout successful");
      toast.success("Logged out successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error logging out:", error);
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
    { path: '/homevibook', icon: FaHome, label: 'Home' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
    { path: '/groups', icon: FaUsers, label: 'Groups' },
    { path: '/events', icon: FaCalendarAlt, label: 'Events' },
    { path: '/story', icon: FaVideo, label: 'Story' },
    { path: '/playgame', icon: FaStore, label: 'Play-Game' }
  ];

  const isActive = (path) => location.pathname === path;

  const sidebarWidth = isCollapsed ? '70px' : '280px'; // Fixed widths for stability

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div 
          className={`sidebar-backdrop ${isMobileOpen ? 'show' : ''}`}
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="btn btn-primary mobile-toggle"
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1002,
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaBars />
        </button>
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar-container ${isMobile ? (isMobileOpen ? 'mobile-open expanded' : 'expanded') : (isCollapsed ? 'collapsed' : 'expanded')}`}
        style={{ width: sidebarWidth, transition: 'width 0.3s ease' }}
      >
        {/* Header with toggle button */}
        <div className="sidebar-header">
          {!isMobile && (
            <button 
              className="btn btn-outline-primary toggle-btn"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <FaBars /> : <FaTimes />}
            </button>
          )}
          
          {isMobile && (
            <button 
              className="btn btn-outline-light toggle-btn"
              onClick={closeMobileSidebar}
            >
              <FaTimes />
            </button>
          )}
          
          {(!isCollapsed || isMobile) && (
            <h5 className="sidebar-title mb-0 ms-2">
              <span style={{
                background: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}>
                ViBook
              </span>
            </h5>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="card shadow-sm border-0">
          <ul className="list-group list-group-flush">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              
              return (
                <ThemeProvider>
                <li key={index} className="list-group-item border-0 px-0">
                  <Link 
                    to={item.path} 
                    className={`sidebar-link d-flex align-items-center text-decoration-none ${active ? 'active' : ''}`}
                    title={(isCollapsed && !isMobile) ? item.label : ''}
                    onClick={closeMobileSidebar}
                  >
                    <div className="icon-container">
                      <IconComponent className="sidebar-icon" />
                    </div>
                    <span className={`sidebar-text ${(isCollapsed && !isMobile) ? 'hidden' : 'visible'}`}>
                      {item.label}
                    </span>
                    {active && (
                      <div 
                        className="active-indicator"
                        style={{
                          marginLeft: 'auto',
                          width: '4px',
                          height: '20px',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          borderRadius: '2px'
                        }}
                      />
                    )}
                  </Link>
                </li>
                 </ThemeProvider>
              );
            })}
            
            {/* Logout Button */}
            <li className="list-group-item border-0 px-0 mt-3">
              <button
                className={`logout-btn btn btn-outline-danger w-100 d-flex align-items-center ${
                  (isCollapsed && !isMobile) ? 'justify-content-center' : 'justify-content-start'
                }`}
                onClick={handleLogout}
                disabled={!auth.currentUser}
                title={(isCollapsed && !isMobile) ? "Logout" : ''}
              >
                <div className="icon-container">
                  <FaSignOutAlt className="sidebar-icon" />
                </div>
                <span className={`sidebar-text ms-2 ${(isCollapsed && !isMobile) ? 'hidden' : 'visible'}`}>
                  Logout
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* Footer */}
        {(!isCollapsed || isMobile) && (
          <div className="sidebar-footer mt-auto pt-3">
            <div className="text-center">
              <small className="text-light opacity-75">
                Made with ❤️ by ViBook Team
              </small>
            </div>
          </div>
        )}
      </aside>

      {/* Spacer for content when sidebar is expanded on desktop */}
      {!isMobile && (
        <div 
          className="sidebar-spacer"
          style={{
            width: sidebarWidth,
            transition: 'width 0.3s ease',
            flexShrink: 0
          }}
        />
      )}
     </>
  );
};

export default Sidebar;