/**
 * Copyright (c) 2020 Brian Budge
 *
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 */

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

const viewRowColToBoardRowCol = (square, orientation) => {
    if (orientation === 0) {
        return { row: square.row, column: square.column };
    } else {
        return { row: 7 - square.row, column: 7 - square.column };
    }
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
            <div tabindex='0' id='event-capture' style='position: relative;'>
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

        this.pieceCtx = this.pieceLayer.getContext('2d');
        this.boardCtx = this.chessBoardLayer.getContext('2d');

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
        this.eventCaptureLayer.onmouseout = this.handleMouseOut.bind(this);

        if (this.config.onKeyDown) {
            this.eventCaptureLayer.onkeydown = this.config.onKeyDown;
        }

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
        this.sprites.whitePawn = await loadImage(pathJoin([relativePath, '/sprites/s_pw.svg']));
        this.sprites.whiteRook = await loadImage(pathJoin([relativePath, '/sprites/s_rw.svg']));
        this.sprites.whiteKnight = await loadImage(pathJoin([relativePath, '/sprites/s_knw.svg']));
        this.sprites.whiteKing = await loadImage(pathJoin([relativePath, '/sprites/s_kw.svg']));
        this.sprites.whiteBishop = await loadImage(pathJoin([relativePath, '/sprites/s_bw.svg']));
        this.sprites.whiteQueen = await loadImage(pathJoin([relativePath, '/sprites/s_qw.svg']));

        // Load black sprites.
        this.sprites.blackPawn = await loadImage(pathJoin([relativePath, '/sprites/s_pb.svg']));
        this.sprites.blackRook = await loadImage(pathJoin([relativePath, '/sprites/s_rb.svg']));
        this.sprites.blackKnight = await loadImage(pathJoin([relativePath, '/sprites/s_knb.svg']));
        this.sprites.blackKing = await loadImage(pathJoin([relativePath, '/sprites/s_kb.svg']));
        this.sprites.blackBishop = await loadImage(pathJoin([relativePath, '/sprites/s_bb.svg']));
        this.sprites.blackQueen = await loadImage(pathJoin([relativePath, '/sprites/s_qb.svg']));
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
            const row = this.config.orientation === 0 ? r : 7 - r;
            for (let c = 0; c < 8; c++) {
                const col = this.config.orientation === 0 ? c : 7 - c;
                if (this.boardState[row][col]) {
                    this.pieceCtx.drawImage(this.sprite(this.boardState[row][col]), c * this.squareWidth, r * this.squareWidth, this.squareWidth, this.squareWidth);
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
                        this.boardCtx.fillText(columns[c], c * this.squareWidth + this.squareWidth - 12, r * this.squareWidth + this.squareWidth - 5);
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

        return {
            x: (e.clientX * DPI) - canvasRect.left,
            y: (e.clientY * DPI) - canvasRect.top
        };
    }

    _getSquare(mouseLocation) {
        const row = Math.floor(mouseLocation.y / this.squareWidth);
        const column = Math.floor(mouseLocation.x / this.squareWidth);

        const stateRowCol = viewRowColToBoardRowCol({ row, column }, this.config.orientation);

        return {
            name: rowColToAlgebraic({ row, column }, this.config.orientation),
            row: row,
            column: column,
            stateRow: stateRowCol.row,
            stateColumn: stateRowCol.column,
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

    _movePiece(finish, boardChange = true) {
        this.boardState[finish.stateRow][finish.stateColumn] = this.selectedPiece;

        this.draw();

        if (this.config.onBoardChange && boardChange) {
            this.config.onBoardChange(this.boardState);
        }

    }

    constructChessedEvent(e) {

        const mouseLocation = this.getMouseLocationInCanvas(e);
        const square = this._getSquare(mouseLocation);

        const chessedEvent = {
            draggingPiece: this.draggingPiece ? true : false,
            currentMouseLocation: mouseLocation,
            currentSquare: square,
            startMouseLocation: this.startMouseLocation,
            startSquare: this.startSquare,
            selectedPiece: this.selectedPiece
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

        this.animator.render();
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

                this.startSquare = null;
                this.selectedPieceSprite = null;
                this.selectedPiece = null;
                this.draggingPiece = false;

            } else if (this.config.onLeftClickRelease) {
                const legalMove = this.config.onLeftClickRelease(this.constructChessedEvent(e));
                if (legalMove && legalMove !== 'promoting') {
                    if (legalMove.san === 'O-O' ||
                        legalMove.san === 'O-O+' ||
                        legalMove.san === 'O-O-O' ||
                        legalMove.san === 'O-O-O+') { // castling
                        // Need to move the rook.
                        if (legalMove.to === 'g1') {
                            this.removePiece('h1', false);
                            this.putPieceOnBoard('r', 'w', 'f1', false);
                        } else if (legalMove.to === 'c1') {
                            this.removePiece('a1', false);
                            this.putPieceOnBoard('r', 'w', 'd1', false);
                        } else if (legalMove.to === 'g8') {
                            this.removePiece('h8', false);
                            this.putPieceOnBoard('r', 'b', 'f8', false);
                        } else if (legalMove.to === 'c8') {
                            this.removePiece('a8', false);
                            this.putPieceOnBoard('r', 'b', 'd8', false);
                        }
                    } else if (legalMove.enPassant) {
                        if (legalMove.to[1] === '6') {
                            this.removePiece(legalMove.to[0] + '5', false);
                        } else if (legalMove.to[1] === '3') {
                            this.removePiece(legalMove.to[0] + '4', false);
                        }
                    }

                    this.placePiece(e);
                } else if (legalMove !== 'promoting') {
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

        this.animator.render();
    }

    handleMouseMove(e) {
        if (this.promptingForPromotion) {
            this.removeAnimationsByType(HIGHLIGHT_CHOICE);

            const mouseLocation = this.getMouseLocationInCanvas(e);
            const square = this._getSquare(mouseLocation);

            if (this.choiceSquares.includes(square.name)) {
                this.removeAnimationsByType(PROMOTION_CHOICES);
                const drawHighlightedPiece = (animationLayer) => {
                    const ctx = animationLayer.getContext('2d');
                    ctx.beginPath();
                    ctx.arc(square.center.x, square.center.y, this.squareWidth / 2, 0, 2 * Math.PI, false);
                    ctx.fillStyle = '#98ee99';
                    ctx.fill();
                };

                this.animateAbove(drawHighlightedPiece, HIGHLIGHT_CHOICE);
                this.animateAbove(this.drawChoices, PROMOTION_CHOICES);
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

    handleMouseOut(e) {
        if (!this.promptingForPromotion) {
            this.putPieceBack(e);
            this.rightClicking = false;
            if (this.config.onMouseOut) {
                this.config.onMouseOut();
            }
        }

        this.animator.render();
    }


    pickupPiece(e) {
        if (this.config.movementEnabled) {
            const mouseLocation = this.getMouseLocationInCanvas(e);
            this.startSquare = this._getSquare(mouseLocation);
            if (this.boardState[this.startSquare.stateRow][this.startSquare.stateColumn]) {
                this.selectedPiece = this.boardState[this.startSquare.stateRow][this.startSquare.stateColumn];
                this.selectedPieceSprite = this.sprite(this.selectedPiece);
                this.boardState[this.startSquare.stateRow][this.startSquare.stateColumn] = null;

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
                    this._movePiece(endSquare);
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
            this.boardState[this.startSquare.stateRow][this.startSquare.stateColumn] = this.selectedPiece;

            this.startSquare = null;
            this.selectedPieceSprite = null;
            this.selectedPiece = null;
            this.draggingPiece = false;
            this.draw();
        }
    }

    _setCanvasSizes() {

        const styleWidth = this.eventCaptureLayer.parentElement.clientWidth;
        const styleHeight = this.eventCaptureLayer.parentElement.clientHeight;

        const boardSize = styleWidth > styleHeight ? styleHeight : styleWidth;

        this.eventCaptureLayer.style.width = boardSize;
        this.eventCaptureLayer.style.height = boardSize;

        this.width = DPI * boardSize;
        this.height = this.width;
        this.pixels = boardSize;

        this.squareWidth = this.width / 8;

        this.chessBoardLayer.width = this.width;
        this.chessBoardLayer.height = this.height;
        this.chessBoardLayer.style.width = boardSize;
        this.chessBoardLayer.style.height = boardSize;

        this.bottomAnimationLayer.width = this.width;
        this.bottomAnimationLayer.height = this.height;
        this.bottomAnimationLayer.style.width = boardSize;
        this.bottomAnimationLayer.style.height = boardSize;

        this.bottomPersistentLayer.width = this.width;
        this.bottomPersistentLayer.height = this.height;
        this.bottomPersistentLayer.style.width = boardSize;
        this.bottomPersistentLayer.style.height = boardSize;

        this.pieceLayer.width = this.width;
        this.pieceLayer.height = this.height;
        this.pieceLayer.style.width = boardSize;
        this.pieceLayer.style.height = boardSize;

        this.topPersistentLayer.width = this.width;
        this.topPersistentLayer.height = this.height;
        this.topPersistentLayer.style.width = boardSize;
        this.topPersistentLayer.style.height = boardSize;

        this.topAnimationLayer.width = this.width;
        this.topAnimationLayer.height = this.height;
        this.topAnimationLayer.style.width = boardSize;
        this.topAnimationLayer.style.height = boardSize;
    }

    _resize() {
        this.promptingForPromotion = false;
        if (this.pieceCtx)
            this.pieceCtx.clearRect(0, 0, this.width, this.height);
        if (this.boardCtx)
            this.boardCtx.clearRect(0, 0, this.width, this.height);

        this.animator.clearBottomAnimations();
        this.animator.clearPersistedBottomAnimations();
        this.animator.clearTopAnimations();
        this.animator.clearPersistedTopAnimations();

        this._setCanvasSizes();

        this.draw();

        if (this.config.onResize) {
            this.config.onResize(this.getBoardDimensions());
        }
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

    clearAllAnimations() {
        this.animator.clearAllAnimations();
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
    removePiece(from, boardChange = true) {
        const fromSquare = algebraicToRowCol(from, this.config.orientation);
        const mappedFrom = viewRowColToBoardRowCol(fromSquare, this.config.orientation);

        this.boardState[mappedFrom.row][mappedFrom.column] = null;

        this.draw();

        if (this.config.onBoardChange && boardChange) {
            this.config.onBoardChange(this.boardState);
        }
    }

    movePiece(from, to, boardChange = true) {
        const start = algebraicToRowCol(from, this.config.orientation);
        const finish = algebraicToRowCol(to, this.config.orientation);

        const mappedStart = viewRowColToBoardRowCol(start, this.config.orientation);
        const mappedFinish = viewRowColToBoardRowCol(finish, this.config.orientation);

        this.boardState[mappedFinish.row][mappedFinish.column] = this.boardState[mappedStart.row][mappedStart.column];
        this.boardState[mappedStart.row][mappedStart.column] = null;

        this.draw();

        if (this.config.onBoardChange && boardChange) {
            this.config.onBoardChange(this.boardState);
        }
    }

    undo(move) {
        if (move) {
            this.movePiece(move.to, move.from, true);

            if (move.san === 'O-O' ||
                move.san === 'O-O+' ||
                move.san === 'O-O-O' ||
                move.san === 'O-O-O+') { // castling
                // Need to move the rook.
                if (move.to === 'g1') {
                    this.removePiece('f1', false);
                    this.putPieceOnBoard('r', 'w', 'h1', false);
                } else if (move.to === 'c1') {
                    this.removePiece('d1', false);
                    this.putPieceOnBoard('r', 'w', 'a1', false);
                } else if (move.to === 'g8') {
                    this.removePiece('f8', false);
                    this.putPieceOnBoard('r', 'b', 'h8', false);
                } else if (move.to === 'c8') {
                    this.removePiece('d8', false);
                    this.putPieceOnBoard('r', 'b', 'a8', false);
                }
            } else if (move.flags.indexOf('e') !== -1) {
                if (move.to[1] === '6') {
                    this.putPieceOnBoard(move.captured, 'b', move.to[0] + '5', false);
                } else if (move.to[1] === '3') {
                    this.putPieceOnBoard(move.captured, 'w', move.to[0] + '4', false);
                }
            } else if (move.captured) {
                const capturedColor = move.color === 'w' ? 'b' : 'w';
                this.putPieceOnBoard(move.captured, capturedColor, move.to, false);
            }
        }

    }

    makeMove(legalMove) {
        this.movePiece(legalMove.from, legalMove.to, true);
        if (legalMove.san === 'O-O' ||
            legalMove.san === 'O-O+' ||
            legalMove.san === 'O-O-O' ||
            legalMove.san === 'O-O-O+') { // castling
            // Need to move the rook.
            if (legalMove.to === 'g1') {
                this.removePiece('h1', false);
                this.putPieceOnBoard('r', 'w', 'f1', false);
            } else if (legalMove.to === 'c1') {
                this.removePiece('a1', false);
                this.putPieceOnBoard('r', 'w', 'd1', false);
            } else if (legalMove.to === 'g8') {
                this.removePiece('h8', false);
                this.putPieceOnBoard('r', 'b', 'f8', false);
            } else if (legalMove.to === 'c8') {
                this.removePiece('a8', false);
                this.putPieceOnBoard('r', 'b', 'd8', false);
            }
        } else if (legalMove.enPassant || legalMove.flags.indexOf('e') > -1) {
            if (legalMove.to[1] === '6') {
                this.removePiece(legalMove.to[0] + '5', false);
            } else if (legalMove.to[1] === '3') {
                this.removePiece(legalMove.to[0] + '4', false);
            }
        }
    }

    flip() {
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
            squareSize: this.squareWidth,
            pixels: this.pixels
        };
    }

    putPieceOnBoard(type, color, square, boardChange = true) {
        const piece = { type, color };
        const squareLocation = algebraicToRowCol(square, this.config.orientation);
        const mappedLocation = viewRowColToBoardRowCol(squareLocation, this.config.orientation);
        this.boardState[mappedLocation.row][mappedLocation.column] = piece;

        this.draw();

        if (this.config.onBoardChange && boardChange) {
            this.config.onBoardChange(this.boardState);
        }
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

        this.pieceChoices = color === 'w' ? [
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
            const direction = (color === 'w' && this.config.orientation === 0) ||
                (color === 'b' && this.config.orientation === 1) ? 1 : -1;

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

        const persistentCtx = this.topPersistentLayer.getContext('2d');
        persistentCtx.clearRect(0, 0, this.topPersistentLayer.width, this.topPersistentLayer.height);

        this.persistedTopAnimations.forEach(a => {
            a.draw(this.topPersistentLayer);
        });

        this.clearTopAnimations();
    }

    persistBottomAnimations() {
        this.bottomAnimations.forEach(a => {
            this.persistedBottomAnimations.push(a);
        });

        const persistentCtx = this.bottomPersistentLayer.getContext('2d');
        persistentCtx.clearRect(0, 0, this.bottomPersistentLayer.width, this.bottomPersistentLayer.height);

        this.persistedBottomAnimations.forEach(a => {
            a.draw(this.bottomPersistentLayer);
        });

        this.clearBottomAnimations();
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

    clearAllAnimations() {
        this.clearBottomAnimations();
        this.clearPersistedBottomAnimations();
        this.clearTopAnimations();
        this.clearPersistedTopAnimations();
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