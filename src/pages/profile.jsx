import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, query, collection, where, getDoc, addDoc, deleteDoc, setDoc } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { toast } from "react-toastify";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";
import ProfileHeader from "../components/profile/UpdateProfile";
import ProfileStories from "../components/profile/ProfileStories";
import { requireLogin } from "../utils/requireLogin";


function Profile() {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const { uid: routeUid } = useParams();
  const [currentUid, setCurrentUid] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activePostTab, setActivePostTab] = useState("posts");
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setCurrentUid(u?.uid || null));
    return () => unsub();
  }, []);

  const isOwner = currentUid && userDetails && userDetails.id === currentUid;

  useEffect(() => {
    if (!isOwner || !currentUid) {
      setSavedPosts([]);
      if (activePostTab === "saved") setActivePostTab("posts");
      return undefined;
    }
    setSavedPostsLoading(true);
    const savedQuery = query(collection(db, "SavedPosts"), where("userId", "==", currentUid));
    return onSnapshot(savedQuery, async (snapshot) => {
      const resolved = await Promise.all(snapshot.docs.map(async (savedDocument) => {
        const savedData = savedDocument.data();
        const postSnapshot = await getDoc(doc(db, "Posts", savedData.postId));
        return postSnapshot.exists()
          ? { id: postSnapshot.id, ...postSnapshot.data(), savedAt: savedData.savedAt }
          : null;
      }));
      setSavedPosts(resolved.filter(Boolean).sort((a, b) => {
        const left = a.savedAt?.toMillis ? a.savedAt.toMillis() : 0;
        const right = b.savedAt?.toMillis ? b.savedAt.toMillis() : 0;
        return right - left;
      }));
      setSavedPostsLoading(false);
    }, (error) => {
      console.error("Error loading saved posts", error);
      setSavedPostsLoading(false);
    });
  }, [activePostTab, currentUid, isOwner]);

  const fetchUserData = useCallback((targetUid) => {
    if (!targetUid) { setLoading(false); return; }

    const unsubUser = onSnapshot(doc(db, "Users", targetUid), (snap) => {
      if (snap.exists()) setUserDetails({ id: targetUid, ...snap.data() });
      else toast.error(t("userNotFound"));
      setLoading(false);
    });

    const q = query(collection(db, "Posts"), where("userId", "==", targetUid));
    const unsubPosts = onSnapshot(q, (qs) => {
      const arr = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
      arr.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt || 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt || 0;
        return tb - ta;
      });
      setPosts(arr);
    });

    return () => { unsubUser(); unsubPosts(); };
  }, [t]);

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

  // Fetch friend count for the viewed user
  useEffect(() => {
    if (!userDetails) return;

    const friendCountQuery = query(
      collection(db, "Friendships"),
      where("participants", "array-contains", userDetails.id),
      where("status", "==", "accepted")
    );

    const unsubscribe = onSnapshot(
      friendCountQuery,
      (snapshot) => {
        setFriendCount(snapshot.docs.length);
      },
      (error) => {
        console.error("Error fetching friend count:", error);
      }
    );

    return () => unsubscribe();
  }, [userDetails]);

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

  // Check if current user is following the viewed user
  useEffect(() => {
    if (!currentUid || !userDetails || isOwner) return;

    const followQuery = query(
      collection(db, "Follows"),
      where("fromUserId", "==", currentUid),
      where("toUserId", "==", userDetails.id)
    );

    const unsubscribe = onSnapshot(
      followQuery,
      (snapshot) => {
        setIsFollowing(snapshot.docs.length > 0);
      },
      (error) => {
        console.error("Error checking follow status:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUid, userDetails, isOwner]);

  // Fetch follower count for the viewed user
  useEffect(() => {
    if (!userDetails) return;

    const followerQuery = query(
      collection(db, "Follows"),
      where("toUserId", "==", userDetails.id)
    );

    const unsubscribe = onSnapshot(
      followerQuery,
      (snapshot) => {
        setFollowerCount(snapshot.docs.length);
      },
      (error) => {
        console.error("Error fetching follower count:", error);
      }
    );

    return () => unsubscribe();
  }, [userDetails]);

  const handleSendRequest = async () => {
    if (!userDetails) return;
    const user = requireLogin({ navigate, message: t("loginToAddFriend") });
    if (!user) return;
    const uid = user.uid;

    try {
      await addDoc(collection(db, "FriendRequests"), {
        fromUserId: uid,
        fromUserName: `${auth.currentUser.displayName || auth.currentUser.email}`,
        fromUserPhoto: auth.currentUser.photoURL || null,
        toUserId: userDetails.id,
        toUserName: `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim() || userDetails.email,
        toUserPhoto: userDetails.photo || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success(t("friendRequestSentTo", { name: userDetails.firstName || userDetails.lastName || userDetails.email }));
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error(t("failedToSendFriendRequest"));
    }
  };

  const handleFollow = async () => {
    if (!userDetails) return;
    const user = requireLogin({ navigate, message: t("loginToFollow") });
    if (!user) return;
    const uid = user.uid;

    try {
      const followDocId = `${uid}_${userDetails.id}`;
      const followDocRef = doc(db, "Follows", followDocId);

      if (isFollowing) {
        // Unfollow: delete the follow document
        await deleteDoc(followDocRef);
        toast.success(t("unfollowed", { name: userDetails.firstName || userDetails.lastName || userDetails.email }));
      } else {
        // Follow: create a new follow document with specific ID
        await setDoc(followDocRef, {
          fromUserId: uid,
          toUserId: userDetails.id,
          createdAt: new Date(),
        });
        toast.success(t("followed", { name: userDetails.firstName || userDetails.lastName || userDetails.email }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(t("failedToToggleFollow"));
    }
  };

  useEffect(() => {
    const target = routeUid || auth.currentUser?.uid || null;
    const cleanup = fetchUserData(target);
    return () => cleanup && cleanup();
  }, [routeUid, fetchUserData]);

  if (loading) return <p>Loading...</p>;
  if (!userDetails) return <p>User not found</p>;

  const ownPosts = posts.filter((post) => post.type !== "share");
  const sharedPosts = posts.filter((post) => post.type === "share");
  const visiblePosts = activePostTab === "shared"
    ? sharedPosts
    : activePostTab === "saved"
      ? savedPosts
      : ownPosts;

  return (
    <div className={`min-h-screen transition-colors ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <div className="container-fluid mx-auto py-4 ">
        <ProfileHeader
          user={userDetails}
          isOwner={isOwner}
          postCount={posts.length}
          friendCount={friendCount}
          followerCount={followerCount}
          isFriend={isFriend}
          hasSentRequest={hasSentRequest}
          isFollowing={isFollowing}
          onSendRequest={handleSendRequest}
          onFollow={handleFollow}
          onUpdated={(partial) => setUserDetails(prev => ({ ...prev, ...partial }))}
        />

        {/* Story của đúng user đang xem */}
        <ProfileStories userId={userDetails.id} theme={theme} />


        {isOwner && (
          <div className="mt-4">
            <PostCreator onPostCreated={(p) => setPosts(prev => [p, ...prev])} />
          </div>
        )}

        <div className={`mt-4 flex gap-2 overflow-x-auto rounded-xl p-2 ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}>
          {[
            { id: "posts", label: `Bài viết (${ownPosts.length})` },
            { id: "shared", label: `Đã chia sẻ (${sharedPosts.length})` },
            ...(isOwner ? [{ id: "saved", label: `Đã lưu (${savedPosts.length})` }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePostTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activePostTab === tab.id ? "bg-blue-600 text-white" : theme === "dark" ? "text-gray-300 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {activePostTab === "saved" && savedPostsLoading ? (
            <p className="text-center opacity-75">Đang tải bài viết đã lưu...</p>
          ) : visiblePosts.length ? visiblePosts.map(p => (
            <PostItem key={p.id} post={p} auth={auth} userDetails={userDetails} isDetailView={true} />
          )) : (
            <p className="text-center opacity-75">
              {activePostTab === "saved" ? "Chưa có bài viết đã lưu" : activePostTab === "shared" ? "Chưa có bài viết đã chia sẻ" : isOwner ? t("youHaventPostedYet") : t("noPostsYet")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
