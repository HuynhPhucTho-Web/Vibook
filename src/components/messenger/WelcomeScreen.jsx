import React, { useContext } from "react";
import { FaUserCircle } from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import "../../style/WelcomeScreen.css";

const WelcomeScreen = ({ theme }) => {
    const { t } = useContext(LanguageContext);
    const isLight = theme === 'light';
    return (
        <div className={`welcome-container ${isLight ? 'light' : 'dark'}`}>
            <div className={`welcome-content ${isLight ? 'light' : 'dark'}`}>
                <FaUserCircle size={80} className={`welcome-icon ${isLight ? 'light' : 'dark'}`} />
                <h4 className="welcome-title">{t("selectChat")}</h4>
                <p className="welcome-text">{t("choosePerson")}</p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
