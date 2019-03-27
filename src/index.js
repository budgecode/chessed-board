
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
    EMPTY: 'EMPTY'
};

const Piece = (piece) => {
    return { piece };
};

const STARTING_BOARDSTATE = [
    [
        Piece(Pieces.BLACK_ROOK),
        Piece(Pieces.BLACK_KNIGHT),
        Piece(Pieces.BLACK_BISHOP),
        Piece(Pieces.BLACK_QUEEN),
        Piece(Pieces.BLACK_KING),
        Piece(Pieces.BLACK_BISHOP),
        Piece(Pieces.BLACK_KNIGHT),
        Piece(Pieces.BLACK_ROOK)
    ],
    [
        Piece(Pieces.BLACK_PAWN),
        Piece(Pieces.BLACK_PAWN),
        Piece(Pieces.BLACK_PAWN),
        Piece(Pieces.BLACK_PAWN),
        Piece(Pieces.BLACK_PAWN),
        Piece(Pieces.BLACK_PAWN),
        Piece(Pieces.BLACK_PAWN),
        Piece(Pieces.BLACK_PAWN)
    ],
    [Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY),
     Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY)],
    [Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY),
     Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY)],
    [Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY),
     Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY)],
    [Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY),
     Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY), Piece(Pieces.EMPTY)],
    [
        Piece(Pieces.WHITE_PAWN),
        Piece(Pieces.WHITE_PAWN),
        Piece(Pieces.WHITE_PAWN),
        Piece(Pieces.WHITE_PAWN),
        Piece(Pieces.WHITE_PAWN),
        Piece(Pieces.WHITE_PAWN),
        Piece(Pieces.WHITE_PAWN),
        Piece(Pieces.WHITE_PAWN),
    ],
    [
        Piece(Pieces.WHITE_ROOK),
        Piece(Pieces.WHITE_KNIGHT),
        Piece(Pieces.WHITE_BISHOP),
        Piece(Pieces.WHITE_QUEEN),
        Piece(Pieces.WHITE_KING),
        Piece(Pieces.WHITE_BISHOP),
        Piece(Pieces.WHITE_KNIGHT),
        Piece(Pieces.WHITE_ROOK)
    ]
];

const SQUARE_WIDTH = 60;

class Chessboard extends HTMLCanvasElement {

    constructor() {
        super();

        this.boardState = STARTING_BOARDSTATE;
    }

    // Component lifecycle methods.
    connectedCallback() {
        this.width = SQUARE_WIDTH * 8;
        this.height = SQUARE_WIDTH * 8;

        this.loadSprites().then(() => {
            this.boardCtx = this.getContext('2d');
            this.draw();
        }).catch((e) => {
            console.error(e);
        });

        this.onmousedown = this.pickupPiece;
        this.onmouseup = this.placePiece;
        this.onmousemove = this.animateMovement;
        this.onmouseout = this.putPieceBack;
    }

    disconnectedCallback() {}

    attributeChangedCallback(name, previousValue, newValue) {}

    adoptedCallback() {}

    // Fetch sprite methods.
    sprite(piece) {
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
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.boardState[r][c].piece !== Pieces.EMPTY) {
                    this.boardCtx.drawImage(this.sprite(this.boardState[r][c].piece), c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                }
            }
        }
    }

    drawBoard() {
        const width = 480/8;

        const blackColor = "#6D4C41";
        const whiteColor = "#E8E2C9";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r % 2 !== c % 2) {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c*width, r*width, width, width);
                    this.boardCtx.fillStyle = blackColor;
                    this.boardCtx.fill()
                } else {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c*width, r*width, width, width);
                    this.boardCtx.fillStyle = whiteColor;
                    this.boardCtx.fill()
                }
            }
        }
    }

    draw() {
        this.drawBoard();

        this.drawPieces();
    }

    getMouseLocationInCanvas(e) {
        const canvasRect = this.getBoundingClientRect();

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
        this.boardState[finish.row][finish.column] = this.boardState[start.row][start.column];
        this.boardState[start.row][start.column] = Piece(Pieces.EMPTY);
        this.boardCtx.clearRect(0, 0, this.width, this.height);
        this.draw();
    }

    // Handle user interaction.
    pickupPiece(e) {
        const mouseLocation = this.getMouseLocationInCanvas(e);
        this.startSquare = this.getSquare(mouseLocation);
        if (this.boardState[this.startSquare.row][this.startSquare.column].piece !== Pieces.EMPTY) {
            this.selectedPieceSprite = this.sprite(this.boardState[this.startSquare.row][this.startSquare.column].piece);

            this.boardCtx.clearRect(0, 0, this.width, this.height);
            this.draw();

            this.boardCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - SQUARE_WIDTH / 2, mouseLocation.y - SQUARE_WIDTH / 2, SQUARE_WIDTH, SQUARE_WIDTH);

            this.draggingPiece = true;
        }
    }

    placePiece(e) {
        if (this.draggingPiece && this.boardState[this.startSquare.row][this.startSquare.column].piece !== Pieces.EMPTY) {
            const endSquare = this.getSquare(this.getMouseLocationInCanvas(e));
            if (this.startSquare.row !== endSquare.row || this.startSquare.column !== endSquare.column) {
                this.movePiece(this.startSquare, endSquare);
            } else {
                this.draw();
            }

            this.startSquare = null;
            this.selectedPieceSprite = null;
            this.draggingPiece = false;
        }
    }

    animateMovement(e) {
        if (this.draggingPiece) {
            const mouseLocation = this.getMouseLocationInCanvas(e);
            this.boardCtx.clearRect(0, 0, this.width, this.height);
            this.draw();
            this.boardCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - SQUARE_WIDTH / 2, mouseLocation.y - SQUARE_WIDTH / 2, SQUARE_WIDTH, SQUARE_WIDTH);
        }
    }

    putPieceBack(e) {
        this.startSquare = null;
        this.selectedPieceSprite = null;
        this.draggingPiece = false;
        this.draw();
    }

}

window.customElements.define('chess-board', Chessboard, { extends: 'canvas' });
