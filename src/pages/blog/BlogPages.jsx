import React, { useState, useEffect, useMemo } from "react";
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
import BlogCard from "../../components/blogcomponent/BlogCard";
import SEO from "../../components/SEO";
import BlogDetail from "../../components/blogcomponent/BlogDetail";
import BlogFormModal from "../../components/blogcomponent/BlogFormModal";
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

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["link", "image"],
    ["clean"],
  ],
};

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

const STATIC_POSTS = (staticBlogData.posts || []).map((p) => ({
  ...p,
  createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
  isStatic: true,
  favoriteCount: p.favoriteCount || 0,
}));

const BlogPages = () => {
  const { t } = useContext(LanguageContext);
  const { slug } = useParams();
  const navigate = useNavigate();
  const isDetailView = !!slug;

  // States
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const { keyword: searchTerm, setSearchConfig } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState([null]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
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

  const [favoriteBlogIds, setFavoriteBlogIds] = useState(new Set());

  useEffect(() => {
    setSearchConfig({
      placeholder: "Tìm kiếm bài viết blog...",
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig]);

  useEffect(() => {
    setCurrentPage(1);
    setCursors([null]);
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
            q = query(q, startAt(startCursor));
          }
          q = query(q, limit(11));
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        let fetchedPosts = [];
        if (isSearchActive) {
          fetchedPosts = docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
            favoriteCount: doc.data().favoriteCount || 0,
          }));
          setHasMore(false);
          setNextCursor(null);
        } else {
          const hasNext = docs.length > 10;
          setHasMore(hasNext);

          const pageDocs = hasNext ? docs.slice(0, 10) : docs;
          fetchedPosts = pageDocs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
            favoriteCount: doc.data().favoriteCount || 0,
          }));

          if (hasNext) {
            setNextCursor(docs[10]);
          } else {
            setNextCursor(null);
          }
        }

        if (currentPage === 1 || isSearchActive) {
          const dynamicSlugs = new Set(fetchedPosts.map((p) => p.slug));
          const staticToAppend = STATIC_POSTS.filter((p) => !dynamicSlugs.has(p.slug));
          fetchedPosts = [...fetchedPosts, ...staticToAppend];
        }

        // Load favorite counts from FavoriteBlogs to ensure accuracy
        try {
          const blogIds = fetchedPosts.map((p) => (p.isStatic ? p.slug : p.id)).filter(Boolean);
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
          }
          fetchedPosts = fetchedPosts.map(p => {
            const key = p.isStatic ? p.slug : p.id;
            return {
              ...p,
              favoriteCount: countsMap[key] || 0
            };
          });
        } catch (favErr) {
          console.error("Error loading favorite counts, falling back to document values", favErr);
        }

        setPosts(fetchedPosts);
        setLoading(false);
      } catch (e) {
        console.error("Error fetching posts", e);
        let fallback = [...STATIC_POSTS];
        
        try {
          const blogIds = fallback.map((p) => p.slug).filter(Boolean);
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
          }
          fallback = fallback.map(p => ({
            ...p,
            favoriteCount: countsMap[p.slug] || 0
          }));
        } catch (favErr) {
          console.log("Error loading fallback favorite counts", favErr);
        }

        setPosts(fallback);
        setLoading(false);
        toast.warning("Đang hiển thị dữ liệu mẫu do không thể kết nối máy chủ");
      }
    };

    fetchPosts();
  }, [selectedCategory, sortBy, currentPage, cursors, isSearchActive]);

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
        const id = p.isStatic ? p.slug : p.id;
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
        const text = `${p.title || ""} ${p.description || ""} ${postHtmlToText(p.content || "")}`.toLowerCase();
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
      const start = (currentPage - 1) * 10;
      return filteredPosts.slice(start, start + 10);
    }
    return filteredPosts;
  }, [filteredPosts, currentPage, isSearchActive]);

  const totalPosts = filteredPosts.length;

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
      content: post.content || "",
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

    setSubmitting(true);
    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        content: formData.content,
        coverImage: formData.coverImage,
        published: formData.published,
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
    const blogId = blog.isStatic ? blog.slug : blog.id;
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
            const id = p.isStatic ? p.slug : p.id;
            if (id === blogId) {
              return { ...p, favoriteCount: Math.max(0, (p.favoriteCount || 0) - 1) };
            }
            return p;
          })
        );
        if (currentPost && (currentPost.isStatic ? currentPost.slug : currentPost.id) === blogId) {
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
            const id = p.isStatic ? p.slug : p.id;
            if (id === blogId) {
              return { ...p, favoriteCount: (p.favoriteCount || 0) + 1 };
            }
            return p;
          })
        );
        if (currentPost && (currentPost.isStatic ? currentPost.slug : currentPost.id) === blogId) {
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
  const [currentPost, setCurrentPost] = useState(null);
  useEffect(() => {
    if (isDetailView && slug) {
      setCurrentPost(null);

      const findStaticBySlug = () => STATIC_POSTS.find((p) => p.slug === slug) || null;

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
              const favsQ = query(collection(db, "FavoriteBlogs"), where("blogId", "==", staticPost.slug));
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
              const favsQ = query(collection(db, "FavoriteBlogs"), where("blogId", "==", staticPost.slug));
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
        "name": currentPost.authorName || "Tác giả ViBook"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ViBook",
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
      "name": "Blog ViBook",
      "description": "Nơi chia sẻ các bài viết hữu ích về công nghệ, phong cách sống và tin tức từ cộng đồng ViBook.",
      "publisher": {
        "@type": "Organization",
        "name": "ViBook"
      }
    };
  }, []);

  const handleScroll = () => {
    const progressBar = document.querySelector(".reading-progress");
    if (progressBar) {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = `${scrolled}%`;
    }
  };

  useEffect(() => {
    if (isDetailView) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isDetailView]);

  if (isDetailView && !currentPost) {
    return <div className="blog-detail-loading">{t("loading")}</div>;
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
          description="Nơi chia sẻ các bài viết hữu ích về công nghệ, phong cách sống và tin tức từ cộng đồng ViBook."
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

          {loading ? (
            <p>{t("loading")}</p>
          ) : (
            <div className="blog-grid">
              {filteredAndPagedPosts.map((post, index) => (
                <BlogCard
                  key={post.id || post.slug}
                  post={post}
                  index={index}
                  isFavorite={favoriteBlogIds.has(post.isStatic ? post.slug : post.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={openEditModal}
                  onDelete={handleDeletePost}
                  t={t}
                  getReadTime={getReadTime}
                  auth={auth}
                />
              ))}
            </div>
          )}

          {(isSearchActive ? totalPosts > 10 : (currentPage > 1 || hasMore)) && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                {t("previous")}
              </button>
              <span>Page {currentPage}</span>
              <button
                onClick={() => {
                  if (isSearchActive) {
                    setCurrentPage((p) => p + 1);
                  } else {
                    if (hasMore && nextCursor) {
                      setCursors((prev) => {
                        const newCursors = [...prev];
                        newCursors[currentPage] = nextCursor;
                        return newCursors;
                      });
                      setCurrentPage((p) => p + 1);
                    }
                  }
                }}
                disabled={isSearchActive ? (currentPage * 10 >= totalPosts) : (!hasMore || loading)}
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail view */}
      {isDetailView && currentPost && (
        <div>
           <BlogDetail
            post={{ ...currentPost, content: processedContent }}
            isFavorite={favoriteBlogIds.has(currentPost.isStatic ? currentPost.slug : currentPost.id)}
            onToggleFavorite={handleToggleFavorite}
            t={t}
            getReadTime={getReadTime}
            tocItems={tocItems}
            onBack={() => navigate("/blog")}
          />

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
      />
    </div>
  );
};

export default BlogPages;