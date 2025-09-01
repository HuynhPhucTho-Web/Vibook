import React, { useState, useEffect, useContext, useRef } from "react";
import { doc, updateDoc, getDoc, deleteDoc, query, getDocs, onSnapshot, collection } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import { FaComment, FaTrash, FaShare, FaLink, FaTimes, FaFile } from "react-icons/fa";
import CommentSection from "./CommentSection";
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FaEdit, FaLock, FaEllipsisH } from 'react-icons/fa';
import { ThemeProvider } from "../context/ThemeProvider";


const PostItem = ({ post, auth, userDetails, onPostDeleted, handleEditPost, handlePrivatePost }) => {
  const { theme } = useContext(ThemeContext);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostIdForReactions, setSelectedPostIdForReactions] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const videoRef = useRef(null);
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

  // Theme-aware styles
  const cardStyles = {
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    color: theme === 'dark' ? '#e5e5e5' : '#1a1a1a',
    border: theme === 'dark' ? '1px solid #333' : '1px solid #e5e5e5',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    boxShadow: theme === 'dark'
      ? '0 4px 20px rgba(0, 0, 0, 0.5)'
      : '0 4px 20px rgba(0, 0, 0, 0.08)'
  };

  const buttonStyles = {
    backgroundColor: 'transparent',
    border: 'none',
    color: theme === 'dark' ? '#b3b3b3' : '#666666',
    transition: 'all 0.2s ease',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500'
  };

  const buttonHoverStyles = {
    backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
    color: theme === 'dark' ? '#fff' : '#333',
    transform: 'translateY(-1px)'
  };

  const activeButtonStyles = {
    backgroundColor: theme === 'dark' ? '#0d6efd20' : '#e3f2fd',
    color: '#0d6efd',
    fontWeight: '600'
  };

  return (
    <div
      className="mb-4 position-relative"
      style={cardStyles}
    >
      <div className="p-4">
        {/* Post Header */}
        <div className="d-flex align-items-center mb-3">
          <img
            src={localPost.userPhoto || "https://via.placeholder.com/40"}
            alt="Profile"
            className="rounded-circle me-3"
            style={{
              width: "52px",
              height: "52px",
              objectFit: "cover",
              border: `3px solid ${theme === 'dark' ? '#333' : '#e9ecef'}`,
              transition: 'all 0.3s ease'
            }}
          />
          <div className="flex-grow-1">
            <p className="mb-0 fw-bold fs-6" style={{ color: theme === 'dark' ? '#fff' : '#333' }}>
              {localPost.userName}
            </p>
            <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
              {formatTimeAgo(localPost.createdAt)}
            </small>
            {localPost.isShared && localPost.sharedBy && (
              <div className="small" style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                <FaShare className="me-1" size="12" />
                Shared by {localPost.sharedBy.name}
              </div>
            )}
          </div>

          {localPost.userId === auth.currentUser?.uid && (
            <Dropdown as={ButtonGroup} align="end">
              <Dropdown.Toggle
                className="btn btn-sm rounded-pill border-0"
                disabled={isDeleting}
                style={{
                  backgroundColor: theme === 'dark' ? '#333' : '#f8f9fa',
                  color: theme === 'dark' ? '#fff' : '#333',
                  minWidth: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isDeleting ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <FaEllipsisH size={16} />
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu
                style={{
                  backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                  border: theme === 'dark' ? '1px solid #444' : '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '8px'
                }}
              >
                <Dropdown.Item
                  onClick={handleEditPost}
                  style={{
                    color: theme === 'dark' ? '#fff' : '#333',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme === 'dark' ? '#444' : '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <FaEdit className="me-2" /> Edit
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={handleDeletePost}
                  style={{
                    color: '#dc3545',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme === 'dark' ? '#dc354520' : '#f8d7da';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <FaTrash className="me-2" /> Delete
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={handlePrivatePost}
                  style={{
                    color: theme === 'dark' ? '#fff' : '#333',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme === 'dark' ? '#444' : '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <FaLock className="me-2" /> Private
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        {/* Post Content */}
        {localPost.content && (
          <div className="mb-3">
            <p
              className="mb-0"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.6',
                fontSize: '15px',
                color: theme === 'dark' ? '#e5e5e5' : '#333'
              }}
            >
              {localPost.content}
            </p>
          </div>
        )}

        {/* Post Media - Multiple Files Support */}
        {(() => {
          const mediaFiles = getMediaFiles();
          return mediaFiles.length > 0 && (
            <div className="mb-1">
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
                            maxWidth: "500%",
                            maxHeight: "auto",
                            objectFit: "contain",
                            cursor: "pointer",
                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                            borderRadius: '12px'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            console.error('Failed to load image:', url);
                          }}
                          onClick={() => window.open(url, '_blank')}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.02)';
                            e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    );
                  } else if (category === 'video') {
                    return (
                      <div
                        key={index}
                        className="position-relative"
                        onMouseEnter={(e) => {
                          const video = e.currentTarget.querySelector("video");
                          if (video) {
                            video.muted = true;   // auto-play thì nên mute
                            video.play();
                          }
                        }}
                        onMouseLeave={(e) => {
                          const video = e.currentTarget.querySelector("video");
                          if (video) {
                            video.pause();
                            video.currentTime = 0; // reset về đầu
                          }
                        }}
                      >
                        <video
                          ref={videoRef}
                          controls
                          className="rounded"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "400%",
                            objectFit: "contain",
                            borderRadius: '12px'
                          }}
                          onMouseEnter={() => {
                            videoRef.current.muted = false; // bật âm thanh
                            videoRef.current.play().catch(err => console.log("Autoplay blocked:", err));
                          }}
                          onMouseLeave={() => {
                            videoRef.current.pause();
                          }}
                        >
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>


                        {originalName && originalName !== 'media' && (
                          <small
                            className="d-block mt-1 text-center"
                            style={{ color: theme === 'dark' ? '#999' : '#666' }}
                          >
                            {originalName}
                          </small>
                        )}
                      </div>
                    );
                  }
                  else if (category === 'document') {
                    return (
                      <div
                        key={index}
                        className="d-flex align-items-center p-3 border rounded"
                        style={{
                          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
                          borderColor: theme === 'dark' ? '#444' : '#dee2e6',
                          borderRadius: '12px'
                        }}
                      >
                        <FaFile className="me-3 text-primary" size={24} />
                        <div className="flex-grow-1 text-center">
                          <div
                            className="fw-semibold"
                            style={{ color: theme === 'dark' ? '#fff' : '#333' }}
                          >
                            {originalName || 'Document'}
                          </div>
                          {size && (
                            <small style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                              {(size / 1024 / 1024).toFixed(2)} MB
                            </small>
                          )}
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm rounded-pill"
                          style={{ textDecoration: 'none' }}
                        >
                          <FaLink className="me-1" size={12} />
                          View
                        </a>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={index}
                        className="d-flex align-items-center justify-content-center p-4 border rounded"
                        style={{
                          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f9fa',
                          borderColor: theme === 'dark' ? '#444' : '#dee2e6',
                          borderRadius: '12px'
                        }}
                      >
                        <div className="text-center">
                          <FaLink className="mb-2 text-primary" size={24} />
                          <br />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm rounded-pill"
                            style={{ textDecoration: 'none' }}
                          >
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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center flex-wrap">
              {Object.entries(localPost.likes || {})
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([reaction, count]) => (
                  <span key={reaction} className="me-3 d-flex align-items-center">
                    <span className="me-1" style={{ fontSize: "1.3em" }}>{getReactionIcon(reaction)}</span>
                    <span
                      className="fw-semibold"
                      style={{ color: theme === 'dark' ? '#fff' : '#333' }}
                    >
                      {count}
                    </span>
                  </span>
                ))}
              {totalReactions > 0 && (
                <span
                  className="ms-2 fw-semibold"
                  style={{ color: '#0d6efd' }}
                >
                  {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
                </span>
              )}
            </div>
            {commentCount > 0 && (
              <span
                style={{
                  cursor: "pointer",
                  color: '#0d6efd',
                  textDecoration: 'underline',
                  fontWeight: '500'
                }}
                onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
              >
                {commentCount} Comment{commentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <hr style={{
          opacity: 0.2,
          margin: '16px 0',
          borderColor: theme === 'dark' ? '#444' : '#dee2e6'
        }} />

       
        <div className="d-flex justify-content-around align-items-center">
         
          <div className="position-relative flex-fill text-center">
            <button
              onClick={() => handleReaction(post.id, "Like")}
              onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
              disabled={isReacting}
              className="w-100 d-flex align-items-center justify-content-center"
              style={{
                ...buttonStyles,
                ...(currentUserReaction ? activeButtonStyles : {}),
                fontWeight: currentUserReaction ? '600' : '500'
              }}
              onMouseOver={(e) => {
                if (!currentUserReaction) {
                  Object.assign(e.target.style, buttonHoverStyles);
                }
              }}
              onMouseOut={(e) => {
                if (!currentUserReaction) {
                  Object.assign(e.target.style, buttonStyles);
                }
              }}
            >
              <span className="me-2" style={{ fontSize: "1.2em" }}>
                {currentUserReaction ? getReactionIcon(currentUserReaction) : "👍"}
              </span>
              {currentUserReaction ? getReactionText(currentUserReaction) : "Like"}
            </button>

           
            {selectedPostIdForReactions === post.id && (
              <div
                className="position-absolute d-flex rounded-pill shadow-lg border p-2"
                style={{
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '8px',
                  backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                  borderColor: theme === 'dark' ? '#444' : '#dee2e6',
                  zIndex: 50,
                  animation: 'fadeInUp 0.2s ease'
                }}
                onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
                onMouseLeave={() => setTimeout(() => setSelectedPostIdForReactions(null), 200)}
              >
                {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((reaction) => (
                  <button
                    key={reaction}
                    onClick={() => handleReaction(post.id, reaction)}
                    className="mx-1 d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '1.3em',
                      transition: 'transform 0.2s ease',
                      cursor: 'pointer'
                    }}
                    title={getReactionText(reaction)}
                    disabled={isReacting}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.25)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {getReactionIcon(reaction)}
                  </button>
                ))}
              </div>
            )}
          </div>

         
          <button
            onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
            className="flex-fill d-flex align-items-center justify-content-center"
            style={{
              ...buttonStyles,
              ...(selectedPostId === post.id ? activeButtonStyles : {})
            }}
            onMouseOver={(e) => {
              if (selectedPostId !== post.id) {
                Object.assign(e.target.style, buttonHoverStyles);
              }
            }}
            onMouseOut={(e) => {
              if (selectedPostId !== post.id) {
                Object.assign(e.target.style, buttonStyles);
              }
            }}
          >
            <FaComment className="me-2" style={{ fontSize: "1.1em" }} />
            Comment
          </button>

         
          <div className="position-relative flex-fill text-center">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-100 d-flex align-items-center justify-content-center"
              style={{
                ...buttonStyles,
                ...(showShareMenu ? activeButtonStyles : {})
              }}
              onMouseOver={(e) => {
                if (!showShareMenu) {
                  Object.assign(e.target.style, buttonHoverStyles);
                }
              }}
              onMouseOut={(e) => {
                if (!showShareMenu) {
                  Object.assign(e.target.style, buttonStyles);
                }
              }}
            >
              <FaShare className="me-2" style={{ fontSize: "1.1em" }} />
              Share
            </button>

            {showShareMenu && (
              <>
               
                <div
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{ zIndex: 40 }}
                  onClick={() => setShowShareMenu(false)}
                />
                {/* Share Menu */}
                <div
                  className="position-absolute shadow-lg border p-3"
                  style={{
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '240px',
                    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
                    borderColor: theme === 'dark' ? '#444' : '#dee2e6',
                    borderRadius: '16px',
                    zIndex: 50,
                    animation: 'fadeInDown 0.2s ease'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span
                      className="fw-semibold"
                      style={{
                        fontSize: '14px',
                        color: theme === 'dark' ? '#e5e5e5' : '#666'
                      }}
                    >
                      Share this post
                    </span>
                    <button
                      className="btn-close"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: theme === 'dark' ? '#999' : '#666',
                        fontSize: '12px'
                      }}
                      onClick={() => setShowShareMenu(false)}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <button
                      className="d-flex align-items-center w-100 p-2 rounded-3 border-0"
                      style={{
                        backgroundColor: 'transparent',
                        color: theme === 'dark' ? '#e5e5e5' : '#333',
                        transition: 'background-color 0.2s ease'
                      }}
                      onClick={() => handleShare("copy")}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? '#404040' : '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaLink className="me-3" style={{ color: '#0d6efd' }} />
                      Copy link
                    </button>

                    <button
                      className="d-flex align-items-center w-100 p-2 rounded-3 border-0"
                      style={{
                        backgroundColor: 'transparent',
                        color: theme === 'dark' ? '#e5e5e5' : '#333',
                        transition: 'background-color 0.2s ease'
                      }}
                      onClick={() => handleShare("copyWithContent")}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? '#404040' : '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaLink className="me-3" style={{ color: '#28a745' }} />
                      Copy content
                    </button>

                    {navigator.share && (
                      <button
                        className="d-flex align-items-center w-100 p-2 rounded-3 border-0"
                        style={{
                          backgroundColor: 'transparent',
                          color: theme === 'dark' ? '#e5e5e5' : '#333',
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => handleShare("native")}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = theme === 'dark' ? '#404040' : '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        <FaShare className="me-3" style={{ color: '#6f42c1' }} />
                        System Sharing
                      </button>
                    )}

                    <button
                      className="d-flex align-items-center w-100 p-2 rounded-3 border-0"
                      style={{
                        backgroundColor: 'transparent',
                        color: theme === 'dark' ? '#e5e5e5' : '#333',
                        transition: 'background-color 0.2s ease'
                      }}
                      onClick={() => handleShare("facebook")}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? '#404040' : '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="me-3" style={{ fontSize: '1.2em' }}>📘</span>
                      Facebook
                    </button>

                    <button
                      className="d-flex align-items-center w-100 p-2 rounded-3 border-0"
                      style={{
                        backgroundColor: 'transparent',
                        color: theme === 'dark' ? '#e5e5e5' : '#333',
                        transition: 'background-color 0.2s ease'
                      }}
                      onClick={() => handleShare("twitter")}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme === 'dark' ? '#404040' : '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="me-3" style={{ fontSize: '1.2em' }}>🐦</span>
                      Twitter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      
        <CommentSection
          postId={post.id}
          auth={auth}
          userDetails={userDetails}
          isCommentSectionOpen={selectedPostId === post.id}
          toggleCommentSection={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
        />
      </div>

     
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .btn-close:hover {
          color: #dc3545 !important;
        }
        
        /* Custom scrollbar for dark theme */
        ${theme === 'dark' ? `
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #2a2a2a;
          }
          ::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #777;
          }
        ` : ''}
      `}</style>
    </div>
  );
};

export default PostItem;