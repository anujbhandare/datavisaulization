const sz = 48;
const timerMax = 3;
let cols, rows, grid, units;

function setup() {
  let canvas = createCanvas(480, 480);
  canvas.parent("project")
  loadLevel([
    "..........",
    "..........",
    "..........",
    "..........",
    "...b.p....",
    "..........",
    "...b._....",
    "..........",
    "..........",
    ".........."
  ]);
}

function loadLevel(ascii) {
  cols = ascii[0].length;
  rows = ascii.length;
  grid = Array(rows).fill().map(_ => Array(cols).fill(null));
  units = [];
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      if (ascii[j][i] === "#") {
        new Wall(i, j);
      } else if (ascii[j][i] === "p") {
        new Player(i, j);
      } else if (ascii[j][i] === "b") {
        new Box(i, j);
      } else if (ascii[j][i] === "_") {
        new Hole(i, j);
      }
    }
  }
}

function keyPressed() {
  let player = null;
  for (const unit of units) {
    if (unit.type === "player") {
      player = unit;
    }
  }
  if (player) {
    let success = false;
    if (keyCode === UP_ARROW || key === "w" || key === "W") {
      if (player.move(0, -1)) {
        success = true;
      }
    } else if (keyCode === RIGHT_ARROW || key === "d" || key === "D") {
      if (player.move(1, 0)) {
        success = true;
      }
    } else if (keyCode === DOWN_ARROW || key === "s" || key === "S") {
      if (player.move(0, 1)) {
        success = true;
      }
    } else if (keyCode === LEFT_ARROW || key === "a" || key === "A") {
      if (player.move(-1, 0)) {
        success = true;
      }
    }
    if (success) {
      for (const unit of units) {
        unit.recordPosition();
      }
    }
  }
  if (key === "z" || key === "Z" || key === "u" || key === "U") {
    for (const unit of units) {
      unit.undo();
    }
  } else if (key === "r" || key === "R") {
    for (const unit of units) {
      unit.reset();
    }
  }
}

function draw() {
  background(255);
  for (const unit of units) {
    unit.render();
  }
}

class Unit {
  constructor(i, j, type) {
    this.i = i;
    this.j = j;
    this.type = type;
    this.timer = 0;
    this.prevI = i;
    this.prevJ = j;
    this.stack = [{ i, j }];
    grid[j][i] = this;
    units.push(this);
  }
  
  get x() {
    return map(this.timer, 0, timerMax, this.i, this.prevI) * sz;
  }
  
  get y() {
    return map(this.timer, 0, timerMax, this.j, this.prevJ) * sz;
  }
  
  goto(i, j) {
    if (this.i >= 0) {
      grid[this.j][this.i] = null;
    }
    grid[j][i] = this;
    this.timer = timerMax;
    this.prevI = this.i;
    this.prevJ = this.j;
    this.i = i;
    this.j = j;
  }
  
  destroy() {
    grid[this.j][this.i] = null;
    this.timer = timerMax;
    this.prevI = this.i;
    this.prevJ = this.j;
    this.i = -1;
    this.j = -1;
  }
  
  recordPosition() {
    this.stack.push({ i: this.i, j: this.j });
  }
  
  undo() {
    if (this.stack.length > 1) {
      this.stack.pop();
      const { i, j } = this.stack[this.stack.length-1];
      this.goto(i, j);
    }
  }
  
  reset() {
    const { i, j } = this.stack[0];
    this.goto(i, j);
    this.recordPosition();
  }
}

class Wall extends Unit {
  constructor(i, j) {
    super(i, j, "wall");
  }
  
  move(di, dj, movedBy=null) {
    return false;
  }
  
  render() {
    this.timer = max(0, this.timer-1);
    noStroke();
    fill(0);
    square(this.x+4, this.y+4, sz-8);
  }
}

class Player extends Unit {
  constructor(i, j) {
    super(i, j, "player");
  }
  
  move(di, dj, movedBy=null) {
    const newI = this.i + di;
    const newJ = this.j + dj;
    if (newI < 0 || newI >= cols || newJ < 0 || newJ >= rows) {
      return false;
    }
    if (grid[newJ][newI]) {
      if (!grid[newJ][newI].move(di, dj, this)) {
        return false;
      }
    }
    if (this.i >= 0) {
      this.goto(newI, newJ);
    }
    return true;
  }
  
  render() {
    this.timer = max(0, this.timer-1);
    stroke(0);
    strokeWeight(4);
    noFill();
    circle(this.x + sz*0.5, this.y + sz*0.5, sz-12);
  }
}

class Box extends Unit {
  constructor(i, j) {
    super(i, j, "Box");
  }
  
  move(di, dj, movedBy=null) {
    const newI = this.i + di;
    const newJ = this.j + dj;
    if (newI < 0 || newI >= cols || newJ < 0 || newJ >= rows) {
      return false;
    }
    if (grid[newJ][newI]) {
      if (!grid[newJ][newI].move(di, dj, this)) {
        return false;
      }
    }
    if (this.i >= 0) {
      this.goto(newI, newJ);
    }
    return true;
  }
  
  render() {
    this.timer = max(0, this.timer-1);
    stroke(0);
    strokeWeight(4);
    noFill();
    square(this.x+6, this.y+6, sz-12);
  }
}

class Hole extends Unit {
  constructor(i, j) {
    super(i, j, "Hole");
  }
  
  move(di, dj, movedBy=null) {
    if (movedBy && movedBy.type !== "player") {
      movedBy.destroy();
      this.destroy();
      return true;
    }
    return false;
  }
  
  render() {
    this.timer = max(0, this.timer-1);
    noStroke();
    fill(204);
    square(this.x+4, this.y+4, sz-8);
  }
}