
// Utility methods.
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
};

// Enums and classes.
const Pieces = {
    WHITE_PAWN: 'WHITE_PAWN',
    WHITE_KING: 'WHITE_KING',
    WHITE_BISHOP: 'WHITE_BISHOP',
    WHITE_QUEEN: 'WHITE_QUEEN',
    WHITE_KNIGHT: 'WHITE_KNIGHT',
    WHTIE_ROOK: 'WHITE_ROOK',
    BLACK_PAWN: 'BLACK_PAWN',
    BLACK_KING: 'BLACK_KING',
    BLACK_BISHOP: 'BLACK_BISHOP',
    BLACK_QUEEN: 'BLACK_QUEEN',
    BLACK_KNIGHT: 'BLACK_KNIGHT',
    BLACK_ROOK: 'BLACK_ROOK',
};

const Piece = (piece, x, y) => {
    return {piece, x, y};
};

const STARTING_BOARDSTATE = [
    Piece(Pieces.BLACK_ROOK, 1, 1),
    Piece(Pieces.BLACK_KNIGHT, 2, 1),
    Piece(Pieces.BLACK_BISHOP, 3, 1),
    Piece(Pieces.BLACK_QUEEN, 4, 1),
    Piece(Pieces.BLACK_KING, 5, 1),
    Piece(Pieces.BLACK_BISHOP, 6, 1),
    Piece(Pieces.BLACK_KNIGHT, 7, 1),
    Piece(Pieces.BLACK_ROOK, 8, 1),
    Piece(Pieces.BLACK_PAWN, 1, 2),
    Piece(Pieces.BLACK_PAWN, 2, 2),
    Piece(Pieces.BLACK_PAWN, 3, 2),
    Piece(Pieces.BLACK_PAWN, 4, 2),
    Piece(Pieces.BLACK_PAWN, 5, 2),
    Piece(Pieces.BLACK_PAWN, 6, 2),
    Piece(Pieces.BLACK_PAWN, 7, 2),
    Piece(Pieces.BLACK_PAWN, 8, 2),

    Piece(Pieces.WHITE_PAWN, 1, 7),
    Piece(Pieces.WHITE_PAWN, 2, 7),
    Piece(Pieces.WHITE_PAWN, 3, 7),
    Piece(Pieces.WHITE_PAWN, 4, 7),
    Piece(Pieces.WHITE_PAWN, 5, 7),
    Piece(Pieces.WHITE_PAWN, 6, 7),
    Piece(Pieces.WHITE_PAWN, 7, 7),
    Piece(Pieces.WHITE_PAWN, 8, 7),
    Piece(Pieces.WHITE_ROOK, 1, 8),
    Piece(Pieces.WHITE_KNIGHT, 2, 8),
    Piece(Pieces.WHITE_BISHOP, 3, 8),
    Piece(Pieces.WHITE_QUEEN, 4, 8),
    Piece(Pieces.WHITE_KING, 5, 8),
    Piece(Pieces.WHITE_BISHOP, 6, 8),
    Piece(Pieces.WHITE_KNIGHT, 7, 8),
    Piece(Pieces.WHITE_ROOK, 8, 8)
];

class Chessboard extends HTMLCanvasElement {

    constructor() {
        super();

        this.boardState = STARTING_BOARDSTATE;
    }

    // Component lifecycle methods.
    connectedCallback() {
        this.width = 480;
        this.height = 480;

        this.draw();
    }

    disconnectedCallback() {}

    attributeChangedCallback(name, previousValue, newValue) {}

    adoptedCallback() {}

    // Fetch sprite methods.
    getSpriteForPiece(piece) {
        switch(piece) {
            case Pieces.WHITE_PAWN:
                return this.sprites.whitePawn;
            case Pieces.WHITE_ROOK:
                return this.sprites.whiteRook;
            case Pieces.WHITE_KNIGHT:
                return this.sprites.whiteKnight;
            case Pieces.WHITE_QUEEN:
                return this.sprites.whiteQueen;
            case Pieces.WHITE_KING:
                return this.sprites.whiteKing;
            case Pieces.WHITE_BISHOP:
                return this.sprites.whiteBishop;
            case Pieces.BLACK_PAWN:
                return this.sprites.blackPawn;
            case Pieces.BLACK_ROOK:
                return this.sprites.blackRook;
            case Pieces.BLACK_KNIGHT:
                return this.sprites.blackKnight;
            case Pieces.BLACK_QUEEN:
                return this.sprites.blackQueen;
            case Pieces.BLACK_KING:
                return this.sprites.blackKing;
            case Pieces.BLACK_BISHOP:
                return this.sprites.blackBishop;
        }
    }

    async loadSprites() {
        this.sprites = {};

        // Load white sprites.
        this.sprites.whitePawn = await loadImage('../sprites/Chess_plt60.png');
        this.sprites.whiteRook = await loadImage('../sprites/Chess_rlt60.png');
        this.sprites.whiteKnight = await loadImage('../sprites/Chess_nlt60.png');
        this.sprites.whiteKing = await loadImage('../sprites/Chess_klt60.png');
        this.sprites.whiteBishop = await loadImage('../sprites/Chess_blt60.png');
        this.sprites.whiteQueen = await loadImage('../sprites/Chess_qlt60.png');

        // Load black sprites.
        this.sprites.blackPawn = await loadImage('../sprites/Chess_pdt60.png');
        this.sprites.blackRook = await loadImage('../sprites/Chess_rdt60.png');
        this.sprites.blackKnight = await loadImage('../sprites/Chess_ndt60.png');
        this.sprites.blackKing = await loadImage('../sprites/Chess_kdt60.png');
        this.sprites.blackBishop = await loadImage('../sprites/Chess_bdt60.png');
        this.sprites.blackQueen = await loadImage('../sprites/Chess_qdt60.png');
    }

    // Draw board methods.
    drawPieces(boardCtx) {
        this.boardState.forEach((p) => {
            boardCtx.drawImage(this.getSpriteForPiece(p.piece), (p.x - 1) * 60, (p.y - 1) * 60, 60, 60);
        });
    }

    drawBoard(boardCtx) {
        const width = 480/8;

        const blackColor = "#6D4C41";
        const whiteColor = "#E8E2C9";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r % 2 !== c % 2) {
                    boardCtx.beginPath();
                    boardCtx.rect(c*width, r*width, width, width);
                    boardCtx.fillStyle = blackColor;
                    boardCtx.fill()
                } else {
                    boardCtx.beginPath();
                    boardCtx.rect(c*width, r*width, width, width);
                    boardCtx.fillStyle = whiteColor;
                    boardCtx.fill()
                }
            }
        }
    }

    draw() {
        this.loadSprites().then(() => {
            // this.board = document.getElementById('chessboard');

            const boardCtx = this.getContext('2d');

            this.drawBoard(boardCtx);

            this.drawPieces(boardCtx);
        }).catch((e) => {
            console.error(e);
        });
    }
    // Handle user interaction.


}

window.customElements.define('chess-board', Chessboard, { extends: 'canvas' });
