const ROWS = 20;
const COLS = 10;

let board = [];

const menu = document.querySelector("main");
const game = document.getElementById("game");
const boardElement = document.getElementById("game-board");
const levelElement = document.getElementById("current-level");

document.querySelectorAll(".level-button").forEach((button) => {
  button.addEventListener("click", () => {
    startGame(Number(button.dataset.level));
  });
});

document.getElementById("return-button").addEventListener("click", () => {
  game.hidden = true;
  menu.hidden = false;
});
function createBoard(){
  for (let row = 0; row < ROWS; row++) {
    const currentRow = [];
    for(let col = 0; col < COLS; col++) {
      currentRow.push(0);
    }
    board.push(currentRow);
  }
  return board;
}

function renderBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    for(let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (board[row][col] !== 0) {
        cell.classList.add("filled");
      }
      boardElement.appendChild(cell);
    }
  }
}
function startGame(level) {
  board = createBoard();
  levelElement.textContent = `Level ${level}`;
  menu.hidden = true;
  game.hidden = false;
  renderBoard();
}