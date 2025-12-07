import React, { useState } from "react";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { FaTimes } from "react-icons/fa";
import { db } from "../components/firebase";

const ReplyComment = ({ commentId, postId, auth, userDetails, setReplyTo }) => {
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
        userPhoto: userDetails?.photo || auth.currentUser.photoURL || "/default-avatar.png",
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
          src={userDetails?.photo || auth.currentUser?.photoURL || "/default-avatar.png"}
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

export default ReplyComment;