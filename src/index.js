class Chessboard extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `<canvas id="chessboard" width="480" height="480">
                          </canvas>`;
        this.draw();
    }

    disconnectedCallback() {}

    attributeChangedCallback(name, previousValue, newValue) {}

    adoptedCallback() {}

    draw() {
        const board = document.getElementById('chessboard');

        const boardCtx = board.getContext('2d');

        const width = 480/8;

        const blackColor = "#5D4037";
        const whiteColor = "#E8E2C9";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (r % 2 !== c % 2) {
                    boardCtx.beginPath();
                    boardCtx.rect(c*width, r*width, width, width);
                    boardCtx.fillStyle = blackColor;
                    boardCtx.fill()
                } else {
                    boardCtx.beginPath();
                    boardCtx.rect(c*width, r*width, width, width);
                    boardCtx.fillStyle = whiteColor;
                    boardCtx.fill()
                }
            }
        }
    }
}

window.customElements.define('chess-board', Chessboard);
