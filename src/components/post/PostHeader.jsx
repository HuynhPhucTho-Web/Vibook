import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../components/firebase";
import { FaEllipsisH, FaEdit, FaLock, FaTrash, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";

const PostHeader = ({
  post,
  auth,
  isLight,
  isDeleting,
  onEdit,
  onPrivate,
  onDelete
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút`;
    if (hrs < 24) return `${hrs} giờ`;
    if (days < 7) return `${days} ngày`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Nếu đã có sẵn trong post thì dùng luôn
        if (post.userName && post.userPhoto) {
          return;
        }
        // Fetch từ Users/{userId} nếu thiếu
        if (post.userId) {
          const snap = await getDoc(doc(db, "Users", post.userId));
          if (mounted && snap.exists()) {
            // Update post.userName if needed, but for now we just ensure it's available
          }
        }
      } catch (e) {
        // bỏ qua lỗi: fallback phía dưới sẽ hiển thị "Anonymous"
        console.log("fetch author error", e);
      }
    })();
    return () => { mounted = false; };
  }, [post.userId, post.userName, post.userPhoto]);

  return (
    <div className="post-item-header">
      <div className="post-item-author">
        <Link to={`/profile/${post.userId}`} className="no-underline hover:no-underline">
          <div
            className="post-item-avatar d-flex align-items-center justify-content-center"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: isLight ? "#e9ecef" : "#495057",
              color: isLight ? "#6c757d" : "#adb5bd",
              position: "relative",
            }}
          >
            {post.userPhoto ? (
              <img
                src={post.userPhoto}
                alt={post.userName}
                className="rounded-circle"
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : null}
            <FaUser size={20} style={{ display: post.userPhoto ? "none" : "block" }} />
          </div>
        </Link>

        <div>
          <Link to={`/profile/${post.userId}`} className="no-underline hover:no-underline">
            <p className={`font-semibold text-base ${isLight ? "text-gray-900" : "text-white"}`}>
              {post.userName}
            </p>
          </Link>
          <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
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
                  <FaEdit /> Chỉnh sửa
                </button>
                <button
                  onClick={() => {
                    onPrivate();
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${isLight ? "hover:bg-gray-50 text-gray-700" : "hover:bg-zinc-700 text-gray-200"
                    }`}
                >
                  <FaLock /> Riêng tư
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <FaTrash /> Xóa
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
