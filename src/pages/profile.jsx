import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, query, collection, where, getDocs, addDoc } from "firebase/firestore";
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
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setCurrentUid(u?.uid || null));
    return () => unsub();
  }, []);

  const isOwner = currentUid && userDetails && userDetails.id === currentUid;

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

  // Check if current user and viewed user are friends
  useEffect(() => {
    if (!currentUid || !userDetails || isOwner) return;

    const friendshipsQuery = query(
      collection(db, "Friendships"),
      where("participants", "array-contains", currentUid),
      where("status", "==", "accepted")
    );

    const unsubscribe = onSnapshot(
      friendshipsQuery,
      (snapshot) => {
        const isFriend = snapshot.docs.some((docSnap) => {
          const participants = docSnap.data().participants || [];
          return participants.includes(userDetails.id);
        });
        setIsFriend(isFriend);
      },
      (error) => {
        console.error("Error checking friendship:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUid, userDetails, isOwner]);

  // Check if current user has sent a friend request to viewed user
  useEffect(() => {
    if (!currentUid || !userDetails || isOwner) return;

    const requestsQuery = query(
      collection(db, "FriendRequests"),
      where("fromUserId", "==", currentUid),
      where("toUserId", "==", userDetails.id),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        setHasSentRequest(snapshot.docs.length > 0);
      },
      (error) => {
        console.error("Error checking sent requests:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUid, userDetails, isOwner]);

  const handleSendRequest = async () => {
    if (!currentUid || !userDetails) return;

    try {
      await addDoc(collection(db, "FriendRequests"), {
        fromUserId: currentUid,
        fromUserName: `${auth.currentUser.displayName || auth.currentUser.email}`,
        fromUserPhoto: auth.currentUser.photoURL || null,
        toUserId: userDetails.id,
        toUserName: `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim() || userDetails.email,
        toUserPhoto: userDetails.photo || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success(`Friend request sent to ${userDetails.firstName || userDetails.lastName || userDetails.email}!`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.");
    }
  };

  useEffect(() => {
    const target = routeUid || auth.currentUser?.uid || null;
    const cleanup = fetchUserData(target);
    return () => cleanup && cleanup();
  }, [routeUid, fetchUserData]);

  if (loading) return <p>Loading...</p>;
  if (!userDetails) return <p>User not found</p>;

  return (
    <div className={`min-h-screen transition-colors ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <div className="container-fluid mx-auto py-4 ">
        <ProfileHeader
          user={userDetails}
          isOwner={isOwner}
          postCount={posts.length}
          isFriend={isFriend}
          hasSentRequest={hasSentRequest}
          onSendRequest={handleSendRequest}
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
