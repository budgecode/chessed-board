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

const STARTING_BOARDSTATE = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

const SQUARE_WIDTH = 70;

class Chessedboard {

    constructor(divId, boardState, config) {
        this.divId = divId;

        this.config = config ? config : {};      

        this.boardState = boardState ? boardState : STARTING_BOARDSTATE.board;
        
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
                <canvas id="board-canvas" style="position: absolute; left: 0; top: 0; z-index: 0;"></canvas>
                <canvas id="below-canvas" style="position: absolute; left: 0; top: 0; z-index: 1;"></canvas>
                <canvas id="piece-canvas" style="position: absolute; left: 0; top: 0; z-index: 2;"></canvas>
                <canvas id="above-canvas" style="position: absolute; left: 0; top: 0; z-index: 3;"></canvas>
            <div>
        `.format(this.width, this.height);

        // Fetch all the canvases.
        this.eventCaptureLayer = document.getElementById('event-capture');
        this.boardCanvas = document.getElementById('board-canvas');
        this.belowCanvas = document.getElementById('below-canvas');
        this.pieceCanvas = document.getElementById('piece-canvas');
        this.aboveCanvas = document.getElementById('above-canvas');

        // Size the canvases.
        this.boardCanvas.width = this.width;
        this.boardCanvas.height = this.height;

        this.belowCanvas.width = this.width;
        this.belowCanvas.height = this.height;

        this.pieceCanvas.width = this.width;
        this.pieceCanvas.height = this.height;

        this.aboveCanvas.width = this.width;
        this.aboveCanvas.height = this.height;

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
            this.boardCtx = this.boardCanvas.getContext('2d');
            this.pieceCtx = this.pieceCanvas.getContext('2d');
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

                if (c == 0) {
                    this.boardCtx.font = 'bold 12px Arial';
                    this.boardCtx.fillText(8 - r, c * SQUARE_WIDTH + 2, r * SQUARE_WIDTH + 12);
                }

                if (r == 7) {
                    const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                    this.boardCtx.font = 'bold 12px Arial';
                    this.boardCtx.fillText(columns[c], c * SQUARE_WIDTH + SQUARE_WIDTH - 10, r * SQUARE_WIDTH + SQUARE_WIDTH - 4);
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

        return { 
            row: row, 
            column: column,
            origin: {
                x: column * SQUARE_WIDTH,
                y: row * SQUARE_WIDTH
            }
        };
    }

    movePiece(start, finish) {
        this.boardState[finish.row][finish.column] = this.selectedPiece;

        this.pieceCtx.clearRect(0, 0, this.width, this.height);
        this.draw();
    }

    constructChessedEvent(e) {

        const mouseLocation = this.getMouseLocationInCanvas(e);
        const square =  this.getSquare(mouseLocation);

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
        if (e.which === 1) {
            this.pickupPiece(e);
            if (this.config.leftClick) {
                const mouseLocation = this.getMouseLocationInCanvas(e);
                const square =  this.getSquare(mouseLocation);
                this.startSquare = square;
                this.startMouseLocation = mouseLocation;

                this.config.leftClick(this.constructChessedEvent(e));
            }
        } else if (e.which === 3) {
            this.putPieceBack();
        }
    }

    handleMouseUp(e) {
        if (e.which === 1) {
            this.placePiece(e);
            if (this.config.leftClickRelease) {
                this.config.leftClickRelease(this.constructChessedEvent(e));
            }
        }
    }

    handleMouseMove(e) {
        if (this.draggingPiece) {
            this.dragPiece(e);
            if (this.config.leftClickDrag) {
                this.config.leftClickDrag(this.constructChessedEvent(e));
            }
        }
    }

    hanldeMouseOut(e) {
        this.putPieceBack(e);
    }


    pickupPiece(e) {
        const mouseLocation = this.getMouseLocationInCanvas(e);
        this.startSquare = this.getSquare(mouseLocation);
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

    // Animation hooks.
    animate(animation) {
        animation(this.belowCanvas, this.aboveCanvas);
    }

}

window.Chessedboard = Chessedboard;