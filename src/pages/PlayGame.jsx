import React from 'react';

const Playgame = () => {
    return (
        <div className="container py-4">
            <h1 className="mb-4">Play-Game</h1>

            <div className="row row-cols-1 row-cols-md-5 g-4">
                <div className="col">
                    <div className="card h-100">
                        <img
                            src="https://static.thuthuatchoi.com/media/photos/shares/cacloaico/Co_caro/Choi_co_caro.jpg"
                            className="card-img-top fixed-img"
                            alt="Caro 3x3 Game"
                        />
                        <div className="card-body">
                            <h5 className="card-title">Caro 3x3</h5>
                            <p className="card-text">Classic Tic Tac Toe game 3x3 board.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.href = 'https://tictactoe-game-kohl.vercel.app/'}
                            >
                                Play Now
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col">
                    <div className="card h-100">
                        <img
                            src="https://img-cdn.2game.vn/pictures/xemgame/2017/07/27/1.jpg"
                            className="card-img-top fixed-img"
                            alt="Caro 5x5 Game"
                        />
                        <div className="card-body">
                            <h5 className="card-title">Caro 5x5</h5>
                            <p className="card-text">Bigger Tic Tac Toe with 5x5 board.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.href = 'https://papergames.io/vi/c%E1%BB%9D-caro'}
                            >
                                Play Now
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col">
                    <div className="card h-100">
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkJ64Fi-uSbuamBThvfsxv9L0oU-pEnbfX5g&s"
                            className="card-img-top fixed-img"
                            alt="Caro Online"
                        />
                        <div className="card-body">
                            <h5 className="card-title">Caro Online</h5>
                            <p className="card-text">Play Caro online with friends.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.href = 'https://krongkmar.com/pikachu/'}
                            >
                                Play Now
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col">
                    <div className="card h-100">
                        <img
                            src="https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/04/cach-choi-sudoku.jpg"
                            className="card-img-top fixed-img"
                            alt="Sudoku Game"
                        />
                        <div className="card-body">
                            <h5 className="card-title">Sudoku</h5>
                            <p className="card-text">Number puzzle classic game.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.href = 'https://sudoku.com/'}
                            >
                                Play Now
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col">
                    <div className="card h-100">
                        <img
                            src="https://www.chess.com/bundles/web/images/social/share-play-og.65416864.png"
                            className="card-img-top fixed-img"
                            alt="Chess Game"
                        />
                        <div className="card-body">
                            <h5 className="card-title">Chess</h5>
                            <p className="card-text">Classic chess game online.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.href = 'https://www.chess.com/'}
                            >
                                Play Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS nội tuyến */}
            <style>{`
                .fixed-img {
                    height: 200px;
                    object-fit: cover;
                }
            `}</style>
        </div>
    );
};

export default Playgame;
