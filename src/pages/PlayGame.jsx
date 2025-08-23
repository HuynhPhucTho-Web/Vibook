import React, { useContext } from "react";
import { motion } from "framer-motion";
import { FaGamepad } from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext";


const games = [
    {
        title: "Caro 3x3",
        desc: "Classic Tic Tac Toe game 3x3 board.",
        img: "https://static.thuthuatchoi.com/media/photos/shares/cacloaico/Co_caro/Choi_co_caro.jpg",
        link: "https://tictactoe-game-kohl.vercel.app/",
    },
    {
        title: "Caro 5x5",
        desc: "Bigger Tic Tac Toe with 5x5 board.",
        img: "https://img-cdn.2game.vn/pictures/xemgame/2017/07/27/1.jpg",
        link: "https://papergames.io/vi/c%E1%BB%9D-caro",
    },
    {
        title: "Pikachu Online",
        desc: "Play Pikachu online with friends.",
        img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkJ64Fi-uSbuamBThvfsxv9L0oU-pEnbfX5g&s",
        link: "https://krongkmar.com/pikachu/",
    },
    {
        title: "Sudoku",
        desc: "Number puzzle classic game.",
        img: "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/04/cach-choi-sudoku.jpg",
        link: "https://sudoku.com/",
    },
    {
        title: "Chess",
        desc: "Classic chess game online.",
        img: "https://www.chess.com/bundles/web/images/social/share-play-og.65416864.png",
        link: "https://www.chess.com/",
    },
];

const Playgame = () => {
    const { theme, bodyBackground } = useContext(ThemeContext);

    return (
        <div
            className="min-h-screen py-10"
            style={{
                backgroundColor: "var(--theme-background)",
                color: "var(--theme-text)",
                transition: "background-color 0.3s ease, color 0.3s ease",
            }}
        >
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center">
                    <motion.h1
                        className="text-4xl font-extrabold mb-2 flex items-center justify-center gap-2"
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{ color: "var(--theme-text)" }} // 🔥 đổi màu text theo theme
                    >
                        <FaGamepad className="text-pink-500" /> Play Games
                    </motion.h1>
                    <p className="text-gray-500">Choose a game and have fun 🎮</p>
                </div>

                {/* Game cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {games.map((game, idx) => (
                        <motion.div
                            key={idx}
                            className="rounded-2xl overflow-hidden shadow-lg hover:shadow-pink-500/30 transition-all duration-300"
                            style={{
                                background: "var(--theme-card, #222)",  // bạn có thể định nghĩa thêm biến cho card
                                color: "var(--theme-text)",
                            }}
                            whileHover={{ scale: 1.05 }}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            <div className="relative">
                                <img
                                    src={game.img}
                                    alt={game.title}
                                    className="h-48 w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-all" />
                            </div>
                            <div className="p-4 text-center">
                                <h5 className="text-lg font-semibold mb-2">{game.title}</h5>
                                <p className="text-sm text-gray-400 mb-4">{game.desc}</p>
                                <a
                                    href={game.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 transition-all text-white font-medium shadow-md hover:shadow-lg"
                                >
                                    Play Now
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Playgame;
