// home.jsx (updated)
import React, { useEffect, useState, useContext } from "react";
import { auth, db } from "../components/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, query, getDocs, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaSignOutAlt } from "react-icons/fa";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem"; // Import new component

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
    console.log("New post received:", postData);
    setPosts(prevPosts => [postData, ...prevPosts]);
  };

  // Handle reaction
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

  // Handle comment submission
  const handleCommentSubmit = async (e, postId) => {
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
    if (!postId) {
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
      console.log("Adding comment to:", `Posts/${postId}/comments`, commentData);
      const commentsRef = collection(db, "Posts", postId, "comments");
      const docRef = await addDoc(commentsRef, commentData);
      setPosts(
        posts.map((post) =>
          post.id === postId
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

  // Handle post deletion
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

  // Get reaction icon
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
              <PostItem
                key={post.id}
                post={post}
                handleReaction={handleReaction}
                handleCommentSubmit={handleCommentSubmit}
                handleDeletePost={handleDeletePost}
                commentText={commentText}
                setCommentText={setCommentText}
                selectedPostId={selectedPostId}
                setSelectedPostId={setSelectedPostId}
                selectedPostIdForReactions={selectedPostIdForReactions}
                setSelectedPostIdForReactions={setSelectedPostIdForReactions}
                auth={auth}
                userDetails={userDetails}
                getReactionIcon={getReactionIcon}
              />
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