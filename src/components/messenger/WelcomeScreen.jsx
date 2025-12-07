import React from "react";
import { FaUserCircle } from "react-icons/fa";
import "../../style/WelcomeScreen.css";

const WelcomeScreen = ({ theme }) => {
    const isLight = theme === 'light';
    return (
        <div className={`welcome-container ${isLight ? 'light' : 'dark'}`}>
            <div className={`welcome-content ${isLight ? 'light' : 'dark'}`}>
                <FaUserCircle size={80} className={`welcome-icon ${isLight ? 'light' : 'dark'}`} />
                <h4 className="welcome-title">Select a chat to start messaging</h4>
                <p className="welcome-text">Choose a person from the left sidebar to view your conversation.</p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
