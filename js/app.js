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
let totalClearLines = 0;
const goalText = document.getElementById("goal-text");
const progressText = document.getElementById("goal-progress");
const nextShape = document.getElementById("next-shape");

const LINE_SCORES = [0, 100, 300, 500, 800];
const LEVEL_CONFIGS = {
  1: {
    targetLines: 7,
    targetScore: 1000,
    timeLimit: null,
    dropDelay: 400,
    timeBonus: false,
  },
  2: {
    targetLines: 0,
    targetScore: 1000,
    timeLimit: 90,
    dropDelay: 400,
    movingObstacle: true,
    timeBonus: true,
  },
};
function getLevelConfig() {
  return LEVEL_CONFIGS[currentLevel];
}
const timeRow = document.getElementById("time-row");
const score = document.getElementById("score");
const time = document.getElementById("time");

const TARGET_SCORE = 1000;
let scoreAt = 0;
let deadline = 0;
let challengeTimer = null;

let obstacle = null;
let timeBonus = null;

let nextMoveAt = 0;
let nextAttemptAt = 0;
document.querySelectorAll(".level-button").forEach((button) => {
  button.addEventListener("click", () => {
    startGame(Number(button.dataset.level));
  });
});

document.getElementById("return-button").addEventListener("click", () => {
  isPlaying = false;
  stopAutoDrop();
  stopTimer();
  currentShape = null;
  obstacle = null;
  timeBonus = null;
  nextBlock = null;
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
  if (event.repeat && (event.code === "ArrowUp" || event.code === "Space")) {
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
  renderSpecObs();
}

// Bắt đầu trò chơi
function startGame(level) {
  const config = LEVEL_CONFIGS[level];

  stopAutoDrop();
  stopTimer();
  currentLevel = level;
  totalClearLines = 0;

  scoreAt = 0;
  obstacle = null;
  timeBonus = null;
  board = createBoard();

  currentShape = getRandomShape();
  nextBlock = getRandomShape();

  const now = performance.now();
  deadline = config.timeLimit === null ? 0 : now + config.timeLimit * 1000;

  if (config.movingObstacle) {
    obstacle = {
      row: ROWS - 9,
      col: 0,
      width: 2,
      direction: 1,
    };
  }
  nextMoveAt = now + 1000;
  nextAttemptAt = now + 10000;
  isPlaying = true;
  levelElement.textContent = `Level ${level}`;
  boardElement.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  menu.hidden = true;
  game.hidden = false;

  updateGameDisplay();
  renderNextShape();
  renderBoard();

  startAutoDrop();
  startTimer();
}
function endGame(isWin) {
  isPlaying = false;
  stopAutoDrop();
  stopTimer();

  currentShape = null;
  nextBlock = null;

  levelElement.textContent = isWin ? "CHIẾN THẮNG!" : "GAME OVER";
  updateGameDisplay()
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
      if (isObstacleCell(boardRow, boardCol)) return false;
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
  if (checkTimeExpired()) return;
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
  if (checkTimeExpired()) return;

  collectTimeBonus();
  lockShape();
  const rowsCleared = clearFullRows();
  clearScore(rowsCleared);
  updateGameDisplay();

  if (hasGoals()) {
    endGame(true);
    return;
  }

  currentShape = nextBlock;

  if (
    !canMoveTo(currentShape.startRow, currentShape.startCol, currentShape.shape)
  ) {
    endGame(false);
    return;
  }
  nextBlock = getRandomShape();
  renderNextShape();
}
function resolveAfterClear(rowsCleared) {
  if (rowsCleared === 0 || obstacle === null) return;

  timeBonus = null;

  for (let col = 0; col <= COLS - obstacle.width; col++) {
    let isEmpty = true;

    for (let i = 0; i < obstacle.width; i++) {
      if (board[obstacle.row][col + i] !== 0) {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) {
      obstacle.col = col;
      return;
    }
    obstacle = null;
  }
}
function startAutoDrop() {
  if (timer !== null) {
    return;
  }
  stopAutoDrop();
  const config = getLevelConfig();
  timer = setInterval(function () {
    moveDown();
  }, config.dropDelay);
}
function moveLeftOrRight(direction) {
  if (!isPlaying || currentShape === null) {
    return;
  }
  if (checkTimeExpired()) return;
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

  for (let row = 0; row < cols; row++) {
    const newRow = [];
    for (let col = 0; col < rows; col++) {
      const newRows = rows - 1 - col;
      const newCol = row;
      const value = shape[newRows][newCol];
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
  if (checkTimeExpired()) return;
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
  if (checkTimeExpired()) return;

  while (
    canMoveTo(
      currentShape.startRow + 1,
      currentShape.startCol,
      currentShape.shape,
    )
  ) {
    currentShape.startRow++;
  }
  finishShape();
  renderBoard();
}
//Tính điểm
function clearScore(rowsCleared) {
  totalClearLines += rowsCleared;

  const points = LINE_SCORES[rowsCleared];

  scoreAt += points;
}
function clearFullRows() {
  let rowsCleared = 0;
  let row = ROWS - 1;
  while (row >= 0) {
    let isFull = true;

    for (let col = 0; col < COLS; col++) {
      if (board[row][col] === 0) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      for (let r = row; r > 0; r--) {
        for (let col = 0; col < COLS; col++) {
          board[r][col] = board[r - 1][col];
        }
      }
      for (let col = 0; col < COLS; col++) {
        board[0][col] = 0;
      }
      rowsCleared++;
    } else {
      row--;
    }
  }
  return rowsCleared;
}
// Kiểm tra điều kiện thắng
function hasGoals() {
  const config = getLevelConfig();
  const enoughLines = totalClearLines >= config.targetLines;
  const enoughScore = scoreAt >= config.targetScore;

  return enoughLines && enoughScore;
}
function updateGoalDisply() {
  const config = getLevelConfig();
  const goals = [];
  const progress = [];

  if (config.targetLines > 0) {
    goals.push(`Xóa ${config.targetLines} hàng`);

    progress.push(`Hàng: ${totalClearLines} / ${config.targetLines}`);
  }
  if (config.targetScore > 0) {
    goals.push(`Đạt ${config.targetScore} điểm`);

    progress.push(`Điểm: ${scoreAt} / ${config.targetScore}`);
  }
  let des = goals.join(" VÀ ");
  if (config.timeLimit !== null) des += " trước khi hết giờ";

  goalText.textContent = des;
  progressText.textContent = progress.join(" . ");
}
function updateGameDisplay() {
  const config = getLevelConfig();

  score.textContent = scoreAt;
  const hasTimeLimit = config.timeLimit !== null;
  timeRow.hidden = !hasTimeLimit;
  if (hasTimeLimit) {
    const remaining = deadline - performance.now();
    time.textContent = Math.max(0, Math.ceil(remaining / 1000));
  } else {
    time.textContent = "";
  }
  updateGoalDisply();
}
// Tạo khối rơi tiếp theo
function renderNextShape() {
  nextShape.replaceChildren();

  if (nextBlock === null) return;

  const shape = nextBlock.shape;
  const color = COLORS[nextBlock.idColor - 1];
  const columns = shape[0].length;

  nextShape.style.gridTemplateColumns = `repeat(${columns}, 30px)`;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      const cell = document.createElement("div");
      cell.className = "preview-cell";

      if (shape[row][col] !== 0) {
        cell.style.backgroundColor = color;
        cell.classList.add("filled");
      }
      nextShape.appendChild(cell);
    }
  }
}

function isCurrentShape(boardRow, boardCol) {
  if (currentShape === null) return false;

  const localRow = boardRow - currentShape.startRow;
  const localCol = boardCol - currentShape.startCol;

  const shape = currentShape.shape;

  if (localRow < 0 || localRow >= shape.length) return false;
  if (localCol < 0 || localCol >= shape[localRow].length) return false;

  return shape[localRow][localCol] !== 0;
}
function isObstacleCell(row, col) {
  if (obstacle === null) return false;

  return (
    row === obstacle.row &&
    col >= obstacle.col &&
    col < obstacle.col + obstacle.width
  );
}
function canPlaceObstacle(nextCol) {
  if (nextCol < 0 || nextCol + obstacle.width > COLS) return false;

  for (let i = 0; i < obstacle.width; i++) {
    const row = obstacle.row;
    const col = nextCol + i;

    if (board[row][col] !== 0) return false;
    if (isCurrentShape(row, col)) return false;

    if (timeBonus !== null && timeBonus.row === row && timeBonus.col === col)
      return false;
  }
  return true;
}
function moveObstacle() {
  if (obstacle === null) return false;

  let nextCol = obstacle.col + obstacle.direction;

  if (!canPlaceObstacle(nextCol)) {
    obstacle.direction = -obstacle.direction;
    nextCol = obstacle.col + obstacle.direction;
  }
  if (canPlaceObstacle(nextCol)) obstacle.col = nextCol;
}
function spawnTimeBonus(now) {
  const config = getLevelConfig();
  if (!config.timeBonus || config.timeLimit === null) return;

  if (timeBonus !== null || Math.random() >= 0.6) return;
  const available = [];

  for (let row = ROWS - 8; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== 0) continue;
      if (isObstacleCell(row, col)) continue;
      if (isCurrentShape(row, col)) continue;

      available.push({ row: row, col: col });
    }
  }
  if (available.length === 0) return;
  const index = Math.floor(Math.random() * available.length);
  const selected = available[index];

  timeBonus = {
    row: selected.row,
    col: selected.col,
    expiresAt: now + 8000,
  };
}
function collectTimeBonus() {
  const config = getLevelConfig();
 if (!config.timeBonus || config.timeLimit === null ||
    timeBonus === null) return;

  const now = performance.now();

  if (now >= timeBonus.expiresAt) {
    timeBonus = null;
    return;
  }
  
  if(isCurrentShape(timeBonus.row, timeBonus.col)){
    deadline = Math.min(deadline + 5000, now + 120000);
    timeBonus = null;
    updateGameDisplay();
  }
}
function renderSpecObs() {
  if (obstacle !== null) {
    for (let i = 0; i < obstacle.width; i++) {
      const col = obstacle.col + i;
      const index = obstacle.row * COLS + col;

      boardElement.children[index].classList.add("obstacle");
    }
  }
  if (timeBonus !== null) {
    const index = timeBonus.row * COLS + timeBonus.col;
    const cell = boardElement.children[index];

    cell.classList.add("time-bonus");
    cell.textContent = "+5s";
  }
}

function stopTimer() {
  if (challengeTimer != null) {
    clearInterval(challengeTimer);
    challengeTimer = null;
  }
}
function checkTimeExpired() {
  if (!isPlaying) return false;

  const config = getLevelConfig();

  if (config.timeLimit === null) return false;

  if (performance.now() >= deadline) {
    endGame(false);
    levelElement.textContent = "HẾT GIỜ";
    return true;
  }
  return false;
}
function startTimer() {
  stopTimer();
  const config = getLevelConfig();

  const needsTimer =
    config.timeLimit !== null || config.movingObstacle || config.timeBonus;
  if (!needsTimer) return;
  challengeTimer = setInterval(function () {
    if (!isPlaying || checkTimeExpired()) return;

    const now = performance.now();
    let boardChanged = false;
    if (timeBonus !== null && now >= timeBonus.expiresAt) {
      timeBonus = null;
      boardChanged = true;
    }
    if (config.movingObstacle && now >= nextMoveAt) {
      moveObstacle();
      nextMoveAt = now + 1000;
      boardChanged = true;
    }
    if (config.timeBonus && now >= nextAttemptAt) {
      spawnTimeBonus(now);
      nextAttemptAt = now + 1000;
      boardChanged = true;
    }
    updateGameDisplay();
    if (boardChanged) renderBoard();
  }, 250);
}
