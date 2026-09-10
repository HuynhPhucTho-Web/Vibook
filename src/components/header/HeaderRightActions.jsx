import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell, FaFacebookMessenger } from "react-icons/fa";
import UserMenu from "./UserMenu";
import NotificationPopover from "./NotificationPopover";
import { auth } from "../firebase";

const HeaderRightActions = ({
  theme,
  setTheme,
  language,
  setLanguage,
  t,

  unreadCount,
  unreadMessagesCount,
  notifications = [],
  notificationPopoverOpen = false,
  setNotificationPopoverOpen,
  notificationRef,
  onMarkAsRead,
  onMarkAllAsRead,
  latestNewNotificationId,
  autoDismissTrigger = 0,
  autoDismissDuration = 5000,
  isAuthenticated = Boolean(auth.currentUser),

  userMenuOpen,
  setUserMenuOpen,

  mobileSettingsOpen,
  setMobileSettingsOpen,

  userMenuRef,

  closeAllPopups,
}) => {
  const navigate = useNavigate();
  const isLight = theme === "light";

  // Guest: Login only (hide messenger / notifications / user menu)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Link
          to="/login"
          onClick={closeAllPopups}
          className="vb-btn vb-btn--primary vb-btn--sm vb-btn--pill no-underline"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {/* Messenger icon - hidden on mobile */}
      <Link to="/messenger" title="Messenger" className="relative hidden md:block">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
            isLight
              ? "bg-black/5 hover:bg-black/10"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <FaFacebookMessenger
            className={`text-base sm:text-lg ${isLight ? "text-black" : "text-white"}`}
          />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-sm">
              {unreadMessagesCount}
            </span>
          )}
        </div>
      </Link>

      {/* Notifications icon + Popover */}
      <div className="relative" ref={notificationRef}>
        <button
          type="button"
          aria-label="Xem thông báo"
          title="Thông báo"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              navigate("/notifications");
              return;
            }
            setNotificationPopoverOpen?.((open) => !open);
            setUserMenuOpen?.(false);
            setMobileSettingsOpen?.(false);
          }}
          className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 group border ${
            notificationPopoverOpen
              ? "border-neon-purple/60 shadow-[0_0_12px_rgba(142,84,233,0.4)]"
              : "border-transparent"
          } ${
            isLight
              ? "bg-black/5 hover:bg-black/10 text-black"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
        >
          <FaBell
            className={`text-base sm:text-lg transition-colors group-hover:text-neon-purple ${
              unreadCount > 0 ? "text-neon-purple" : isLight ? "text-black" : "text-white"
            }`}
          />
          {unreadCount > 0 && (
            <>
              {/* Glowing ping indicator */}
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-purple opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-purple shadow-[0_0_8px_rgba(142,84,233,1)]" />
              </span>

              {/* Counter badge */}
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-neon-purple to-electric-blue text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm pointer-events-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </>
          )}
        </button>

        {/* Floating popover */}
        <NotificationPopover
          isOpen={notificationPopoverOpen}
          onClose={() => setNotificationPopoverOpen?.(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          theme={theme}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          latestNewNotificationId={latestNewNotificationId}
          autoDismissTrigger={autoDismissTrigger}
          autoDismissDuration={autoDismissDuration}
        />
      </div>

      {/* Avatar + menus */}
      <UserMenu
        theme={theme}
        setTheme={setTheme}
        language={language}
        setLanguage={setLanguage}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        mobileSettingsOpen={mobileSettingsOpen}
        setMobileSettingsOpen={setMobileSettingsOpen}
        userMenuRef={userMenuRef}
        t={t}
        closeAllPopups={closeAllPopups}
      />
    </div>
  );
};

export default HeaderRightActions;
