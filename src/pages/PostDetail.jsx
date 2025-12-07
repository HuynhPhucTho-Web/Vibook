import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, collection, query, getDocs, getDoc} from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import PostItem from "../components/PostItem";

function PostDetail() {
  const { theme } = useContext(ThemeContext);
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        // Listen to post data
        const postRef = doc(db, "Posts", postId);
        const unsubscribePost = onSnapshot(postRef, async (snap) => {
          if (snap.exists()) {
            const postData = { id: snap.id, ...snap.data() };

            // Fetch comments
            const commentsQuery = query(collection(db, "Posts", postId, "comments"));
            const commentsSnapshot = await getDocs(commentsQuery);
            const comments = commentsSnapshot.docs.map((c) => ({ id: c.id, ...c.data() }));

            setPost({ ...postData, comments });

            // Fetch user details if not already set
            if (!userDetails && postData.userId) {
              const userDoc = await getDoc(doc(db, "Users", postData.userId));
              if (userDoc.exists()) {
                setUserDetails({ id: postData.userId, ...userDoc.data() });
              }
            }
          } else {
            toast.error("Post not found");
          }
          setLoading(false);
        });

        return () => unsubscribePost();
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, userDetails]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
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
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"} flex justify-center`}>
      <div className="w-full p-[13px]  pt-4">
        <PostItem
          post={post}
          auth={auth}
          userDetails={userDetails}
          onPostDeleted={() => window.history.back()}
        />
      </div>
    </div>
  );
}

export default PostDetail;
