import React, { useEffect, useState, useContext, useCallback } from "react";
import { auth, db, storage } from "../components/firebase";
import { doc, onSnapshot, query, collection, where, updateDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCamera, FaSave, FaEdit, FaSignOutAlt, FaSpinner, FaTimes, FaUser, FaEnvelope } from "react-icons/fa";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";

function Profile() {
  const { themes, theme } = useContext(ThemeContext);
  const [userDetails, setUserDetails] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [posts, setPosts] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Fetch user data và posts với real-time listener
  const fetchUserData = useCallback((user) => {
    if (!user) {
      setUserDetails(null);
      setPosts([]);
      setLoading(false);
      return () => { };
    }

    try {
      const userDocRef = doc(db, "Users", user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserDetails(userData);
          setEditedDetails(userData);
        } else {
          console.log("No user data found in Firestore");
          toast.error("User data not found", { position: "top-center" });
        }
        setLoading(false);
      });

      // Fetch user's posts with real-time listener
      const postsQuery = query(collection(db, "Posts"), where("userId", "==", user.uid));
      const unsubscribePosts = onSnapshot(postsQuery, async (querySnapshot) => {
        const userPosts = await Promise.all(
          querySnapshot.docs.map(async (postDoc) => {
            const postData = { id: postDoc.id, ...postDoc.data() };

            // Fetch comments for each post
            const commentsQuery = query(collection(db, "Posts", postDoc.id, "comments"));
            const commentsSnapshot = await getDocs(commentsQuery);
            const comments = commentsSnapshot.docs.map(c => ({ id: c.id, ...c.data() }));

            return { ...postData, comments };
          })
        );
        setPosts(userPosts.sort((a, b) => b.createdAt - a.createdAt));
      });

      return () => {
        unsubscribeUser();
        unsubscribePosts();
      };
    } catch (error) {
      console.error("Error fetching user data or posts:", error);
      toast.error("Failed to load user data or posts", { position: "top-center" });
      setLoading(false);
      return () => { };
    }
  }, []);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeData;

    unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user ? `User: ${user.email}` : "User logged out");
      if (unsubscribeData) unsubscribeData();

      if (user) {
        unsubscribeData = fetchUserData(user);
      } else {
        setUserDetails(null);
        setPosts([]);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeData) unsubscribeData();
    };
  }, [fetchUserData]);

  // Validate form fields
  const validateForm = () => {
    const errors = {};

    if (!editedDetails.firstName?.trim()) {
      errors.firstName = "First name is required";
    } else if (editedDetails.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!editedDetails.email?.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedDetails.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (editedDetails.lastName && editedDetails.lastName.trim().length > 0 && editedDetails.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (editedDetails.bio && editedDetails.bio.length > 500) {
      errors.bio = "Bio must be less than 500 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setEditedDetails(prev => ({ ...prev, [field]: value }));

    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB", { position: "top-center" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only images are allowed", { position: "top-center" });
      return;
    }

    setUploading(true);

    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(db, "Users", auth.currentUser.uid);
      await updateDoc(userRef, { photo: downloadURL });

      // Update auth profile
      await auth.currentUser.updateProfile({ photoURL: downloadURL });

      toast.success("Avatar updated successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar", { position: "top-center" });
    } finally {
      setUploading(false);
    }
  };

  // Handle edit profile
  const handleEditProfile = async () => {
    if (editMode) {
      // Validate form
      if (!validateForm()) {
        toast.error("Please fix the errors before saving", { position: "top-center" });
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
          updatedAt: new Date()
        };

        await updateDoc(userRef, updateData);

        // Update auth profile display name
        const displayName = `${editedDetails.firstName.trim()} ${editedDetails.lastName?.trim() || ""}`.trim();
        await auth.currentUser.updateProfile({ displayName });

        setEditMode(false);
        setFormErrors({});
        toast.success("Profile updated successfully", { position: "top-center" });
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile", { position: "top-center" });
      } finally {
        setUpdating(false);
      }
    } else {
      setEditMode(true);
      setEditedDetails({ ...userDetails });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedDetails(userDetails || {});
    setEditMode(false);
    setFormErrors({});
  };

  // Handle logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      console.log("Attempting to log out:", auth.currentUser);
      await auth.signOut();
      console.log("Logout successful");
      toast.success("Logged out successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out: " + error.message, { position: "top-center" });
    } finally {
      setLoggingOut(false);
    }
  };

  // Handle new post created
  const handlePostCreated = (newPost) => {
    console.log("New post created:", newPost);
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="text-center">
          <h5 className="text-muted">Please log in to view your profile</h5>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 ${themes[theme]}`}>
      <div className="container py-4">
        {/* Profile Header */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            {/* Avatar Section - Centered */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                <img
                  src={userDetails.photo || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="rounded-circle mb-3"
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
            </div>

            {/* Profile Information */}
            <div>
              <div className="text-center">
                <h3 className="mb-3">
                  {userDetails.firstName} {userDetails.lastName || ""}
                </h3>

                <div className="mb-3">
                  {editMode ? (
                    <div className="row justify-content-center">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label fw-bold text-start w-100">
                            First Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${formErrors.firstName ? 'is-invalid' : ''}`}
                            value={editedDetails.firstName || ""}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="Enter your first name"
                            maxLength="50"
                          />
                          {formErrors.firstName && (
                            <div className="invalid-feedback text-start">{formErrors.firstName}</div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-bold text-start w-100">Last Name</label>
                          <input
                            type="text"
                            className={`form-control ${formErrors.lastName ? 'is-invalid' : ''}`}
                            value={editedDetails.lastName || ""}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="Enter your last name"
                            maxLength="50"
                          />
                          {formErrors.lastName && (
                            <div className="invalid-feedback text-start">{formErrors.lastName}</div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-bold text-start w-100">
                            <FaEnvelope className="me-1" />
                            Email <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                            value={editedDetails.email || ""}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter your email address"
                          />
                          {formErrors.email && (
                            <div className="invalid-feedback text-start">{formErrors.email}</div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-bold text-start w-100">Bio</label>
                          <textarea
                            className={`form-control ${formErrors.bio ? 'is-invalid' : ''}`}
                            value={editedDetails.bio || ""}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows="4"
                            maxLength="500"
                            style={{ resize: "vertical" }}
                          />
                          <div className="d-flex justify-content-between mt-1">
                            <small className="text-muted text-start">
                              Optional - Share something about yourself
                            </small>
                            <small className={`${(editedDetails.bio || "").length > 450 ? 'text-warning' : 'text-muted'}`}>
                              {(editedDetails.bio || "").length}/500
                            </small>
                          </div>
                          {formErrors.bio && (
                            <div className="invalid-feedback text-start">{formErrors.bio}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-start" style={{ maxWidth: "400px", margin: "0 auto" }}>
                      <p>
                        <strong>Email:</strong> {userDetails.email}
                      </p>
                      <p>
                        <strong>First Name:</strong> {userDetails.firstName}
                      </p>
                      {userDetails.lastName && (
                        <p>
                          <strong>Last Name:</strong> {userDetails.lastName}
                        </p>
                      )}
                      {userDetails.bio && (
                        <p>
                          <strong>Bio:</strong> {userDetails.bio}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  {editMode ? (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={handleEditProfile}
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <FaSpinner className="fa-spin me-2" /> Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" /> Save Changes
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                        disabled={updating}
                      >
                        <FaTimes className="me-2" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={handleEditProfile}>
                      <FaEdit className="me-2" /> Edit Profile
                    </button>
                  )}

                  <button
                    className="btn btn-outline-danger"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <>
                        <FaSpinner className="fa-spin me-2" /> Logging out...
                      </>
                    ) : (
                      <>
                        <FaSignOutAlt className="me-2" /> Logout
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Post Creation - Using existing PostCreator component */}
          <PostCreator onPostCreated={handlePostCreated} />

          {/* User's Posts */}
          <div>
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  auth={auth}
                  userDetails={userDetails}
                />
              ))
            ) : (
              <div className="text-center py-5">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="text-muted mb-3">No posts yet</h5>
                    <p className="text-muted mb-0">Share your first post above to get started!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }
  
  export default Profile;