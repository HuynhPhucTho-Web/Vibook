import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import PostItem from "../components/PostItem";
import "../style/Home.css";

function PostDetail() {
  const { theme } = useContext(ThemeContext);
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    // Post body only — comments load inside PostItem (isDetailView)
    const unsubscribePost = onSnapshot(
      doc(db, "Posts", postId),
      async (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          toast.error("Post not found");
          setPost(null);
          setLoading(false);
          return;
        }
        const postData = { id: snap.id, ...snap.data() };
        setPost(postData);
        setLoading(false);

        if (postData.userId) {
          try {
            const userDoc = await getDoc(doc(db, "Users", postData.userId));
            if (!cancelled && userDoc.exists()) {
              setUserDetails({ id: postData.userId, ...userDoc.data() });
            }
          } catch {
            // non-blocking
          }
        }
      },
      (error) => {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribePost();
    };
  }, [postId]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-5">
        <h5 className="text-muted">Post not found</h5>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="posts-list">
        <PostItem
          post={post}
          auth={auth}
          userDetails={userDetails}
          onPostDeleted={() => window.history.back()}
          isDetailView={true}
        />
      </div>
    </div>
  );
}

export default PostDetail;
