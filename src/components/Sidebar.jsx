import React, { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaHome, FaUser, FaUserPlus, FaUsers, FaCalendarAlt, FaVideo, FaGamepad,
  FaSignOutAlt, FaBars, FaTimes
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "../components/firebase";
import { toast } from "react-toastify";
import "../style/Sidebar.css";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

// ======= constants =======
const HEADER_HEIGHT = 78;
const COLLAPSED_WIDTH = 72;   
const EXPANDED_WIDTH  = 200; 
const MOBILE_BREAKPOINT = 768;

const MENU = [
  { path: "/homevibook", icon: FaHome, labelKey: "home" },
  { path: "/profile",    icon: FaUser, labelKey: "profile" },
  { path: "/friends",    icon: FaUserPlus, labelKey: "friends" },
  { path: "/groups",     icon: FaUsers, labelKey: "groups" },
  { path: "/events",     icon: FaCalendarAlt, labelKey: "events" },
  { path: "/story",      icon: FaVideo, labelKey: "story" },
  { path: "/playgame",   icon: FaGamepad, labelKey: "playGame" },
];

export default function Sidebar() {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const location = useLocation();

  // ======= state =======
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  // ======= responsive =======
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = (e) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setIsCollapsed(false); // mobile luôn full width, không dùng collapsed
      }
    };
    onChange(mq);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Đóng menu mobile khi đổi route
  useEffect(() => {
    if (isMobile) setIsMobileOpen(false);
  }, [location.pathname, isMobile]);

  // Persist trạng thái thu gọn (chỉ desktop)
  useEffect(() => {
    if (!isMobile) localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed, isMobile]);

  const sidebarWidth = useMemo(
    () => (isCollapsed && !isMobile ? COLLAPSED_WIDTH : EXPANDED_WIDTH),
    [isCollapsed, isMobile]
  );

  // ======= actions =======
  const toggleSidebar = () => {
    if (isMobile) setIsMobileOpen(v => !v);
    else setIsCollapsed(v => !v);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully", { position: "top-center" });
    } catch (e) {
      toast.error(`Failed to log out: ${e.message}`, { position: "top-center" });
    }
  };

  const menuItems = useMemo(() => {
    const isOnProfilePage = location.pathname.startsWith('/profile/');
    return MENU.map(item => {
      if (item.labelKey === "profile") {
        return { ...item, path: isOnProfilePage ? location.pathname : '/profile' };
      }
      return item;
    });
  }, [location.pathname]);

  // ======= render =======
  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && !isMobileOpen && (
        <button
          className={`sidebar__mobile-toggle sidebar--${theme === "light" ? "light" : "dark"}`}
          aria-label={t("openMenu")}
          onClick={toggleSidebar}
        >
          <FaBars />
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <button
          className="sidebar__backdrop"
          aria-label={t("closeMenu")}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main"
        className={[
          "sidebar",
          `sidebar--${theme === "light" ? "light" : "dark"}`,
          isMobile ? "is-mobile" : "",
          isMobileOpen ? "is-open" : "",
          isCollapsed && !isMobile ? "is-collapsed" : ""
        ].join(" ").replace(/\s+/g, " ").trim()}
        style={{ top: HEADER_HEIGHT, height: `calc(100vh - ${HEADER_HEIGHT}px)`, width: sidebarWidth, zIndex: isMobile && isMobileOpen ? 1002 : 1001 }}
      >
        {/* Header */}
        <div className="sidebar__header">
          <button
            className="sidebar__toggle"
            onClick={toggleSidebar}
            aria-label={isMobile ? (isMobileOpen ? t("closeMenu") : t("openMenu"))
                                 : (isCollapsed ? t("expandSidebar") : t("collapseSidebar"))}
            aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
            aria-controls="sidebar-menu"
          >
            {(isMobile && isMobileOpen) || (!isMobile && !isCollapsed) ? <FaTimes /> : <FaBars />}
          </button>

          {(!isCollapsed || isMobile) && (
            <h5 className="sidebar__brand" title="ViBook"></h5>
          )}
        </div>

        {/* Menu */}
        <nav id="sidebar-menu" className="sidebar__menu" aria-label="Primary">
          <ul>
            {menuItems.map(({ path, icon: Icon, labelKey }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={path === "/profile"} // Add this to avoid parent route matching
                  className={({ isActive }) =>
                    "sidebar__link" +
                    (isActive ? " is-active" : "") +
                    (isCollapsed && !isMobile ? " is-icon" : "")
                  }
                  aria-current={({ isActive }) => (isActive ? "page" : undefined)}
                  title={isCollapsed && !isMobile ? t(labelKey) : undefined}
                >
                  <Icon className="sidebar__icon" />
                  {(!isCollapsed || isMobile) && (
                    <span className="sidebar__label">{t(labelKey)}</span>
                  )}
                  {({ isActive }) =>
                    isActive && (!isCollapsed || isMobile) ? (
                      <i className="sidebar__active-bar" />
                    ) : null
                  }
                </NavLink>
              </li>
            ))}
          </ul>

          <button
            className={"sidebar__logout" + (isCollapsed && !isMobile ? " is-icon" : "")}
            onClick={handleLogout}
            disabled={!auth.currentUser}
            title={isCollapsed && !isMobile ? t("logout") : undefined}
          >
            <FaSignOutAlt className="sidebar__icon" />
            {(!isCollapsed || isMobile) && <span className="sidebar__label">{t("logout")}</span>}
          </button>
        </nav>
      </aside>

      {/* Spacer giữ layout desktop */}
      {!isMobile && (
        <div style={{ width: sidebarWidth, transition: "width .25s ease", flexShrink: 0 }} />
      )}
    </>
  );
}
