import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from "../../utils/userCache";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

const REACTION_CONFIG = {
  Like: { emoji: "👍", label: "Thích" },
  Love: { emoji: "❤️", label: "Yêu thích" },
  Haha: { emoji: "😂", label: "Haha" },
  Wow: { emoji: "😮", label: "Wow" },
  Sad: { emoji: "😢", label: "Buồn" },
  Angry: { emoji: "😠", label: "Phẫn nộ" },
};

const SafeUserAvatar = ({ photo, name, size = "w-10 h-10", iconSize = 16 }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [photo]);

  if (!photo || photo === "/default-avatar.png" || hasError) {
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-gray-300 ring-1 ring-black/5 dark:ring-white/10`}
        title={name || "User"}
      >
        <FaUser size={iconSize} />
      </div>
    );
  }

  return (
    <img
      src={getOptimizedCloudinaryUrl(photo, 100)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={`${size} rounded-full object-cover flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10`}
    />
  );
};

const PostReactionsModal = ({ isOpen, onClose, post, isLight }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [usersData, setUsersData] = useState({});
  const [loading, setLoading] = useState(false);

  const reactedBy = post?.reactedBy || {};
  const likes = post?.likes || {};
  const totalReactions = Object.values(likes).reduce((s, c) => s + c, 0);

  // Esc key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Optimized batch fetch users via project-wide userCache
  useEffect(() => {
    if (!isOpen) return;

    const uids = Object.keys(reactedBy);
    if (uids.length === 0) {
      setUsersData({});
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all(
      uids.map(async (uid) => {
        const profile = await getUserProfile(uid);
        return {
          uid,
          name: profile?.displayName || "Người dùng",
          photo: profile?.photo || null,
        };
      })
    ).then((fetchedUsers) => {
      if (!isMounted) return;
      const userMap = {};
      fetchedUsers.forEach((u) => {
        if (u) userMap[u.uid] = u;
      });
      setUsersData(userMap);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, reactedBy]);

  if (!isOpen) return null;

  // Tabs calculation
  const reactionTabs = [
    { key: "all", label: `Tất cả ${totalReactions}` },
    ...Object.entries(likes)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        key: type,
        label: `${REACTION_CONFIG[type]?.emoji || "👍"} ${count}`,
      })),
  ];

  // Filter reacted users by active tab
  const filteredUsers = Object.entries(reactedBy).filter(([, reactionType]) => {
    if (activeTab === "all") return true;
    return reactionType === activeTab;
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all transform scale-100 ${
          isLight ? "bg-white text-gray-900" : "bg-zinc-900 text-gray-100 border border-zinc-800"
        }`}
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isLight ? "border-gray-100" : "border-zinc-800"}`}>
          <h3 className="font-bold text-base sm:text-lg">Người đã bày tỏ cảm xúc</h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isLight ? "hover:bg-gray-100 text-gray-500" : "hover:bg-zinc-800 text-gray-400"
            }`}
            title="Đóng"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className={`flex items-center gap-2 px-4 py-2 border-b overflow-x-auto no-scrollbar ${
            isLight ? "border-gray-100 bg-gray-50/50" : "border-zinc-800 bg-zinc-900/50"
          }`}
        >
          {reactionTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : isLight
                    ? "hover:bg-gray-200 text-gray-600"
                    : "hover:bg-zinc-800 text-gray-400"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-gray-100 dark:divide-zinc-800/60 max-h-[380px]">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {loading ? "Đang tải danh sách..." : "Chưa có người nào."}
            </div>
          ) : (
            filteredUsers.map(([uid, reactionType]) => {
              const user = usersData[uid] || { uid, name: "Đang tải...", photo: null };
              const reactionInfo = REACTION_CONFIG[reactionType] || { emoji: "👍" };

              return (
                <div
                  key={uid}
                  onClick={() => {
                    navigate(`/profile/${uid}`);
                    onClose();
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isLight ? "hover:bg-gray-100/80" : "hover:bg-zinc-800/70"
                  }`}
                >
                  {/* Avatar with reaction badge */}
                  <div className="relative shrink-0">
                    <SafeUserAvatar photo={user.photo} name={user.name} size="w-10 h-10" iconSize={16} />
                    <span
                      className="absolute -bottom-1 -right-1 text-xs bg-white dark:bg-zinc-900 rounded-full shadow ring-1 ring-black/5 flex items-center justify-center w-5 h-5 leading-none"
                      title={reactionInfo.label}
                    >
                      {reactionInfo.emoji}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate hover:text-blue-500 transition-colors">
                      {user.name}
                    </p>
                    <span className="text-xs text-gray-500">
                      {reactionInfo.label || "Thích"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostReactionsModal;

