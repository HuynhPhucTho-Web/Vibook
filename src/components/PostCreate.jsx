import React, { useState, useContext, useEffect } from "react";
import { auth, db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaImage, FaVideo, FaFile, FaEdit, FaSmile } from "react-icons/fa";
import { AdvancedImage, AdvancedVideo } from "@cloudinary/react";
import { Cloudinary } from "@cloudinary/url-gen";
import { ThemeProvider } from "../context/ThemeProvider";

const PostCreator = ({ onPostCreated }) => {
  const { theme } = useContext(ThemeContext);
  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // File size limits (MB)
  const FILE_SIZE_LIMITS = {
    image: 10,
    video: 50,
    document: 25
  };

  // Supported file types
  const SUPPORTED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const currentDateTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "long",
  });

  // Theme-based styles - Cải tiến
  const getThemeStyles = () => {
    const baseStyles = {
      card: {
        backgroundColor: theme === 'light'
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(30, 30, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: theme === 'light'
          ? '1px solid rgba(0, 0, 0, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: theme === 'light'
          ? '0 8px 32px rgba(0, 0, 0, 0.1)'
          : '0 8px 32px rgba(0, 0, 0, 0.3)',
        color: theme === 'light' ? '#000' : '#fff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      textarea: {
        backgroundColor: theme === 'light'
          ? 'rgba(248, 250, 252, 0.9)'  // Sáng hơn cho light mode
          : 'rgba(45, 55, 72, 0.9)',    // Tối hơn cho dark mode
        border: `2px solid ${isFocused
          ? (theme === 'light' ? 'rgba(79, 172, 254, 0.6)' : 'rgba(129, 140, 248, 0.6)')
          : (theme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(75, 85, 99, 0.6)')
          }`,
        borderRadius: '12px',
        color: theme === 'light' ? '#1a202c' : '#f7fafc',  // Contrast cao hơn
        transition: 'all 0.3s ease',
        padding: '12px 16px 12px 45px',
        fontSize: '1rem',
        lineHeight: '1.6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        // Thêm shadow để nổi bật hơn
        boxShadow: theme === 'light'
          ? isFocused
            ? '0 4px 20px rgba(79, 172, 254, 0.15)'
            : '0 2px 8px rgba(0, 0, 0, 0.05)'
          : isFocused
            ? '0 4px 20px rgba(129, 140, 248, 0.25)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)'
      },
      textareaPlaceholder: {
        color: theme === 'light' ? 'rgba(107, 114, 128, 0.8)' : 'rgba(156, 163, 175, 0.8)'
      },
      button: {
        backgroundColor: theme === 'light'
          ? 'linear-gradient(135deg, #667eea, #764ba2)'
          : 'linear-gradient(135deg, #4facfe, #00f2fe)',
        border: 'none',
        borderRadius: '10px',
        color: '#fff',
        fontWeight: '600',
        padding: '8px 24px',
        transition: 'all 0.3s ease',
        transform: 'scale(1)',
        boxShadow: theme === 'light'
          ? '0 4px 15px rgba(102, 126, 234, 0.4)'
          : '0 4px 15px rgba(79, 172, 254, 0.4)'
      },
      iconButton: {
        color: theme === 'light' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(229, 231, 235, 0.8)',
        backgroundColor: theme === 'light'
          ? 'rgba(249, 250, 251, 0.8)'
          : 'rgba(55, 65, 81, 0.5)',
        border: `1px solid ${theme === 'light' ? 'rgba(229, 231, 235, 0.6)' : 'rgba(75, 85, 99, 0.6)'}`,
        borderRadius: '8px',
        padding: '8px 12px',
        transition: 'all 0.3s ease',
        fontSize: '0.9rem',
        backdropFilter: 'blur(10px)'
      },
      textInput: {
        color: theme === 'light' ? '#1a202c' : '#f7fafc'
      },
      inputIcon: {
        position: 'absolute',
        left: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: theme === 'light'
          ? (isFocused ? 'rgba(79, 172, 254, 0.8)' : 'rgba(107, 114, 128, 0.6)')
          : (isFocused ? 'rgba(129, 140, 248, 0.8)' : 'rgba(156, 163, 175, 0.6)'),
        fontSize: '1.1rem',
        zIndex: 1,
        transition: 'color 0.3s ease'
      }
    };

    return baseStyles;
  };

  const styles = getThemeStyles();

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log(`[${currentDateTime}] Auth state changed:`, user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Cleanup function for media previews
  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.preview && file.type.startsWith('video/')) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [mediaFiles]);

  const cld = new Cloudinary({
    cloud: { cloudName: import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME || "fallback_cloud_name" },
  });

  // Determine file category
  const getFileCategory = (fileType) => {
    if (SUPPORTED_TYPES.image.includes(fileType)) return 'image';
    if (SUPPORTED_TYPES.video.includes(fileType)) return 'video';
    if (SUPPORTED_TYPES.document.includes(fileType)) return 'document';
    return 'unknown';
  };

  // Validate file
  const validateFile = (file) => {
    const category = getFileCategory(file.type);

    if (category === 'unknown') {
      return { valid: false, error: `File type ${file.type} is not supported` };
    }

    const maxSize = FILE_SIZE_LIMITS[category] * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `${category.charAt(0).toUpperCase() + category.slice(1)} file must be less than ${FILE_SIZE_LIMITS[category]}MB`
      };
    }

    return { valid: true };
  };

  // Create file preview
  const createFilePreview = (file) => {
    return new Promise((resolve, reject) => {
      const category = getFileCategory(file.type);

      if (category === 'image') {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else if (category === 'video') {
        const videoUrl = URL.createObjectURL(file);
        resolve(videoUrl);
      } else {
        resolve(null);
      }
    });
  };

  // Handle multiple file uploads
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);

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
          id: Date.now() + Math.random()
        });
      } catch (error) {
        console.error(`Error creating preview for ${file.name}:`, error);
        toast.error(`Failed to load preview for ${file.name}`, { position: "top-center" });
      }
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  // Remove specific file
  const removeFile = (fileId) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.preview && fileToRemove.category === 'video') {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Upload single file to Cloudinary
  const uploadFileToCloudinary = async (fileData, index, totalFiles) => {
    const formData = new FormData();
    formData.append("file", fileData.file);
    formData.append("upload_preset", import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET);

    if (fileData.category === 'document') {
      formData.append("resource_type", "raw");
    } else if (fileData.category === 'video') {
      formData.append("resource_type", "video");
    }

    console.log(`[${currentDateTime}] Uploading file ${index + 1}/${totalFiles} to Cloudinary...`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME}/${fileData.category === 'document' ? 'raw' : 'auto'}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${currentDateTime}] Cloudinary error response:`, errorText);
      throw new Error(`Upload failed for ${fileData.name}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[${currentDateTime}] File ${fileData.name} uploaded successfully:`, result.public_id);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      originalName: fileData.name,
      size: fileData.size,
      category: fileData.category
    };
  };

  // Handle post submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (isUploading) {
      console.log(`[${currentDateTime}] Already uploading, ignoring duplicate submission`);
      return;
    }

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

          const progress = ((i + 1) / mediaFiles.length) * 100;
          setUploadProgress(progress);
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

      console.log(`[${currentDateTime}] Saving to Posts collection...`);
      const postRef = await addDoc(collection(db, "Posts"), postData);
      console.log(`[${currentDateTime}] Post saved successfully with ID:`, postRef.id);

      setPostContent("");
      setMediaFiles([]);
      setUploadProgress(0);

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
      setUploadProgress(0);
    }
  };

  // Render file preview
  const renderFilePreview = (fileData) => {
    const { category, preview, name, id, file } = fileData;

    const previewStyle = {
      backgroundColor: theme === 'light' ? 'rgba(248, 250, 252, 0.9)' : 'rgba(45, 55, 72, 0.9)',
      border: `1px solid ${theme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(75, 85, 99, 0.6)'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)'
    };

    switch (category) {
      case 'image':
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
              style={{
                top: '5px',
                right: '5px',
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: '50%'
              }}
              onClick={() => removeFile(id)}
              disabled={isUploading}
            >
              ×
            </button>
          </div>
        );

      case 'video':
        return (
          <div key={id} className="position-relative d-inline-block me-2 mb-2" style={previewStyle}>
            <video
              controls
              style={{ maxWidth: "150px", maxHeight: "150px" }}
            >
              <source src={preview} type={file.type} />
              Your browser does not support the video tag.
            </video>
            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute"
              style={{
                top: '5px',
                right: '5px',
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: '50%'
              }}
              onClick={() => removeFile(id)}
              disabled={isUploading}
            >
              ×
            </button>
          </div>
        );

      case 'document':
        return (
          <div key={id} className="position-relative d-inline-block me-2 mb-2 p-3" style={previewStyle}>
            <div className="d-flex align-items-center">
              <FaFile className="me-2 text-primary" size={20} />
              <div>
                <small className="d-block" style={{ color: theme === 'light' ? '#1a202c' : '#f7fafc' }}>
                  {name}
                </small>
                <small style={{ color: theme === 'light' ? 'rgba(107, 114, 128, 0.8)' : 'rgba(156, 163, 175, 0.8)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute"
              style={{
                top: '5px',
                right: '5px',
                fontSize: "10px",
                padding: "4px 8px",
                borderRadius: '50%'
              }}
              onClick={() => removeFile(id)}
              disabled={isUploading}
            >
              ×
            </button>
          </div>
        );

      default:
        return null;
    }
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
    <div className="card mb-4 shadow-lg" style={styles.card}>
      <div className="card-body p-4">
        <div className="d-flex align-items-center mb-4">
          <div className="position-relative">
            <img
              src={auth.currentUser?.photoURL || "https://via.placeholder.com/40"}
              alt="Profile"
              className="rounded-circle me-3"
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
                border: `3px solid ${theme === 'light' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(79, 172, 254, 0.3)'}`
              }}
            />
            <div
              className="position-absolute"
              style={{
                bottom: '2px',
                right: '10px',
                width: '14px',
                height: '14px',
                backgroundColor: '#28a745',
                borderRadius: '50%',
                border: `2px solid ${theme === 'light' ? '#fff' : '#1a1a1a'}`
              }}
            ></div>
          </div>
          <div>
            <h6 className="mb-1" style={{ color: theme === 'light' ? '#1a202c' : '#f7fafc' }}>
              {auth.currentUser?.displayName || "User"}
            </h6>
            <small style={{ color: theme === 'light' ? 'rgba(107, 114, 128, 0.8)' : 'rgba(156, 163, 175, 0.8)' }}>
              What's on your mind?
            </small>
          </div>
        </div>

        <form onSubmit={handlePostSubmit} style={{
          backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.95)',
          borderRadius: '12px',
          padding: '20px',
          transition: 'background-color 0.3s ease'
        }}>
          <div className="position-relative mb-4">
            <FaEdit style={styles.inputIcon} />
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Share your thoughts, ideas, or experiences..."
              className="form-control"
              rows="4"
              style={{
                ...styles.textarea,
                resize: "none"
              }}
              disabled={isUploading}
            />
          </div>

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div className="mb-4">
              <h6 className="mb-3" style={{ color: theme === 'light' ? '#1a202c' : '#f7fafc' }}>
                <FaSmile className="me-2" />
                Media Attachments ({mediaFiles.length}/5)
              </h6>
              <div className="d-flex flex-wrap">
                {mediaFiles.map(renderFilePreview)}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small style={{ color: theme === 'light' ? '#1a202c' : '#f7fafc' }}>
                  Uploading files...
                </small>
                <small style={{ color: theme === 'light' ? '#1a202c' : '#f7fafc' }}>
                  {Math.round(uploadProgress)}%
                </small>
              </div>
              <div
                className="progress"
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: theme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(75, 85, 99, 0.6)'
                }}
              >
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }}
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <label className="btn me-3" style={styles.iconButton}>
                <FaImage className="me-2" style={{ color: '#28a745' }} />
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="d-none"
                  onChange={handleMediaUpload}
                  disabled={isUploading || mediaFiles.length >= 5}
                />
              </label>

              <label className="btn me-3" style={styles.iconButton}>
                <FaVideo className="me-2" style={{ color: '#dc3545' }} />
                <span>Video</span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="d-none"
                  onChange={handleMediaUpload}
                  disabled={isUploading || mediaFiles.length >= 5}
                />
              </label>

              <label className="btn" style={styles.iconButton}>
                <FaFile className="me-2" style={{ color: '#ffc107' }} />
                <span>File</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  className="d-none"
                  onChange={handleMediaUpload}
                  disabled={isUploading || mediaFiles.length >= 5}
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn"
              style={{
                ...styles.button,
                background: styles.button.backgroundColor,
                opacity: (!postContent.trim() && mediaFiles.length === 0) || isUploading ? 0.6 : 1
              }}
              disabled={(!postContent.trim() && mediaFiles.length === 0) || isUploading}
              onMouseOver={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = theme === 'light'
                    ? '0 6px 20px rgba(102, 126, 234, 0.6)'
                    : '0 6px 20px rgba(79, 172, 254, 0.6)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = styles.button.boxShadow;
              }}
            >
              {isUploading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Uploading...
                </>
              ) : (
                'Share Post'
              )}
            </button>
          </div>

          {mediaFiles.length >= 5 && (
            <div className="mt-3">
              <small style={{ color: theme === 'light' ? 'rgba(255, 193, 7, 0.8)' : 'rgba(255, 193, 7, 1)' }}>
                ⚠️ Maximum 5 files per post reached
              </small>
            </div>
          )}
        </form>
      </div>
      <style jsx>{`
        .btn:hover {
          transform: translateY(-2px);
        }
        
        .form-control:focus {
          box-shadow: none !important;
        }
        
        .form-control::placeholder {
          color: ${theme === 'light' ? 'rgba(107, 114, 128, 0.7)' : 'rgba(156, 163, 175, 0.7)'} !important;
        }
        
        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }
        
        .card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default PostCreator;