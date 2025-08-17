import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebookMessenger, FaBell, FaSearch, FaUser } from "react-icons/fa";
import { CiSun } from "react-icons/ci";
import { GiMoon } from "react-icons/gi";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../contexts/ThemeContext";
import { auth, db } from "../components/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const ThemeDropdown = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const themeOptions = [
    "light",
    "dark",
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "indigo",
    "teal",
    "orange",
    "cyan",
  ];

  return (
    <div className="dropdown">
      <button
        className="btn btn-link text-white d-flex align-items-center"
        type="button"
        id="themeDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {theme === "light" ? <CiSun className="fs-5 me-2" /> : <GiMoon className="fs-5 me-2" />}
        <span className="text-capitalize">{theme}</span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="themeDropdown">
        {themeOptions.map((option) => (
          <li key={option}>
            <button
              className={`dropdown-item text-capitalize ${theme === option ? "active" : ""}`}
              onClick={() => setTheme(option)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Header = () => {
  const { headerThemes, theme } = useContext(ThemeContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribe;
    const setupNotifications = async () => {
      if (auth.currentUser) {
        const notificationsQuery = query(
          collection(db, "Notifications"),
          where("userId", "==", auth.currentUser.uid),
          where("read", "==", false)
        );
        unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          setUnreadCount(snapshot.docs.length);
        });
      }
    };
    setupNotifications();
    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <header className={`sticky-top ${headerThemes[theme]} shadow-sm`}>
      <style>
        {`
          .pulse-badge {
            display: inline-block;
            width: 10px;
            height: 10px;
            background-color: #dc3545;
            border-radius: 50%;
            position: absolute;
            top: -2px;
            right: -2px;
            animation: pulse 1.5s infinite ease-in-out;
          }
          .count-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            font-size: 0.65rem;
            padding: 2px 6px;
            line-height: 1;
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      <div className="container py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div className="logo">
              <h1 className="h3 mb-0 me-4">ViBook</h1>
              <small className="text-sm text-gray-600">Developed by Phuc-Tho</small>
            </div>
            <div className="position-relative">
              <FaSearch className="position-absolute top-50 translate-middle-y ms-2 text-secondary" />
              <input
                type="text"
                placeholder="Search on ViBook"
                className="form-control ps-5 rounded-pill"
                style={{ width: "300px" }}
              />
            </div>
          </div>
          <div className="d-flex align-items-center">
            <Link to="/profile" className="text-white mx-2">
              <FaUser className="fs-5" title="Profile" />
            </Link>
            <Link to="/messenger" className="text-white mx-2">
              <FaFacebookMessenger className="fs-5" title="Messenger" />
            </Link>
            <Link to="/notifications" className="text-white mx-2 position-relative">
              <FaBell className="fs-5" title="Notifications" />
              {unreadCount > 0 && (
                <span
                  className={unreadCount > 9 ? "badge bg-danger count-badge" : "pulse-badge"}
                >
                  {unreadCount > 9 ? unreadCount : ""}
                </span>
              )}
            </Link>
            <ThemeDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;