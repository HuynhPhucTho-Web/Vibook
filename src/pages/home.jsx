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
import staticBlogData from "../../Staticblogposts.json";
import PostCreator from "../components/PostCreate";
import PostItem, { BlogPromoStrip } from "../components/PostItem";
import {
  FEED_PAGE_SIZE,
  mapPostDocs,
  mergeFirstPageIntoFeed,
  mergeUniquePosts,
} from "../utils/feedPosts";
import SEO from "../components/SEO";
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
  const [userDetails, setUserDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [blogPromos, setBlogPromos] = useState([]);
  const [friendUids, setFriendUids] = useState(new Set());
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isBlogsLoading, setIsBlogsLoading] = useState(true);
  const [blogLimit, setBlogLimit] = useState(5);
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

  useEffect(() => {
    let cancelled = false;
    const fetchBlogPromos = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "BlogPosts"), orderBy("createdAt", "desc"), limit(blogLimit)),
        );
        const blogs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate() : docSnap.data().createdAt,
          favoriteCount: docSnap.data().favoriteCount || 0,
          views: docSnap.data().views || 0,
        }));
        if (!cancelled) {
          const staticBlogs = (staticBlogData.posts || []).slice(0, blogLimit).map((post) => ({
            ...post,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            isStatic: true,
            favoriteCount: post.favoriteCount || 0,
            views: post.views || 0,
          }));
          const mergedBlogs = [...staticBlogs];
          blogs.forEach((blog) => {
            const key = blog.slug || blog.id || blog.title;
            const exists = mergedBlogs.some((item) => (item.slug || item.id || item.title) === key);
            if (!exists) {
              mergedBlogs.push(blog);
            }
          });

          // Fetch actual favorite counts from FavoriteBlogs
          try {
            const favsSnapshot = await getDocs(collection(db, "FavoriteBlogs"));
            const countsMap = {};
            favsSnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.blogId) {
                countsMap[data.blogId] = (countsMap[data.blogId] || 0) + 1;
              }
            });
            mergedBlogs.forEach(p => {
              const key = p.isStatic ? p.slug : p.id;
              p.favoriteCount = countsMap[key] || 0;
            });
          } catch (favErr) {
            console.error("Error loading promo favorite counts", favErr);
          }

          setBlogPromos(mergedBlogs);
          setIsBlogsLoading(false);
        }
      } catch (error) {
        console.error("Blog promo load error", error);
        if (!cancelled) {
          let staticBlogs = (staticBlogData.posts || []).slice(0, blogLimit).map((post) => ({
            ...post,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            isStatic: true,
            favoriteCount: post.favoriteCount || 0,
            views: post.views || 0,
          }));

          // Fetch actual favorite counts for fallback
          try {
            const favsSnapshot = await getDocs(collection(db, "FavoriteBlogs"));
            const countsMap = {};
            favsSnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.blogId) {
                countsMap[data.blogId] = (countsMap[data.blogId] || 0) + 1;
              }
            });
            staticBlogs = staticBlogs.map(p => ({
              ...p,
              favoriteCount: countsMap[p.slug] || 0
            }));
          } catch (favErr) {
            console.error("Error loading static fallback favorite counts", favErr);
          }

          setBlogPromos(staticBlogs);
          setIsBlogsLoading(false);
        }
      }
    };

    fetchBlogPromos();
    return () => {
      cancelled = true;
    };
  }, [blogLimit]);

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

    // 1) Immediate fetch for first paint (often faster than waiting on listener attach)
    (async () => {
      try {
        const snap = await getDocs(postsQuery);
        if (cancelled) return;
        const page = mapPostDocs(snap.docs);
        setPosts((prev) => mergeFirstPageIntoFeed(prev, page));
        setLastVisible(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === FEED_PAGE_SIZE);
        finishLoading();
      } catch (error) {
        console.error("Initial feed load error:", error);
        // Still attach realtime; listener may succeed
      }
    })();

    // 2) Live updates for newest page only (likes/new posts) — do not wipe "load more"
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
    return visiblePosts.map((post) => (
      <PostItem
        key={post.id}
        post={post}
        auth={auth}
        userDetails={userDetails}
        onPostDeleted={handlePostDeleted}
      />
    ));
  }, [visiblePosts, userDetails, handlePostDeleted]);

  return (
    <div className="page-shell">
      <SEO
        title="Trang chủ"
        description="Bảng tin ViBook - Mạng xã hội chia sẻ & kết nối bạn bè, cập nhật bài viết blog nổi bật và trò chuyện trực tuyến."
        slug="/homevibook"
      />
      <div className={`home-container home-container--${theme}`}>
        <PostCreator onPostCreated={handlePostCreated} />

        {isBlogsLoading ? (
          <BlogPromoStrip loading={true} isLight={theme === "light"} title="Blog nổi bật" />
        ) : blogPromos.length > 0 ? (
          <BlogPromoStrip
            blogs={blogPromos}
            isLight={theme === "light"}
            title="Blog nổi bật"
            onLoadMore={() => setBlogLimit((prev) => prev + 5)}
          />
        ) : null}

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
