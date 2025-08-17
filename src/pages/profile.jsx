// Profile.jsx
import React, { useEffect, useState, useContext, useCallback } from "react";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, query, collection, where } from "firebase/firestore"; // Added query, collection, where
import { ThemeContext } from "../contexts/ThemeContext";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCamera, FaSave, FaEdit, FaSignOutAlt, FaSpinner } from "react-icons/fa";
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
  const [loggingOut] = useState(false);
  const [posts, setPosts] = useState([]);

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
      const unsubscribePosts = onSnapshot(postsQuery, (querySnapshot) => {
        const userPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(userPosts.sort((a, b) => b.createdAt - a.createdAt)); // Sort by latest
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
      console.log("Auth state changed:", user ? `Users: ${user.email}` : "User logged out");
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

  const handleAvatarUpload = () => {
    setUploading(true);
    // Logic will be handled in a separate component or passed as callback
  };

  const handleEditProfile = () => {
    if (editMode) {
      setUpdating(true);
      // Logic will be handled in a separate component
    } else {
      setEditMode(true);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedDetails(userDetails || {});
    setEditMode(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log("Attempting to log out:", auth.currentUser);
      await auth.signOut();
      console.log("Logout successful");
      toast.success("Logged out successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out: " + error.message, { position: "top-center" });
    }
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
          <div className="card-body text-center">
            <div className="position-relative d-inline-block">
              <img
                src={userDetails.photo || "https://via.placeholder.com/150"}
                alt="Profile"
                className="rounded-circle mb-3"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
              <label htmlFor="avatar-upload" className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 cursor-pointer">
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

            <h3 className="mb-3">
              Welcome {userDetails.firstName} {userDetails.lastName || ""} 🙏
            </h3>

            <div className="mb-3">
              {editMode ? (
                <div className="row justify-content-center">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={editedDetails.firstName || ""}
                        onChange={(e) => setEditedDetails({ ...editedDetails, firstName: e.target.value })}
                        placeholder="First Name *"
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={editedDetails.lastName || ""}
                        onChange={(e) => setEditedDetails({ ...editedDetails, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        type="email"
                        className="form-control"
                        value={editedDetails.email || ""}
                        onChange={(e) => setEditedDetails({ ...editedDetails, email: e.target.value })}
                        placeholder="Email *"
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <textarea
                        className="form-control"
                        value={editedDetails.bio || ""}
                        onChange={(e) => setEditedDetails({ ...editedDetails, bio: e.target.value })}
                        placeholder="Bio"
                        rows="3"
                        maxLength="500"
                      />
                      <small className="text-muted">
                        {(editedDetails.bio || "").length}/500
                      </small>
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
                        <FaSave className="me-2" /> Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={updating}
                  >
                    Cancel
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

        {/* Post Creation */}
        <PostCreator userDetails={userDetails} />

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
              <h5 className="text-muted">No posts yet</h5>
              <p className="text-muted">Share your first post above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;