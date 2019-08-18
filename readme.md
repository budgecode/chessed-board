# Chessedboard
A simple, canvas-based, implementation of a chessboard.

## Design
The chessboard component is built using 6 canvas elements stacked on top of one another organized in the following manner.

1. Chessboard Layer (bottom)
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

### Config
| **Property** | **Type**  | **Description** |
|--|--|--|
| state |||
| onLeftClick |||
| onLeftClickDrag |||
| onLeftClickRelease |||
| onRightClick |||
| onRightClickDrag |||
| onRightClickRelease |||
| onMouseOut |||

### Methods

| **Signature** | **Arguments** | **Description** | **Example** |
|--|--|--|--|
| Chessedboard(div, config) | **div**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The ID of the div in which to render the chessboard.<br>**config**: [Config](#Config)<br>Object used to configure the chessboard.| The constructor. |
| movePiece(from, to)| **from**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The square on which the piece is currently located. _Example_: "c2"<br>**to**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The square on which the piece should be placed. _Example_: "c4"| Moves a piece from one square on the board to another.||
| animate(animation) | **animation**: [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>The animation to be rendered. _Example_:<br> `(bottomCanvas, topCanvas) => { // Draw something on either canvas }`| Takes a function which renders graphics on the chessboard. |
|persistBottomAnimations()| **None** | Persists any animations currently drawn on the bottom animation layer. ||
|persistTopAnimations()| **None** | Persists any animations currently drawn on the top animation layer.||
|clearBottomAnimations()| **None** | Clears any animations currently persisted on on the bottom animation layer.||
|clearTopAnimations()| **None** | Clears any animations currently persisted on the top animation layer.||
