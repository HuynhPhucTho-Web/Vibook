import React, { useState, useEffect, useContext } from "react";
import { doc, updateDoc, getDoc, deleteDoc, query, getDocs, onSnapshot, collection } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaComment, FaTrash, FaShare, FaLink, FaTimes } from "react-icons/fa";
import CommentSection from "./CommentSection";

const PostItem = ({ post, auth, userDetails, onPostDeleted, currentUser }) => {
  const { theme } = useContext(ThemeContext);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostIdForReactions, setSelectedPostIdForReactions] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);

  // Real-time post updates listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "Posts", post.id), (doc) => {
      if (doc.exists()) {
        setLocalPost({ ...doc.data(), id: doc.id });
      }
    });

    return () => unsubscribe();
  }, [post.id]);

  // Real-time comment count listener
  useEffect(() => {
    const commentsQuery = query(collection(db, "Posts", post.id, "comments"));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      setCommentCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [post.id]);

  const handleReaction = async (postId, reaction) => {
    if (isReacting || !auth.currentUser) return;

    setIsReacting(true);
    try {
      const postRef = doc(db, "Posts", postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        toast.error("Article does not exist", { position: "top-center" });
        return;
      }

      const postData = postSnap.data();
      const userId = auth.currentUser.uid;
      const updatedLikes = postData.likes ? { ...postData.likes } : {};
      const updatedReactedBy = postData.reactedBy ? { ...postData.reactedBy } : {};

      if (updatedReactedBy[userId]) {
        const previousReaction = updatedReactedBy[userId];
        updatedLikes[previousReaction] = Math.max(0, (updatedLikes[previousReaction] || 0) - 1);
      }

      if (updatedReactedBy[userId] === reaction) {
        delete updatedReactedBy[userId];
        toast.success("Emotions removed", { position: "top-center", autoClose: 1000 });
      } else {
        updatedLikes[reaction] = (updatedLikes[reaction] || 0) + 1;
        updatedReactedBy[userId] = reaction;

        const reactionData = {
          Like: { icon: "👍", text: "Like" },
          Love: { icon: "❤️", text: "Love" },
          Haha: { icon: "😂", text: "Haha" },
          Wow: { icon: "😮", text: "Wow" },
          Sad: { icon: "😢", text: "Sad" },
          Angry: { icon: "😠", text: "Angry" },
        };

        const { icon, text } = reactionData[reaction];
        toast.success(`${icon} ${text}`, {
          position: "top-center",
          autoClose: 1000,
          style: { fontSize: '16px', fontWeight: '500' },
        });
      }

      await updateDoc(postRef, { likes: updatedLikes, reactedBy: updatedReactedBy });
      setSelectedPostIdForReactions(null);
    } catch (error) {
      console.error("Error reacting to post:", error);
      toast.error("Unable to drop emotion. Please try again.", { position: "top-center" });
    } finally {
      setIsReacting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const postRef = doc(db, "Posts", post.id);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        toast.error("Article does not exist", { position: "top-center" });
        return;
      }

      const postData = postSnap.data();
      if (postData.userId !== auth.currentUser?.uid) {
        toast.error("You can only delete your own posts.", { position: "top-center" });
        return;
      }

      const deletePromises = [];
      const commentsQuery = query(collection(db, "Posts", post.id, "comments"));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.docs.forEach((commentDoc) => {
        deletePromises.push(deleteDoc(commentDoc.ref));
      });

      deletePromises.push(deleteDoc(postRef));
      try {
        const PostsRef = doc(db, "Posts", post.id);
        await deleteDoc(PostsRef);
      } catch (error) {
        console.log("Post not found in Posts collection or already deleted:", error);
      }

      await Promise.all(deletePromises);
      toast.success("🗑️ Post deleted successfully", {
        position: "top-center",
        style: { fontSize: '16px', fontWeight: '500' },
      });

      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Cannot delete post", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async (type) => {
    const postUrl = `${window.location.origin}/Post/${post.id}`;
    const shareText = `${post.userName} posted:\n\n"${post.content}"\n\nSee article at: ${postUrl}`;

    try {
      switch (type) {
        case 'copy':
          await navigator.clipboard.writeText(postUrl);
          toast.success("🔗 Link copied!", {
            position: "top-center",
            style: { fontSize: '16px', fontWeight: '500' },
          });
          break;
        case 'copyWithContent':
          await navigator.clipboard.writeText(shareText);
          toast.success("📋 Content copied!", {
            position: "top-center",
            style: { fontSize: '16px', fontWeight: '500' },
          });
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: `Article by ${post.userName}`,
              text: post.content,
              url: postUrl,
            });
          } else {
            await navigator.clipboard.writeText(shareText);
            toast.success("📋 Content copied!", {
              position: "top-center",
              style: { fontSize: '16px', fontWeight: '500' },
            });
          }
          break;
        case 'facebook':
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(`${post.userName}: ${post.content}`)}`;
          window.open(fbUrl, '_blank', 'width=600,height=400');
          toast.success("📘 Opening Facebook...", {
            position: "top-center",
            autoClose: 1000,
            style: { fontSize: '16px', fontWeight: '500' },
          });
          break;
        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
          window.open(twitterUrl, '_blank', 'width=600,height=400');
          toast.success("🐦 Opening Twitter...", {
            position: "top-center",
            autoClose: 1000,
            style: { fontSize: '16px', fontWeight: '500' },
          });
          break;
        default:
          await navigator.clipboard.writeText(postUrl);
          toast.success("🔗 Link copied!", {
            position: "top-center",
            style: { fontSize: '16px', fontWeight: '500' },
          });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Cannot share", { position: "top-center" });
    }

    setShowShareMenu(false);
  };

  const getReactionIcon = (reaction) => {
    const icons = { Like: "👍", Love: "❤️", Haha: "😂", Wow: "😮", Sad: "😢", Angry: "😠" };
    return icons[reaction] || "👍";
  };

  const getReactionText = (reaction) => {
    const texts = { Like: "Like", Love: "Love", Haha: "Haha", Wow: "Wow", Sad: "Sad", Angry: "Angry" };
    return texts[reaction] || "Like";
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just finished";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hour ago`;
    if (days < 7) return `${days} the day before`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) || url.includes('cloudinary.com');
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || (url.includes('cloudinary.com') && url.includes('/video/'));
  };

  const getOptimizedImageUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    const transformations = 'c_fill,w_600,h_400,f_auto,q_auto';
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transformations}/`);
    }
    return url;
  };

  const currentUserReaction = localPost.reactedBy && localPost.reactedBy[auth.currentUser?.uid];
  const totalReactions = Object.values(localPost.likes || {}).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`card mb-4 shadow-sm ${theme}`} style={{ borderRadius: '12px', overflow: 'hidden' }}>
      <div className="card-body p-4">
        {/* Post Header */}
        <div className="d-flex align-items-center mb-3">
          <img
            src={localPost.userPhoto || "https://via.placeholder.com/40"}
            alt="Profile"
            className="rounded-circle me-3"
            style={{ width: "50px", height: "50px", objectFit: "cover", border: "2px solid #e9ecef" }}
          />
          <div className="flex-grow-1">
            <p className="mb-0 fw-bold fs-6">{localPost.userName}</p>
            <small className="text-muted">{formatTimeAgo(localPost.createdAt)}</small>
            {localPost.isShared && localPost.sharedBy && (
              <div className="small text-muted">
                <FaShare className="me-1" size="12" />
                Shared by {localPost.sharedBy.name}
              </div>
            )}
          </div>
          {localPost.userId === auth.currentUser?.uid && (
            <button
              className="btn btn-outline-danger btn-sm rounded-pill"
              onClick={handleDeletePost}
              disabled={isDeleting}
              style={{ minWidth: '80px' }}
            >
              {isDeleting ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <><FaTrash className="me-1" /> Xóa</>
              )}
            </button>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <p className="mb-0 lh-base" style={{ whiteSpace: "pre-wrap", fontSize: '1rem', wordBreak: 'break-word' }}>
            {localPost.content}
          </p>
        </div>

        {/* Post Media */}
        {localPost.mediaUrl && (
          <div className="mb-3 position-relative">
            <div
              className="rounded overflow-hidden"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', maxWidth: '100%', maxHeight: '400px', lineHeight: 0 }}
            >
              {isImageUrl(localPost.mediaUrl) ? (
                <img
                  src={getOptimizedImageUrl(localPost.mediaUrl)}
                  alt="Post media"
                  className="w-100"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s ease', objectFit: 'contain', maxWidth: '100%', maxHeight: '400px', display: 'block' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    console.error('Failed to load image:', localPost.mediaUrl);
                  }}
                  onClick={() => window.open(localPost.mediaUrl, '_blank')}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
              ) : isVideoUrl(localPost.mediaUrl) ? (
                <video
                  controls
                  className="w-100"
                  preload="metadata"
                  style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }}
                  onError={() => console.error('Failed to load video:', localPost.mediaUrl)}
                >
                  <source src={localPost.mediaUrl} type="video/mp4" />
                  This browser does not support this video.
                </video>
              ) : (
                <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100px' }}>
                  <div className="text-center">
                    <FaLink className="mb-2 text-primary" size={24} />
                    <br />
                    <a href={localPost.mediaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                      View attachment
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reaction Summary */}
        {totalReactions > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-3 text-muted small">
            <div className="d-flex align-items-center flex-wrap">
              {Object.entries(localPost.likes || {})
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([reaction, count]) => (
                  <span key={reaction} className="me-3 d-flex align-items-center">
                    <span className="me-1" style={{ fontSize: "1.2em" }}>{getReactionIcon(reaction)}</span>
                    <span className="fw-semibold">{count}</span>
                  </span>
                ))}
              {totalReactions > 0 && (
                <span className="ms-2 text-primary fw-semibold">
                  {totalReactions} {totalReactions === 1 ? 'lượt thích' : 'lượt thích'}
                </span>
              )}
            </div>
            {commentCount > 0 && (
              <span
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                className="text-decoration-underline text-primary fw-semibold"
              >
                {commentCount} Comment
              </span>
            )}
          </div>
        )}

        <hr className="my-3" style={{ opacity: 0.2 }} />

        {/* Action Buttons */}
        <div className="d-flex justify-content-around">
          <div className="position-relative flex-fill">
            <button
              className={`btn btn-link p-2 w-100 border-0 rounded-pill ${currentUserReaction ? "text-primary fw-bold bg-primary bg-opacity-10" : "text-muted"}`}
              onClick={() => handleReaction(post.id, "Like")}
              onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
              disabled={isReacting}
              style={{ transition: "all 0.2s", fontSize: '0.9rem' }}
            >
              <span style={{ fontSize: "1.2em", marginRight: "5px" }}>
                {currentUserReaction ? getReactionIcon(currentUserReaction) : "👍"}
              </span>
              {currentUserReaction ? getReactionText(currentUserReaction) : "Thích"}
            </button>
            {selectedPostIdForReactions === post.id && (
              <div
                className="position-absolute bg-white border rounded-pill shadow-lg p-2 d-flex gap-1"
                style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", zIndex: 1000, marginBottom: "8px", border: "2px solid #e9ecef" }}
                onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
                onMouseLeave={() => setTimeout(() => setSelectedPostIdForReactions(null), 200)}
              >
                {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((reaction) => (
                  <button
                    key={reaction}
                    className="btn btn-link p-2 rounded-circle"
                    onClick={() => handleReaction(post.id, reaction)}
                    title={getReactionText(reaction)}
                    style={{ fontSize: "1.5rem", transition: "transform 0.2s", border: "none", background: "none", width: "45px", height: "45px" }}
                    onMouseEnter={(e) => e.target.style.transform = "scale(1.3)"}
                    onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    disabled={isReacting}
                  >
                    {getReactionIcon(reaction)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={`btn btn-link text-muted p-2 flex-fill border-0 rounded-pill ${selectedPostId === post.id ? 'bg-light' : ''}`}
            onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
            style={{ fontSize: '0.9rem' }}
          >
            <FaComment className="me-1" /> Bình luận
          </button>

          <div className="position-relative flex-fill">
            <button
              className={`btn btn-link text-muted p-2 w-100 border-0 rounded-pill ${showShareMenu ? 'bg-light' : ''}`}
              onClick={() => setShowShareMenu(!showShareMenu)}
              style={{ fontSize: '0.9rem' }}
            >
              <FaShare className="me-1" /> Share
            </button>
            {showShareMenu && (
              <>
                <div
                  className="position-fixed w-100 h-100"
                  style={{ top: 0, left: 0, zIndex: 999 }}
                  onClick={() => setShowShareMenu(false)}
                />
                <div
                  className="position-absolute bg-white border rounded shadow-lg p-3"
                  style={{ top: "100%", right: "0", zIndex: 1000, minWidth: "220px", marginTop: "8px", borderRadius: '12px', border: '2px solid #e9ecef' }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted fw-bold">Share this post</small>
                    <button className="btn btn-link p-0 text-muted" onClick={() => setShowShareMenu(false)}>
                      <FaTimes size="14" />
                    </button>
                  </div>
                  <div className="d-grid gap-1">
                    <button className="btn btn-light text-start p-2 border-0 rounded" onClick={() => handleShare('copy')}>
                      <FaLink className="me-2 text-primary" /> Copy link
                    </button>
                    <button className="btn btn-light text-start p-2 border-0 rounded" onClick={() => handleShare('copyWithContent')}>
                      <FaLink className="me-2 text-success" /> Copy content
                    </button>
                    {navigator.share && (
                      <button className="btn btn-light text-start p-2 border-0 rounded" onClick={() => handleShare('native')}>
                        <FaShare className="me-2 text-info" /> System Sharing
                      </button>
                    )}
                    <hr className="my-2" />
                    <button className="btn btn-light text-start p-2 border-0 rounded" onClick={() => handleShare('facebook')}>
                      📘 Facebook
                    </button>
                    <button className="btn btn-light text-start p-2 border-0 rounded" onClick={() => handleShare('twitter')}>
                      🐦 Twitter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <CommentSection
          postId={post.id}
          auth={auth}
          userDetails={userDetails}
          isCommentSectionOpen={selectedPostId === post.id}
          toggleCommentSection={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
        />
      </div>
    </div>
  );
};

export default PostItem;