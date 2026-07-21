import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";
import { FaCheck, FaGlobeAmericas, FaLock, FaSearch, FaTag, FaTimes, FaUserFriends } from "react-icons/fa";
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
import "../style/PostItem.css";

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
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
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

  useEffect(() => setLocalPost(post), [post]);

  useEffect(() => {
    if (!isDetailView || !post.id) return undefined;
    return onSnapshot(doc(db, "Posts", post.id), (snapshot) => {
      if (snapshot.exists()) setLocalPost({ id: snapshot.id, ...snapshot.data() });
      else onPostDeleted?.(post.id);
    });
  }, [isDetailView, onPostDeleted, post.id]);

  useEffect(() => {
    if (!isDetailView || !post.id) return undefined;
    return onSnapshot(query(collection(db, "Posts", post.id, "comments")), (snapshot) => {
      setCommentCount(snapshot.docs.reduce((total, item) => total + 1 + (item.data().replyCount || 0), 0));
    });
  }, [isDetailView, post.id]);

  useEffect(() => {
    const userId = auth?.currentUser?.uid;
    if (!userId || !post.id) return undefined;
    return onSnapshot(doc(db, "SavedPosts", `${userId}_${post.id}`), (snapshot) => setIsSaved(snapshot.exists()));
  }, [auth?.currentUser?.uid, post.id]);

  useEffect(() => {
    const originalId = localPost.sharedPostId || localPost.sharedFrom?.postId;
    if (localPost.type !== "share" || !originalId) {
      setSharedPost(null);
      return undefined;
    }
    setSharedPostLoading(true);
    return onSnapshot(doc(db, "Posts", originalId), (snapshot) => {
      setSharedPost(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      setSharedPostLoading(false);
    }, () => {
      setSharedPost(null);
      setSharedPostLoading(false);
    });
  }, [localPost.sharedFrom?.postId, localPost.sharedPostId, localPost.type]);

  const handleReaction = async (postId, reaction) => {
    if (isReacting) return;
    const user = requireLogin({
      navigate,
      message: t("loginRequired"),
    });
    if (!user) return;
    const userId = user.uid;
    setIsReacting(true);
    try {
      const postRef = doc(db, "Posts", postId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(postRef);
        if (!snapshot.exists()) throw new Error(t("originalPostNotFound"));
        const data = snapshot.data();
        const likes = { ...data.likes };
        const reactedBy = { ...data.reactedBy };
        const previous = reactedBy[userId];
        if (previous) likes[previous] = Math.max(0, (likes[previous] || 0) - 1);
        if (previous === reaction) delete reactedBy[userId];
        else {
          likes[reaction] = (likes[reaction] || 0) + 1;
          reactedBy[userId] = reaction;
        }
        transaction.update(postRef, { likes, reactedBy });
      });
      setShowReactions(false);
    } catch (error) {
      console.error("React error", error);
      toast.error(error.message || t("reactionFailed"));
    } finally {
      setIsReacting(false);
    }
  };

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
    setIsSavingPost(true);
    try {
      const savedRef = doc(db, "SavedPosts", `${userId}_${post.id}`);
      if (isSaved) await deleteDoc(savedRef);
      else await setDoc(savedRef, { userId, postId: post.id, savedAt: serverTimestamp() });
      toast.success(isSaved ? t("postUnsaved") : t("postSaved"));
    } catch (error) {
      console.error("Save post error", error);
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
        onPrivate={handlePrivatePost}
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

export default PostItem;
