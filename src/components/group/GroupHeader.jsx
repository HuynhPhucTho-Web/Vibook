import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaUsers, FaImage, FaTimes } from "react-icons/fa";
import { db, auth } from "../../components/firebase";
import { doc, updateDoc } from "firebase/firestore";

const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const json = await res.json();
  return json.secure_url;
};

export default function GroupHeader({ group }) {
  const isOwner = auth.currentUser?.uid === group.ownerId;

  const [editing, setEditing] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(group.bannerUrl || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const canSave = useMemo(() => !!file && !saving, [file, saving]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please choose an image");
      e.target.value = "";
      return;
    }
    const blob = URL.createObjectURL(f);
    setFile(f);
    setBannerPreview(blob);
  };

  const onRemovePreview = () => {
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(group.bannerUrl || "");
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateDoc(doc(db, "Groups", group.id), { bannerUrl: url });
      setEditing(false);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setBannerPreview(url);
      alert("Banner updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="bg-white/95 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <div className="relative">
        {bannerPreview ? (
          <img
            src={bannerPreview}
            alt="Group Banner"
            className="w-full h-16 md:h-20 object-cover"
          />
        ) : (
          <div className="w-full h-16 md:h-20 bg-gradient-to-r from-blue-500 to-purple-600" />
        )}

        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-2">
            {!editing ? (
              <button
                className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                onClick={() => setEditing(true)}
              >
                Update Banner
              </button>
            ) : (
              <div className="flex gap-2">
                <label className="cursor-pointer px-3 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 inline-flex items-center gap-2">
                  <FaImage /> Choose
                  <input ref={inputRef} type="file" hidden accept="image/*" onChange={onPickFile} />
                </label>
                {file && (
                  <button
                    className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                    onClick={onRemovePreview}
                    title="Remove selected"
                  >
                    <FaTimes />
                  </button>
                )}
                <button
                  className={`px-3 py-1 rounded-md text-sm text-white ${
                    canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={onSave}
                  disabled={!canSave}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="px-3 py-1 rounded-md bg-gray-500 text-white text-sm hover:bg-gray-600"
                  onClick={() => {
                    setEditing(false);
                    onRemovePreview();
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info compact (cao ~ 48–52px) */}
      <div className="px-2 sm:px-3 md:px-4 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold truncate">{group.name}</h1>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
            {group.description}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
            <FaUsers /> {group.members?.length || 0} members
          </div>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 whitespace-nowrap">
          + Invite friends
        </button>
      </div>
    </header>
  );
}
