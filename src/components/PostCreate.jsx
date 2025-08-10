// PostCreator.jsx
import React, { useState, useContext, useEffect } from "react";
import { auth, storage } from "../components/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaImage } from "react-icons/fa";

const PostCreator = ({ onPostCreated }) => {
  const { theme } = useContext(ThemeContext);
  const [postContent, setPostContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaPreview && mediaFile?.type.startsWith("video/")) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview, mediaFile]);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file, "Type:", file?.type, "Size:", file?.size);
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB", { position: "top-center" });
      setMediaFile(null);
      setMediaPreview(null);
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Only images or videos are allowed", { position: "top-center" });
      setMediaFile(null);
      setMediaPreview(null);
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("Preview loaded:", reader.result);
      setMediaPreview(reader.result);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Failed to load preview", { position: "top-center" });
      setMediaFile(null);
      setMediaPreview(null);
    };

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting post:", { postContent, mediaFile, user: auth.currentUser });
    if (!postContent.trim() && !mediaFile) {
      toast.error("Post content or media is required", { position: "top-center" });
      return;
    }
    if (!auth.currentUser) {
      toast.error("You must be logged in to post", { position: "top-center" });
      return;
    }

    setIsUploading(true);
    try {
      let mediaUrl = null;
      if (mediaFile) {
        const storageRef = ref(storage, `posts/${auth.currentUser.uid}/${Date.now()}_${mediaFile.name}`);
        console.log("Uploading to:", storageRef.fullPath);
        const snapshot = await uploadBytes(storageRef, mediaFile);
        console.log("Upload completed:", snapshot);
        mediaUrl = await getDownloadURL(storageRef);
        console.log("Download URL:", mediaUrl);
        if (!mediaUrl) throw new Error("Failed to retrieve download URL");
      }

      const postData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        userPhoto: auth.currentUser.photoURL || "https://via.placeholder.com/40",
        content: postContent,
        createdAt: Date.now(),
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
        mediaUrl: mediaUrl,
      };
      await onPostCreated(postData);
      setPostContent("");
      setMediaFile(null);
      setMediaPreview(null);
      toast.success("Post created successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error creating post:", error.code, error.message);
      if (error.code === "storage/cors") {
        toast.error("CORS error. Check Storage CORS settings.", { position: "top-center" });
      } else if (error.code === "storage/unauthorized") {
        toast.error("Permission denied. Check Storage Rules.", { position: "top-center" });
      } else if (error.code === "storage/network-error") {
        toast.error("Network error. Please try again.", { position: "top-center" });
      } else {
        toast.error(`Failed to create post: ${error.message}`, { position: "top-center" });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`card mb-4 shadow-sm ${theme}`}>
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <img
            src={auth.currentUser?.photoURL || "https://via.placeholder.com/40"}
            alt="Profile"
            className="rounded-circle me-3"
            style={{ width: "40px", height: "40px", objectFit: "cover" }}
          />
          <h6 className="mb-0">What's on your mind?</h6>
        </div>
        <form onSubmit={handlePostSubmit}>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's happening?"
            className="form-control mb-3"
            rows="3"
            style={{ resize: "none" }}
            disabled={isUploading}
          />
          {mediaPreview && (
            <div className="mb-3 position-relative">
              {mediaFile.type.startsWith("image/") ? (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  style={{ maxWidth: "200px", maxHeight: "200px" }}
                  className="img-fluid"
                />
              ) : (
                <video
                  controls
                  style={{ maxWidth: "200px", maxHeight: "200px" }}
                  className="img-fluid"
                >
                  <source src={mediaPreview} type={mediaFile.type} />
                  Your browser does not support the video tag.
                </video>
              )}
              <button
                type="button"
                className="btn btn-danger btn-sm mt-2"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  if (mediaFile?.type.startsWith("video/")) URL.revokeObjectURL(mediaPreview);
                }}
                disabled={isUploading}
              >
                Remove
              </button>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex">
              <label className="btn btn-link text-primary me-2 p-1">
                <FaImage /> Photo/Video
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="d-none"
                  onChange={handleMediaUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!postContent.trim() && !mediaFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCreator;