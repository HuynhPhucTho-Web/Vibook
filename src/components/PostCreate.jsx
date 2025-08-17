import React, { useState, useContext, useEffect } from "react";
import { auth, db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaImage } from "react-icons/fa";
import { AdvancedImage, AdvancedVideo } from "@cloudinary/react";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

const PostCreator = ({ onPostCreated }) => {
  const { theme } = useContext(ThemeContext);
  const [postContent, setPostContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [publicId, setPublicId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Current date and time for debugging
  const currentDateTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "long",
  });
  console.log(`[${currentDateTime}] PostCreator rendered`);

  // Validate and log environment variables
  useEffect(() => {
    const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    console.log(`[${currentDateTime}] Loaded env vars:`, { cloudName, uploadPreset, allEnv: import.meta.env });
    if (!cloudName || !uploadPreset) {
      console.error(`[${currentDateTime}] Missing Cloudinary environment variables:`, { cloudName, uploadPreset });
      toast.error("Cloudinary configuration is missing. Please check your .env file.", {
        position: "top-center",
      });
    } else {
      console.log(`[${currentDateTime}] Cloudinary Config:`, { cloudName, uploadPreset });
    }
  }, []);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log(`[${currentDateTime}] Auth state changed:`, user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Clean up video preview URLs
  useEffect(() => {
    return () => {
      if (mediaPreview && mediaFile?.type?.startsWith("video/")) {
        console.log(`[${currentDateTime}] Revoking video preview URL`);
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview, mediaFile]);

  // Initialize Cloudinary instance with fallback
  const cld = new Cloudinary({
    cloud: { cloudName: import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME || "fallback_cloud_name" },
  });

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    console.log(`[${currentDateTime}] Selected file:`, file, "Type:", file?.type, "Size:", file?.size);
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB", { position: "top-center" });
      setMediaFile(null);
      setMediaPreview(null);
      setPublicId(null);
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Only images or videos are allowed", { position: "top-center" });
      setMediaFile(null);
      setMediaPreview(null);
      setPublicId(null);
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log(`[${currentDateTime}] Preview loaded:`, reader.result);
      setMediaPreview(reader.result);
    };
    reader.onerror = (error) => {
      console.error(`[${currentDateTime}] Error reading file:`, error);
      toast.error("Failed to load preview", { position: "top-center" });
      setMediaFile(null);
      setMediaPreview(null);
      setPublicId(null);
    };

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    // PREVENT DOUBLE SUBMISSION
    if (isUploading) {
      console.log(`[${currentDateTime}] Already uploading, ignoring duplicate submission`);
      return;
    }

    console.log(`[${currentDateTime}] Submitting post:`, { postContent, mediaFile, user: auth.currentUser });

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
      let publicIdResult = null;

      // STEP 1: Upload media to Cloudinary first (if exists)
      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        formData.append("upload_preset", import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET);

        console.log(`[${currentDateTime}] Uploading to Cloudinary...`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${currentDateTime}] Cloudinary error response:`, errorText);
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[${currentDateTime}] Cloudinary upload success:`, result.public_id);

        mediaUrl = result.secure_url;
        publicIdResult = result.public_id;
        setPublicId(publicIdResult);
      }

      // STEP 2: Create post data
      const postData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        userPhoto: auth.currentUser.photoURL || "https://via.placeholder.com/40",
        content: postContent,
        mediaUrl: mediaUrl,
        createdAt: Date.now(),
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
      };

      // STEP 3: Save to Firestore (CHỈ 1 LẦN DUY NHẤT)
      console.log(`[${currentDateTime}] Saving to Posts collection...`);
      const postRef = await addDoc(collection(db, "Posts"), postData);
      console.log(`[${currentDateTime}] Post saved successfully with ID:`, postRef.id);

      // STEP 4: Reset form NGAY LẬP TỨC
      setPostContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setPublicId(null);

      // STEP 5: Notify parent component
      const completePostData = {
        ...postData,
        id: postRef.id,
      };

      if (onPostCreated) {
        await onPostCreated(completePostData);
      }

      toast.success("Post created successfully", { position: "top-center" });

    } catch (error) {
      console.error(`[${currentDateTime}] Error creating post:`, error);
      toast.error(`Failed to create post: ${error.message}`, { position: "top-center" });
    } finally {
      setIsUploading(false);
    }
  };

  // Create Cloudinary media object for preview
  const cldMedia = publicId && mediaFile && mediaFile.type
    ? cld[mediaFile.type.startsWith("image/") ? "image" : "video"](publicId)
      .format("auto")
      .quality("auto")
      .resize(auto().gravity(autoGravity()).width(200).height(200))
    : null;

  // Show loading state while auth is initializing
  if (isLoadingAuth) {
    return <div>Loading...</div>;
  }

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
          {mediaPreview && mediaFile?.type && (
            <div className="mb-3 position-relative">
              {mediaFile.type.startsWith("image/") ? (
                cldMedia ? (
                  <AdvancedImage
                    cldImg={cldMedia}
                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                    className="img-fluid"
                    alt="Preview"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                    className="img-fluid"
                  />
                )
              ) : (
                cldMedia ? (
                  <AdvancedVideo
                    cldVid={cldMedia}
                    controls
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
                )
              )}
              <button
                type="button"
                className="btn btn-danger btn-sm mt-2"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  setPublicId(null);
                  if (mediaFile?.type?.startsWith("video/")) {
                    console.log(`[${currentDateTime}] Revoking video preview URL`);
                    URL.revokeObjectURL(mediaPreview);
                  }
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
              disabled={(!postContent.trim() && !mediaFile) || isUploading}
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