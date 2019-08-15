# Chessedboard

A simple, canvas-based, implementation of a chessboard.

## Design

## API

### Simple Usage


### Config


### Methods

| **Signature** | **Arguments** | **Description** | **Example** |
|--|--|--|--|
| Chessedboard(divId, config) | **divId**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The ID of the div in which to render the chessboard.<br>**config**: [Config](#Config)<br>Object used to configure the chessboard.| The constructor. |
| movePiece(from, to)| **from**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The square on which the piece is currently located. _Example_: "c2"<br>**to**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The square on which the piece should be placed. _Example_: "c4"| Moves a piece from one square on the board to another.||
| animate(animation) | **animation**: [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>The animation to be rendered.| Takes a function which renders graphics on the chessboard. |
