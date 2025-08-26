import React, { useState } from "react";
import { FaSmile, FaImage, FaVideo, FaFileAlt, FaTimes } from "react-icons/fa";
import Picker from "emoji-picker-react";
import { db } from "../../components/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 📌 Upload lên Cloudinary
const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  let resourceType = "auto";
  if (file.type.startsWith("image/")) resourceType = "image";
  else if (file.type.startsWith("video/")) resourceType = "video";
  else resourceType = "raw";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Upload thất bại!");
  const data = await res.json();
  return data.secure_url;
};

const PostForm = ({ groupId }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // Thêm preview file
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setMedia([...media, ...files]);
    e.target.value = "";
  };

  const removeMedia = (index) => {
    const updated = [...media];
    updated.splice(index, 1);
    setMedia(updated);
  };

  const handleEmojiClick = (emojiData) => {
    setContent(content + emojiData.emoji);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title && !content && media.length === 0) {
      alert("Bạn chưa nhập nội dung hoặc thêm file nào!");
      return;
    }

    if (!user) {
      alert("Bạn cần đăng nhập để đăng bài!");
      return;
    }

    setLoading(true);
    try {
      // Upload media lên Cloudinary
      const uploadedUrls = await Promise.all(
        media.map((m) => uploadToCloudinary(m.file))
      );

      // Lưu bài viết vào Firestore
      await addDoc(collection(db, "Groups", groupId, "Posts"), {
        title,
        content,
        mediaUrls: uploadedUrls,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || "Ẩn danh",
        userPhoto: user.photoURL || null,
        status: "public",
      });



      alert("Đăng bài thành công ✅");
      setTitle("");
      setContent("");
      setMedia([]);
      setShowEmoji(false);
    } catch (err) {
      console.error("🔥 Lỗi đăng bài:", err);
      alert("Đăng bài thất bại ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white py-4 rounded-2xl shadow"
    >
      <input
        type="text"
        placeholder="Tiêu đề bài viết..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 mb-2 border rounded-xl"
      />
      <textarea
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border rounded-xl mb-2"
      />

      {showEmoji && <Picker onEmojiClick={handleEmojiClick} />}

      {/* Preview media */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {media.map((m, i) => (
            <div key={i} className="relative">
              {m.file.type.startsWith("video") ? (
                <video
                  src={m.preview}
                  controls
                  className="w-full h-28 object-cover rounded-lg"
                />
              ) : (
                <img
                  src={m.preview}
                  alt="preview"
                  className="w-full h-28 object-cover rounded-lg"
                />
              )}
              <button
                type="button"
                onClick={() => removeMedia(i)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
              >
                <FaTimes size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="text-yellow-500"
          >
            <FaSmile size={20} />
          </button>
          <label className="cursor-pointer text-green-500">
            <FaImage size={20} />
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          <label className="cursor-pointer text-red-500">
            <FaVideo size={20} />
            <input
              type="file"
              hidden
              multiple
              accept="video/*"
              onChange={handleFileChange}
            />
          </label>
          <label className="cursor-pointer text-blue-500">
            <FaFileAlt size={20} />
            <input
              type="file"
              hidden
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded-xl"
          disabled={loading}
        >
          {loading ? "Đang đăng..." : "Đăng"}
        </button>
      </div>
    </form>
  );
};

export default PostForm;
