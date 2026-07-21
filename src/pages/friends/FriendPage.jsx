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
      // Guests default to "find" (public browse); logged-in users keep/see friends
      if (user) setActiveTab((tab) => (tab === "find" ? "friends" : tab));
      else setActiveTab("find");
    });
    return () => unsubscribe();
  }, []);

  const openPrivateTab = (tab) => {
    if (!currentUser) {
      requireLogin({
        navigate,
        message: t("loginRequired") || "Please log in to continue",
        from: "/friends",
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
            <h1 className="mb-4">{t("friends")}</h1>

            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === "friends" ? "active" : ""}`}
                  onClick={() => openPrivateTab("friends")}
                >
                  {t("myFriends")}
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === "requests" ? "active" : ""}`}
                  onClick={() => openPrivateTab("requests")}
                >
                  {t("friendRequests")}
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === "find" ? "active" : ""}`}
                  onClick={() => setActiveTab("find")}
                >
                  {t("findFriends")}
                </button>
              </li>
            </ul>

            <div className="tab-content">
              {activeTab === "friends" && currentUser && (
                <FriendsList currentUser={currentUser} theme={theme} />
              )}
              {activeTab === "requests" && currentUser && (
                <FriendRequests currentUser={currentUser} theme={theme} />
              )}
              {activeTab === "find" && (
                <FindFriends currentUser={currentUser} theme={theme} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
