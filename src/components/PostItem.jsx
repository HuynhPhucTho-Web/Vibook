import React, { useState, useContext, useEffect } from "react";
import { doc, updateDoc, collection, addDoc, getDoc, deleteDoc, query, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../contexts/ThemeContext";
import { FaComment, FaHeart, FaLaugh, FaSurprise, FaSadTear, FaAngry, FaTrash, FaShare, FaLink } from "react-icons/fa";

const PostItem = ({ post, auth, userDetails }) => {
  const { theme } = useContext(ThemeContext);
  const [commentText, setCommentText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostIdForReactions, setSelectedPostIdForReactions] = useState(null);
  const [comments, setComments] = useState(post.comments || []);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  // Real-time comments listener
  useEffect(() => {
    let unsubscribe;
    
    const fetchComments = async () => {
      if (selectedPostId === post.id) {
        try {
          // SỬA: "Posts" → "posts" để match với PostCreator
          const commentsQuery = query(collection(db, "posts", post.id, "comments"));
          unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const postComments = snapshot.docs.map((doc) => ({ 
              id: doc.id, 
              ...doc.data() 
            })).sort((a, b) => a.createdAt - b.createdAt); // Sort by time
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

  const handleReaction = async (postId, reaction) => {
    if (isReacting) return; // Prevent double clicks
    setIsReacting(true);
    
    try {
      // SỬA: "Posts" → "posts"
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        toast.error("Bài viết không tồn tại", { position: "top-center" });
        return;
      }

      const postData = postSnap.data();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        toast.error("Vui lòng đăng nhập để thả cảm xúc", { position: "top-center" });
        return;
      }

      const updatedLikes = { ...postData.likes };
      const updatedReactedBy = { ...postData.reactedBy };

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
        toast.success(`${getReactionText(reaction)} 👍`, { position: "top-center", autoClose: 1000 });
      }

      await updateDoc(postRef, { 
        likes: updatedLikes, 
        reactedBy: updatedReactedBy 
      });
      
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
    
    if (!auth.currentUser || !userDetails) {
      toast.error("Vui lòng đăng nhập để bình luận", { position: "top-center" });
      return;
    }
    
    try {
      const commentData = {
        userId: auth.currentUser.uid,
        userName: `${userDetails.firstName}${userDetails.lastName ? " " + userDetails.lastName : ""}` || 
                 auth.currentUser.displayName || 
                 auth.currentUser.email || 
                 "Người dùng",
        userPhoto: userDetails.photo || auth.currentUser.photoURL || "https://via.placeholder.com/30",
        content: commentText.trim(),
        createdAt: Date.now(),
      };
      
      // SỬA: "Posts" → "posts"
      const commentsRef = collection(db, "posts", post.id, "comments");
      await addDoc(commentsRef, commentData);
      
      setCommentText("");
      toast.success("Đã thêm bình luận!", { position: "top-center", autoClose: 1000 });
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(`Không thể thêm bình luận: ${error.message}`, { position: "top-center" });
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
    
    setIsDeleting(true);
    try {
      // SỬA: "Posts" → "posts"
      const postRef = doc(db, "posts", post.id);
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

      // Delete post
      await deleteDoc(postRef);
      
      // Delete all comments
      const commentsQuery = query(collection(db, "posts", post.id, "comments"));
      const commentsSnapshot = await getDocs(commentsQuery);
      const deletePromises = commentsSnapshot.docs.map((commentDoc) => deleteDoc(commentDoc.ref));
      await Promise.all(deletePromises);
      
      toast.success("Đã xóa bài viết thành công", { position: "top-center" });
      
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Không thể xóa bài viết", { position: "top-center" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async (type) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const shareText = `${post.content}\n\nXem bài viết tại: ${postUrl}`;
    
    try {
      switch (type) {
        case 'copy':
          await navigator.clipboard.writeText(postUrl);
          toast.success("Đã sao chép link!", { position: "top-center" });
          break;
          
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: `Bài viết của ${post.userName}`,
              text: post.content,
              url: postUrl,
            });
          } else {
            // Fallback to copy
            await navigator.clipboard.writeText(shareText);
            toast.success("Đã sao chép nội dung!", { position: "top-center" });
          }
          break;
          
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
          break;
          
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
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
    return url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
  };

  const isVideoUrl = (url) => {
    return url && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  };

  const currentUserReaction = post.reactedBy && post.reactedBy[auth.currentUser?.uid];

  return (
    <div className={`card mb-4 shadow-sm ${theme}`}>
      <div className="card-body">
        {/* Post Header */}
        <div className="d-flex align-items-center mb-3">
          <img
            src={post.userPhoto || userDetails?.photo || "https://via.placeholder.com/40"}
            alt="Profile"
            className="rounded-circle me-3"
            style={{ width: "40px", height: "40px", objectFit: "cover" }}
          />
          <div className="flex-grow-1">
            <p className="mb-0 fw-bold">{post.userName}</p>
            <small className="text-muted">{formatTimeAgo(post.createdAt)}</small>
          </div>
          {post.userId === auth.currentUser?.uid && (
            <button 
              className="btn btn-outline-danger btn-sm" 
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : <><FaTrash className="me-1" /> Xóa</>}
            </button>
          )}
        </div>

        {/* Post Content */}
        <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>

        {/* Post Media */}
        {post.mediaUrl && (
          <div className="mb-3">
            {isImageUrl(post.mediaUrl) ? (
              <img 
                src={post.mediaUrl} 
                alt="Post media" 
                className="img-fluid rounded"
                style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain" }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  console.error('Failed to load image:', post.mediaUrl);
                }}
              />
            ) : isVideoUrl(post.mediaUrl) ? (
              <video 
                controls 
                className="img-fluid rounded"
                style={{ maxWidth: "100%", maxHeight: "500px" }}
                onError={(e) => {
                  console.error('Failed to load video:', post.mediaUrl);
                }}
              >
                <source src={post.mediaUrl} type="video/mp4" />
                Trình duyệt không hỗ trợ video này.
              </video>
            ) : (
              <div className="alert alert-info">
                <FaLink className="me-2" />
                <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">
                  Xem tệp đính kèm
                </a>
              </div>
            )}
          </div>
        )}

        {/* Reaction Summary */}
        <div className="d-flex justify-content-between align-items-center mb-2 text-muted small">
          <div>
            {Object.entries(post.likes || {})
              .filter(([, count]) => count > 0)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([reaction, count]) => (
                <span key={reaction} className="me-2">
                  {getReactionIcon(reaction)} {count}
                </span>
              ))}
          </div>
          <div>
            {comments.length > 0 && (
              <span style={{ cursor: "pointer" }} onClick={() => setSelectedPostId(post.id)}>
                {comments.length} bình luận
              </span>
            )}
          </div>
        </div>

        <hr className="my-2" />

        {/* Action Buttons */}
        <div className="d-flex justify-content-around">
          {/* Like Button with Reactions */}
          <div className="position-relative flex-fill">
            <button
              className={`btn btn-link p-2 w-100 ${
                currentUserReaction ? "text-primary fw-bold" : "text-muted"
              }`}
              onClick={() => handleReaction(post.id, "Like")}
              onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
              onMouseLeave={() => setTimeout(() => setSelectedPostIdForReactions(null), 300)}
              disabled={isReacting}
            >
              {currentUserReaction ? getReactionIcon(currentUserReaction) : "👍"} {" "}
              {currentUserReaction ? getReactionText(currentUserReaction) : "Thích"}
            </button>
            
            {/* Reaction Picker */}
            {selectedPostIdForReactions === post.id && (
              <div
                className="position-absolute bg-white border rounded shadow-lg p-2 d-flex gap-1"
                style={{ 
                  bottom: "100%", 
                  left: "50%", 
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                  marginBottom: "5px"
                }}
                onMouseEnter={() => setSelectedPostIdForReactions(post.id)}
                onMouseLeave={() => setSelectedPostIdForReactions(null)}
              >
                {["Like", "Love", "Haha", "Wow", "Sad", "Angry"].map((reaction) => (
                  <button
                    key={reaction}
                    className="btn btn-link p-1 reaction-btn"
                    onClick={() => handleReaction(post.id, reaction)}
                    title={getReactionText(reaction)}
                    style={{ 
                      fontSize: "1.5rem",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.transform = "scale(1.3)"}
                    onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                  >
                    {getReactionIcon(reaction)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment Button */}
          <button
            className="btn btn-link text-muted p-2 flex-fill"
            onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
          >
            <FaComment className="me-1" /> Bình luận
          </button>

          {/* Share Button */}
          <div className="position-relative flex-fill">
            <button
              className="btn btn-link text-muted p-2 w-100"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <FaShare className="me-1" /> Chia sẻ
            </button>
            
            {/* Share Menu */}
            {showShareMenu && (
              <div 
                className="position-absolute bg-white border rounded shadow-lg p-2"
                style={{ 
                  top: "100%", 
                  right: "0",
                  zIndex: 1000,
                  minWidth: "150px",
                  marginTop: "5px"
                }}
              >
                <button
                  className="btn btn-link text-start w-100 p-2"
                  onClick={() => handleShare('copy')}
                >
                  <FaLink className="me-2" /> Sao chép link
                </button>
                
                {navigator.share && (
                  <button
                    className="btn btn-link text-start w-100 p-2"
                    onClick={() => handleShare('native')}
                  >
                    <FaShare className="me-2" /> Chia sẻ
                  </button>
                )}
                
                <button
                  className="btn btn-link text-start w-100 p-2"
                  onClick={() => handleShare('facebook')}
                >
                  📘 Facebook
                </button>
                
                <button
                  className="btn btn-link text-start w-100 p-2"
                  onClick={() => handleShare('twitter')}
                >
                  🐦 Twitter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="mt-3">
            <hr />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {comments.map((comment) => (
                <div key={comment.id} className="d-flex align-items-start mb-2">
                  <img
                    src={comment.userPhoto || "https://via.placeholder.com/30"}
                    alt="Commenter"
                    className="rounded-circle me-2"
                    style={{ width: "30px", height: "30px", objectFit: "cover" }}
                  />
                  <div className="bg-light rounded p-2 flex-grow-1">
                    <small className="fw-bold d-block">{comment.userName}</small>
                    <p className="mb-1 small" style={{ whiteSpace: "pre-wrap" }}>{comment.content}</p>
                    <small className="text-muted">{formatTimeAgo(comment.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comment Input */}
        {selectedPostId === post.id && (
          <div className="mt-3">
            <hr />
            <form onSubmit={handleCommentSubmit} className="d-flex gap-2 align-items-start">
              <img
                src={userDetails?.photo || auth.currentUser?.photoURL || "https://via.placeholder.com/30"}
                alt="Your avatar"
                className="rounded-circle"
                style={{ width: "30px", height: "30px", objectFit: "cover" }}
              />
              <div className="flex-grow-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="form-control"
                  rows="2"
                  style={{ resize: "none" }}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-sm px-3" 
                disabled={!commentText.trim()}
              >
                Đăng
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostItem;