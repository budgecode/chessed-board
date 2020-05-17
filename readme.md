
# ChessedBoard

  

A simple, canvas-based, implementation of a chess board.

  

  

## Design

  

The chess board component is built using 6 canvas elements stacked on top of one another organized in the following manner.

  

  

1. Chess board Layer (bottom)

  

* The layer on which the squares and coordinates are drawn.

  

2. Bottom Persistent Animation Layer

  

* The layer on which persisted animations are to be drawn. These animations are above the board but below the pieces.

  

3. Bottom Animation Layer

  

* A layer for drawing animations below the pieces. Usually during user interaction. These animations will typically be cleared on each new user interaction. If the animation should persist between many user interactions, it should be saved to the persistent animation layer.

  

4. Piece Layer

  

* The layer on which the pieces are drawn.

  

5. Top Persistent Animation Layer

  

* The layer on which persisted animations are to be drawn. These animations are above the board and above the pieces.

  

6. Top Animation Layer (top)

  

* A layer for drawing animations above the pieces. Usually during user interaction. These animations will typically be cleared on each new user interaction. If the animation should persist between many user interactions, it should be saved to the persistent animation layer.

  

  

## API

  

  

### Simple Usage

  

```html

<script  src="../src/index.js">  </script>

  

<div  id="chessboard"></div>

  

<script>

const  config = {
    orientation:  1
};

const  chessboard = new  ChessedBoard('chessboard', config);

</script>

```

  

### Config

  

| **Property** | **Description** |
|--|--|
| state | The state of the chess board in [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) notation. |
| orientation | 0 for normal orientation. 1 for black view. |
| coordinates | Determines if coordinates are displayed. Default: false |
| movementEnabled | Enables moving the chess pieces. Default: true |
| modulePath | Relative location of the chessed-board module to your project. |
| onLeftClick | Event handler which is triggered when the user left clicks on the chess board.|
| onLeftClickDrag | Event handler which is triggered when the user moves the mouse around the chess board while left clicking.|
| onLeftClickRelease | Event handler which is triggered when the user stops left clicking.|
| onRightClick | Event handler which is triggered when the user right clicks on the chess board.|
| onRightClickDrag | Event handler which is triggered when the user moves the mouse around the chess board while right clicking.|
| onRightClickRelease | Event handler which is triggered when the user stops right clicking.|
| onMouseOut | Event handler which is triggered when the user moves their mouse off of the chess board.|
| onLoad | Event handler which is triggered when the chess board is loaded and ready for use.|
| onCancel | Event handler which is triggered when moving a piece is canceled. In other words, this is invoked when the piece is put back mid move.|

### Methods

  

| **Signature** | **Description** |
|--|--|
| ChessedBoard(div, config, root) | The constructor. |
| movePiece(from, to) | Moves a piece from one square on the board to another.|
| putPieceOnBoard(type, color, square) | Places a given piece on a given square on the board.|
| flip() | Flips the orientation of the board. |
| toggleCoordinates() | Show or hide coordinates. |
| getSquare(square): [Square](#Square) | Get information about the location of the square on the chess board. |
| getBoardDimensions(): [BoardDimensions](#BoardDimensions) | Return an object containing the dimensions of the chess board. |
| displayPromotionOptions(square, color, callback) | Prompts the user for for promotion. |
| animate(animation) | Takes a function which renders graphics on the chess board. |
|persistBottomAnimations() | Persists any animations currently drawn on the bottom animation layer. |
|persistTopAnimations() | Persists any animations currently drawn on the top animation layer.|
|clearBottomAnimations() | Clears any animations currently persisted on on the bottom animation layer.|
|clearTopAnimations() | Clears any animations currently persisted on the top animation layer.|

  

### Custom Types

#### ChessedEvent

| **Property** | **Description** |

|--|--|

|currentMouseLocation|Location of the cursor in the canvas given as x,y coordinates. If not dragging then the currentMouseLocation === startMouseLocation.|

|currentSquare|The current [square](#Square) that the cursor is over. If not dragging then the currentSquare === startSquare.|

|startMouseLocation| The location that the dragging started given as x,y coordinates. If not dragging then startMouseLocation === currentMouseLocation.|

|startSquare| The [square](#Square) the dragging started in. If not dragging then the startSquare === currentSquare.|


#### Square

```javascript

{

"name":'c6', // The name of the corresponding square.

"row":3, // Row in the 8 by 8 grid where the square is located.

"column":3, // Column in the 8 by 8 grid where the square is located.

"origin": { // The coordinates of the top left corner of the square in the canvas.

"x":210,

"y":210

},

"center": { // The coordinates of the center of the square in the canvas.

"x":245,

"y":245

}

}

```

  

#### BoardDimensions

```javascript

{

"size":720, // Size in pixels of the board.,

"squareSize":90, // Size in pixels of a square on the boared (size/8).

}

```