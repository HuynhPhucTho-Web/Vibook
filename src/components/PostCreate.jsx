import React, { useState, useContext, useEffect, useRef } from "react";
import { auth, db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaImage, FaVideo, FaFile, FaEdit, FaSmile, FaCamera } from "react-icons/fa";

import { Cloudinary } from "@cloudinary/url-gen";
import Picker from "emoji-picker-react"; // <-- emoji-picker-react

const PostCreator = ({ onPostCreated }) => {
  const { theme } = useContext(ThemeContext);
  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // "user" | "environment"
  const [cameraStream, setCameraStream] = useState(null);

  // Emoji picker
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fallbackInputRef = useRef(null);
  // ở đầu component
  const emojiPopoverRef = useRef(null);
  const cameraPopoverRef = useRef(null);


  // File size limits (MB)
  const FILE_SIZE_LIMITS = { image: 10, video: 50, document: 25 };

  // Supported file types
  const SUPPORTED_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm", "video/ogg", "video/avi"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  };

  const currentDateTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "long",
  });

  // Theme styles (giữ nguyên cách bạn đang dùng)
  const getThemeStyles = () => {
    const baseStyles = {
      card: {
        backgroundColor:
          theme === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(30, 30, 30, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:
          theme === "light"
            ? "1px solid rgba(0, 0, 0, 0.1)"
            : "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        boxShadow:
          theme === "light"
            ? "0 8px 32px rgba(0, 0, 0, 0.1)"
            : "0 8px 32px rgba(0, 0, 0, 0.3)",
        color: theme === "light" ? "#000" : "#fff",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      textarea: {
        backgroundColor:
          theme === "light" ? "rgba(248, 250, 252, 0.9)" : "rgba(45, 55, 72, 0.9)",
        border: `2px solid ${isFocused
          ? theme === "light"
            ? "rgba(79, 172, 254, 0.6)"
            : "rgba(129, 140, 248, 0.6)"
          : theme === "light"
            ? "rgba(226, 232, 240, 0.8)"
            : "rgba(75, 85, 99, 0.6)"
          }`,
        borderRadius: "12px",
        color: theme === "light" ? "#1a202c" : "#f7fafc",
        transition: "all 0.3s ease",
        padding: "12px 16px 12px 45px",
        fontSize: "1rem",
        lineHeight: "1.6",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxShadow:
          theme === "light"
            ? isFocused
              ? "0 4px 20px rgba(79, 172, 254, 0.15)"
              : "0 2px 8px rgba(0, 0, 0, 0.05)"
            : isFocused
              ? "0 4px 20px rgba(129, 140, 248, 0.25)"
              : "0 2px 8px rgba(0, 0, 0, 0.2)",
      },
      button: {
        backgroundColor:
          theme === "light"
            ? "linear-gradient(135deg, #667eea, #764ba2)"
            : "linear-gradient(135deg, #4facfe, #00f2fe)",
        border: "none",
        borderRadius: "10px",
        color: "#fff",
        fontWeight: "600",
        padding: "8px 24px",
        transition: "all 0.3s ease",
        transform: "scale(1)",
        boxShadow:
          theme === "light"
            ? "0 4px 15px rgba(102, 126, 234, 0.4)"
            : "0 4px 15px rgba(79, 172, 254, 0.4)",
      },
      iconButton: {
        color: theme === "light" ? "rgba(55, 65, 81, 0.8)" : "rgba(229, 231, 235, 0.8)",
        backgroundColor:
          theme === "light" ? "rgba(249, 250, 251, 0.8)" : "rgba(55, 65, 81, 0.5)",
        border: `1px solid ${theme === "light" ? "rgba(229, 231, 235, 0.6)" : "rgba(75, 85, 99, 0.6)"
          }`,
        borderRadius: "8px",
        padding: "8px 12px",
        transition: "all 0.3s ease",
        fontSize: "0.9rem",
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        userSelect: "none",
      },
      inputIcon: {
        position: "absolute",
        left: "15px",
        top: "50%",
        transform: "translateY(-50%)",
        color:
          theme === "light"
            ? isFocused
              ? "rgba(79, 172, 254, 0.8)"
              : "rgba(107, 114, 128, 0.6)"
            : isFocused
              ? "rgba(129, 140, 248, 0.8)"
              : "rgba(156, 163, 175, 0.6)",
        fontSize: "1.1rem",
        zIndex: 1,
        transition: "color 0.3s ease",
      },
    };
    return baseStyles;
  };
  const styles = getThemeStyles();

  const supportMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // Mở camera
  const openCamera = async () => {
    if (!supportMedia) {
      // Fallback: kích hoạt input file dùng capture (iOS Safari)
      fallbackInputRef.current?.click();
      return;
    }
    try {
      // đóng stream cũ nếu có
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setCameraStream(stream);
      setShowCamera(true);
      // gắn stream vào video
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }
      });
    } catch (err) {
      console.error("Open camera error:", err);
      toast.error("Không mở được camera. Hãy kiểm tra quyền truy cập.", { position: "top-center" });
    }
  };

  // Đóng camera
  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Đổi camera trước/sau
  const toggleFacing = async () => {
    setFacingMode(prev => (prev === "environment" ? "user" : "environment"));
    // Mở lại stream theo facing mới
    setTimeout(() => openCamera(), 0);
  };

  // Chụp ảnh → thêm vào mediaFiles
  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 720;
    const h = video.videoHeight || 1280;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fileName = `camera-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // tạo preview dataURL để hiển thị ngay
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result;
        const fileData = {
          file,
          preview,
          category: "image",
          type: "image/png",
          name: fileName,
          size: file.size,
          id: Date.now() + Math.random(),
        };
        setMediaFiles(prev => [...prev, fileData]);
        toast.success("Đã chụp ảnh và thêm vào bài viết.", { position: "top-center" });
        // giữ camera mở để chụp tiếp; muốn tự đóng thì gọi closeCamera();
      };
      reader.readAsDataURL(file);
    }, "image/png", 0.92);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // nếu đang mở emoji và click KHÔNG nằm trong popover & KHÔNG nằm trên nút toggle
      if (
        showEmoji &&
        emojiPopoverRef.current &&
        !emojiPopoverRef.current.contains(e.target) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(e.target)
      ) {
        setShowEmoji(false);
      }

      // nếu đang mở camera
      if (
        showCamera &&
        cameraPopoverRef.current &&
        !cameraPopoverRef.current.contains(e.target)
      ) {
        setShowCamera(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (showEmoji) setShowEmoji(false);
        if (showCamera) setShowCamera(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showEmoji, showCamera]);


  // Fallback iOS: chọn trực tiếp từ camera
  const onFallbackCapture = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // Tái sử dụng validate/preview sẵn có
    for (const f of files) {
      const validation = validateFile(f);
      if (!validation.valid) {
        toast.error(validation.error, { position: "top-center" });
        continue;
      }
      const preview = await createFilePreview(f);
      const fileData = {
        file: f,
        preview,
        category: "image",
        type: f.type,
        name: f.name,
        size: f.size,
        id: Date.now() + Math.random(),
      };
      setMediaFiles(prev => [...prev, fileData]);
    }
    // reset input
    e.target.value = "";
  };


  // Cloudinary config check
  useEffect(() => {
    const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      console.error(`[${currentDateTime}] Missing Cloudinary environment variables`);
      toast.error("Cloudinary configuration is missing. Please check your .env file.", {
        position: "top-center",
      });
    }
  }, []);

  // Auth ready
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => setIsLoadingAuth(false));
    return () => unsubscribe();
  }, []);

  // cleanup previews
  useEffect(() => {
    return () => {
      mediaFiles.forEach((f) => {
        if (f.preview && f.type?.startsWith("video/")) URL.revokeObjectURL(f.preview);
      });
    };
  }, [mediaFiles]);

  // Cloudinary (giữ nguyên)
  const cld = new Cloudinary({
    cloud: {
      cloudName: import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME || "fallback_cloud_name",
    },
  });

  // Helpers
  const getFileCategory = (fileType) => {
    if (SUPPORTED_TYPES.image.includes(fileType)) return "image";
    if (SUPPORTED_TYPES.video.includes(fileType)) return "video";
    if (SUPPORTED_TYPES.document.includes(fileType)) return "document";
    return "unknown";
  };

  const validateFile = (file) => {
    const category = getFileCategory(file.type);
    if (category === "unknown") return { valid: false, error: `File type ${file.type} is not supported` };
    const maxSize = FILE_SIZE_LIMITS[category] * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `${category[0].toUpperCase() + category.slice(1)} file must be less than ${FILE_SIZE_LIMITS[category]
          }MB`,
      };
    }
    return { valid: true };
  };

  const createFilePreview = (file) =>
    new Promise((resolve, reject) => {
      const category = getFileCategory(file.type);
      if (category === "image") {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else if (category === "video") {
        resolve(URL.createObjectURL(file));
      } else {
        resolve(null);
      }
    });

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed per post", { position: "top-center" });
      return;
    }
    const validFiles = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error, { position: "top-center" });
        continue;
      }
      try {
        const preview = await createFilePreview(file);
        const fileCategory = getFileCategory(file.type);
        validFiles.push({
          file,
          preview,
          category: fileCategory,
          type: file.type,
          name: file.name,
          size: file.size,
          id: Date.now() + Math.random(),
        });
      } catch (err) {
        console.error(`Error creating preview for ${file.name}:`, err);
        toast.error(`Failed to load preview for ${file.name}`, { position: "top-center" });
      }
    }
    setMediaFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (fileId) => {
    setMediaFiles((prev) => {
      const f = prev.find((x) => x.id === fileId);
      if (f?.preview && f.category === "video") URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== fileId);
    });
  };

  const uploadFileToCloudinary = async (fileData, index, totalFiles) => {
    const formData = new FormData();
    formData.append("file", fileData.file);
    formData.append("upload_preset", import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET);
    if (fileData.category === "document") formData.append("resource_type", "raw");
    else if (fileData.category === "video") formData.append("resource_type", "video");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME
      }/${fileData.category === "document" ? "raw" : "auto"}/upload`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${currentDateTime}] Cloudinary error:`, errorText);
      throw new Error(`Upload failed for ${fileData.name}: ${response.statusText}`);
    }
    const result = await response.json();
    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      originalName: fileData.name,
      size: fileData.size,
      category: fileData.category,
    };
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;
    if (!postContent.trim() && mediaFiles.length === 0) {
      toast.error("Post content or media is required", { position: "top-center" });
      return;
    }
    if (!auth.currentUser) {
      toast.error("You must be logged in to post", { position: "top-center" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let uploadedMedia = [];
      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const uploadResult = await uploadFileToCloudinary(mediaFiles[i], i, mediaFiles.length);
          uploadedMedia.push(uploadResult);
          setUploadProgress(((i + 1) / mediaFiles.length) * 100);
        }
      }

      const postData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        userPhoto: auth.currentUser.photoURL || "https://via.placeholder.com/40",
        content: postContent,
        mediaFiles: uploadedMedia,
        createdAt: Date.now(),
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
      };

      const postRef = await addDoc(collection(db, "Posts"), postData);

      setPostContent("");
      setMediaFiles([]);
      setUploadProgress(0);
      if (onPostCreated) await onPostCreated({ ...postData, id: postRef.id });
      toast.success("Post created successfully", { position: "top-center" });
    } catch (error) {
      console.error(`[${currentDateTime}] Error creating post:`, error);
      toast.error(`Failed to create post: ${error.message}`, { position: "top-center" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // === EMOJI ===
  // Chèn emoji tại vị trí con trỏ
  const insertAtCursor = (emojiStr) => {
    const el = textareaRef.current;
    if (!el) {
      setPostContent((prev) => prev + emojiStr);
      return;
    }
    const start = el.selectionStart ?? postContent.length;
    const end = el.selectionEnd ?? postContent.length;
    const next = postContent.slice(0, start) + emojiStr + postContent.slice(end);
    setPostContent(next);
    // set lại con trỏ
    setTimeout(() => {
      el.focus();
      const pos = start + emojiStr.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  // Bạn yêu cầu dùng đúng chữ ký này
  const handleEmojiClick = (emojiData /* , event */) => {
    insertAtCursor(emojiData.emoji);
  };

  // đóng picker khi click ra ngoài
  useEffect(() => {
    const onClickAway = (ev) => {
      const picker = document.querySelector(".pc-emoji-popover");
      if (!picker) return;
      if (!picker.contains(ev.target) && !emojiBtnRef.current?.contains(ev.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  // === RENDER PREVIEW ===
  const renderFilePreview = (fileData) => {
    const { category, preview, name, id, file } = fileData;
    const previewStyle = {
      backgroundColor: theme === "light" ? "rgba(248, 250, 252, 0.9)" : "rgba(45, 55, 72, 0.9)",
      border: `1px solid ${theme === "light" ? "rgba(226, 232, 240, 0.8)" : "rgba(75, 85, 99, 0.6)"
        }`,
      borderRadius: "12px",
      overflow: "hidden",
      backdropFilter: "blur(10px)",
    };

    if (category === "image") {
      return (
        <div key={id} className="position-relative d-inline-block me-2 mb-2" style={previewStyle}>
          <img
            src={preview}
            alt={name}
            style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "cover" }}
            className="img-fluid"
          />
          <button
            type="button"
            className="btn btn-danger btn-sm position-absolute"
            style={{ top: "5px", right: "5px", fontSize: "10px", padding: "4px 8px", borderRadius: "50%" }}
            onClick={() => removeFile(id)}
            disabled={isUploading}
          >
            ×
          </button>
        </div>
      );
    }

    if (category === "video") {
      return (
        <div key={id} className="position-relative d-inline-block me-2 mb-2" style={previewStyle}>
          <video controls style={{ maxWidth: "150px", maxHeight: "150px" }}>
            <source src={preview} type={file.type} />
          </video>
          <button
            type="button"
            className="btn btn-danger btn-sm position-absolute"
            style={{ top: "5px", right: "5px", fontSize: "10px", padding: "4px 8px", borderRadius: "50%" }}
            onClick={() => removeFile(id)}
            disabled={isUploading}
          >
            ×
          </button>
        </div>
      );
    }

    if (category === "document") {
      return (
        <div key={id} className="position-relative d-inline-block me-2 mb-2 p-3" style={previewStyle}>
          <div className="d-flex align-items-center">
            <FaFile className="me-2 text-primary" size={20} />
            <div>
              <small className="d-block" style={{ color: theme === "light" ? "#1a202c" : "#f7fafc" }}>
                {name}
              </small>
              <small style={{ color: theme === "light" ? "rgba(107, 114, 128, 0.8)" : "rgba(156, 163, 175, 0.8)" }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm position-absolute"
            style={{ top: "5px", right: "5px", fontSize: "10px", padding: "4px 8px", borderRadius: "50%" }}
            onClick={() => removeFile(id)}
            disabled={isUploading}
          >
            ×
          </button>
        </div>
      );
    }
    return null;
  };

  if (isLoadingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="post-card-wrap">
      <div className="post-card">
        {/* User row */}
        <div className="user-row">
          <div className="avatar-wrap">
            <img
              src={auth.currentUser?.photoURL || "https://via.placeholder.com/40"}
              alt="Profile"
              className="avatar"
            />
            <span className="status-dot" />
          </div>
          <div className="user-meta">
            <h6 className="user-name">{auth.currentUser?.displayName || "User"}</h6>
            <small className="user-desc">What's on your mind?</small>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePostSubmit} className="pc-form">
          {/* Textarea */}
          <div className="textarea-wrap">
            <FaEdit className="input-icon" />
            <textarea
              ref={textareaRef}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Share your thoughts, ideas, or experiences..."
              className="pc-textarea"
              rows={4}
              disabled={isUploading}
            />
          </div>

          {/* Quick emoji bar */}
          <div className="chip-row">
            {["😀", "😍", "🔥", "👏", "💯", "🙏", "🎉", "😎"].map((em) => (
              <button key={em} type="button" className="chip" onClick={() => insertAtCursor(em)}>
                {em}
              </button>
            ))}
          </div>

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div className="media-area">
              <h6 className="media-title">
                <FaSmile className="me-2" />
                Media Attachments ({mediaFiles.length}/5)
              </h6>
              <div className="media-grid">{mediaFiles.map(renderFilePreview)}</div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="progress-wrap">
              <div className="progress-head">
                <small>Uploading files...</small>
                <small>{Math.round(uploadProgress)}%</small>
              </div>
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          )}

          {/* Actions (auto-fit, luôn thẳng hàng, không vỡ) */}
          <div className="actions-grid">
            {/* Photo */}
            <label className="action-btn">
              <FaImage className="action-icon" />
              <span>Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleMediaUpload}
                disabled={isUploading || mediaFiles.length >= 5}
              />
            </label>

            {/* Video */}
            <label className="action-btn">
              <FaVideo className="action-icon" />
              <span>Video</span>
              <input
                type="file"
                accept="video/*"
                multiple
                className="sr-only"
                onChange={handleMediaUpload}
                disabled={isUploading || mediaFiles.length >= 5}
              />
            </label>

            {/* File */}
            <label className="action-btn">
              <FaFile className="action-icon" />
              <span>File</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                className="sr-only"
                onChange={handleMediaUpload}
                disabled={isUploading || mediaFiles.length >= 5}
              />
            </label>

            {/* Emoji toggle */}
            <button
              type="button"
              ref={emojiBtnRef}
              onClick={() => setShowEmoji((s) => !s)}
              className="action-btn"
              disabled={isUploading}
            >
              <FaSmile className="action-icon" />
              <span>Emoji</span>
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={(!postContent.trim() && mediaFiles.length === 0) || isUploading}
              className="submit-btn"
            >
              {isUploading ? (
                <>
                  <svg className="spin" viewBox="0 0 24 24">
                    <circle className="c1" cx="12" cy="12" r="10" strokeWidth="4" fill="none" />
                    <path className="c2" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                "Share Post"
              )}
            </button>

            {/* Camera */}
            <button
              type="button"
              title="Open camera"
              onClick={openCamera}
              disabled={isUploading}
              className="action-btn"
            >
              <FaCamera className="action-icon" />
              <span>Camera</span>
            </button>
          </div>

          {showEmoji && (
            <div ref={emojiPopoverRef} className="pc-emoji-popover" style={{ /* ...giữ nguyên... */ }}>
              <Picker onEmojiClick={handleEmojiClick} theme={theme === "light" ? "light" : "dark"} />
            </div>
          )}

          {/* Camera Popover */}
          {showCamera && (
            <div className="popover pop-camera">
              <div className="cam-view">
                <video ref={videoRef} playsInline muted className="cam-video" />
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>
              <div className="cam-ctrl">
                <button type="button" className="btn-ico" title="Switch" onClick={toggleFacing}>↻</button>
                <button type="button" className="btn-capture" onClick={capturePhoto}>Capture</button>
                <button type="button" className="btn-ico" title="Close" onClick={closeCamera}>✕</button>
              </div>
            </div>
          )}

          {mediaFiles.length >= 5 && (
            <div className="limit-note">
              <small>⚠️ Maximum 5 files per post reached</small>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PostCreator;
