// src/components/friends/FindFriends.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  where,
  orderBy,
  limit,
  doc,
} from "firebase/firestore";
import { db } from "../../components/firebase";
import { FaUserPlus, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import { requireLogin } from "../../utils/requireLogin";
import { useSearch } from "../../context/SearchContext";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";

const FindFriends = ({ currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const { debouncedKeyword: searchTerm = "" } = useSearch();
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [friends, setFriends] = useState(new Set());
  const [showAll, setShowAll] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setCurrentUserProfile(null);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      doc(db, "Users", currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setCurrentUserProfile(docSnap.data());
        }
      },
      (error) => {
        console.error("Error loading current user profile:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const usersQuery = query(
      collection(db, "Users"),
      orderBy("firstName"),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const allUsers = snapshot.docs
          .map((docSnap) => ({
            uid: docSnap.id,
            ...docSnap.data(),
          }))
          .filter((user) => !currentUser || user.uid !== currentUser.uid);

        setUsers(allUsers);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading users:", error);
        toast.error("Không tải được danh sách người dùng (kiểm tra Firestore rules).");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setSentRequests(new Set());
      return undefined;
    }

    const requestsQuery = query(
      collection(db, "FriendRequests"),
      where("fromUserId", "==", currentUser.uid),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const sent = new Set(snapshot.docs.map((doc) => doc.data().toUserId));
        setSentRequests(sent);
      },
      (error) => {
        console.error("Error loading sent requests:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setFriends(new Set());
      return undefined;
    }

    const friendshipsQuery = query(
      collection(db, "Friendships"),
      where("participants", "array-contains", currentUser.uid),
      where("status", "==", "accepted"),
    );

    const unsubscribe = onSnapshot(
      friendshipsQuery,
      (snapshot) => {
        const friendIds = new Set();
        snapshot.docs.forEach((docSnap) => {
          const participants = docSnap.data().participants || [];
          const friendId = participants.find((id) => id !== currentUser.uid);
          if (friendId) friendIds.add(friendId);
        });
        setFriends(friendIds);
      },
      (error) => {
        console.error("Error loading friendships:", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleSendRequest = async (toUserId, toUserName) => {
    const activeUser = requireLogin({
      navigate,
      message: "Đăng nhập để gửi lời mời kết bạn",
      from: "/friends",
    });
    if (!activeUser) return;

    if (sendingId) return;
    setSendingId(toUserId);

    try {
      const targetUser = users.find((u) => u.uid === toUserId);

      const senderFullName = currentUserProfile
        ? `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || ""}`.trim()
        : "";
      const senderName =
        senderFullName ||
        activeUser.displayName ||
        activeUser.email ||
        "Unknown User";
      const senderPhoto = currentUserProfile?.photo || activeUser.photoURL || null;

      await addDoc(collection(db, "FriendRequests"), {
        fromUserId: activeUser.uid,
        fromUserName: senderName,
        fromUserPhoto: senderPhoto,
        toUserId,
        toUserName,
        toUserPhoto: targetUser?.photo || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSentRequests((prev) => new Set([...prev, toUserId]));
      toast.success(`Friend request sent to ${toUserName}!`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.");
    } finally {
      setSendingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const searchWords = search.split(/\s+/).filter((word) => word.length > 0);
    const nameWords = fullName.split(/\s+/).filter((word) => word.length > 0);

    const matchesName = searchWords.every(
      (searchWord) =>
        nameWords.some((nameWord) => nameWord.includes(searchWord)) ||
        fullName.includes(searchWord),
    );
    const matchesEmail = searchWords.every((searchWord) => email.includes(searchWord));

    return matchesName || matchesEmail;
  });

  const displayedUsers = showAll ? filteredUsers : filteredUsers.slice(0, 10);
  const hasMoreUsers = filteredUsers.length > 10;

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="find-friends">
      {filteredUsers.length === 0 ? (
        <div className="friends-page__empty">
          <p className="mb-0">
            {searchTerm ? `No users found matching "${searchTerm}"` : "No users available to add."}
          </p>
        </div>
      ) : (
        <div className="friend-card-grid">
          {displayedUsers.map((user) => {
            const isFriend = friends.has(user.uid);
            const hasSentRequest = sentRequests.has(user.uid);
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";

            // Mask PII for guests to protect privacy
            const displayPhoto = currentUser ? user.photo : null;
            const displayFullName = currentUser ? fullName : "Người dùng ThoDev";

            return (
              <div key={user.uid} className="friend-card">
                <div className="friend-card__body">
                  <div className="friend-card__header">
                    <div className="friend-card__avatar">
                      {displayPhoto ? (
                        <img
                          src={getOptimizedCloudinaryUrl(displayPhoto, 120)}
                          alt={`Avatar của ${displayFullName}`}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <div className="friend-card__meta">
                      <div className="friend-card__name">{displayFullName}</div>
                      <div className="friend-card__subtitle">
                        {isFriend ? "Already friends" : hasSentRequest ? "Request sent" : "Discover"}
                      </div>
                    </div>
                  </div>

                  <div className="friend-card__footer">
                    <span className="friend-card__pill">
                      {isFriend ? "Connected" : hasSentRequest ? "Pending" : "New"}
                    </span>
                    {!isFriend && !hasSentRequest && (
                      <button
                        type="button"
                        className="vb-btn vb-btn--primary vb-btn--sm"
                        disabled={sendingId === user.uid}
                        onClick={() =>
                          handleSendRequest(user.uid, fullName)
                        }
                      >
                        <FaUserPlus />
                        {sendingId === user.uid ? "Sending..." : "Add Friend"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMoreUsers && !showAll && (
        <div className="text-center mt-4">
          <button
            type="button"
            className="vb-btn vb-btn--ghost"
            onClick={() => setShowAll(true)}
          >
            See More ({filteredUsers.length - 10} more users)
          </button>
        </div>
      )}
    </div>
  );
};

export default FindFriends;
