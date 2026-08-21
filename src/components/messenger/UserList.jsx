import React, { useContext } from "react";
import UserAvatar from "./UserAvatar";
import { FaSearch } from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import { getRelativeTime } from "../../utils/relativeTime";
import "../../style/UserList.css";

const UserList = ({
    users,
    selectedUser,
    onUserSelect,
    searchTerm,
    onSearchChange,
    theme,
    lastMessages = {},
    unreadCounts = {},
    allChatConfigs = {}
}) => {
    const { t } = useContext(LanguageContext);
    const isLight = theme === "light";

    const getDisplayName = (user) => {
        const config = allChatConfigs[user.uid];
        if (config?.nicknames?.[user.uid]) {
            return config.nicknames[user.uid];
        }
        return `${user.firstName} ${user.lastName}`;
    };

    const getLastMessageText = (user) => {
        const lastMsg = lastMessages[user.uid];
        if (!lastMsg) return t("lastMessageHere") || "Chưa có tin nhắn";
        
        if (lastMsg.isRecalled) {
            return t("messageRecalled") || "Tin nhắn đã thu hồi";
        }
        
        if (lastMsg.mediaFiles && lastMsg.mediaFiles.length > 0) {
            const firstFile = lastMsg.mediaFiles[0];
            if (firstFile.category === "image") return `📷 [${t("photo") || "Ảnh"}]`;
            if (firstFile.category === "video") return `🎥 [${t("video") || "Video"}]`;
            if (firstFile.category === "audio") return `🎙️ [${t("voiceMessage") || "Tin nhắn thoại"}]`;
            return `📄 [${t("document") || "Tài liệu"}]`;
        }
        
        return lastMsg.content || "";
    };

    const getLastMessageTime = (user) => {
        const lastMsg = lastMessages[user.uid];
        if (!lastMsg || !lastMsg.createdAt) return "";
        return getRelativeTime(lastMsg.createdAt, localStorage.getItem("language") || "vi");
    };

    return (
        <div className={`sidebar-container ${isLight ? 'light' : 'dark'}`}>
            <div className={`user-list-header ${isLight ? 'light' : 'dark'}`}>
                <h5 className="mb-3 fw-bold">{t("messages")}</h5>
                <div className="position-relative">
                    <FaSearch
                        className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                    />
                    <input
                        type="text"
                        className={`user-search-input ${isLight ? 'light' : 'dark'}`}
                        placeholder={t("searchUsers")}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="user-list-items">
                {users.length > 0 ? (
                    users.map((user) => {
                        const hasUnread = (unreadCounts[user.uid] || 0) > 0;
                        const unreadCount = unreadCounts[user.uid] || 0;

                        return (
                            <div
                                key={user.uid}
                                className={`user-item ${selectedUser?.uid === user.uid ? "selected" : ""} ${hasUnread ? "unread-highlight" : ""} ${isLight ? 'light' : 'dark'}`}
                                onClick={() => onUserSelect(user)}
                            >
                                <UserAvatar user={user} size={46} showOnline={true} />
                                <div className="user-item-info">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className={`user-item-name ${hasUnread ? "fw-bold" : ""}`}>
                                            {getDisplayName(user)}
                                        </span>
                                        <small className="user-item-time text-muted ms-1">
                                            {getLastMessageTime(user)}
                                        </small>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-0.5">
                                        <p className={`user-item-last-message mb-0 ${hasUnread ? "fw-semibold text-white" : ""} ${isLight ? 'light' : 'dark'}`}>
                                            {getLastMessageText(user)}
                                        </p>
                                        {hasUnread && (
                                            <span className="unread-badge">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center p-4 text-muted">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserList;
