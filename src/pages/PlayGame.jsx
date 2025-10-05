import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { auth, db } from "../components/firebase";
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaPlus, FaTimes, FaGamepad, FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";

const Games = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  // —— design tokens theo theme ——
  const cls = {
    page: isDark ? "bg-neutral-900 text-neutral-100" : "bg-neutral-100 text-neutral-900",
    surface: isDark ? "bg-neutral-800" : "bg-white",
    border: isDark ? "border border-neutral-700" : "border border-neutral-200",
    shadow: "shadow-md hover:shadow-lg transition",
    muted: isDark ? "text-neutral-400" : "text-neutral-600",
    input: `${
      isDark
        ? "bg-neutral-700 border-neutral-600 text-neutral-100 placeholder-neutral-400"
        : "bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500"
    } border rounded-lg`,
    ringFocus: "focus:outline-none focus:ring-2 focus:ring-pink-500",
    menu: isDark
      ? "bg-neutral-800 border border-neutral-700 text-neutral-200"
      : "bg-white border border-neutral-200 text-neutral-700",
    backdrop: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
  };

  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const [gameTitle, setGameTitle] = useState("");
  const [gameDesc, setGameDesc] = useState("");
  const [gameLink, setGameLink] = useState("");
  const [gameImg, setGameImg] = useState("");

  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedDesc, setUpdatedDesc] = useState("");
  const [updatedLink, setUpdatedLink] = useState("");
  const [updatedImg, setUpdatedImg] = useState("");

  const [showOptions, setShowOptions] = useState(null);
  const [search, setSearch] = useState("");

  const modalRef = useRef(null);

  // Close modal / menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowCreateModal(false);
        setShowUpdateModal(false);
      }
      if (showOptions && !e.target.closest?.(`[data-game-id="${showOptions}"]`)) {
        setShowOptions(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptions]);

  // Auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setGames([]);
        setFilteredGames([]);
        setIsLoading(false);
      }
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
      if (!currentUser) return toast.error("Please log in to create a game");
      if (!gameTitle.trim() || !gameLink.trim() || !gameImg.trim())
        return toast.error("Please fill in all required fields");

      try {
        await addDoc(collection(db, "Games"), {
          title: gameTitle.trim(),
          description: gameDesc.trim() || "No description",
          link: gameLink.trim(),
          imgUrl: gameImg.trim(),
          ownerId: currentUser.uid,
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
    [currentUser, gameTitle, gameDesc, gameLink, gameImg]
  );

  // Update
  const handleUpdateGame = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentUser || !selectedGame)
        return toast.error("Invalid action");
      if (selectedGame.id.startsWith("default-") || currentUser.uid !== selectedGame.ownerId)
        return toast.error("Only owner can update; default games are locked");

      try {
        await updateDoc(doc(db, "Games", selectedGame.id), {
          title: updatedTitle.trim() || selectedGame.title,
          description: updatedDesc.trim() || selectedGame.description,
          link: updatedLink.trim() || selectedGame.link,
          imgUrl: updatedImg.trim() || selectedGame.imgUrl,
        });
        setShowUpdateModal(false);
        setSelectedGame(null);
        setUpdatedTitle(""); setUpdatedDesc(""); setUpdatedLink(""); setUpdatedImg("");
        toast.success("Game updated!");
      } catch (e) {
        console.error(e);
        toast.error("Update failed");
      }
    },
    [currentUser, selectedGame, updatedTitle, updatedDesc, updatedLink, updatedImg]
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

  if (!currentUser) {
    return (
      <div className={`text-center p-6 ${cls.muted}`}>
        Please log in to view and manage games
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 transition-colors duration-300 ${cls.page}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaGamepad className="text-pink-500" /> Games ({games.length})
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="🔍 Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full sm:w-64 px-4 py-2 rounded-full ${cls.input} ${cls.ringFocus}`}
            />
            <button
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-60"
              onClick={() => setShowCreateModal(true)}
              disabled={!currentUser}
            >
              <FaPlus size={16} /> Add Game
            </button>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className={cls.backdrop}>
            <div ref={modalRef} className={`${cls.surface} ${cls.border} rounded-xl p-6 w-full max-w-md`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add New Game</h3>
                <button className={`${cls.muted} hover:opacity-80`} onClick={() => setShowCreateModal(false)}>
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateGame} className="space-y-3">
                <input
                  type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="Game Title" className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <textarea
                  value={gameDesc} onChange={(e) => setGameDesc(e.target.value)}
                  placeholder="Game Description" rows={2}
                  className={`w-full p-2 ${cls.input} ${cls.ringFocus}`}
                />
                <input
                  type="url" value={gameLink} onChange={(e) => setGameLink(e.target.value)}
                  placeholder="Game Link (URL)" className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <input
                  type="url" value={gameImg} onChange={(e) => setGameImg(e.target.value)}
                  placeholder="Game Image URL" className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" className={`${cls.muted}`} onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedGame && (
          <div className={cls.backdrop}>
            <div ref={modalRef} className={`${cls.surface} ${cls.border} rounded-xl p-6 w-full max-w-md`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Game: {selectedGame.title}</h3>
                <button className={`${cls.muted} hover:opacity-80`} onClick={() => setShowUpdateModal(false)}>
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateGame} className="space-y-3">
                <input
                  type="text" value={updatedTitle} onChange={(e) => setUpdatedTitle(e.target.value)}
                  placeholder="Game Title" className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <textarea
                  value={updatedDesc} onChange={(e) => setUpdatedDesc(e.target.value)}
                  placeholder="Game Description" rows={2}
                  className={`w-full p-2 ${cls.input} ${cls.ringFocus}`}
                />
                <input
                  type="url" value={updatedLink} onChange={(e) => setUpdatedLink(e.target.value)}
                  placeholder="Game Link (URL)" className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <input
                  type="url" value={updatedImg} onChange={(e) => setUpdatedImg(e.target.value)}
                  placeholder="Game Image URL" className={`w-full p-2 ${cls.input} ${cls.ringFocus}`} required
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" className={`${cls.muted}`} onClick={() => setShowUpdateModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-60"
                    disabled={
                      !currentUser ||
                      selectedGame.id.startsWith("default-") ||
                      currentUser.uid !== selectedGame.ownerId
                    }
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <div
                key={game.id}
                className={`${cls.surface} ${cls.border} ${cls.shadow} rounded-xl overflow-hidden relative`}
              >
                {/* owner menu */}
                {currentUser && currentUser.uid === game.ownerId && !game.id.startsWith("default-") && (
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      className={`p-2 rounded-full ${cls.surface} ${cls.border} text-neutral-400 hover:text-neutral-200 hover:shadow`}
                      onClick={() => setShowOptions(showOptions === game.id ? null : game.id)}
                      data-game-id={game.id}
                    >
                      <FaEllipsisV size={14} />
                    </button>
                    {showOptions === game.id && (
                      <div className={`absolute right-0 mt-2 w-36 rounded-md shadow-lg z-20 ${cls.menu}`}>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100/60 dark:hover:bg-neutral-700/60 flex items-center rounded-t-md"
                          onClick={() => {
                            setSelectedGame(game);
                            setUpdatedTitle(game.title || "");
                            setUpdatedDesc(game.description || "");
                            setUpdatedLink(game.link || "");
                            setUpdatedImg(game.imgUrl || "");
                            setShowUpdateModal(true);
                            setShowOptions(null);
                          }}
                        >
                          <FaEdit className="mr-2" /> Edit
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-700/60 flex items-center rounded-b-md"
                          onClick={() => {
                            handleDeleteGame(game.id, game.ownerId);
                            setShowOptions(null);
                          }}
                        >
                          <FaTrash className="mr-2" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <img src={game.imgUrl} alt={game.title} className="h-40 w-full object-cover" />
                </div>

                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold mb-1">{game.title}</h3>
                  <p className={`text-sm mb-3 ${cls.muted}`}>{game.description}</p>
                  <a
                    href={game.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-purple-600 hover:to-pink-600 transition"
                  >
                    Play Now
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className={`col-span-full text-center py-8 ${cls.muted}`}>No games found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Games;
