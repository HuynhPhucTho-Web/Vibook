import React from "react";
import { toast, Slide } from "react-toastify";
import { FaTrash, FaExclamationTriangle, FaCheck, FaTimes } from "react-icons/fa";

/**
 * Universal Confirm Dialog (Top-Right Sliding Glassmorphism Popup)
 * Replaces native window.confirm ("localhost says...")
 * @param {string} message - Message to confirm
 * @param {object|string} options - Optional configuration { title, confirmText, cancelText, type }
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
 */
export const confirmDialog = (message, options = {}) => {
  const config = typeof options === "string" ? { title: options } : options;
  const {
    title = "Xác nhận",
    confirmText = "Đồng ý",
    cancelText = "Hủy",
    type = "danger", // 'danger' | 'warning' | 'info'
    autoClose = 12000,
  } = config;

  return new Promise((resolve) => {
    let resolved = false;

    const onAction = (result, closeToast) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
      if (typeof closeToast === "function") {
        closeToast();
      }
    };

    toast(
      ({ closeToast }) => (
        <div className="vb-confirm-box">
          <div className="vb-confirm-box__header">
            <div className={`vb-confirm-box__icon vb-confirm-box__icon--${type}`}>
              {type === "danger" ? <FaTrash size={11} /> : <FaExclamationTriangle size={11} />}
            </div>
            <span className="vb-confirm-box__title">{title}</span>
            <button
              type="button"
              className="vb-confirm-box__close"
              onClick={() => onAction(false, closeToast)}
              aria-label="Close"
            >
              <FaTimes size={10} />
            </button>
          </div>

          <p className="vb-confirm-box__message">{message}</p>

          <div className="vb-confirm-box__actions">
            <button
              type="button"
              className="vb-confirm-box__btn vb-confirm-box__btn--cancel"
              onClick={() => onAction(false, closeToast)}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`vb-confirm-box__btn vb-confirm-box__btn--confirm ${
                type === "danger" ? "vb-confirm-box__btn--danger" : ""
              }`}
              onClick={() => onAction(true, closeToast)}
            >
              <FaCheck size={9} />
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      ),
      {
        position: "top-right",
        autoClose: autoClose,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        transition: Slide,
        className: "vb-confirm-toast-item",
        bodyClassName: "vb-confirm-toast-body",
        onClose: () => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        },
      }
    );
  });
};

if (typeof window !== "undefined") {
  window.confirmDialog = confirmDialog;
}

export default confirmDialog;
