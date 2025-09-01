import React, { useEffect, useState, useContext, useCallback } from "react";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, query, collection, where, getDocs } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";
import UpdateProfile from "../components/UpdateProfile";

function Profile() {
  const { theme } = useContext(ThemeContext);
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
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="container-fluid mx-auto py-4">
        {/* Card thông tin user */}
        <div
          className={`rounded-2xl shadow-md mb-4 transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          }`}
        >
          <div className="p-4">
            <UpdateProfile
              userDetails={userDetails}
              onUpdated={(updated) =>
                setUserDetails((prev) => ({ ...prev, ...updated }))
              }
            />
          </div>
        </div>

        {/* Form tạo post */}
        <PostCreator
          onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
        />

        {/* Danh sách post */}
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              auth={auth}
              userDetails={userDetails}
            />
          ))
        ) : (
          <p className="text-center mt-4">No posts yet</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
