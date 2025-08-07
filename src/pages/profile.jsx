import React, { useEffect, useState, useContext, useCallback } from "react";
import { auth, db, storage } from "../components/firebase";
import { doc, updateDoc, collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { ThemeContext } from "../contexts/ThemeContext";
import { toast } from "react-toastify";
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCamera, FaSave, FaEdit, FaSignOutAlt, FaSpinner } from 'react-icons/fa';

function Profile() {
  const { themes, theme } = useContext(ThemeContext);
  const [userDetails, setUserDetails] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch user data và posts với real-time listener
  const fetchUserData = useCallback(async (user) => {
    if (!user) {
      setUserDetails(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user details với real-time listener
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

      // Fetch user's posts với real-time listener
      const postsQuery = query(collection(db, "Posts"), where("userId", "==", user.uid));
      const unsubscribePosts = onSnapshot(postsQuery, (postsSnapshot) => {
        const userPosts = postsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setPosts(userPosts.sort((a, b) => b.createdAt - a.createdAt));
      });

      // Return cleanup function
      return () => {
        unsubscribeUser();
        unsubscribePosts();
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data", { position: "top-center" });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeData;

    // Auth state listener
    unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state changed:", user ? `User: ${user.email}` : "User logged out");
      
      // Cleanup previous data listeners
      if (unsubscribeData) {
        unsubscribeData();
      }

      if (user) {
        // Setup new data listeners
        unsubscribeData = await fetchUserData(user);
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

  // Handle logout với proper error handling
  const handleLogout = async () => {
    if (loggingOut) return; // Prevent multiple logout attempts
    
    setLoggingOut(true);
    try {
      console.log("Attempting to log out user:", auth.currentUser?.email);
      
      // Clear local state trước khi logout
      setUserDetails(null);
      setPosts([]);
      setEditMode(false);
      setPostContent('');
      
      // Sign out from Firebase
      await signOut(auth);
      
      console.log("Logout successful");
      toast.success("Logged out successfully", { position: "top-center" });
      
      // Optional: Redirect to login page
      // window.location.href = '/login';
      
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(`Failed to log out: ${error.message}`, { position: "top-center" });
    } finally {
      setLoggingOut(false);
    }
  };

  // Handle avatar upload với progress tracking
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file", { position: "top-center" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB", { position: "top-center" });
      return;
    }

    setUploading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const userRef = doc(db, "Users", currentUser.uid);
      await updateDoc(userRef, { photo: downloadURL });
      
      toast.success("Avatar updated successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(`Failed to upload avatar: ${error.message}`, { position: "top-center" });
    } finally {
      setUploading(false);
    }
  };

  // Handle profile edit với validation
  const handleEditProfile = async () => {
    if (editMode) {
      // Validate input
      if (!editedDetails.firstName?.trim()) {
        toast.error("First name is required", { position: "top-center" });
        return;
      }

      if (!editedDetails.email?.trim()) {
        toast.error("Email is required", { position: "top-center" });
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedDetails.email)) {
        toast.error("Please enter a valid email address", { position: "top-center" });
        return;
      }

      setUpdating(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("User not authenticated");
        }

        const userRef = doc(db, "Users", currentUser.uid);
        const updateData = {
          ...editedDetails,
          firstName: editedDetails.firstName.trim(),
          lastName: editedDetails.lastName?.trim() || '',
          email: editedDetails.email.trim(),
          bio: editedDetails.bio?.trim() || '',
          updatedAt: Date.now()
        };

        await updateDoc(userRef, updateData);
        setEditMode(false);
        toast.success("Profile updated successfully", { position: "top-center" });
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error(`Failed to update profile: ${error.message}`, { position: "top-center" });
      } finally {
        setUpdating(false);
      }
    } else {
      setEditMode(true);
    }
  };

  // Handle post submission với validation
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    if (!postContent.trim()) {
      toast.error("Post content cannot be empty", { position: "top-center" });
      return;
    }

    if (!auth.currentUser || !userDetails) {
      toast.error("You must be logged in to post", { position: "top-center" });
      return;
    }

    setPosting(true);
    try {
      const postData = {
        userId: auth.currentUser.uid,
        userName: `${userDetails.firstName}${userDetails.lastName ? ' ' + userDetails.lastName : ''}`,
        userPhoto: userDetails.photo || null,
        content: postContent.trim(),
        createdAt: Date.now(),
        likes: {},
        reactedBy: {}
      };

      await addDoc(collection(db, "Posts"), postData);
      setPostContent('');
      toast.success("Post created successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(`Failed to create post: ${error.message}`, { position: "top-center" });
    } finally {
      setPosting(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditedDetails(userDetails || {});
    setEditMode(false);
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
              Welcome {userDetails.firstName} {userDetails.lastName || ''} 🙏
            </h3>
            
            <div className="mb-3">
              {editMode ? (
                <div className="row justify-content-center">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={editedDetails.firstName || ''}
                        onChange={(e) => setEditedDetails({ ...editedDetails, firstName: e.target.value })}
                        placeholder="First Name *"
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={editedDetails.lastName || ''}
                        onChange={(e) => setEditedDetails({ ...editedDetails, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        type="email"
                        className="form-control"
                        value={editedDetails.email || ''}
                        onChange={(e) => setEditedDetails({ ...editedDetails, email: e.target.value })}
                        placeholder="Email *"
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <textarea
                        className="form-control"
                        value={editedDetails.bio || ''}
                        onChange={(e) => setEditedDetails({ ...editedDetails, bio: e.target.value })}
                        placeholder="Bio"
                        rows="3"
                        maxLength="500"
                      />
                      <small className="text-muted">
                        {(editedDetails.bio || '').length}/500
                      </small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-start" style={{ maxWidth: "400px", margin: "0 auto" }}>
                  <p><strong>Email:</strong> {userDetails.email}</p>
                  <p><strong>First Name:</strong> {userDetails.firstName}</p>
                  {userDetails.lastName && <p><strong>Last Name:</strong> {userDetails.lastName}</p>}
                  {userDetails.bio && <p><strong>Bio:</strong> {userDetails.bio}</p>}
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
                    {updating ? <><FaSpinner className="fa-spin me-2" /> Saving...</> : <><FaSave className="me-2" /> Save</>}
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
                  <><FaSpinner className="fa-spin me-2" /> Logging out...</>
                ) : (
                  <><FaSignOutAlt className="me-2" /> Logout</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Post Creation */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <form onSubmit={handlePostSubmit}>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="form-control mb-3"
                rows="4"
                maxLength="2000"
                disabled={posting}
              />
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {postContent.length}/2000 characters
                </small>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={posting || !postContent.trim()}
                >
                  {posting ? <><FaSpinner className="fa-spin me-2" /> Posting...</> : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* User's Posts */}
        <div>
          {posts.length > 0 ? (
            posts.map(post => (
              <div key={post.id} className="card mb-4 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={post.userPhoto || userDetails.photo || "https://via.placeholder.com/40"}
                      alt="Profile"
                      className="rounded-circle me-2"
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                    />
                    <div>
                      <p className="mb-0 fw-bold">{post.userName}</p>
                      <small className="text-muted">
                        {new Date(post.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </div>
                  <p className="mb-3">{post.content}</p>
                  <div className="d-flex justify-content-between text-muted">
                    <button className="btn btn-link text-muted p-0">
                      👍 {Object.values(post.likes || {}).reduce((a, b) => a + b, 0) || 0}
                    </button>
                    <button className="btn btn-link text-muted p-0">💬 Comment</button>
                    <button className="btn btn-link text-muted p-0">📤 Share</button>
                  </div>
                </div>
              </div>
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