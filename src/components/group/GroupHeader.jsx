import React, { useState } from "react";
import { FaUsers, FaImage, FaTimes } from "react-icons/fa";
import { db, auth } from "../../components/firebase";
import { doc, updateDoc } from "firebase/firestore";

// Upload to Cloudinary (adapted from GroupPosts)
const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Upload failed!");
  const data = await res.json();
  return data.secure_url;
};

const GroupHeader = ({ group }) => {
  const [showBannerUpdate, setShowBannerUpdate] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(group.bannerUrl || null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = URL.createObjectURL(file);
      setBannerPreview(preview);
    } else {
      alert("Please select an image file!");
      e.target.value = "";
    }
  };

  const handleUpdateBanner = async () => {
    if (!bannerPreview || !auth.currentUser) return;

    setLoading(true);
    try {
      const fileInput = document.querySelector("#banner-upload");
      const file = fileInput.files[0];
      const bannerUrl = await uploadToCloudinary(file);

      const groupRef = doc(db, "Groups", group.id);
      await updateDoc(groupRef, { bannerUrl });
      setShowBannerUpdate(false);
      alert("Banner updated successfully!");
    } catch (err) {
      console.error("Error updating banner:", err);
      alert("Failed to update banner!");
    } finally {
      setLoading(false);
    }
  };

  const removePreview = () => {
    setBannerPreview(group.bannerUrl || null);
    const fileInput = document.querySelector("#banner-upload");
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md">
      {/* Banner with Update Option */}
      <div className="relative h-48">
        {bannerPreview ? (
          <img
            src={bannerPreview}
            alt="Group Banner"
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="h-48 bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <h1 className="text-3xl font-bold text-white">Group Banner</h1>
          </div>
        )}
        {auth.currentUser?.uid === group.ownerId && (
          <div className="absolute top-2 right-2">
            {!showBannerUpdate ? (
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => setShowBannerUpdate(true)}
              >
                Update Banner
              </button>
            ) : (
              <div className="flex gap-2">
                <label className="cursor-pointer bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors">
                  <FaImage />
                  <input
                    type="file"
                    id="banner-upload"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                {bannerPreview && (
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                    onClick={removePreview}
                  >
                    <FaTimes />
                  </button>
                )}
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={handleUpdateBanner}
                  disabled={loading || !bannerPreview}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition-colors"
                  onClick={() => {
                    setShowBannerUpdate(false);
                    removePreview();
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="max-w-7xl mx-auto p-4 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-500">{group.description}</p>
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
            <FaUsers /> {group.members?.length || 0} thành viên
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg mt-3 sm:mt-0">
          + Mời bạn bè
        </button>
      </div>
    </div>
  );
};

export default GroupHeader;