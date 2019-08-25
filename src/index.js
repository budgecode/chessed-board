// Utility methods.
String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
        ? args[number]
        : match
    ;
    });
};

const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
};

const parseFEN = (fen) => {

    const fenParts = fen.split(' ');

    let ranks = fenParts[0].split('/');

    let boardState = [];
    ranks.forEach((r) => {
        let rank = [];
        r.split('').forEach((c) => {
            if (!isNaN(c)) {
                const numEmpty = parseInt(c);

                for (let i = 0; i < numEmpty; i++) {
                    rank.push(null);
                }
            } else if (c === c.toUpperCase()) {
                rank.push({ type: c.toLowerCase(), color: 'w' });
            } else {
                rank.push({ type: c, color: 'b' });
            }
        });
        boardState.push(rank);
    });


    const game = {
        board: boardState,
        turn: fenParts[1],
        castlingAvailability: fenParts[2],
        enPassant: fenParts[3],
        halfMoveClock: fenParts[4],
        move: fenParts[5]
    };

    return game;

};

const constructFEN = (game) => {
    fen = '';
    game.board.forEach((rank) => {
        let numEmpty = 0;
        let processingEmpties = false;
        rank.forEach((position) => {
            if (!position) {
                processingEmpties = true;
                numEmpty += 1;
            } else if (processingEmpties) {
                processingEmpties = false;
                fen += numEmpty.toString();
                numEmpty = 0;

                if (position.color === 'w') {
                    fen += position.type.toUpperCase();
                } else {
                    fen += position.type;
                }
            } else {
                if (position.color === 'w') {
                    fen += position.type.toUpperCase();
                } else {
                    fen += position.type;
                }
            }
        });

        if (processingEmpties) {
            processingEmpties = false;
            fen += numEmpty.toString();
            numEmpty = 0;
        }

        fen += '/';
    });

    fen += ' ' + [game.turn, game.castlingAvailability, game.enPassant, game.halfMoveClock, game.move].join(' ');

    return fen;
};

const algebraicToRowCol = (square, orientation) => {
    cols = { 'a': 0, 'b': 1, 'c': 2, 'd': 3,
             'e': 4, 'f': 5, 'g': 6, 'h': 7 };

    colsFlipped = { 'a': 7, 'b': 6, 'c': 5, 'd': 4,
    'e': 3, 'f': 2, 'g': 1, 'h': 0 };

    rows = { '1': 7, '2': 6, '3': 5, '4': 4,
             '5': 3, '6': 2, '7': 1, '8': 0};
    
    rowsFlipped = { '1': 0, '2': 1, '3': 2, '4': 3,
    '5': 4, '6': 5, '7': 6, '8': 7};

    if (orientation === 0) {
        return { row: rows[square[1]], column: cols[square[0]] };
    } else {
        return { row: rowsFlipped[square[1]], column: colsFlipped[square[0]] };
    }
}

const STARTING_BOARDSTATE = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

const SQUARE_WIDTH = 70;

class ChessedBoard {

    constructor(div, config) {
        this.divId = div;

        this.config = config ? config : {};      

        this.boardState = this.config.state ? this.config.state : STARTING_BOARDSTATE.board;
        if (this.config.orientation === null || this.config.orientation === undefined) {
            this.config.orientation = 0;
        }

        this.config.coordinates = this.config.coordinates ? true : false;

        constructFEN(STARTING_BOARDSTATE);

        this.setupBoard();

    }

    // Component lifecycle methods.
    setupBoard() {
        this.width = SQUARE_WIDTH * 8;
        this.height = SQUARE_WIDTH * 8;
        
        const boardDiv = document.getElementById(this.divId);
        boardDiv.innerHTML = `
            <div id="event-capture" style="position: relative; width: {0}px; height: {1}px;">
                <canvas id="chess-board-layer" style="position: absolute; left: 0; top: 0; z-index: 0;"></canvas>
                <canvas id="bottom-persistent-animation-layer" style="position: absolute; left: 0; top: 0; z-index: 1;"></canvas>
                <canvas id="bottom-animation-layer" style="position: absolute; left: 0; top: 0; z-index: 2;"></canvas>
                <canvas id="piece-layer" style="position: absolute; left: 0; top: 0; z-index: 3;"></canvas>
                <canvas id="top-persistent-animation-layer" style="position: absolute; left: 0; top: 0; z-index: 4;"></canvas>
                <canvas id="top-animation-layer" style="position: absolute; left: 0; top: 0; z-index: 5;"></canvas>
            <div>
        `.format(this.width, this.height);

        // Fetch all the canvases.
        this.eventCaptureLayer = document.getElementById('event-capture');
        this.chessBoardLayer = document.getElementById('chess-board-layer');
        this.bottomPersistentLayer = document.getElementById('bottom-persistent-animation-layer');
        this.bottomAnimationLayer = document.getElementById('bottom-animation-layer');
        this.pieceLayer = document.getElementById('piece-layer');
        this.topPersistentLayer = document.getElementById('top-persistent-animation-layer');
        this.topAnimationLayer = document.getElementById('top-animation-layer');

        // Size the canvases.
        this.chessBoardLayer.width = this.width;
        this.chessBoardLayer.height = this.height;

        this.bottomAnimationLayer.width = this.width;
        this.bottomAnimationLayer.height = this.height;

        this.bottomPersistentLayer.width = this.width;
        this.bottomPersistentLayer.height = this.height;

        this.pieceLayer.width = this.width;
        this.pieceLayer.height = this.height;
        this.topPersistentLayer.width = this.width;
        this.topPersistentLayer.height = this.height;

        this.topAnimationLayer.width = this.width;
        this.topAnimationLayer.height = this.height;

        // Handle clicks on event capture layer.
        this.eventCaptureLayer.onmousedown = this.handleMouseDown.bind(this);
        this.eventCaptureLayer.onmouseup = this.handleMouseUp.bind(this);
        this.eventCaptureLayer.onmousemove = this.handleMouseMove.bind(this);
        this.eventCaptureLayer.onmouseout = this.hanldeMouseOut.bind(this);

        this.eventCaptureLayer.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        this.loadSprites().then(() => {
            this.boardCtx = this.chessBoardLayer.getContext('2d');
            this.pieceCtx = this.pieceLayer.getContext('2d');
            if (!this.config.orientation) {
                this.draw();   
            } else {
                this.config.orientation = 0;
                this.flip();
            }

            if (this.config.onLoad) {
                this.config.onLoad();
            }
        }).catch((e) => {
            console.log(e);
        });

    }

    // Fetch sprite methods.
    sprite(piece) {

        if (!piece) {
            return null;
        }

        if (piece.type === 'p') {
            if (piece.color === 'b') {
                return this.sprites.blackPawn;
            } else {
                return this.sprites.whitePawn;
            }
        } else if (piece.type === 'r') {
            if (piece.color === 'b') {
                return this.sprites.blackRook;
            } else {
                return this.sprites.whiteRook;
            }
        } else if (piece.type === 'n') {
            if (piece.color === 'b') {
                return this.sprites.blackKnight;
            } else {
                return this.sprites.whiteKnight;
            }
        } else if (piece.type === 'q') {
            if (piece.color === 'b') {
                return this.sprites.blackQueen;
            } else {
                return this.sprites.whiteQueen;
            }
        } else if (piece.type === 'k') {
            if (piece.color === 'b') {
                return this.sprites.blackKing;
            } else {
                return this.sprites.whiteKing;
            }
        } else if (piece.type === 'b') {
            if (piece.color === 'b') {
                return this.sprites.blackBishop;
            } else {
                return this.sprites.whiteBishop;
            }
        }
        return null;
    }

    async loadSprites() {
        this.sprites = {};

        // Load white sprites.
        this.sprites.whitePawn = await loadImage('../sprites/Chess_plt45.svg');
        this.sprites.whiteRook = await loadImage('../sprites/Chess_rlt45.svg');
        this.sprites.whiteKnight = await loadImage('../sprites/Chess_nlt45.svg');
        this.sprites.whiteKing = await loadImage('../sprites/Chess_klt45.svg');
        this.sprites.whiteBishop = await loadImage('../sprites/Chess_blt45.svg');
        this.sprites.whiteQueen = await loadImage('../sprites/Chess_qlt45.svg');

        // Load black sprites.
        this.sprites.blackPawn = await loadImage('../sprites/Chess_pdt45.svg');
        this.sprites.blackRook = await loadImage('../sprites/Chess_rdt45.svg');
        this.sprites.blackKnight = await loadImage('../sprites/Chess_ndt45.svg');
        this.sprites.blackKing = await loadImage('../sprites/Chess_kdt45.svg');
        this.sprites.blackBishop = await loadImage('../sprites/Chess_bdt45.svg');
        this.sprites.blackQueen = await loadImage('../sprites/Chess_qdt45.svg');
    }

    // Draw board methods.
    drawPieces() {
        this.pieceCtx.clearRect(0, 0, this.width, this.height);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.boardState[r][c]) {
                    this.pieceCtx.drawImage(this.sprite(this.boardState[r][c]), c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                }
            }
        }
    }

    drawBoard() {
        const blackColor = '#546e7a';
        const whiteColor = '#eeeeee';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r % 2 !== c % 2) {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                    this.boardCtx.fillStyle = blackColor;
                    this.boardCtx.fill();

                    // Set color back for numbers.
                    this.boardCtx.fillStyle = whiteColor;

                } else {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                    this.boardCtx.fillStyle = whiteColor;
                    this.boardCtx.fill();

                    // Set color back for numbers.
                    this.boardCtx.fillStyle = blackColor;
                }
                if (this.config.coordinates) {
                    if (c == 0) {
                        this.boardCtx.font = 'bold 12px Arial';
                        const rows = [8, 7, 6, 5, 4, 3, 2, 1];
                        if (this.config.orientation === 1) {
                            rows.reverse();
                        }
                        this.boardCtx.fillText(rows[r], c * SQUARE_WIDTH + 2, r * SQUARE_WIDTH + 12);
                    }

                    if (r == 7) {
                        const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                        if (this.config.orientation === 1) {
                            columns.reverse();
                        }
                        this.boardCtx.font = 'bold 12px Arial';
                        this.boardCtx.fillText(columns[c], c * SQUARE_WIDTH + SQUARE_WIDTH - 10, r * SQUARE_WIDTH + SQUARE_WIDTH - 4);
                    }
                }
            }
        }
    }

    draw() {
        this.drawBoard();

        this.drawPieces();
    }

    getMouseLocationInCanvas(e) {
        const canvasRect = this.chessBoardLayer.getBoundingClientRect();

        return {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };
    }

    _getSquare(mouseLocation) {
        const row = Math.floor(mouseLocation.y / SQUARE_WIDTH);
        const column = Math.floor(mouseLocation.x / SQUARE_WIDTH);

        return { 
            row: row, 
            column: column,
            origin: {
                x: column * SQUARE_WIDTH,
                y: row * SQUARE_WIDTH
            },
            center: {
                x: column * SQUARE_WIDTH + (SQUARE_WIDTH / 2),
                y: row * SQUARE_WIDTH + (SQUARE_WIDTH / 2)
            }
        };
    }

    _movePiece(start, finish) {
        this.boardState[finish.row][finish.column] = this.selectedPiece;

        this.pieceCtx.clearRect(0, 0, this.width, this.height);
        this.draw();
    }

    constructChessedEvent(e) {

        const mouseLocation = this.getMouseLocationInCanvas(e);
        const square =  this._getSquare(mouseLocation);

        const chessedEvent = {
            currentMouseLocation: mouseLocation,
            currentSquare: square,
            startMouseLocation: this.startMouseLocation,
            startSquare: this.startSquare
        };

        return chessedEvent;
    }

    // Handle user interaction.
    handleMouseDown(e) {
        const mouseLocation = this.getMouseLocationInCanvas(e);
        const square =  this._getSquare(mouseLocation);
        this.startSquare = square;
        this.startMouseLocation = mouseLocation;
        if (e.which === 1) {
            this.pickupPiece(e);
            if (this.config.onLeftClick) {
                this.config.onLeftClick(this.constructChessedEvent(e));
            }
        } else if (e.which === 3) {
            this.rightClicking = true;
            this.putPieceBack();

            if (this.config.onRightClick) {
                this.config.onRightClick(this.constructChessedEvent(e));
            }
        }
    }

    handleMouseUp(e) {
        if (e.which === 1) {
            this.placePiece(e);
            if (this.config.onLeftClickRelease) {
                this.config.onLeftClickRelease(this.constructChessedEvent(e));
            }
        } else if (e.which === 3) {
            this.rightClicking = false;
            if (this.config.onRightClickRelease) {
                this.config.onRightClickRelease(this.constructChessedEvent(e));
            }
        }
    }

    handleMouseMove(e) {
        if (this.draggingPiece) {
            this.dragPiece(e);
            if (this.config.onLeftClickDrag) {
                this.config.onLeftClickDrag(this.constructChessedEvent(e));
            }
        } else if (this.rightClicking) {
            if (this.config.onRightClickDrag) {
                this.config.onRightClickDrag(this.constructChessedEvent(e));
            }
        }
    }

    hanldeMouseOut(e) {
        this.putPieceBack(e);
        this.rightClicking = false;
        if (this.config.onMouseOut) {
            this.config.onMouseOut();
        }
    }


    pickupPiece(e) {
        const mouseLocation = this.getMouseLocationInCanvas(e);
        this.startSquare = this._getSquare(mouseLocation);
        if (this.boardState[this.startSquare.row][this.startSquare.column]) {
            this.selectedPiece = this.boardState[this.startSquare.row][this.startSquare.column];
            this.selectedPieceSprite = this.sprite(this.selectedPiece);
            this.boardState[this.startSquare.row][this.startSquare.column] = null;

            this.pieceCtx.clearRect(0, 0, this.width, this.height);
            this.draw();

            this.pieceCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - SQUARE_WIDTH / 2, mouseLocation.y - SQUARE_WIDTH / 2, SQUARE_WIDTH, SQUARE_WIDTH);

            this.draggingPiece = true;
        }      
    }

    placePiece(e) {
        if (this.draggingPiece && this.selectedPiece) {
            const endSquare = this._getSquare(this.getMouseLocationInCanvas(e));
            if (this.startSquare.row !== endSquare.row || this.startSquare.column !== endSquare.column) {
                this._movePiece(this.startSquare, endSquare);
            } else {
                this.putPieceBack();
            }

            this.startSquare = null;
            this.selectedPieceSprite = null;
            this.selectedPiece = null;
            this.draggingPiece = false;
        }
    }

    dragPiece(e) {
        const mouseLocation = this.getMouseLocationInCanvas(e);
        this.pieceCtx.clearRect(0, 0, this.width, this.height);
        this.draw();
        this.pieceCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - SQUARE_WIDTH / 2, mouseLocation.y - SQUARE_WIDTH / 2, SQUARE_WIDTH, SQUARE_WIDTH);
    }

    putPieceBack() {
        if (this.draggingPiece) {
            this.boardState[this.startSquare.row][this.startSquare.column] = this.selectedPiece;

            this.startSquare = null;
            this.selectedPieceSprite = null;
            this.selectedPiece = null;
            this.draggingPiece = false;
            this.draw();
        }
    }

    // Public API.
    
    // Animation hooks.
    animate(animation) {
        animation(this.bottomAnimationLayer, this.topAnimationLayer);
    }

    persistBottomAnimations() {
        const ctx = this.bottomPersistentLayer.getContext("2d");
        ctx.drawImage(this.bottomAnimationLayer, 0, 0);
    }

    persistTopAnimations() {
        const ctx = this.topPersistentLayer.getContext("2d");
        ctx.drawImage(this.topAnimationLayer, 0, 0);
    }

    clearBottomAnimations() {
        const ctx = this.bottomPersistentLayer.getContext("2d");
        ctx.clearRect(0, 0, this.bottomPersistentLayer.width, this.bottomPersistentLayer.height);
    }

    clearTopAnimations() {
        const ctx = this.topPersistentLayer.getContext("2d");
        ctx.clearRect(0, 0, this.topPersistentLayer.width, this.topPersistentLayer.height);
    }

    // Interaction APIs.
    movePiece(from, to) {
        const start = algebraicToRowCol(from, this.config.orientation);
        const finish = algebraicToRowCol(to, this.config.orientation);

        this.boardState[finish.row][finish.column] = this.boardState[start.row][start.column];
        this.boardState[start.row][start.column] = null;

        this.pieceCtx.clearRect(0, 0, this.width, this.height);
        this.draw();
    }

    flip() {
        this.boardState.reverse();
        this.boardState.map(r => r.reverse());
        this.config.orientation = this.config.orientation === 0 ? 1 : 0;
        this.draw();
    }

    toggleCoordinates() {
        this.config.coordinates = !this.config.coordinates;
        this.draw();
    }

    getSquare(square) {
        const coordinates = algebraicToRowCol(square, this.config.orientation);
        const row = coordinates.row;
        const column = coordinates.column;

        return { 
            row: row, 
            column: column,
            origin: {
                x: column * SQUARE_WIDTH,
                y: row * SQUARE_WIDTH
            },
            center: {
                x: column * SQUARE_WIDTH + (SQUARE_WIDTH / 2),
                y: row * SQUARE_WIDTH + (SQUARE_WIDTH / 2)
            }
        };
    }

}

window.ChessedBoard = ChessedBoard;