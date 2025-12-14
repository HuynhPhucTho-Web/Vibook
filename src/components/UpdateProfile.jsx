import React, { useMemo, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../components/firebase";
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
import { ThemeContext } from "../context/ThemeContext";
import PlacesAutocomplete from "react-places-autocomplete";

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
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    website: user?.website || "",
    location: user?.location || "",
  }));

  // ✅ Sync form khi chuyển profile / snapshot update
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

  const createdText = user?.createdAt?.toDate
    ? user.createdAt.toDate().toLocaleDateString("vi-VN")
    : user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
    : "";

  // Theme tokens (giữ y như cũ)
  const bgCard = isDark ? "bg-[#111318]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-200" : "text-gray-700";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const bgInput = isDark ? "bg-gray-800" : "bg-gray-50";
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
      {/* ======================================================
          ✅ DESKTOP (md+) — GIỮ NGUYÊN GIAO DIỆN CŨ
         ====================================================== */}
      <div className="hidden md:block">
        {/* Cover */}
        <div className="relative">
          <img src={coverSrc} alt="cover" className="w-full h-52 md:h-64 object-cover" />
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
                src={avatarSrc}
                alt="avatar"
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ${
                  isDark ? "ring-gray-800" : "ring-white"
                } object-cover shadow-xl`}
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
                  <h1 className={`text-4xl md:text-5xl font-bold ${textPrimary} leading-tight`}>{fullName}</h1>
                  {user?.bio && !editing && (
                    <p className={`text-lg md:text-xl mt-2 font-semibold ${textSecondary}`}>{user.bio}</p>
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

          {/* About + Highlights */}
          {!editing && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-xl border ${borderColor} p-5 ${bgAbout}`}>
                <h3 className={`font-bold text-xl ${textPrimary} mb-3`}>About</h3>
                <ul className={`text-sm space-y-2 font-medium ${textSecondary}`}>
                  <li>
                    <b className={textPrimary}>Name:</b> {fullName}
                  </li>
                  {/* ✅ Desktop: Chỉ hiện email cho chủ tài khoản */}
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
          )}
        </div>
      </div>

      {/* ======================================================
          ✅ MOBILE (sm) — ẨN EMAIL KHI XEM NGƯỜI KHÁC + TÊN ĐẸP
         ====================================================== */}
      <div className="md:hidden">
        <div className="relative">
          <img src={coverSrc} alt="cover" className="w-full h-36 object-cover" />
          {isOwner && (
            <label className="absolute right-3 bottom-3 bg-black/60 text-white px-3 py-2 rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 hover:bg-black/70 transition">
              {uploadingCover ? <FaSpinner className="animate-spin" /> : <FaCamera />} Cover
              <input type="file" accept="image/*" hidden onChange={(e) => changeCover(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <div className="px-3 -mt-10 pb-4">
          <div className={`rounded-2xl border ${borderColor} shadow-sm ${bgCard} p-4`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className={`w-20 h-20 rounded-full object-cover ring-4 ${isDark ? "ring-gray-900" : "ring-white"} shadow`}
                />
                {isOwner && (
                  <label className="absolute -right-1 -bottom-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow">
                    {uploadingAvatar ? <FaSpinner className="animate-spin" size={14} /> : <FaCamera size={14} />}
                    <input type="file" accept="image/*" hidden onChange={(e) => changeAvatar(e.target.files?.[0])} />
                  </label>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* ✅ Tên: wrap đẹp, không truncate */}
                <div className={`text-base font-extrabold leading-snug ${textPrimary} break-words`}>
                  {fullName}
                </div>

                {/* ✅ Email: CHỈ hiện cho chủ tài khoản */}
                {isOwner && user?.email && (
                  <div className={`text-xs ${textSecondary} break-all`}>{user.email}</div>
                )}

                {user?.bio && !editing && (
                  <div className={`text-sm mt-1 font-semibold ${textSecondary} line-clamp-2`}>{user.bio}</div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {isOwner ? (
                <button
                  onClick={() => setEditing((v) => !v)}
                  className={`col-span-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition ${bgButton} ${textPrimary}`}
                >
                  <FaEdit /> {editing ? "Close" : "Edit profile"}
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
            {!editing && (
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
            )}

            {/* Edit form mobile */}
            {editing && isOwner && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                <input
                  className={`px-4 py-2.5 rounded-xl border font-medium ${borderColor} ${bgInput} ${textPrimary}`}
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                />
                <input
                  className={`px-4 py-2.5 rounded-xl border font-medium ${borderColor} ${bgInput} ${textPrimary}`}
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                />
                <input
                  className={`px-4 py-2.5 rounded-xl border font-medium ${borderColor} ${bgInput} ${textPrimary}`}
                  placeholder="Website (https://...)"
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                />
                <input
                  className={`px-4 py-2.5 rounded-xl border font-medium ${borderColor} ${bgInput} ${textPrimary}`}
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
                <textarea
                  rows={3}
                  className={`px-4 py-2.5 rounded-xl border font-medium ${borderColor} ${bgInput} ${textPrimary}`}
                  placeholder="Bio"
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className={`px-4 py-2.5 rounded-xl font-semibold transition ${bgButton} ${textPrimary}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition"
                  >
                    {saving ? <FaSpinner className="inline animate-spin mr-2" /> : null}
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
