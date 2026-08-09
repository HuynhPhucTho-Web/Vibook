import { toast } from 'react-toastify';

// Shared Cloudinary utility - dùng cho tất cả project (Events, Posts, Groups, Shop...)
export const uploadToCloudinary = async (file, options = {}) => {
  const {
    cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME,
    uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET,
    folder = "vibook",
    resourceType = "image",
  } = options;

  if (!cloudName || !uploadPreset) {
    toast.error("Cloudinary configuration missing in .env", { position: "top-center" });
    throw new Error("Missing Cloudinary config");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);
  if (resourceType) formData.append("resource_type", resourceType);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);
    return data.secure_url; // URL Cloudinary hoàn chỉnh
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    toast.error("Failed to upload to Cloudinary", { position: "top-center" });
    throw error;
  }
};

// Optional: Cloudinary URL builder (nếu cần transform)
export const cloudinaryUrl = (publicId, options = {}) => {
  // Sử dụng @cloudinary/url-gen nếu cần
  return `https://res.cloudinary.com/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
};

// Optimizes Cloudinary URLs to reduce image payload and improve Largest Contentful Paint (LCP)
export const getOptimizedCloudinaryUrl = (url, width = 800) => {
  if (!url || typeof url !== "string") return url;
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/upload/f_auto")) {
      return url;
    }
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
};
