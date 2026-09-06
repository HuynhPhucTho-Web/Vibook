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
import { FaCheck, FaTimes, FaUser, FaSearch } from "react-icons/fa";
import { useSearch } from "../../context/SearchContext";

const FriendRequests = ({ currentUser }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { debouncedKeyword: searchTerm = "" } = useSearch();

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

        await setDoc(friendshipRef, {
          participants: [fromUserId, toUserId],
          status: "accepted",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

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
      <div className="friends-page__empty">
        <p className="mb-0">You have no pending friend requests.</p>
      </div>
    );
  }

  const filteredIncomingRequests = incomingRequests.filter((req) => {
    if (!searchTerm) return true;
    const name = (req.fromUserName || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search);
  });

  const filteredSentRequests = sentRequests.filter((req) => {
    if (!searchTerm) return true;
    const name = (req.toUserName || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search);
  });

  const hasNoFilteredResults = filteredIncomingRequests.length === 0 && filteredSentRequests.length === 0;

  return (
    <div className="friend-requests">
      {hasNoFilteredResults ? (
        <div className="friends-page__empty">
          <p className="mb-0">No requests match “{searchTerm}”.</p>
        </div>
      ) : (
        <>
          {filteredIncomingRequests.length > 0 && (
            <div className="mb-4">
              <h5 className="friends-page__section-title">Friend Requests ({incomingRequests.length})</h5>
              <div className="friend-card-grid">
                {filteredIncomingRequests.map((req) => (
                  <div key={req.id} className="friend-card">
                    <div className="friend-card__body">
                      <div className="friend-card__header">
                        <div className="friend-card__avatar">
                          {req.fromUserPhoto ? (
                            <img src={req.fromUserPhoto} alt={req.fromUserName || "User"} />
                          ) : (
                            <FaUser />
                          )}
                        </div>
                        <div className="friend-card__meta">
                          <div className="friend-card__name">{req.fromUserName || "Unknown User"}</div>
                          <div className="friend-card__subtitle">sent you a friend request</div>
                        </div>
                      </div>

                      <div className="friend-card__footer">
                        <span className="friend-card__pill">Pending</span>
                        <div className="friend-card__actions">
                          <button
                            type="button"
                            className="vb-btn vb-btn--primary vb-btn--sm"
                            disabled={processingId === req.id}
                            onClick={() => handleRespond(req, "accept")}
                          >
                            <FaCheck />
                            Accept
                          </button>
                          <button
                            type="button"
                            className="vb-btn vb-btn--ghost vb-btn--sm"
                            disabled={processingId === req.id}
                            onClick={() => handleRespond(req, "decline")}
                          >
                            <FaTimes />
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredSentRequests.length > 0 && (
            <div>
              <h5 className="friends-page__section-title">Sent Requests ({sentRequests.length})</h5>
              <div className="friend-card-grid">
                {filteredSentRequests.map((req) => (
                  <div key={req.id} className="friend-card">
                    <div className="friend-card__body">
                      <div className="friend-card__header">
                        <div className="friend-card__avatar">
                          {req.toUserPhoto ? (
                            <img src={req.toUserPhoto} alt={req.toUserName || "User"} />
                          ) : (
                            <FaUser />
                          )}
                        </div>
                        <div className="friend-card__meta">
                          <div className="friend-card__name">{req.toUserName || "Unknown User"}</div>
                          <div className="friend-card__subtitle">request sent</div>
                        </div>
                      </div>

                      <div className="friend-card__footer">
                        <span className="friend-card__pill">Pending</span>
                        <button
                          type="button"
                          className="vb-btn vb-btn--ghost vb-btn--sm"
                          disabled={processingId === req.id}
                          onClick={() => handleCancel(req)}
                        >
                          <FaTimes />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FriendRequests;
