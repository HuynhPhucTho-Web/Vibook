import React from "react";
import ReactQuill from "react-quill-new";
import { FaTimes } from "react-icons/fa";

const BlogFormModal = ({
  showModal,
  onClose,
  editingPost,
  formData,
  setFormData,
  submitting,
  onSubmit,
  categories,
  PRESET_CATEGORIES,
  formats,
  modules,
  onAddCategory,
  onAddTag,
  newCategoryInput,
  setNewCategoryInput,
  newTagInput,
  setNewTagInput,
  onCoverUpload,
  t
}) => {
  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header d-flex justify-content-between align-items-center mb-3">
          <h2>{editingPost ? t("editPost") : t("createPost")}</h2>
          <button type="button" className="close-btn border-0 bg-transparent" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group mb-3">
            <label className="form-label font-weight-bold">{t("title")}</label>
            <input
              type="text"
              className="form-control"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <small className="form-text text-muted d-block mt-1" style={{ fontSize: "12px", opacity: 0.75 }}>
              {t("titleHint")}
            </small>
          </div>

          <div className="form-group mb-3">
            <label className="form-label font-weight-bold">{t("slug")}</label>
            <input
              type="text"
              className="form-control"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
            <small className="form-text text-muted d-block mt-1" style={{ fontSize: "12px", opacity: 0.75 }}>
              {t("slugHint")}
            </small>
          </div>

          <div className="form-group mb-3">
            <label className="form-label font-weight-bold">{t("blogDescription")}</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <small className="form-text text-muted d-block mt-1" style={{ fontSize: "12px", opacity: 0.75 }}>
              {t("descriptionHint")}
            </small>
          </div>

          <div className="form-group mb-3">
            <label className="form-label font-weight-bold">{t("category")}</label>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">-- {t("selectCategory")} --</option>
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <small className="form-text text-muted d-block mt-1 mb-2" style={{ fontSize: "12px", opacity: 0.75 }}>
              {t("categoryHint")}
            </small>
            <div className="d-flex gap-2 mt-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={t("newCategoryPlaceholder")}
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
              />
              <button type="button" onClick={onAddCategory} className="btn btn-outline-primary btn-sm flex-shrink-0">
                + Add
              </button>
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label font-weight-bold">{t("tags")}</label>
            <div className="tags-container mb-2">
              {(formData.tags || []).map((tag) => (
                <span key={tag} className="tag-pill badge bg-secondary me-1">
                  #{tag}{" "}
                  <span
                    className="remove-tag cursor-pointer ms-1"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        tags: formData.tags.filter((t) => t !== tag),
                      })
                    }
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={t("newTagPlaceholder")}
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
              />
              <button type="button" onClick={onAddTag} className="btn btn-outline-primary btn-sm flex-shrink-0">
                + Add
              </button>
            </div>
            <small className="form-text text-muted d-block mt-1" style={{ fontSize: "12px", opacity: 0.75 }}>
              {t("tagsHint")}
            </small>
          </div>

          <div className="form-group mb-3">
            <label className="form-label font-weight-bold">{t("coverImage")}</label>
            <input 
              type="file" 
              accept="image/*" 
              className="form-control" 
              onChange={onCoverUpload} 
            />
            {formData.coverImage && (
              <img src={formData.coverImage} alt="cover preview" className="mt-2 rounded" style={{ maxHeight: "100px", objectFit: "cover" }} />
            )}
            <small className="form-text text-muted d-block mt-1" style={{ fontSize: "12px", opacity: 0.75 }}>
              {t("coverImageHint")}
            </small>
          </div>

          <div className="form-group mb-3">
            <label className="form-label font-weight-bold">{t("content")}</label>
            <div className="quill-editor">
              <ReactQuill
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={modules}
                formats={formats}
                theme="snow"
              />
            </div>
            <small className="form-text text-muted d-block mt-1" style={{ fontSize: "12px", opacity: 0.75 }}>
              {t("contentHint")}
            </small>
          </div>

          <div className="modal-actions d-flex justify-content-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t("blogCancel")}
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? t("blogSave") + "..." : t("blogSave")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogFormModal;
