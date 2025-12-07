import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../components/firebase";
import { toast } from "react-toastify";
import { FaCheck, FaTimes } from "react-icons/fa";

const FriendRequests = ({ currentUser, theme }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Load incoming friend requests (toUserId = currentUser.uid, status = pending)
  useEffect(() => {
    if (!currentUser) return;

    const incomingQuery = query(
      collection(db, "FriendRequests"),
      where("toUserId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribeIncoming = onSnapshot(
      incomingQuery,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setIncomingRequests(list);
      },
      (error) => {
        console.error("Error loading incoming friend requests:", error);
        toast.error("Failed to load incoming friend requests.");
      }
    );

    // Load sent friend requests (fromUserId = currentUser.uid, status = pending)
    const sentQuery = query(
      collection(db, "FriendRequests"),
      where("fromUserId", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribeSent = onSnapshot(
      sentQuery,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSentRequests(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading sent friend requests:", error);
        toast.error("Failed to load sent friend requests.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeIncoming();
      unsubscribeSent();
    };
  }, [currentUser]);

  const createChatId = (uid1, uid2) => {
    const sorted = [uid1, uid2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  };

  const handleRespond = async (request, action) => {
    if (!currentUser) return;

    setProcessingId(request.id);

    try {
      const requestRef = doc(db, "FriendRequests", request.id);

      if (action === "accept") {
        const fromUserId = request.fromUserId;
        const toUserId = request.toUserId;

        const chatId = createChatId(fromUserId, toUserId);
        const friendshipRef = doc(db, "Friendships", chatId);

        // Tạo Friendship (status = accepted)
        await setDoc(friendshipRef, {
          participants: [fromUserId, toUserId],
          status: "accepted",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Cập nhật request → accepted
        await updateDoc(requestRef, {
          status: "accepted",
          updatedAt: serverTimestamp(),
        });

        toast.success(`You are now friends with ${request.fromUserName || "this user"}!`);
      } else if (action === "decline") {
        await updateDoc(requestRef, {
          status: "rejected",
          updatedAt: serverTimestamp(),
        });
        toast.info("Friend request declined.");
      }
    } catch (error) {
      console.error("Error responding to friend request:", error);
      toast.error("Failed to process friend request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (request) => {
    if (!currentUser) return;

    if (!window.confirm(`Cancel friend request to ${request.toUserName}?`)) {
      return;
    }

    setProcessingId(request.id);

    try {
      const requestRef = doc(db, "FriendRequests", request.id);
      await deleteDoc(requestRef);
      toast.info("Friend request cancelled.");
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      toast.error("Failed to cancel friend request.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-4">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const hasNoRequests = incomingRequests.length === 0 && sentRequests.length === 0;

  if (hasNoRequests) {
    return (
      <div className="text-center py-5">
        <p className="text-muted mb-0">You have no pending friend requests.</p>
      </div>
    );
  }

  return (
    <div className="friend-requests">
      {/* Incoming Friend Requests */}
      {incomingRequests.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3">Friend Requests ({incomingRequests.length})</h5>
          <div className="row">
            {incomingRequests.map((req) => (
              <div key={req.id} className="col-md-6 col-lg-4 mb-3">
                <div
                  className={`card ${
                    theme === "light" ? "bg-light" : "bg-dark text-white"
                  }`}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={req.fromUserPhoto || "/default-avatar.png"}
                        alt={req.fromUserName || "User"}
                        className="rounded-circle me-3"
                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      />
                      <div>
                        <h6 className="card-title mb-0">
                          {req.fromUserName || "Unknown User"}
                        </h6>
                        <small className="text-muted">
                          sent you a friend request
                        </small>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Pending</small>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          disabled={processingId === req.id}
                          onClick={() => handleRespond(req, "accept")}
                        >
                          <FaCheck className="me-1" />
                          Accept
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={processingId === req.id}
                          onClick={() => handleRespond(req, "decline")}
                        >
                          <FaTimes className="me-1" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Friend Requests */}
      {sentRequests.length > 0 && (
        <div>
          <h5 className="mb-3">Sent Requests ({sentRequests.length})</h5>
          <div className="row">
            {sentRequests.map((req) => (
              <div key={req.id} className="col-md-6 col-lg-4 mb-3">
                <div
                  className={`card ${
                    theme === "light" ? "bg-light" : "bg-dark text-white"
                  }`}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={req.toUserPhoto || "/default-avatar.png"}
                        alt={req.toUserName || "User"}
                        className="rounded-circle me-3"
                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      />
                      <div>
                        <h6 className="card-title mb-0">
                          {req.toUserName || "Unknown User"}
                        </h6>
                        <small className="text-muted">
                          Request sent
                        </small>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Pending</small>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={processingId === req.id}
                        onClick={() => handleCancel(req)}
                      >
                        <FaTimes className="me-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendRequests;
