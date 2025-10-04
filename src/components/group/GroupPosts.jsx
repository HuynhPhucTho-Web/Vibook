import React, { useContext, useRef, useState, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { auth, db } from "../../components/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FaImage, FaVideo, FaFile, FaSmile } from "react-icons/fa";
import Picker from "emoji-picker-react";

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

  // revoke preview on unmount
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
      for (const m of media) {
        urls.push(await uploadToCloudinary(m.file));
      }
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
    <div
      className={`rounded-3xl shadow-md transition-all ${isLight ? "bg-white border border-gray-200" : "bg-zinc-900 border border-zinc-800"}`}
    >
      <div className="p-4">
        {/* input */}
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className={`w-full rounded-2xl p-3 outline-none resize-y ${isLight ? "bg-gray-50 text-gray-800" : "bg-zinc-800 text-gray-100"}`}
        />

        {/* media preview */}
        {media.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3">
            {media.map((m, i) => (
              <div key={i} className={`relative rounded-xl overflow-hidden ${isLight ? "bg-white ring-1 ring-gray-200" : "bg-zinc-700 ring-1 ring-gray-600"}`}>
                {m.file.type.startsWith("video") ? (
                  <video src={m.preview} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={m.preview} className="w-full h-full object-cover" alt="" />
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white grid place-items-center"
                  aria-label="Remove"
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* actions */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className={`px-3 py-2 rounded-xl cursor-pointer ${isLight ? "bg-emerald-50 text-emerald-700" : "bg-emerald-900/30 text-emerald-400"}`}>
              <FaImage />
              <input type="file" hidden accept="image/*" multiple onChange={onPickFiles} />
            </label>
            <label className={`px-3 py-2 rounded-xl cursor-pointer ${isLight ? "bg-rose-50 text-rose-700" : "bg-rose-900/30 text-rose-400"}`}>
              <FaVideo />
              <input type="file" hidden accept="video/*" multiple onChange={onPickFiles} />
            </label>
            <label className={`px-3 py-2 rounded-xl cursor-pointer ${isLight ? "bg-blue-50 text-blue-700" : "bg-blue-900/30 text-blue-400"}`}>
              <FaFile />
              <input type="file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" multiple onChange={onPickFiles} />
            </label>
            <button
              type="button"
              onClick={() => setShowEmoji((s) => !s)}
              className={`px-3 py-2 rounded-xl ${isLight ? "bg-amber-50 text-amber-700" : "bg-amber-900/30 text-amber-400"}`}
              aria-expanded={showEmoji}
            >
              <FaSmile />
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading || (!content.trim() && media.length === 0)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-white ${loading || (!content.trim() && media.length === 0)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"}`}
          >
            {loading ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {/* Emoji popover */}
      {showEmoji && (
        <div className="px-4 pb-4">
          <div className={`${isLight ? "ring-1 ring-gray-200" : "ring-1 ring-gray-700"} rounded-2xl overflow-hidden`}>
            <Picker onEmojiClick={(_, e) => onEmojiClick(e)} theme={isLight ? "light" : "dark"} previewConfig={{ showPreview: false }} height={350} width="100%" />
          </div>
        </div>
      )}
    </div>
  );
}
