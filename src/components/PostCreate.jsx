import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { FaImage, FaVideo, FaFile, FaSmile, FaCamera, FaTimes, FaExpand, FaUser } from "react-icons/fa";
import { Cloudinary } from "@cloudinary/url-gen";
import Picker from "emoji-picker-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { normalizeSearchText, postHtmlToText, sanitizePostHtml } from "../utils/postContent";
import { requireLogin } from "../utils/requireLogin";
import "../style/PostCreate.css";

const PostCreator = ({ onPostCreated }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  // ----- state -----
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  
  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  // Emoji
  const [showEmoji, setShowEmoji] = useState(false);

  // refs
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const emojiPopoverRef = useRef(null);
  const composerContainerRef = useRef(null);
  const cameraPopoverRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fallbackInputRef = useRef(null);

  // ----- constants -----
  const FILE_SIZE_LIMITS = { image: 10, video: 50, document: 25 };
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

  // ----- theme helpers -----
  const isLight = theme === "light";

  // ----- env check -----
  useEffect(() => {
    const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      console.error("Missing Cloudinary envs");
      toast.error(t("missingCloudinaryConfig"), { position: "top-center" });
    }
  }, [t]);

  // ----- auth ready -----
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => setIsLoadingAuth(false));
    return () => unsub();
  }, []);

  // Keep active blob previews alive while the list changes, then clean them up
  // when the composer unmounts.
  const mediaFilesRef = useRef(mediaFiles);
  useEffect(() => {
    mediaFilesRef.current = mediaFiles;
  }, [mediaFiles]);
  useEffect(() => () => {
    mediaFilesRef.current.forEach((f) => {
      if (f.preview && f.type?.startsWith("video/")) URL.revokeObjectURL(f.preview);
    });
  }, []);

  // ----- Cloudinary client (optional to transform) -----
  new Cloudinary({
    cloud: { cloudName: import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME || "fallback" },
  });

  // ===== Helpers =====
  const getFileCategory = (t) => {
    if (SUPPORTED_TYPES.image.includes(t)) return "image";
    if (SUPPORTED_TYPES.video.includes(t)) return "video";
    if (SUPPORTED_TYPES.document.includes(t)) return "document";
    return "unknown";
  };

  const validateFile = (file) => {
    const category = getFileCategory(file.type);
    if (category === "unknown") return { valid: false, error: `${t("unsupportedFormat")}${file.type}` };
    const max = FILE_SIZE_LIMITS[category] * 1024 * 1024;
    if (file.size > max) {
      return { valid: false, error: `${t("fileTooLarge")}${category} ${FILE_SIZE_LIMITS[category]}MB` };
    }
    return { valid: true };
  };

  const createFilePreview = (file) =>
    new Promise((resolve, reject) => {
      const category = getFileCategory(file.type);
      if (category === "image") {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      } else if (category === "video") {
        resolve(URL.createObjectURL(file));
      } else resolve(null);
    });

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setIsComposerExpanded(true);
    if (mediaFiles.length + files.length > 5) {
      toast.error(t("maxFilesError"), { position: "top-center" });
      return;
    }
    const push = [];
    for (const f of files) {
      const ok = validateFile(f);
      if (!ok.valid) {
        toast.error(ok.error, { position: "top-center" });
        continue;
      }
      const preview = await createFilePreview(f);
      push.push({
        file: f,
        preview,
        category: getFileCategory(f.type),
        type: f.type,
        name: f.name,
        size: f.size,
        id: Date.now() + Math.random(),
      });
    }
    setMediaFiles((p) => [...p, ...push]);
    e.target.value = "";
  };

  const removeFile = (id) => {
    setMediaFiles((p) => {
      const f = p.find((x) => x.id === id);
      if (f?.preview && f.category === "video") URL.revokeObjectURL(f.preview);
      return p.filter((x) => x.id !== id);
    });
  };

  const uploadFileToCloudinary = async (fileData) => {
    const fd = new FormData();
    fd.append("file", fileData.file);
    fd.append("upload_preset", import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET);
    if (fileData.category === "document") fd.append("resource_type", "raw");
    else if (fileData.category === "video") fd.append("resource_type", "video");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME
      }/${fileData.category === "document" ? "raw" : "auto"}/upload`,
      { method: "POST", body: fd }
    );
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[${currentDateTime}] Cloudinary error`, errorText);
      throw new Error(`${t("uploadFailed")}${fileData.name}`);
    }
    const json = await res.json();
    return {
      url: json.secure_url,
      publicId: json.public_id,
      resourceType: json.resource_type,
      originalName: fileData.name,
      size: fileData.size,
      category: fileData.category,
    };
  };

  const uploadEmbeddedImage = async () => {
    if (isUploading) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error, { position: "top-center" });
        return;
      }
      setIsUploading(true);
      try {
        const uploaded = await uploadFileToCloudinary({
          file,
          category: "image",
          name: file.name,
          size: file.size,
        });
        const editor = editorRef.current?.getEditor();
        const range = editor?.getSelection(true) || { index: editor?.getLength() || 0 };
        editor?.insertEmbed(range.index, "image", uploaded.url, "user");
        editor?.setSelection(range.index + 1, 0);
      } catch (error) {
        console.error("Embedded image upload error", error);
        toast.error(error.message || t("uploadFailed"), { position: "top-center" });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block", "link", "image"],
        ["clean"],
      ],
      handlers: { image: uploadEmbeddedImage },
    },
    clipboard: { matchVisual: false },
  };

  const quillFormats = [
    "header", "bold", "italic", "underline", "strike", "list", "align",
    "blockquote", "code-block", "link", "image",
  ];

  const handlePostSubmit = async () => {
    if (isUploading) return;
    if (!postTitle.trim()) {
      toast.error(t("postTitleRequired"), { position: "top-center" });
      return;
    }
    const safeHtml = sanitizePostHtml(postContent);
    const contentText = postHtmlToText(safeHtml);
    const hasEmbeddedImage = /<img\b/i.test(safeHtml);
    if (!contentText && !hasEmbeddedImage && mediaFiles.length === 0) {
      toast.error(t("contentOrMediaRequired"), { position: "top-center" });
      return;
    }
    if (!requireLogin({ navigate, message: t("loginRequired") })) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const uploadedMedia = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const r = await uploadFileToCloudinary(mediaFiles[i]);
        uploadedMedia.push(r);
        setUploadProgress(((i + 1) / mediaFiles.length) * 100);
      }

      const postData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        userPhoto: auth.currentUser.photoURL || "/default-avatar.png",
        type: "post",
        title: postTitle.trim(),
        content: contentText,
        contentHtml: safeHtml,
        contentText,
        searchText: normalizeSearchText(`${postTitle} ${contentText}`),
        mediaFiles: uploadedMedia,
        createdAt: Date.now(),
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
        status: localStorage.getItem("vibook_default_privacy") || "public",
      };

      const ref = await addDoc(collection(db, "Posts"), postData);
      setPostContent("");
      setPostTitle("");
      setMediaFiles([]);
      setIsComposerExpanded(false);
      setUploadProgress(0);
      onPostCreated && (await onPostCreated({ ...postData, id: ref.id }));
      toast.success(t("postSuccess"), { position: "top-center" });
    } catch (err) {
      console.error(`[${currentDateTime}] create post error`, err);
      toast.error(err.message || t("postError"), { position: "top-center" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ===== Emoji helpers =====
  const insertAtCursor = (str) => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return setPostContent((previous) => `${previous}<p>${str}</p>`);
    const range = editor.getSelection(true) || { index: Math.max(0, editor.getLength() - 1) };
    editor.insertText(range.index, str, "user");
    editor.setSelection(range.index + str.length, 0);
  };
  const handleEmojiClick = (data) => insertAtCursor(data.emoji);

  // ===== Click outside to close popovers =====
  useEffect(() => {
    const onDown = (ev) => {
      if (
        isComposerExpanded &&
        !isUploading &&
        composerContainerRef.current &&
        !composerContainerRef.current.contains(ev.target)
      ) {
        cameraStream?.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
        setShowCamera(false);
        setShowEmoji(false);
        setIsFocused(false);
        setIsComposerExpanded(false);
        return;
      }
      if (
        showEmoji &&
        emojiPopoverRef.current &&
        !emojiPopoverRef.current.contains(ev.target) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(ev.target)
      ) {
        setShowEmoji(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        if (showEmoji) setShowEmoji(false);
        if (showCamera) {
          cameraStream?.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
          setShowCamera(false);
        }
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showEmoji, showCamera, cameraStream, isComposerExpanded, isUploading]);

  // ===== Camera =====
  const supportMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const openCamera = async (requestedFacingMode = facingMode) => {
    if (!supportMedia) return fallbackInputRef.current?.click();

    try {
      // tắt stream cũ nếu có
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }

      // iOS/Safari nhạy cảm với facingMode, dùng ideal + fallback
      const primary = { video: { facingMode: { ideal: requestedFacingMode } }, audio: false };
      const fallback = { video: true, audio: false };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(primary);
      } catch {
        // nếu camera sau không có → dùng camera trước
        stream = await navigator.mediaDevices.getUserMedia(fallback);
        setFacingMode("user");
      }

      setCameraStream(stream);
      setShowCamera(true);

      // gán stream sau khi component render xong
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (!v) return;

        // đảm bảo attribute có tồn tại ở DOM (đặc biệt iOS)
        v.setAttribute("playsinline", "");
        v.setAttribute("autoplay", "");
        v.muted = true;

        v.srcObject = stream;

        // chờ metadata rồi mới play (fix đen trên iOS)
        const tryPlay = async () => {
          try {
            await v.play();
          } catch {
            // ignore – người dùng sẽ bấm nút chụp vẫn OK
          }
        };

        if (v.readyState >= 2) {
          tryPlay();
        } else {
          v.onloadedmetadata = tryPlay;
        }
      });
    } catch (err) {
      console.error("Open camera error:", err);
      toast.error(t("cameraError"), { position: "top-center" });
    }
  };

 const closeCamera = () => {
  if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
  setCameraStream(null);
  setShowCamera(false);
};

 const toggleFacing = () => {
  const nextFacingMode = facingMode === "environment" ? "user" : "environment";
  setFacingMode(nextFacingMode);
  openCamera(nextFacingMode);
};

  const capturePhoto = () => {
    if (mediaFiles.length >= 5) {
      toast.error(t("maxFilesError"), { position: "top-center" });
      return;
    }
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 720;
    const h = v.videoHeight || 1280;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, w, h);
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const name = `camera-${Date.now()}.png`;
        const file = new File([blob], name, { type: "image/png" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaFiles((p) => [
            ...p,
            {
              file,
              preview: reader.result,
              category: "image",
              type: "image/png",
              name,
              size: file.size,
              id: Date.now() + Math.random(),
            },
          ]);
          toast.success(t("photoCaptured"), { position: "top-center" });
          closeCamera();
        };
        reader.readAsDataURL(file);
      },
      "image/png",
      0.92
    );
  };
  const onFallbackCapture = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) setIsComposerExpanded(true);
    for (const f of files) {
      const ok = validateFile(f);
      if (!ok.valid) {
        toast.error(ok.error, { position: "top-center" });
        continue;
      }
      const preview = await createFilePreview(f);
      setMediaFiles((p) => [
        ...p,
        { file: f, preview, category: "image", type: f.type, name: f.name, size: f.size, id: Date.now() + Math.random() },
      ]);
    }
    e.target.value = "";
  };

  // ===== Auto-resize textarea =====
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 112) + "px";
  }, [postContent]);

  // ===== UI =====
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isComposerExpanded) {
    return (
      <div className={`post-creator-container post-creator-collapsed ${isLight ? "light" : "dark"}`}>
        <div className="post-collapsed-row">
          <div className="relative flex-shrink-0 group">
            {auth.currentUser?.photoURL ? (
              <img
                src={auth.currentUser.photoURL}
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-offset-2 ring-indigo-400/50"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center ring-2 ring-offset-2 ring-indigo-400/50">
                <FaUser className="text-gray-600 text-xl" />
              </div>
            )}
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
          </div>

          <button
            type="button"
            className="post-collapsed-prompt"
            onClick={() => setIsComposerExpanded(true)}
          >
            {t("postGreeting").replace("{name}", auth.currentUser?.displayName || t("anonymous"))} {t("whatsOnYourMind")}
          </button>

          <div className="post-collapsed-actions">
            <label className="post-collapsed-action media" title={t("photoVideo")}>
              <FaImage />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={handleMediaUpload}
              />
            </label>
            <button
              type="button"
              className="post-collapsed-action camera"
              title={t("camera")}
              aria-label={t("camera")}
              onClick={() => {
                setIsComposerExpanded(true);
                openCamera();
              }}
            >
              <FaCamera />
            </button>
            <label className="post-collapsed-action document" title={t("document")}>
              <FaFile />
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                className="sr-only"
                onChange={handleMediaUpload}
              />
            </label>
            <button
              type="button"
              ref={emojiBtnRef}
              className="post-collapsed-action emoji"
              title={t("emoji")}
              aria-label={t("emoji")}
              onClick={() => {
                setIsComposerExpanded(true);
                setShowEmoji(true);
              }}
            >
              <FaSmile />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={composerContainerRef} className={`post-creator-container ${isLight ? 'light' : 'dark'}`}>
      {/* Header with avatar and input */}
      <div className="post-creator-header">
        <div className={`post-creator-compose-row ${showCamera ? "has-camera" : ""}`}>
          {/* Avatar */}
          <div className="relative flex-shrink-0 group">
            {auth.currentUser?.photoURL ? (
              <img
                src={auth.currentUser.photoURL}
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-offset-2 ring-indigo-400/50 transition-all group-hover:ring-indigo-500"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center ring-2 ring-offset-2 ring-indigo-400/50 transition-all group-hover:ring-indigo-500">
                <FaUser className="text-gray-600 text-xl" />
              </div>
            )}
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm"></span>
          </div>

          {/* Input Area */}
          <div className="post-creator-editor-column">
            <input
              type="text"
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder={t("postTitlePlaceholder")}
              maxLength={180}
              disabled={isUploading}
              className={`post-title-input mb-2 w-full rounded-xl border px-4 py-2.5 text-lg font-semibold outline-none transition-colors ${isLight ? "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400" : "border-zinc-700 bg-zinc-800 text-gray-100 placeholder:text-gray-500"}`}
            />
            <div
              className={`relative rounded-2xl transition-all duration-200 ${isFocused
                ? isLight
                  ? "ring-2 ring-indigo-400 shadow-lg shadow-indigo-100"
                  : "ring-2 ring-indigo-500 shadow-lg shadow-indigo-900/20"
                : isLight
                  ? "ring-1 ring-gray-200 hover:ring-gray-300"
                  : "ring-1 ring-gray-700 hover:ring-gray-600"
                } ${isLight ? "bg-gray-50" : "bg-zinc-800/50"}`}
            >
              <ReactQuill
                ref={editorRef}
                theme="snow"
                value={postContent}
                onChange={setPostContent}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={`${auth.currentUser?.displayName || t("anonymous")} ${t("whatsOnYourMind")}`}
                className={`post-rich-editor w-full bg-transparent rounded-2xl text-base leading-relaxed ${isLight
                  ? "text-gray-900 placeholder-gray-400"
                  : "text-gray-100 placeholder-gray-500"
                  }`}
                readOnly={isUploading}
                modules={quillModules}
                formats={quillFormats}
              />
            </div>
          </div>

          {showCamera && (
            <section
              ref={cameraPopoverRef}
              className={`post-camera-panel ${isLight ? "light" : "dark"}`}
              aria-label={t("cameraActive")}
            >
              <div className="post-camera-header">
                <div className="post-camera-status">
                  <span className="post-camera-live-dot" aria-hidden="true" />
                  <span>{t("cameraActive")}</span>
                </div>
                <div className="post-camera-header-actions">
                  <button
                    type="button"
                    onClick={toggleFacing}
                    className="post-camera-switch-btn"
                    title={t("switchCamera")}
                  >
                    {t("switch")}
                  </button>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="post-camera-close-btn"
                    title={t("close")}
                    aria-label={t("close")}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="post-camera-viewport">
                <video ref={videoRef} autoPlay playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <div className="post-camera-controls">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="post-camera-capture-btn"
                    title={t("takePhoto")}
                    aria-label={t("takePhoto")}
                  >
                    <span />
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Action Buttons */}
        <div className="post-creator-actions-container">
          <div className="post-creator-action-buttons">
            {/* Image/Video */}
            <label
              className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${isLight
                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                : "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400"
                } ${isUploading || mediaFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaImage className="text-lg" />
              <span className="text-sm font-medium hidden sm:inline">{t("photoVideo")}</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={handleMediaUpload}
                disabled={isUploading || mediaFiles.length >= 5}
              />
            </label>

            {/* Camera */}
            <button
              type="button"
              onClick={() => openCamera()}
              disabled={isUploading || mediaFiles.length >= 5}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${isLight
                ? "bg-violet-50 hover:bg-violet-100 text-violet-700"
                : "bg-violet-900/30 hover:bg-violet-900/50 text-violet-400"
                } ${isUploading || mediaFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaCamera className="text-lg" />
              <span className="text-sm font-medium hidden sm:inline">{t("camera")}</span>
            </button>

            {/* Document */}
            <label
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${isLight
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                : "bg-blue-900/30 hover:bg-blue-900/50 text-blue-400"
                } ${isUploading || mediaFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaFile className="text-lg" />
              <span className="text-sm font-medium hidden sm:inline">{t("document")}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                className="sr-only"
                onChange={handleMediaUpload}
                disabled={isUploading || mediaFiles.length >= 5}
              />
            </label>

            {/* Emoji */}
            <button
              type="button"
              ref={emojiBtnRef}
              onClick={() => setShowEmoji((s) => !s)}
              disabled={isUploading}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${isLight
                ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                : "bg-amber-900/30 hover:bg-amber-900/50 text-amber-400"
                } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaSmile className="text-lg" />
              <span className="text-sm font-medium hidden sm:inline">{t("emoji")}</span>
            </button>
          </div>

          {/* Post Button */}
          <button
            type="button"
            onClick={handlePostSubmit}
            disabled={(!postTitle.trim() || (!postContent.trim() && mediaFiles.length === 0)) || isUploading}
            className={`post-creator-submit-btn ${(!postTitle.trim() || (!postContent.trim() && mediaFiles.length === 0)) || isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl"
              }`}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t("posting")}
              </span>
            ) : (
              t("post")
            )}
          </button>
        </div>
      </div>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="post-media-preview-wrap">
          <div className={`rounded-2xl p-4 ${isLight ? "bg-gray-50" : "bg-zinc-800/50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                {t("attachedMedia")} ({mediaFiles.length}/5)
              </span>
              {mediaFiles.length >= 5 && (
                <span className="text-xs text-amber-600 font-medium">⚠️ {t("limitReached")}</span>
              )}
            </div>
            <div className="post-media-preview-grid">
              {mediaFiles.map(({ category, preview, name, id, file, type }) => (
                <div
                  key={id}
                  className={`post-media-preview-item group relative rounded-xl overflow-hidden transition-all ${isLight ? "bg-white ring-1 ring-gray-200" : "bg-zinc-700 ring-1 ring-gray-600"
                    }`}
                >
                  {category === "image" && (
                    <div className="aspect-square">
                      <img src={preview} alt={name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {category === "video" && (
                    <div className="aspect-square relative">
                      <video className="w-full h-full object-cover">
                        <source src={preview} type={type} />
                      </video>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <FaVideo className="text-white text-2xl" />
                      </div>
                    </div>
                  )}
                  {category === "document" && (
                    <div className={`aspect-square flex flex-col items-center justify-center p-3 ${isLight ? "bg-gray-100" : "bg-zinc-800"}`}>
                      <FaFile className="text-3xl text-blue-500 mb-2" />
                      <span className={`text-xs text-center truncate w-full ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                        {name}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(id)}
                    disabled={isUploading}
                    className="post-media-remove-btn"
                    title={t("close")}
                    aria-label={`${t("close")} ${name}`}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="px-6 pb-4">
          <div className={`rounded-xl p-4 ${isLight ? "bg-indigo-50" : "bg-indigo-900/20"}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isLight ? "text-indigo-700" : "text-indigo-400"}`}>
                {t("uploading")}
              </span>
              <span className={`text-sm font-bold ${isLight ? "text-indigo-700" : "text-indigo-400"}`}>
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div
          ref={emojiPopoverRef}
          className="fixed z-50 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "calc(100vw - 2rem)"
          }}
        >
          <div className={`rounded-2xl overflow-hidden ${isLight ? 'ring-1 ring-gray-200' : 'ring-1 ring-gray-700'}`}>
            <Picker
              onEmojiClick={handleEmojiClick}
              theme={isLight ? "light" : "dark"}
              previewConfig={{ showPreview: false }}
              searchPlaceHolder={t("searchEmoji")}
              width="350px"
              height="450px"
            />
          </div>
        </div>
      )}

      {/* iOS fallback */}
      <input
        ref={fallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFallbackCapture}
      />
    </div>
  );
};

export default PostCreator;
