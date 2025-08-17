import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookMessenger, FaBell, FaSearch, FaUser } from 'react-icons/fa';
import { CiSun } from 'react-icons/ci';
import { GiMoon } from 'react-icons/gi';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ThemeContext } from '../contexts/ThemeContext';

const ThemeDropdown = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const themeOptions = [
    'light', 'dark', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'teal', 'orange', 'cyan'
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
        {theme === 'light' ? <CiSun className="fs-5 me-2" /> : <GiMoon className="fs-5 me-2" />}
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="themeDropdown">
        {themeOptions.map((option) => (
          <li key={option}>
            <button
              className="dropdown-item text-capitalize"
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

  return (
    <header className={`sticky-top ${headerThemes[theme]} shadow-sm`}>
      <div className="container py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div class="logo">
              <h1 className="h3 mb-0 me-4">ViBook</h1>
              <small class="text-sm text-gray-600">Developed by Phuc-Tho</small>
            </div>
            <div className="position-relative">
              <FaSearch className="position-absolute top-50 translate-middle-y ms-2 text-secondary" />
              <input
                type="text"
                placeholder="Search on ViBook"
                className="form-control ps-5 rounded-pill"
                style={{ width: '300px' }}
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
            <Link to="/notifications" className="text-white mx-2">
              <FaBell className="fs-5" title="Notifications" />
            </Link>
            <ThemeDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;