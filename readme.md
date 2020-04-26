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
<script src="../src/index.js"> </script>

<div id="chessboard"></div>

<script>
    const chessboard = new ChessedBoard("chessboard", null);
</script>
```
  

### Config

| **Property** | **Type** | **Description** |
|--|--|--|
| state | [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The state of the chess board in [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) notation. |
| squareWidth | [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The width in pixels of a single square on the board. |
| orientation | [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | 0 for normal orientation. 1 for black view. |
| modulePath | [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | Relative location of the chessed-board module to your project. |
| onLeftClick | [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Arguments: [ChessedEvent](#ChessedEvent)<br>Return Type: Void |Event handler which is triggered when the user left clicks on the chess board.|
| onLeftClickDrag | [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Arguments: [ChessedEvent](#ChessedEvent)<br>Return Type: Void|Event handler which is triggered when the user moves the mouse around the chess board while left clicking.|
| onLeftClickRelease |[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Arguments: [ChessedEvent](#ChessedEvent)<br>Return Type: Boolean|Event handler which is triggered when the user stops left clicking.|
| onRightClick |[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Arguments: [ChessedEvent](#ChessedEvent)<br>Return Type: Void|Event handler which is triggered when the user right clicks on the chess board.|
| onRightClickDrag |[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Arguments: [ChessedEvent](#ChessedEvent)<br>Return Type: Void|Event handler which is triggered when the user moves the mouse around the chess board while right clicking.|
| onRightClickRelease |[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Arguments: [ChessedEvent](#ChessedEvent)<br>Return Type: Void|Event handler which is triggered when the user stops right clicking.|
| onMouseOut |[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Arguments: [ChessedEvent](#ChessedEvent)<br>Return Type: Void|Event handler which is triggered when the user moves their mouse off of the chess board.|
| onLoad |[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Return Type: Void|Event handler which is triggered when the chess board is loaded and ready for use.|
| onCancel |[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>Return Type: Void|Event handler which is triggered when moving a piece is canceled. In other words, this is invoked when the piece is put back mid move.|

#### ChessedEvent
| **Property** | **Description** |
|--|--|
|currentMouseLocation|Location of the cursor in the canvas given as x,y coordinates. If not dragging then the currentMouseLocation === startMouseLocation.|
|currentSquare|The current [square](#Square) that the cursor is over. If not dragging then the currentSquare === startSquare.|
|startMouseLocation| The location that the dragging started given as x,y coordinates. If not dragging then startMouseLocation === currentMouseLocation.|
|startSquare| The [square](#Square) the dragging started in. If not dragging then the startSquare === currentSquare.|

### Methods

| **Signature** | **Arguments** | **Description** |
|--|--|--|
| ChessedBoard(div, config) | **div**: [String|HTMLElement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String|https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)<br>The ID of the div in which to render the chess board.<br>**config**: [Config](#Config)<br>Object used to configure the chess board.| The constructor. |
| movePiece(from, to)| **from**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The square on which the piece is currently located. _Example_: "c2"<br>**to**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The square on which the piece should be placed. _Example_: "c4"| Moves a piece from one square on the board to another.|
| putPieceOnBoard(type, color, square)| **type**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The type of the piece to place. _Example_: "q"<br> **color**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The color of the piece to place. _Example_: "w"<br>**square**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The square on which the piece should be placed. _Example_: "c4"| Places a given piece on a given square on the board.|
| flip() | **None** | Flips the orientation of the board. |
| toggleCoordinates() | **None** | Show or hide coordinates. |
| getSquare(square): [Square](#Square) | **square**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | Get information about the location of the square on the chess board. |
| getBoardDimensions(): [BoardDimensions](#BoardDimensions) | **None** | Return an object containing the dimensions of the chess board. |
| animate(animation) | **animation**: [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>The animation to be rendered. _Example_:<br>  `(bottomCanvas, topCanvas) => { // Draw something on either canvas }`| Takes a function which renders graphics on the chess board. |
|persistBottomAnimations()| **None** | Persists any animations currently drawn on the bottom animation layer. |
|persistTopAnimations()| **None** | Persists any animations currently drawn on the top animation layer.|
|clearBottomAnimations()| **None** | Clears any animations currently persisted on on the bottom animation layer.|
|clearTopAnimations()| **None** | Clears any animations currently persisted on the top animation layer.|

### Custom Types

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