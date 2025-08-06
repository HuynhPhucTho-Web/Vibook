import React, { useEffect, useState, useContext } from "react";
import { auth, db, storage } from "../components/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ThemeContext } from "../contexts/ThemeContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCamera, FaSave, FaEdit } from 'react-icons/fa';

function Profile() {
  const { themes, theme } = useContext(ThemeContext);
  const [userDetails, setUserDetails] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});

  // Fetch user data and posts
  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
          setEditedDetails(docSnap.data());
          console.log('User data:', docSnap.data());
        } else {
          console.log("No user data found in Firestore");
        }

        // Fetch user's posts
        const postsQuery = query(collection(db, "Posts"), where("userId", "==", user.uid));
        const postsSnapshot = await getDocs(postsQuery);
        const userPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(userPosts.sort((a, b) => b.createdAt - a.createdAt)); // Sort by latest
      } else {
        console.log("User is not logged in");
      }
    });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // setNewAvatar is not defined in your code, so we remove it or define it if needed
      // setNewAvatar(file);
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const userRef = doc(db, "Users", auth.currentUser.uid);
      await updateDoc(userRef, { photo: url });
      setUserDetails(prev => ({ ...prev, photo: url }));
      console.log("Avatar updated successfully");
    }
  };

  // Handle profile edit
  const handleEditProfile = async () => {
    if (editMode) {
      const userRef = doc(db, "Users", auth.currentUser.uid);
      await updateDoc(userRef, editedDetails);
      setUserDetails(editedDetails);
      setEditMode(false);
      console.log("Profile updated successfully");
    } else {
      setEditMode(true);
    }
  };

  // Handle post submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (postContent.trim() && auth.currentUser) {
      const postData = {
        userId: auth.currentUser.uid,
        userName: userDetails.firstName + (userDetails.lastName ? ' ' + userDetails.lastName : ''),
        content: postContent,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, "Posts"), postData);
      setPosts([{ id: docRef.id, ...postData }, ...posts]);
      setPostContent('');
      console.log("Post created:", postData);
    }
  };

  return (
    <div className={`min-vh-100 ${themes[theme]}`}>
      {userDetails ? (
        <div className="container">
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
                  <FaCamera />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <h3 className="mb-3">Welcome {userDetails.firstName} {userDetails.lastName || ''} 🙏🙏</h3>
              <div className="mb-3">
                {editMode ? (
                  <>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={editedDetails.firstName || ''}
                        onChange={(e) => setEditedDetails({ ...editedDetails, firstName: e.target.value })}
                        placeholder="First Name"
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
                        type="text"
                        className="form-control"
                        value={editedDetails.email || ''}
                        onChange={(e) => setEditedDetails({ ...editedDetails, email: e.target.value })}
                        placeholder="Email"
                      />
                    </div>
                    <div className="mb-2">
                      <textarea
                        className="form-control"
                        value={editedDetails.bio || ''}
                        onChange={(e) => setEditedDetails({ ...editedDetails, bio: e.target.value })}
                        placeholder="Bio"
                        rows="3"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p><strong>Email:</strong> {userDetails.email}</p>
                    <p><strong>First Name:</strong> {userDetails.firstName}</p>
                    {userDetails.lastName && <p><strong>Last Name:</strong> {userDetails.lastName}</p>}
                    {userDetails.bio && <p><strong>Bio:</strong> {userDetails.bio}</p>}
                  </>
                )}
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-primary" onClick={handleEditProfile}>
                  {editMode ? <><FaSave className="me-2" /> Save</> : <><FaEdit className="me-2" /> Edit Profile</>}
                </button>
                <button className="btn btn-secondary" onClick={auth.signOut}>
                  Logout
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
                ></textarea>
                <div className="d-flex justify-content-between">
                  <div className="d-flex">
                    <button type="button" className="btn btn-link text-primary me-2">Photo/Video</button>
                    <button type="button" className="btn btn-link text-primary">Feeling/Activity</button>
                  </div>
                  <button type="submit" className="btn btn-primary">Post</button>
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
                        src={userDetails.photo || "https://via.placeholder.com/40"}
                        alt="Profile"
                        className="rounded-circle me-2"
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                      />
                      <div>
                        <p className="mb-0 fw-bold">{post.userName}</p>
                        <small className="text-muted">{new Date(post.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                    <p>{post.content}</p>
                    <div className="d-flex justify-content-between text-muted">
                      <button className="btn btn-link text-muted p-0">Like</button>
                      <button className="btn btn-link text-muted p-0">Comment</button>
                      <button className="btn btn-link text-muted p-0">Share</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center">No posts yet.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center">Loading...</p>
      )}
    </div>
  );
}

export default Profile;