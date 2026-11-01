import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { confirmDialog } from "../utils/confirmDialog";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { useSearch } from "../context/SearchContext";
import { uploadToCloudinary } from "../utils/cloudinary";
import SEO from "../components/SEO";
import PageHeaderBanner from "../components/PageHeaderBanner";
import { DEFAULT_TOOLS } from "./toolsData";
import {
  FaPlus,
  FaTimes,
  FaWrench,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaUpload,
  FaEye,
  FaGlobe,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaLayerGroup,
  FaTag,
  FaHeart,
  FaRegHeart,
  FaCopy,
  FaMousePointer,
  FaFire,
} from "react-icons/fa";
import "../style/Tools.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80";

const LOCAL_STORAGE_KEY = "vibook_custom_tools";
const FAVORITE_STORAGE_KEY = "vibook_favorite_tools";

// Base categories to suggest by default
const BASE_CATEGORIES = [
  "AI",
  "Lập trình",
  "Thiết kế",
  "Năng suất",
  "Tiện ích",
  "Học tập",
];

// Helper to normalize category name for matching and display
const normalizeCategory = (cat) => {
  if (!cat) return "Tiện ích";
  const lower = String(cat).trim().toLowerCase();
  if (lower === "ai" || lower.includes("trí tuệ nhân tạo")) return "AI";
  if (lower === "dev" || lower.includes("lập trình") || lower.includes("code")) return "Lập trình";
  if (lower === "design" || lower.includes("thiết kế") || lower.includes("ui/ux")) return "Thiết kế";
  if (lower === "productivity" || lower.includes("năng suất") || lower.includes("làm việc")) return "Năng suất";
  if (lower === "utilities" || lower.includes("tiện ích") || lower.includes("hệ thống")) return "Tiện ích";
  if (lower === "education" || lower.includes("học tập") || lower.includes("giáo dục")) return "Học tập";
  return cat.trim();
};

export default function ToolsPage() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const { language } = useContext(LanguageContext);

  // Search context integration (Header search bar only)
  const { keyword: headerSearch, setKeyword: setHeaderSearch, setSearchConfig } = useSearch();
  const activeSearch = (headerSearch || "").trim().toLowerCase();

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);

  // Tools state
  const [remoteTools, setRemoteTools] = useState([]);
  const [localTools, setLocalTools] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Category filter & sorting
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "popular" | "alpha"

  // Pagination state ("phần trang")
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // compact 12 items default
  const toolListTopRef = useRef(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [detailTool, setDetailTool] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Form fields for Add/Edit Tool
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImgUrl, setFormImgUrl] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formCategory, setFormCategory] = useState("AI");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const categoryDropdownRef = useRef(null);

  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup search config for Header (Using only Header search)
  useEffect(() => {
    setSearchConfig({
      placeholder:
        language === "vi"
          ? "Tìm kiếm công cụ theo tên, mô tả..."
          : language === "ja"
          ? "ツール名や説明で検索..."
          : "Search tools by name, description...",
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig, language]);

  // Auth observer
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => {
      try {
        if (typeof unsub === "function") unsub();
      } catch (err) {
        console.warn("Tools listener cleanup warning:", err);
      }
    };
  }, []);

  // Listen to FavoriteTools collection
  useEffect(() => {
    if (!currentUser?.uid) {
      // Guest mode: load from localStorage
      try {
        const savedFavs = JSON.parse(localStorage.getItem(FAVORITE_STORAGE_KEY) || "[]");
        setFavoriteIds(new Set(savedFavs));
      } catch {
        setFavoriteIds(new Set());
      }
      return undefined;
    }

    let unsub = () => {};
    try {
      const favQuery = query(
        collection(db, "FavoriteTools"),
        where("userId", "==", currentUser.uid)
      );
      unsub = onSnapshot(
        favQuery,
        (snapshot) => {
          const ids = new Set(snapshot.docs.map((docSnap) => docSnap.data().toolId));
          setFavoriteIds(ids);
        },
        (err) => {
          console.warn("FavoriteTools onSnapshot error, fallback to local:", err);
        }
      );
    } catch (err) {
      console.warn("Could not listen to FavoriteTools:", err);
    }

    return () => {
      try {
        if (typeof unsub === "function") unsub();
      } catch (e) {
        console.warn("FavoriteTools cleanup warning:", e);
      }
    };
  }, [currentUser?.uid]);

  // Listen to Firestore Tools collection
  useEffect(() => {
    setIsLoading(true);
    let unsub = () => {};
    try {
      const q = query(collection(db, "Tools"));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setRemoteTools(list);
          setIsLoading(false);
        },
        (error) => {
          console.warn("Firestore Tools error, fallback to local:", error);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.warn("Could not attach Tools listener:", err);
      setIsLoading(false);
    }
    return () => {
      try {
        if (typeof unsub === "function") unsub();
      } catch (err) {
        console.warn("Tools listener cleanup warning:", err);
      }
    };
  }, []);

  // Sync custom tools to localStorage
  const saveLocalTools = (tools) => {
    setLocalTools(tools);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tools));
    } catch (e) {
      console.error("Failed to save tools to localStorage:", e);
    }
  };

  // Combine default preset tools + local custom tools + remote firestore tools
  const allTools = useMemo(() => {
    const combined = new Map();

    // 1. Preset defaults
    DEFAULT_TOOLS.forEach((t) => combined.set(t.id, t));

    // 2. Local custom tools
    localTools.forEach((t) => combined.set(t.id, t));

    // 3. Remote Firestore tools
    remoteTools.forEach((t) => combined.set(t.id, t));

    return Array.from(combined.values());
  }, [remoteTools, localTools]);

  // Extract all available category names dynamically from BASE_CATEGORIES + tools
  const allCategoryNames = useMemo(() => {
    const set = new Set(BASE_CATEGORIES);
    allTools.forEach((tool) => {
      const normalized = normalizeCategory(tool.category);
      if (normalized) set.add(normalized);
    });
    return Array.from(set);
  }, [allTools]);

  // Filtered categories suggestions for the Category Input in Modal
  const filteredCategorySuggestions = useMemo(() => {
    const queryStr = formCategory.trim().toLowerCase();
    if (!queryStr) return allCategoryNames;
    return allCategoryNames.filter((cat) => cat.toLowerCase().includes(queryStr));
  }, [allCategoryNames, formCategory]);

  const isExactCategoryMatch = useMemo(() => {
    const trimmed = formCategory.trim().toLowerCase();
    return allCategoryNames.some((cat) => cat.toLowerCase() === trimmed);
  }, [allCategoryNames, formCategory]);

  // Dynamic category filter list with count badges (including Favorites tab)
  const categoryFilters = useMemo(() => {
    const counts = { all: allTools.length };

    allTools.forEach((tool) => {
      const norm = normalizeCategory(tool.category);
      counts[norm] = (counts[norm] || 0) + 1;
    });

    const list = [{ id: "all", label: language === "vi" ? "Tất cả" : "All", count: counts.all }];

    // Favorites tab
    if (favoriteIds.size > 0 || selectedCategory === "favorites") {
      list.push({
        id: "favorites",
        label: language === "vi" ? "Yêu thích" : "Favorites",
        count: favoriteIds.size,
        isFavTab: true,
      });
    }

    allCategoryNames.forEach((cat) => {
      list.push({
        id: cat,
        label: cat,
        count: counts[cat] || 0,
      });
    });

    return list;
  }, [allTools, allCategoryNames, favoriteIds.size, selectedCategory, language]);

  // Filter & sort tools
  const filteredTools = useMemo(() => {
    let result = allTools;

    // Filter by favorites
    if (selectedCategory === "favorites") {
      result = result.filter((tool) => favoriteIds.has(tool.id));
    } else if (selectedCategory !== "all") {
      // Filter by category
      result = result.filter(
        (tool) => normalizeCategory(tool.category).toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by header search keyword
    if (activeSearch) {
      result = result.filter((tool) => {
        const title = (tool.title || "").toLowerCase();
        const desc = (tool.description || "").toLowerCase();
        const cat = normalizeCategory(tool.category).toLowerCase();
        return title.includes(activeSearch) || desc.includes(activeSearch) || cat.includes(activeSearch);
      });
    }

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "alpha") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "popular") {
        const popA = (a.clicks || 0) + (a.favoriteCount || 0) * 2;
        const popB = (b.clicks || 0) + (b.favoriteCount || 0) * 2;
        return popB - popA;
      }
      const timeA = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(b.createdAt || 0).getTime();

      if (sortBy === "oldest") return timeA - timeB;
      return timeB - timeA; // newest default
    });

    return result;
  }, [allTools, selectedCategory, favoriteIds, activeSearch, sortBy]);

  // Reset pagination when filter/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, activeSearch, sortBy, itemsPerPage]);

  // Pagination calculations
  const totalItems = filteredTools.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = useMemo(() => {
    return filteredTools.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTools, startIndex, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (toolListTopRef.current) {
      toolListTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Close menus & suggestion dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeMenuId && !e.target.closest(`[data-tool-menu="${activeMenuId}"]`)) {
        setActiveMenuId(null);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setShowCategorySuggestions(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setDetailTool(null);
        setActiveMenuId(null);
        setShowCategorySuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenuId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAddModal || detailTool) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddModal, detailTool]);

  // Toggle favorite / bookmark
  const handleToggleFavorite = async (tool, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const toolId = tool.id;
    const isFav = favoriteIds.has(toolId);
    const nextSet = new Set(favoriteIds);
    if (isFav) {
      nextSet.delete(toolId);
    } else {
      nextSet.add(toolId);
    }
    setFavoriteIds(nextSet);

    if (currentUser?.uid) {
      const favDocId = `${currentUser.uid}_${toolId}`;
      try {
        if (isFav) {
          await deleteDoc(doc(db, "FavoriteTools", favDocId));
          if (!toolId.startsWith("default-") && !toolId.startsWith("local-")) {
            await updateDoc(doc(db, "Tools", toolId), {
              favoriteCount: increment(-1),
            }).catch(() => {});
          }
          toast.info(language === "vi" ? "Đã bỏ lưu công cụ." : "Removed from favorites.");
        } else {
          await setDoc(doc(db, "FavoriteTools", favDocId), {
            userId: currentUser.uid,
            toolId: toolId,
            createdAt: serverTimestamp(),
          });
          if (!toolId.startsWith("default-") && !toolId.startsWith("local-")) {
            await updateDoc(doc(db, "Tools", toolId), {
              favoriteCount: increment(1),
            }).catch(() => {});
          }
          toast.success(
            language === "vi" ? "Đã lưu vào danh sách yêu thích!" : "Saved to favorites!"
          );
        }
      } catch (err) {
        console.warn("FavoriteTools Firestore error:", err);
      }
    } else {
      // Local fallback for guest
      try {
        localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(Array.from(nextSet)));
        if (isFav) {
          toast.info(language === "vi" ? "Đã bỏ lưu công cụ." : "Removed from favorites.");
        } else {
          toast.success(
            language === "vi"
              ? "Đã lưu vào danh sách yêu thích (Bộ nhớ máy)!"
              : "Saved to favorites!"
          );
        }
      } catch (err) {
        console.error("Local favorite save error:", err);
      }
    }
  };

  // Launch tool with click tracker
  const handleLaunchTool = async (tool, e) => {
    if (e) e.stopPropagation();
    if (!tool.link) {
      setDetailTool(tool);
      return;
    }

    // Increment click counter in Firestore for remote tools
    if (!tool.id.startsWith("default-") && !tool.id.startsWith("local-")) {
      try {
        await updateDoc(doc(db, "Tools", tool.id), {
          clicks: increment(1),
        });
      } catch (_) {}
    }

    window.open(tool.link, "_blank", "noopener,noreferrer");
  };

  // Copy tool link to clipboard
  const handleCopyLink = (tool, e) => {
    if (e) e.stopPropagation();
    const urlToCopy = tool.link || window.location.href;
    try {
      navigator.clipboard.writeText(urlToCopy);
      toast.success(
        language === "vi"
          ? "Đã sao chép liên kết công cụ!"
          : "Tool link copied to clipboard!"
      );
    } catch {
      toast.info(urlToCopy);
    }
  };

  // Reset Add Form
  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormImgUrl("");
    setFormLink("");
    setFormCategory("AI");
    setShowCategorySuggestions(false);
    setImagePreviewError(false);
    setEditingTool(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (tool) => {
    setEditingTool(tool);
    setFormTitle(tool.title || "");
    setFormDesc(tool.description || "");
    setFormImgUrl(tool.imgUrl || "");
    setFormLink(tool.link || "");
    setFormCategory(normalizeCategory(tool.category));
    setShowCategorySuggestions(false);
    setImagePreviewError(false);
    setActiveMenuId(null);
    setDetailTool(null);
    setShowAddModal(true);
  };

  // Image Upload helper
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        language === "vi"
          ? "Vui lòng chọn tệp hình ảnh hợp lệ!"
          : "Please select a valid image file!"
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        language === "vi" ? "Dung lượng ảnh tối đa 10MB!" : "Image size must not exceed 10MB!"
      );
      return;
    }

    setIsUploadingImg(true);
    try {
      const uploadedUrl = await uploadToCloudinary(file, { folder: "vibook/tools" });
      setFormImgUrl(uploadedUrl);
      setImagePreviewError(false);
      toast.success(
        language === "vi" ? "Tải ảnh thành công!" : "Image uploaded successfully!"
      );
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      toast.error(
        language === "vi" ? "Tải ảnh thất bại!" : "Failed to upload image!"
      );
    } finally {
      setIsUploadingImg(false);
      e.target.value = "";
    }
  };

  // Save (Create or Update) Tool
  const handleSubmitTool = async (e) => {
    e.preventDefault();

    const titleTrimmed = formTitle.trim();
    const descTrimmed = formDesc.trim();
    const imgTrimmed = formImgUrl.trim();
    const linkTrimmed = formLink.trim();
    const categoryTrimmed = formCategory.trim() || (language === "vi" ? "Tiện ích" : "Utilities");

    if (!titleTrimmed) {
      toast.error(language === "vi" ? "Vui lòng nhập tên công cụ!" : "Please enter tool name!");
      return;
    }
    if (!descTrimmed) {
      toast.error(
        language === "vi" ? "Vui lòng nhập thông tin mô tả!" : "Please enter description!"
      );
      return;
    }
    if (!imgTrimmed) {
      toast.error(
        language === "vi" ? "Vui lòng nhập link hình ảnh!" : "Please provide an image link!"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTool) {
        // UPDATE
        const updatedData = {
          title: titleTrimmed,
          description: descTrimmed,
          imgUrl: imgTrimmed,
          link: linkTrimmed,
          category: categoryTrimmed,
          updatedAt: new Date().toISOString(),
        };

        let updatedRemote = false;
        if (currentUser && !editingTool.id.startsWith("default-") && !editingTool.id.startsWith("local-")) {
          try {
            await updateDoc(doc(db, "Tools", editingTool.id), {
              ...updatedData,
              updatedAt: serverTimestamp(),
            });
            updatedRemote = true;
          } catch (err) {
            console.warn("Update remote failed, will update locally:", err);
          }
        }

        // Update local list
        const updatedLocal = localTools.map((item) =>
          item.id === editingTool.id ? { ...item, ...updatedData } : item
        );
        saveLocalTools(updatedLocal);

        toast.success(
          language === "vi"
            ? "Cập nhật công cụ thành công!"
            : "Tool updated successfully!"
        );
      } else {
        // CREATE
        const newToolObj = {
          title: titleTrimmed,
          description: descTrimmed,
          imgUrl: imgTrimmed,
          link: linkTrimmed,
          category: categoryTrimmed,
          ownerId: currentUser?.uid || "guest",
          authorName: currentUser?.displayName || (language === "vi" ? "Thành viên Vibook" : "Vibook Member"),
          clicks: 0,
          favoriteCount: 0,
          createdAt: new Date().toISOString(),
        };

        let createdInFirestore = false;
        if (currentUser) {
          try {
            const docRef = await addDoc(collection(db, "Tools"), {
              ...newToolObj,
              createdAt: serverTimestamp(),
            });
            newToolObj.id = docRef.id;
            createdInFirestore = true;
          } catch (err) {
            console.warn("Create remote doc failed, saving locally:", err);
          }
        }

        if (!createdInFirestore) {
          newToolObj.id = `local-${Date.now()}`;
          const nextLocal = [newToolObj, ...localTools];
          saveLocalTools(nextLocal);
        }

        toast.success(
          language === "vi"
            ? `Đã thêm công cụ vào danh mục "${categoryTrimmed}"!`
            : "Tool added successfully!"
        );
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Save tool error:", err);
      toast.error(language === "vi" ? "Có lỗi xảy ra, vui lòng thử lại!" : "An error occurred!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Tool
  const handleDeleteTool = async (tool) => {
    if (tool.id.startsWith("default-")) {
      toast.error(
        language === "vi"
          ? "Không thể xóa công cụ mặc định của hệ thống!"
          : "Cannot delete system default tools!"
      );
      return;
    }

    const confirmMsg =
      language === "vi"
        ? `Bạn có chắc muốn xóa công cụ "${tool.title}" không?`
        : `Are you sure you want to delete "${tool.title}"?`;

    const ok = await confirmDialog(confirmMsg, { confirmText: language === "vi" ? "Xóa" : "Delete" });
    if (!ok) return;

    try {
      if (currentUser && !tool.id.startsWith("local-")) {
        try {
          await deleteDoc(doc(db, "Tools", tool.id));
        } catch (err) {
          console.warn("Delete remote doc error:", err);
        }
      }

      const nextLocal = localTools.filter((t) => t.id !== tool.id);
      saveLocalTools(nextLocal);

      toast.success(
        language === "vi" ? "Đã xóa công cụ thành công!" : "Tool deleted successfully!"
      );
      setActiveMenuId(null);
      setDetailTool(null);
    } catch (err) {
      console.error("Delete tool error:", err);
      toast.error(language === "vi" ? "Xóa thất bại!" : "Failed to delete tool!");
    }
  };

  // Helper for category badge class
  const getCategoryBadgeClass = (cat) => {
    const norm = normalizeCategory(cat).toLowerCase();
    if (norm === "ai") return "tool-cat--ai";
    if (norm === "lập trình") return "tool-cat--dev";
    if (norm === "thiết kế") return "tool-cat--design";
    if (norm === "năng suất") return "tool-cat--productivity";
    if (norm === "tiện ích") return "tool-cat--utilities";
    if (norm === "học tập") return "tool-cat--education";
    return "tool-cat--custom";
  };

  return (
    <div className="page-shell tools-page">
      <SEO
        title={
          language === "vi"
            ? "Kho Công Cụ & Tiện Ích Công Nghệ"
            : language === "ja"
            ? "ツール＆ユーティリティ"
            : "Developer & Utility Tools"
        }
        description={
          language === "vi"
            ? "Khám phá danh sách các công cụ hữu ích về AI, thiết kế đồ họa, lập trình, nâng cao năng suất và tiện ích cho lập trình viên."
            : "Explore developer tools, AI software, design platforms and productivity utilities on ThoDev."
        }
        slug="/tools"
      />

      <div ref={toolListTopRef} className="w-full">
        {/* ================= UNIFIED PAGE HEADER BANNER ================= */}
        <PageHeaderBanner
          icon={FaWrench}
          title={
            language === "vi"
              ? "Kho Công Cụ"
              : language === "ja"
              ? "ツール＆ユーティリティ"
              : "Developer Tools"
          }
          subtitle="TOOL HUB"
          badge={`(${totalItems})`}
        >
          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-neutral-900/40 dark:bg-neutral-900/60 border border-purple-500/20 rounded-lg px-2 py-1.5 text-xs text-inherit cursor-pointer font-medium outline-none"
            title="Sắp xếp"
          >
            <option value="newest" className="bg-neutral-900 text-white">
              {language === "vi" ? "Mới nhất" : "Newest"}
            </option>
            <option value="popular" className="bg-neutral-900 text-white">
              {language === "vi" ? "Phổ biến nhất" : "Most Popular"}
            </option>
            <option value="oldest" className="bg-neutral-900 text-white">
              {language === "vi" ? "Cũ nhất" : "Oldest"}
            </option>
            <option value="alpha" className="bg-neutral-900 text-white">
              {language === "vi" ? "Tên A-Z" : "Name A-Z"}
            </option>
          </select>

          {/* Per page selector */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-neutral-900/40 dark:bg-neutral-900/60 border border-purple-500/20 rounded-lg px-2 py-1.5 text-xs text-inherit cursor-pointer font-medium outline-none"
            title="Hiển thị mỗi trang"
          >
            <option value={12} className="bg-neutral-900 text-white">
              12 / trang
            </option>
            <option value={18} className="bg-neutral-900 text-white">
              18 / trang
            </option>
            <option value={24} className="bg-neutral-900 text-white">
              24 / trang
            </option>
            <option value={36} className="bg-neutral-900 text-white">
              36 / trang
            </option>
          </select>

          {/* Add Tool Button */}
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
          >
            <FaPlus size={10} />
            <span>{language === "vi" ? "Thêm công cụ" : "Add Tool"}</span>
          </button>
        </PageHeaderBanner>

        {/* ================= CATEGORY FILTER TABS & SEARCH INDICATOR ================= */}
        <div className="flex items-center justify-between gap-3 mb-4 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 flex-nowrap">
            {categoryFilters.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const isFavTab = cat.isFavTab;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`tools-filter-pill ${isActive ? "is-active" : ""} ${
                    isFavTab ? "tools-filter-pill--fav" : ""
                  }`}
                >
                  {isFavTab && <FaHeart size={10} className="text-red-400" />}
                  <span>{cat.label}</span>
                  <span className="tools-filter-count">{cat.count}</span>
                </button>
              );
            })}
          </div>

          {/* Header search active badge */}
          {activeSearch && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 whitespace-nowrap">
              <span>
                {language === "vi" ? `Tìm: "${headerSearch}"` : `Search: "${headerSearch}"`}
              </span>
              <button
                type="button"
                onClick={() => setHeaderSearch("")}
                className="hover:text-white transition ml-1"
                title="Xóa tìm kiếm"
              >
                <FaTimes size={10} />
              </button>
            </div>
          )}
        </div>

        {/* ================= COMPACT TOOLS GRID (LIKE PLAYGAME) ================= */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[240px] gap-2.5">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-400">
              {language === "vi" ? "Đang tải danh sách công cụ..." : "Loading tools..."}
            </span>
          </div>
        ) : currentItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
              {currentItems.map((tool) => {
                const isOwner =
                  currentUser && tool.ownerId && currentUser.uid === tool.ownerId;
                const isCustomLocal = tool.id.startsWith("local-");
                const canModify = isOwner || isCustomLocal;
                const isFavorited = favoriteIds.has(tool.id);
                const categoryNormalized = normalizeCategory(tool.category);
                const catBadgeClass = getCategoryBadgeClass(tool.category);

                return (
                  <div key={tool.id} className="tool-card group">
                    {/* Thumbnail banner with Image */}
                    <div
                      className="tool-card__thumbnail"
                      onClick={() => setDetailTool(tool)}
                      title={tool.title}
                    >
                      <img
                        src={tool.imgUrl || FALLBACK_IMAGE}
                        alt={tool.title}
                        className="tool-card__img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                      <div className="tool-card__gradient-overlay" />

                      {/* Category Badge top-left */}
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <span className={`tool-category-badge ${catBadgeClass}`}>
                          {categoryNormalized}
                        </span>
                      </div>

                      {/* Top-Right Action Controls (Favorite + 3-dots Menu) */}
                      <div
                        className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(tool, e)}
                          className={`tool-fav-btn ${isFavorited ? "is-favorited" : ""}`}
                          title={
                            isFavorited
                              ? language === "vi"
                                ? "Bỏ yêu thích"
                                : "Remove favorite"
                              : language === "vi"
                              ? "Lưu yêu thích"
                              : "Favorite"
                          }
                          aria-label="Yêu thích"
                        >
                          {isFavorited ? (
                            <FaHeart size={10} className="text-red-500" />
                          ) : (
                            <FaRegHeart size={10} />
                          )}
                        </button>

                        {/* Owner 3-dots menu */}
                        {canModify && (
                          <div data-tool-menu={tool.id} className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === tool.id ? null : tool.id);
                              }}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 hover:bg-black/90 text-white/85 hover:text-white flex items-center justify-center backdrop-blur-sm transition shadow-sm border border-white/15"
                              title="Tùy chọn"
                              aria-label="Tùy chọn"
                            >
                              <FaEllipsisV size={9} />
                            </button>

                            {activeMenuId === tool.id && (
                              <div className="absolute right-0 mt-1 w-28 rounded-lg shadow-xl py-1 bg-neutral-900/95 border border-purple-500/30 backdrop-blur-md text-xs z-30">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(tool);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 text-neutral-200 transition"
                                >
                                  <FaEdit size={10} className="text-purple-400" />
                                  <span>{language === "vi" ? "Sửa" : "Edit"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTool(tool);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 hover:bg-red-500/20 flex items-center gap-2 text-red-400 transition"
                                >
                                  <FaTrash size={10} />
                                  <span>{language === "vi" ? "Xóa" : "Delete"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compact Card Content */}
                    <div className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between gap-1.5">
                      <div className="min-w-0">
                        {/* Title */}
                        <h3
                          className="text-xs sm:text-sm font-semibold truncate text-inherit group-hover:text-purple-400 transition-colors cursor-pointer"
                          title={tool.title}
                          onClick={() => setDetailTool(tool)}
                        >
                          {tool.title}
                        </h3>

                        {/* Description (Thong tin mo ta ngan gon) */}
                        {tool.description && (
                          <p
                            className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 leading-tight"
                            title={tool.description}
                          >
                            {tool.description}
                          </p>
                        )}

                        {/* Click count indicator if any */}
                        {tool.clicks > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-1">
                            <FaMousePointer size={8} className="text-purple-400/80" />
                            <span>
                              {tool.clicks}{" "}
                              {language === "vi" ? "lượt mở" : "clicks"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {tool.link ? (
                          <button
                            type="button"
                            onClick={(e) => handleLaunchTool(tool, e)}
                            className="flex-1 py-1 sm:py-1.5 px-2 text-[11px] sm:text-xs font-medium rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition flex items-center justify-center gap-1 shadow-sm truncate cursor-pointer"
                            title={language === "vi" ? "Mở công cụ" : "Launch"}
                          >
                            <FaGlobe size={10} />
                            <span>{language === "vi" ? "Mở" : "Open"}</span>
                            <FaExternalLinkAlt size={8} className="opacity-70 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDetailTool(tool)}
                            className="flex-1 py-1 sm:py-1.5 px-2 text-[11px] sm:text-xs font-medium rounded-md bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center justify-center gap-1 truncate cursor-pointer"
                          >
                            <FaEye size={10} />
                            <span>{language === "vi" ? "Xem" : "View"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDetailTool(tool)}
                          className="p-1 sm:p-1.5 rounded-md bg-neutral-800/70 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-white/10 text-xs transition cursor-pointer flex-shrink-0"
                          title={language === "vi" ? "Xem chi tiết" : "View details"}
                        >
                          <FaEye size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ================= PAGINATION CONTROLS ("PHẦN TRANG") ================= */}
            <div className="mt-6 pt-3 border-t border-purple-500/15 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Range summary info */}
              <div className="text-xs text-neutral-400">
                {language === "vi"
                  ? `Hiển thị ${startIndex + 1} - ${Math.min(
                      startIndex + itemsPerPage,
                      totalItems
                    )} trên ${totalItems} công cụ (Trang ${currentPage}/${totalPages})`
                  : `Showing ${startIndex + 1} - ${Math.min(
                      startIndex + itemsPerPage,
                      totalItems
                    )} of ${totalItems} tools (Page ${currentPage}/${totalPages})`}
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1">
                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="tools-pagination-btn"
                  title={language === "vi" ? "Trang trước" : "Previous page"}
                >
                  <FaChevronLeft size={9} className="mr-1" />
                  <span className="hidden sm:inline">
                    {language === "vi" ? "Trước" : "Prev"}
                  </span>
                </button>

                {/* Numbered Page Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const isCurrent = pageNum === currentPage;
                  const isNear = Math.abs(pageNum - currentPage) <= 1;
                  const isEdge = pageNum === 1 || pageNum === totalPages;

                  if (!isNear && !isEdge) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="px-1 text-neutral-500 text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`tools-pagination-btn ${isCurrent ? "is-active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="tools-pagination-btn"
                  title={language === "vi" ? "Trang sau" : "Next page"}
                >
                  <span className="hidden sm:inline">
                    {language === "vi" ? "Sau" : "Next"}
                  </span>
                  <FaChevronRight size={9} className="ml-1" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center vb-glass rounded-xl border border-purple-500/20 my-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2.5">
              <FaWrench size={20} />
            </div>
            <h3 className="text-base font-bold text-inherit mb-1">
              {language === "vi" ? "Không tìm thấy công cụ nào" : "No tools found"}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-4">
              {selectedCategory === "favorites"
                ? language === "vi"
                  ? "Bạn chưa lưu công cụ yêu thích nào. Hãy bấm vào biểu tượng trái tim để lưu lại nhé!"
                  : "You haven't bookmarked any tools yet."
                : activeSearch
                ? language === "vi"
                  ? `Không có kết quả nào khớp với từ khóa "${headerSearch}".`
                  : `No results match keyword "${headerSearch}".`
                : language === "vi"
                ? "Chưa có công cụ nào trong danh mục này."
                : "No tools in this category yet."}
            </p>
            <div className="flex items-center gap-2">
              {activeSearch && (
                <button
                  type="button"
                  onClick={() => setHeaderSearch("")}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium transition cursor-pointer"
                >
                  {language === "vi" ? "Xóa tìm kiếm" : "Clear search"}
                </button>
              )}
              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium transition cursor-pointer"
                >
                  {language === "vi" ? "Xem tất cả" : "View all"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <FaPlus size={10} />
                <span>{language === "vi" ? "Thêm công cụ mới" : "Add tool"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT TOOL ================= */}
      {showAddModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="tool-detail-backdrop"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="tool-detail-modal p-4 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  {editingTool ? <FaEdit size={12} /> : <FaPlus size={12} />}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-inherit">
                  {editingTool
                    ? language === "vi"
                      ? "Chỉnh sửa công cụ"
                      : "Edit Tool"
                    : language === "vi"
                    ? "Thêm công cụ mới"
                    : "Add New Tool"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-6 h-6 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
              >
                <FaTimes size={11} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitTool} className="flex flex-col gap-3 text-xs sm:text-sm">
              {/* Field 1: Tool Name */}
              <div>
                <label className="block font-semibold mb-1 text-inherit text-xs">
                  {language === "vi" ? "Tên công cụ" : "Tool Name"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    language === "vi"
                      ? "Ví dụ: ChatGPT, Canva, GitHub Copilot..."
                      : "e.g. ChatGPT, Figma, Notion..."
                  }
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-purple-500/20 focus:border-purple-500/60 outline-none text-inherit text-xs sm:text-sm transition"
                />
              </div>

              {/* Field 2: Category (Type to add new + Suggestions dropdown) */}
              <div className="relative" ref={categoryDropdownRef}>
                <label className="block font-semibold mb-1 text-inherit text-xs">
                  {language === "vi" ? "Danh mục" : "Category"}{" "}
                  <span className="text-red-400">*</span>{" "}
                  <span className="text-[11px] font-normal text-neutral-400">
                    ({language === "vi" ? "Chọn gợi ý hoặc nhập danh mục mới" : "Select or type new"})
                  </span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      setShowCategorySuggestions(true);
                    }}
                    onFocus={() => setShowCategorySuggestions(true)}
                    placeholder={
                      language === "vi"
                        ? "Nhập danh mục (VD: AI, Lập trình, DevOps, Marketing...)"
                        : "Type category (e.g. AI, DevOps, Design...)"
                    }
                    className="w-full px-3 py-2 pr-8 rounded-lg bg-neutral-900/50 border border-purple-500/20 focus:border-purple-500/60 outline-none text-inherit text-xs sm:text-sm transition"
                  />
                  {formCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormCategory("");
                        setShowCategorySuggestions(true);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      title="Clear"
                    >
                      <FaTimes size={10} />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showCategorySuggestions && (
                  <div className="tools-category-dropdown">
                    {/* Prompt to add brand-new category if user typed something not yet matching */}
                    {formCategory.trim() && !isExactCategoryMatch && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategorySuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-purple-600/25 text-purple-300 font-semibold flex items-center gap-2 border-b border-white/10 transition text-xs"
                      >
                        <FaPlus size={9} />
                        <span>
                          {language === "vi"
                            ? `Dùng danh mục mới: "${formCategory.trim()}"`
                            : `Use new category: "${formCategory.trim()}"`}
                        </span>
                      </button>
                    )}

                    {/* Matching existing suggestions */}
                    {filteredCategorySuggestions.length > 0 ? (
                      filteredCategorySuggestions.map((catName) => {
                        const isSelected =
                          formCategory.trim().toLowerCase() === catName.toLowerCase();
                        return (
                          <button
                            key={catName}
                            type="button"
                            onClick={() => {
                              setFormCategory(catName);
                              setShowCategorySuggestions(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-white/10 flex items-center justify-between text-neutral-200 transition text-xs ${
                              isSelected ? "bg-purple-600/30 text-white font-semibold" : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <FaTag size={9} className="text-purple-400/80" />
                              {catName}
                            </span>
                            {isSelected && <FaCheck size={9} className="text-purple-400" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-neutral-400 italic text-xs">
                        {language === "vi"
                          ? `Chưa có danh mục này — sẽ tạo mới là "${formCategory.trim()}" khi lưu!`
                          : `Category not in list — will be created as new!`}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick suggestion pills */}
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-neutral-400">
                    {language === "vi" ? "Gợi ý nhanh:" : "Suggestions:"}
                  </span>
                  {allCategoryNames.slice(0, 7).map((catName) => {
                    const isSelected =
                      formCategory.trim().toLowerCase() === catName.toLowerCase();
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => {
                          setFormCategory(catName);
                          setShowCategorySuggestions(false);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                          isSelected
                            ? "bg-purple-500/25 border-purple-500 text-purple-300 font-semibold"
                            : "bg-neutral-800/60 border-white/10 text-neutral-300 hover:bg-neutral-700"
                        }`}
                      >
                        {catName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Image URL + Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-inherit text-xs">
                    {language === "vi" ? "Link hình ảnh" : "Image Link (URL)"}{" "}
                    <span className="text-red-400">*</span>
                  </label>

                  {/* Upload from PC */}
                  <label className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer font-medium">
                    {isUploadingImg ? (
                      <div className="w-2.5 h-2.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaUpload size={9} />
                    )}
                    <span>
                      {isUploadingImg
                        ? language === "vi"
                          ? "Đang tải..."
                          : "Uploading..."
                        : language === "vi"
                        ? "Tải ảnh từ máy"
                        : "Upload image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImg}
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="url"
                  required
                  value={formImgUrl}
                  onChange={(e) => {
                    setFormImgUrl(e.target.value);
                    setImagePreviewError(false);
                  }}
                  placeholder="https://images.unsplash.com/... hoặc dán link ảnh"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-purple-500/20 focus:border-purple-500/60 outline-none text-inherit text-xs sm:text-sm transition"
                />

                {/* Live Image Preview Box */}
                {formImgUrl.trim() && (
                  <div className="mt-2">
                    <span className="block text-[11px] text-neutral-400 mb-1">
                      {language === "vi" ? "Xem trước ảnh:" : "Image preview:"}
                    </span>
                    <div className="tool-img-preview-box">
                      {imagePreviewError ? (
                        <div className="flex flex-col items-center justify-center p-3 text-center text-red-400 text-xs">
                          <FaInfoCircle size={16} className="mb-1 opacity-80" />
                          <span>
                            {language === "vi"
                              ? "Không thể tải ảnh từ link này. Vui lòng kiểm tra lại!"
                              : "Unable to load image from URL."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <img
                            src={formImgUrl}
                            alt="Live Preview"
                            onError={() => setImagePreviewError(true)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormImgUrl("");
                              setImagePreviewError(false);
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/75 hover:bg-black text-white text-xs transition"
                            title="Xóa link ảnh"
                          >
                            <FaTimes size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 4: Description (Thong tin mo ta) */}
              <div>
                <label className="block font-semibold mb-1 text-inherit text-xs">
                  {language === "vi" ? "Thông tin mô tả" : "Description"}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder={
                    language === "vi"
                      ? "Mô tả ngắn gọn tính năng, công dụng hoặc cách sử dụng công cụ..."
                      : "Describe features, use cases or what this tool does..."
                  }
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-purple-500/20 focus:border-purple-500/60 outline-none text-inherit text-xs sm:text-sm transition resize-none"
                />
              </div>

              {/* Field 5: Tool Website Link */}
              <div>
                <label className="block font-semibold mb-1 text-inherit text-xs">
                  {language === "vi" ? "Link truy cập công cụ (Website / Ứng dụng)" : "Tool Website Link"}
                </label>
                <input
                  type="url"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900/50 border border-purple-500/20 focus:border-purple-500/60 outline-none text-inherit text-xs sm:text-sm transition"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImg}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {editingTool
                      ? language === "vi"
                        ? "Lưu thay đổi"
                        : "Save"
                      : language === "vi"
                      ? "Thêm công cụ"
                      : "Create"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL: TOOL DETAILS ================= */}
      {detailTool &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="tool-detail-backdrop"
            onClick={() => setDetailTool(null)}
          >
            <div
              className="tool-detail-modal p-4 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <span className={`tool-category-badge ${getCategoryBadgeClass(detailTool.category)}`}>
                  {normalizeCategory(detailTool.category)}
                </span>
                {detailTool.authorName && (
                  <span className="text-xs text-neutral-400">
                    bởi {detailTool.authorName}
                  </span>
                )}
                {detailTool.clicks > 0 && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1 ml-1">
                    <FaMousePointer size={9} className="text-purple-400" />
                    {detailTool.clicks}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailTool(null)}
                className="w-6 h-6 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
              >
                <FaTimes size={11} />
              </button>
            </div>

            {/* High-res Image */}
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-purple-500/20">
              <img
                src={detailTool.imgUrl || FALLBACK_IMAGE}
                alt={detailTool.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-inherit mb-1.5">
              {detailTool.title}
            </h2>

            {/* Description (Thong tin mo ta day du) */}
            <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4 whitespace-pre-line p-3 rounded-lg bg-purple-500/5 border border-purple-500/15">
              {detailTool.description}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-purple-500/20">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDetailTool(null)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
                >
                  {language === "vi" ? "Đóng" : "Close"}
                </button>

                {/* Copy Link Button */}
                {detailTool.link && (
                  <button
                    type="button"
                    onClick={(e) => handleCopyLink(detailTool, e)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1"
                    title={language === "vi" ? "Sao chép liên kết" : "Copy link"}
                  >
                    <FaCopy size={11} />
                    <span className="hidden sm:inline">
                      {language === "vi" ? "Sao chép link" : "Copy"}
                    </span>
                  </button>
                )}

                {/* Favorite Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleFavorite(detailTool, e)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                    favoriteIds.has(detailTool.id)
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                  }`}
                  title={
                    favoriteIds.has(detailTool.id)
                      ? language === "vi"
                        ? "Bỏ yêu thích"
                        : "Remove favorite"
                      : language === "vi"
                      ? "Lưu yêu thích"
                      : "Favorite"
                  }
                >
                  {favoriteIds.has(detailTool.id) ? (
                    <FaHeart size={11} className="text-red-500" />
                  ) : (
                    <FaRegHeart size={11} />
                  )}
                  <span>
                    {favoriteIds.has(detailTool.id)
                      ? language === "vi"
                        ? "Đã lưu"
                        : "Saved"
                      : language === "vi"
                      ? "Lưu"
                      : "Save"}
                  </span>
                </button>
              </div>

              {/* Right side actions: Launch tool & Owner controls */}
              <div className="flex items-center gap-1.5">
                {(currentUser && detailTool.ownerId === currentUser.uid) ||
                detailTool.id.startsWith("local-") ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(detailTool)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                      title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                    >
                      <FaEdit size={10} />
                      <span>{language === "vi" ? "Sửa" : "Edit"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTool(detailTool)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                      title={language === "vi" ? "Xóa" : "Delete"}
                    >
                      <FaTrash size={10} />
                      <span>{language === "vi" ? "Xóa" : "Delete"}</span>
                    </button>
                  </>
                ) : null}

                {detailTool.link && (
                  <button
                    type="button"
                    onClick={(e) => handleLaunchTool(detailTool, e)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/30 transition cursor-pointer"
                  >
                    <FaGlobe size={11} />
                    <span>{language === "vi" ? "Mở công cụ" : "Launch Tool"}</span>
                    <FaExternalLinkAlt size={9} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
