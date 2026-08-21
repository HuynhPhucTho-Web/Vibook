import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import { auth, db } from "../components/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  getDocs,
  getDoc,
  orderBy,
  limit,
  startAfter,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../context/ThemeContext";
import PostCreator from "../components/PostCreate";
import PostItem from "../components/PostItem";
import HomeBlogSection from "../components/HomeBlogSection";
import {
  FEED_PAGE_SIZE,
  mapPostDocs,
  mergeFirstPageIntoFeed,
  mergeUniquePosts,
} from "../utils/feedPosts";
import SEO from "../components/SEO";
import AdSense from "../components/AdSense";
import "../style/Home.css";

function FeedSkeleton({ count = 3 }) {
  return (
    <div className="feed-skeleton" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="feed-skeleton__card">
          <div className="feed-skeleton__row">
            <div className="feed-skeleton__avatar" />
            <div className="feed-skeleton__lines">
              <div className="feed-skeleton__line feed-skeleton__line--sm" />
              <div className="feed-skeleton__line feed-skeleton__line--xs" />
            </div>
          </div>
          <div className="feed-skeleton__line" />
          <div className="feed-skeleton__line feed-skeleton__line--md" />
          <div className="feed-skeleton__media" />
        </div>
      ))}
    </div>
  );
}

function Home() {
  const { theme } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friendUids, setFriendUids] = useState(new Set());
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  const lastVisibleRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setFriendUids(new Set());
      return undefined;
    }
    const q = query(
      collection(db, "Friendships"),
      where("participants", "array-contains", currentUid),
      where("status", "==", "accepted")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (cancelled) return;
      const uids = new Set();
      snapshot.docs.forEach((docSnap) => {
        const parts = docSnap.data().participants || [];
        parts.forEach((uid) => {
          if (uid !== currentUid) uids.add(uid);
        });
      });
      setFriendUids(uids);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [userDetails]);

  const visiblePosts = useMemo(() => {
    const currentUid = auth.currentUser?.uid;
    return posts.filter((post) => {
      if (!post.status || post.status === "public") return true;
      if (currentUid && post.userId === currentUid) return true;
      if (post.status === "friends") {
        return friendUids.has(post.userId);
      }
      return false;
    });
  }, [posts, friendUids]);

  // Keep refs in sync for IntersectionObserver (stable callback)
  useEffect(() => {
    lastVisibleRef.current = lastVisible;
  }, [lastVisible]);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    let cancelled = false;
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!cancelled) setCurrentUser(user);
      if (!user) {
        if (!cancelled) setUserDetails(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "Users", user.uid));
        if (!cancelled) {
          setUserDetails(snap.exists() ? snap.data() : null);
        }
      } catch {
        if (!cancelled) setUserDetails(null);
      }
    });
    return () => {
      cancelled = true;
      unsubAuth();
    };
  }, []);



  // Feed load: fast getDocs first → then live onSnapshot for first page only
  useEffect(() => {
    const postId = searchParams.get("postId");
    let unsubPosts = () => {};
    let cancelled = false;

    const finishLoading = () => {
      if (!cancelled) setIsPostsLoading(false);
    };

    if (postId) {
      const postRef = doc(db, "Posts", postId);
      unsubPosts = onSnapshot(
        postRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setPosts([{ id: docSnap.id, ...docSnap.data() }]);
          } else {
            toast.error("Post not found");
            setPosts([]);
          }
          setHasMore(false);
          finishLoading();
        },
        () => {
          toast.error("Failed to load post");
          finishLoading();
        },
      );
      return () => {
        cancelled = true;
        unsubPosts();
      };
    }

    const postsQuery = query(
      collection(db, "Posts"),
      orderBy("createdAt", "desc"),
      limit(FEED_PAGE_SIZE),
    );

    // Live updates for newest page only (likes/new posts) — do not wipe "load more"
    unsubPosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        if (cancelled) return;
        const page = mapPostDocs(snapshot.docs);
        setPosts((prev) => mergeFirstPageIntoFeed(prev, page));
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        // Only force false when first page is short; never re-open hasMore after end-of-feed
        if (snapshot.docs.length < FEED_PAGE_SIZE) {
          setHasMore(false);
          hasMoreRef.current = false;
        }
        finishLoading();
      },
      (error) => {
        console.error("Error loading posts:", error);
        toast.error("Failed to load posts");
        finishLoading();
      },
    );

    return () => {
      cancelled = true;
      unsubPosts();
    };
  }, [searchParams]);

  const handlePostCreated = useCallback((postData) => {
    setPosts((prev) => mergeUniquePosts([postData], prev));
  }, []);

  const handlePostDeleted = useCallback((postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (!hasMoreRef.current || loadingMoreRef.current || !lastVisibleRef.current) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const postsQuery = query(
        collection(db, "Posts"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisibleRef.current),
        limit(FEED_PAGE_SIZE),
      );
      const snapshot = await getDocs(postsQuery);
      const newPosts = mapPostDocs(snapshot.docs);
      setPosts((prev) => mergeUniquePosts(prev, newPosts));
      const nextLast = snapshot.docs[snapshot.docs.length - 1] || null;
      setLastVisible(nextLast);
      lastVisibleRef.current = nextLast;
      const more = snapshot.docs.length === FEED_PAGE_SIZE;
      setHasMore(more);
      hasMoreRef.current = more;
    } catch (error) {
      console.error("Error loading more posts:", error);
      toast.error("Failed to load more posts");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // Infinite scroll via IntersectionObserver (smoother than window scroll thrash)
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || searchParams.get("postId")) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMorePosts();
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMorePosts, searchParams, isPostsLoading, posts.length]);

  // Scroll to deep-linked post
  useEffect(() => {
    const postId = searchParams.get("postId");
    if (!postId || posts.length === 0) return undefined;
    const element = document.getElementById(`post-${postId}`);
    if (!element) return undefined;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("postId");
      window.history.replaceState({}, "", url);
    }, 800);
    return () => clearTimeout(t);
  }, [posts, searchParams]);

  const postList = useMemo(() => {
    return visiblePosts.map((post, index) => (
      <React.Fragment key={post.id}>
        {/* In-feed Ad unit (displays after every 3 posts) */}
        {index > 0 && index % 3 === 0 && (
          <div className="home-ad-container animate-fade-in" style={{
            margin: "15px 0",
            padding: "15px",
            background: theme === "dark" ? "rgba(30, 31, 39, 0.6)" : "white",
            border: theme === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "var(--vb-radius-md)",
            backdropFilter: "var(--vb-glass-blur)"
          }}>
            <AdSense adSlot="3748766178" adLayoutKey="-7j+dp+2e-4-27" />
          </div>
        )}
        <PostItem
          post={post}
          auth={auth}
          userDetails={userDetails}
          onPostDeleted={handlePostDeleted}
        />
      </React.Fragment>
    ));
  }, [visiblePosts, userDetails, handlePostDeleted, theme]);

  return (
    <div className="page-shell">
      <SEO
        title="Trang chủ"
        description="Bảng tin ThoDev - Mạng xã hội chia sẻ & kết nối bạn bè, cập nhật bài viết blog nổi bật và trò chuyện trực tuyến."
        slug="/feed"
      />
      <div className={`home-container home-container--${theme}`}>
        {currentUser && <PostCreator onPostCreated={handlePostCreated} />}

        <HomeBlogSection theme={theme} />

        <div className="posts-list">
          {isPostsLoading && posts.length === 0 ? (
            <FeedSkeleton count={3} />
          ) : posts.length > 0 ? (
            postList
          ) : (
            <div className="text-center py-5 feed-empty">
              <h5 className="text-muted mb-2">No posts available</h5>
              <p className="text-muted mb-0">Be the first to share something!</p>
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {!searchParams.get("postId") && hasMore && posts.length > 0 && (
            <div ref={loadMoreRef} className="feed-load-sentinel" aria-hidden="true">
              {loadingMore && (
                <div className="feed-load-more">
                  <div className="feed-load-more__dot" />
                  <div className="feed-load-more__dot" />
                  <div className="feed-load-more__dot" />
                </div>
              )}
            </div>
          )}

          {!hasMore && posts.length > 0 && !searchParams.get("postId") && (
            <p className="feed-end-hint text-muted text-center py-3">
              You’re all caught up
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
