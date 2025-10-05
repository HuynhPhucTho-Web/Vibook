import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, query, collection, where, getDocs } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";
import ProfileHeader from "../components/UpdateProfile";

function Profile() {
  const { theme } = useContext(ThemeContext);
  const { uid: routeUid } = useParams();
  const [currentUid, setCurrentUid] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setCurrentUid(u?.uid || null));
    return () => unsub();
  }, []);

  const fetchUserData = useCallback((targetUid) => {
    if (!targetUid) { setLoading(false); return; }

    const unsubUser = onSnapshot(doc(db, "Users", targetUid), (snap) => {
      if (snap.exists()) setUserDetails({ id: targetUid, ...snap.data() });
      else toast.error("User not found");
      setLoading(false);
    });

    const q = query(collection(db, "Posts"), where("userId", "==", targetUid));
    const unsubPosts = onSnapshot(q, async (qs) => {
      const arr = await Promise.all(qs.docs.map(async (d) => {
        const p = { id: d.id, ...d.data() };
        const cs = await getDocs(collection(db, "Posts", d.id, "comments"));
        return { ...p, comments: cs.docs.map(c => ({ id: c.id, ...c.data() })) };
      }));
      arr.sort((a,b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt || 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt || 0;
        return tb - ta;
      });
      setPosts(arr);
    });

    return () => { unsubUser(); unsubPosts(); };
  }, []);

  useEffect(() => {
    const target = routeUid || auth.currentUser?.uid || null;
    const cleanup = fetchUserData(target);
    return () => cleanup && cleanup();
  }, [routeUid, fetchUserData]);

  if (loading) return <p>Loading...</p>;
  if (!userDetails) return <p>User not found</p>;

  const isOwner = currentUid && userDetails.id === currentUid;

  return (
    <div className={`min-h-screen transition-colors ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <div className="container-fluid mx-auto py-4 ">
        <ProfileHeader
          user={userDetails}
          isOwner={isOwner}
          postCount={posts.length}
          onUpdated={(partial) => setUserDetails(prev => ({ ...prev, ...partial }))}
        />

        {isOwner && (
          <div className="mt-4">
            <PostCreator onPostCreated={(p) => setPosts(prev => [p, ...prev])} />
          </div>
        )}

        <div className="mt-4 space-y-4">
          {posts.length ? posts.map(p => (
            <PostItem key={p.id} post={p} auth={auth} userDetails={userDetails} />
          )) : (
            <p className="text-center opacity-75">{isOwner ? "You haven't posted yet" : "No posts yet"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
