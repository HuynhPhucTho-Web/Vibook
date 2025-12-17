import React, { useContext, useState, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { auth, db } from "../../components/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FaImage, FaVideo, FaFile, FaSmile } from "react-icons/fa";
import Picker from "emoji-picker-react";
import "../../style/GroupPost.css";

const uploadToCloudinary = async (file) => {
  const cloud = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  let type = "auto";
  if (file.type.startsWith("image/")) type = "image";
  else if (file.type.startsWith("video/")) type = "video";
  else type = "raw";
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${type}/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
};

export default function GroupPostComposer({ groupId }) {
  const { theme } = useContext(ThemeContext);
  const isLight = theme === "light";

  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]); // [{file, preview}]
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => media.forEach((m) => m.preview && URL.revokeObjectURL(m.preview)), [media]);

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const next = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setMedia((p) => [...p, ...next]);
    e.target.value = "";
  };

  const removeAt = (idx) => {
    setMedia((p) => {
      const cp = [...p];
      const [rm] = cp.splice(idx, 1);
      if (rm?.preview) URL.revokeObjectURL(rm.preview);
      return cp;
    });
  };

  const onEmojiClick = (e) => setContent((s) => s + (e?.emoji || ""));

  const submit = async () => {
    if (loading) return;
    if (!content.trim() && media.length === 0) return;

    setLoading(true);
    try {
      const urls = [];
      for (const m of media) urls.push(await uploadToCloudinary(m.file));

      await addDoc(collection(db, "Groups", groupId, "Posts"), {
        content: content.trim(),
        mediaUrls: urls,
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || "Anonymous",
        userPhoto: auth.currentUser?.photoURL || null,
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
      });

      setContent("");
      setMedia([]);
      setShowEmoji(false);
    } catch (e) {
      console.error(e);
      alert("Đăng bài thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`gpc-card ${isLight ? "is-light" : "is-dark"}`}>
      <div className="gpc-top">
        <textarea
          placeholder="Bạn đang nghĩ gì?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="gpc-textarea"
        />

        {media.length > 0 && (
          <div className="gpc-mediaGrid">
            {media.map((m, i) => (
              <div key={i} className="gpc-mediaItem">
                {m.file.type.startsWith("video") ? (
                  <video src={m.preview} className="gpc-media" controls />
                ) : (
                  <img src={m.preview} className="gpc-media" alt="" />
                )}
                <button type="button" onClick={() => removeAt(i)} className="gpc-remove" aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="gpc-actions">
          <div className="gpc-tools">
            <label className="gpc-tool gpc-toolImg">
              <FaImage />
              <input type="file" hidden accept="image/*" multiple onChange={onPickFiles} />
            </label>
            <label className="gpc-tool gpc-toolVid">
              <FaVideo />
              <input type="file" hidden accept="video/*" multiple onChange={onPickFiles} />
            </label>
            <label className="gpc-tool gpc-toolFile">
              <FaFile />
              <input type="file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple onChange={onPickFiles} />
            </label>
            <button type="button" onClick={() => setShowEmoji((s) => !s)} className="gpc-tool gpc-toolEmoji" aria-expanded={showEmoji}>
              <FaSmile />
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading || (!content.trim() && media.length === 0)}
            className={`gpc-postBtn ${loading || (!content.trim() && media.length === 0) ? "is-disabled" : ""}`}
          >
            {loading ? "Đang đăng…" : "Đăng"}
          </button>
        </div>
      </div>

      {showEmoji && (
        <div className="gpc-emoji">
          <div className="gpc-emojiInner">
            <Picker
              onEmojiClick={(_, e) => onEmojiClick(e)}
              theme={isLight ? "light" : "dark"}
              previewConfig={{ showPreview: false }}
              height={340}
              width="100%"
            />
          </div>
        </div>
      )}
    </div>
  );
}
