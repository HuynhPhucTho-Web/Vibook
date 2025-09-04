import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { auth, db } from "../components/firebase";
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaPlus, FaTimes, FaGamepad, FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";

const Games = () => {
    const { theme } = useContext(ThemeContext);
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

    // Close modal outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowCreateModal(false);
                setShowUpdateModal(false);
            }
            if (showOptions && !event.target.closest(`[data-game-id="${showOptions}"]`)) {
                setShowOptions(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showOptions]);

    // Auth listener
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (!user) {
                setGames([]);
                setFilteredGames([]);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Load games
    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, "Games"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const gameList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setGames(gameList);
                setFilteredGames(gameList);
                setIsLoading(false);
            },
            (error) => {
                console.error("Error fetching games:", error);
                toast.error("Failed to load games");
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // Search filter
    useEffect(() => {
        if (!search.trim()) {
            setFilteredGames(games);
        } else {
            setFilteredGames(
                games.filter((g) =>
                    g.title.toLowerCase().includes(search.toLowerCase())
                )
            );
        }
    }, [search, games]);

    // Create game
    const handleCreateGame = useCallback(
        async (e) => {
            e.preventDefault();
            if (!gameTitle.trim() || !gameLink.trim() || !gameImg.trim()) {
                toast.error("Please fill in all fields");
                return;
            }
            if (!currentUser) {
                toast.error("Please log in to create a game");
                return;
            }

            try {
                const newGame = {
                    title: gameTitle.trim(),
                    description: gameDesc.trim() || "No description",
                    link: gameLink.trim(),
                    imgUrl: gameImg.trim(),
                    ownerId: currentUser.uid,
                    createdAt: serverTimestamp(),
                };

                await addDoc(collection(db, "Games"), newGame);
                setGameTitle("");
                setGameDesc("");
                setGameLink("");
                setGameImg("");
                setShowCreateModal(false);
                toast.success("Game created successfully!");
            } catch (error) {
                console.error("Error creating game:", error);
                toast.error("Failed to create game");
            }
        },
        [gameTitle, gameDesc, gameLink, gameImg, currentUser]
    );

    // Update game
    const handleUpdateGame = useCallback(
        async (e) => {
            e.preventDefault();
            if (!currentUser || !selectedGame || selectedGame.id.startsWith("default-") || currentUser.uid !== selectedGame.ownerId) {
                toast.error("Only the game owner can update, and default games cannot be modified");
                return;
            }

            try {
                const gameRef = doc(db, "Games", selectedGame.id);
                await updateDoc(gameRef, {
                    title: updatedTitle.trim() || selectedGame.title,
                    description: updatedDesc.trim() || selectedGame.description,
                    link: updatedLink.trim() || selectedGame.link,
                    imgUrl: updatedImg.trim() || selectedGame.imgUrl,
                });
                setShowUpdateModal(false);
                setSelectedGame(null);
                setUpdatedTitle("");
                setUpdatedDesc("");
                setUpdatedLink("");
                setUpdatedImg("");
                toast.success("Game updated successfully!");
            } catch (error) {
                console.error("Error updating game:", error);
                toast.error("Failed to update game");
            }
        },
        [currentUser, selectedGame, updatedTitle, updatedDesc, updatedLink, updatedImg]
    );

    // Delete game
    const handleDeleteGame = async (gameId, ownerId) => {
        if (!currentUser || currentUser.uid !== ownerId || gameId.startsWith("default-")) {
            toast.error("Only the game owner can delete, and default games cannot be deleted");
            return;
        }
        try {
            await deleteDoc(doc(db, "Games", gameId));
            setShowOptions(null);
            toast.success("Game deleted successfully!");
        } catch (error) {
            console.error("Error deleting game:", error);
            toast.error("Failed to delete game");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                Please log in to view and manage games
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen p-4 transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}
        >
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
                            className="w-full sm:w-64 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                            onClick={() => setShowCreateModal(true)}
                            disabled={!currentUser}
                        >
                            <FaPlus size={16} /> Add Game
                        </button>
                    </div>
                </div>

                {/* Create Game Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div
                            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
                            ref={modalRef}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Add New Game</h3>
                                <button
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateGame}>
                                <input
                                    type="text"
                                    value={gameTitle}
                                    onChange={(e) => setGameTitle(e.target.value)}
                                    placeholder="Game Title"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    required
                                />
                                <textarea
                                    value={gameDesc}
                                    onChange={(e) => setGameDesc(e.target.value)}
                                    placeholder="Game Description"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    rows={2}
                                />
                                <input
                                    type="text"
                                    value={gameLink}
                                    onChange={(e) => setGameLink(e.target.value)}
                                    placeholder="Game Link (URL)"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    required
                                />
                                <input
                                    type="text"
                                    value={gameImg}
                                    onChange={(e) => setGameImg(e.target.value)}
                                    placeholder="Game Image URL"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    required
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-500"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                                        disabled={!currentUser}
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Update Game Modal */}
                {showUpdateModal && selectedGame && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div
                            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
                            ref={modalRef}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Edit Game: {selectedGame.title}</h3>
                                <button
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowUpdateModal(false)}
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateGame}>
                                <input
                                    type="text"
                                    value={updatedTitle}
                                    onChange={(e) => setUpdatedTitle(e.target.value)}
                                    placeholder="Game Title"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    required
                                />
                                <textarea
                                    value={updatedDesc}
                                    onChange={(e) => setUpdatedDesc(e.target.value)}
                                    placeholder="Game Description"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    rows={2}
                                />
                                <input
                                    type="text"
                                    value={updatedLink}
                                    onChange={(e) => setUpdatedLink(e.target.value)}
                                    placeholder="Game Link (URL)"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    required
                                />
                                <input
                                    type="text"
                                    value={updatedImg}
                                    onChange={(e) => setUpdatedImg(e.target.value)}
                                    placeholder="Game Image URL"
                                    className="w-full p-2 mb-3 rounded-lg border bg-gray-50 dark:bg-gray-700"
                                    required
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-gray-500"
                                        onClick={() => setShowUpdateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        disabled={!currentUser || selectedGame.id.startsWith("default-") || currentUser.uid !== selectedGame.ownerId}
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Games Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredGames.length > 0 ? (
                        filteredGames.map((game) => (
                            <div
                                key={game.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition relative"
                            >
                                {/* Options button - moved to top right corner of the card */}
                                {currentUser && currentUser.uid === game.ownerId && !game.id.startsWith("default-") && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <button
                                            className="p-2 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-opacity-100 shadow-md transition-all"
                                            onClick={() => setShowOptions(showOptions === game.id ? null : game.id)}
                                            data-game-id={game.id}
                                        >
                                            <FaEllipsisV size={14} />
                                        </button>
                                        {showOptions === game.id && (
                                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                                                <button
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center rounded-t-md"
                                                    onClick={() => {
                                                        console.log("Edit clicked for game:", game.id); // Debug log
                                                        setSelectedGame(game);
                                                        setUpdatedTitle(game.title);
                                                        setUpdatedDesc(game.description);
                                                        setUpdatedLink(game.link);
                                                        setUpdatedImg(game.imgUrl);
                                                        setShowUpdateModal(true);
                                                        setShowOptions(null);
                                                    }}
                                                >
                                                    <FaEdit className="mr-2" /> Edit
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center rounded-b-md"
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
                                    <img
                                        src={game.imgUrl}
                                        alt={game.title}
                                        className="h-40 w-full object-cover"
                                    />
                                </div>
                                <div className="p-4 text-center">
                                    <h3 className="text-lg font-semibold mb-1">{game.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {game.description}
                                    </p>
                                    <a
                                        href={game.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-purple-600 hover:to-pink-600 transition"
                                    >
                                        Play Now
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                            No games found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Games;