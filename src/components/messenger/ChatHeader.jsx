import React, { useEffect, useMemo, useState } from "react";
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
const ChatHeader = ({ user, theme, onBack, onApplyTheme, initialTheme, chatConfig, onUpdateChatConfig, currentUser }) => {
  const navigate = useNavigate();

  const isLight = theme === "light";

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // panel đang mở trong modal: null | "theme" | "emoji" | "nickname" | ...
  const [activePanel, setActivePanel] = useState(null);

  // Nicknames local editing states
  const [friendNickname, setFriendNickname] = useState("");
  const [myNickname, setMyNickname] = useState("");

  useEffect(() => {
    setFriendNickname(chatConfig?.nicknames?.[user.uid] || "");
    setMyNickname(chatConfig?.nicknames?.[currentUser?.uid] || "");
  }, [chatConfig, user.uid, currentUser?.uid]);

  const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "⚡", "🎉", "💩", "👀", "✨"];

  const selectQuickEmoji = (emoji) => {
    onUpdateChatConfig?.({ quickEmoji: emoji });
  };

  const saveNicknames = () => {
    onUpdateChatConfig?.({
      nicknames: {
        ...(chatConfig?.nicknames || {}),
        [user.uid]: friendNickname.trim(),
        [currentUser?.uid]: myNickname.trim()
      }
    });
    setActivePanel(null);
  };

  const isBlocked = chatConfig?.blockedBy?.includes(currentUser?.uid);
  const toggleBlock = () => {
    const currentBlockedBy = chatConfig?.blockedBy || [];
    if (isBlocked) {
      onUpdateChatConfig?.({
        blockedBy: currentBlockedBy.filter(uid => uid !== currentUser?.uid)
      });
    } else {
      onUpdateChatConfig?.({
        blockedBy: [...currentBlockedBy, currentUser?.uid]
      });
    }
  };

  const isMuted = chatConfig?.mutedBy?.includes(currentUser?.uid);
  const toggleMute = () => {
    const currentMutedBy = chatConfig?.mutedBy || [];
    if (isMuted) {
      onUpdateChatConfig?.({
        mutedBy: currentMutedBy.filter(uid => uid !== currentUser?.uid)
      });
    } else {
      onUpdateChatConfig?.({
        mutedBy: [...currentMutedBy, currentUser?.uid]
      });
    }
  };

  // theme state (local)
const [customBackgroundColor, setCustomBackgroundColor] = useState(
    initialTheme?.backgroundColor || "#ffffff"
  );
  const [customMessageColor, setCustomMessageColor] = useState(
    initialTheme?.messageColor || "#0d6efd"
  );

  // Sync local theme picker state when the applied chat theme changes
  // (e.g. app-wide theme toggle or theme change from another panel).
  useEffect(() => {
    setCustomBackgroundColor(initialTheme?.backgroundColor || "#ffffff");
    setCustomMessageColor(initialTheme?.messageColor || "#0d6efd");
  }, [initialTheme?.backgroundColor, initialTheme?.messageColor]);

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
                {chatConfig?.nicknames?.[user.uid] || `${user.firstName} ${user.lastName}`}
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

                {/* Quick Emoji selection panel */}
                {activePanel === "emoji" && (
                  <div className="settings-panel">
                    <div className="settings-panel-head">
                      <div className="settings-panel-title">
                        <FaSmile /> <span>Quick Emoji</span>
                      </div>
                      <div className="settings-panel-actions">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setActivePanel(null)}>
                          Back
                        </button>
                      </div>
                    </div>
                    <div className="settings-panel-body mt-3">
                      <p className="text-sm text-muted mb-3">Choose a quick emoji for one-click reactions:</p>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => selectQuickEmoji(emoji)}
                            className={`btn btn-lg rounded-circle border ${chatConfig?.quickEmoji === emoji ? "btn-primary border-primary" : "btn-light"}`}
                            style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nicknames setting panel */}
                {activePanel === "nickname" && (
                  <div className="settings-panel">
                    <div className="settings-panel-head">
                      <div className="settings-panel-title">
                        <FaTag /> <span>Nicknames</span>
                      </div>
                      <div className="settings-panel-actions">
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setActivePanel(null)}>
                          Back
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={saveNicknames}>
                          Save
                        </button>
                      </div>
                    </div>
                    <div className="settings-panel-body mt-3">
                      <div className="mb-3">
                        <label className="form-label text-sm font-semibold">{user.firstName}'s Nickname</label>
                        <input
                          type="text"
                          value={friendNickname}
                          onChange={(e) => setFriendNickname(e.target.value)}
                          placeholder={`${user.firstName} ${user.lastName}`}
                          className="form-control"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label text-sm font-semibold">Your Nickname</label>
                        <input
                          type="text"
                          value={myNickname}
                          onChange={(e) => setMyNickname(e.target.value)}
                          placeholder="You"
                          className="form-control"
                        />
                      </div>
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
                    Quick Emoji ({chatConfig?.quickEmoji || "👍"})
                  </button>

                  <button
                    className="btn btn-light w-100 text-start mb-2 d-flex align-items-center"
                    onClick={() => setActivePanel("nickname")}
                  >
                    <FaTag className="me-3" />
                    Edit Nicknames
                  </button>

                  <button
                    className={`btn w-100 text-start mb-2 d-flex align-items-center ${isMuted ? "btn-warning" : "btn-light"}`}
                    onClick={toggleMute}
                  >
                    <FaBellSlash className="me-3" />
                    {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                  </button>

                  <button
                    className={`btn w-100 text-start mb-2 d-flex align-items-center ${isBlocked ? "btn-danger text-white" : "btn-light"}`}
                    onClick={toggleBlock}
                  >
                    <FaBan className="me-3" />
                    {isBlocked ? "Unblock Conversation" : "Block Conversation"}
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
