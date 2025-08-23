import React, { useState } from "react";
import { auth, db } from "../components/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { toast } from "react-toastify";
import { FaCamera, FaSpinner, FaSave, FaTimes } from "react-icons/fa";

function UpdateProfile({ userDetails, onUpdated }) {
  const [editedDetails, setEditedDetails] = useState(userDetails || {});
  const [formErrors, setFormErrors] = useState({});
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!editedDetails.firstName?.trim()) {
      errors.firstName = "First name is required";
    }
    if (!editedDetails.email?.trim()) {
      errors.email = "Email is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input
  const handleInputChange = (field, value) => {
    setEditedDetails((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Upload avatar lên Cloudinary
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be < 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        setEditedDetails((prev) => ({ ...prev, photo: data.secure_url }));

        // update ngay Firestore và Auth
        const userRef = doc(db, "Users", auth.currentUser.uid);
        await updateDoc(userRef, { photo: data.secure_url });
        await updateProfile(auth.currentUser, { photoURL: data.secure_url });

        toast.success("Avatar updated!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  // Save profile info
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix errors before saving");
      return;
    }
    setUpdating(true);
    try {
      const userRef = doc(db, "Users", auth.currentUser.uid);
      const updateData = {
        firstName: editedDetails.firstName.trim(),
        lastName: editedDetails.lastName?.trim() || "",
        email: editedDetails.email.trim(),
        bio: editedDetails.bio?.trim() || "",
        photo: editedDetails.photo || "",
        updatedAt: new Date(),
      };
      await updateDoc(userRef, updateData);

      // update auth display name
      await updateProfile(auth.currentUser, {
        displayName: `${editedDetails.firstName} ${editedDetails.lastName || ""}`,
      });

      toast.success("Profile updated!");
      setEditMode(false);
      onUpdated(updateData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="text-center">
      {/* Avatar */}
      <div className="position-relative d-inline-block mb-3">
        <img
          src={editedDetails.photo || "https://via.placeholder.com/150"}
          alt="Profile"
          className="rounded-circle"
          style={{ width: "150px", height: "150px", objectFit: "cover" }}
        />
        <label
          htmlFor="avatar-upload"
          className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2"
          style={{ cursor: "pointer" }}
        >
          {uploading ? <FaSpinner className="fa-spin" /> : <FaCamera />}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="d-none"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Info */}
      {editMode ? (
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
          <input
            className={`form-control mb-2 ${formErrors.firstName ? "is-invalid" : ""}`}
            value={editedDetails.firstName || ""}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            placeholder="First name"
          />
          {formErrors.firstName && <div className="invalid-feedback">{formErrors.firstName}</div>}
          <input
            className="form-control mb-2"
            value={editedDetails.lastName || ""}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            placeholder="Last name"
          />
          <input
            className={`form-control mb-2 ${formErrors.email ? "is-invalid" : ""}`}
            value={editedDetails.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Email"
          />
          {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
          <textarea
            className="form-control mb-2"
            value={editedDetails.bio || ""}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            placeholder="Bio"
            rows="3"
          />

          <button className="btn btn-primary me-2" onClick={handleSave} disabled={updating}>
            {updating ? <FaSpinner className="fa-spin me-2" /> : <FaSave className="me-2" />}
            Save
          </button>
          <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
            <FaTimes className="me-2" /> Cancel
          </button>
        </div>
      ) : (
        <div>
          <h3>{editedDetails.firstName} {editedDetails.lastName}</h3>
          <p>{editedDetails.email}</p>
          {editedDetails.bio && <p>{editedDetails.bio}</p>}
          <button className="btn btn-primary" onClick={() => setEditMode(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
}

export default UpdateProfile;
