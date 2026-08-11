import React, { useMemo, useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import {
  FaCamera,
  FaSpinner,
  FaLink,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaEdit,
  FaUserPlus,
  FaUserCheck,
  FaUser,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { ThemeContext } from "../../context/ThemeContext";

/** Upload ảnh lên Cloudinary */
async function uploadToCloudinary(file, { cloudName, uploadPreset, folder = "profile" }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

/** Component Cắt ảnh đại diện */
function AvatarEditModal({ file, onCancel, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgDims, setImgDims] = useState({ width: 0, height: 0, initX: 0, initY: 0 });
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = (e) => {
    const img = e.target;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const containerSize = 192; // size of w-48 h-48

    let w, h;
    if (naturalWidth > naturalHeight) {
      h = containerSize;
      w = (naturalWidth / naturalHeight) * containerSize;
    } else {
      w = containerSize;
      h = (naturalHeight / naturalWidth) * containerSize;
    }

    const initX = (containerSize - w) / 2;
    const initY = (containerSize - h) / 2;

    setImgDims({ width: w, height: h, initX, initY });
    setPosition({ x: initX, y: initY });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleApply = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Mapping screen coordinate offsets to natural file pixels
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    const cropX = (containerRect.left - rect.left) * scaleX;
    const cropY = (containerRect.top - rect.top) * scaleY;
    const cropW = containerRect.width * scaleX;
    const cropH = containerRect.height * scaleY;

    ctx.clearRect(0, 0, 400, 400);
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 400, 400);

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.name, { type: file.type });
        onSave(croppedFile);
      }
    }, file.type || "image/jpeg", 0.9);
  };

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#202024]">
          <h3 className="text-lg font-bold text-white">Cắt ảnh đại diện</h3>
          <button onClick={onCancel} className="text-zinc-400 hover:text-white transition text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 flex flex-col items-center">
          {/* Crop Container */}
          <div 
            ref={containerRef}
            className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-blue-500 cursor-move bg-black select-none touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Preview"
              draggable="false"
              className="absolute pointer-events-none select-none max-w-none max-h-none"
              style={{
                width: `${imgDims.width}px`,
                height: `${imgDims.height}px`,
                left: 0,
                top: 0,
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.1s ease-out"
              }}
              onLoad={handleImageLoad}
            />
            {/* Dark mask overlay around circular crop area */}
            <div className="absolute inset-0 pointer-events-none rounded-full ring-[999px] ring-black/40" />
          </div>

          <div className="w-full mt-6">
            <label className="text-xs text-zinc-400 font-semibold mb-2 block text-center">Thu phóng</label>
            <input
              type="range"
              min="1"
              max="4"
              step="0.02"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-[#131316]">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-xl text-zinc-300 hover:bg-zinc-800 transition">
            Hủy
          </button>
          <button onClick={handleApply} className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition">
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}

/** Component Modal chỉnh sửa thông tin cá nhân */
function EditProfileModal({ isOpen, onClose, form, setForm, saving, onSave, isLight }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border transition-colors ${
        isLight ? "bg-white border-gray-100" : "bg-[#111318] border-zinc-800"
      }`}>
        <div className={`p-4 border-b flex justify-between items-center ${isLight ? "border-gray-100" : "border-zinc-800"}`}>
          <h3 className={`text-lg font-bold ${isLight ? "text-gray-900" : "text-white"}`}>Chỉnh sửa thông tin</h3>
          <button onClick={onClose} className={`text-2xl transition leading-none ${isLight ? "text-gray-400 hover:text-gray-600" : "text-zinc-400 hover:text-white"}`}>&times;</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold mb-1 block ${isLight ? "text-gray-600" : "text-zinc-400"}`}>Họ</label>
              <input
                className={`w-full px-4 py-2.5 rounded-lg border font-medium transition ${
                  isLight ? "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500" : "border-zinc-700 bg-zinc-800/50 text-white focus:border-blue-500"
                }`}
                placeholder="Họ của bạn"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div>
              <label className={`text-xs font-semibold mb-1 block ${isLight ? "text-gray-600" : "text-zinc-400"}`}>Tên</label>
              <input
                className={`w-full px-4 py-2.5 rounded-lg border font-medium transition ${
                  isLight ? "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500" : "border-zinc-700 bg-zinc-800/50 text-white focus:border-blue-500"
                }`}
                placeholder="Tên của bạn"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className={`text-xs font-semibold mb-1 block ${isLight ? "text-gray-600" : "text-zinc-400"}`}>Tiểu sử (Bio)</label>
            <textarea
              rows={3}
              className={`w-full px-4 py-2.5 rounded-lg border font-medium transition ${
                isLight ? "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500" : "border-zinc-700 bg-zinc-800/50 text-white focus:border-blue-500"
              }`}
              placeholder="Chia sẻ vài điều về bản thân bạn..."
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>

          <div>
            <label className={`text-xs font-semibold mb-1 block ${isLight ? "text-gray-600" : "text-zinc-400"}`}>Trang web</label>
            <input
              className={`w-full px-4 py-2.5 rounded-lg border font-medium transition ${
                isLight ? "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500" : "border-zinc-700 bg-zinc-800/50 text-white focus:border-blue-500"
              }`}
              placeholder="https://trangwebcuaban.com"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            />
          </div>

          <div>
            <label className={`text-xs font-semibold mb-1 block ${isLight ? "text-gray-600" : "text-zinc-400"}`}>Địa điểm</label>
            <input
              className={`w-full px-4 py-2.5 rounded-lg border font-medium transition ${
                isLight ? "border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500" : "border-zinc-700 bg-zinc-800/50 text-white focus:border-blue-500"
              }`}
              placeholder="Hà Nội, Việt Nam"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            />
          </div>
        </div>
        <div className={`p-4 border-t flex justify-end gap-3 transition-colors ${isLight ? "bg-gray-50 border-gray-100" : "bg-[#0b0c0f] border-zinc-800"}`}>
          <button onClick={onClose} className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${isLight ? "text-gray-650 hover:bg-gray-200/50" : "text-zinc-300 hover:bg-zinc-800"}`}>
            Hủy
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <FaSpinner className="animate-spin h-4 w-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileHeader({
  user,
  isOwner,
  postCount = 0,
  friendCount = 0,
  followerCount = 0,
  isFriend = false,
  hasSentRequest = false,
  isFollowing = false,
  onSendRequest,
  onFollow,
  onUpdated,
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const isLight = theme === "light";
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // States for dynamic image adjustment
  const [avatarFileToEdit, setAvatarFileToEdit] = useState(null);
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [tempCoverPos, setTempCoverPos] = useState(50);
  const [savingCoverPos, setSavingCoverPos] = useState(false);
  const coverDragStart = useRef(null);

  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
  }));

  useEffect(() => {
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      website: user?.website || "",
      location: user?.location || "",
    });
    setEditing(false);
  }, [user?.id, user?.firstName, user?.lastName, user?.bio, user?.website, user?.location]);

  const fullName = useMemo(() => {
    const fn = (user?.firstName || "").trim();
    const ln = (user?.lastName || "").trim();
    const name = `${fn} ${ln}`.trim();

    if (name) return name;
    if (user?.displayName && user.displayName.trim()) return user.displayName.trim();

    return isOwner ? "User" : "Người dùng";
  }, [user, isOwner]);

  const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  async function saveProfile() {
    if (!isOwner) return;
    if (!form.firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio.trim(),
        website: form.website.trim(),
        location: form.location.trim(),
        updatedAt: new Date(),
      };
      await updateDoc(doc(db, "Users", auth.currentUser.uid), payload);
      await updateProfile(auth.currentUser, { displayName: `${payload.firstName} ${payload.lastName}`.trim() });
      onUpdated?.(payload);
      setEditing(false);
      toast.success("Profile updated!");
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function changeCover(file) {
    if (!file || !isOwner) return;
    if (file.size > 6 * 1024 * 1024) return toast.error("Cover must be < 6MB");
    setUploadingCover(true);
    try {
      const url = await uploadToCloudinary(file, { cloudName, uploadPreset, folder: "covers" });
      await updateDoc(doc(db, "Users", auth.currentUser.uid), { cover: url, updatedAt: new Date() });
      onUpdated?.({ cover: url });
      toast.success("Cover updated");
    } catch (e) {
      console.error(e);
      toast.error("Upload cover failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function uploadCroppedAvatar(file) {
    setUploadingAvatar(true);
    try {
      const url = await uploadToCloudinary(file, { cloudName, uploadPreset, folder: "avatars" });
      await updateDoc(doc(db, "Users", auth.currentUser.uid), { photo: url, updatedAt: new Date() });
      await updateProfile(auth.currentUser, { photoURL: url });
      onUpdated?.({ photo: url });
      toast.success("Avatar updated");
    } catch (e) {
      console.error(e);
      toast.error("Upload avatar failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveCoverPosition() {
    setSavingCoverPos(true);
    try {
      await updateDoc(doc(db, "Users", auth.currentUser.uid), {
        coverPositionY: tempCoverPos,
        updatedAt: new Date(),
      });
      onUpdated?.({ coverPositionY: tempCoverPos });
      setIsRepositioningCover(false);
      toast.success("Vị trí ảnh bìa đã được lưu");
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi lưu vị trí ảnh bìa");
    } finally {
      setSavingCoverPos(false);
    }
  }

  const handleAvatarSelect = (file) => {
    if (!file || !isOwner) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Avatar must be < 5MB");
    setAvatarFileToEdit(file);
  };

  const handleCoverMouseDown = (e) => {
    if (!isRepositioningCover) return;
    coverDragStart.current = { y: e.clientY, pos: tempCoverPos };
    e.preventDefault();
  };

  const handleCoverMouseMove = (e) => {
    if (!isRepositioningCover || !coverDragStart.current) return;
    const dy = e.clientY - coverDragStart.current.y;
    const height = e.currentTarget.getBoundingClientRect().height || 200;
    const deltaPercent = (dy / height) * 100;
    let newPos = coverDragStart.current.pos - deltaPercent;
    newPos = Math.max(0, Math.min(100, newPos));
    setTempCoverPos(newPos);
  };

  const handleCoverMouseUp = () => {
    coverDragStart.current = null;
  };

  const handleCoverTouchStart = (e) => {
    if (!isRepositioningCover || e.touches.length !== 1) return;
    coverDragStart.current = { y: e.touches[0].clientY, pos: tempCoverPos };
  };

  const handleCoverTouchMove = (e) => {
    if (!isRepositioningCover || !coverDragStart.current || e.touches.length !== 1) return;
    const dy = e.touches[0].clientY - coverDragStart.current.y;
    const height = e.currentTarget.getBoundingClientRect().height || 200;
    const deltaPercent = (dy / height) * 100;
    let newPos = coverDragStart.current.pos - deltaPercent;
    newPos = Math.max(0, Math.min(100, newPos));
    setTempCoverPos(newPos);
  };

  const createdText = user?.createdAt?.toDate
    ? user.createdAt.toDate().toLocaleDateString("vi-VN")
    : user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
    : "";

  const bgCard = isDark ? "bg-[#111318]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-200" : "text-gray-700";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const bgButton = isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200";
  const bgStat = isDark ? "bg-gray-800" : "bg-gray-100";
  const bgAbout = isDark ? "bg-gray-900/60" : "bg-gray-50/80";

  const coverSrc =
    user?.cover ||
    "https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1600&auto=format&fit=crop";
  const avatarSrc = user?.photo || "/default-avatar.png";

  const friendBtnDesktop = (() => {
    if (isFriend) {
      return (
        <button className="px-5 py-2.5 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition">
          Friends
        </button>
      );
    }
    if (hasSentRequest) {
      return (
        <button className="px-5 py-2.5 rounded-lg font-semibold bg-gray-500 text-white cursor-not-allowed">
          Request Sent
        </button>
      );
    }
    return (
      <button
        onClick={onSendRequest}
        className="px-5 py-2.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Add Friend
      </button>
    );
  })();

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg ${bgCard}`}>
      {/* desktop version */}
      <div className="hidden md:block">
        {/* Cover */}
        <div className="relative overflow-hidden group">
          {isRepositioningCover && (
            <div className="absolute inset-x-0 top-0 bg-black/60 text-white text-center py-2 text-sm font-semibold select-none z-10 pointer-events-none">
              Kéo trên ảnh bìa để điều chỉnh vị trí dọc
            </div>
          )}
          <img
            src={coverSrc}
            alt="cover"
            className="w-full h-52 md:h-64 object-cover select-none"
            style={{
              objectPosition: `center ${isRepositioningCover ? tempCoverPos : (user?.coverPositionY ?? 50)}%`,
              cursor: isRepositioningCover ? "ns-resize" : "default",
            }}
            onMouseDown={handleCoverMouseDown}
            onMouseMove={handleCoverMouseMove}
            onMouseUp={handleCoverMouseUp}
            onMouseLeave={handleCoverMouseUp}
            onTouchStart={handleCoverTouchStart}
            onTouchMove={handleCoverTouchMove}
            onTouchEnd={handleCoverMouseUp}
          />
          {isOwner && (
            <div className="absolute right-5 bottom-3 flex gap-2 z-10">
              {!isRepositioningCover ? (
                <>
                  <button
                    onClick={() => {
                      setTempCoverPos(user?.coverPositionY ?? 50);
                      setIsRepositioningCover(true);
                    }}
                    className="bg-black/60 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-black/70 transition font-semibold"
                  >
                    Căn chỉnh vị trí
                  </button>
                  <label className="bg-black/60 text-white px-4 py-1.5 rounded-lg cursor-pointer text-sm flex items-center gap-2 hover:bg-black/70 transition font-semibold m-0">
                    {uploadingCover ? <FaSpinner className="animate-spin" /> : <FaCamera />} Thay ảnh bìa
                    <input type="file" accept="image/*" hidden onChange={(e) => changeCover(e.target.files?.[0])} />
                  </label>
                </>
              ) : (
                <>
                  <button
                    onClick={saveCoverPosition}
                    disabled={savingCoverPos}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-green-700 transition font-semibold"
                  >
                    {savingCoverPos ? <FaSpinner className="animate-spin" /> : "Lưu vị trí"}
                  </button>
                  <button
                    onClick={() => setIsRepositioningCover(false)}
                    className="bg-red-650 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-red-750 transition font-semibold"
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Header row - Avatar kế bên tên */}
        <div className="px-4 md:px-6 pb-6">
          <div className="flex items-start gap-5 -mt-16 md:-mt-20">
            {/* Avatar */}
            <div className="relative flex-shrink-0 z-10">
              {user?.photo ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className={`w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ${
                    isDark ? "ring-gray-800" : "ring-white"
                  } object-cover shadow-xl`}
                />
              ) : (
                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ${
                  isDark ? "ring-gray-800" : "ring-white"
                } bg-gray-300 flex items-center justify-center shadow-xl`}>
                  <FaUser size={64} className="text-gray-600" />
                </div>
              )}
              {isOwner && (
                <label className="absolute right-0 bottom-0 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition">
                  {uploadingAvatar ? <FaSpinner className="animate-spin" size={16} /> : <FaCamera size={16} />}
                  <input type="file" accept="image/*" hidden onChange={(e) => handleAvatarSelect(e.target.files?.[0])} />
                </label>
              )}
            </div>

            {/* Tên và thông tin bên cạnh avatar */}
            <div className="flex-1 pt-20 md:pt-24">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <h1 className={`text-4xl md:text-5xl font-bold ${textPrimary} leading-tight`}>{fullName}</h1>
                  {user?.bio && (
                    <p className={`text-lg md:text-xl mt-2 font-semibold ${textSecondary}`}>{user.bio}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isOwner ? (
                    <button
                      onClick={() => setEditing(true)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition ${bgButton} ${textPrimary}`}
                    >
                      <FaEdit /> Chỉnh sửa
                    </button>
                  ) : (
                    <>
                      {friendBtnDesktop}
                      <button
                        onClick={onFollow}
                        className={`px-5 py-2.5 rounded-lg font-semibold transition ${
                          isFollowing
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-purple-500 text-white hover:bg-purple-600"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                      <button
                        onClick={() => navigate('/messenger')}
                        className={`px-5 py-2.5 rounded-lg font-semibold transition ${bgButton} ${textPrimary}`}
                      >
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-2.5 mt-4">
                <span className={`px-4 py-2 rounded-full font-bold text-sm ${bgStat} ${textPrimary}`}>
                  Posts: {postCount}
                </span>
                <span className={`px-4 py-2 rounded-full font-bold text-sm ${bgStat} ${textPrimary}`}>
                  Friends: {friendCount}
                </span>
                <span className={`px-4 py-2 rounded-full font-bold text-sm ${bgStat} ${textPrimary}`}>
                  Followers: {followerCount}
                </span>
              </div>
            </div>
          </div>

          {/* Quick info row */}
          <div className={`flex flex-wrap items-center gap-5 mt-5 text-sm font-semibold ${textSecondary}`}>
            {user?.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 no-underline hover:underline ${textSecondary}`}
              >
                <FaLink /> {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {user?.location && (
              <span className="inline-flex items-center gap-2">
                <FaMapMarkerAlt /> {user.location}
              </span>
            )}
            {createdText && (
              <span className="inline-flex items-center gap-2">
                <FaCalendarAlt /> Joined {createdText}
              </span>
            )}
          </div>

          {/* About + Highlights */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl border ${borderColor} p-5 ${bgAbout}`}>
              <h3 className={`font-bold text-xl ${textPrimary} mb-3`}>About</h3>
              <ul className={`text-sm space-y-2 font-medium ${textSecondary}`}>
                <li>
                  <b className={textPrimary}>Name:</b> {fullName}
                </li>
                {isOwner && user?.email && (
                  <li>
                    <b className={textPrimary}>Email:</b> {user.email}
                  </li>
                )}
                {user?.location && (
                  <li>
                    <b className={textPrimary}>Location:</b> {user.location}
                  </li>
                )}
                {user?.website && (
                  <li>
                    <b className={textPrimary}>Website:</b>{" "}
                    <a className={`no-underline hover:underline ${textSecondary}`} href={user.website} target="_blank" rel="noreferrer">
                      {user.website}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div className={`rounded-xl border ${borderColor} p-5 ${bgAbout}`}>
              <h3 className={`font-bold text-xl ${textPrimary} mb-3`}>Highlights</h3>
              <ul className={`text-sm space-y-2 font-medium ${textSecondary}`}>
                <li>
                  <b className={textPrimary}>Posts:</b> {postCount}
                </li>
                <li>
                  <b className={textPrimary}>Friends:</b> {friendCount}
                </li>
                <li>
                  <b className={textPrimary}>Followers:</b> {followerCount}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        {/* Cover */}
        <div className="relative overflow-hidden">
          {isRepositioningCover && (
            <div className="absolute inset-x-0 top-0 bg-black/60 text-white text-center py-1 text-xs font-semibold select-none z-10 pointer-events-none">
              Kéo để căn chỉnh vị trí dọc
            </div>
          )}
          <img
            src={coverSrc}
            alt="cover"
            className="w-full h-36 object-cover select-none"
            style={{
              objectPosition: `center ${isRepositioningCover ? tempCoverPos : (user?.coverPositionY ?? 50)}%`,
              cursor: isRepositioningCover ? "ns-resize" : "default",
            }}
            onMouseDown={handleCoverMouseDown}
            onMouseMove={handleCoverMouseMove}
            onMouseUp={handleCoverMouseUp}
            onMouseLeave={handleCoverMouseUp}
            onTouchStart={handleCoverTouchStart}
            onTouchMove={handleCoverTouchMove}
            onTouchEnd={handleCoverMouseUp}
          />
          {isOwner && (
            <div className="absolute right-3 bottom-3 flex gap-1.5 z-10">
              {!isRepositioningCover ? (
                <>
                  <button
                    onClick={() => {
                      setTempCoverPos(user?.coverPositionY ?? 50);
                      setIsRepositioningCover(true);
                    }}
                    className="bg-black/60 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-semibold hover:bg-black/70 transition"
                  >
                    Vị trí
                  </button>
                  <label className="bg-black/60 text-white px-2.5 py-1.5 rounded-xl cursor-pointer text-[10px] font-semibold flex items-center gap-1 hover:bg-black/70 transition m-0">
                    {uploadingCover ? <FaSpinner className="animate-spin" /> : <FaCamera />} Thay ảnh
                    <input type="file" accept="image/*" hidden onChange={(e) => changeCover(e.target.files?.[0])} />
                  </label>
                </>
              ) : (
                <>
                  <button
                    onClick={saveCoverPosition}
                    disabled={savingCoverPos}
                    className="bg-green-600 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-semibold hover:bg-green-700 transition"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsRepositioningCover(false)}
                    className="bg-red-650 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-semibold hover:bg-red-750 transition"
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-3 -mt-10 pb-4">
          <div className={`rounded-2xl border ${borderColor} shadow-sm ${bgCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                {user?.photo ? (
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className={`w-20 h-20 rounded-full object-cover ring-4 ${isDark ? "ring-gray-900" : "ring-white"} shadow`}
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full ring-4 ${isDark ? "ring-gray-900" : "ring-white"} bg-gray-300 flex items-center justify-center shadow`}>
                    <FaUser size={40} className="text-gray-600" />
                  </div>
                )}
                {isOwner && (
                  <label className="absolute -right-1 -bottom-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow">
                    {uploadingAvatar ? <FaSpinner className="animate-spin" size={14} /> : <FaCamera size={14} />}
                    <input type="file" accept="image/*" hidden onChange={(e) => handleAvatarSelect(e.target.files?.[0])} />
                  </label>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className={`text-base font-extrabold leading-snug ${textPrimary} break-words`}>
                  {fullName}
                </div>

                {isOwner && user?.email && (
                  <div className={`text-xs ${textSecondary} break-all`}>{user.email}</div>
                )}

                {user?.bio && (
                  <div className={`text-sm mt-1 font-semibold ${textSecondary} line-clamp-2`}>{user.bio}</div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {isOwner ? (
                <button
                  onClick={() => setEditing(true)}
                  className={`col-span-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition ${bgButton} ${textPrimary}`}
                >
                  <FaEdit /> Chỉnh sửa trang cá nhân
                </button>
              ) : (
                <>
                  <button
                    onClick={onSendRequest}
                    disabled={isFriend || hasSentRequest}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition
                      ${
                        isFriend
                          ? "bg-green-600/20 text-green-400 cursor-default"
                          : hasSentRequest
                          ? "bg-gray-500/30 text-gray-300 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {isFriend ? <FaUserCheck /> : <FaUserPlus />}
                    {isFriend ? "Friends" : hasSentRequest ? "Sent" : "Add"}
                  </button>

                  <button
                    onClick={onFollow}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                      isFollowing
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-purple-500 text-white hover:bg-purple-600"
                    }`}
                  >
                    <FaUser /> {isFollowing ? "Following" : "Follow"}
                  </button>

                  <button
                    onClick={() => navigate('/messenger')}
                    className={`inline-flex items-center justify-center px-3 py-2.5 rounded-xl font-semibold text-sm transition ${bgButton} ${textPrimary}`}
                  >
                    Message
                  </button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 text-center divide-x divide-black/10 dark:divide-white/10">
              <div className="py-2">
                <div className={`text-base font-extrabold ${textPrimary}`}>{postCount}</div>
                <div className={`text-xs ${textSecondary}`}>Posts</div>
              </div>
              <div className="py-2">
                <div className={`text-base font-extrabold ${textPrimary}`}>{friendCount}</div>
                <div className={`text-xs ${textSecondary}`}>Friends</div>
              </div>
              <div className="py-2">
                <div className={`text-base font-extrabold ${textPrimary}`}>{followerCount}</div>
                <div className={`text-xs ${textSecondary}`}>Followers</div>
              </div>
            </div>

            {/* Intro */}
            <div className={`mt-3 rounded-2xl border ${borderColor} ${isDark ? "bg-gray-900/50" : "bg-gray-50"} p-3`}>
              <div className={`text-sm font-bold ${textPrimary} mb-2`}>Intro</div>

              <div className={`text-sm font-medium ${textSecondary} space-y-2`}>
                {user?.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 no-underline hover:underline ${textSecondary}`}
                  >
                    <FaLink /> {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {user?.location && (
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt /> {user.location}
                  </div>
                )}
                {createdText && (
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt /> Joined {createdText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Avatar Editing Canvas Modal */}
      {avatarFileToEdit && (
        <AvatarEditModal
          file={avatarFileToEdit}
          onCancel={() => setAvatarFileToEdit(null)}
          onSave={async (croppedFile) => {
            setAvatarFileToEdit(null);
            await uploadCroppedAvatar(croppedFile);
          }}
        />
      )}

      {/* Unified Edit Profile details Modal */}
      <EditProfileModal
        isOpen={editing}
        onClose={() => setEditing(false)}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={saveProfile}
        isLight={isLight}
      />
    </div>
  );
}
