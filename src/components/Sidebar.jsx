import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaUser, FaUsers, FaCalendarAlt, FaVideo, FaStore } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
    return (
        <aside className="col-lg-3">
            <div className="card shadow-sm">
                <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                        <Link to="/homevibook" className="d-flex align-items-center text-decoration-none text-dark">
                            <FaHome className="me-2 text-primary" />
                            Home
                        </Link>
                    </li>
                    <li className="list-group-item">
                        <Link to="/profile" className="d-flex align-items-center text-decoration-none text-dark">
                            <FaUser className="me-2 text-primary" />
                            Profile
                        </Link>
                    </li>
                    <li className="list-group-item">
                        <Link to="/groups" className="d-flex align-items-center text-decoration-none text-dark">
                            <FaUsers className="me-2 text-primary" />
                            Groups
                        </Link>
                    </li>
                    <li className="list-group-item">
                        <Link to="/events" className="d-flex align-items-center text-decoration-none text-dark">
                            <FaCalendarAlt className="me-2 text-primary" />
                            Events
                        </Link>
                    </li>
                    <li className="list-group-item">
                        <Link to="/reels" className="d-flex align-items-center text-decoration-none text-dark">
                            <FaVideo className="me-2 text-primary" />
                            Reels
                        </Link>
                    </li>
                    <li className="list-group-item">
                        <Link to="/pages" className="d-flex align-items-center text-decoration-none text-dark">
                            <FaStore className="me-2 text-primary" />
                            Pages
                        </Link>
                    </li>
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;