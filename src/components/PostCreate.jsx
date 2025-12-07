import React, { useState, useContext, useEffect, useRef } from "react";
import { auth, db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaImage, FaVideo, FaFile, FaSmile, FaCamera, FaTimes, FaExpand } from "react-icons/fa";
import { Cloudinary } from "@cloudinary/url-gen";
import Picker from "emoji-picker-react";
import "../style/PostCreate.css";

const PostCreator = ({ onPostCreated }) => {
  const { theme } = useContext(ThemeContext);

  // ----- state -----
  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  
  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraStream, setCameraStream] = useState(null);

  // Emoji
  const [showEmoji, setShowEmoji] = useState(false);

  // refs
  const textareaRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const emojiPopoverRef = useRef(null);
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
      console.error(`[${currentDateTime}] Missing Cloudinary envs`);
      toast.error("Thiếu cấu hình Cloudinary trong .env", { position: "top-center" });
    }
  }, []);

  // ----- auth ready -----
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => setIsLoadingAuth(false));
    return () => unsub();
  }, []);

  // ----- cleanup video blob preview -----
  useEffect(() => {
    return () => {
      mediaFiles.forEach((f) => {
        if (f.preview && f.type?.startsWith("video/")) URL.revokeObjectURL(f.preview);
      });
    };
  }, [mediaFiles]);

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
    if (category === "unknown") return { valid: false, error: `Định dạng ${file.type} không hỗ trợ` };
    const max = FILE_SIZE_LIMITS[category] * 1024 * 1024;
    if (file.size > max) {
      return { valid: false, error: `Tệp ${category} phải nhỏ hơn ${FILE_SIZE_LIMITS[category]}MB` };
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
    if (mediaFiles.length + files.length > 5) {
      toast.error("Tối đa 5 tệp mỗi bài viết", { position: "top-center" });
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
      const t = await res.text();
      console.error(`[${currentDateTime}] Cloudinary error`, t);
      throw new Error(`Upload thất bại: ${fileData.name}`);
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

  const handlePostSubmit = async () => {
    if (isUploading) return;
    if (!postContent.trim() && mediaFiles.length === 0) {
      toast.error("Hãy nhập nội dung hoặc đính kèm media", { position: "top-center" });
      return;
    }
    if (!auth.currentUser) {
      toast.error("Bạn cần đăng nhập để đăng bài", { position: "top-center" });
      return;
    }

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
        content: postContent,
        mediaFiles: uploadedMedia,
        createdAt: Date.now(),
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
      };

      const ref = await addDoc(collection(db, "Posts"), postData);
      setPostContent("");
      setMediaFiles([]);
      setUploadProgress(0);
      onPostCreated && (await onPostCreated({ ...postData, id: ref.id }));
      toast.success("Đăng bài thành công", { position: "top-center" });
    } catch (err) {
      console.error(`[${currentDateTime}] create post error`, err);
      toast.error(err.message || "Có lỗi khi đăng bài", { position: "top-center" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ===== Emoji helpers =====
  const insertAtCursor = (str) => {
    const el = textareaRef.current;
    if (!el) return setPostContent((p) => p + str);
    const s = el.selectionStart ?? postContent.length;
    const e = el.selectionEnd ?? postContent.length;
    const next = postContent.slice(0, s) + str + postContent.slice(e);
    setPostContent(next);
    setTimeout(() => {
      el.focus();
      const pos = s + str.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };
  const handleEmojiClick = (data) => insertAtCursor(data.emoji);

  // ===== Click outside to close popovers =====
  useEffect(() => {
    const onDown = (ev) => {
      if (
        showEmoji &&
        emojiPopoverRef.current &&
        !emojiPopoverRef.current.contains(ev.target) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(ev.target)
      ) {
        setShowEmoji(false);
      }
      if (showCamera && cameraPopoverRef.current && !cameraPopoverRef.current.contains(ev.target)) {
        setShowCamera(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        if (showEmoji) setShowEmoji(false);
        if (showCamera) setShowCamera(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showEmoji, showCamera]);

  // ===== Camera =====
  const supportMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const openCamera = async () => {
    if (!supportMedia) return fallbackInputRef.current?.click();

    try {
      // tắt stream cũ nếu có
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }

      // iOS/Safari nhạy cảm với facingMode, dùng ideal + fallback
      const primary = { video: { facingMode: { ideal: facingMode } }, audio: false };
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
      toast.error("Không mở được camera. Hãy kiểm tra quyền.", { position: "top-center" });
    }
  };

 const closeCamera = () => {
  if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
  setCameraStream(null);
  setShowCamera(false);
};

 const toggleFacing = () => {
  setFacingMode((p) => (p === "environment" ? "user" : "environment"));
  setTimeout(() => openCamera(), 0);
};

  const capturePhoto = () => {
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
          toast.success("Đã chụp ảnh và thêm vào bài viết.", { position: "top-center" });
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

  return (
    <div className={`post-creator-container ${isLight ? 'light' : 'dark'}`}>
      {/* Header with avatar and input */}
      <div className="post-creator-header">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0 group">
            <img
              src={auth.currentUser?.photoURL || "/default-avatar.png"}
              alt="avatar"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-offset-2 ring-indigo-400/50 transition-all group-hover:ring-indigo-500"
            />
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm"></span>
          </div>

          {/* Input Area */}
          <div className="flex-1">
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
              <textarea
                ref={textareaRef}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={`${auth.currentUser?.displayName || "Bạn"} ơi, bạn đang nghĩ gì thế?`}
                className={`w-full px-4 py-3 bg-transparent outline-none resize-none rounded-2xl text-base leading-relaxed ${isLight
                  ? "text-gray-900 placeholder-gray-400"
                  : "text-gray-100 placeholder-gray-500"
                  }`}
                rows={1}
                style={{ minHeight: "48px", maxHeight: "112px" }}
                disabled={isUploading}
              />
            </div>
          </div>
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
              <span className="text-sm font-medium hidden sm:inline">Ảnh/Video</span>
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
              onClick={openCamera}
              disabled={isUploading}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${isLight
                ? "bg-violet-50 hover:bg-violet-100 text-violet-700"
                : "bg-violet-900/30 hover:bg-violet-900/50 text-violet-400"
                } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaCamera className="text-lg" />
              <span className="text-sm font-medium hidden sm:inline">Camera</span>
            </button>

            {/* Document */}
            <label
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all ${isLight
                ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                : "bg-blue-900/30 hover:bg-blue-900/50 text-blue-400"
                } ${isUploading || mediaFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaFile className="text-lg" />
              <span className="text-sm font-medium hidden sm:inline">Tài liệu</span>
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
              <span className="text-sm font-medium hidden sm:inline">Cảm xúc</span>
            </button>
          </div>

          {/* Post Button */}
          <button
            type="button"
            onClick={handlePostSubmit}
            disabled={(!postContent.trim() && mediaFiles.length === 0) || isUploading}
            className={`post-creator-submit-btn ${(!postContent.trim() && mediaFiles.length === 0) || isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl"
              }`}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang đăng...
              </span>
            ) : (
              "Đăng bài"
            )}
          </button>
        </div>
      </div>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <div className="px-6 pb-4">
          <div className={`rounded-2xl p-4 ${isLight ? "bg-gray-50" : "bg-zinc-800/50"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                Media đính kèm ({mediaFiles.length}/5)
              </span>
              {mediaFiles.length >= 5 && (
                <span className="text-xs text-amber-600 font-medium">⚠️ Đã đạt giới hạn</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {mediaFiles.map(({ category, preview, name, id, file, type }) => (
                <div
                  key={id}
                  className={`group relative rounded-xl overflow-hidden transition-all hover:scale-105 ${isLight ? "bg-white ring-1 ring-gray-200" : "bg-zinc-700 ring-1 ring-gray-600"
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
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 active:scale-90"
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
                Đang tải lên...
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
              searchPlaceHolder="Tìm emoji..."
              width="350px"
              height="450px"
            />
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div
          ref={cameraPopoverRef}
          className={`mt-4 mx-6 rounded-2xl overflow-hidden border ${isLight ? "border-gray-200 bg-white" : "border-gray-800 bg-zinc-900"
            } shadow-lg`}
        >
          {/* Header */}
          <div
            className={`px-4 py-2 flex items-center justify-between ${isLight ? "bg-gray-50 border-b border-gray-200" : "bg-zinc-800/60 border-b border-gray-800"
              }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${isLight ? "bg-emerald-500" : "bg-emerald-400"
                  } animate-pulse`}
              />
              <span className={isLight ? "text-gray-800 font-medium" : "text-gray-100 font-medium"}>
                Camera đang hoạt động
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFacing}
                className={`h-9 px-3 rounded-full text-sm font-medium transition ${isLight
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  : "bg-zinc-700 hover:bg-zinc-600 text-gray-100"
                  }`}
                title="Đổi camera"
              >
                Đổi
              </button>
              <button
                type="button"
                onClick={closeCamera}
                className={`h-9 px-3 rounded-full text-sm font-medium transition ${isLight
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  : "bg-zinc-700 hover:bg-zinc-600 text-gray-100"
                  }`}
                title="Đóng"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Video area (inline, responsive) */}
          <div className="relative">
            <div className="w-full">
              <div className="aspect-[3/4] sm:aspect-video bg-black">
                <video ref={videoRef}
                  autoPlay
                  playsInline
                  muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            {/* Bottom controls (luôn thấy vì panel inline) */}
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
              <button
                type="button"
                onClick={capturePhoto}
                className="group relative"
                title="Chụp ảnh"
              >
                <div className="h-16 w-16 rounded-full border-4 border-white/90 flex items-center justify-center group-hover:border-white transition">
                  <div className="h-12 w-12 rounded-full bg-white group-active:scale-90 transition-transform" />
                </div>
              </button>
            </div>
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