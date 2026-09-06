import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  deleteDoc,
  increment,
  limit,
  startAt,
  startAfter,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../components/firebase";
import { toast } from "react-toastify";
import { useSearch } from "../../context/SearchContext";
import { uploadToCloudinary } from "../../utils/cloudinary";
import {
  postHtmlToText,
  normalizeSearchText,
} from "../../utils/postContent";
import { useContext } from "react";
import { LanguageContext } from "../../context/LanguageContext";
import staticBlogData from "../../../Staticblogposts.json";
import BlogCard from "../../components/blog/BlogCard";
import SEO from "../../components/SEO";
import BlogDetail from "../../components/blog/BlogDetail";
import BlogFormModal from "../../components/blog/BlogFormModal";
import AdSense from "../../components/AdSense";
import { FaHeart, FaPlus } from "react-icons/fa";
import "../../style/Blog.css";

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "indent",
  "link",
  "image",
];

// Modules defined inside BlogPages now to handle custom image handlers.

const PRESET_CATEGORIES = [
  "React",
  "Node.js",
  "JavaScript",
  "TypeScript",
  "CSS",
  "Python",
  "Docker",
  "DevOps",
  "Database",
  "Mobile",
  "AI / ML",
  "Security",
  "Performance",
  "Tutorial",
  "Open Source",
];

const STATIC_POSTS = (staticBlogData.posts || []).map((p) => {
  const contentStr = Array.isArray(p.content) ? p.content.join("") : (p.content || "");
  const wordCount = contentStr.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  return {
    ...p,
    content: contentStr,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    isStatic: true,
    favoriteCount: p.favoriteCount || 0,
    readTime,
  };
});

const BlogCardSkeleton = () => (
  <div className="blog-card-skeleton">
    <div className="skeleton-image skeleton-shimmer"></div>
    <div className="skeleton-content">
      <div className="skeleton-meta">
        <div className="skeleton-badge skeleton-shimmer"></div>
        <div className="skeleton-date skeleton-shimmer"></div>
      </div>
      <div className="skeleton-title skeleton-shimmer"></div>
      <div className="skeleton-desc skeleton-desc-1 skeleton-shimmer"></div>
      <div className="skeleton-desc skeleton-desc-2 skeleton-shimmer"></div>
      <div className="skeleton-desc skeleton-desc-3 skeleton-shimmer"></div>
      <div className="skeleton-actions">
        <div className="skeleton-btn skeleton-btn-read skeleton-shimmer"></div>
        <div className="skeleton-btn skeleton-btn-fav skeleton-shimmer"></div>
        <div className="skeleton-btn skeleton-btn-action skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

let cachedBlogState = null;

const BlogPages = () => {
  const { t } = useContext(LanguageContext);
  const { slug } = useParams();
  const navigate = useNavigate();
  const isDetailView = !!slug;

  const quillRef = useRef(null);
  const isInitialMount = useRef(cachedBlogState ? false : true);
  const hasRestoredState = useRef(cachedBlogState ? true : false);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: () => {
          const input = document.createElement("input");
          input.setAttribute("type", "file");
          input.setAttribute("accept", "image/*");
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;
            try {
              toast.info("Đang tải ảnh lên...");
              const url = await uploadToCloudinary(file, { folder: "vibook/blog" });
              
              if (quillRef.current) {
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, "image", url);
                quill.setSelection(range.index + 1);
              }
              toast.success("Tải ảnh lên thành công!");
            } catch (err) {
              toast.error("Tải ảnh thất bại: " + err.message);
            }
          };
        }
      }
    }
  }), []);

  // States
  const [posts, setPosts] = useState(() => cachedBlogState?.posts ?? STATIC_POSTS);
  const [categories, setCategories] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const { keyword: searchTerm, setSearchConfig } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState(() => cachedBlogState?.selectedCategory ?? null);
  const [selectedTags, setSelectedTags] = useState(() => cachedBlogState?.selectedTags ?? []);
  const [sortBy, setSortBy] = useState(() => cachedBlogState?.sortBy ?? "newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(() => cachedBlogState?.showFavoritesOnly ?? false);
  const [currentPage, setCurrentPage] = useState(() => cachedBlogState?.currentPage ?? 1);
  const [cursors, setCursors] = useState(() => cachedBlogState?.cursors ?? [null]);
  const [hasMore, setHasMore] = useState(() => cachedBlogState?.hasMore ?? false);
  const [nextCursor, setNextCursor] = useState(() => cachedBlogState?.nextCursor ?? null);
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    category: "",
    tags: [],
    content: "",
    coverImage: "",
    published: true,
  });

  // Save state on unmount
  useEffect(() => {
    return () => {
      cachedBlogState = {
        posts,
        selectedCategory,
        selectedTags,
        sortBy,
        showFavoritesOnly,
        currentPage,
        cursors,
        hasMore,
        nextCursor,
        scrollPosition: window.scrollY
      };
    };
  }, [posts, selectedCategory, selectedTags, sortBy, showFavoritesOnly, currentPage, cursors, hasMore, nextCursor]);

  // Restore scroll position on mount
  useEffect(() => {
    if (cachedBlogState?.scrollPosition) {
      const t = setTimeout(() => {
        window.scrollTo(0, cachedBlogState.scrollPosition);
      }, 80);
      return () => clearTimeout(t);
    }
  }, []);

  const [favoriteBlogIds, setFavoriteBlogIds] = useState(new Set());

  useEffect(() => {
    setSearchConfig({
      placeholder: "Tìm kiếm bài viết blog...",
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
    setCursors([null]);
    setPosts(STATIC_POSTS);
  }, [searchTerm, selectedCategory, selectedTags, sortBy, showFavoritesOnly]);

  // Load User Favorites
  useEffect(() => {
    if (!auth.currentUser) {
      setFavoriteBlogIds(new Set());
      return;
    }
    const q = query(collection(db, "FavoriteBlogs"), where("userId", "==", auth.currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const ids = new Set(snap.docs.map(doc => doc.data().blogId));
      setFavoriteBlogIds(ids);
    }, (error) => {
      console.error("Error loading favorites", error);
    });
    return () => unsub();
  }, [auth.currentUser]);

  // Fetch categories and tags
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "BlogCategories")));
        const cats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategories(cats);
      } catch (e) {
        console.error("Error fetching categories", e);
      }
    };

    const fetchTags = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "BlogTags")));
        const ts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTagsList(ts);
      } catch (e) {
        console.error("Error fetching tags", e);
      }
    };

    fetchCategories();
    fetchTags();
  }, [t]);

  // Auto generate slug when title changes
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, formData.slug]);

  const isSearchActive = !!searchTerm || showFavoritesOnly || selectedTags.length > 0 || !!selectedCategory;

  // Fetch posts
  useEffect(() => {
    if (hasRestoredState.current) {
      hasRestoredState.current = false;
      return undefined;
    }

    // 1. Live listener for page 1 default feed (like the home page)
    if (currentPage === 1 && !isSearchActive) {
      setLoading(true);
      let q = query(collection(db, "BlogPosts"));
      if (sortBy === "favorites") {
        q = query(q, orderBy("favoriteCount", "desc"));
      } else if (sortBy === "oldest") {
        q = query(q, orderBy("createdAt", "asc"));
      } else {
        q = query(q, orderBy("createdAt", "desc"));
      }
      q = query(q, limit(7));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs;
          const hasNext = docs.length > 6;
          setHasMore(hasNext);

          const pageDocs = hasNext ? docs.slice(0, 6) : docs;
          let fetchedPosts = pageDocs.map((doc) => {
            const data = doc.data();
            const content = data.content || "";
            const wordCount = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(/\s+/).length;
            const readTime = data.readTime || Math.max(1, Math.ceil(wordCount / 200));
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              favoriteCount: data.favoriteCount || 0,
              readTime,
            };
          });

          // Merge static posts
          const dynamicSlugs = new Set(fetchedPosts.map((p) => p.slug));
          const staticToAppend = STATIC_POSTS.filter((p) => !dynamicSlugs.has(p.slug));
          fetchedPosts = [...fetchedPosts, ...staticToAppend];

          setPosts(fetchedPosts);
          if (hasNext) {
            setNextCursor(docs[5]);
          } else {
            setNextCursor(null);
          }
          setLoading(false);

          // Fetch favorite counts from FavoriteBlogs in the background
          const fetchFavoriteCountsBg = async (postsList) => {
            try {
              const blogIds = postsList.map((p) => p.id).filter(Boolean);
              const countsMap = {};
              if (blogIds.length > 0) {
                const chunks = [];
                for (let i = 0; i < blogIds.length; i += 30) {
                  chunks.push(blogIds.slice(i, i + 30));
                }
                const snapshots = await Promise.all(
                  chunks.map((chunk) =>
                    getDocs(query(collection(db, "FavoriteBlogs"), where("blogId", "in", chunk)))
                  )
                );
                snapshots.forEach((snapshot) => {
                  snapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.blogId) {
                      countsMap[data.blogId] = (countsMap[data.blogId] || 0) + 1;
                    }
                  });
                });

                setPosts((current) =>
                  current.map((p) => {
                    const key = p.id;
                    if (countsMap[key] !== undefined) {
                      return { ...p, favoriteCount: countsMap[key] };
                    }
                    return p;
                  })
                );
              }
            } catch (favErr) {
              console.error("Error loading favorite counts live in bg", favErr);
            }
          };
          fetchFavoriteCountsBg(fetchedPosts);
        },
        (error) => {
          console.error("Error loading posts live", error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }

    // 2. One-shot fetch for search results or page 2+ pagination
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, "BlogPosts"));

        // Apply Firestore sorting
        if (sortBy === "favorites") {
          q = query(q, orderBy("favoriteCount", "desc"));
        } else if (sortBy === "oldest") {
          q = query(q, orderBy("createdAt", "asc"));
        } else {
          q = query(q, orderBy("createdAt", "desc"));
        }

        if (isSearchActive) {
          q = query(q, limit(100));
        } else {
          const startCursor = cursors[currentPage - 1];
          if (startCursor) {
            q = query(q, startAfter(startCursor));
          }
          q = query(q, limit(7));
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        let fetchedPosts = [];
        if (isSearchActive) {
          fetchedPosts = docs.map((doc) => {
            const data = doc.data();
            const content = data.content || "";
            const wordCount = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(/\s+/).length;
            const readTime = data.readTime || Math.max(1, Math.ceil(wordCount / 200));
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              favoriteCount: data.favoriteCount || 0,
              readTime,
            };
          });
          setHasMore(false);
          setNextCursor(null);
        } else {
          const hasNext = docs.length > 6;
          setHasMore(hasNext);

          const pageDocs = hasNext ? docs.slice(0, 6) : docs;
          fetchedPosts = pageDocs.map((doc) => {
            const data = doc.data();
            const content = data.content || "";
            const wordCount = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().split(/\s+/).length;
            const readTime = data.readTime || Math.max(1, Math.ceil(wordCount / 200));
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              favoriteCount: data.favoriteCount || 0,
              readTime,
            };
          });

          if (hasNext) {
            setNextCursor(docs[5]);
          } else {
            setNextCursor(null);
          }
        }

        if (currentPage === 1 || isSearchActive) {
          const dynamicSlugs = new Set(fetchedPosts.map((p) => p.slug));
          const staticToAppend = STATIC_POSTS.filter((p) => !dynamicSlugs.has(p.slug));
          fetchedPosts = [...fetchedPosts, ...staticToAppend];
        }

        if (currentPage === 1) {
          setPosts(fetchedPosts);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id || p.slug));
            const newPosts = fetchedPosts.filter((p) => !existingIds.has(p.id || p.slug));
            return [...prev, ...newPosts];
          });
        }
        setLoading(false);

        // Fetch favorite counts from FavoriteBlogs in the background
        const fetchFavoriteCountsBg = async (postsList) => {
          try {
            const blogIds = postsList.map((p) => p.id).filter(Boolean);
            const countsMap = {};
            if (blogIds.length > 0) {
              const chunks = [];
              for (let i = 0; i < blogIds.length; i += 30) {
                chunks.push(blogIds.slice(i, i + 30));
              }
              const snapshots = await Promise.all(
                chunks.map((chunk) =>
                  getDocs(query(collection(db, "FavoriteBlogs"), where("blogId", "in", chunk)))
                )
              );
              snapshots.forEach((snapshot) => {
                snapshot.docs.forEach((docSnap) => {
                  const data = docSnap.data();
                  if (data.blogId) {
                    countsMap[data.blogId] = (countsMap[data.blogId] || 0) + 1;
                  }
                });
              });

              setPosts((current) =>
                current.map((p) => {
                  const key = p.id;
                  if (countsMap[key] !== undefined) {
                    return { ...p, favoriteCount: countsMap[key] };
                  }
                  return p;
                })
              );
            }
          } catch (favErr) {
            console.error("Error loading favorite counts in bg", favErr);
          }
        };
        fetchFavoriteCountsBg(fetchedPosts);
      } catch (e) {
        console.error("Error fetching posts", e);
        let fallback = [...STATIC_POSTS];
        setPosts(fallback);
        setLoading(false);
        toast.warning("Đang hiển thị dữ liệu mẫu do không thể kết nối máy chủ");

        // Fetch favorite counts in the background
        const fetchFallbackFavoriteCountsBg = async (postsList) => {
          try {
            const blogIds = postsList.map((p) => p.id).filter(Boolean);
            const countsMap = {};
            if (blogIds.length > 0) {
              const chunks = [];
              for (let i = 0; i < blogIds.length; i += 30) {
                chunks.push(blogIds.slice(i, i + 30));
              }
              const snapshots = await Promise.all(
                chunks.map((chunk) =>
                  getDocs(query(collection(db, "FavoriteBlogs"), where("blogId", "in", chunk)))
                )
              );
              snapshots.forEach((snapshot) => {
                snapshot.docs.forEach((docSnap) => {
                  const data = docSnap.data();
                  if (data.blogId) {
                    countsMap[data.blogId] = (countsMap[data.blogId] || 0) + 1;
                  }
                });
              });

              setPosts((current) =>
                current.map((p) => {
                  if (countsMap[p.id] !== undefined) {
                    return { ...p, favoriteCount: countsMap[p.id] };
                  }
                  return p;
                })
              );
            }
          } catch (favErr) {
            console.log("Error loading fallback favorite counts in bg", favErr);
          }
        };
        fetchFallbackFavoriteCountsBg(fallback);
      }
    };

    fetchPosts();
    return undefined;
  }, [selectedCategory, sortBy, currentPage, cursors, isSearchActive, isDetailView]);

  const getReadTime = (content = "") => {
    const text = postHtmlToText(content);
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Filter by favorites only
    if (showFavoritesOnly) {
      result = result.filter((p) => {
        const id = p.id;
        return favoriteBlogIds.has(id);
      });
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter((p) =>
        selectedTags.every((tagId) => (p.tags || []).includes(tagId))
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = normalizeSearchText(searchTerm);
      result = result.filter((p) => {
        const text = p.searchText || `${p.title || ""} ${p.description || ""} ${p.contentText || ""}`.toLowerCase();
        return text.includes(term);
      });
    }

    // Sort client-side
    result.sort((a, b) => {
      if (sortBy === "favorites") {
        const favA = a.favoriteCount || 0;
        const favB = b.favoriteCount || 0;
        return favB - favA;
      }
      const da = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const db_ = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return sortBy === "newest" ? db_ - da : da - db_;
    });

    return result;
  }, [posts, selectedCategory, selectedTags, searchTerm, sortBy, showFavoritesOnly, favoriteBlogIds]);

  const filteredAndPagedPosts = useMemo(() => {
    if (isSearchActive) {
      const end = currentPage * 6;
      return filteredPosts.slice(0, end);
    }
    return filteredPosts;
  }, [filteredPosts, currentPage, isSearchActive]);

  const totalPosts = filteredPosts.length;

  const canLoadMore = isSearchActive ? (currentPage * 6 < totalPosts) : hasMore;

  useEffect(() => {
    if (isDetailView) return undefined;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;
        if (loading || !canLoadMore) return;

        const threshold = 150;
        const position = window.innerHeight + window.scrollY;
        const height = document.documentElement.scrollHeight;

        if (height - position < threshold) {
          if (isSearchActive) {
            setCurrentPage((p) => p + 1);
          } else if (nextCursor) {
            setCursors((prev) => {
              const newCursors = [...prev];
              newCursors[currentPage] = nextCursor;
              return newCursors;
            });
            setCurrentPage((p) => p + 1);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, canLoadMore, nextCursor, currentPage, isSearchActive, isDetailView]);



  const filterCategories = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      const name = c.name || c.id;
      if (name) map.set(name, { id: c.id, name });
    });
    STATIC_POSTS.forEach((p) => {
      if (p.category && !map.has(p.category)) {
        map.set(p.category, { id: `static-${p.category}`, name: p.category });
      }
    });
    return Array.from(map.values());
  }, [categories]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value || null);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const openAddModal = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      category: "",
      tags: [],
      content: "",
      coverImage: "",
      published: true,
    });
    setShowModal(true);
  };

  const openEditModal = (post) => {
    if (post.isStatic) {
      toast.info("Bài viết mẫu (tĩnh) không thể chỉnh sửa");
      return;
    }
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      description: post.description,
      category: post.category,
      tags: post.tags || [],
      content: Array.isArray(post.content) ? post.content.join("") : (post.content || ""),
      coverImage: post.coverImage || "",
      published: post.published || false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPost(null);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadToCloudinary(file, { folder: "vibook/blog" });
      setFormData((prev) => ({ ...prev, coverImage: url }));
    } catch (err) {
      toast.error(t("uploadFailed") + err.message);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.info("Category already exists");
      setNewCategoryName("");
      setFormData((prev) => ({ ...prev, category: name }));
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "BlogCategories"), { name });
      setCategories((prev) => [...prev, { id: docRef.id, name }]);
      setFormData((prev) => ({ ...prev, category: name }));
      setNewCategoryName("");
      toast.success(`Category "${name}" created`);
    } catch (e) {
      console.error("Error adding category", e);
    }
  };

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    const tagId = name.toLowerCase().replace(/\s+/g, "-");
    if (tagsList.some((t) => t.id === tagId)) {
      if (!formData.tags.includes(tagId)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagId] }));
      }
      setNewTagName("");
      return;
    }
    try {
      await setDoc(doc(db, "BlogTags", tagId), { name });
      setTagsList((prev) => [...prev, { id: tagId, name }]);
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagId] }));
      setNewTagName("");
      toast.success(`Tag #${name} created`);
    } catch (e) {
      console.error("Error adding tag", e);
    }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error(t("postTitleRequired") || "Title and content are required");
      return;
    }

    if (formData.content && formData.content.includes("data:image/")) {
      toast.error("Bài viết chứa ảnh chèn trực tiếp (base64) quá lớn. Vui lòng sử dụng tính năng tải ảnh lên của thanh công cụ!");
      return;
    }
    if (formData.content && formData.content.length > 800000) {
      toast.error("Bài viết quá dài (giới hạn Firestore là 1MB). Vui lòng giảm bớt hình ảnh hoặc chữ!");
      return;
    }

    setSubmitting(true);
    try {
      const wordCount = postHtmlToText(formData.content).split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));

      const postData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        content: formData.content,
        coverImage: formData.coverImage,
        published: formData.published,
        readTime: readTime,
        contentText: postHtmlToText(formData.content),
        searchText: normalizeSearchText(
          formData.title + " " + formData.description + " " + postHtmlToText(formData.content)
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        author: auth.currentUser?.uid || "anonymous",
        views: editingPost ? editingPost.views : 0,
        favoriteCount: editingPost ? (editingPost.favoriteCount || 0) : 0,
      };

      if (editingPost) {
        const updateData = {
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          content: formData.content,
          coverImage: formData.coverImage,
          published: formData.published,
          readTime: readTime,
          contentText: postHtmlToText(formData.content),
          searchText: normalizeSearchText(
            formData.title + " " + formData.description + " " + postHtmlToText(formData.content)
          ),
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, "BlogPosts", editingPost.id), updateData);
        toast.success(t("postUpdated") || "Post updated successfully");
        // Update local list
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editingPost.id
              ? {
                  ...p,
                  ...updateData,
                  updatedAt: new Date(),
                }
              : p
          )
        );
      } else {
        const docRef = await addDoc(collection(db, "BlogPosts"), postData);
        const createdPost = {
          id: docRef.id,
          ...postData,
          createdAt: new Date(),
          isStatic: false,
        };
        setPosts((prev) => [createdPost, ...prev]);
        toast.success(t("postCreated") || "Post created successfully");
      }
      closeModal();
    } catch (e) {
      console.error(e);
      toast.error(t("postError") || "Error saving post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId, isStatic) => {
    if (isStatic) {
      toast.info("Bài viết mẫu (tĩnh) không thể xóa");
      return;
    }
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteDoc(doc(db, "BlogPosts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success(t("blogPostDeleted"));
    } catch (e) {
      toast.error(t("postDeleteFailed"));
    }
  };

  const handleToggleFavorite = async (blog) => {
    if (!auth.currentUser) {
      toast.warn("Vui lòng đăng nhập để thích bài viết!");
      return;
    }
    const blogId = blog.id;
    const favDocRef = doc(db, "FavoriteBlogs", `${auth.currentUser.uid}_${blogId}`);

    try {
      const isFav = favoriteBlogIds.has(blogId);
      if (isFav) {
        await deleteDoc(favDocRef);
        if (!blog.isStatic) {
          await updateDoc(doc(db, "BlogPosts", blogId), {
            favoriteCount: increment(-1),
          });
        }
        setPosts((prev) =>
          prev.map((p) => {
            const id = p.id;
            if (id === blogId) {
              return { ...p, favoriteCount: Math.max(0, (p.favoriteCount || 0) - 1) };
            }
            return p;
          })
        );
        if (currentPost && currentPost.id === blogId) {
          setCurrentPost((prev) => ({
            ...prev,
            favoriteCount: Math.max(0, (prev.favoriteCount || 0) - 1),
          }));
        }
        toast.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        await setDoc(favDocRef, {
          userId: auth.currentUser.uid,
          blogId: blogId,
          createdAt: serverTimestamp(),
        });
        if (!blog.isStatic) {
          await updateDoc(doc(db, "BlogPosts", blogId), {
            favoriteCount: increment(1),
          });
        }
        setPosts((prev) =>
          prev.map((p) => {
            const id = p.id;
            if (id === blogId) {
              return { ...p, favoriteCount: (p.favoriteCount || 0) + 1 };
            }
            return p;
          })
        );
        if (currentPost && currentPost.id === blogId) {
          setCurrentPost((prev) => ({
            ...prev,
            favoriteCount: (prev.favoriteCount || 0) + 1,
          }));
        }
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (error) {
      console.error("Error toggling favorite", error);
      toast.error("Không thể thay đổi trạng thái yêu thích");
    }
  };

  const incrementView = async (postId) => {
    try {
      await updateDoc(doc(db, "BlogPosts", postId), {
        views: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("View increment failed", e);
    }
  };

  // For detail view, fetch specific post
  const [currentPost, setCurrentPost] = useState(() => {
    if (isDetailView && slug) {
      return STATIC_POSTS.find((p) => p.slug === slug) || null;
    }
    return null;
  });
  useEffect(() => {
    if (isDetailView && slug) {
      const staticPost = STATIC_POSTS.find((p) => p.slug === slug) || null;
      if (!currentPost || currentPost.slug !== slug) {
        setCurrentPost(staticPost);
      }

      const findStaticBySlug = () => staticPost;

      const fetchPost = async () => {
        try {
          const q = query(collection(db, "BlogPosts"), where("slug", "==", slug), limit(1));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const postDoc = snapshot.docs[0];
            const postData = postDoc.data();
            
            let favCount = 0;
            try {
              const favsQ = query(collection(db, "FavoriteBlogs"), where("blogId", "==", postDoc.id));
              const favsSnap = await getDocs(favsQ);
              favCount = favsSnap.size;
            } catch (err) {
              favCount = postData.favoriteCount || 0;
            }

            const post = {
              id: postDoc.id,
              ...postData,
              createdAt: postData.createdAt?.toDate ? postData.createdAt.toDate() : postData.createdAt,
              favoriteCount: favCount,
            };
            setCurrentPost(post);
            incrementView(postDoc.id);
            return;
          }

          const staticPost = findStaticBySlug();
          if (staticPost) {
            let favCount = 0;
            try {
              const favsQ = query(collection(db, "FavoriteBlogs"), where("blogId", "==", staticPost.id));
              const favsSnap = await getDocs(favsQ);
              favCount = favsSnap.size;
            } catch (err) {
              favCount = staticPost.favoriteCount || 0;
            }
            setCurrentPost({ ...staticPost, favoriteCount: favCount });
          } else {
            navigate("/blog");
          }
        } catch (e) {
          console.error("Fetch post error", e);
          const staticPost = findStaticBySlug();
          if (staticPost) {
            let favCount = 0;
            try {
              const favsQ = query(collection(db, "FavoriteBlogs"), where("blogId", "==", staticPost.id));
              const favsSnap = await getDocs(favsQ);
              favCount = favsSnap.size;
            } catch (err) {
              favCount = staticPost.favoriteCount || 0;
            }
            setCurrentPost({ ...staticPost, favoriteCount: favCount });
          } else {
            navigate("/blog");
          }
        }
      };
      fetchPost();
    }
  }, [slug, navigate, isDetailView]);

  // Related posts
  const [relatedPosts, setRelatedPosts] = useState([]);
  useEffect(() => {
    const fetchRelated = async () => {
      if (!currentPost) return;

      if (currentPost.isStatic) {
        const rel = STATIC_POSTS.filter(
          (p) =>
            p.slug !== currentPost.slug &&
            (p.category === currentPost.category ||
              (p.tags || []).some((tg) => (currentPost.tags || []).includes(tg)))
        ).slice(0, 3);
        setRelatedPosts(rel);
        return;
      }

      try {
        let q = query(collection(db, "BlogPosts"), where("category", "==", currentPost.category), limit(3));
        if (currentPost.tags && currentPost.tags.length > 0) {
          q = query(collection(db, "BlogPosts"), where("tags", "array-contains-any", currentPost.tags), limit(3));
        }
        const snapshot = await getDocs(q);
        let rel = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => p.id !== currentPost.id);

        if (rel.length < 3) {
          const extra = STATIC_POSTS.filter(
            (p) => p.slug !== currentPost.slug && p.category === currentPost.category
          ).slice(0, 3 - rel.length);
          rel = [...rel, ...extra];
        }
        setRelatedPosts(rel);
      } catch (e) {
        console.error("Related posts error", e);
        const rel = STATIC_POSTS.filter(
          (p) => p.slug !== currentPost.slug && p.category === currentPost.category
        ).slice(0, 3);
        setRelatedPosts(rel);
      }
    };
    fetchRelated();
  }, [currentPost]);

  // TOC and content processing for detail smooth scroll
  const { tocItems, processedContent } = useMemo(() => {
    if (!currentPost?.content) return { tocItems: [], processedContent: "" };
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(currentPost.content, "text/html");
    const headings = htmlDoc.querySelectorAll("h1, h2, h3");
    const toc = Array.from(headings).map((h, idx) => {
      const cleanText = (h.textContent || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const id = h.id || `heading-${cleanText || idx}`;
      h.id = id; // Inject id in content
      return {
        id,
        text: h.textContent,
        level: parseInt(h.tagName[1]),
      };
    });
    return {
      tocItems: toc,
      processedContent: htmlDoc.body.innerHTML,
    };
  }, [currentPost?.content]);

  const blogDetailSchema = useMemo(() => {
    if (!currentPost) return null;
    let publishDate = new Date().toISOString();
    try {
      if (currentPost.createdAt) {
        publishDate = currentPost.createdAt.toISOString ? currentPost.createdAt.toISOString() : new Date(currentPost.createdAt).toISOString();
      }
    } catch (err) {
      // ignore
    }
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": currentPost.title,
      "image": currentPost.coverImage || `${window.location.origin}/images/default-blog-cover.jpg`,
      "author": {
        "@type": "Person",
        "name": currentPost.authorName || "Tác giả ThoDev"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ThoDev",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/logo.png`
        }
      },
      "datePublished": publishDate,
      "description": currentPost.description || ""
    };
  }, [currentPost]);

  const blogListSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Blog ThoDev",
      "description": "Nơi chia sẻ các bài viết hữu ích về công nghệ, phong cách sống và tin tức từ cộng đồng ThoDev.",
      "publisher": {
        "@type": "Organization",
        "name": "ThoDev"
      }
    };
  }, []);


  if (isDetailView && !currentPost) {
    return (
      <div className="page-shell">
        <SEO
          title="Đang tải bài viết..."
          description="Đang tải nội dung bài viết từ ThoDev..."
          slug={`/blog/${slug}`}
        />
        <div className="blog-detail-loading">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {isDetailView && currentPost ? (
        <SEO
          title={currentPost.title}
          description={currentPost.description}
          image={currentPost.coverImage}
          slug={`/blog/${currentPost.slug}`}
          type="article"
          schema={blogDetailSchema}
        />
      ) : (
        <SEO
          title="Blog & Tin tức"
          description="Nơi chia sẻ các bài viết hữu ích về công nghệ, phong cách sống và tin tức từ cộng đồng ThoDev."
          slug="/blog"
          schema={blogListSchema}
        />
      )}

      {/* List view */}
      {!isDetailView && (
        <div>
          <div className="blog-header">
            <h1>{t("blogListTitle")}</h1>
            {auth.currentUser && (
              <button onClick={openAddModal} className="vb-btn vb-btn--primary">
                <FaPlus size={14} />
                {t("addPost")}
              </button>
            )}
          </div>

          <div className="blog-controls">
            <div className="filters">
              <select value={selectedCategory || ""} onChange={handleCategoryChange}>
                <option value="">{t("allCategories") || "All Categories"}</option>
                {filterCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select value={sortBy} onChange={handleSortChange}>
                <option value="newest">{t("sortByNewest")}</option>
                <option value="oldest">{t("sortByOldest")}</option>
                <option value="favorites">Yêu thích nhất</option>
              </select>

              {auth.currentUser && (
                <button
                  type="button"
                  className={`btn btn-sm ${showFavoritesOnly ? "btn-danger" : "btn-outline-danger"} d-inline-flex align-items-center gap-1`}
                  onClick={() => setShowFavoritesOnly(prev => !prev)}
                  style={{ height: "38px" }}
                >
                  <FaHeart /> {showFavoritesOnly ? "Hiện tất cả" : "Bài viết yêu thích"}
                </button>
              )}
            </div>
          </div>
          
          {searchTerm && (
            <div className="search-banner mb-4 d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: "rgba(142, 84, 233, 0.08)", border: "1px solid var(--vb-glass-border, rgba(255,255,255,0.08))", backdropFilter: "blur(8px)", color: "var(--app-text)" }}>
              <span className="d-flex align-items-center gap-2">
                <span style={{ fontSize: "14px" }}>Tìm kiếm bài viết: <strong>"{searchTerm}"</strong></span>
              </span>
              <button 
                type="button"
                className="btn btn-sm btn-link text-decoration-none p-0"
                onClick={() => setSearchConfig(null)}
                style={{ color: "var(--vb-primary, #8e54e9)", fontWeight: "600" }}
              >
                Xóa tìm kiếm ×
              </button>
            </div>
          )}

          {loading && posts.length === 0 ? (
            <div className="blog-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <BlogCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="blog-grid">
                {filteredAndPagedPosts.map((post, index) => (
                  <React.Fragment key={post.id || post.slug}>
                    {/* In-feed Ad unit (displays after every 3 posts) */}
                    {index > 0 && index % 3 === 0 && (
                      <div className="blog-ad-card" data-ad-card style={{
                        gridColumn: "1 / -1",
                        margin: "15px 0",
                        padding: "15px",
                        background: "var(--vb-glass-surface)",
                        border: "1px solid var(--vb-glass-border)",
                        borderRadius: "var(--vb-radius-md)",
                        backdropFilter: "var(--vb-glass-blur)"
                      }}>
                        <AdSense adSlot="9056933175" adLayoutKey="-62+ca+8-3b+jw" />
                      </div>
                    )}
                    <BlogCard
                      post={post}
                      index={index}
                      isFavorite={favoriteBlogIds.has(post.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onEdit={openEditModal}
                      onDelete={handleDeletePost}
                      t={t}
                      getReadTime={getReadTime}
                      auth={auth}
                    />
                  </React.Fragment>
                ))}
              </div>

              {loading && currentPage > 1 && (
                <div className="text-center my-4 py-3" style={{ color: "var(--app-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: "1.2rem", height: "1.2rem", color: "var(--vb-primary, #8e54e9)" }}></div>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>Đang tải thêm bài viết...</span>
                </div>
              )}

              {!loading && !canLoadMore && totalPosts > 0 && (
                <div className="text-center my-5 py-3" style={{ color: "var(--app-muted)", fontSize: "13px", opacity: 0.6, letterSpacing: "0.05em" }}>
                  — Đã hiển thị tất cả bài viết —
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Detail view */}
      {isDetailView && currentPost && (
        <div>
           <BlogDetail
            post={{ ...currentPost, content: processedContent }}
            isFavorite={favoriteBlogIds.has(currentPost.id)}
            onToggleFavorite={handleToggleFavorite}
            t={t}
            getReadTime={getReadTime}
            tocItems={tocItems}
            onBack={() => navigate("/blog")}
          />

          {/* Detail View Ad Unit */}
          <div className="blog-detail-ad-container px-4 my-4" data-ad-card style={{
            margin: "20px 0",
            padding: "15px",
            background: "var(--vb-glass-surface)",
            border: "1px solid var(--vb-glass-border)",
            borderRadius: "var(--vb-radius-md)",
            backdropFilter: "var(--vb-glass-blur)"
          }}>
            {/* Note: You can replace '9056933175' with a different ad slot ID from AdSense for detail page if desired */}
            <AdSense adSlot="9056933175" adFormat="auto" />
          </div>

          <div className="px-4 pb-5">
            {relatedPosts.length > 0 && (
              <div className="related-posts mt-5">
                <h4>{t("relatedPosts")}</h4>
                <div className="related-grid">
                  {relatedPosts.map((p) => (
                    <Link key={p.id || p.slug} to={`/blog/${p.slug}`} className="related-card">
                      {p.coverImage && <img src={p.coverImage} alt="" />}
                      <div className="related-card-body">
                        <h5>{p.title}</h5>
                        <small>{p.createdAt?.toLocaleDateString?.()}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <BlogFormModal
        showModal={showModal}
        onClose={closeModal}
        editingPost={editingPost}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        onSubmit={handleSavePost}
        categories={categories}
        PRESET_CATEGORIES={PRESET_CATEGORIES}
        formats={formats}
        modules={modules}
        onAddCategory={handleAddCategory}
        onAddTag={handleAddTag}
        newCategoryInput={newCategoryName}
        setNewCategoryInput={setNewCategoryName}
        newTagInput={newTagName}
        setNewTagInput={setNewTagName}
        onCoverUpload={handleCoverUpload}
        t={t}
        quillRef={quillRef}
      />
    </div>
  );
};

export default BlogPages;