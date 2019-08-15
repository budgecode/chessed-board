# Chessedboard

A simple, canvas-based, implementation of a chessboard.

## API

### Simple Usage


### Config
```JSON
{
	"state": `String`,
	"onLeftClick": `Function`,
	"onLeftClickDrag": `Function`,
	"onLeftClickRelease": `Function`,
	"onRightClick": `Function`,
	"onRightClickDrag": `Function`,
	"onRightClickRelease": `Function`,
	"onMouseOut": `Function`
}
```

### Methods

| **Signature** | **Arguments** | **Description** | **Example** |
|--|--|--|--|
| Chessedboard(divId, config) | **divId**: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)<br>The ID of the div in which to render the chessboard.<br>**config**: [Config](#Config)<br>Object used to configure the chessboard.| The constructor. |
| animate(animation) | **animation**: [Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions)<br>The animation to be rendered.| Takes a function which renders graphics on the chessboard. |
