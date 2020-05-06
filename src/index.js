const DPI = window.devicePixelRatio;

const PROMOTION_CHOICES = Symbol('promotion-choices');
const DARK_OVERLAY = Symbol('dark-overlay');
const HIGHLIGHT_CHOICE = Symbol('highlight-choice');

// Utility methods.
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};

const pathJoin = (parts, sep) => {
    var separator = sep || '/';
    var replace = new RegExp(separator + '{1,}', 'g');
    return parts.join(separator).replace(replace, separator);
}

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

    return boardState;

};

const algebraicToRowCol = (square, orientation) => {
    cols = {
        'a': 0, 'b': 1, 'c': 2, 'd': 3,
        'e': 4, 'f': 5, 'g': 6, 'h': 7
    };

    colsFlipped = {
        'a': 7, 'b': 6, 'c': 5, 'd': 4,
        'e': 3, 'f': 2, 'g': 1, 'h': 0
    };

    rows = {
        '1': 7, '2': 6, '3': 5, '4': 4,
        '5': 3, '6': 2, '7': 1, '8': 0
    };

    rowsFlipped = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        '5': 4, '6': 5, '7': 6, '8': 7
    };

    if (orientation === 0) {
        return { row: rows[square[1]], column: cols[square[0]] };
    } else if (orientation === 1) {
        return { row: rowsFlipped[square[1]], column: colsFlipped[square[0]] };
    }
};

const rowColToAlgebraic = (square, orientation) => {
    cols = {
        0: 'a', 1: 'b', 2: 'c', 3: 'd',
        4: 'e', 5: 'f', 6: 'g', 7: 'h'
    };

    colsFlipped = {
        7: 'a', 6: 'b', 5: 'c', 4: 'd',
        3: 'e', 2: 'f', 1: 'g', 0: 'h'
    };

    rows = {
        7: '1', 6: '2', 5: '3', 4: '4',
        3: '5', 2: '6', 1: '7', 0: '8'
    };

    rowsFlipped = {
        0: '1', 1: '2', 2: '3', 3: '4',
        4: '5', 5: '6', 6: '7', 7: '8'
    };

    if (orientation === 0) {
        return cols[square.column] + rows[square.row];
    } else if (orientation === 1) {
        return colsFlipped[square.column] + rowsFlipped[square.row];
    }
};

const clearCanvas = (c) => {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
};

const STARTING_BOARDSTATE = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');


class ChessedBoard {

    constructor(div, config, root) {

        this.root = root ? root : document;

        this.div = div;

        this.config = config ? config : {};

        this.config.movementEnabled = this.config.movementEnabled === false ? false : true;

        this.boardState = this.config.state ? this.config.state : STARTING_BOARDSTATE;
        if (this.config.orientation === null || this.config.orientation === undefined) {
            this.config.orientation = 0;
        }

        this.config.coordinates = this.config.coordinates ? true : false;

        this.setupBoard();
    }

    // Component lifecycle methods.
    setupBoard() {

        const boardDiv = (typeof this.div === 'string' || this.div instanceof String) ? this.root.getElementById(this.div) : this.div;
        boardDiv.innerHTML = `
            <div id='event-capture' style='position: relative; width: 100%; height: 100%;'>
                <canvas id='chess-board-layer' style='position: absolute; left: 0; top: 0; z-index: 0;'></canvas>
                <canvas id='bottom-persistent-animation-layer' style='position: absolute; left: 0; top: 0; z-index: 1;'></canvas>
                <canvas id='bottom-animation-layer' style='position: absolute; left: 0; top: 0; z-index: 2;'></canvas>
                <canvas id='piece-layer' style='position: absolute; left: 0; top: 0; z-index: 3;'></canvas>
                <canvas id='top-persistent-animation-layer' style='position: absolute; left: 0; top: 0; z-index: 4;'></canvas>
                <canvas id='top-animation-layer' style='position: absolute; left: 0; top: 0; z-index: 5;'></canvas>
            <div>
        `;

        this.eventCaptureLayer = this.root.getElementById('event-capture');

        window.onload = () => {
            this._resize.bind(this)();

            if (this.loaded && this.config.onLoad) {
                this.config.onLoad();
            }

            this.loaded = true;
        };

        window.onresize = this._resize.bind(this);

        // Fetch all the canvases.
        this.chessBoardLayer = this.root.getElementById('chess-board-layer');
        this.bottomPersistentLayer = this.root.getElementById('bottom-persistent-animation-layer');
        this.bottomAnimationLayer = this.root.getElementById('bottom-animation-layer');
        this.pieceLayer = this.root.getElementById('piece-layer');
        this.topPersistentLayer = this.root.getElementById('top-persistent-animation-layer');
        this.topAnimationLayer = this.root.getElementById('top-animation-layer');

        // Size the canvases.
        this._setCanvasSizes();

        this.animator = new ChessedAnimator(this.bottomAnimationLayer,
            this.bottomPersistentLayer,
            this.topAnimationLayer,
            this.topPersistentLayer);

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

            if (this.loaded && this.config.onLoad) {
                this.config.onLoad();
            }

            this.loaded = true;
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

        const relativePath = this.config.modulePath ? this.config.modulePath : '..';

        this.sprites = {};

        // Load white sprites.
        this.sprites.whitePawn = await loadImage(pathJoin([relativePath, '/sprites/Chess_plt45.svg']));
        this.sprites.whiteRook = await loadImage(pathJoin([relativePath, '/sprites/Chess_rlt45.svg']));
        this.sprites.whiteKnight = await loadImage(pathJoin([relativePath, '/sprites/Chess_nlt45.svg']));
        this.sprites.whiteKing = await loadImage(pathJoin([relativePath, '/sprites/Chess_klt45.svg']));
        this.sprites.whiteBishop = await loadImage(pathJoin([relativePath, '/sprites/Chess_blt45.svg']));
        this.sprites.whiteQueen = await loadImage(pathJoin([relativePath, '/sprites/Chess_qlt45.svg']));

        // Load black sprites.
        this.sprites.blackPawn = await loadImage(pathJoin([relativePath, '/sprites/Chess_pdt45.svg']));
        this.sprites.blackRook = await loadImage(pathJoin([relativePath, '/sprites/Chess_rdt45.svg']));
        this.sprites.blackKnight = await loadImage(pathJoin([relativePath, '/sprites/Chess_ndt45.svg']));
        this.sprites.blackKing = await loadImage(pathJoin([relativePath, '/sprites/Chess_kdt45.svg']));
        this.sprites.blackBishop = await loadImage(pathJoin([relativePath, '/sprites/Chess_bdt45.svg']));
        this.sprites.blackQueen = await loadImage(pathJoin([relativePath, '/sprites/Chess_qdt45.svg']));

        // Load green sprites.
        this.sprites.dgreenBishop = await loadImage(pathJoin([relativePath, '/sprites/Chess_bdgt45.svg']));
        this.sprites.dgreenRook = await loadImage(pathJoin([relativePath, '/sprites/Chess_rdgt45.svg']));
        this.sprites.dgreenKnight = await loadImage(pathJoin([relativePath, '/sprites/Chess_ndgt45.svg']));
        this.sprites.dgreenQueen = await loadImage(pathJoin([relativePath, '/sprites/Chess_qdgt45.svg']));

        this.sprites.lgreenBishop = await loadImage(pathJoin([relativePath, '/sprites/Chess_blgt45.svg']));
        this.sprites.lgreenRook = await loadImage(pathJoin([relativePath, '/sprites/Chess_rlgt45.svg']));
        this.sprites.lgreenKnight = await loadImage(pathJoin([relativePath, '/sprites/Chess_nlgt45.svg']));
        this.sprites.lgreenQueen = await loadImage(pathJoin([relativePath, '/sprites/Chess_qlgt45.svg']));
    }

    // Draw board methods.
    drawPieces(blur) {
        this.pieceCtx.clearRect(0, 0, this.width, this.height);
        if (blur) {
            this.pieceCtx.filter = 'blur(3px)';
        } else {
            this.pieceCtx.filter = 'none';
        }
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.boardState[r][c]) {
                    this.pieceCtx.drawImage(this.sprite(this.boardState[r][c]), c * this.squareWidth, r * this.squareWidth, this.squareWidth, this.squareWidth);
                }
            }
        }
    }

    drawBoard(blur) {
        const blackColor = '#819ca9';
        const whiteColor = '#fefefe';

        this.boardCtx.clearRect(0, 0, this.width, this.height);

        if (blur) {
            this.boardCtx.filter = 'blur(3px)';
        } else {
            this.boardCtx.filter = 'none';
        }
        let fontColor = blackFontColor
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r % 2 !== c % 2) {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c * this.squareWidth, r * this.squareWidth, this.squareWidth, this.squareWidth);
                    this.boardCtx.fillStyle = blackColor;
                    this.boardCtx.fill();

                    // Set color back for numbers.
                    this.boardCtx.fillStyle = whiteColor;
                } else {
                    this.boardCtx.beginPath();
                    this.boardCtx.rect(c * this.squareWidth, r * this.squareWidth, this.squareWidth, this.squareWidth);
                    this.boardCtx.fillStyle = whiteColor;
                    this.boardCtx.fill();

                    // Set color back for numbers.
                    this.boardCtx.fillStyle = blackColor;
                }

                if (this.config.coordinates) {
                    if (c == 0) {
                        this.boardCtx.font = 'bold 15px Helvetica, Arial, sans-serif';
                        const rows = [8, 7, 6, 5, 4, 3, 2, 1];
                        if (this.config.orientation === 1) {
                            rows.reverse();
                        }
                        this.boardCtx.fillText(rows[r], c * this.squareWidth + 2, r * this.squareWidth + 14);
                    }

                    if (r == 7) {
                        const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                        if (this.config.orientation === 1) {
                            columns.reverse();
                        }
                        this.boardCtx.font = 'bold 15px Helvetica, Arial, sans-serif';
                        this.boardCtx.fillText(columns[c], c * this.squareWidth + this.squareWidth - 12, r * this.squareWidth + this.squareWidth - 4);
                    }
                }
            }
        }
    }

    draw(blur) {
        this.drawBoard(blur);

        this.drawPieces(blur);
    }

    getMouseLocationInCanvas(e) {
        const canvasRect = this.chessBoardLayer.getBoundingClientRect();
        const dpi = window.devicePixelRatio;

        return {
            x: (e.clientX * dpi) - canvasRect.left,
            y: (e.clientY * dpi) - canvasRect.top
        };
    }

    _getSquare(mouseLocation) {
        const row = Math.floor(mouseLocation.y / this.squareWidth);
        const column = Math.floor(mouseLocation.x / this.squareWidth);

        return {
            name: rowColToAlgebraic({ row, column }, this.config.orientation),
            row: row,
            column: column,
            origin: {
                x: column * this.squareWidth,
                y: row * this.squareWidth
            },
            center: {
                x: column * this.squareWidth + (this.squareWidth / 2),
                y: row * this.squareWidth + (this.squareWidth / 2)
            }
        };
    }

    _movePiece(start, finish) {
        this.boardState[finish.row][finish.column] = this.selectedPiece;

        this.draw();
    }

    constructChessedEvent(e) {

        const mouseLocation = this.getMouseLocationInCanvas(e);
        const square = this._getSquare(mouseLocation);

        const chessedEvent = {
            draggingPiece: this.draggingPiece ? true : false,
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
            const mouseLocation = this.getMouseLocationInCanvas(e);
            const square = this._getSquare(mouseLocation);
            this.startSquare = square;
            this.startMouseLocation = mouseLocation;
            this.pickupPiece(e);
            if (this.config.onLeftClick) {
                this.config.onLeftClick(this.constructChessedEvent(e));
            }
        } else if (e.which === 3) {

            this.rightClicking = true;
            this.putPieceBack();

            const mouseLocation = this.getMouseLocationInCanvas(e);
            const square = this._getSquare(mouseLocation);
            this.startSquare = square;
            this.startMouseLocation = mouseLocation;

            if (this.config.onRightClick) {
                this.config.onRightClick(this.constructChessedEvent(e));
            }
        }
    }

    handleMouseUp(e) {
        if (e.which === 1) {

            if (this.promptingForPromotion) {
                const mouseLocation = this.getMouseLocationInCanvas(e);
                const square = this._getSquare(mouseLocation);

                const choiceNum = this.choiceSquares.indexOf(square.name);
                let callbackData = null;
                let success = false;
                if (choiceNum !== -1) {
                    const choice = this.pieceChoices[choiceNum];

                    const promotionLocation = this.choiceSquares[0];

                    this.putPieceOnBoard(choice.type, choice.color, promotionLocation);

                    callbackData = {
                        type: choice.type,
                        color: choice.color
                    };

                    success = true;
                }

                this.clearTopAnimations();
                this.draw(false);
                this.config.movementEnabled = this.tempMovementEnabled;
                this.promptingForPromotion = false;

                if (this.promotionCallback) {
                    this.promotionCallback(success, callbackData);
                }
            } else if (this.config.onLeftClickRelease) {
                const legalMove = this.config.onLeftClickRelease(this.constructChessedEvent(e));
                if (legalMove) {
                    this.placePiece(e);
                    if (legalMove.san === 'O-O' || legalMove.san === 'O-O-O') { // castling
                        // Need to move the rook.
                        if (legalMove.to === 'g1') {
                            this.removePiece('h1');
                            this.putPieceOnBoard('r', 'w', 'f1');
                        } else if (legalMove.to === 'c1') {
                            this.removePiece('a1');
                            this.putPieceOnBoard('r', 'w', 'd1');
                        } else if (legalMove.to === 'g8') {
                            this.removePiece('h8');
                            this.putPieceOnBoard('r', 'b', 'f8');
                        } else if (legalMove.to === 'c8') {
                            this.removePiece('a8');
                            this.putPieceOnBoard('r', 'b', 'd8');
                        }
                    } else if (legalMove.enPassant) {
                        if (legalMove.to[1] === '6') {
                            this.removePiece(legalMove.to[0] + '5');
                        } else if (legalMove.to[1] === '3') {
                            this.removePiece(legalMove.to[0] + '4');
                        }
                    }
                } else {
                    this.putPieceBack();
                }
            } else {
                this.placePiece(e);
            }
        } else if (e.which === 3) {
            this.rightClicking = false;
            if (this.config.onRightClickRelease) {
                this.config.onRightClickRelease(this.constructChessedEvent(e));
            }
        }
    }

    handleMouseMove(e) {
        if (this.promptingForPromotion) {
            this.removeAnimationsByType(HIGHLIGHT_CHOICE);

            const mouseLocation = this.getMouseLocationInCanvas(e);
            const square = this._getSquare(mouseLocation);
            if (this.choiceSquares.includes(square.name)) {
                const choiceNum = this.choiceSquares.indexOf(square.name);
                const choice = this.pieceChoices[choiceNum];
                const drawHighlightedPiece = (animationLayer) => {
                    animationLayer.getContext('2d').drawImage(choice.highlight,
                        square.origin.x,
                        square.origin.y,
                        this.squareWidth,
                        this.squareWidth);
                };

                this.animateAbove(drawHighlightedPiece, HIGHLIGHT_CHOICE);

            }

        }

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
        if (this.config.movementEnabled) {
            const mouseLocation = this.getMouseLocationInCanvas(e);
            this.startSquare = this._getSquare(mouseLocation);
            if (this.boardState[this.startSquare.row][this.startSquare.column]) {
                this.selectedPiece = this.boardState[this.startSquare.row][this.startSquare.column];
                this.selectedPieceSprite = this.sprite(this.selectedPiece);
                this.boardState[this.startSquare.row][this.startSquare.column] = null;

                this.draw();

                this.pieceCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - this.squareWidth / 2, mouseLocation.y - this.squareWidth / 2, this.squareWidth, this.squareWidth);

                this.draggingPiece = true;
            }
        }
    }

    placePiece(e) {
        if (this.config.movementEnabled) {
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
    }

    dragPiece(e) {
        if (this.config.movementEnabled) {
            const mouseLocation = this.getMouseLocationInCanvas(e);
            this.draw();
            this.pieceCtx.drawImage(this.selectedPieceSprite, mouseLocation.x - this.squareWidth / 2, mouseLocation.y - this.squareWidth / 2, this.squareWidth, this.squareWidth);
        }
    }

    putPieceBack() {
        if (this.draggingPiece) {
            if (this.config.onCancel) {
                this.config.onCancel();
            }
            this.boardState[this.startSquare.row][this.startSquare.column] = this.selectedPiece;

            this.startSquare = null;
            this.selectedPieceSprite = null;
            this.selectedPiece = null;
            this.draggingPiece = false;
            this.draw();
        }
    }

    _setCanvasSizes() {
        const dpi = window.devicePixelRatio;
        
        const styleWidth = this.eventCaptureLayer.clientWidth;
        const styleHeight = this.eventCaptureLayer.clientWidth;

        this.width = dpi * styleWidth;
        this.height = this.width;
        
        this.squareWidth = this.width / 8;
        
        this.chessBoardLayer.width = this.width;
        this.chessBoardLayer.height = this.height;
        this.chessBoardLayer.style.width = styleWidth;
        this.chessBoardLayer.style.height = styleHeight;

        this.bottomAnimationLayer.width = this.width;
        this.bottomAnimationLayer.height = this.height;
        this.bottomAnimationLayer.style.width =  styleWidth;
        this.bottomAnimationLayer.style.height = styleHeight;

        this.bottomPersistentLayer.width = this.width;
        this.bottomPersistentLayer.height = this.height;
        this.bottomPersistentLayer.style.width =  styleWidth;
        this.bottomPersistentLayer.style.height = styleHeight;

        this.pieceLayer.width = this.width;
        this.pieceLayer.height = this.height;
        this.pieceLayer.style.width = styleWidth;
        this.pieceLayer.style.height = styleHeight;

        this.topPersistentLayer.width = this.width;
        this.topPersistentLayer.height = this.height;
        this.topPersistentLayer.style.width = styleWidth;
        this.topPersistentLayer.style.height = styleHeight;

        this.topAnimationLayer.width = this.width;
        this.topAnimationLayer.height = this.height;
        this.topAnimationLayer.style.width =  styleWidth;
        this.topAnimationLayer.style.height = styleHeight;
    }

    _resize() {
        this.promptingForPromotion = false;

        this.pieceCtx.clearRect(0, 0, this.width, this.height);
        this.boardCtx.clearRect(0, 0, this.width, this.height);

        this.animator.clearBottomAnimations();
        this.animator.clearPersistedBottomAnimations();
        this.animator.clearTopAnimations();
        this.animator.clearPersistedTopAnimations();

        this._setCanvasSizes();

        this.draw();
    }

    // Public API.

    // Animation hooks.
    animateAbove(animationFunction, type) {
        const animation = {
            identifier: Symbol('CHESSED_ANIMATION_IDENTIFIER'),
            type: type,
            draw: animationFunction
        };

        this.animator.animateAbove(animation);
        return animation;
    }

    animateBelow(animationFunction, type) {
        const animation = {
            identifier: Symbol('CHESSED_ANIMATION_IDENTIFIER'),
            type: type,
            draw: animationFunction
        };

        this.animator.animateBelow(animation);
        return animation;
    }

    persistBottomAnimations() {
        this.animator.persistBottomAnimations();
    }

    persistTopAnimations() {
        this.animator.persistTopAnimations();
    }

    clearBottomAnimations() {
        this.animator.clearBottomAnimations();
    }

    clearPersistedBottomAnimations() {
        this.animator.clearPersistedBottomAnimations();
    }

    clearTopAnimations() {
        this.animator.clearTopAnimations();
    }

    clearPersistedTopAnimations() {
        this.animator.clearPersistedTopAnimations();
    }

    removeAnimation(animation) {
        this.animator.removeAnimation(animation);
    }

    removeAnimationsByType(type) {
        this.animator.removeAnimationsByType(type);
    }

    // Interaction APIs.
    removePiece(from) {
        const fromSquare = algebraicToRowCol(from, this.config.orientation);

        this.boardState[fromSquare.row][fromSquare.column] = null;

        this.draw();
    }

    movePiece(from, to) {
        const start = algebraicToRowCol(from, this.config.orientation);
        const finish = algebraicToRowCol(to, this.config.orientation);

        this.boardState[finish.row][finish.column] = this.boardState[start.row][start.column];
        this.boardState[start.row][start.column] = null;

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
            name: square,
            row: row,
            column: column,
            origin: {
                x: column * this.squareWidth,
                y: row * this.squareWidth
            },
            center: {
                x: column * this.squareWidth + (this.squareWidth / 2),
                y: row * this.squareWidth + (this.squareWidth / 2)
            }
        };
    }

    getBoardDimensions() {
        return {
            size: this.width,
            squareSize: this.squareWidth
        };
    }

    putPieceOnBoard(type, color, square) {
        const piece = { type, color };
        const squareLocation = algebraicToRowCol(square, this.config.orientation);

        this.boardState[squareLocation.row][squareLocation.column] = piece;

        this.draw();
    }

    displayPromotionOptions(square, color, callback) {
        this.promotionCallback = callback;
        this.promptingForPromotion = true;
        // Store value so it can be reset, then set to false.
        this.tempMovementEnabled = this.config.movementEnabled;
        this.config.movementEnabled = false;

        this.animator.clearTopAnimations();
        this.animator.clearBottomAnimations();

        this.draw(true);

        if (this.chessBoardLayer.getContext('2d').filter === undefined) {
            this.darkOverlay = (animationLayer) => {
                const ctx = animationLayer.getContext('2d');
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(0, 0, this.width, this.height);
            };

            this.animateAbove(this.darkOverlay, DARK_OVERLAY);
        }

        const squareInfo = this.getSquare(square);

        this.pieceChoices = color === 'white' ? [
            {
                color: 'w',
                type: 'q',
                sprite: this.sprites.whiteQueen,
                highlight: this.sprites.lgreenQueen
            },
            {
                color: 'w',
                type: 'r',
                sprite: this.sprites.whiteRook,
                highlight: this.sprites.lgreenRook
            },
            {
                color: 'w',
                type: 'b',
                sprite: this.sprites.whiteBishop,
                highlight: this.sprites.lgreenBishop
            },
            {
                color: 'w',
                type: 'n',
                sprite: this.sprites.whiteKnight,
                highlight: this.sprites.lgreenKnight
            }
        ] : [
                {
                    color: 'b',
                    type: 'q',
                    sprite: this.sprites.blackQueen,
                    highlight: this.sprites.dgreenQueen
                },
                {
                    color: 'b',
                    type: 'r',
                    sprite: this.sprites.blackRook,
                    highlight: this.sprites.dgreenRook
                },
                {
                    color: 'b',
                    type: 'b',
                    sprite: this.sprites.blackBishop,
                    highlight: this.sprites.dgreenBishop
                },
                {
                    color: 'b',
                    type: 'n',
                    sprite: this.sprites.blackKnight,
                    highlight: this.sprites.dgreenKnight
                }
            ];

        const squareColumn = square[0];
        const squareRow = +square[1];
        this.drawChoices = (animationLayer) => {
            this.choiceSquares = [];

            const ctx = animationLayer.getContext('2d');
            const direction = (color === 'white' && this.config.orientation === 0) ||
                (color === 'black' && this.config.orientation === 1) ? 1 : -1;

            let rOffset = 0;
            this.pieceChoices.forEach((choice) => {
                ctx.drawImage(choice.sprite,
                    squareInfo.origin.x,
                    squareInfo.origin.y + (rOffset * this.squareWidth),
                    this.squareWidth,
                    this.squareWidth);
                const row = this.config.orientation === 0 ? (squareRow - rOffset) : (squareRow + rOffset);
                this.choiceSquares.push(squareColumn + row.toString());
                rOffset += direction;
            });
        };

        this.animateAbove(this.drawChoices, PROMOTION_CHOICES);
    }
}

class ChessedAnimator {
    constructor(bottomAnimationLayer,
        bottomPersistentLayer,
        topAnimationLayer,
        topPersistentLayer) {

        this.bottomAnimationLayer = bottomAnimationLayer;
        this.bottomPersistentLayer = bottomPersistentLayer;
        this.topAnimationLayer = topAnimationLayer;
        this.topPersistentLayer = topPersistentLayer;

        this.topAnimations = [];
        this.bottomAnimations = [];
        this.persistedTopAnimations = [];
        this.persistedBottomAnimations = [];
    }

    render() {
        clearCanvas(this.topAnimationLayer);
        clearCanvas(this.topPersistentLayer);
        clearCanvas(this.bottomAnimationLayer);
        clearCanvas(this.bottomPersistentLayer);

        this.topAnimations.forEach(a => a.draw(this.topAnimationLayer));
        this.persistedTopAnimations.forEach(a => a.draw(this.topPersistentLayer));
        this.bottomAnimations.forEach(a => a.draw(this.bottomAnimationLayer));
        this.persistedBottomAnimations.forEach(a => a.draw(this.bottomPersistentLayer));
    }

    animateAbove(a) {
        this.topAnimations.push(a);
        a.draw(this.topAnimationLayer);
    }

    animateBelow(a) {
        this.bottomAnimations.push(a);
        a.draw(this.bottomAnimationLayer);
    }

    persistTopAnimations() {
        this.topAnimations.forEach(a => {
            this.persistedTopAnimations.push(a);
        });

        this.persistedTopAnimations.forEach(a => {
            a.draw(this.topPersistentLayer);
        });
    }

    persistBottomAnimations() {
        this.bottomAnimations.forEach(a => {
            this.persistedBottomAnimations.push(a);
        });

        this.persistedBottomAnimations.forEach(a => {
            a.draw(this.bottomPersistentLayer);
        });
    }

    clearTopAnimations() {
        this.topAnimations = [];

        const ctx = this.topAnimationLayer.getContext('2d');
        ctx.clearRect(0, 0, this.topAnimationLayer.width, this.topAnimationLayer.height);
    }

    clearPersistedTopAnimations() {
        this.persistedTopAnimations = [];

        const persistentCtx = this.topPersistentLayer.getContext('2d');
        persistentCtx.clearRect(0, 0, this.topPersistentLayer.width, this.topPersistentLayer.height);
    }

    clearBottomAnimations() {
        this.bottomAnimations = [];

        const ctx = this.bottomAnimationLayer.getContext('2d');
        ctx.clearRect(0, 0, this.bottomAnimationLayer.width, this.bottomAnimationLayer.height);
    }

    clearPersistedBottomAnimations() {
        this.persistedBottomAnimations = [];

        const persistentCtx = this.bottomPersistentLayer.getContext('2d');
        persistentCtx.clearRect(0, 0, this.bottomPersistentLayer.width, this.bottomPersistentLayer.height);
    }

    removeAnimation(animation) {
        this.topAnimations = this.topAnimations.filter(a => a.identifier !== animation.identifier);
        this.persistedTopAnimations = this.persistedTopAnimations.filter(a => a.identifier !== animation.identifier);
        this.bottomAnimations = this.bottomAnimations.filter(a => a.identifier !== animation.identifier);
        this.persistedBottomAnimations = this.persistedBottomAnimations.filter(a => a.identifier !== animation.identifier);
        this.render();
    }

    removeAnimationsByType(type) {
        this.topAnimations = this.topAnimations.filter(a => a.type !== type);
        this.persistedTopAnimations = this.persistedTopAnimations.filter(a => a.type !== type);
        this.bottomAnimations = this.bottomAnimations.filter(a => a.type !== type);
        this.persistedBottomAnimations = this.persistedBottomAnimations.filter(a => a.type !== type);
        this.render();
    }
}