import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../components/firebase";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from '../context/LanguageContext';
import { FaPlus, FaTimes, FaGamepad, FaEllipsisV, FaEdit, FaTrash, FaCheck, FaUpload } from "react-icons/fa";
import { Search } from "lucide-react";
import { requireLogin } from "../utils/requireLogin";
import { useSearch } from "../context/SearchContext";
import { uploadToCloudinary } from "../utils/cloudinary";
import "../style/game/Game.css";

const Games = () => {

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const cls = {
    page: "",
    surface: "vb-glass rounded-xl p-4",
    border: "border border-purple-500/20",
    shadow: "shadow-md hover:shadow-lg transition duration-200",
    muted: "opacity-75",
    input: "vb-input",
    ringFocus: "",
    menu: "vb-glass text-inherit",
    backdrop: "fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm",
  };

  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGameId, setEditingGameId] = useState(null);

  const [gameTitle, setGameTitle] = useState("");
  const [gameDesc, setGameDesc] = useState("");
  const [gameLink, setGameLink] = useState("");
  const [gameImg, setGameImg] = useState("");

  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedDesc, setUpdatedDesc] = useState("");
  const [updatedLink, setUpdatedLink] = useState("");
  const [updatedImg, setUpdatedImg] = useState("");

  const [isUploadingCreateImg, setIsUploadingCreateImg] = useState(false);
  const [isUploadingEditImg, setIsUploadingEditImg] = useState(false);

  const handleImageUpload = async (e, type = "create") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 10MB!");
      return;
    }

    const setUploading = type === "create" ? setIsUploadingCreateImg : setIsUploadingEditImg;
    const setImage = type === "create" ? setGameImg : setUpdatedImg;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, { folder: "vibook/games" });
      setImage(url);
      toast.success("Tải ảnh lên Cloudinary thành công!");
    } catch (err) {
      console.error("Cloudinary upload error:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const [showOptions, setShowOptions] = useState(null);
  const { keyword: search, setSearchConfig } = useSearch();

  useEffect(() => {
    setSearchConfig({
      placeholder: "Tìm kiếm trò chơi...",
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig]);

  const modalRef = useRef(null);

  // Close modal / menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowCreateModal(false);
      }
      if (showOptions && !e.target.closest?.(`[data-game-id="${showOptions}"]`)) {
        setShowOptions(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptions]);

  // Auth (list is public; create/edit need login)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Load games
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "Games"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGames(list);
        setFilteredGames(list);
        setIsLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load games");
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Search
  useEffect(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return setFilteredGames(games);
    setFilteredGames(
      games.filter((g) => (g.title ?? "").toLowerCase().includes(kw))
    );
  }, [search, games]);

  // Create
  const handleCreateGame = useCallback(
    async (e) => {
      e.preventDefault();
      const user = requireLogin({
        navigate,
        message: "Please log in to create a game",
      });
      if (!user) return;
      if (!gameTitle.trim() || !gameLink.trim() || !gameImg.trim())
        return toast.error("Please fill in all required fields");

      try {
        await addDoc(collection(db, "Games"), {
          title: gameTitle.trim(),
          description: gameDesc.trim() || "No description",
          link: gameLink.trim(),
          imgUrl: gameImg.trim(),
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
        setGameTitle(""); setGameDesc(""); setGameLink(""); setGameImg("");
        setShowCreateModal(false);
        toast.success("Game created!");
      } catch (e) {
        console.error(e);
        toast.error("Create failed");
      }
    },
    [gameTitle, gameDesc, gameLink, gameImg, navigate]
  );

  // Update
  const handleUpdateGame = useCallback(
    async (e, game) => {
      e.preventDefault();
      if (!currentUser || !game)
        return toast.error("Invalid action");
      if (game.id.startsWith("default-") || currentUser.uid !== game.ownerId)
        return toast.error("Only owner can update; default games are locked");

      try {
        await updateDoc(doc(db, "Games", game.id), {
          title: updatedTitle.trim() || game.title,
          description: updatedDesc.trim() || game.description,
          link: updatedLink.trim() || game.link,
          imgUrl: updatedImg.trim() || game.imgUrl,
        });
        setEditingGameId(null);
        setUpdatedTitle(""); setUpdatedDesc(""); setUpdatedLink(""); setUpdatedImg("");
        toast.success("Game updated!");
      } catch (e) {
        console.error(e);
        toast.error("Update failed");
      }
    },
    [currentUser, updatedTitle, updatedDesc, updatedLink, updatedImg]
  );

  // Delete
  const handleDeleteGame = async (id, ownerId) => {
    if (!currentUser || currentUser.uid !== ownerId || id.startsWith("default-"))
      return toast.error("Only owner can delete; default games are locked");
    try {
      await deleteDoc(doc(db, "Games", id));
      setShowOptions(null);
      toast.success("Game deleted!");
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="page-shell">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaGamepad className="text-pink-500" /> {t("gameTitleCount")} ({games.length})
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* <input
              type="text"
              placeholder="🔍 Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full sm:w-64 px-4 py-2 rounded-full ${cls.input} ${cls.ringFocus}`}
            /> */}




            <button
              type="button"
              onClick={() => {
                if (
                  !requireLogin({
                    navigate,
                    message: "Please log in to create a game",
                  })
                ) {
                  return;
                }
                setShowCreateModal(true);
              }}
              className="vb-btn vb-btn--primary"
            >
              <FaPlus size={14} />
              {t("addGame")}
            </button>

          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className={cls.backdrop}>
            <div ref={modalRef} className={`${cls.surface} ${cls.border} rounded-xl p-6 w-full max-w-md`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold"> {t("addNewgame")} </h3>
                <button className={`${cls.muted} hover:opacity-80`} onClick={() => setShowCreateModal(false)}>
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateGame} className="space-y-3">
                <input
                  type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                  placeholder={t("gameTitle")} className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <textarea
                  value={gameDesc} onChange={(e) => setGameDesc(e.target.value)}
                  placeholder={t("descriptionGame")} rows={2}
                  className={`w-full p-2 ${cls.input} ${cls.ringFocus}`}
                />
                <input
                  type="url" value={gameLink} onChange={(e) => setGameLink(e.target.value)}
                  placeholder={t("gameLink")} className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium opacity-85">Hình ảnh trò chơi</label>
                    <label className="cursor-pointer text-xs text-pink-500 hover:text-pink-400 font-medium flex items-center gap-1.5 transition">
                      {isUploadingCreateImg ? (
                        <div className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FaUpload size={11} />
                      )}
                      <span>{isUploadingCreateImg ? "Đang tải lên Cloudinary..." : "Tải ảnh từ máy"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingCreateImg}
                        onChange={(e) => handleImageUpload(e, "create")}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="url" value={gameImg} onChange={(e) => setGameImg(e.target.value)}
                    placeholder="URL ảnh hoặc tải ảnh từ máy" className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                  />
                  {gameImg && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-purple-500/20 bg-neutral-900/40">
                      <img
                        src={gameImg}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setGameImg("")}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs transition"
                        title="Xóa ảnh"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" className={`${cls.muted}`} onClick={() => setShowCreateModal(false)}>
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingCreateImg}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploadingCreateImg && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{t("addGame")}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => {
              const isEditing = editingGameId === game.id;
              const isOwner = currentUser && currentUser.uid === game.ownerId && !game.id.startsWith("default-");

              return (
                <div
                  key={game.id}
                  className="group relative flex flex-col vb-glass border border-purple-500/20 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Small 3-dots owner menu */}
                  {isOwner && !isEditing && (
                    <div className="absolute top-1.5 right-1.5 z-10" data-game-id={game.id}>
                      <button
                        type="button"
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/50 hover:bg-black/80 text-white/85 hover:text-white flex items-center justify-center backdrop-blur-sm transition shadow-sm border border-white/10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowOptions(showOptions === game.id ? null : game.id);
                        }}
                        title="Tùy chọn"
                        aria-label="Tùy chọn"
                      >
                        <FaEllipsisV size={9} />
                      </button>

                      {showOptions === game.id && (
                        <div className="absolute right-0 mt-1 w-28 rounded-lg shadow-xl z-20 py-1 bg-neutral-900/95 border border-white/15 backdrop-blur-md text-xs">
                          <button
                            type="button"
                            className="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 text-neutral-200 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingGameId(game.id);
                              setUpdatedTitle(game.title || "");
                              setUpdatedDesc(game.description || "");
                              setUpdatedLink(game.link || "");
                              setUpdatedImg(game.imgUrl || "");
                              setShowOptions(null);
                            }}
                          >
                            <FaEdit size={11} className="text-purple-400" />
                            <span>{t("edit") || "Sửa"}</span>
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-2.5 py-1.5 hover:bg-red-500/20 flex items-center gap-2 text-red-400 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteGame(game.id, game.ownerId);
                              setShowOptions(null);
                            }}
                          >
                            <FaTrash size={11} />
                            <span>{t("delete") || "Xóa"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-full aspect-[16/10] bg-neutral-900/40 overflow-hidden shrink-0">
                    <img
                      src={isEditing ? (updatedImg || game.imgUrl) : game.imgUrl}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 pointer-events-none" />
                    {isEditing && (
                      <label className="absolute inset-0 bg-black/45 hover:bg-black/65 transition cursor-pointer flex flex-col items-center justify-center text-white text-[10px] font-medium gap-1 z-10">
                        {isUploadingEditImg ? (
                          <div className="flex items-center gap-1.5 bg-black/75 px-2.5 py-1 rounded-full text-[11px] shadow">
                            <div className="w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                            <span>Đang tải lên Cloudinary...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-black/70 hover:bg-black/90 px-2.5 py-1 rounded-md text-[10px] shadow border border-white/20 backdrop-blur-sm">
                            <FaUpload size={9} />
                            <span>Đổi ảnh từ máy</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingEditImg}
                          onChange={(e) => handleImageUpload(e, "edit")}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Body: Inline Edit Form OR Compact Card Content */}
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleUpdateGame(e, game)}
                      className="p-2 sm:p-2.5 flex flex-col gap-1.5 flex-1 bg-black/10 dark:bg-black/25 text-left"
                    >
                      <div>
                        <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5 font-medium">Tên trò chơi</label>
                        <input
                          type="text"
                          value={updatedTitle}
                          onChange={(e) => setUpdatedTitle(e.target.value)}
                          placeholder="Tên game"
                          className="w-full px-2 py-1 text-xs rounded border border-purple-500/30 bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-pink-500 transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5 font-medium">Mô tả</label>
                        <input
                          type="text"
                          value={updatedDesc}
                          onChange={(e) => setUpdatedDesc(e.target.value)}
                          placeholder="Mô tả game"
                          className="w-full px-2 py-1 text-xs rounded border border-purple-500/30 bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-pink-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-0.5 font-medium">Link game</label>
                        <input
                          type="url"
                          value={updatedLink}
                          onChange={(e) => setUpdatedLink(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2 py-1 text-xs rounded border border-purple-500/30 bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-pink-500 transition"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">Link ảnh</label>
                          <label className="cursor-pointer text-[10px] text-pink-500 hover:text-pink-400 font-medium flex items-center gap-1 transition">
                            {isUploadingEditImg ? (
                              <div className="w-2.5 h-2.5 border border-pink-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FaUpload size={8} />
                            )}
                            <span>{isUploadingEditImg ? "Đang tải..." : "Tải từ máy"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingEditImg}
                              onChange={(e) => handleImageUpload(e, "edit")}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="url"
                          value={updatedImg}
                          onChange={(e) => setUpdatedImg(e.target.value)}
                          placeholder="https://... hoặc tải từ máy"
                          className="w-full px-2 py-1 text-xs rounded border border-purple-500/30 bg-white/80 dark:bg-neutral-900/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-pink-500 transition"
                          required
                        />
                      </div>

                      <div className="flex gap-1.5 pt-1.5 mt-0.5 border-t border-purple-500/20">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGameId(null);
                            setUpdatedTitle("");
                            setUpdatedDesc("");
                            setUpdatedLink("");
                            setUpdatedImg("");
                          }}
                          className="flex-1 py-1 px-2 text-[11px] rounded bg-neutral-200/80 hover:bg-neutral-300/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                        >
                          {t("cancel") || "Hủy"}
                        </button>
                        <button
                          type="submit"
                          disabled={isUploadingEditImg}
                          className="flex-1 py-1 px-2 text-[11px] font-medium rounded bg-gradient-to-r from-pink-500 to-purple-500 hover:from-purple-600 hover:to-pink-600 text-white transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          {isUploadingEditImg ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FaCheck size={9} />
                          )}
                          <span>{isUploadingEditImg ? "Đang tải..." : "Lưu"}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          className="text-xs sm:text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100"
                          title={game.title}
                        >
                          {game.title}
                        </h3>
                        {game.description && (
                          <p
                            className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5"
                            title={game.description}
                          >
                            {game.description}
                          </p>
                        )}
                      </div>

                      <a
                        href={game.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1 sm:py-1.5 px-2 text-[11px] sm:text-xs font-medium rounded-md bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-purple-600 hover:to-pink-600 transition flex items-center justify-center gap-1.5 shadow-sm text-decoration-none"
                      >
                        <FaGamepad size={12} />
                        <span>{t("playNow")}</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className={`col-span-full text-center py-8 ${cls.muted}`}>{t("Nogamesfound")} </div>
          )}
        </div>
    </div>
  );
};

export default Games;
