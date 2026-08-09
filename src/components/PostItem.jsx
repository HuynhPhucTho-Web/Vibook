import React, { memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";
import { FaCheck, FaGlobeAmericas, FaLock, FaSearch, FaTag, FaTimes, FaUserFriends, FaHeart, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import { db } from "../components/firebase";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import PostHeader from "./post/PostHeader";
import PostContent from "./post/PostContent";
import PostMedia from "./post/PostMedia";
import PostStats from "./post/PostStats";
import PostActions from "./post/PostActions";
import PostComments from "./post/PostComments";
import { getPostHtml, normalizeSearchText, postHtmlToText, sanitizePostHtml } from "../utils/postContent";
import { requireLogin } from "../utils/requireLogin";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";
import "../style/PostItem.css";

export function BlogPromoStrip({ blogs = [], isLight = false, title = "Bài viết blog mới", onLoadMore, loading = false }) {
  const navigate = useNavigate();
  const listRef = useRef(null);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const handleMouseDown = (e) => {
      isDown = true;
      listEl.style.cursor = 'grabbing';
      listEl.style.userSelect = 'none';
      startX = e.pageX - listEl.offsetLeft;
      scrollLeft = listEl.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      listEl.style.cursor = 'grab';
      listEl.style.removeProperty('user-select');
    };

    const handleMouseUp = () => {
      isDown = false;
      listEl.style.cursor = 'grab';
      listEl.style.removeProperty('user-select');
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - listEl.offsetLeft;
      const walk = (x - startX) * 1.5; // scroll-fast multiplier
      listEl.scrollLeft = scrollLeft - walk;
    };

    listEl.addEventListener('mousedown', handleMouseDown);
    listEl.addEventListener('mouseleave', handleMouseLeave);
    listEl.addEventListener('mouseup', handleMouseUp);
    listEl.addEventListener('mousemove', handleMouseMove);

    return () => {
      listEl.removeEventListener('mousedown', handleMouseDown);
      listEl.removeEventListener('mouseleave', handleMouseLeave);
      listEl.removeEventListener('mouseup', handleMouseUp);
      listEl.removeEventListener('mousemove', handleMouseMove);
    };
  }, [loading, blogs]);

  if (loading) {
    return (
      <div className={`blog-promo-strip ${isLight ? "light" : "dark"} loading-state`}>
        <div className="blog-promo-strip__header">
          <div>
            <h4>{title}</h4>
          </div>
        </div>
        <div className="blog-promo-strip__list">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="blog-promo-card-skeleton">
              <div className="blog-promo-card-skeleton__image" />
              <div className="blog-promo-card-skeleton__body">
                <div className="blog-promo-card-skeleton__meta" />
                <div className="blog-promo-card-skeleton__title" />
                <div className="blog-promo-card-skeleton__text" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const validBlogs = (blogs || []).filter(Boolean);
  if (!validBlogs.length) return null;

  return (
    <div className={`blog-promo-strip ${isLight ? "light" : "dark"}`}>
      <div className="blog-promo-strip__header">
        <div>
          <h4>{title}</h4>
        </div>
        <button type="button" className="blog-promo-strip__view-all" onClick={() => navigate("/blog")}>
          Xem tất cả
        </button>
      </div>

      <div 
        ref={listRef} 
        className="blog-promo-strip__list" 
        role="list"
        style={{ cursor: 'grab' }}
      >
        {validBlogs.map((blog) => {
          const safeBlog = blog || {};
          const cover = safeBlog.coverImage || safeBlog.image || "/images/default-blog-cover.jpg";
          const summary = safeBlog.description || safeBlog.contentText || "Đọc thêm để khám phá bài viết này.";
          const titleText = safeBlog.title || "Bài viết blog";
          const category = safeBlog.category || "Blog";
          const dateLabel = safeBlog.createdAt?.toLocaleDateString?.() || "Mới";

          return (
            <Link
              key={safeBlog.id || safeBlog.slug || titleText}
              to={`/blog/${safeBlog.slug || safeBlog.id || ""}`}
              className="blog-promo-card"
              role="listitem"
              onDragStart={(e) => e.preventDefault()}
            >
              <img
                src={getOptimizedCloudinaryUrl(cover, 360)}
                alt={titleText}
                className="blog-promo-card__image"
                loading="lazy"
                decoding="async"
                onDragStart={(e) => e.preventDefault()}
              />
              <div className="blog-promo-card__body">
                <div className="blog-promo-card__meta">
                  <span>{category}</span>
                  <span>{dateLabel}</span>
                </div>
                <h5>{titleText}</h5>
                <p>{summary}</p>
                <div 
                  className="blog-promo-card__stats" 
                  style={{ 
                    marginTop: "auto", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    fontSize: "0.75rem", 
                    opacity: 0.72,
                    paddingTop: "6px",
                    borderTop: "1px dashed var(--vb-glass-border, rgba(128,128,128,0.1))"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <FaEye /> {safeBlog.views || 0}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--vb-error, #ffb4ab)" }}>
                    <FaHeart /> {safeBlog.favoriteCount || 0}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {onLoadMore && (
          <button 
            type="button" 
            className="blog-promo-load-more-card" 
            onClick={onLoadMore}
          >
            <div className="blog-promo-load-more-card__content">
              <span className="plus-icon">+</span>
              <span>Xem thêm</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

const PostItem = ({ post, auth, userDetails, onPostDeleted, handlePrivatePost, isDetailView = false, customBgColor = "" }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const isLight = theme === "light";
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [commentCount, setCommentCount] = useState(
    post.commentCount ?? post.comments?.length ?? 0,
  );
  /** Prevent parent snapshot from wiping optimistic reaction UI mid-flight */
  const reactionPendingRef = useRef(false);
  const reactionInFlightRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(getPostHtml(post));
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [sharedPost, setSharedPost] = useState(null);
  const [sharedPostLoading, setSharedPostLoading] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [shareDescription, setShareDescription] = useState("");
  const [sharePrivacy, setSharePrivacy] = useState("public");
  const [taggedFriends, setTaggedFriends] = useState([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  useEffect(() => {
    if (!showRepostModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !isReposting) setShowRepostModal(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isReposting, showRepostModal]);

  // Sync server post → local; keep optimistic likes/reactedBy while reaction is in flight
  useEffect(() => {
    setLocalPost((prev) => {
      if (!reactionPendingRef.current || prev?.id !== post.id) return post;
      return {
        ...post,
        likes: prev.likes,
        reactedBy: prev.reactedBy,
      };
    });
    if (typeof post.commentCount === "number") {
      setCommentCount(post.commentCount);
    } else if (Array.isArray(post.comments)) {
      setCommentCount(post.comments.length);
    }
  }, [post]);

  useEffect(() => {
    if (!isDetailView || !post.id) return undefined;
    return onSnapshot(doc(db, "Posts", post.id), (snapshot) => {
      if (!snapshot.exists()) {
        onPostDeleted?.(post.id);
        return;
      }
      const next = { id: snapshot.id, ...snapshot.data() };
      setLocalPost((prev) => {
        if (reactionPendingRef.current && prev?.id === next.id) {
          return { ...next, likes: prev.likes, reactedBy: prev.reactedBy };
        }
        return next;
      });
    });
  }, [isDetailView, onPostDeleted, post.id]);

  // Comment count: prefer denormalized field; full count only on detail (not N queries on feed)
  useEffect(() => {
    if (!isDetailView || !post.id) return undefined;
    return onSnapshot(query(collection(db, "Posts", post.id, "comments")), (snapshot) => {
      setCommentCount(
        snapshot.docs.reduce(
          (total, item) => total + 1 + (item.data().replyCount || 0),
          0,
        ),
      );
    });
  }, [isDetailView, post.id]);

  // Saved flag: one-shot getDoc (not a permanent listener per feed card)
  useEffect(() => {
    const userId = auth?.currentUser?.uid;
    if (!userId || !post.id) {
      setIsSaved(false);
      return undefined;
    }
    let cancelled = false;
    getDoc(doc(db, "SavedPosts", `${userId}_${post.id}`))
      .then((snap) => {
        if (!cancelled) setIsSaved(snap.exists());
      })
      .catch(() => {
        if (!cancelled) setIsSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth?.currentUser?.uid, post.id]);

  // Shared original post: getDoc once (not live listener)
  useEffect(() => {
    const originalId = localPost.sharedPostId || localPost.sharedFrom?.postId;
    if (localPost.type !== "share" || !originalId) {
      setSharedPost(null);
      setSharedPostLoading(false);
      return undefined;
    }
    let cancelled = false;
    setSharedPostLoading(true);
    getDoc(doc(db, "Posts", originalId))
      .then((snapshot) => {
        if (cancelled) return;
        setSharedPost(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        );
      })
      .catch(() => {
        if (!cancelled) setSharedPost(null);
      })
      .finally(() => {
        if (!cancelled) setSharedPostLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [localPost.sharedFrom?.postId, localPost.sharedPostId, localPost.type]);

  const applyReactionLocally = useCallback((prevPost, userId, reaction) => {
    const likes = {
      Like: 0,
      Love: 0,
      Haha: 0,
      Wow: 0,
      Sad: 0,
      Angry: 0,
      ...(prevPost.likes || {}),
    };
    const reactedBy = { ...(prevPost.reactedBy || {}) };
    const previous = reactedBy[userId];
    if (previous) likes[previous] = Math.max(0, (likes[previous] || 0) - 1);
    if (previous === reaction) {
      delete reactedBy[userId];
    } else {
      likes[reaction] = (likes[reaction] || 0) + 1;
      reactedBy[userId] = reaction;
    }
    return { likes, reactedBy, previous };
  }, []);

  /**
   * Optimistic reaction: UI updates immediately, Firestore transaction runs in background.
   * Avoids waiting on network + feed-wide comment reloads for a snappy like.
   */
  const handleReaction = useCallback(
    async (postId, reaction) => {
      if (reactionInFlightRef.current) return;
      const user = requireLogin({
        navigate,
        title: t("loginToastTitle"),
        message: t("loginToReact"),
        loginLabel: t("login"),
      });
      if (!user) return;
      const userId = user.uid;

      const snapshotBefore = localPost;
      const { likes: nextLikes, reactedBy: nextReactedBy } = applyReactionLocally(
        snapshotBefore,
        userId,
        reaction,
      );

      // Optimistic UI first
      reactionPendingRef.current = true;
      reactionInFlightRef.current = true;
      setIsReacting(true);
      setShowReactions(false);
      setLocalPost((prev) =>
        prev.id === postId
          ? { ...prev, likes: nextLikes, reactedBy: nextReactedBy }
          : prev,
      );

      try {
        const postRef = doc(db, "Posts", postId);
        const committed = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(postRef);
          if (!snapshot.exists()) throw new Error(t("originalPostNotFound"));
          const data = snapshot.data();
          const { likes, reactedBy } = applyReactionLocally(data, userId, reaction);
          // Only write reaction fields — smaller payload, less contention
          transaction.update(postRef, { likes, reactedBy });
          return { likes, reactedBy };
        });
        // Align UI with server truth (handles concurrent reactions)
        setLocalPost((prev) =>
          prev.id === postId
            ? { ...prev, likes: committed.likes, reactedBy: committed.reactedBy }
            : prev,
        );
      } catch (error) {
        console.error("React error", error);
        // Rollback optimistic state
        setLocalPost((prev) =>
          prev.id === postId
            ? {
                ...prev,
                likes: snapshotBefore.likes,
                reactedBy: snapshotBefore.reactedBy,
              }
            : prev,
        );
        toast.error(error.message || t("reactionFailed"));
      } finally {
        reactionPendingRef.current = false;
        reactionInFlightRef.current = false;
        setIsReacting(false);
      }
    },
    [applyReactionLocally, localPost, navigate, t],
  );

  const loadFriendsForTagging = async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser || friendsLoaded || friendsLoading) return;
    setFriendsLoading(true);
    try {
      const friendshipSnapshot = await getDocs(query(
        collection(db, "Friendships"),
        where("participants", "array-contains", currentUser.uid),
      ));
      const friendIds = [...new Set(friendshipSnapshot.docs
        .filter((item) => item.data().status === "accepted")
        .map((item) => (item.data().participants || []).find((uid) => uid !== currentUser.uid))
        .filter(Boolean))];
      const userSnapshots = await Promise.all(friendIds.map((uid) => getDoc(doc(db, "Users", uid))));
      setFriends(userSnapshots.filter((snapshot) => snapshot.exists()).map((snapshot) => {
        const data = snapshot.data();
        return {
          uid: snapshot.id,
          name: data.displayName || `${data.firstName || ""} ${data.lastName || ""}`.trim() || t("vibookUser"),
          photo: data.photoURL || data.photo || "/default-avatar.png",
        };
      }));
      setFriendsLoaded(true);
    } catch (error) {
      console.error("Load friends for tagging error", error);
      toast.error(t("loadFriendsFailed"));
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleRepostToTimeline = () => {
    if (!requireLogin({ navigate, message: t("loginToShare") })) return;
    setShareDescription("");
    setSharePrivacy("public");
    setTaggedFriends([]);
    setFriendSearch("");
    setShowRepostModal(true);
    loadFriendsForTagging();
  };

  const closeRepostModal = () => {
    if (isReposting) return;
    setShowRepostModal(false);
    setFriendSearch("");
  };

  const toggleTaggedFriend = (friend) => {
    setTaggedFriends((current) => {
      if (current.some((item) => item.uid === friend.uid)) {
        return current.filter((item) => item.uid !== friend.uid);
      }
      if (current.length >= 20) {
        toast.info(t("maxTaggedFriends"));
        return current;
      }
      return [...current, friend];
    });
  };

  const handleConfirmRepost = async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser || isReposting) return;
    const originalId = localPost.type === "share"
      ? localPost.sharedPostId || localPost.sharedFrom?.postId
      : localPost.id;
    if (!originalId) return toast.error(t("originalPostNotFound"));
    const description = shareDescription.trim();
    setIsReposting(true);
    try {
      await addDoc(collection(db, "Posts"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        userPhoto: currentUser.photoURL || null,
        type: "share",
        content: description,
        contentHtml: "",
        contentText: description,
        searchText: normalizeSearchText(description),
        createdAt: serverTimestamp(),
        likes: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 },
        reactedBy: {},
        comments: [],
        sharedPostId: originalId,
        sharedFrom: {
          postId: originalId,
          userId: sharedPost?.userId || localPost.userId,
          userName: sharedPost?.userName || localPost.userName || "Anonymous",
        },
        status: sharePrivacy,
        taggedFriendIds: taggedFriends.map((friend) => friend.uid),
        taggedFriends: taggedFriends.map(({ uid, name, photo }) => ({ uid, name, photo })),
      });
      setShowRepostModal(false);
      setShareDescription("");
      setTaggedFriends([]);
      toast.success(t("shareSuccess"));
    } catch (error) {
      console.error("Repost error", error);
      toast.error(error.message || t("shareFailed"));
    } finally {
      setIsReposting(false);
    }
  };

  const handleToggleSave = async () => {
    const user = requireLogin({ navigate, message: t("loginToSave") });
    if (!user) return;
    const userId = user.uid;
    const prev = isSaved;
    // Optimistic save toggle
    setIsSaved(!prev);
    setIsSavingPost(true);
    try {
      const savedRef = doc(db, "SavedPosts", `${userId}_${post.id}`);
      if (prev) await deleteDoc(savedRef);
      else await setDoc(savedRef, { userId, postId: post.id, savedAt: serverTimestamp() });
      toast.success(prev ? t("postUnsaved") : t("postSaved"));
    } catch (error) {
      console.error("Save post error", error);
      setIsSaved(prev);
      toast.error(t("savePostFailed"));
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleShare = async (mode) => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = postHtmlToText(getPostHtml(localPost));
    try {
      if (mode === "native" && navigator.share) await navigator.share({ title: "Vibook", text, url });
      else await navigator.clipboard.writeText(mode === "copyWithContent" ? `${text}\n${url}`.trim() : url);
      toast.success(mode === "native" ? t("shareOpened") : t("copied"));
    } catch (error) {
      if (error?.name !== "AbortError") toast.error(t("shareActionFailed"));
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm(t("confirmDeletePost"))) return;
    setIsDeleting(true);
    try {
      const postRef = doc(db, "Posts", post.id);
      const snapshot = await getDoc(postRef);
      if (!snapshot.exists() || snapshot.data().userId !== auth?.currentUser?.uid) throw new Error(t("cannotDeletePost"));
      const commentsSnapshot = await getDocs(query(collection(db, "Posts", post.id, "comments")));
      const replySnapshots = await Promise.all(commentsSnapshot.docs.map((commentDocument) =>
        getDocs(collection(db, "Posts", post.id, "comments", commentDocument.id, "replies"))
      ));
      await Promise.all([
        ...replySnapshots.flatMap((replySnapshot) => replySnapshot.docs.map((item) => deleteDoc(item.ref))),
        ...commentsSnapshot.docs.map((item) => deleteDoc(item.ref)),
        deleteDoc(postRef),
      ]);
      onPostDeleted?.(post.id);
      toast.success(t("postDeleted"));
    } catch (error) {
      toast.error(error.message || t("deletePostFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    const title = editTitle.trim();
    const contentHtml = sanitizePostHtml(editContent);
    const contentText = postHtmlToText(contentHtml);
    if (!title) return toast.error(t("postTitleRequired"));
    if (!contentText && !/<img\b/i.test(contentHtml)) return toast.error(t("postContentRequired"));
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "Posts", post.id), {
        title,
        content: contentText,
        contentHtml,
        contentText,
        searchText: normalizeSearchText(`${title} ${contentText}`),
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
      toast.success(t("postUpdated"));
    } catch (error) {
      console.error("Edit post error", error);
      toast.error(t("updatePostFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrivacyChange = async (newPrivacy) => {
    try {
      await updateDoc(doc(db, "Posts", post.id), {
        status: newPrivacy,
      });
      setLocalPost((prev) => ({ ...prev, status: newPrivacy }));
      toast.success(t("postUpdated") || "Cập nhật quyền riêng tư thành công");
    } catch (e) {
      console.error("Error updating post privacy", e);
      toast.error(t("updatePostFailed") || "Không thể cập nhật quyền riêng tư");
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLocaleLowerCase().includes(friendSearch.trim().toLocaleLowerCase())
  );

  return (
    <div id={`post-${post.id}`} className={`post-item-container ${isLight ? "light" : "dark"} ${!isDetailView ? "mb-3 sm:mb-4" : ""}`} style={{ ...(customBgColor ? { backgroundColor: customBgColor } : {}), overflow: "visible", position: "relative" }}>
      <PostHeader
        post={localPost}
        auth={auth}
        isLight={isLight}
        isDeleting={isDeleting}
        onEdit={() => { setIsEditing(true); setEditTitle(localPost.title || ""); setEditContent(getPostHtml(localPost)); }}
        onPrivacyChange={handlePrivacyChange}
        onDelete={handleDeletePost}
      />
      {localPost.taggedFriends?.length > 0 && (
        <div className={`post-tagged-summary ${isLight ? "light" : "dark"}`}>
          <FaTag aria-hidden="true" />
          <span>
            {t("sharedWith")} {localPost.taggedFriends.map((friend) => friend.name).filter(Boolean).join(", ")}
          </span>
        </div>
      )}
      <PostContent post={localPost} isLight={isLight} isEditing={isEditing} editTitle={editTitle} setEditTitle={setEditTitle} editContent={editContent} setEditContent={setEditContent} isSaving={isSaving} onSaveEdit={handleSaveEdit} onCancelEdit={() => { setEditTitle(localPost.title || ""); setEditContent(getPostHtml(localPost)); setIsEditing(false); }} />
      {localPost.type !== "share" && <PostMedia post={localPost} isLight={isLight} />}

      {localPost.type === "share" && (
        <div className={`shared-post-card ${isLight ? "bg-gray-50" : "bg-zinc-950"}`}>
          {sharedPostLoading ? <div className="p-5 text-center opacity-70">{t("loadingOriginalPost")}</div> : sharedPost ? (
            <>
              <div className="px-4 pt-4 pb-2">
                <div className="font-semibold">{sharedPost.userName || localPost.sharedFrom?.userName || t("vibookUser")}</div>
                <div className="text-xs opacity-60">{t("sharedPost")}</div>
              </div>
              <PostContent post={sharedPost} isLight={isLight} />
              <PostMedia post={sharedPost} isLight={isLight} />
            </>
          ) : <div className="p-5 text-center opacity-70">{t("originalPostUnavailable")}</div>}
        </div>
      )}

      <PostStats post={localPost} commentCount={commentCount} isLight={isLight} onCommentClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)} />
      <div className={`mx-4 border-t ${isLight ? "border-gray-100" : "border-zinc-800"}`} />
      <PostActions post={localPost} auth={auth} isLight={isLight} selectedPostId={selectedPostId} setSelectedPostId={setSelectedPostId} showReactions={showReactions} setShowReactions={setShowReactions} isReacting={isReacting} onReaction={handleReaction} onShare={handleShare} onRepostToTimeline={handleRepostToTimeline} isSaved={isSaved} isSavingPost={isSavingPost} onToggleSave={handleToggleSave} />
      <PostComments postId={post.id} auth={auth} userDetails={userDetails} selectedPostId={selectedPostId} setSelectedPostId={setSelectedPostId} />

      {showRepostModal && (
        <div className="post-share-modal-backdrop" onMouseDown={closeRepostModal}>
          <section
            className={`post-share-modal ${isLight ? "light" : "dark"}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`share-modal-title-${post.id}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="post-share-modal-header">
              <h3 id={`share-modal-title-${post.id}`}>{t("sharePost")}</h3>
              <button type="button" onClick={closeRepostModal} disabled={isReposting} aria-label={t("close")}>
                <FaTimes />
              </button>
            </header>

            <div className="post-share-modal-body">
              <div className="post-share-owner-row">
                <img src={auth.currentUser?.photoURL || "/default-avatar.png"} alt="" />
                <div>
                  <strong>{auth.currentUser?.displayName || t("vibookUser")}</strong>
                  <div className="post-share-privacy-select">
                    {sharePrivacy === "public" ? <FaGlobeAmericas /> : sharePrivacy === "friends" ? <FaUserFriends /> : <FaLock />}
                    <select value={sharePrivacy} onChange={(event) => setSharePrivacy(event.target.value)} disabled={isReposting}>
                      <option value="public">{t("publicVisibility")}</option>
                      <option value="friends">{t("friendsVisibility")}</option>
                      <option value="private">{t("privateVisibility")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <textarea
                value={shareDescription}
                onChange={(event) => setShareDescription(event.target.value)}
                placeholder={t("shareDescriptionPlaceholder")}
                maxLength={3000}
                disabled={isReposting}
                autoFocus
              />
              <div className="post-share-character-count">{shareDescription.length}/3000</div>

              <div className="post-share-original-preview">
                <strong>{sharedPost?.userName || localPost.sharedFrom?.userName || localPost.userName || t("vibookUser")}</strong>
                <span>{localPost.title || sharedPost?.title || postHtmlToText(getPostHtml(sharedPost || localPost)).slice(0, 180) || t("vibookPost")}</span>
              </div>

              <div className="post-share-tag-section">
                <div className="post-share-tag-heading">
                  <span><FaTag /> {t("tagFriends")}</span>
                  <small>{taggedFriends.length}/20</small>
                </div>
                <div className="post-share-friend-search">
                  <FaSearch aria-hidden="true" />
                  <input
                    type="search"
                    value={friendSearch}
                    onChange={(event) => setFriendSearch(event.target.value)}
                    placeholder={t("searchFriends")}
                    disabled={friendsLoading || isReposting}
                  />
                </div>
                <div className="post-share-friend-list">
                  {friendsLoading ? (
                    <div className="post-share-empty">{t("loadingFriends")}</div>
                  ) : filteredFriends.length > 0 ? filteredFriends.map((friend) => {
                    const selected = taggedFriends.some((item) => item.uid === friend.uid);
                    return (
                      <button
                        type="button"
                        key={friend.uid}
                        className={selected ? "selected" : ""}
                        onClick={() => toggleTaggedFriend(friend)}
                        disabled={isReposting}
                      >
                        <img src={friend.photo} alt="" />
                        <span>{friend.name}</span>
                        <i>{selected && <FaCheck />}</i>
                      </button>
                    );
                  }) : (
                    <div className="post-share-empty">{friendSearch ? t("noFriendsFound") : t("noFriendsToTag")}</div>
                  )}
                </div>
              </div>
            </div>

            <footer className="post-share-modal-footer">
              <button type="button" className="cancel" onClick={closeRepostModal} disabled={isReposting}>{t("cancel")}</button>
              <button type="button" className="confirm" onClick={handleConfirmRepost} disabled={isReposting}>
                {isReposting ? t("sharingNow") : t("shareNow")}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

// Avoid re-rendering every card when parent feed re-renders for unrelated reasons
export default memo(PostItem, (prev, next) => {
  if (prev.post?.id !== next.post?.id) return false;
  if (prev.isDetailView !== next.isDetailView) return false;
  if (prev.auth?.currentUser?.uid !== next.auth?.currentUser?.uid) return false;
  if (prev.userDetails !== next.userDetails) return false;
  if (prev.onPostDeleted !== next.onPostDeleted) return false;
  // Re-render when server post fields that matter for the card change
  const a = prev.post;
  const b = next.post;
  if (a === b) return true;
  return (
    a?.title === b?.title &&
    a?.content === b?.content &&
    a?.contentHtml === b?.contentHtml &&
    a?.updatedAt === b?.updatedAt &&
    a?.likes === b?.likes &&
    a?.reactedBy === b?.reactedBy &&
    a?.mediaFiles === b?.mediaFiles &&
    a?.status === b?.status &&
    a?.commentCount === b?.commentCount &&
    a?.type === b?.type
  );
});
