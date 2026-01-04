import React, { useRef, useState, useContext } from "react";
import { Smile } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { LanguageContext } from "../../context/LanguageContext";
import "../../style/story/Story.css";

const StoryCreateForm = ({
  // state + setter từ parent
  newStory,
  setNewStory,

  // upload state từ parent
  isUploading,
  uploadProgress,

  // UI toggle từ parent
  showCreateForm,
  setShowCreateForm,

  // handlers từ parent (giữ logic y hệt)
  handleCreateStory,
  handleFileChange,
  removeFile,
  renderFilePreview,

  // validate UI
  maxFiles = 5,

  // emoji list
  icons = [],
}) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const isLight = theme === "light";

  const fileInputRef = useRef(null);
  const [showIcons, setShowIcons] = useState(false);

  // thêm icon vào title (giữ logic)
  const handleAddIcon = (icon) => {
    setNewStory((prev) => ({ ...prev, title: prev.title + " " + icon }));
    setShowIcons(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>{t('stories')}</h1>
          <p className={`text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}>
            {t('storiesExpire')}
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm((s) => !s)}
          className="create-group-btn"
        >
          <span className="text-[15px] leading-none">＋</span>
          {showCreateForm ? t('close') : t('createStory')}
        </button>

      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className={`mb-8 rounded-2xl border p-5 shadow-sm ${isLight ? "border-gray-200 bg-white" : "border-gray-700 bg-gray-800"}`}>
          <form onSubmit={handleCreateStory} className="space-y-4">
            {/* Title + Icon Picker */}
            <div className="relative">
              <input
                type="text"
                value={newStory.title}
                onChange={(e) =>
                  setNewStory({ ...newStory, title: e.target.value })
                }
                placeholder={t('storyTitlePlaceholder')}
                className={`w-full rounded-xl border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500 ${isLight ? "border-gray-300 bg-white text-gray-900" : "border-gray-600 bg-gray-700 text-white"}`}
                disabled={isUploading}
              />

              {/* Nút mở icon */}
              <button
                type="button"
                onClick={() => setShowIcons(!showIcons)}
                className={`absolute right-3 top-2.5 ${isLight ? "text-gray-500 hover:text-yellow-500" : "text-gray-400 hover:text-yellow-400"}`}
              >
                <Smile size={22} />
              </button>

              {/* Popup emoji */}
              {showIcons && (
                <div className={`absolute mt-2 right-0 z-50 w-60 max-h-52 overflow-y-auto rounded-xl border shadow-lg p-2 grid grid-cols-8 gap-1 text-lg ${isLight ? "border-gray-300 bg-white" : "border-gray-600 bg-gray-700"}`}>
                  {icons.map((icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddIcon(icon)}
                      className={`hover:bg-gray-100 rounded-lg ${isLight ? "hover:bg-gray-100" : "hover:bg-gray-600"}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* File input */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => {
                  handleFileChange(e);
                  // reset input để chọn lại cùng file vẫn trigger change
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={isUploading || newStory.mediaFiles.length >= maxFiles}
                className={`block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 hover:file:bg-blue-100 disabled:opacity-60 ${isLight ? "file:bg-blue-50 file:text-blue-700" : "file:bg-blue-900 file:text-blue-300"}`}
              />
              <span className="text-xs text-gray-500">
                Up to {maxFiles} videos, each &lt; 50MB.
              </span>
            </div>

            {newStory.mediaFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap">
                {newStory.mediaFiles.map((f) =>
                  renderFilePreview(f, removeFile, isUploading)
                )}
              </div>
            )}

            {isUploading && (
              <div className={`w-full rounded-full h-2 ${isLight ? "bg-gray-200" : "bg-gray-700"}`}>
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <button
              type="submit"
              className={`w-full rounded-xl bg-blue-600 py-2.5 text-white font-medium shadow hover:bg-blue-700 transition ${isUploading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              disabled={isUploading}
            >
              {isUploading ? t('uploading') : t('postStory')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StoryCreateForm;
