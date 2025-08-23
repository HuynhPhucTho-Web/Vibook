import React, { useState, useEffect, useContext } from "react";
import { doc, updateDoc, getDoc, deleteDoc, query, getDocs, onSnapshot, collection } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { FaComment, FaTrash, FaShare, FaLink, FaTimes, FaFile } from "react-icons/fa";
import CommentSection from "./CommentSection";
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FaEdit, FaLock } from 'react-icons/fa';
import { ThemeProvider } from "../context/ThemeProvider";

const PostItem = ({ post, auth, userDetails, onPostDeleted,handleEditPost, handlePrivatePost }) => {
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
    if (!post.id) return;

    const unsubscribe = onSnapshot(doc(db, "Posts", post.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedPost = { ...docSnapshot.data(), id: docSnapshot.id };
        setLocalPost(updatedPost);
      } else {
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
      }
    });

    return () => unsubscribe();
  }, [post.id, onPostDeleted]);

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
        toast.error("Post does not exist", { position: "top-center" });
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
        toast.success("Reaction removed", { position: "top-center", autoClose: 1000 });
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
      toast.error("Unable to react. Please try again.", { position: "top-center" });
    } finally {
      setIsReacting(false);
    }
  };

  const getMediaFiles = () => {
    if (localPost.mediaFiles && Array.isArray(localPost.mediaFiles)) {
      return localPost.mediaFiles;
    } else if (localPost.mediaUrl) {
      return [{
        url: localPost.mediaUrl,
        category: getMediaCategory(localPost.mediaUrl),
        originalName: 'media',
        resourceType: 'auto'
      }];
    }
    return [];
  };

  const getMediaCategory = (url) => {
    if (!url) return 'unknown';
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) || (url.includes('cloudinary.com') && url.includes('/image/'))) {
      return 'image';
    }
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || (url.includes('cloudinary.com') && url.includes('/video/'))) {
      return 'video';
    }
    if (/\.(pdf|doc|docx)(\?|$)/i.test(url) || url.includes('/raw/')) {
      return 'document';
    }
    return 'unknown';
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const postRef = doc(db, "Posts", post.id);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        toast.error("Post does not exist", { position: "top-center" });
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
    const shareText = `${post.userName} posted:\n\n"${post.content}"\n\nSee post at: ${postUrl}`;

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
              title: `Post by ${post.userName}`,
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

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString("en-US");
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
            <Dropdown as={ButtonGroup} align="end">
              <Dropdown.Toggle
                variant="outline-danger"
                className="btn btn-sm rounded-pill"
                disabled={isDeleting}
                style={{ minWidth: '80px' }}
              >
                {isDeleting ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  'Actions'
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleEditPost}>
                  <FaEdit className="me-1" /> Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={handleDeletePost}>
                  <FaTrash className="me-1" /> Delete
                </Dropdown.Item>
                <Dropdown.Item onClick={handlePrivatePost}>
                  <FaLock className="me-1" /> Private
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        {/* Post Content */}
        {localPost.content && (
          <div className="mb-3">
            <p className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {localPost.content}
            </p>
          </div>
        )}

        {/* Post Media - Multiple Files Support */}
        {(() => {
          const mediaFiles = getMediaFiles();
          return mediaFiles.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {mediaFiles.map((mediaItem, index) => {
                  const { url, category, originalName, size } = mediaItem;

                  if (category === 'image') {
                    return (
                      <div key={index} className="position-relative">
                        <img
                          src={getOptimizedImageUrl(url)}
                          alt={originalName || `Image ${index + 1}`}
                          className="rounded"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "400px",
                            objectFit: "contain",
                            cursor: "pointer",
                            transition: "transform 0.2s ease",
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            console.error('Failed to load image:', url);
                          }}
                          onClick={() => window.open(url, '_blank')}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        />
                      </div>
                    );
                  } else if (category === 'video') {
                    return (
                      <div key={index} className="position-relative">
                        <video
                          controls
                          className="rounded"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "400px",
                            objectFit: "contain",
                          }}
                          onError={() => console.error('Failed to load video:', url)}
                        >
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        {originalName && originalName !== 'media' && (
                          <small className="text-muted d-block mt-1 text-center">{originalName}</small>
                        )}
                      </div>
                    );
                  } else if (category === 'document') {
                    return (
                      <div key={index} className="d-flex align-items-center p-3 border rounded bg-light">
                        <FaFile className="me-3 text-primary" size={24} />
                        <div className="flex-grow-1 text-center">
                          <div className="fw-semibold">{originalName || 'Document'}</div>
                          {size && <small className="text-muted">{(size / 1024 / 1024).toFixed(2)} MB</small>}
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm"
                        >
                          <FaLink className="me-1" size={12} />
                          View
                        </a>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="d-flex align-items-center justify-content-center p-4 border rounded bg-light">
                        <div className="text-center">
                          <FaLink className="mb-2 text-primary" size={24} />
                          <br />
                          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                            View attachment
                          </a>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        })()}

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
                  {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
                </span>
              )}
            </div>
            {commentCount > 0 && (
              <span
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                className="text-decoration-underline text-primary fw-semibold"
              >
                {commentCount} Comment{commentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <hr className="my-3" style={{ opacity: 0.2 }} />

        {/* Action Buttons */}
        <div className="flex justify-around items-center border-t border-gray-200 dark:border-gray-700 pt-2">
          {/* LIKE */}
          <div className="relative flex-1 text-center">
            <button
              onClick={() => handleReaction(post.id, "Like")}
              onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
              disabled={isReacting}
              className={`flex items-center justify-center w-full py-2 rounded-xl transition ${currentUserReaction
                ? "text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
              <span className="mr-2 text-lg">
                {currentUserReaction ? getReactionIcon(currentUserReaction) : "👍"}
              </span>
              {currentUserReaction ? getReactionText(currentUserReaction) : "Like"}
            </button>

            {/* Reaction Picker */}
            {selectedPostIdForReactions === post.id && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex bg-white dark:bg-gray-800 rounded-full shadow-lg border p-2 z-50"
                onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
                onMouseLeave={() => setTimeout(() => setSelectedPostIdForReactions(null), 200)}
              >
                {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((reaction) => (
                  <button
                    key={reaction}
                    onClick={() => handleReaction(post.id, reaction)}
                    className="mx-1 w-10 h-10 flex items-center justify-center rounded-full text-xl transition-transform hover:scale-125"
                    title={getReactionText(reaction)}
                    disabled={isReacting}
                  >
                    {getReactionIcon(reaction)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COMMENT */}
          <button
            onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
            className={`flex items-center justify-center flex-1 py-2 rounded-xl transition ${selectedPostId === post.id
              ? "bg-gray-100 dark:bg-gray-700 text-blue-600"
              : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
          >
            <FaComment className="mr-2 text-lg" />
            Comment
          </button>

          {/* SHARE */}
          <div className="relative flex-1 text-center">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`flex items-center justify-center w-full py-2 rounded-xl transition ${showShareMenu
                ? "bg-gray-100 dark:bg-gray-700 text-green-600"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
              <FaShare className="mr-2 text-lg" />
              Share
            </button>

            {showShareMenu && (
              <>
                {/* overlay */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowShareMenu(false)}
                />
                {/* menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-3 animate-fadeIn">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Share this post</span>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => setShowShareMenu(false)}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <button
                      className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      onClick={() => handleShare("copy")}
                    >
                      <FaLink className="mr-2 text-blue-500" /> Copy link
                    </button>
                    <button
                      className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      onClick={() => handleShare("copyWithContent")}
                    >
                      <FaLink className="mr-2 text-green-500" /> Copy content
                    </button>
                    {navigator.share && (
                      <button
                        className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        onClick={() => handleShare("native")}
                      >
                        <FaShare className="mr-2 text-purple-500" /> System Sharing
                      </button>
                    )}
                    <button
                      className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      onClick={() => handleShare("facebook")}
                    >
                      📘 Facebook
                    </button>
                    <button
                      className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      onClick={() => handleShare("twitter")}
                    >
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