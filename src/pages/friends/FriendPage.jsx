import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../components/firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import { requireLogin } from "../../utils/requireLogin";

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthReady(true);
      // Guests stay on "find"; logged-in users land on my friends
      if (user) setActiveTab((tab) => (tab === "find" ? "friends" : tab));
      else setActiveTab("find");
    });
    return () => unsubscribe();
  }, []);

  const isGuest = authReady && !currentUser;

  /** BR §9: private tabs → login toast (no content leak) */
  const openPrivateTab = (tab) => {
    if (!currentUser) {
      const message =
        tab === "requests"
          ? t("loginToViewFriendRequests")
          : t("loginToViewFriends");
      requireLogin({
        navigate,
        title: t("loginToastTitle"),
        message,
        from: "/friends",
        loginLabel: t("login"),
      });
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
    <div className={`friends-page ${theme}`}>
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <div className="friends-page__header d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
              <div>
                <h1 className="mb-1">{t("friends")}</h1>
                {isGuest && (
                  <p className="friends-page__guest-hint mb-0">
                    {t("guestFriendsHint")}
                  </p>
                )}
              </div>
            </div>

            <ul className="nav nav-tabs mb-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "friends"}
                  className={`nav-link ${activeTab === "friends" ? "active" : ""} ${
                    isGuest ? "is-locked" : ""
                  }`}
                  onClick={() => openPrivateTab("friends")}
                >
                  {t("myFriends")}
                  {isGuest && <span className="friends-page__lock" aria-hidden> 🔒</span>}
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "requests"}
                  className={`nav-link ${activeTab === "requests" ? "active" : ""} ${
                    isGuest ? "is-locked" : ""
                  }`}
                  onClick={() => openPrivateTab("requests")}
                >
                  {t("friendRequests")}
                  {isGuest && <span className="friends-page__lock" aria-hidden> 🔒</span>}
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "find"}
                  className={`nav-link ${activeTab === "find" ? "active" : ""}`}
                  onClick={() => setActiveTab("find")}
                >
                  {t("findFriends")}
                </button>
              </li>
            </ul>

            <div className="tab-content">
              {/* Guest always sees Find Friends only (BR §9 — no private data) */}
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
      </div>
    </div>
  );
};

export default Friends;
