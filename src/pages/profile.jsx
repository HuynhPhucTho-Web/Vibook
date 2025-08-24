import React, { useEffect, useState, useContext, useCallback } from "react";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, query, collection, where, getDocs } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";
import UpdateProfile from "../components/UpdateProfile";

function Profile() {
  const { themes, theme } = useContext(ThemeContext);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  
  const fetchUserData = useCallback((user) => {
    if (!user) {
      setUserDetails(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "Users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserDetails(docSnap.data());
      } else {
        toast.error("User data not found");
      }
      setLoading(false);
    });

    const postsQuery = query(collection(db, "Posts"), where("userId", "==", user.uid));
    const unsubscribePosts = onSnapshot(postsQuery, async (querySnapshot) => {
      const userPosts = await Promise.all(
        querySnapshot.docs.map(async (postDoc) => {
          const postData = { id: postDoc.id, ...postDoc.data() };
          const commentsQuery = query(collection(db, "Posts", postDoc.id, "comments"));
          const commentsSnapshot = await getDocs(commentsQuery);
          const comments = commentsSnapshot.docs.map((c) => ({ id: c.id, ...c.data() }));
          return { ...postData, comments };
        })
      );
      setPosts(userPosts.sort((a, b) => b.createdAt - a.createdAt));
    });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) fetchUserData(user);
      else setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [fetchUserData]);

  if (loading) return <p>Loading...</p>;
  if (!userDetails) return <p>Please login to see profile</p>;

  return (
    <div className={`min-vh-100 ${themes[theme]}`}>
      <div className="container py-4">
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            
            <UpdateProfile
              userDetails={userDetails}
              onUpdated={(updated) => setUserDetails((prev) => ({ ...prev, ...updated }))}
            />
          </div>
        </div>

        
        <PostCreator onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])} />

        
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostItem key={post.id} post={post} auth={auth} userDetails={userDetails} />
          ))
        ) : (
          <p className="text-center">No posts yet</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
