import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

const PostContent = ({
  post,
  isLight,
  isEditing,
  editContent,
  setEditContent,
  isSaving,
  onSaveEdit,
  onCancelEdit
}) => {
  if (isEditing) {
    return (
      <div className="px-4 pb-3">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className={`w-full p-3 rounded-lg border resize-none ${isLight ? "bg-white border-gray-300 text-gray-900" : "bg-zinc-800 border-zinc-600 text-gray-100"}`}
          rows={3}
          placeholder="Nhập nội dung bài viết..."
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={onSaveEdit}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FaCheck />
            )}
            Lưu
          </button>
          <button
            onClick={onCancelEdit}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isLight ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"} disabled:opacity-50`}
          >
            <FaTimes />
            Hủy
          </button>
        </div>
      </div>
    );
  }

  return (
    post.content && (
      <div className={`post-item-content ${isLight ? "text-gray-800" : "text-gray-100"}`}>
        <p>{post.content}</p>
      </div>
    )
  );
};

export default PostContent;
