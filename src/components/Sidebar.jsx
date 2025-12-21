import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaHome, FaUser, FaUserPlus, FaUsers, FaCalendarAlt, FaVideo, FaGamepad, FaStore,
  FaShoppingBag, FaClipboardList, FaStoreAlt,
  FaSignOutAlt, FaBars, FaTimes
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "../components/firebase";
import { toast } from "react-toastify";
import "../style/Sidebar.css";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";

// ======= constants =======
const DEFAULT_HEADER_HEIGHT = 100;          // fallback nếu không đo được

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
  { path: "/market",     icon: FaShoppingBag, labelKey: "market" },
];

export default function Sidebar() {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);

  // ---- VỊ TRÍ NÚT FLOATING (MOBILE) ----
  const [fabPosition, setFabPosition] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_fab_position");
      if (saved) return JSON.parse(saved);
    } catch {
      // Silently ignore parsing errors for stored position
    }
    return { top: 16, left: 16 }; // vị trí mặc định
  });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isDraggingFab, setIsDraggingFab] = useState(false);
  const dragMovedRef = useRef(false);
  const autoCloseTimerRef = useRef(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setHeaderHeight(header.offsetHeight);
      } else {
        setHeaderHeight(DEFAULT_HEADER_HEIGHT);
      }
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  // ======= responsive =======
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = (e) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setIsCollapsed(false); // mobile luôn full width
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

  // Auto-close sidebar after 5 seconds of inactivity (mobile only)
  useEffect(() => {
    if (!isMobile || !isMobileOpen) {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      return;
    }

    const startAutoCloseTimer = () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      autoCloseTimerRef.current = setTimeout(() => {
        setIsMobileOpen(false);
      }, 5000); // 5 seconds
    };

    const resetTimer = () => {
      startAutoCloseTimer();
    };

    // Start timer when sidebar opens
    startAutoCloseTimer();

    // Add event listeners to reset timer on interaction
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.addEventListener('mouseenter', resetTimer);
      sidebar.addEventListener('mouseleave', resetTimer);
      sidebar.addEventListener('click', resetTimer);
      sidebar.addEventListener('touchstart', resetTimer);
      sidebar.addEventListener('touchend', resetTimer);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', resetTimer);
        sidebar.removeEventListener('mouseleave', resetTimer);
        sidebar.removeEventListener('click', resetTimer);
        sidebar.removeEventListener('touchstart', resetTimer);
        sidebar.removeEventListener('touchend', resetTimer);
      }
    };
  }, [isMobile, isMobileOpen]);

  // Persist trạng thái thu gọn (chỉ desktop)
  useEffect(() => {
    if (!isMobile) localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed, isMobile]);

  // Lưu vị trí vào localStorage
  useEffect(() => {
    localStorage.setItem("sidebar_fab_position", JSON.stringify(fabPosition));
  }, [fabPosition]);

  // Hàm handle drag (chuột + cảm ứng)
  const startDrag = (clientX, clientY) => {
    dragOffsetRef.current = {
      x: clientX - fabPosition.left,
      y: clientY - fabPosition.top,
    };
    dragMovedRef.current = false;
    setIsDraggingFab(true);
  };

  const handleFabMouseDown = (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleFabTouchStart = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDraggingFab) return;

    const handleMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      const clientX = point.clientX;
      const clientY = point.clientY;

      const newLeft = clientX - dragOffsetRef.current.x;
      const newTop = clientY - dragOffsetRef.current.y;

      // giới hạn trong màn hình
      const margin = 8;
      const size = 56; // ~ kích thước nút
      const maxLeft = window.innerWidth - size - margin;
      const maxTop = window.innerHeight - size - margin;

      const clampedLeft = Math.min(Math.max(margin, newLeft), maxLeft);
      const clampedTop = Math.min(Math.max(margin, newTop), maxTop);

      setFabPosition({ left: clampedLeft, top: clampedTop });

      // nếu kéo đi xa một chút thì coi như drag, không tính click
      if (
        Math.abs(clampedLeft - fabPosition.left) > 3 ||
        Math.abs(clampedTop - fabPosition.top) > 3
      ) {
        dragMovedRef.current = true;
      }
    };

    const handleUp = () => {
      setIsDraggingFab(false);
      // nếu không thực sự kéo (chỉ chạm), coi như click để mở menu
      if (!dragMovedRef.current) {
        toggleSidebar();
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDraggingFab, fabPosition]); // toggleSidebar là function stable ở trên

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
    const isOnProfilePage = location.pathname.startsWith("/profile/");
    return MENU.map(item => {
      if (item.labelKey === "profile") {
        return { ...item, path: isOnProfilePage ? location.pathname : "/profile" };
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
          // KHÔNG dùng onClick ở đây nữa, click sẽ xử lý trong handleUp ở useEffect
          onMouseDown={handleFabMouseDown}
          onTouchStart={handleFabTouchStart}
          style={{
            top: fabPosition.top,
            left: fabPosition.left,
          }}
        >
          <FaBars />
        </button>
      )}

      {/* Mobile backdrop (bắt đầu từ dưới header) */}
      {isMobile && isMobileOpen && (
        <button
          className="sidebar__backdrop"
          style={{ top: headerHeight }}
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
        // 👉 sidebar luôn nằm ngay dưới header, cả mobile + desktop
        style={{
          top: headerHeight,
          height: `calc(100vh - ${headerHeight}px)`,
          width: sidebarWidth,
          zIndex: 1002
        }}
      >
        {/* Header */}
        <div className="sidebar__header">
          <button
            className="sidebar__toggle"
            onClick={toggleSidebar}
            aria-label={
              isMobile
                ? (isMobileOpen ? t("closeMenu") : t("openMenu"))
                : (isCollapsed ? t("expandSidebar") : t("collapseSidebar"))
            }
            aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
            aria-controls="sidebar-menu"
          >
            {(isMobile && isMobileOpen) || (!isMobile && !isCollapsed)
              ? <FaTimes />
              : <FaBars />}
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
                  end={path === "/profile"}
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
            {(!isCollapsed || isMobile) && (
              <span className="sidebar__label">{t("logout")}</span>
            )}
          </button>
        </nav>
      </aside>

      {/* Spacer giữ layout desktop */}
      {!isMobile && (
        <div
          style={{
            width: sidebarWidth,
            transition: "width .25s ease",
            flexShrink: 0
          }}
        />
      )}
    </>
  );
}
