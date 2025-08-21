import React, { useState, useContext, useEffect } from "react";
import { auth, db } from "../components/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaImage, FaVideo, FaFile } from "react-icons/fa";
import { AdvancedImage, AdvancedVideo } from "@cloudinary/react";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

const PostCreator = ({ onPostCreated }) => {
  const { theme } = useContext(ThemeContext);
  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); // Hỗ trợ nhiều file
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

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
        // For documents, use a generic icon or first page preview
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
          id: Date.now() + Math.random() // Unique ID
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
    
    // Add resource type based on file category
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

      // Upload all media files
      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const uploadResult = await uploadFileToCloudinary(mediaFiles[i], i, mediaFiles.length);
          uploadedMedia.push(uploadResult);
          
          // Update progress
          const progress = ((i + 1) / mediaFiles.length) * 100;
          setUploadProgress(progress);
        }
      }

      // Create post data
      const postData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        userPhoto: auth.currentUser.photoURL || "https://via.placeholder.com/40",
        content: postContent,
        mediaFiles: uploadedMedia, // Array of media objects
        createdAt: Date.now(),
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
      };

      // Save to Firestore
      console.log(`[${currentDateTime}] Saving to Posts collection...`);
      const postRef = await addDoc(collection(db, "Posts"), postData);
      console.log(`[${currentDateTime}] Post saved successfully with ID:`, postRef.id);

      // Reset form
      setPostContent("");
      setMediaFiles([]);
      setUploadProgress(0);

      // Notify parent component
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

    switch (category) {
      case 'image':
        return (
          <div key={id} className="position-relative d-inline-block me-2 mb-2">
            <img
              src={preview}
              alt={name}
              style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "cover" }}
              className="img-fluid rounded"
            />
            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute top-0 end-0"
              style={{ fontSize: "10px", padding: "2px 5px" }}
              onClick={() => removeFile(id)}
              disabled={isUploading}
            >
              ×
            </button>
          </div>
        );

      case 'video':
        return (
          <div key={id} className="position-relative d-inline-block me-2 mb-2">
            <video
              controls
              style={{ maxWidth: "150px", maxHeight: "150px" }}
              className="rounded"
            >
              <source src={preview} type={file.type} />
              Your browser does not support the video tag.
            </video>
            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute top-0 end-0"
              style={{ fontSize: "10px", padding: "2px 5px" }}
              onClick={() => removeFile(id)}
              disabled={isUploading}
            >
              ×
            </button>
          </div>
        );

      case 'document':
        return (
          <div key={id} className="position-relative d-inline-block me-2 mb-2 p-2 border rounded">
            <div className="d-flex align-items-center">
              <FaFile className="me-2 text-primary" />
              <div>
                <small className="d-block">{name}</small>
                <small className="text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute top-0 end-0"
              style={{ fontSize: "10px", padding: "2px 5px" }}
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
    return <div>Loading...</div>;
  }

  return (
    <div className={`card mb-2 shadow-sm ${theme}`}>
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

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap">
                {mediaFiles.map(renderFilePreview)}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="mb-3">
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {Math.round(uploadProgress)}%
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex">
              <label className="btn btn-link text-primary me-2 p-1">
                <FaImage /> Photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="d-none"
                  onChange={handleMediaUpload}
                  disabled={isUploading || mediaFiles.length >= 5}
                />
              </label>
              
              <label className="btn btn-link text-success me-2 p-1">
                <FaVideo /> Video
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="d-none"
                  onChange={handleMediaUpload}
                  disabled={isUploading || mediaFiles.length >= 5}
                />
              </label>
              
              <label className="btn btn-link text-warning me-2 p-1">
                <FaFile /> Document
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
              className="btn btn-primary"
              disabled={(!postContent.trim() && mediaFiles.length === 0) || isUploading}
            >
              {isUploading ? "Uploading..." : "Post"}
            </button>
          </div>
          
          {mediaFiles.length >= 5 && (
            <small className="text-muted">Maximum 5 files per post</small>
          )}
        </form>
      </div>
    </div>
  );
};

export default PostCreator;