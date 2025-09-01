import React, { useState, useEffect } from "react";
import { FaSmile, FaImage, FaVideo, FaFileAlt, FaTimes } from "react-icons/fa";
import Picker from "emoji-picker-react";
import { db, auth } from "../../components/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import PostItem from "./PostItem";

// Upload to Cloudinary
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

  if (!res.ok) throw new Error("Upload failed!");
  const data = await res.json();
  return data.secure_url;
};

const GroupPosts = ({ groupId }) => {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  const user = auth.currentUser;

  // Fetch posts in real-time
  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "Groups", groupId, "Posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        groupId,
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Handle file uploads
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

  // Submit post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content && media.length === 0) {
      alert("Please enter content or add media!");
      return;
    }

    if (!user) {
      alert("You need to log in to post!");
      return;
    }

    setLoading(true);
    try {
      // Upload media to Cloudinary
      const uploadedUrls = await Promise.all(
        media.map((m) => uploadToCloudinary(m.file))
      );

      // Save post to Firestore
      await addDoc(collection(db, "Groups", groupId, "Posts"), {
        content,
        mediaUrls: uploadedUrls,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL || null,
        status: "public",
      });

      setContent("");
      setMedia([]);
      setShowEmoji(false);
    } catch (err) {
      console.error("Error posting:", err);
      alert("Failed to post!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-4">
      {/* Post Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 py-4 px-4 rounded-2xl shadow-md mb-4"
      >
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded-xl mb-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {showEmoji && <Picker onEmojiClick={handleEmojiClick} />}

        {/* Media Preview */}
        {media.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
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
              className="text-yellow-500 hover:text-yellow-600"
            >
              <FaSmile size={20} />
            </button>
            <label className="cursor-pointer text-green-500 hover:text-green-600">
              <FaImage size={20} />
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
            <label className="cursor-pointer text-red-500 hover:text-red-600">
              <FaVideo size={20} />
              <input
                type="file"
                hidden
                multiple
                accept="video/*"
                onChange={handleFileChange}
              />
            </label>
            <label className="cursor-pointer text-blue-500 hover:text-blue-600">
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
            className="bg-blue-600 text-white px-4 py-1 rounded-xl hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {/* Post List */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No posts yet. Be the first to post!
          </div>
        ) : (
          posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupPosts;