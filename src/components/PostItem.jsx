// PostItem.jsx
import React, { useState, useContext, useEffect } from "react";
import { doc, updateDoc, collection, addDoc, getDoc, deleteDoc, query, getDocs, onSnapshot } from "firebase/firestore"; // Added onSnapshot
import {  db } from "../components/firebase";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaComment, FaHeart, FaLaugh, FaSurprise, FaSadTear, FaAngry, FaTrash } from "react-icons/fa";

const PostItem = ({ post, auth, userDetails }) => {
  const { theme } = useContext(ThemeContext);
  const [commentText, setCommentText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostIdForReactions, setSelectedPostIdForReactions] = useState(null);
  const [comments, setComments] = useState(post.comments || []);

  useEffect(() => {
    const fetchComments = async () => {
      if (selectedPostId === post.id) {
        const commentsQuery = query(collection(db, "Posts", post.id, "comments"));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
          const postComments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setComments(postComments);
        });
        return () => unsubscribe();
      }
    };
    fetchComments();
  }, [selectedPostId, post.id]);

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
      toast.success(updatedReactedBy[userId] ? `Reacted with ${reaction}` : "Reaction removed", { position: "top-center" });
    } catch (error) {
      console.error("Error reacting to post:", error);
      toast.error("Failed to react to post", { position: "top-center" });
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty", { position: "top-center" });
      return;
    }
    if (!auth.currentUser || !userDetails) {
      toast.error("You must be logged in to comment", { position: "top-center" });
      return;
    }
    try {
      const commentData = {
        userId: auth.currentUser.uid,
        userName: `${userDetails.firstName}${userDetails.lastName ? " " + userDetails.lastName : ""}`,
        userPhoto: userDetails.photo || "https://via.placeholder.com/30",
        content: commentText,
        createdAt: Date.now(),
      };
      const commentsRef = collection(db, "Posts", post.id, "comments");
      const docRef = await addDoc(commentsRef, commentData);
      setComments([...comments, { id: docRef.id, ...commentData }]);
      setCommentText("");
      setSelectedPostId(null);
      toast.success("Comment added successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(`Failed to add comment: ${error.message}`, { position: "top-center" });
    }
  };

  const handleDeletePost = async () => {
    try {
      const postRef = doc(db, "Posts", post.id);
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
      const commentsQuery = query(collection(db, "Posts", post.id, "comments"));
      const commentsSnapshot = await getDocs(commentsQuery);
      const deletePromises = commentsSnapshot.docs.map((commentDoc) => deleteDoc(commentDoc.ref));
      await Promise.all(deletePromises);
      toast.success("Post deleted successfully", { position: "top-center" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post", { position: "top-center" });
    }
  };

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

  return (
    <div className={`card mb-4 shadow-sm ${theme}`}>
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
            <small className="text-muted">{new Date(post.createdAt).toLocaleString()}</small>
          </div>
          {post.userId === auth.currentUser?.uid && (
            <button className="btn btn-link text-danger p-2 ms-auto" onClick={handleDeletePost}>
              <FaTrash /> Delete
            </button>
          )}
        </div>
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
            {comments.length > 0 && <span>{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>}
          </div>
        </div>
        <hr className="my-2" />
        <div className="d-flex justify-content-around">
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
            onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
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
        {comments.length > 0 && (
          <div className="mt-3">
            <hr />
            {comments.map((comment) => (
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
  );
};

export default PostItem;