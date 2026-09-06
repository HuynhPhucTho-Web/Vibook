import React, { useState, useEffect, useContext } from "react";
import { FaEllipsisH, FaEdit, FaLock, FaTrash, FaUser, FaGlobeAmericas, FaUserFriends, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { LanguageContext } from "../../context/LanguageContext";
import { getUserProfile } from "../../utils/userCache";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

const PostHeader = ({
  post,
  auth,
  isLight,
  isDeleting,
  onEdit,
  onPrivacyChange,
  onDelete
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPrivacySubmenu, setShowPrivacySubmenu] = useState(false);

  useEffect(() => {
    if (!showDropdown) {
      setShowPrivacySubmenu(false);
    }
  }, [showDropdown]);
 const { t, language } = useContext(LanguageContext);
  const formatTimeAgo = (timestamp) => {
    const value = timestamp?.toMillis ? timestamp.toMillis() : timestamp;
    const diff = Date.now() - value;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return t("justNow");
    if (mins < 60) return t("minuteAgo").replace("{count}", mins);
    if (hrs < 24) return t("hourAgo").replace("{count}", hrs);
    if (days < 7) return t("dayAgo").replace("{count}", days);
    return new Date(value).toLocaleDateString({ en: "en-US", vi: "vi-VN", ja: "ja-JP" }[language] || "en-US");
  };
  const [authorName, setAuthorName] = useState(post.userName || "Anonymous");
  const [authorPhoto, setAuthorPhoto] = useState(post.userPhoto || null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [authorPhoto]);

  useEffect(() => {
    if (!post.userId) {
      setAuthorName(post.userName || "Anonymous");
      setAuthorPhoto(post.userPhoto || null);
      return;
    }
    let mounted = true;

    // Use initial post user details if present
    if (post.userName) setAuthorName(post.userName);
    if (post.userPhoto) setAuthorPhoto(post.userPhoto);

    // Fetch from memory cache / single request deduplicated
    getUserProfile(post.userId).then((profile) => {
      if (mounted && profile) {
        setAuthorName(profile.displayName || post.userName || "Anonymous");
        setAuthorPhoto(profile.photo || post.userPhoto || null);
      }
    });

    return () => {
      mounted = false;
    };
  }, [post.userId, post.userName, post.userPhoto]);

  const hasNoAvatar = !authorPhoto || authorPhoto === "/default-avatar.png" || imgFailed;

  return (
    <div className="post-item-header">
      <div className="post-item-author">
        <Link to={`/profile/${post.userId}`} className="no-underline hover:no-underline">
          {!hasNoAvatar ? (
            <img
              src={getOptimizedCloudinaryUrl(authorPhoto, 100)}
              alt={authorName}
              loading="lazy"
              decoding="async"
              className="rounded-circle"
              style={{
                width: "40px",
                height: "40px",
                objectFit: "cover",
              }}
              onError={() => {
                setImgFailed(true);
              }}
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: isLight ? "#e9ecef" : "#495057",
                color: isLight ? "#6c757d" : "#adb5bd",
              }}
            >
              <FaUser size={20} />
            </div>
          )}
        </Link>

        <div>
          <Link to={`/profile/${post.userId}`} className="no-underline hover:no-underline">
            <p className={`font-semibold text-base ${isLight ? "text-gray-900" : "text-white"}`}>
              {authorName}
            </p>
          </Link>
          <p className="text-sm text-gray-500 d-flex align-items-center gap-1">
            {formatTimeAgo(post.createdAt)}
            <span className="ms-1" title={post.status === "private" ? t("privateVisibility") : post.status === "friends" ? t("friendsVisibility") : t("publicVisibility")}>
              {post.status === "private" ? <FaLock size={12} /> : post.status === "friends" ? <FaUserFriends size={12} /> : <FaGlobeAmericas size={12} />}
            </span>
          </p>
        </div>
      </div>

      {post.userId === auth.currentUser?.uid && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isDeleting}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${isLight ? "hover:bg-gray-100" : "hover:bg-zinc-800"
              }`}
          >
            {isDeleting ? (
              <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
            ) : (
              <FaEllipsisH className={isLight ? "text-gray-600" : "text-gray-400"} />
            )}
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div
                className={`absolute right-0 mt-2 w-48 max-w-[90vw] rounded-2xl shadow-xl z-20 py-2 ${isLight ? "bg-white border border-gray-100" : "bg-zinc-800 border border-zinc-700"
                  }`}
              >
                <button
                  onClick={() => {
                    onEdit();
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                >
                  <FaEdit /> {t("editPost")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPrivacySubmenu(!showPrivacySubmenu);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                >
                  <span className="flex items-center gap-3">
                    {post.status === "private" ? <FaLock /> : post.status === "friends" ? <FaUserFriends /> : <FaGlobeAmericas />}
                    {t("privacy") || "Quyền riêng tư"}
                  </span>
                  <FaChevronRight size={12} className={`transition-transform duration-200 ${showPrivacySubmenu ? "rotate-90" : ""}`} />
                </button>

                {showPrivacySubmenu && (
                  <div className={`py-1 flex flex-col ${isLight ? "bg-gray-50/70" : "bg-zinc-900/50"}`} style={{ borderTop: isLight ? "1px solid #f1f5f9" : "1px solid #27272a", borderBottom: isLight ? "1px solid #f1f5f9" : "1px solid #27272a" }}>
                    <button
                      onClick={() => {
                        onPrivacyChange("public");
                        setShowDropdown(false);
                      }}
                      className={`w-full px-5 py-2 flex items-center gap-3 text-sm transition-colors ${isLight ? "hover:bg-gray-100 text-gray-600" : "hover:bg-zinc-700 text-gray-300"
                        } ${post.status === "public" ? "font-bold text-purple-600" : ""}`}
                    >
                      <FaGlobeAmericas size={12} /> {t("publicVisibility")}
                    </button>
                    <button
                      onClick={() => {
                        onPrivacyChange("friends");
                        setShowDropdown(false);
                      }}
                      className={`w-full px-5 py-2 flex items-center gap-3 text-sm transition-colors ${isLight ? "hover:bg-gray-100 text-gray-600" : "hover:bg-zinc-700 text-gray-300"
                        } ${post.status === "friends" ? "font-bold text-purple-600" : ""}`}
                    >
                      <FaUserFriends size={12} /> {t("friendsVisibility")}
                    </button>
                    <button
                      onClick={() => {
                        onPrivacyChange("private");
                        setShowDropdown(false);
                      }}
                      className={`w-full px-5 py-2 flex items-center gap-3 text-sm transition-colors ${isLight ? "hover:bg-gray-100 text-gray-600" : "hover:bg-zinc-700 text-gray-300"
                        } ${post.status === "private" ? "font-bold text-purple-600" : ""}`}
                    >
                      <FaLock size={12} /> {t("privateVisibility")}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    onDelete();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <FaTrash /> {t("deletePost")}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostHeader;
