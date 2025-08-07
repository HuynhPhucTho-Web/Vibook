// home.jsx
import React, { useEffect, useState, useContext } from "react";
import { auth, db } from "../components/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, query, getDocs, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaComment, FaHeart, FaLaugh, FaSurprise, FaSadTear, FaAngry, FaTrash, FaSignOutAlt } from "react-icons/fa";
import PostCreator from "../components/PostCreate";

function Home() {
  const { theme } = useContext(ThemeContext);
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostIdForReactions, setSelectedPostIdForReactions] = useState(null);

  // Fetch user data and posts
  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        console.log("Auth state changed:", user ? "Logged in" : "Logged out");
        if (user) {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data());
          } else {
            toast.error("User data not found", { position: "top-center" });
          }
          const postsQuery = query(collection(db, "Posts"));
          const postsSnapshot = await getDocs(postsQuery);
          const allPosts = await Promise.all(
            postsSnapshot.docs.map(async (doc) => {
              const postData = { id: doc.id, ...doc.data() };
              const commentsQuery = query(collection(db, "Posts", doc.id, "comments"));
              const commentsSnapshot = await getDocs(commentsQuery);
              const comments = commentsSnapshot.docs.map((c) => ({ id: c.id, ...c.data() }));
              return { ...postData, comments };
            })
          );
          setPosts(allPosts.sort((a, b) => b.createdAt - a.createdAt));
        } else {
          setUserDetails(null);
          setPosts([]);
        }
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data", { position: "top-center" });
    }
    return () => unsubscribe && unsubscribe();
  }, []);

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

  // Handle new post from PostCreator
  const handlePostCreated = async (postData) => {
    const docRef = await addDoc(collection(db, "Posts"), postData);
    setPosts([{ id: docRef.id, ...postData }, ...posts]);
  };

  // Handle reaction (unchanged)
  const handleReaction = async (postId, reaction) => {
    try {
      const postRef = doc(db, "Posts", postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) {
        toast.error("Post not found", { position: "top-center" });
        return;
      }

      const postData = postSnap.data();
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error("You must be logged in to react", { position: "top-center" });
        return;
      }

      const updatedLikes = { ...postData.likes };
      const updatedReactedBy = { ...postData.reactedBy };

      if (updatedReactedBy[userId]) {
        const previousReaction = updatedReactedBy[userId];
        updatedLikes[previousReaction] = Math.max(0, (updatedLikes[previousReaction] || 0) - 1);
      }

      if (updatedReactedBy[userId] === reaction) {
        delete updatedReactedBy[userId];
      } else {
        updatedLikes[reaction] = (updatedLikes[reaction] || 0) + 1;
        updatedReactedBy[userId] = reaction;
      }

      await updateDoc(postRef, { likes: updatedLikes, reactedBy: updatedReactedBy });
      setPosts(
        posts.map((post) =>
          post.id === postId ? { ...post, likes: updatedLikes, reactedBy: updatedReactedBy } : post
        )
      );
      const actionText = updatedReactedBy[userId] ? `Reacted with ${reaction}` : "Reaction removed";
      toast.success(actionText, { position: "top-center" });
    } catch (error) {
      console.error("Error reacting to post:", error);
      toast.error("Failed to react to post", { position: "top-center" });
    }
  };

  // Handle comment submission (unchanged)
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting comment:", {
      commentText,
      selectedPostId,
      authCurrentUser: auth.currentUser?.uid,
      userDetails,
    });
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty", { position: "top-center" });
      return;
    }
    if (!auth.currentUser || !userDetails) {
      toast.error("You must be logged in to comment", { position: "top-center" });
      return;
    }
    if (!selectedPostId) {
      toast.error("No post selected for commenting", { position: "top-center" });
      return;
    }
    try {
      const commentData = {
        userId: auth.currentUser.uid,
        userName: userDetails.firstName + (userDetails.lastName ? " " + userDetails.lastName : ""),
        userPhoto: userDetails.photo || "https://via.placeholder.com/30",
        content: commentText,
        createdAt: Date.now(),
      };
      console.log("Adding comment to:", `Posts/${selectedPostId}/comments`, commentData);
      const commentsRef = collection(db, "Posts", selectedPostId, "comments");
      const docRef = await addDoc(commentsRef, commentData);
      setPosts(
        posts.map((post) =>
          post.id === selectedPostId
            ? { ...post, comments: [...(post.comments || []), { id: docRef.id, ...commentData }] }
            : post
        )
      );
      setCommentText("");
      setSelectedPostId(null);
      toast.success("Comment added successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment: " + error.message, { position: "top-center" });
    }
  };

  // Handle post deletion (unchanged)
  const handleDeletePost = async (postId) => {
    try {
      const postRef = doc(db, "Posts", postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) {
        toast.error("Post not found", { position: "top-center" });
        return;
      }

      const postData = postSnap.data();
      if (postData.userId !== auth.currentUser?.uid) {
        toast.error("You can only delete your own posts", { position: "top-center" });
        return;
      }

      await deleteDoc(postRef);
      const commentsQuery = query(collection(db, "Posts", postId, "comments"));
      const commentsSnapshot = await getDocs(commentsQuery);
      const deletePromises = commentsSnapshot.docs.map((commentDoc) => deleteDoc(commentDoc.ref));
      await Promise.all(deletePromises);

      setPosts(posts.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post", { position: "top-center" });
    }
  };

  // Get reaction icon (unchanged)
  const getReactionIcon = (reaction) => {
    switch (reaction) {
      case "Like":
        return "👍";
      case "Love":
        return "❤️";
      case "Haha":
        return "😂";
      case "Wow":
        return "😮";
      case "Sad":
        return "😢";
      case "Angry":
        return "😠";
      default:
        return "👍";
    }
  };

  if (!userDetails) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 ${theme}`}>
      <div className="container">
        {/* Logout Button */}
        <div className="d-flex justify-content-end mb-3">
          <button
            className="btn btn-outline-danger"
            onClick={handleLogout}
            disabled={!auth.currentUser}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
        <PostCreator onPostCreated={handlePostCreated} />
        {/* Posts Feed */}
        <div>
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="card mb-4 shadow-sm">
                <div className="card-body">
                  {/* Post Header */}
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={post.userPhoto || "https://via.placeholder.com/40"}
                      alt="User"
                      className="rounded-circle me-3"
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                    />
                    <div>
                      <p className="mb-0 fw-bold">{post.userName}</p>
                      <small className="text-muted">{new Date(post.createdAt).toLocaleString()}</small>
                    </div>
                    {post.userId === auth.currentUser?.uid && (
                      <button
                        className="btn btn-link text-danger p-2 ms-auto"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="mb-3">{post.content}</p>
                  {post.mediaUrl && (
                    post.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/) ? (
                      <img src={post.mediaUrl} alt="Post media" style={{ maxWidth: "100%", maxHeight: "300px" }} />
                    ) : (
                      <video controls style={{ maxWidth: "100%", maxHeight: "300px" }}>
                        <source src={post.mediaUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )
                  )}
                  {/* Reactions Summary */}
                  <div className="d-flex justify-content-between align-items-center mb-2 text-muted small">
                    <div>
                      {Object.entries(post.likes || {})
                        .filter(([, count]) => count > 0)
                        .map(([reaction, count]) => (
                          <span key={reaction} className="me-2">
                            {getReactionIcon(reaction)} {count}
                          </span>
                        ))}
                    </div>
                    <div>
                      {post.comments && post.comments.length > 0 && (
                        <span>{post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>

                  <hr className="my-2" />

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-around">
                    {/* Like Button with Reaction Menu */}
                    <div className="position-relative">
                      <button
                        className={`btn btn-link text-muted p-2 flex-fill ${
                          post.reactedBy && post.reactedBy[auth.currentUser?.uid] ? "text-primary" : ""
                        }`}
                        onClick={() => handleReaction(post.id, "Like")}
                        onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
                        onMouseLeave={() => setSelectedPostIdForReactions(null)}
                      >
                        👍 Like
                      </button>
                      {selectedPostIdForReactions === post.id && (
                        <div
                          className="position-absolute bg-white border rounded shadow-lg p-2 d-flex gap-1"
                          onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
                          onMouseLeave={() => setSelectedPostIdForReactions(null)}
                          style={{ zIndex: 1000 }}
                        >
                          {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((reaction) => (
                            <button
                              key={reaction}
                              className="btn btn-link p-1"
                              onClick={() => handleReaction(post.id, reaction)}
                              title={reaction}
                            >
                              {getReactionIcon(reaction)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-link text-muted p-2 flex-fill"
                      onClick={() => {
                        console.log("Selecting post for comment:", post.id);
                        setSelectedPostId(selectedPostId === post.id ? null : post.id);
                      }}
                    >
                      <FaComment className="me-1" /> Comment
                    </button>

                    <button
                      className="btn btn-link text-muted p-2 flex-fill"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href + "/post/" + post.id);
                        toast.success("Post link copied to clipboard", { position: "top-center" });
                      }}
                    >
                      📤 Share
                    </button>
                  </div>

                  {/* Comments Section */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="mt-3">
                      <hr />
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="d-flex align-items-start mb-2">
                          <img
                            src={comment.userPhoto || "https://via.placeholder.com/30"}
                            alt="Commenter"
                            className="rounded-circle me-2"
                            style={{ width: "30px", height: "30px", objectFit: "cover" }}
                          />
                          <div className="bg-light rounded p-2 flex-grow-1">
                            <small className="fw-bold">{comment.userName}</small>
                            <p className="mb-1 small">{comment.content}</p>
                            <small className="text-muted">{new Date(comment.createdAt).toLocaleTimeString()}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Input */}
                  {selectedPostId === post.id && (
                    <div className="mt-3">
                      <hr />
                      <form onSubmit={handleCommentSubmit} className="d-flex gap-2">
                        <img
                          src={userDetails.photo || "https://via.placeholder.com/30"}
                          alt="Your avatar"
                          className="rounded-circle"
                          style={{ width: "30px", height: "30px", objectFit: "cover" }}
                        />
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="form-control"
                          autoFocus
                        />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={!commentText.trim()}>
                          Post
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">No posts available</h5>
              <p className="text-muted">Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;