import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../components/firebase";
import { doc, onSnapshot, getDoc, collection, query, where } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";
import PostItem from "../components/PostItem";
import SEO from "../components/SEO";
import { useMemo } from "react";
import "../style/Home.css";

function PostDetail() {
  const { theme } = useContext(ThemeContext);
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [checkingFriendship, setCheckingFriendship] = useState(true);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!post || !currentUid || post.userId === currentUid || post.status !== "friends") {
      setIsFriend(false);
      setCheckingFriendship(false);
      return undefined;
    }

    setCheckingFriendship(true);
    const q = query(
      collection(db, "Friendships"),
      where("participants", "array-contains", currentUid),
      where("status", "==", "accepted")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const isFriendPostAuthor = snapshot.docs.some((docSnap) => {
        const parts = docSnap.data().participants || [];
        return parts.includes(post.userId);
      });
      setIsFriend(isFriendPostAuthor);
      setCheckingFriendship(false);
    }, () => {
      setCheckingFriendship(false);
    });

    return () => unsub();
  }, [post]);

  const isAuthorizedToView = useMemo(() => {
    if (!post) return false;
    if (!post.status || post.status === "public") return true;
    if (auth.currentUser && post.userId === auth.currentUser.uid) return true;
    if (post.status === "friends") return isFriend;
    return false;
  }, [post, isFriend]);

  const postSchema = useMemo(() => {
    if (!post) return null;
    let publishDate = new Date().toISOString();
    try {
      if (post.createdAt) {
        publishDate = post.createdAt.toDate ? post.createdAt.toDate().toISOString() : new Date(post.createdAt).toISOString();
      }
    } catch (err) {
      // ignore
    }
    return {
      "@context": "https://schema.org",
      "@type": "SocialMediaPosting",
      "headline": post.content ? (post.content.length > 80 ? `${post.content.substring(0, 80)}...` : post.content) : "Bài viết ThoDev",
      "image": post.mediaUrl || post.imageUrl || post.photo || "",
      "author": {
        "@type": "Person",
        "name": post.userName || "Người dùng ThoDev"
      },
      "datePublished": publishDate,
      "description": post.content || ""
    };
  }, [post]);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    // Post body only — comments load inside PostItem (isDetailView)
    const unsubscribePost = onSnapshot(
      doc(db, "Posts", postId),
      async (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          toast.error("Post not found");
          setPost(null);
          setLoading(false);
          return;
        }
        const postData = { id: snap.id, ...snap.data() };
        setPost(postData);
        setLoading(false);

        if (postData.userId) {
          try {
            const userDoc = await getDoc(doc(db, "Users", postData.userId));
            if (!cancelled && userDoc.exists()) {
              setUserDetails({ id: postData.userId, ...userDoc.data() });
            }
          } catch {
            // non-blocking
          }
        }
      },
      (error) => {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribePost();
    };
  }, [postId]);

  if (loading || (post && post.status === "friends" && checkingFriendship)) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!post || !isAuthorizedToView) {
    return (
      <div className="text-center py-5">
        <h5 className="text-muted">
          {!post ? "Post not found" : "Bài viết này là riêng tư hoặc chỉ hiển thị với bạn bè."}
        </h5>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <SEO
        title={post.content ? (post.content.length > 50 ? `${post.content.substring(0, 50)}...` : post.content) : `Bài viết của ${post.userName || "Người dùng"}`}
        description={post.content || "Xem bài viết chi tiết trên mạng xã hội ThoDev."}
        image={post.mediaUrl || post.imageUrl || post.photo || ""}
        slug={`/post/${post.id}`}
        type="article"
        schema={postSchema}
      />
      <div className="posts-list">
        <PostItem
          post={post}
          auth={auth}
          userDetails={userDetails}
          onPostDeleted={() => window.history.back()}
          isDetailView={true}
        />
      </div>
    </div>
  );
}

export default PostDetail;
