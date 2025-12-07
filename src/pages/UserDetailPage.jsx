import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { db } from "../components/firebase";
import { doc, onSnapshot, query, collection, where, getDocs, orderBy } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import PostItem from "../components/PostItem";
import ProfileHeader from "../components/UpdateProfile"; // Can be reused

function UserDetailPage() {
  const { theme } = useContext(ThemeContext);
  const { uid } = useParams();
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      toast.error("No user ID provided.");
      return;
    }

    setLoading(true);

    // Fetch user details
    const userRef = doc(db, "Users", uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUserDetails({ id: snap.id, ...snap.data() });
      } else {
        toast.error("User not found");
        setUserDetails(null);
      }
    });

    // Fetch user's posts
    const postsQuery = query(collection(db, "Posts"), where("userId", "==", uid), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(postsQuery, async (qs) => {
      const userPosts = await Promise.all(qs.docs.map(async (d) => {
        const post = { id: d.id, ...d.data() };
        // Fetch comments for each post
        const commentsSnapshot = await getDocs(collection(db, "Posts", d.id, "comments"));
        post.comments = commentsSnapshot.docs.map(c => ({ id: c.id, ...c.data() }));
        return post;
      }));
      setPosts(userPosts);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubPosts();
    };
  }, [uid]);

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
    return <div className="text-center py-5"><h5 className="text-muted">User not found</h5></div>;
  }

  return (
    <div className={`min-h-screen transition-colors ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <div className="container-fluid mx-auto py-4">
        <ProfileHeader
          user={userDetails}
          isOwner={false} // This page is only for viewing others
          postCount={posts.length}
          onUpdated={() => {}} // No updates allowed
        />

        <div className="mt-4 space-y-4">
          {posts.length > 0 ? (
            posts.map(p => (
              <PostItem key={p.id} post={p} userDetails={userDetails} />
            ))
          ) : (
            <p className="text-center opacity-75">This user hasn't posted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetailPage;
