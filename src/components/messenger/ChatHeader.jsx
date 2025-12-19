import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import {
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaArrowLeft,
  FaUser,
  FaPalette,
  FaSmile,
  FaTag,
  FaUsers,
  FaBellSlash,
  FaBan,
  FaLock,
  FaShieldAlt,
  FaCheck,
} from "react-icons/fa";
import { LanguageContext } from "../../context/LanguageContext";
import "../../style/ChatHeader.css";

/**
 * Props:
 * - user
 * - theme: "light" | "dark"
 * - onBack?
 * - onApplyTheme?: ({ backgroundColor, messageColor }) => void
 * - initialTheme?: { backgroundColor?: string, messageColor?: string }
 */
const ChatHeader = ({ user, theme, onBack, onApplyTheme, initialTheme }) => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const isLight = theme === "light";

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // panel đang mở trong modal: null | "theme" | "emoji" | "nickname" | ...
  const [activePanel, setActivePanel] = useState(null);

  // theme state (local)
  const [customBackgroundColor, setCustomBackgroundColor] = useState(
    initialTheme?.backgroundColor || "#ffffff"
  );
  const [customMessageColor, setCustomMessageColor] = useState(
    initialTheme?.messageColor || "#0d6efd"
  );

  // preview styles (hiển thị mini bubble trong panel)
  const previewStyle = useMemo(() => {
    return {
      background: customBackgroundColor,
      border: isLight ? "1px solid rgba(0,0,0,.08)" : "1px solid rgba(255,255,255,.10)",
    };
  }, [customBackgroundColor, isLight]);

  const bubbleStyle = useMemo(() => {
    return {
      background: customMessageColor,
      color: "#fff",
    };
  }, [customMessageColor]);

  if (!user) return null;

  const handleViewProfile = () => {
    navigate(`/profile/${user.uid}`);
    setShowSettingsModal(false);
    setActivePanel(null);
  };

  const closeModal = () => {
    setShowSettingsModal(false);
    setActivePanel(null);
  };

  const applyThemeNow = () => {
    onApplyTheme?.({
      backgroundColor: customBackgroundColor,
      messageColor: customMessageColor,
    });
    // vẫn giữ modal mở để người dùng thấy, hoặc bạn muốn auto close thì bật dòng dưới
    // closeModal();
  };

  return (
    <>
      <div className={`chat-header ${isLight ? "light" : "dark"}`}>

        {/* LEFT SIDE */}
        <div className="chat-header-left">
          {onBack && (
            <button
              className="btn btn-link p-0 chat-back-btn"
              onClick={onBack}
            >
              <FaArrowLeft size={18} />
            </button>
          )}

          <div className="chat-header-info">
            <UserAvatar user={user} size={44} showOnline />
            <div>
              <h5 className="chat-header-name">
                {user.firstName} {user.lastName}
              </h5>
              <small
                className={`chat-header-status ${user.isOnline ? "online" : ""
                  } ${isLight ? "light" : "dark"}`}
              >
                {user.isOnline ? "online" : "offline"}
              </small>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="chat-header-actions">
          <button className="btn btn-outline-secondary rounded-circle">
            <FaPhone size={16} />
          </button>
          <button className="btn btn-outline-secondary rounded-circle">
            <FaVideo size={16} />
          </button>
          <button
            className="btn btn-outline-secondary rounded-circle"
            onClick={() => setShowSettingsModal(true)}
          >
            <FaEllipsisV size={16} />
          </button>
        </div>
      </div>


      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activePanel ? "Chat Settings" : "Chat Settings"}
                </h5>
                <button type="button" className="text-gray-500 hover:text-gray-700 text-2xl" onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className="chat-settings-body">
                {/* Header user mini */}
                <div className="d-flex align-items-center mb-3">
                  <UserAvatar user={user} size={50} showOnline={false} />
                  <div className="ms-3">
                    <h6 className="mb-0">
                      {user.firstName} {user.lastName}
                    </h6>
                    <small className="text-muted">
                      {user.isOnline ? "Online" : "Offline"}
                    </small>
                  </div>
                </div>

                <hr />

                {/* ====== KHU VỰC PANEL (chèn vào khoảng trống) ====== */}
                {activePanel === "theme" && (
                  <div className="settings-panel">
                    <div className="settings-panel-head">
                      <div className="settings-panel-title">
                        <FaPalette /> <span>Change Theme</span>
                      </div>

                      <div className="settings-panel-actions">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setActivePanel(null)}>
                          Back
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={applyThemeNow}>
                          <FaCheck className="me-2" />
                          Apply
                        </button>
                      </div>
                    </div>

                    <div className="settings-panel-grid">
                      <div className="settings-panel-item">
                        <div className="settings-label">Chat background</div>
                        <div className="settings-row">
                          <input
                            type="color"
                            value={customBackgroundColor}
                            onChange={(e) => setCustomBackgroundColor(e.target.value)}
                            className="color-input"
                          />
                          <span className="color-value">{customBackgroundColor}</span>
                        </div>
                      </div>

                      <div className="settings-panel-item">
                        <div className="settings-label">My message bubble</div>
                        <div className="settings-row">
                          <input
                            type="color"
                            value={customMessageColor}
                            onChange={(e) => setCustomMessageColor(e.target.value)}
                            className="color-input"
                          />
                          <span className="color-value">{customMessageColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* preview */}
                    <div className="settings-preview" style={previewStyle}>
                      <div className="settings-preview-bubble" style={bubbleStyle}>
                        Hello 👋
                      </div>
                      <div className={`settings-preview-bubble ghost ${isLight ? "" : "dark"}`}>
                        Hi!
                      </div>
                    </div>
                  </div>
                )}

                {/* (placeholder) các panel khác: Emoji/Nickname... */}
                {activePanel === "emoji" && (
                  <div className="settings-panel">
                    <div className="settings-panel-head">
                      <div className="settings-panel-title">
                        <FaSmile /> <span>Emoji</span>
                      </div>
                      <div className="settings-panel-actions">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setActivePanel(null)}>
                          Back
                        </button>
                      </div>
                    </div>
                    <div className="settings-panel-placeholder">
                      (Chỗ này bạn sẽ render picker emoji / quick emoji…)
                    </div>
                  </div>
                )}

                {activePanel === "nickname" && (
                  <div className="settings-panel">
                    <div className="settings-panel-head">
                      <div className="settings-panel-title">
                        <FaTag /> <span>Nickname</span>
                      </div>
                      <div className="settings-panel-actions">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setActivePanel(null)}>
                          Back
                        </button>
                      </div>
                    </div>
                    <div className="settings-panel-placeholder">
                      (Chỗ này bạn sẽ render form đổi nickname…)
                    </div>
                  </div>
                )}

                {/* ====== DANH SÁCH SETTINGS (bị “đẩy xuống”) ====== */}
                <div className={`settings-list ${activePanel ? "pushed" : ""}`}>
                  <button
                    className="btn btn-light w-100 text-start mb-2 d-flex align-items-center"
                    onClick={handleViewProfile}
                  >
                    <FaUser className="me-3" />
                    View Profile
                  </button>

                  <button
                    className="btn btn-light w-100 text-start mb-2 d-flex align-items-center"
                    onClick={() => setActivePanel("theme")}
                  >
                    <FaPalette className="me-3" />
                    Change Theme
                  </button>

                  <button
                    className="btn btn-light w-100 text-start mb-2 d-flex align-items-center"
                    onClick={() => setActivePanel("emoji")}
                  >
                    <FaSmile className="me-3" />
                    Emoji
                  </button>

                  <button
                    className="btn btn-light w-100 text-start mb-2 d-flex align-items-center"
                    onClick={() => setActivePanel("nickname")}
                  >
                    <FaTag className="me-3" />
                    Nickname
                  </button>

                  <button className="btn btn-light w-100 text-start mb-2 d-flex align-items-center">
                    <FaUsers className="me-3" />
                    Create Group
                  </button>

                  <button className="btn btn-light w-100 text-start mb-2 d-flex align-items-center">
                    <FaBellSlash className="me-3" />
                    Mute Notifications
                  </button>

                  <button className="btn btn-light w-100 text-start mb-2 d-flex align-items-center">
                    <FaBan className="me-3" />
                    Block
                  </button>

                  <button className="btn btn-light w-100 text-start mb-2 d-flex align-items-center">
                    <FaLock className="me-3" />
                    Restrict
                  </button>

                  <button className="btn btn-light w-100 text-start d-flex align-items-center">
                    <FaShieldAlt className="me-3" />
                    End-to-End Encrypted
                  </button>
                </div>
              </div>
              {/* end body */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatHeader;
