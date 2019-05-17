
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
    let ranks = fen.split(' ')[0];
    ranks = ranks.split('/');

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


    return boardState;

};

const STARTING_BOARDSTATE = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

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
            console.log(e);
        });

        this.onmousedown = this.pickupPiece;
        this.onmouseup = this.placePiece;
        this.onmousemove = this.animateMovement;
        this.onmouseout = this.putPieceBack;
    }

    disconnectedCallback() { }

    attributeChangedCallback(name, previousValue, newValue) { }

    adoptedCallback() { }

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
                if (this.boardState[r][c]) {
                    this.boardCtx.drawImage(this.sprite(this.boardState[r][c]), c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                }
            }
        }
    }

    drawBoard() {
        const blackColor = "#6D4C41";
        const whiteColor = "#E8E2C9";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r % 2 !== c % 2) {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                    this.boardCtx.fillStyle = blackColor;
                    this.boardCtx.fill();
                } else {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c * SQUARE_WIDTH, r * SQUARE_WIDTH, SQUARE_WIDTH, SQUARE_WIDTH);
                    this.boardCtx.fillStyle = whiteColor;
                    this.boardCtx.fill();
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
        this.boardState[finish.row][finish.column] = this.selectedPiece;

        this.boardCtx.clearRect(0, 0, this.width, this.height);
        this.draw();
    }

    // Handle user interaction.
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
        }
    }

    placePiece(e) {
        if (this.draggingPiece && this.selectedPiece) {
            const endSquare = this.getSquare(this.getMouseLocationInCanvas(e));
            if (this.startSquare.row !== endSquare.row || this.startSquare.column !== endSquare.column) {
                this.movePiece(this.startSquare, endSquare);
            } else {
                this.putPieceBack();
            }

            this.startSquare = null;
            this.selectedPieceSprite = null;
            this.selectedPiece = null;
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

}

window.customElements.define('chess-board', Chessboard, { extends: 'canvas' });
