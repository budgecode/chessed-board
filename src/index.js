// Utility methods.
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

const STARTING_BOARDSTATE = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

const SQUARE_WIDTH = 70;

class Chessboard {

    constructor(canvasId, boardState, config) {
        this.canvasId = canvasId;

        this.config = config ? config : {};      

        this.boardState = boardState ? boardState : STARTING_BOARDSTATE.board;
        
        constructFEN(STARTING_BOARDSTATE);

        this.setupBoard();

    }

    // Component lifecycle methods.
    setupBoard() {
        this.width = SQUARE_WIDTH * 8;
        this.height = SQUARE_WIDTH * 8;
        this.boardCanvas = document.getElementById(this.canvasId);

        this.boardCanvas.width = this.width;
        this.boardCanvas.height = this.height;

        this.boardCanvas.onmousedown = this.handleMouseDown.bind(this);
        this.boardCanvas.onmouseup = this.placePiece.bind(this);
        this.boardCanvas.onmousemove = this.dragPiece.bind(this);
        this.boardCanvas.onmouseout = this.putPieceBack.bind(this);

        this.boardCanvas.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        this.loadSprites().then(() => {
            this.boardCtx = this.boardCanvas.getContext('2d');
            this.draw();
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
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.boardState[r][c]) {
                    this.boardCtx.drawImage(this.sprite(this.boardState[r][c]), c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                }
            }
        }
    }

    drawBoard() {
        const blackColor = '#8d6e63';
        const whiteColor = '#E8E2C9';

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

                if (c == 0) {
                    this.boardCtx.font = 'bold 10px Arial';
                    this.boardCtx.fillText(8 - r, c * SQUARE_WIDTH + 3, r * SQUARE_WIDTH + 9);
                }

                if (r == 7) {
                    const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                    this.boardCtx.font = 'bold 10px Arial';
                    this.boardCtx.fillText(columns[c], c * SQUARE_WIDTH + SQUARE_WIDTH - 9, r * SQUARE_WIDTH + SQUARE_WIDTH - 3);
                }
            }
        }
    }

    draw() {
        this.drawBoard();

        this.drawPieces();
    }

    getMouseLocationInCanvas(e) {
        const canvasRect = this.boardCanvas.getBoundingClientRect();

        return {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };
    }

    getSquare(mouseLocation) {
        const row = Math.floor(mouseLocation.y / SQUARE_WIDTH);
        const column = Math.floor(mouseLocation.x / SQUARE_WIDTH);

        return { row, column };
    }

    movePiece(start, finish) {
        this.boardState[finish.row][finish.column] = this.selectedPiece;

        this.boardCtx.clearRect(0, 0, this.width, this.height);
        this.draw();
    }

    // Handle user interaction.
    handleMouseDown(e) {
        if (e.which === 1) {
            this.pickupPiece(e);
        } else if (e.which === 3) {
            this.putPieceBack();
        }
    }


    pickupPiece(e) {
        const mouseLocation = this.getMouseLocationInCanvas(e);
        this.startSquare = this.getSquare(mouseLocation);
        if (this.boardState[this.startSquare.row][this.startSquare.column]) {
            this.selectedPiece = this.boardState[this.startSquare.row][this.startSquare.column];
            this.selectedPieceSprite = this.sprite(this.selectedPiece);
            this.boardState[this.startSquare.row][this.startSquare.column] = null;

            this.boardCtx.clearRect(0, 0, this.width, this.height);
            this.draw();

            this.boardCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - SQUARE_WIDTH / 2, mouseLocation.y - SQUARE_WIDTH / 2, SQUARE_WIDTH, SQUARE_WIDTH);

            this.draggingPiece = true;
            
            if (this.config.pieceSelected) {
                this.config.pieceSelected();
            }  
        }      
    }

    placePiece(e) {
        if (this.draggingPiece && this.selectedPiece) {
            const endSquare = this.getSquare(this.getMouseLocationInCanvas(e));
            if (this.startSquare.row !== endSquare.row || this.startSquare.column !== endSquare.column) {
                this.movePiece(this.startSquare, endSquare);
                if (this.config.piecePlaced) {
                    this.config.piecePlaced();
                }  
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
        if (this.draggingPiece) {

            const mouseLocation = this.getMouseLocationInCanvas(e);
            this.boardCtx.clearRect(0, 0, this.width, this.height);
            this.draw();
            this.boardCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - SQUARE_WIDTH / 2, mouseLocation.y - SQUARE_WIDTH / 2, SQUARE_WIDTH, SQUARE_WIDTH);
            
            if (this.config.pieceDragged) {
                this.config.pieceDragged();
            }  

        }
    }

    putPieceBack() {
        if (this.draggingPiece) {
            this.boardState[this.startSquare.row][this.startSquare.column] = this.selectedPiece;

            this.startSquare = null;
            this.selectedPieceSprite = null;
            this.selectedPiece = null;
            this.draggingPiece = false;
            this.draw();

            if (this.config.pieceDropped) {
                this.config.pieceDropped();
            }
        }
    }

}

window.Chessboard = Chessboard;