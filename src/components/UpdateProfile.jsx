import React, { useMemo, useState, useContext } from "react";
import { auth, db } from "../components/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { FaCamera, FaSpinner, FaLink, FaMapMarkerAlt, FaCalendarAlt, FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";

/** Upload ảnh lên Cloudinary */
async function uploadToCloudinary(file, { cloudName, uploadPreset, folder = "profile" }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function ProfileHeader({
  user,
  isOwner,
  postCount = 0,
  friendCount = 0,
  followerCount = 0,
  isFriend = false,
  hasSentRequest = false,
  onSendRequest,
  onUpdated,
}) {
  const { theme } = useContext(ThemeContext);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState(() => ({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    website: user.website || "",
    location: user.location || "",
  }));

  const fullName = useMemo(() => {
    if (user.firstName || user.lastName) return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return user.displayName || "User";
  }, [user]);

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

  async function changeAvatar(file) {
    if (!file || !isOwner) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Avatar must be < 5MB");
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

  const createdText = user.createdAt?.toDate
    ? user.createdAt.toDate().toLocaleDateString("vi-VN")
    : (user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "");

  // Màu sắc theo theme
  const isDark = theme === "dark";
  const bgCard = isDark ? "bg-[#111318]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-200" : "text-gray-700";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const bgInput = isDark ? "bg-gray-800" : "bg-gray-50";
  const bgButton = isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200";
  const bgStat = isDark ? "bg-gray-800" : "bg-gray-100";
  const bgAbout = isDark ? "bg-gray-900/60" : "bg-gray-50/80";

  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg ${bgCard}`}>
      {/* Cover */}
      <div className="relative">
        <img
          src={user.cover || "https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1600&auto=format&fit=crop"}
          alt="cover"
          className="w-full h-52 md:h-64 object-cover"
        />
        {isOwner && (
          <label className="absolute right-5 bottom-3 bg-black/60 text-white px-4 py-1.5 rounded-lg cursor-pointer text-sm flex items-center gap-2 hover:bg-black/70 transition">
            {uploadingCover ? <FaSpinner className="animate-spin" /> : <FaCamera />} Change cover
            <input type="file" accept="image/*" hidden onChange={(e) => changeCover(e.target.files?.[0])} />
          </label>
        )}
      </div>

      {/* Header row - Avatar kế bên tên */}
      <div className="px-4 md:px-6 pb-6">
        <div className="flex items-start gap-5 -mt-16 md:-mt-20">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={user.photo || "/default-avatar.png"}
              alt="avatar"
              className={`w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ${isDark ? 'ring-gray-800' : 'ring-white'} object-cover shadow-xl`}
            />
            {isOwner && (
              <label className="absolute right-0 bottom-0 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition">
                {uploadingAvatar ? <FaSpinner className="animate-spin" size={16} /> : <FaCamera size={16} />}
                <input type="file" accept="image/*" hidden onChange={(e) => changeAvatar(e.target.files?.[0])} />
              </label>
            )}
          </div>

          {/* Tên và thông tin bên cạnh avatar */}
          <div className="flex-1 pt-20 md:pt-24">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                <h1 className={`text-4xl md:text-5xl font-bold ${textPrimary} leading-tight`}>
                  {fullName}
                </h1>
                {user.bio && !editing && (
                  <p className={`text-lg md:text-xl mt-2 font-semibold ${textSecondary}`}>
                    {user.bio}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOwner ? (
                  <button
                    onClick={() => setEditing((v) => !v)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition ${bgButton} ${textPrimary}`}
                  >
                    <FaEdit /> {editing ? "Close" : "Edit profile"}
                  </button>
                ) : (
                  <>
                    {isFriend ? (
                      <button className="px-5 py-2.5 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                        Friends
                      </button>
                    ) : hasSentRequest ? (
                      <button className="px-5 py-2.5 rounded-lg font-semibold bg-gray-500 text-white cursor-not-allowed">
                        Request Sent
                      </button>
                    ) : (
                      <button
                        onClick={onSendRequest}
                        className="px-5 py-2.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        Add Friend
                      </button>
                    )}
                    <button className={`px-5 py-2.5 rounded-lg font-semibold transition ${bgButton} ${textPrimary}`}>
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
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 no-underline hover:underline ${textSecondary}`}
            >
              <FaLink /> {user.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {user.location && (
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

        {/* Edit form (inline) */}
        {editing && isOwner && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={`px-4 py-2.5 rounded-lg border font-medium ${borderColor} ${bgInput} ${textPrimary}`}
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            />
            <input
              className={`px-4 py-2.5 rounded-lg border font-medium ${borderColor} ${bgInput} ${textPrimary}`}
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            />
            <input
              className={`px-4 py-2.5 rounded-lg border font-medium ${borderColor} ${bgInput} ${textPrimary} md:col-span-2`}
              placeholder="Website (https://...)"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            />
            <input
              className={`px-4 py-2.5 rounded-lg border font-medium ${borderColor} ${bgInput} ${textPrimary} md:col-span-2`}
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            />
            <textarea
              rows={3}
              className={`px-4 py-2.5 rounded-lg border font-medium ${borderColor} ${bgInput} ${textPrimary} md:col-span-2`}
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className={`px-5 py-2.5 rounded-lg font-semibold transition ${bgButton} ${textPrimary}`}
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {saving ? <FaSpinner className="inline animate-spin mr-2" /> : null}
                Save
              </button>
            </div>
          </div>
        )}

        {/* About card */}
        {!editing && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl border ${borderColor} p-5 ${bgAbout}`}>
              <h3 className={`font-bold text-xl ${textPrimary} mb-3`}>About</h3>
              <ul className={`text-sm space-y-2 font-medium ${textSecondary}`}>
                <li><b className={textPrimary}>Name:</b> {fullName}</li>
                {user.email && <li><b className={textPrimary}>Email:</b> {user.email}</li>}
                {user.location && <li><b className={textPrimary}>Location:</b> {user.location}</li>}
                {user.website && (
                  <li>
                    <b className={textPrimary}>Website:</b>{" "}
                    <a
                      className={`no-underline hover:underline ${textSecondary}`}
                      href={user.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {user.website}
                    </a>
                  </li>
                )}
              </ul>
            </div>
            <div className={`rounded-xl border ${borderColor} p-5 ${bgAbout}`}>
              <h3 className={`font-bold text-xl ${textPrimary} mb-3`}>Highlights</h3>
              <ul className={`text-sm space-y-2 font-medium ${textSecondary}`}>
                <li><b className={textPrimary}>Posts:</b> {postCount}</li>
                <li><b className={textPrimary}>Friends:</b> {friendCount}</li>
                <li><b className={textPrimary}>Followers:</b> {followerCount}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}