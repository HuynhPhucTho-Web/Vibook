import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";

const UserAvatar = React.memo(({ user, size = 40, showOnline = false }) => {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        // Reset imageError when user or photo changes
        setImageError(false);
    }, [user.photo, user.uid]);

    const getInitials = (firstName, lastName) => {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';
        return first + last || '?';
    };

    const avatarStyle = {
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#e5e7eb',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.6}px`,
    };

    console.log("UserAvatar: user.photo =", user.photo, "imageError =", imageError, "user =", user); // Added log

    return (
        <div className="position-relative flex-shrink-0">
            {user.photo && !imageError ? (
                <img
                    src={user.photo}
                    alt={user.firstName}
                    className="rounded-circle border"
                    style={{ width: `${size}px`, height: `${size}px`, objectFit: "cover" }}
                    onError={(e) => {
                        console.error("UserAvatar: Image failed to load for user", user.uid, e); // Added error log
                        setImageError(true);
                    }}
                />
            ) : (
                <div className="rounded-circle shadow-sm" style={avatarStyle}>
                    <FaUser />
                </div>
            )}
            {showOnline && user.isOnline && (
                <span
                    className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                    style={{ width: '12px', height: '12px' }}
                ></span>
            )}
        </div>
    );
});

export default UserAvatar;
