import React, { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { FaSignOutAlt } from "react-icons/fa";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";
import VideoCarousel from "../components/VideoCarousel";
import "../style/Home.css";

function Home() {
  const { theme } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data and posts
  useEffect(() => {
    const postId = searchParams.get('postId');
    let unsubscribe = () => {};

    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const userRef = doc(db, "Users", user.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserDetails(docSnap.data());
          } else {
            toast.error("User data not found");
            setUserDetails(null);
          }
        });

        // If a specific post is requested, fetch only that one
        if (postId) {
          const postRef = doc(db, "Posts", postId);
          const unsubPost = onSnapshot(postRef, async (docSnap) => {
            if (docSnap.exists()) {
              const postData = { id: docSnap.id, ...docSnap.data() };
              const commentsQuery = query(collection(db, "Posts", postId, "comments"));
              const commentsSnapshot = await getDocs(commentsQuery);
              postData.comments = commentsSnapshot.docs.map(c => ({ id: c.id, ...c.data() }));
              setPosts([postData]);
            } else {
              toast.error("Post not found");
              setPosts([]);
            }
            setIsLoading(false);
          });
          unsubscribe = () => unsubPost();
        } else {
          // Otherwise, fetch the general feed
          const postsQuery = query(collection(db, "Posts"), orderBy("createdAt", "desc"), limit(20));
          const unsubPosts = onSnapshot(postsQuery, async (snapshot) => {
            const allPosts = await Promise.all(
              snapshot.docs.map(async (doc) => {
                const postData = { id: doc.id, ...doc.data() };
                // We don't need to fetch all comments for the entire feed, PostItem can do it.
                postData.comments = []; 
                return postData;
              })
            );
            setPosts(allPosts);
            setIsLoading(false);
          });
          unsubscribe = () => unsubPosts();
        }
      } else {
        setUserDetails(null);
        setPosts([]);
        setIsLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, [searchParams]);

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

  // Scroll to post when postId parameter is present
  useEffect(() => {
    const postId = searchParams.get('postId');
    if (postId && posts.length > 0) {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Clean up URL after scrolling
        setTimeout(() => {
          const url = new URL(window.location);
          url.searchParams.delete('postId');
          window.history.replaceState({}, '', url);
        }, 1000);
      }
    }
  }, [posts, searchParams]);

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
    <div className="home-container">
      <div className="mb-4">
        <VideoCarousel theme={theme} />
      </div>
      <PostCreator onPostCreated={handlePostCreated} />
      <div className="posts-list">
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