import React, { useContext } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { getPostHtml, sanitizePostHtml } from "../../utils/postContent";
import { LanguageContext } from "../../context/LanguageContext";

const editModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

const PostContent = ({
  post,
  isLight,
  isEditing,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  isSaving,
  onSaveEdit,
  onCancelEdit,
}) => {
  const { t } = useContext(LanguageContext);
  const safeHtml = sanitizePostHtml(getPostHtml(post));

  if (isEditing) {
    return (
      <div className="px-4 pb-3">
        <input
          type="text"
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          maxLength={180}
          disabled={isSaving}
          placeholder={t("postTitlePlaceholder")}
          className={`mb-2 w-full rounded-lg border px-3 py-2.5 text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 ${isLight ? "border-gray-300 bg-white text-gray-900" : "border-zinc-600 bg-zinc-800 text-gray-100"}`}
        />
        <ReactQuill
          theme="snow"
          value={editContent}
          onChange={setEditContent}
          modules={editModules}
          readOnly={isSaving}
          className={`post-edit-rich-editor ${isLight ? "light" : "dark"}`}
          placeholder={t("postContentPlaceholder")}
        />
        <div className="flex gap-2 mt-2">
          <button onClick={onSaveEdit} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
            {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FaCheck />}
            {t("save")}
          </button>
          <button onClick={onCancelEdit} disabled={isSaving} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isLight ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"} disabled:opacity-50`}>
            <FaTimes /> {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (!safeHtml && !post.title) return null;
  return (
    <div className={`post-item-content post-rich-content ${isLight ? "text-gray-800" : "text-gray-100"}`}>
      {post.title && <h1 className="post-article-title">{post.title}</h1>}
      {safeHtml && (
        <div className="post-content-scrollable-wrapper" dangerouslySetInnerHTML={{ __html: safeHtml }} />
      )}
    </div>
  );
};

export default PostContent;
