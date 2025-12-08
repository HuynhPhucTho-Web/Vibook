import React, { useContext } from "react";
import UserAvatar from "./UserAvatar";
import { FaSearch } from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import "../../style/UserList.css";

const UserList = ({ users, selectedUser, onUserSelect, searchTerm, onSearchChange, theme }) => {
    const { t } = useContext(LanguageContext);
    const isLight = theme === "light";

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
                    users.map((user) => (
                        <div
                            key={user.uid}
                            className={`user-item ${selectedUser?.uid === user.uid ? "selected" : ""} ${isLight ? 'light' : 'dark'}`}
                            onClick={() => onUserSelect(user)}
                        >
                            <UserAvatar user={user} size={46} showOnline={true} />
                            <div className="user-item-info">
                                <div className="d-flex justify-content-between">
                                    <span className="user-item-name">{user.firstName} {user.lastName}</span>
                                    {/* <small className="text-muted">12m</small> */}
                                </div>
                                <p className={`user-item-last-message ${isLight ? 'light' : 'dark'}`}>
                                    {t("lastMessageHere")}
                                </p>
                            </div>
                        </div>
                    ))
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
