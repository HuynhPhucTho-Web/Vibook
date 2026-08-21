import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../components/firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { requireLogin } from "../../utils/requireLogin";
import "../../style/Friends.css";
import { useSearch } from "../../context/SearchContext";
import SEO from "../../components/SEO";

import FriendRequests from "../../components/friends/FriendRequests";
import FriendsList from "../../components/friends/FriendsList";
import FindFriends from "../../components/friends/FindFriends";

/**
 * Friends module — BR §9
 * Guest: only Find Friends content; My Friends / Requests tabs show login toast on click.
 * Logged-in: full tabs + private data.
 */
const Friends = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState("find");
  const { setSearchConfig } = useSearch();

  useEffect(() => {
    setSearchConfig({
      placeholder: "Tìm bạn bè...",
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (user) setActiveTab((tab) => (tab === "find" ? "friends" : tab));
      else setActiveTab("find");
    });
    return () => unsubscribe();
  }, []);

  const isGuest = authReady && !currentUser;

  /** BR §9: private tabs → smooth redirect to login (no content leak) */
  const openPrivateTab = (tab) => {
    if (!currentUser) {
      navigate("/login", { state: { from: "/friends" } });
      return;
    }
    setActiveTab(tab);
  };

  if (!authReady) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "70vh" }}
      >
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className={`page-shell friends-page ${theme}`}>
      <SEO
        title="Tìm kiếm bạn bè"
        description="Tìm kiếm bạn bè, gửi lời mời kết bạn và mở rộng vòng kết nối xã hội của bạn trên ThoDev."
        slug="/friends"
        noindex={true}
      />
      <div className="friends-page__header">
        <div className="friends-page__header-content">
          <h1>{t("friends")}</h1>
          {isGuest && <p className="friends-page__guest-hint">{t("guestFriendsHint")}</p>}
        </div>
      </div>

      <div className="friends-page__layout">
        <aside className="friends-page__sidebar">
          <div className="friends-page__sidebar-title">Explore</div>
          <nav className="friends-page__nav">
            <button
              type="button"
              onClick={() => openPrivateTab("friends")}
              className={`friends-page__nav-button ${activeTab === "friends" ? "is-active" : ""}`}
            >
              <span>{t("myFriends")}</span>
              {isGuest && <span className="friends-page__nav-lock">🔒</span>}
            </button>

            <button
              type="button"
              onClick={() => openPrivateTab("requests")}
              className={`friends-page__nav-button ${activeTab === "requests" ? "is-active" : ""}`}
            >
              <span>{t("friendRequests")}</span>
              {isGuest && <span className="friends-page__nav-lock">🔒</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("find")}
              className={`friends-page__nav-button ${activeTab === "find" ? "is-active" : ""}`}
            >
              <span>{t("findFriends")}</span>
            </button>
          </nav>
        </aside>

        <div className="friends-page__content">
          {(isGuest || activeTab === "find") && (
            <FindFriends currentUser={currentUser} theme={theme} />
          )}
          {!isGuest && activeTab === "friends" && (
            <FriendsList currentUser={currentUser} theme={theme} />
          )}
          {!isGuest && activeTab === "requests" && (
            <FriendRequests currentUser={currentUser} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
