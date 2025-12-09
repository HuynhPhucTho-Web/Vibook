import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../components/firebase";
import { toast } from "react-toastify";
import { FaComments, FaUserMinus, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FriendsList = ({ currentUser, theme }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  // Load friendships + thông tin user của bạn bè
  useEffect(() => {
    if (!currentUser) return;

    const friendshipsQuery = query(
      collection(db, "Friendships"),
      where("participants", "array-contains", currentUser.uid),
      where("status", "==", "accepted")
    );

    const unsubscribe = onSnapshot(
      friendshipsQuery,
      async (snapshot) => {
        try {
          const friendPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const participants = data.participants || [];
            const friendId = participants.find((id) => id !== currentUser.uid);
            if (!friendId) return null;

            const userRef = doc(db, "Users", friendId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return null;

            const userData = userSnap.data();
            return {
              uid: friendId,
              friendshipId: docSnap.id,
              displayName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User",
              ...userData,
            };
          });

          const friendsData = (await Promise.all(friendPromises)).filter(Boolean);
          setFriends(friendsData);
          setLoading(false);
        } catch (error) {
          console.error("Error loading friends:", error);
          toast.error("Failed to load friends.");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to friendships:", error);
        toast.error("Failed to load friends.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleUnfriend = async (friend) => {
    if (!friend.friendshipId || !currentUser) return;

    if (!window.confirm(`Remove ${friend.displayName || "this user"} from your friends?`)) {
      return;
    }

    setProcessingId(friend.friendshipId);

    try {
      const friendshipRef = doc(db, "Friendships", friend.friendshipId);
      await deleteDoc(friendshipRef);
      toast.info("Friend removed.");
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMessage = () => {
    if (!currentUser) return;
    // Điều hướng tới trang Messenger
    navigate('/messenger');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!friends.length) {
    return (
      <div className="text-center py-5">
        <p className="text-muted mb-0">
          You have no friends yet. Try sending some friend requests!
        </p>
      </div>
    );
  }

  return (
    <div className="friends-list">
      <div className="row">
        {friends.map((friend) => (
          <div key={friend.uid} className="col-md-6 col-lg-4 mb-3">
            <div
              className={`card ${
                theme === "light" ? "bg-light" : "bg-dark text-white"
              }`}
            >
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={friend.photo || "/default-avatar.png"}
                    alt={friend.displayName || "User"}
                    className="rounded-circle me-3"
                    style={{ width: "50px", height: "50px", objectFit: "cover" }}
                  />
                  <div>
                    <h6 className="card-title mb-0">
                      {friend.displayName || "Unknown User"}
                    </h6>
                    {/* <small className="text-muted">{friend.email}</small> */}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Friend</small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleMessage(friend)}
                    >
                      <FaComments className="me-1" />
                      Message
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      disabled={processingId === friend.friendshipId}
                      onClick={() => handleUnfriend(friend)}
                    >
                      <FaUserMinus className="me-1" />
                      Unfriend
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;
