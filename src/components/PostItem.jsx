import React, { useState, useContext, useEffect } from "react";
import { doc, updateDoc, collection, addDoc, getDoc, deleteDoc, query, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaComment, FaTrash, FaShare, FaLink, FaTimes } from "react-icons/fa";

const PostItem = ({ post, auth, userDetails, onPostDeleted, currentUser }) => {
  const { theme } = useContext(ThemeContext);
  const [commentText, setCommentText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostIdForReactions, setSelectedPostIdForReactions] = useState(null);
  const [comments, setComments] = useState(post.comments || []);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  // Real-time comments listener
  useEffect(() => {
    let unsubscribe;

    const fetchComments = async () => {
      if (selectedPostId === post.id) {
        try {
          const commentsQuery = query(collection(db, "Posts", post.id, "comments"));
          unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const postComments = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            })).sort((a, b) => a.createdAt - b.createdAt);
            setComments(postComments);
          });
        } catch (error) {
          console.error("Error fetching comments:", error);
        }
      }
    };

    fetchComments();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedPostId, post.id]);

  // Real-time post updates listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "Posts", post.id), (doc) => {
      if (doc.exists()) {
        setLocalPost({ ...doc.data(), id: doc.id });
      }
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
        toast.error("Bài viết không tồn tại", { position: "top-center" });
        return;
      }

      const postData = postSnap.data();
      const userId = auth.currentUser.uid;

      const updatedLikes = { ...postData.likes } || {};
      const updatedReactedBy = { ...postData.reactedBy } || {};

      // Remove previous reaction if exists
      if (updatedReactedBy[userId]) {
        const previousReaction = updatedReactedBy[userId];
        updatedLikes[previousReaction] = Math.max(0, (updatedLikes[previousReaction] || 0) - 1);
      }

      // Toggle reaction
      if (updatedReactedBy[userId] === reaction) {
        // Remove current reaction
        delete updatedReactedBy[userId];
        toast.success("Đã bỏ cảm xúc", { position: "top-center", autoClose: 1000 });
      } else {
        // Add new reaction
        updatedLikes[reaction] = (updatedLikes[reaction] || 0) + 1;
        updatedReactedBy[userId] = reaction;

        const reactionTexts = {
          "Like": "Thích",
          "Love": "Yêu thích",
          "Haha": "Haha",
          "Wow": "Wow",
          "Sad": "Buồn",
          "Angry": "Tức giận"
        };
        toast.success(`${reactionTexts[reaction]} 👍`, { position: "top-center", autoClose: 1000 });
      }

      await updateDoc(postRef, {
        likes: updatedLikes,
        reactedBy: updatedReactedBy
      });

      // Hide reaction picker after selecting
      setSelectedPostIdForReactions(null);

    } catch (error) {
      console.error("Error reacting to post:", error);
      toast.error("Không thể thả cảm xúc. Vui lòng thử lại.", { position: "top-center" });
    } finally {
      setIsReacting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error("Bình luận không được để trống", { position: "top-center" });
      return;
    }

    if (!auth.currentUser) {
      toast.error("Vui lòng đăng nhập để bình luận", { position: "top-center" });
      return;
    }

    try {
      const commentData = {
        userId: auth.currentUser.uid,
        userName: userDetails ?
          `${userDetails.firstName}${userDetails.lastName ? " " + userDetails.lastName : ""}` :
          auth.currentUser.displayName ||
          auth.currentUser.email?.split('@')[0] ||
          "Người dùng",
        userPhoto: userDetails?.photo || auth.currentUser.photoURL || "https://via.placeholder.com/30",
        content: commentText.trim(),
        createdAt: Date.now(),
      };

      const commentsRef = collection(db, "Posts", post.id, "comments");
      await addDoc(commentsRef, commentData);

      setCommentText("");
      toast.success("Đã thêm bình luận!", { position: "top-center", autoClose: 1000 });

    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(`Không thể thêm bình luận: ${error.message}`, { position: "top-center" });
    }
  };

  // IMPROVED DELETE FUNCTION - Xóa cả Posts và posts collections
  const handleDeletePost = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    setIsDeleting(true);
    try {
      // Check if user owns the post
      const postRef = doc(db, "Posts", post.id);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        toast.error("Bài viết không tồn tại", { position: "top-center" });
        return;
      }

      const postData = postSnap.data();
      if (postData.userId !== auth.currentUser?.uid) {
        toast.error("Bạn chỉ có thể xóa bài viết của mình", { position: "top-center" });
        return;
      }

      // Delete from both collections: Posts and posts
      const deletePromises = [];

      // 1. Delete all comments first
      const commentsQuery = query(collection(db, "Posts", post.id, "comments"));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.docs.forEach((commentDoc) => {
        deletePromises.push(deleteDoc(commentDoc.ref));
      });

      // 2. Delete from posts collection
      deletePromises.push(deleteDoc(postRef));

      // 3. Delete from Posts collection (with capital P) - FIXED
      try {
        const PostsRef = doc(db, "Posts", post.id);
        await deleteDoc(PostsRef);
        console.log("Deleted from Posts collection");
      } catch (error) {
        console.log("Post not found in Posts collection or already deleted:", error);
      }

      // Execute all deletions
      await Promise.all(deletePromises);

      toast.success("Đã xóa bài viết thành công", { position: "top-center" });

      // Notify parent component
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }

    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Không thể xóa bài viết", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async (type) => {
    const postUrl = `${window.location.origin}/Post/${post.id}`;
    const shareText = `${post.userName} đã đăng:\n\n"${post.content}"\n\nXem bài viết tại: ${postUrl}`;

    try {
      switch (type) {
        case 'copy':
          await navigator.clipboard.writeText(postUrl);
          toast.success("Đã sao chép link!", { position: "top-center" });
          break;

        case 'copyWithContent':
          await navigator.clipboard.writeText(shareText);
          toast.success("Đã sao chép nội dung!", { position: "top-center" });
          break;

        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: `Bài viết của ${post.userName}`,
              text: post.content,
              url: postUrl,
            });
          } else {
            await navigator.clipboard.writeText(shareText);
            toast.success("Đã sao chép nội dung!", { position: "top-center" });
          }
          break;

        case 'facebook':
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(`${post.userName}: ${post.content}`)}`;
          window.open(fbUrl, '_blank', 'width=600,height=400');
          break;

        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
          window.open(twitterUrl, '_blank', 'width=600,height=400');
          break;

        default:
          await navigator.clipboard.writeText(postUrl);
          toast.success("Đã sao chép link!", { position: "top-center" });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Không thể chia sẻ", { position: "top-center" });
    }

    setShowShareMenu(false);
  };

  const getReactionIcon = (reaction) => {
    const icons = {
      "Like": "👍",
      "Love": "❤️",
      "Haha": "😂",
      "Wow": "😮",
      "Sad": "😢",
      "Angry": "😠"
    };
    return icons[reaction] || "👍";
  };

  const getReactionText = (reaction) => {
    const texts = {
      "Like": "Thích",
      "Love": "Yêu thích",
      "Haha": "Haha",
      "Wow": "Wow",
      "Sad": "Buồn",
      "Angry": "Tức giận"
    };
    return texts[reaction] || "Thích";
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
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

  // IMPROVED IMAGE TRANSFORMATION for Cloudinary
  const getOptimizedImageUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;

    // Transform Cloudinary URL for consistent sizing and optimization
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
            style={{
              width: "50px",
              height: "50px",
              objectFit: "cover",
              border: "2px solid #e9ecef"
            }}
          />
          <div className="flex-grow-1">
            <p className="mb-0 fw-bold fs-6">{localPost.userName}</p>
            <small className="text-muted">{formatTimeAgo(localPost.createdAt)}</small>
            {/* Show shared info if applicable */}
            {localPost.isShared && localPost.sharedBy && (
              <div className="small text-muted">
                <FaShare className="me-1" size="12" />
                Được chia sẻ bởi {localPost.sharedBy.name}
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
          <p className="mb-0 lh-base" style={{
            whiteSpace: "pre-wrap",
            fontSize: '1rem',
            wordBreak: 'break-word'
          }}>
            {localPost.content}
          </p>
        </div>

        {/* IMPROVED Post Media with consistent sizing */}
        {localPost.mediaUrl && (
          <div className="mb-3 position-relative">
            <div
              className="ratio ratio-16x9 rounded overflow-hidden"
              style={{
                maxHeight: '400px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6'
              }}
            >
              {isImageUrl(localPost.mediaUrl) ? (
                <img
                  src={getOptimizedImageUrl(localPost.mediaUrl)}
                  alt="Post media"
                  className="object-fit-cover w-100 h-100"
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    console.error('Failed to load image:', localPost.mediaUrl);
                  }}
                  onClick={() => {
                    // Optional: Open image in modal or new tab
                    window.open(localPost.mediaUrl, '_blank');
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
              ) : isVideoUrl(localPost.mediaUrl) ? (
                <video
                  controls
                  className="w-100 h-100 object-fit-cover"
                  preload="metadata"
                  onError={(e) => {
                    console.error('Failed to load video:', localPost.mediaUrl);
                  }}
                >
                  <source src={localPost.mediaUrl} type="video/mp4" />
                  Trình duyệt không hỗ trợ video này.
                </video>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center">
                    <FaLink className="mb-2 text-primary" size={24} />
                    <br />
                    <a
                      href={localPost.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm"
                    >
                      Xem tệp đính kèm
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
                    <span className="me-1" style={{ fontSize: "1.2em" }}>
                      {getReactionIcon(reaction)}
                    </span>
                    <span className="fw-semibold">{count}</span>
                  </span>
                ))}
              {totalReactions > 0 && (
                <span className="ms-2 text-primary fw-semibold">
                  {totalReactions} {totalReactions === 1 ? 'lượt thích' : 'lượt thích'}
                </span>
              )}
            </div>
            <div>
              {comments.length > 0 && (
                <span
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                  className="text-decoration-underline text-primary fw-semibold"
                >
                  {comments.length} bình luận
                </span>
              )}
            </div>
          </div>
        )}

        <hr className="my-3" style={{ opacity: 0.2 }} />

        {/* Action Buttons */}
        <div className="d-flex justify-content-around">
          {/* Like Button with Reactions */}
          <div className="position-relative flex-fill">
            <button
              className={`btn btn-link p-2 w-100 border-0 rounded-pill ${currentUserReaction ? "text-primary fw-bold bg-primary bg-opacity-10" : "text-muted"
                }`}
              onClick={() => handleReaction(post.id, "Like")}
              onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
              disabled={isReacting}
              style={{
                transition: "all 0.2s",
                fontSize: '0.9rem'
              }}
            >
              <span style={{ fontSize: "1.2em", marginRight: "5px" }}>
                {currentUserReaction ? getReactionIcon(currentUserReaction) : "👍"}
              </span>
              {currentUserReaction ? getReactionText(currentUserReaction) : "Thích"}
            </button>

            {/* Reaction Picker */}
            {selectedPostIdForReactions === post.id && (
              <div
                className="position-absolute bg-white border rounded-pill shadow-lg p-2 d-flex gap-1"
                style={{
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                  marginBottom: "8px",
                  border: "2px solid #e9ecef"
                }}
                onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
                onMouseLeave={() => setTimeout(() => setSelectedPostIdForReactions(null), 200)}
              >
                {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((reaction) => (
                  <button
                    key={reaction}
                    className="btn btn-link p-2 rounded-circle"
                    onClick={() => handleReaction(post.id, reaction)}
                    title={getReactionText(reaction)}
                    style={{
                      fontSize: "1.5rem",
                      transition: "transform 0.2s",
                      border: "none",
                      background: "none",
                      width: "45px",
                      height: "45px"
                    }}
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

          {/* Comment Button */}
          <button
            className={`btn btn-link text-muted p-2 flex-fill border-0 rounded-pill ${selectedPostId === post.id ? 'bg-light' : ''
              }`}
            onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
            style={{ fontSize: '0.9rem' }}
          >
            <FaComment className="me-1" /> Bình luận
          </button>

          {/* Share Button */}
          <div className="position-relative flex-fill">
            <button
              className={`btn btn-link text-muted p-2 w-100 border-0 rounded-pill ${showShareMenu ? 'bg-light' : ''
                }`}
              onClick={() => setShowShareMenu(!showShareMenu)}
              style={{ fontSize: '0.9rem' }}
            >
              <FaShare className="me-1" /> Chia sẻ
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <>
                <div
                  className="position-fixed w-100 h-100"
                  style={{
                    top: 0,
                    left: 0,
                    zIndex: 999
                  }}
                  onClick={() => setShowShareMenu(false)}
                />
                <div
                  className="position-absolute bg-white border rounded shadow-lg p-3"
                  style={{
                    top: "100%",
                    right: "0",
                    zIndex: 1000,
                    minWidth: "220px",
                    marginTop: "8px",
                    borderRadius: '12px',
                    border: '2px solid #e9ecef'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted fw-bold">Chia sẻ bài viết</small>
                    <button
                      className="btn btn-link p-0 text-muted"
                      onClick={() => setShowShareMenu(false)}
                    >
                      <FaTimes size="14" />
                    </button>
                  </div>

                  <div className="d-grid gap-1">
                    <button
                      className="btn btn-light text-start p-2 border-0 rounded"
                      onClick={() => handleShare('copy')}
                    >
                      <FaLink className="me-2 text-primary" /> Sao chép link
                    </button>

                    <button
                      className="btn btn-light text-start p-2 border-0 rounded"
                      onClick={() => handleShare('copyWithContent')}
                    >
                      <FaLink className="me-2 text-success" /> Sao chép nội dung
                    </button>

                    {navigator.share && (
                      <button
                        className="btn btn-light text-start p-2 border-0 rounded"
                        onClick={() => handleShare('native')}
                      >
                        <FaShare className="me-2 text-info" /> Chia sẻ hệ thống
                      </button>
                    )}

                    <hr className="my-2" />

                    <button
                      className="btn btn-light text-start p-2 border-0 rounded"
                      onClick={() => handleShare('facebook')}
                    >
                      📘 Facebook
                    </button>

                    <button
                      className="btn btn-light text-start p-2 border-0 rounded"
                      onClick={() => handleShare('twitter')}
                    >
                      🐦 Twitter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {selectedPostId === post.id && (
          <>
            {comments.length > 0 && (
              <div className="mt-4">
                <hr />
                <div style={{ maxHeight: "400px", overflowY: "auto" }} className="pe-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="d-flex align-items-start mb-3">
                      <img
                        src={comment.userPhoto || "https://via.placeholder.com/30"}
                        alt="Commenter"
                        className="rounded-circle me-2 flex-shrink-0"
                        style={{ width: "35px", height: "35px", objectFit: "cover" }}
                      />
                      <div className="bg-light rounded-3 p-3 flex-grow-1" style={{ maxWidth: '80%' }}>
                        <small className="fw-bold d-block text-primary">{comment.userName}</small>
                        <p className="mb-2 small lh-base" style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: 'break-word'
                        }}>
                          {comment.content}
                        </p>
                        <small className="text-muted">{formatTimeAgo(comment.createdAt)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comment Input */}
            <div className="mt-4">
              <hr />
              <form onSubmit={handleCommentSubmit} className="d-flex gap-3 align-items-start">
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
                      placeholder="Viết bình luận..."
                      className="form-control border-2"
                      rows="2"
                      style={{
                        resize: "none",
                        borderRadius: '20px',
                        paddingRight: '60px'
                      }}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (commentText.trim()) {
                            handleCommentSubmit(e);
                          }
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm rounded-pill position-absolute"
                      style={{
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        minWidth: '50px'
                      }}
                      disabled={!commentText.trim()}
                    >
                      Đăng
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostItem;