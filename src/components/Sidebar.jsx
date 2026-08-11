import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserPlus,
  FaUsers,
  FaCalendarAlt,
  FaVideo,
  FaGamepad,
  FaShoppingBag,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaYoutube,
  FaCog,
  FaFacebookMessenger,
  FaBlog,
  FaInfoCircle,
  FaBookOpen,
} from "react-icons/fa";

import "bootstrap/dist/css/bootstrap.min.css";
import { auth } from "../components/firebase";
import { toast } from "react-toastify";
import "../style/Sidebar.css";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { requireLogin } from "../utils/requireLogin";

// ======= constants =======
const DEFAULT_HEADER_HEIGHT = 100; // fallback nếu không đo được

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 200;
const MOBILE_BREAKPOINT = 768;

// Guest: public items + Settings (page open; private sections gated inside page).
// Messenger locked → toast; /messenger URL still behind RequireAuth.
const MENU = [
  { path: "/homevibook", icon: FaHome, labelKey: "home", requiresAuth: false },
  { path: "/friends", icon: FaUserPlus, labelKey: "friends", requiresAuth: false },
  { path: "/blog", icon: FaBlog, labelKey: "blog", requiresAuth: false },
  { path: "/source", icon: FaBookOpen, labelKey: "source", requiresAuth: false },
  // { path: "/groups", icon: FaUsers, labelKey: "groups", requiresAuth: false },
  { path: "/events", icon: FaCalendarAlt, labelKey: "events", requiresAuth: false },
  { path: "/videos", icon: FaYoutube, labelKey: "video", requiresAuth: false },
  // { path: "/story", icon: FaVideo, labelKey: "story", requiresAuth: false },
  // { path: "/playgame", icon: FaGamepad, labelKey: "playGame", requiresAuth: false },
  
  // { path: "/market", icon: FaShoppingBag, labelKey: "store", requiresAuth: false },
  {
    path: "/messenger",
    icon: FaFacebookMessenger,
    labelKey: "messenger",
    requiresAuth: true,
    loginMessageKey: "loginToMessenger",
  },
  { path: "/settings", icon: FaCog, labelKey: "settings", requiresAuth: false },
  { path: "/about", icon: FaInfoCircle, labelKey: "about", requiresAuth: false },
];

export default function Sidebar() {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(auth.currentUser),
  );

  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    return auth.onAuthStateChanged((user) => setIsAuthenticated(Boolean(user)));
  }, []);
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.top === "number" && !isNaN(parsed.top) &&
          typeof parsed.left === "number" && !isNaN(parsed.left)
        ) {
          return parsed;
        }
      }
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
      const header = document.querySelector("[data-app-header]");
      if (header) {
        setHeaderHeight(header.offsetHeight);
      } else {
        setHeaderHeight(DEFAULT_HEADER_HEIGHT);
      }
    };
    updateHeaderHeight();
    const header = document.querySelector("[data-app-header]");
    const observer = header ? new ResizeObserver(updateHeaderHeight) : null;
    if (header) observer.observe(header);
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
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

  // Listen for closeSidebar event
  useEffect(() => {
    const handleCloseSidebar = () => {
      if (isMobile) setIsMobileOpen(false);
    };
    window.addEventListener("closeSidebar", handleCloseSidebar);
    return () => window.removeEventListener("closeSidebar", handleCloseSidebar);
  }, [isMobile]);

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
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.addEventListener("mouseenter", resetTimer);
      sidebar.addEventListener("mouseleave", resetTimer);
      sidebar.addEventListener("click", resetTimer);
      sidebar.addEventListener("touchstart", resetTimer);
      sidebar.addEventListener("touchend", resetTimer);
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      if (sidebar) {
        sidebar.removeEventListener("mouseenter", resetTimer);
        sidebar.removeEventListener("mouseleave", resetTimer);
        sidebar.removeEventListener("click", resetTimer);
        sidebar.removeEventListener("touchstart", resetTimer);
        sidebar.removeEventListener("touchend", resetTimer);
      }
    };
  }, [isMobile, isMobileOpen]);

  // Persist trạng thái thu gọn (chỉ desktop)
  useEffect(() => {
    if (!isMobile)
      localStorage.setItem("sidebar_collapsed", String(isCollapsed));
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
      const minTop = headerHeight + margin;
      const maxTop = Math.max(minTop, window.innerHeight - size - margin);

      const clampedLeft = Math.min(Math.max(margin, newLeft), maxLeft);
      const clampedTop = Math.min(Math.max(minTop, newTop), maxTop);

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
    [isCollapsed, isMobile],
  );

  // ======= actions =======
  const toggleSidebar = () => {
    if (isMobile) setIsMobileOpen((v) => !v);
    else setIsCollapsed((v) => !v);
  };

  const loginMessageFor = (item) => {
    if (item.loginMessageKey) return t(item.loginMessageKey);
    return t("loginToContinue");
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully", { position: "top-center" });
    } catch (e) {
      toast.error(`Failed to log out: ${e.message}`, {
        position: "top-center",
      });
    }
  };

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
            top: `${Math.max(headerHeight + 8, fabPosition.top)}px`,
            left: `${fabPosition.left}px`,
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
          isCollapsed && !isMobile ? "is-collapsed" : "",
        ]
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()}
        style={{
          top: "var(--app-header-height, 72px)",
          height: "calc(100dvh - var(--app-header-height, 72px))",
          width: sidebarWidth,
          zIndex: 1002,
        }}
      >
        {/* Header */}
        <div className="sidebar__header">
          <button
            className="sidebar__toggle"
            onClick={toggleSidebar}
            aria-label={
              isMobile
                ? isMobileOpen
                  ? t("closeMenu")
                  : t("openMenu")
                : isCollapsed
                  ? t("expandSidebar")
                  : t("collapseSidebar")
            }
            aria-expanded={isMobile ? isMobileOpen : !isCollapsed}
            aria-controls="sidebar-menu"
          >
            {(isMobile && isMobileOpen) || (!isMobile && !isCollapsed) ? (
              <FaTimes />
            ) : (
              <FaBars />
            )}
          </button>

          {(!isCollapsed || isMobile) && (
            <h5 className="sidebar__brand" title="ViBook"></h5>
          )}
        </div>

        {/* Menu */}
        <nav id="sidebar-menu" className="sidebar__menu" aria-label="Primary">
          <ul>
            {MENU.map((item) => {
              const { path, icon: Icon, labelKey, requiresAuth } = item;
              return (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      "sidebar__link" +
                      (isActive ? " is-active" : "") +
                      (isCollapsed && !isMobile ? " is-icon" : "") +
                      (requiresAuth && !isAuthenticated ? " is-locked" : "")
                    }
                    title={
                      isCollapsed && !isMobile
                        ? t(labelKey)
                        : requiresAuth && !isAuthenticated
                          ? loginMessageFor(item)
                          : undefined
                    }
                    onClick={(e) => {
                      if (requiresAuth && !auth.currentUser) {
                        e.preventDefault();
                        // BR §4/§14: toast + Login — không redirect thẳng từ sidebar
                        requireLogin({
                          navigate,
                          title: t("loginToastTitle"),
                          message: loginMessageFor(item),
                          from: path,
                          loginLabel: t("login"),
                        });
                      }
                    }}
                  >
                    {React.createElement(Icon, { className: "sidebar__icon" })}
                    {(!isCollapsed || isMobile) && (
                      <span className="sidebar__label">{t(labelKey)}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* BR §4: Logout always visible; disabled for guest */}
          <button
            className={
              "sidebar__logout" + (isCollapsed && !isMobile ? " is-icon" : "")
            }
            onClick={handleLogout}
            disabled={!isAuthenticated}
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
            flexShrink: 0,
          }}
        />
      )}
    </>
  );
}
