import React, { useState, useEffect, useContext } from "react";
import { auth } from "../../components/firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../../context/ThemeContext";

import FriendRequests from "../../components/friends/FriendRequests";
import FriendsList from "../../components/friends/FriendsList";
import FindFriends from "../../components/friends/FindFriends";

const Friends = () => {
  const { theme } = useContext(ThemeContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("friends"); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  if (!currentUser) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className={`friends-page ${theme}`}>
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <h1 className="mb-4">Friends</h1>

            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "friends" ? "active" : ""}`}
                  onClick={() => setActiveTab("friends")}
                >
                  My Friends
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "requests" ? "active" : ""}`}
                  onClick={() => setActiveTab("requests")}
                >
                  Friend Requests
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "find" ? "active" : ""}`}
                  onClick={() => setActiveTab("find")}
                >
                  Find Friends
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "friends" && (
                <FriendsList currentUser={currentUser} theme={theme} />
              )}
              {activeTab === "requests" && (
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
