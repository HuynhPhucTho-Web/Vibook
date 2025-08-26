import React, { useState } from "react";
import { db, auth } from "../../components/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Dropdown } from "react-bootstrap";

const PostItem = ({ post }) => {
  const user = auth.currentUser;
  const isAuthor = user && user.uid === post.userId;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");

  // 🗑️ Xóa post
  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    try {
      await deleteDoc(doc(db, "Groups", post.groupId, "Posts", post.id));
    } catch (error) {
      console.error("🔥 Lỗi khi xóa bài:", error);
    }
  };

  // ✏️ Cập nhật post
  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "Groups", post.groupId, "Posts", post.id), {
        content: editContent,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("🔥 Lỗi khi cập nhật bài:", error);
    }
  };

  return (
    <div className="p-4 border rounded-xl bg-white shadow space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {post.userPhoto ? (
            <img
              src={post.userPhoto}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">
              {post.userName?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <p className="font-semibold">{post.userName || "Ẩn danh"}</p>
            {post.createdAt?.toDate && (
              <p className="text-xs text-gray-500">
                {post.createdAt.toDate().toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        </div>

        {/* Dropdown chỉ hiện với tác giả */}
        {isAuthor && !isEditing && (
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="light"
              id="dropdown-post-actions"
              className="border-0 shadow-none"
            >
              ⋮
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setIsEditing(true)}>Sửa</Dropdown.Item>
              <Dropdown.Item onClick={handleDelete} className="text-danger">
                Xóa
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <>
          <textarea
            className="w-full p-2 border rounded"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleUpdate}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Lưu
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              Hủy
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-800">{post.content}</p>
      )}

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.mediaUrls.map((url, i) =>
            url.match(/\.(mp4|webm|ogg)$/) ? (
              <video
                key={i}
                src={url}
                controls
                className="w-full rounded-lg"
              />
            ) : url.match(/\.(pdf|doc|docx)$/) ? (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                📄 File đính kèm
              </a>
            ) : (
              <img
                key={i}
                src={url}
                alt="post-media"
                className="w-full rounded-lg"
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PostItem;
