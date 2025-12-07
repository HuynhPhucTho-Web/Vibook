// src/components/friends/FindFriends.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../components/firebase";
import { FaUserPlus, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

const FindFriends = ({ currentUser, theme }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [friends, setFriends] = useState(new Set());
  const [showAll, setShowAll] = useState(false);

  // Load all users (chỉ những người cho phép tìm – isPublic == true)
  useEffect(() => {
    if (!currentUser) return;

    const usersQuery = query(
      collection(db, "Users"),
      orderBy("firstName"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const allUsers = snapshot.docs
          .map((docSnap) => ({
            uid: docSnap.id,
            ...docSnap.data(),
          }))
          .filter((user) => user.uid !== currentUser.uid);

        setUsers(allUsers);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading users:", error);
        toast.error("Không tải được danh sách người dùng (kiểm tra Firestore rules).");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Load sent friend requests
  useEffect(() => {
    if (!currentUser) return;

    const requestsQuery = query(
      collection(db, "FriendRequests"),
      where("fromUserId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const sent = new Set(snapshot.docs.map((doc) => doc.data().toUserId));
        setSentRequests(sent);
      },
      (error) => {
        console.error("Error loading sent requests:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Load friends
  useEffect(() => {
    if (!currentUser) return;

    const friendshipsQuery = query(
      collection(db, "Friendships"),
      where("participants", "array-contains", currentUser.uid),
      where("status", "==", "accepted")
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
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleSendRequest = async (toUserId, toUserName) => {
    try {
      const targetUser = users.find((u) => u.uid === toUserId);

      await addDoc(collection(db, "FriendRequests"), {
        fromUserId: currentUser.uid,
        fromUserName: `${currentUser.displayName || currentUser.email}`,
        fromUserPhoto: currentUser.photoURL || null,
        toUserId,
        toUserName,
        toUserPhoto: targetUser?.photo || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success(`Friend request sent to ${toUserName}!`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    // Split search term into words and check if all words match (case insensitive)
    const searchWords = search.split(/\s+/).filter(word => word.length > 0);
    const nameWords = fullName.split(/\s+/).filter(word => word.length > 0);

    // Check if all search words are found in either name or email
    const matchesName = searchWords.every(searchWord =>
      nameWords.some(nameWord => nameWord.includes(searchWord)) ||
      fullName.includes(searchWord)
    );
    const matchesEmail = searchWords.every(searchWord => email.includes(searchWord));

    return matchesName || matchesEmail;
  });

  // Show only 10 users initially, or all if showAll is true
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
      {/* Search Bar */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text">
            <FaSearch />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users List */}
      <div className="row">
        {displayedUsers.map((user) => {
          const isFriend = friends.has(user.uid);
          const hasSentRequest = sentRequests.has(user.uid);

          return (
            <div key={user.uid} className="col-md-6 col-lg-4 mb-3">
              <div
                className={`card ${
                  theme === "light" ? "bg-light" : "bg-dark text-white"
                }`}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={user.photo || "/default-avatar.png"}
                      alt={`${user.firstName || ""} ${user.lastName || ""}`}
                      className="rounded-circle me-3"
                      style={{ width: "50px", height: "50px", objectFit: "cover" }}
                    />
                    <div>
                      <h6 className="card-title mb-0">
                        {user.firstName} {user.lastName}
                      </h6>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {isFriend
                        ? "Already friends"
                        : hasSentRequest
                        ? "Request sent"
                        : ""}
                    </small>
                    {!isFriend && !hasSentRequest && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleSendRequest(
                            user.uid,
                            `${user.firstName} ${user.lastName}`
                          )
                        }
                      >
                        <FaUserPlus className="me-1" />
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* See More Button */}
      {hasMoreUsers && !showAll && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowAll(true)}
          >
            See More ({filteredUsers.length - 10} more users)
          </button>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted">
            {searchTerm
              ? `No users found matching "${searchTerm}"`
              : "No users available to add."}
          </p>
        </div>
      )}
    </div>
  );
};

export default FindFriends;
