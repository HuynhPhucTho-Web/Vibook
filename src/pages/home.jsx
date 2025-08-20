import React, { useEffect, useState, useContext } from "react";
import { auth, db } from "../components/firebase";
import { doc, getDoc, onSnapshot, collection, query, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { FaSignOutAlt } from "react-icons/fa";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";

function Home() {
  const { theme } = useContext(ThemeContext);
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data and posts with real-time updates
  useEffect(() => {
    let unsubscribeAuth, unsubscribePosts, unsubscribeUser;

    const fetchData = async () => {
      try {
        // Listen to auth state
        unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
          console.log(
            `[${new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}] Auth state changed:`,
            user ? "Logged in" : "Logged out"
          );
          if (user) {
            // Real-time listener for user data
            const userRef = doc(db, "Users", user.uid);
            unsubscribeUser = onSnapshot(userRef, (docSnap) => {
              if (docSnap.exists()) {
                setUserDetails(docSnap.data());
              } else {
                toast.error("User data not found", { position: "top-center" });
                setUserDetails(null);
              }
            });

            // Fetch posts initially
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

            // Real-time listener for posts
            unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
              const updatedPosts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                comments: [], // Comments are handled in PostItem
              }));
              setPosts(updatedPosts.sort((a, b) => b.createdAt - a.createdAt));
            });
          } else {
            setUserDetails(null);
            setPosts([]);
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data", { position: "top-center" });
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubscribeAuth && unsubscribeAuth();
      unsubscribeUser && unsubscribeUser();
      unsubscribePosts && unsubscribePosts();
    };
  }, []);

  // Handle new post from PostCreator
  const handlePostCreated = async (postData) => {
    console.log(
      `[${new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}] New post received:`,
      postData
    );
    setPosts((prevPosts) => [postData, ...prevPosts.sort((a, b) => b.createdAt - a.createdAt)]);
  };

  // Handle post deletion
  const handlePostDeleted = (postId) => {
    console.log(
      `[${new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}] Post deleted:`,
      postId
    );
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  if (isLoading) {
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
      <div className="text-center py-5">
        <h5 className="text-muted">Please log in to view content</h5>
      </div>
    );
  }

  return (
    <div className="container">
      <PostCreator onPostCreated={handlePostCreated} />
      {/* Posts Feed */}
      <div>
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              auth={auth}
              userDetails={userDetails}
              onPostDeleted={handlePostDeleted}
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
  );
}

export default Home;