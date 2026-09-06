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
import { FaComments, FaUserMinus, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

const FriendsList = ({ currentUser }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { debouncedKeyword: searchTerm = "" } = useSearch();
  const navigate = useNavigate();

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
    navigate("/messenger");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const filteredFriends = friends.filter((friend) => {
    if (!searchTerm) return true;
    const fullName = (friend.displayName || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search);
  });

  if (!friends.length) {
    return (
      <div className="friends-page__empty">
        <p className="mb-0">You have no friends yet. Try sending some friend requests!</p>
      </div>
    );
  }

  return (
    <div className="friends-list">
      {filteredFriends.length === 0 ? (
        <div className="friends-page__empty">
          <p className="mb-0">No friends match “{searchTerm}”.</p>
        </div>
      ) : (
        <div className="friend-card-grid">
          {filteredFriends.map((friend) => (
            <div key={friend.uid} className="friend-card">
              <div className="friend-card__body">
                <div className="friend-card__header">
                  <div className="friend-card__avatar">
                    {friend.photo ? (
                      <img
                        src={getOptimizedCloudinaryUrl(friend.photo, 120)}
                        alt={friend.displayName || "User"}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span>{(friend.displayName || "U").charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="friend-card__meta">
                    <div className="friend-card__name">
                      {friend.displayName || "Unknown User"}
                    </div>
                    <div className="friend-card__subtitle">Friend</div>
                  </div>
                </div>

                <div className="friend-card__footer">
                  <span className="friend-card__pill">Connected</span>
                  <div className="friend-card__actions">
                    <button
                      type="button"
                      className="vb-btn vb-btn--primary vb-btn--sm"
                      onClick={() => handleMessage(friend)}
                    >
                      <FaComments />
                      Message
                    </button>
                    <button
                      type="button"
                      className="vb-btn vb-btn--ghost vb-btn--sm"
                      disabled={processingId === friend.friendshipId}
                      onClick={() => handleUnfriend(friend)}
                    >
                      <FaUserMinus />
                      Unfriend
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsList;
