const ROWS = 20;
const COLS = 10;

let board = [];
// Quy định hình dạng cho các khối Tetris
const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]]
];
// Quy định màu sắc cho các khối Tetris
const COLORS = [
    "cyan",
    "yellow",
    "purple",
    "green",
    "red",
    "blue",
    "orange"
]
let currentShape = null;
let timer = null;
let isPlaying = false;
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
  isPlaying = false;
  stopAutoDrop();
  currentShape = null;
  game.hidden = true;
  menu.hidden = false;
});
// Tạo bảng trò chơi
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

// Vẽ bảng trò chơi
function renderBoard() {
  boardElement.replaceChildren();

  boardElement.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    for(let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      boardElement.appendChild(cell);
      const idColor = board[row][col];
      paintShapeOnBoard(row, col, idColor);
    }
  }
  paintShape();
}

// Bắt đầu trò chơi
function startGame(level) {
  stopAutoDrop();
  board = createBoard();

  currentShape = getRandomShape();
  isPlaying = true;

  levelElement.textContent = `Level ${level}`;
  boardElement.style.gridTemplateColumns =`repeat(${COLS}, 1fr)`;
  menu.hidden = true;
  game.hidden = false;
  renderBoard();

  startAutoDrop();
}
// Tạo một bản sao của hình dạng
function copyShape(shape) {
  const newShape = [];

  for (let row = 0; row < shape.length; row++) {
    const newRow = [];
    for (let col = 0; col < shape[row].length; col++) {
      const value = shape[row][col];
      newRow.push(value);
    }
    newShape.push(newRow);
  }
  return newShape;
}
function getRandomShape() {
  const numberOfShapes = SHAPES.length;
  const randomValue = Math.random();
  const randomIndex = Math.floor(randomValue * numberOfShapes);

  const shape = copyShape(SHAPES[randomIndex]);

  const idColor = randomIndex + 1;
  const pieceWidth = shape[0].length;
  const emptyCols = COLS - pieceWidth;
  const startCol = Math.floor(emptyCols / 2);

  const startRow = 0;

  return { shape, idColor, startCol, startRow };
}

function paintShapeOnBoard(row, col, idColor) {
  if(row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    return;
  }

  const indexCell = row * COLS + col;

  const cell = boardElement.children[indexCell];
  if(!cell) {
    return;
  }

  cell.style.backgroundColor = COLORS[idColor - 1];

  if (idColor === 0) {
    cell.classList.remove("filled");
  }else {
    cell.classList.add("filled");
  }
}

function paintShape() {
  if(currentShape === null) {
    return;
  }

  const shape = currentShape.shape;
  const idColor = currentShape.idColor;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) {
        continue;
      }
      const boardRow = currentShape.startRow + row;
      const boardCol = currentShape.startCol + col;
      paintShapeOnBoard(boardRow, boardCol, idColor);
      }
    }
}

// hàm kiểm tra xem hình dạng có thể di chuyển xuống không
function canMoveTo() {
  if(currentShape === null) {
    return false;
  }

  const shape = currentShape.shape;
  const nextRow = currentShape.startRow + 1;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) {
        continue;
      }
      const boardRow = nextRow + row;
      const boardCol = currentShape.startCol + col;

      if (boardRow < 0 || boardRow >= ROWS || boardCol < 0 || boardCol >= COLS) {
        return false;
      }
      if (board[boardRow][boardCol] !== 0) {
        return false;
      }
    }
  }
  return true;
}
function lockShape() {
  if(currentShape === null) {
    return;
  }
  const shape = currentShape.shape;
  const idColor = currentShape.idColor;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) {
        continue;
      }
      const boardRow = currentShape.startRow + row;
      const boardCol = currentShape.startCol + col;

      board[boardRow][boardCol] = idColor;
    }
  }
}
function stopAutoDrop() {
  if(timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}
function moveDown() {
  if(!isPlaying  || currentShape === null) {
    return;
  }

  const nextRow = currentShape.startRow + 1;
  const nextCol = currentShape.startCol;

  const canMove = canMoveTo();

  if(canMove) {
    currentShape.startRow = nextRow;
  }else {
    lockShape();
    currentShape = getRandomShape();

    if(!canMoveTo()) {
      isPlaying = false;
      stopAutoDrop();

      currentShape = null;
      title.textContent = "Game Over";
    }
  }
  renderBoard();
}

function startAutoDrop() {
  if(timer !== null) {
    return;
  }
  stopAutoDrop();
  timer = setInterval(() => {
    moveDown();
  }, 600);
}