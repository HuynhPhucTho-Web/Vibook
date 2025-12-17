import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaUsers, FaImage, FaTimes } from "react-icons/fa";
import { db, auth } from "../../components/firebase";
import { doc, updateDoc } from "firebase/firestore";
import "../../style/GroupHeader.css";

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
    } catch (e) {
      console.error(e);
      alert("Failed to update banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="ghd-header">
      <div className="ghd-cover">
        {bannerPreview ? (
          <img src={bannerPreview} alt="Group Banner" className="ghd-coverImg" />
        ) : (
          <div className="ghd-coverFallback" />
        )}

        {isOwner && (
          <div className="ghd-coverActions">
            {!editing ? (
              <button className="ghd-btn ghd-btnPrimary" onClick={() => setEditing(true)}>
                Update banner
              </button>
            ) : (
              <div className="ghd-actionRow">
                <label className="ghd-btn ghd-btnSoft ghd-btnIcon">
                  <FaImage />
                  <span>Choose</span>
                  <input ref={inputRef} type="file" hidden accept="image/*" onChange={onPickFile} />
                </label>

                {file && (
                  <button className="ghd-btn ghd-btnDanger ghd-btnIcon" onClick={onRemovePreview} title="Remove selected">
                    <FaTimes />
                  </button>
                )}

                <button
                  className={`ghd-btn ${canSave ? "ghd-btnPrimary" : "ghd-btnDisabled"}`}
                  onClick={onSave}
                  disabled={!canSave}
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  className="ghd-btn ghd-btnGhost"
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

        {/* gradient overlay để chữ nổi trên ảnh */}
        <div className="ghd-coverShade" />
      </div>

      <div className="ghd-info">
        <div className="ghd-infoLeft">
          <h1 className="ghd-title" title={group.name}>{group.name}</h1>
          <div className="ghd-desc" title={group.description}>{group.description}</div>
          <div className="ghd-meta">
            <FaUsers />
            <span>{group.members?.length || 0} members</span>
          </div>
        </div>

        <div className="ghd-infoRight">
          <button className="ghd-btn ghd-btnPrimary ghd-inviteBtn">+ Invite</button>
        </div>
      </div>
    </header>
  );
}
