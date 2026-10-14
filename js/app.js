const ROWS = 20;
const COLS = 10;

let board = [];
// Quy định hình dạng cho các khối Tetris
const SHAPES = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
];
// Quy định màu sắc cho các khối Tetris
const COLORS = ["cyan", "yellow", "purple", "green", "red", "blue", "orange"];
let currentShape = null;
let nextBlock = null;
let timer = null;
let isPlaying = false;
const menu = document.querySelector("main");
const game = document.getElementById("game");
const boardElement = document.getElementById("game-board");
const levelElement = document.getElementById("current-level");

let currentLevel = 1;
let targetLines = 7;
let totalClearLines = 0;
const goalText = document.getElementById("goal-text");
const progressText = document.getElementById("goal-progress");
const nextShape = document.getElementById("next-shape");

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
document.addEventListener("keydown", (event) => {
    if (!isPlaying || currentShape === null) {
      return;
    }
    const isKey = 
      event.code === "ArrowDown" ||
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight" ||
      event.code === "ArrowUp" ||
      event.code === "Space";
    if (!isKey) {
      return;
    }
    event.preventDefault();
    if(event.repeat && (event.code === "ArrowUp" || event.code === "Space")) {
      return;
    }
    switch (event.code) {
      case "ArrowLeft":
        moveLeftOrRight(-1);
        break;
      case "ArrowRight":
        moveLeftOrRight(1);
        break;
      case "ArrowDown":
        moveDown();
        break;
      case "ArrowUp":
        rotateCurrentShape();
        break;
      case "Space":
        hardDrop();
        break;
    }
  });
// Tạo bảng trò chơi
function createBoard() {
  const newBoard = [];
  for (let row = 0; row < ROWS; row++) {
    const currentRow = [];
    for (let col = 0; col < COLS; col++) {
      currentRow.push(0);
    }
    newBoard.push(currentRow);
  }
  return newBoard;
}

// Vẽ bảng trò chơi
function renderBoard() {
  boardElement.replaceChildren();

  boardElement.innerHTML = "";
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
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
  currentLevel = level;
  targetLines = 7;
  totalClearLines = 0;
  board = createBoard();

  currentShape = getRandomShape();
  nextBlock = getRandomShape();
  isPlaying = true;

  levelElement.textContent = `Level ${level}`;
  boardElement.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  menu.hidden = true;
  game.hidden = false;
  updateGoalDisply();
  renderNextShape();
  renderBoard();

  startAutoDrop();
}
function endGame(isWin){
  isPlaying = false;
  stopAutoDrop();

  currentShape= null;
  nextBlock= null;

  if(isWin){
    levelElement.textContent = "CHIẾN THẮNG!";
  }else{
    levelElement.textContent ="GAME OVER";
  }
  renderNextShape();
  renderBoard();
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
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    return;
  }

  const indexCell = row * COLS + col;

  const cell = boardElement.children[indexCell];
  if (!cell) {
    return;
  }

  cell.style.backgroundColor = COLORS[idColor - 1];

  if (idColor === 0) {
    cell.classList.remove("filled");
  } else {
    cell.classList.add("filled");
  }
}

function paintShape() {
  if (currentShape === null) {
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

// hàm kiểm tra xem hình dạng có thể di chuyển xuống không và có chạm 2 biên
function canMoveTo(nextRow, nextCol, shape) {
  if (currentShape === null) {
    return false;
  }

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 0) {
        continue;
      }
      const boardRow = nextRow + row;
      const boardCol = nextCol + col;

      if (
        boardRow < 0 ||
        boardRow >= ROWS ||
        boardCol < 0 ||
        boardCol >= COLS
      ) {
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
  if (currentShape === null) {
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
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}
function moveDown() {
  if (!isPlaying || currentShape === null) {
    return;
  }

  const nextRow = currentShape.startRow + 1;
  const nextCol = currentShape.startCol;

  const canMove = canMoveTo(nextRow, nextCol, currentShape.shape);

  if (canMove) {
    currentShape.startRow = nextRow;
  } else {
    finishShape();
  }
  renderBoard();
}
function finishShape() {
  lockShape();
  const rowsCleared = clearFullRows();
  totalClearLines += rowsCleared;

  updateGoalDisply();

  if(totalClearLines >= targetLines){
    endGame(true);
    return;
  }
  currentShape = nextBlock;

  if (!canMoveTo(currentShape.startRow, currentShape.startCol, currentShape.shape)) {
    endGame(false);
    return;
  }
  nextBlock = getRandomShape();
  renderNextShape();
}
function startAutoDrop() {
  if (timer !== null) {
    return;
  }
  stopAutoDrop();
  timer = setInterval(() => {
    moveDown();
  }, 400);
}
function moveLeftOrRight(direction) {
  if (!isPlaying || currentShape === null) {
    return;
  }
  
  const nextRow = currentShape.startRow;
  const nextCol = currentShape.startCol + direction;

  const canMove = canMoveTo(nextRow, nextCol, currentShape.shape);
  if (canMove) {
    currentShape.startCol = nextCol;
    renderBoard();
  }
}
function rotateShape(shape) {
  const rotatedShape = [];
  const rows = shape.length;
  const cols = shape[0].length;

  for(let row = 0; row < cols; row++) {
    const newRow = [];
    for(let col = 0; col < rows; col++) {
      const newRows = rows - 1 - col;
      const newCol = row;
      const value = shape[newRows ][newCol];
      newRow.push(value);
    }
    rotatedShape.push(newRow);
  }
  return rotatedShape;
}
function rotateCurrentShape() {
  if (!isPlaying || currentShape === null) {
    return;
  }

  const rotatedShape = rotateShape(currentShape.shape);
  const nextRow = currentShape.startRow;
  const nextCol = currentShape.startCol;
  
  const canRotate = canMoveTo(nextRow, nextCol, rotatedShape);
  if (canRotate) {
    currentShape.shape = rotatedShape;
    renderBoard();
  }
}
function hardDrop() {
  if (!isPlaying || currentShape === null) {
    return;
  }
  while(canMoveTo(currentShape.startRow + 1, currentShape.startCol, currentShape.shape)) {
    currentShape.startRow++;
  }
  finishShape();
  renderBoard();
}
function clearFullRows() {
  let rowsCleared = 0;
  let row = ROWS - 1;
  while(row >= 0){
    let isFull = true;

    for(let col = 0; col < COLS; col++) {
      if(board[row][col] === 0) {
        isFull = false;
        break;
      }
    }
    if(isFull) {
      for(let r = row; r > 0; r--) {
        for(let col = 0; col < COLS; col++) {
          board[r][col] = board[r - 1][col];
        }
      }
      for(let col = 0; col < COLS; col++) {
        board[0][col] = 0;
      }
      rowsCleared++;
    }else {
      row--;
    }
  }
  return rowsCleared;
}
function updateGoalDisply(){
  goalText.textContent = `Xóa ${targetLines} hàng để thắng`;

  progressText.textContent = `${totalClearLines} / ${targetLines} hàng`;
}
// Tạo khối rơi tiếp theo
function renderNextShape(){
  nextShape.replaceChildren();

  if(nextBlock === null ) return;

  const shape = nextBlock.shape;
  const color = COLORS[nextBlock.idColor - 1];
  const columns = shape[0].length;

  nextShape.style.gridTemplateColumns = `repeat(${columns}, 30px)`;
  for(let row = 0; row < shape.length; row++){
    for(let col = 0; col < shape[row].length; col++){
      const cell = document.createElement("div");
      cell.className = "preview-cell";

      if(shape[row][col] !== 0){
        cell.style.backgroundColor = color;
        cell.classList.add("filled");
      }
      nextShape.appendChild(cell);
    }
  }
}