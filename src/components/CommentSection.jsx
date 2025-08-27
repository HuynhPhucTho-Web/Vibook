import React, { useState, useEffect, useContext } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { toast } from "react-toastify";
import {
  FaComment,
  FaThumbsUp,
  FaHeart,
  FaLaugh,
  FaSadTear,
  FaAngry,
  FaReply,
  FaEllipsisV,
  FaTimes
} from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext";
import { db } from "../components/firebase";

const REACTIONS = {
  like: { icon: FaThumbsUp, color: "#1877f2", label: "Like" },
  love: { icon: FaHeart, color: "#f33e58", label: "Love" },
  laugh: { icon: FaLaugh, color: "#f7b125", label: "Laugh" },
  sad: { icon: FaSadTear, color: "#f7b125", label: "Sad" },
  angry: { icon: FaAngry, color: "#e9710f", label: "Angry" }
};



const ReplyComment = ({ commentId, postId, auth, userDetails, setReplyTo, replyTo }) => {
  const [replyText, setReplyText] = useState("");

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyText.trim()) {
      toast.error("Reply cannot be left blank", { position: "top-center" });
      return;
    }

    if (!auth.currentUser) {
      toast.error("Please login to reply", { position: "top-center" });
      return;
    }

    try {
      const replyData = {
        userId: auth.currentUser.uid,
        userName: userDetails
          ? `${userDetails.firstName}${userDetails.lastName ? " " + userDetails.lastName : ""}`
          : auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "User",
        userPhoto: userDetails?.photo || auth.currentUser.photoURL || "https://via.placeholder.com/30",
        content: replyText.trim(),
        createdAt: serverTimestamp(),
        reactions: {},
        reactionCount: 0,
        replyCount: 0,
        parentCommentId: commentId
      };

      const repliesRef = collection(db, "Posts", postId, "comments", commentId, "replies");
      await addDoc(repliesRef, replyData);

      // Update reply count on parent comment
      const commentRef = doc(db, "Posts", postId, "comments", commentId);
      await updateDoc(commentRef, {
        replyCount: increment(1)
      });

      setReplyText("");
      setReplyTo(null);
      toast.success("💬 Reply added!", {
        position: "top-center",
        autoClose: 1000,
        style: { fontSize: '16px', fontWeight: '500' }
      });
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error(`Cannot add reply: ${error.message}`, { position: "top-center" });
    }
  };

  return (
    <form onSubmit={handleReplySubmit} className="mt-3 ms-2">
      <div className="d-flex gap-2 align-items-start">
        <img
          src={userDetails?.photo || auth.currentUser?.photoURL || "https://via.placeholder.com/30"}
          alt="Your avatar"
          className="rounded-circle flex-shrink-0"
          style={{ width: "30px", height: "30px", objectFit: "cover" }}
        />
        <div className="flex-grow-1 position-relative">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="form-control border-2"
            rows="2"
            style={{ resize: "none", borderRadius: '20px', paddingRight: '70px' }}
            autoFocus
          />
          <div className="position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
            <button
              type="button"
              className="btn btn-sm text-muted me-1"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm rounded-pill"
              disabled={!replyText.trim()}
              style={{ minWidth: '50px' }}
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

const CommentSection = ({ postId, auth, userDetails, isCommentSectionOpen, toggleCommentSection }) => {
  const { theme } = useContext(ThemeContext);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);


  const themeClasses = {
    card: theme === "dark" ? "bg-dark text-light border border-secondary" : "bg-light text-dark",
    bubble: theme === "dark" ? "bg-secondary text-light" : "bg-light text-dark",
    textMuted: theme === "dark" ? "text-gray-400" : "text-muted",
    textPrimary: theme === "dark" ? "text-info" : "text-primary",
    border: theme === "dark" ? "border-secondary" : "border-light",
  };
  // Real-time comments listener with replies
  useEffect(() => {
    let unsubscribe;

    const fetchComments = async () => {
      if (isCommentSectionOpen) {
        setLoadingComments(true);
        try {
          const commentsQuery = query(
            collection(db, "Posts", postId, "comments"),
            orderBy("createdAt", "desc")
          );

          unsubscribe = onSnapshot(commentsQuery, async (snapshot) => {
            const postComments = [];

            for (const commentDoc of snapshot.docs) {
              const commentData = {
                id: commentDoc.id,
                ...commentDoc.data(),
                reactions: commentDoc.data().reactions || {},
                reactionCount: commentDoc.data().reactionCount || 0,
                replyCount: commentDoc.data().replyCount || 0,
                replies: []
              };

              // Fetch replies for each comment
              const repliesQuery = query(
                collection(db, "Posts", postId, "comments", commentDoc.id, "replies"),
                orderBy("createdAt", "asc")
              );

              const repliesSnapshot = await onSnapshot(repliesQuery, (repliesSnap) => {
                const replies = repliesSnap.docs.map(replyDoc => ({
                  id: replyDoc.id,
                  ...replyDoc.data(),
                  reactions: replyDoc.data().reactions || {},
                  reactionCount: replyDoc.data().reactionCount || 0,
                  replyCount: replyDoc.data().replyCount || 0
                }));

                commentData.replies = replies;

                // Update the specific comment in state
                setComments(prevComments =>
                  prevComments.map(c =>
                    c.id === commentDoc.id ? { ...c, replies } : c
                  )
                );
              });

              postComments.push(commentData);
            }

            setComments(postComments);
            setLoadingComments(false);
          });
        } catch (error) {
          console.error("Error fetching comments:", error);
          toast.error("Failed to load comments");
          setLoadingComments(false);
        }
      }
    };

    fetchComments();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isCommentSectionOpen, postId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error("Comments cannot be left blank", { position: "top-center" });
      return;
    }

    if (!auth.currentUser) {
      toast.error("Please login to comment", { position: "top-center" });
      return;
    }

    try {
      const commentData = {
        userId: auth.currentUser.uid,
        userName: userDetails
          ? `${userDetails.firstName}${userDetails.lastName ? " " + userDetails.lastName : ""}`
          : auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "User",
        userPhoto: userDetails?.photo || auth.currentUser.photoURL || "https://via.placeholder.com/30",
        content: commentText.trim(),
        createdAt: serverTimestamp(),
        reactions: {},
        reactionCount: 0,
        replyCount: 0
      };

      const commentsRef = collection(db, "Posts", postId, "comments");
      await addDoc(commentsRef, commentData);

      setCommentText("");
      toast.success("💬 Comment added!", {
        position: "top-center",
        autoClose: 1000,
        style: { fontSize: '16px', fontWeight: '500' }
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(`Cannot add comments: ${error.message}`, { position: "top-center" });
    }
  };

  const handleReaction = async (targetId, reactionType, isReply = false, parentCommentId = null) => {
    if (!auth.currentUser) {
      toast.error("Please login to react", { position: "top-center" });
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      let targetRef;

      if (isReply && parentCommentId) {
        targetRef = doc(db, "Posts", postId, "comments", parentCommentId, "replies", targetId);
      } else {
        targetRef = doc(db, "Posts", postId, "comments", targetId);
      }

      // Get current reactions
      const currentTarget = isReply
        ? comments.find(c => c.id === parentCommentId)?.replies.find(r => r.id === targetId)
        : comments.find(c => c.id === targetId);

      const currentReactions = currentTarget?.reactions || {};
      const userCurrentReaction = Object.keys(currentReactions).find(type =>
        currentReactions[type]?.includes(userId)
      );

      let updateData = {};

      if (userCurrentReaction === reactionType) {
        // Remove reaction if clicking the same one
        updateData = {
          [`reactions.${reactionType}`]: arrayRemove(userId),
          reactionCount: increment(-1)
        };
        toast.success(`Removed ${REACTIONS[reactionType].label}`, {
          position: "top-center",
          autoClose: 1000
        });
      } else {
        // Add new reaction and remove old one if exists
        updateData = {
          [`reactions.${reactionType}`]: arrayUnion(userId),
          reactionCount: increment(userCurrentReaction ? 0 : 1)
        };

        if (userCurrentReaction) {
          updateData[`reactions.${userCurrentReaction}`] = arrayRemove(userId);
        }

        const ReactionIcon = REACTIONS[reactionType].icon;
        toast.success(
          <div className="d-flex align-items-center">
            <ReactionIcon color={REACTIONS[reactionType].color} className="me-2" />
            {REACTIONS[reactionType].label}
          </div>,
          {
            position: "top-center",
            autoClose: 1000
          }
        );
      }

      await updateDoc(targetRef, updateData);
      setShowReactionPicker(null);
    } catch (error) {
      console.error("Error updating reaction:", error);
      toast.error("Cannot react to this comment", { position: "top-center" });
    }
  };

  const handleDelete = async (targetId, isReply = false, parentCommentId = null) => {
    if (!auth.currentUser) {
      toast.error("Please login to delete", { position: "top-center" });
      return;
    }

    try {
      let targetRef;
      if (isReply && parentCommentId) {
        targetRef = doc(db, "Posts", postId, "comments", parentCommentId, "replies", targetId);
        const commentRef = doc(db, "Posts", postId, "comments", parentCommentId);
        await updateDoc(commentRef, { replyCount: increment(-1) });
      } else {
        targetRef = doc(db, "Posts", postId, "comments", targetId);
      }

      await deleteDoc(targetRef);
      toast.success(isReply ? "Reply deleted!" : "Comment deleted!", {
        position: "top-center",
        autoClose: 1000
      });
    } catch (error) {
      console.error(`Error deleting ${isReply ? 'reply' : 'comment'}:`, error);
      toast.error(`Cannot delete ${isReply ? 'reply' : 'comment'}: ${error.message}`, { position: "top-center" });
    }
  };

  const getUserReaction = (reactions, userId) => {
    return Object.keys(reactions).find(type =>
      reactions[type]?.includes(userId)
    );
  };

  const getTopReactions = (reactions) => {
    return Object.entries(reactions)
      .map(([type, users]) => ({ type, count: users?.length || 0 }))
      .filter(reaction => reaction.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("vi-VN");
  };

  const ReactionPicker = ({ targetId, isReply, parentCommentId, onClose }) => (
    <div className="position-absolute bg-white rounded-pill shadow-sm border p-2 d-flex gap-1"
      style={{ bottom: '100%', left: '0', zIndex: 1000 }}>
      {Object.entries(REACTIONS).map(([type, reaction]) => {
        const Icon = reaction.icon;
        return (
          <button
            key={type}
            className="btn p-1 rounded-circle"
            style={{ fontSize: '18px' }}
            onClick={() => {
              handleReaction(targetId, type, isReply, parentCommentId);
              onClose();
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            <Icon color={reaction.color} />
          </button>
        );
      })}
      <button className="btn p-1" onClick={onClose}>
        <FaTimes size={12} />
      </button>
    </div>
  );

  const ReactionDisplay = ({ reactions, targetId, isReply, parentCommentId }) => {
    const topReactions = getTopReactions(reactions);
    const userReaction = getUserReaction(reactions, auth.currentUser?.uid);
    const totalCount = Object.values(reactions).reduce((sum, users) => sum + (users?.length || 0), 0);

    return (
      <div className="d-flex align-items-center gap-2">
        <div className="position-relative">
          <button
            className={`btn btn-link p-1 d-flex align-items-center gap-1 ${userReaction ? 'text-primary' : 'text-muted'}`}
            onClick={() => setShowReactionPicker(showReactionPicker === targetId ? null : targetId)}
            style={{ fontSize: '14px' }}
          >
            {userReaction ? (
              <>
                {React.createElement(REACTIONS[userReaction].icon, {
                  color: REACTIONS[userReaction].color,
                  size: 16
                })}
                <span>{REACTIONS[userReaction].label}</span>
              </>
            ) : (
              <>
                <FaThumbsUp size={16} />
                <span>React</span>
              </>
            )}
          </button>

          {showReactionPicker === targetId && (
            <ReactionPicker
              targetId={targetId}
              isReply={isReply}
              parentCommentId={parentCommentId}
              onClose={() => setShowReactionPicker(null)}
            />
          )}
        </div>

        {totalCount > 0 && (
          <div className="d-flex align-items-center gap-1">
            <div className="d-flex" style={{ marginLeft: '-2px' }}>
              {topReactions.map(({ type }) => {
                const Icon = REACTIONS[type].icon;
                return (
                  <div key={type} className="bg-white rounded-circle p-1" style={{ marginLeft: '-2px' }}>
                    <Icon color={REACTIONS[type].color} size={12} />
                  </div>
                );
              })}
            </div>
            <small className="text-muted">{totalCount}</small>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isCommentSectionOpen && (
        <>
          {loadingComments && (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {comments.length > 0 && (
            <div className="mt-4">
              <hr />
              <div style={{ maxHeight: "500px", overflowY: "auto" }} className="pe-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="mb-4">
                    {/* Main Comment */}
                    <div className="d-flex align-items-start">
                      <img
                        src={comment.userPhoto || "https://via.placeholder.com/35"}
                        alt="Commenter"
                        className="rounded-circle me-2 flex-shrink-0"
                        style={{ width: "35px", height: "35px", objectFit: "cover" }}
                      />
                      <div className="flex-grow-1">
                        <div className={`rounded-3 p-3 ${themeClasses.bubble}`} style={{ maxWidth: '85%' }}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <strong className={`${themeClasses.textPrimary} small`}>{comment.userName}</strong>
                            <div className="d-flex align-items-center gap-2">
                              <small className={themeClasses.textMuted}>{formatTimeAgo(comment.createdAt)}</small>

                              {auth.currentUser?.uid === comment.userId && (
                                <button
                                  className="btn btn-link p-0 text-muted"
                                  onClick={() => handleDelete(comment.id)}
                                >
                                  <FaTimes size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mb-0 small lh-base" style={{ whiteSpace: "pre-wrap", wordBreak: 'break-word' }}>
                            {comment.content}
                          </p>
                        </div>

                        {/* Comment Actions */}
                        <div className="d-flex align-items-center gap-3 mt-2 ms-2">
                          <ReactionDisplay
                            reactions={comment.reactions}
                            targetId={comment.id}
                            isReply={false}
                          />

                          <button
                            className="btn btn-link text-muted p-0 d-flex align-items-center gap-1"
                            onClick={() => {
                              setReplyTo(replyTo === comment.id ? null : comment.id);
                            }}
                            style={{ fontSize: '14px' }}
                          >
                            <FaReply size={14} />
                            <span>Reply</span>
                            {comment.replyCount > 0 && (
                              <span className="text-muted">({comment.replyCount})</span>
                            )}
                          </button>
                        </div>

                        {/* Reply Input */}
                        {replyTo === comment.id && (
                          <ReplyComment
                            commentId={comment.id}
                            postId={postId}
                            auth={auth}
                            userDetails={userDetails}
                            setReplyTo={setReplyTo}
                            replyTo={replyTo}
                          />
                        )}

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="ms-4 mt-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="d-flex align-items-start mb-3">
                                <img
                                  src={reply.userPhoto || "https://via.placeholder.com/30"}
                                  alt="Replier"
                                  className="rounded-circle me-2 flex-shrink-0"
                                  style={{ width: "30px", height: "30px", objectFit: "cover" }}
                                />
                                <div className="flex-grow-1">
                                  <div className={`rounded-3 p-2 ${themeClasses.bubble}`} style={{ maxWidth: '80%' }}>
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                      <strong className="text-primary small">{reply.userName}</strong>
                                      <div className="d-flex align-items-center gap-2">
                                        <small className="text-muted">{formatTimeAgo(reply.createdAt)}</small>
                                        {auth.currentUser?.uid === reply.userId && (
                                          <button
                                            className="btn btn-link p-0 text-muted"
                                            onClick={() => handleDelete(reply.id, true, comment.id)}
                                          >
                                            <FaTimes size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="mb-0 small lh-base" style={{ whiteSpace: "pre-wrap", wordBreak: 'break-word' }}>
                                      {reply.content}
                                    </p>
                                  </div>

                                  {/* Reply Actions */}
                                  <div className="mt-1 ms-2">
                                    <ReactionDisplay
                                      reactions={reply.reactions}
                                      targetId={reply.id}
                                      isReply={true}
                                      parentCommentId={comment.id}
                                    />
                                    <button
                                      className="btn btn-link text-muted p-0 d-flex align-items-center gap-1"
                                      onClick={() => {
                                        setReplyTo(replyTo === reply.id ? null : reply.id);
                                      }}
                                      style={{ fontSize: '14px' }}
                                    >
                                      <FaReply size={14} />
                                      <span>Reply</span>
                                      {reply.replyCount > 0 && (
                                        <span className="text-muted">({reply.replyCount})</span>
                                      )}
                                    </button>
                                  </div>

                                  {/* Nested Reply Input */}
                                  {replyTo === reply.id && (
                                    <ReplyComment
                                      commentId={comment.id}
                                      postId={postId}
                                      auth={auth}
                                      userDetails={userDetails}
                                      setReplyTo={setReplyTo}
                                      replyTo={replyTo}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Comment Input */}
          <div className="mt-4">
            <hr />
            <form onSubmit={handleCommentSubmit} style={{
              backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.95)',
              borderRadius: '12px',
              padding: '20px',
              transition: 'background-color 0.3s ease'
            }} className="d-flex gap-3 align-items-start">
              <img
                src={userDetails?.photo || auth.currentUser?.photoURL || "https://via.placeholder.com/35"}
                alt="Your avatar"
                className="rounded-circle flex-shrink-0"
                style={{ width: "35px", height: "35px", objectFit: "cover" }}
              />
              <div className="flex-grow-1">
                <div className="position-relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className={`form-control border-2 ${themeClasses.border} ${theme === "dark" ? "bg-dark text-light" : "bg-white text-dark"}`}
                    rows="3"
                    style={{ resize: "none", borderRadius: '20px', paddingRight: '70px' }}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm rounded-pill position-absolute"
                    style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', minWidth: '60px' }}
                    disabled={!commentText.trim()}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default CommentSection;