import React, { useState, useEffect, useContext } from "react";
import { addDoc, doc, updateDoc, getDoc, deleteDoc, query, getDocs, onSnapshot, collection } from "firebase/firestore";
import { db } from "../components/firebase";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import PostHeader from "./post/PostHeader";
import PostContent from "./post/PostContent";
import PostMedia from "./post/PostMedia";
import PostStats from "./post/PostStats";
import PostActions from "./post/PostActions";
import PostComments from "./post/PostComments";
import "../style/PostItem.css";

const PostItem = ({ post, auth, userDetails, onPostDeleted, handlePrivatePost, isDetailView = false, customBgColor = '' }) => {
  const { theme } = useContext(ThemeContext);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [authorName, setAuthorName] = useState(localPost.userName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(localPost.content || "");
  const [isSaving, setIsSaving] = useState(false);


  const isLight = theme === "light";

  // Real-time listeners
  useEffect(() => {
    if (!post.id) return;
    const unsubPost = onSnapshot(doc(db, "Posts", post.id), (snap) => {
      if (snap.exists()) {
        setLocalPost({ ...snap.data(), id: snap.id });
      } else {
        onPostDeleted?.(post.id);
      }
    });
    return () => unsubPost();
  }, [post.id, onPostDeleted]);

  useEffect(() => {
    const unsubComments = onSnapshot(query(collection(db, "Posts", post.id, "comments")), (snap) => {
      setCommentCount(snap.docs.length);
    });
    return () => unsubComments();
  }, [post.id]);


  const handleRepostToTimeline = async () => {
    if (!auth?.currentUser) {
      toast.error("Bạn cần đăng nhập để chia sẻ");
      return;
    }
    try {
      const me = auth.currentUser;
      // Tạo post mới thuộc về người đang share
      await addDoc(collection(db, "Posts"), {
        userId: me.uid,
        userName: me.displayName || "Anonymous",
        userPhoto: me.photoURL || null,
        type: "share",
        content: "",             // cho phép người dùng chỉnh nội dung ở chỗ khác nếu muốn
        createdAt: Date.now(),   // hoặc serverTimestamp(), miễn rules không chặn
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
        // Trỏ về bài gốc để UI có thể hiển thị “đây là bài chia sẻ từ…”
        sharedFrom: {
          postId: localPost.id,
          userId: localPost.userId,
          userName: authorName || localPost.userName || "Anonymous",
        },
        // Nếu post gốc dùng mediaFiles:
        mediaFiles: Array.isArray(localPost.mediaFiles) ? localPost.mediaFiles : undefined,
        // Nếu post gốc dùng mediaUrls:
        mediaUrls: Array.isArray(localPost.mediaUrls) ? localPost.mediaUrls : undefined,
        status: "public",
      });
      toast.success("Đã chia sẻ lên trang cá nhân!");
    } catch (e) {
      console.error("repost error", e);
      toast.error("Chia sẻ thất bại");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Nếu đã có sẵn trong post thì dùng luôn
        if (localPost.userName && localPost.userPhoto) {
          if (mounted) {
            setAuthorName(localPost.userName);
          }
          return;
        }
        // Fetch từ Users/{userId} nếu thiếu
        if (localPost.userId) {
          const snap = await getDoc(doc(db, "Users", localPost.userId));
          if (mounted && snap.exists()) {
            const u = snap.data();
            setAuthorName(u.displayName || u.name || "Anonymous");
          }
        }
      } catch (e) {
        // bỏ qua lỗi: fallback phía dưới sẽ hiển thị "Anonymous"
        console.log("fetch author error", e);
      }
    })();
    return () => { mounted = false; };
  }, [localPost.userId, localPost.userName, localPost.userPhoto]);

  // Handlers
  const handleReaction = async (postId, reaction) => {
    if (isReacting || !auth.currentUser) return;
    setIsReacting(true);
    try {
      const postRef = doc(db, "Posts", postId);
      const snap = await getDoc(postRef);
      if (!snap.exists()) {
        toast.error("Bài viết không tồn tại");
        return;
      }

      const data = snap.data();
      const userId = auth.currentUser.uid;
      const likes = { ...data.likes };
      const reactedBy = { ...data.reactedBy };

      if (reactedBy[userId]) {
        const prev = reactedBy[userId];
        likes[prev] = Math.max(0, (likes[prev] || 0) - 1);
      }

      if (reactedBy[userId] === reaction) {
        delete reactedBy[userId];
      } else {
        likes[reaction] = (likes[reaction] || 0) + 1;
        reactedBy[userId] = reaction;
      }

      await updateDoc(postRef, { likes, reactedBy });
      setShowReactions(false);
    } catch (error) {
      console.error("React error:", error);
      toast.error("Không thể react");
    } finally {
      setIsReacting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Xóa bài viết này?")) return;
    setIsDeleting(true);
    try {
      const postRef = doc(db, "Posts", post.id);
      const snap = await getDoc(postRef);
      if (!snap.exists() || snap.data().userId !== auth.currentUser?.uid) {
        toast.error("Không thể xóa");
        return;
      }

      const commentsSnap = await getDocs(query(collection(db, "Posts", post.id, "comments")));
      await Promise.all([
        ...commentsSnap.docs.map((d) => deleteDoc(d.ref)),
        deleteDoc(postRef),
      ]);

      toast.success("Đã xóa bài viết");
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi khi xóa");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }
    setIsSaving(true);
    try {
      const postRef = doc(db, "Posts", post.id);
      await updateDoc(postRef, { content: editContent.trim() });
      toast.success("Đã cập nhật bài viết");
      setIsEditing(false);
    } catch (error) {
      console.error("Save edit error:", error);
      toast.error("Lỗi khi lưu thay đổi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(localPost.content || "");
    setIsEditing(false);
  };



  return (
    <div
      id={`post-${post.id}`}
      className={`post-item-container ${isLight ? 'light' : 'dark'} ${!isDetailView ? "mb-3 sm:mb-4" : ""}`}
      style={customBgColor ? { backgroundColor: customBgColor } : {}}
    >
      <PostHeader
        post={localPost}
        auth={auth}
        isLight={isLight}
        isDeleting={isDeleting}
        onEdit={() => {
          setIsEditing(true);
          setEditContent(localPost.content || "");
        }}
        onPrivate={handlePrivatePost}
        onDelete={handleDeletePost}
      />

      <PostContent
        post={localPost}
        isLight={isLight}
        isEditing={isEditing}
        editContent={editContent}
        setEditContent={setEditContent}
        isSaving={isSaving}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />

      <PostMedia post={localPost} isLight={isLight} />

      <PostStats
        post={localPost}
        commentCount={commentCount}
        isLight={isLight}
        onCommentClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
      />

      {/* Divider */}
      <div className={`mx-4 border-t ${isLight ? "border-gray-100" : "border-zinc-800"}`} />

      <PostActions
        post={localPost}
        auth={auth}
        isLight={isLight}
        selectedPostId={selectedPostId}
        setSelectedPostId={setSelectedPostId}
        showReactions={showReactions}
        setShowReactions={setShowReactions}
        isReacting={isReacting}
        onReaction={handleReaction}
        onRepostToTimeline={handleRepostToTimeline}
      />

      <PostComments
        postId={post.id}
        auth={auth}
        userDetails={userDetails}
        selectedPostId={selectedPostId}
        setSelectedPostId={setSelectedPostId}
      />
    </div>
  );
};

export default PostItem;
