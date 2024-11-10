// Game configuration and constants
const LEVELS = {
  beginner: { size: 15, time: 180, name: "Beginner" },
  advanced: { size: 25, time: 420, name: "Advanced" },
  expert: { size: 37, time: 600, name: "Expert" },
};

class MazeRunner {
  constructor(level = "beginner") {
    this.level = LEVELS[level];
    this.size = this.level.size;
    this.timeLeft = this.level.time;
    this.maze = [];
    this.playerPos = { x: 1, y: 1 };
    this.cpuPos = { x: this.size - 2, y: 1 };
    this.exit = { x: this.size - 2, y: this.size - 2 };
    this.currentTurn = "player";
    this.gameOver = false;
    this.timer = null;
    this.moves = [];
  }

  init() {
    this.generateMaze();
    this.startTimer();
    this.render();
    document.getElementById("gameOver").style.display = "none";
  }

  generateMaze() {
    // Initialize empty maze
    for (let y = 0; y < this.size; y++) {
      this.maze[y] = new Array(this.size).fill(1);
    }

    const stack = [];
    this.carve(1, 1, stack);

    // Set player, CPU and exit positions
    this.maze[1][1] = 2; // player
    this.maze[1][this.size - 2] = 3; // CPU
    this.exit.x = Math.floor(this.size / 2);
    this.exit.y = this.size - 2;
    this.maze[this.exit.y][this.exit.x] = 4; // exit
  }

  carve(x, y, stack) {
    const directions = [
      { dx: 0, dy: 2 }, // right
      { dx: 2, dy: 0 }, // down
      { dx: 0, dy: -2 }, // left
      { dx: -2, dy: 0 }, // up
    ];

    directions.sort(() => Math.random() - 0.5);
    this.maze[y][x] = 0;

    for (const dir of directions) {
      const nextX = x + dir.dx;
      const nextY = y + dir.dy;

      if (this.isValid(nextX, nextY) && this.maze[nextY][nextX] === 1) {
        this.maze[y + dir.dy / 2][x + dir.dx / 2] = 0;
        stack.push({ x: nextX, y: nextY });
        this.carve(nextX, nextY, stack);
      }
    }
  }

  isValid(x, y) {
    return x > 0 && x < this.size - 1 && y > 0 && y < this.size - 1;
  }

  move(direction) {
    if (this.gameOver || this.currentTurn !== "player") return false;

    const newPos = { ...this.playerPos };
    switch (direction) {
      case "up":
        newPos.y--;
        break;
      case "down":
        newPos.y++;
        break;
      case "left":
        newPos.x--;
        break;
      case "right":
        newPos.x++;
        break;
    }

    if (this.isValidMove(newPos)) {
      this.maze[this.playerPos.y][this.playerPos.x] = 0;
      this.playerPos = newPos;
      this.maze[this.playerPos.y][this.playerPos.x] = 2;

      if (
        this.playerPos.x === this.exit.x &&
        this.playerPos.y === this.exit.y
      ) {
        this.endGame("player");
        return true;
      }

      this.currentTurn = "cpu";
      this.render();
      setTimeout(() => this.cpuMove(), 500);
      // move duration
      return true;
    }
    return false;
  }

  cpuMove() {
    if (this.gameOver || this.currentTurn !== "cpu") return;

    const path = this.findPath(this.cpuPos, this.exit);
    if (path.length > 1) {
      this.maze[this.cpuPos.y][this.cpuPos.x] = 0;
      this.cpuPos = path[1];
      this.maze[this.cpuPos.y][this.cpuPos.x] = 3;

      if (this.cpuPos.x === this.exit.x && this.cpuPos.y === this.exit.y) {
        this.endGame("cpu");
        return;
      }
    }

    this.currentTurn = "player";
    this.render();
  }

  findPath(start, end) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(`${start.x},${start.y}`, 0);
    fScore.set(`${start.x},${start.y}`, this.heuristic(start, end));

    while (openSet.length > 0) {
      let current = openSet.reduce((a, b) =>
        fScore.get(`${a.x},${a.y}`) < fScore.get(`${b.x},${b.y}`) ? a : b,
      );

      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.splice(openSet.indexOf(current), 1);
      const neighbors = this.getNeighbors(current);

      for (const neighbor of neighbors) {
        const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1;
        const key = `${neighbor.x},${neighbor.y}`;

        if (!gScore.has(key) || tentativeGScore < gScore.get(key)) {
          cameFrom.set(key, current);
          gScore.set(key, tentativeGScore);
          fScore.set(key, tentativeGScore + this.heuristic(neighbor, end));

          if (
            !openSet.find((pos) => pos.x === neighbor.x && pos.y === neighbor.y)
          ) {
            openSet.push(neighbor);
          }
        }
      }
    }
    return [];
  }

  heuristic(pos, goal) {
    return Math.abs(pos.x - goal.x) + Math.abs(pos.y - goal.y);
  }

  getNeighbors(pos) {
    const directions = [
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
    ];

    return directions
      .map((dir) => ({
        x: pos.x + dir.dx,
        y: pos.y + dir.dy,
      }))
      .filter((newPos) => this.isValidMove(newPos));
  }

  reconstructPath(cameFrom, current) {
    const path = [current];
    let key = `${current.x},${current.y}`;

    while (cameFrom.has(key)) {
      current = cameFrom.get(key);
      path.unshift(current);
      key = `${current.x},${current.y}`;
    }
    return path;
  }

  isValidMove(pos) {
    return this.isValid(pos.x, pos.y) && this.maze[pos.y][pos.x] !== 1;
  }

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) {
        this.endGame("timeout");
      }
    }, 1000);
  }

  updateTimer() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    document.getElementById("timer").textContent =
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  endGame(result) {
    this.gameOver = true;
    clearInterval(this.timer);

    const gameResult = {
      date: new Date().toISOString(),
      level: this.level.name,
      result: result,
      timeSpent: this.level.time - this.timeLeft,
    };

    this.saveResult(gameResult);
    this.showGameOver(result);
  }

  saveResult(result) {
    const results = JSON.parse(
      localStorage.getItem("mazeRunnerResults") || "[]",
    );
    results.push(result);
    localStorage.setItem("mazeRunnerResults", JSON.stringify(results));
  }

  showGameOver(result) {
    const gameOver = document.getElementById("gameOver");
    const gameOverText = document.getElementById("gameOverText");

    let message = "";
    switch (result) {
      case "player":
        message = "You Won! 🎉";
        break;
      case "cpu":
        message = "CPU Reached the Exit First! :|";
        break;
      case "timeout":
        message = "Time's Up! Both Lost! ⏰";
        break;
    }

    gameOverText.textContent = message;
    gameOver.style.display = "block";
  }

  render() {
    const mazeElement = document.getElementById("maze");
    mazeElement.innerHTML = "";
    mazeElement.style.display = "grid";
    mazeElement.style.gridTemplateColumns = `repeat(${this.size}, 30px)`;

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        switch (this.maze[y][x]) {
          case 0:
            cell.classList.add("path");
            break;
          case 1:
            cell.classList.add("wall");
            break;
          case 2:
            cell.classList.add("player");
            break;
          case 3:
            cell.classList.add("cpu");
            break;
          case 4:
            cell.classList.add("exit");
            break;
        }
        mazeElement.appendChild(cell);
      }
    }
  }
}

// Global move function for button controls
function move(direction) {
  if (window.game) {
    window.game.move(direction);
  }
}

// Global start game function
function startGame() {
  const gameLevel = localStorage.getItem("level") || "beginner";
  window.game = new MazeRunner(gameLevel);
  window.game.init();
}

// Initialize game
document.addEventListener("DOMContentLoaded", () => {
  window.game = null;
  const gameLevel = localStorage.getItem("level") || "beginner";
  window.game = new MazeRunner(gameLevel);
  window.game.init();

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (!window.game || window.game.gameOver) return;

    switch (e.key) {
      case "ArrowUp":
      case "w":
        window.game.move("up");
        break;
      case "ArrowDown":
      case "s":
        window.game.move("down");
        break;
      case "ArrowLeft":
      case "a":
        window.game.move("left");
        break;
      case "ArrowRight":
      case "d":
        window.game.move("right");
        break;
    }
  });

  // for mobiles
  document.getElementById("upArrBtn").addEventListener("click", () => {
    if (window.game && !window.game.gameOver) window.game.move("up");
  });
  document.getElementById("downArrBtn").addEventListener("click", () => {
    if (window.game && !window.game.gameOver) window.game.move("down");
  });
  document.getElementById("leftArrBtn").addEventListener("click", () => {
    if (window.game && !window.game.gameOver) window.game.move("left");
  });
  document.getElementById("rightArrBtn").addEventListener("click", () => {
    if (window.game && !window.game.gameOver) window.game.move("right");
  });
});
