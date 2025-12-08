import React, { useContext } from "react";
import UserAvatar from "./UserAvatar";
import { FaPhone, FaVideo, FaEllipsisV } from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import "../../style/ChatHeader.css";

const ChatHeader = ({ user, theme }) => {
    const { t } = useContext(LanguageContext);
    if (!user) return null;
    const isLight = theme === "light";

    return (
        <div className={`chat-header ${isLight ? 'light' : 'dark'}`}>
            <div className="chat-header-info">
                <UserAvatar user={user} size={50} showOnline={true} />
                <div>
                    <h5 className="chat-header-name">{user.firstName} {user.lastName}</h5>
                    <small className={`chat-header-status ${user.isOnline ? 'online' : ''} ${isLight ? 'light' : 'dark'}`}>
                        {user.isOnline ? t("online") : t("offline")}
                    </small>
                </div>
            </div>
            <div className="chat-header-actions">
                <button className="btn btn-outline-secondary rounded-circle">
                    <FaPhone size={16} />
                </button>
                <button className="btn btn-outline-secondary rounded-circle">
                    <FaVideo size={16} />
                </button>
                <button className="btn btn-outline-secondary rounded-circle">
                    <FaEllipsisV size={16} />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
