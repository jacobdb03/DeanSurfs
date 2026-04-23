import "./style.css";

import p5 from "p5";

const CELL_SIZE = 50; // change this to scale the grid

const sketch = (p) => {
  let grid = {}; // key: "col,row" → { entryDir, exitDir, tile }
  let path = []; // ordered array of cells for animation
  let animating = false;
  let animIndex = 0;
  let animT = 0;

  // --- Helpers ---

  const cellKey = (col, row) => `${col},${row}`;

  const getCell = (col, row) => grid[cellKey(col, row)];

  const screenToGrid = (x, y) => ({
    col: Math.floor(x / CELL_SIZE),
    row: Math.floor(y / CELL_SIZE),
  });

  const gridToScreen = (col, row) => ({
    x: col * CELL_SIZE,
    y: row * CELL_SIZE,
  });

  const getTileType = (entryDir, exitDir) => {
    const pair = [entryDir, exitDir].sort().join("-");
    if (entryDir === exitDir) return "straight"; // U-turn edge case
    if (pair === "left-right" || pair === "down-up") return "straight";
    return "corner";
  };

  const getExitDir = (prevCol, prevRow, col, row) => {
    if (col > prevCol) return "right";
    if (col < prevCol) return "left";
    if (row > prevRow) return "down";
    if (row < prevRow) return "up";
    return null;
  };

  const oppositeDir = (dir) => {
    return { left: "right", right: "left", up: "down", down: "up" }[dir];
  };

  // Fill in skipped cells between two grid positions
  const fillGap = (prevCol, prevRow, col, row) => {
    const dc = Math.sign(col - prevCol);
    const dr = Math.sign(row - prevRow);
    let c = prevCol + dc;
    let r = prevRow + dr;
    while (c !== col || r !== row) {
      addCell(c, r, prevCol, prevRow);
      prevCol = c;
      prevRow = r;
      c += dc;
      r += dr;
    }
  };

  const addCell = (col, row, fromCol, fromRow) => {
    const key = cellKey(col, row);
    if (grid[key]) return; // already occupied

    const exitDir = getExitDir(fromCol, fromRow, col, row);
    const entryDir = oppositeDir(exitDir);
    const tile = getTileType(entryDir, exitDir);

    grid[key] = { col, row, entryDir, exitDir, tile };
    path.push({ col, row });
  };

  // --- Drawing ---

  const drawGrid = () => {
    p.stroke(255, 255, 255, 30);
    p.strokeWeight(1);
    p.noFill();
    for (let x = 0; x < p.width; x += CELL_SIZE) {
      for (let y = 0; y < p.height; y += CELL_SIZE) {
        p.rect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  };

  const drawTrack = () => {
    for (const key in grid) {
      const cell = grid[key];
      const { x, y } = gridToScreen(cell.col, cell.row);

      if (cell.tile === "straight") {
        drawStraightTile(x, y, cell.exitDir);
      } else if (cell.tile === "corner") {
        drawCornerTile(x, y, cell.entryDir, cell.exitDir);
      }
    }
  };

  const drawStraightTile = (x, y, exitDir) => {
    p.fill(80);
    p.stroke(200);
    p.strokeWeight(2);
    p.rect(x, y, CELL_SIZE, CELL_SIZE);

    // TODO: replace rect with straight track graphic
    // e.g. p.image(straightTrackImg, x, y, CELL_SIZE, CELL_SIZE);
  };

  const drawCornerTile = (x, y, entryDir, exitDir) => {
    p.fill(60);
    p.stroke(200);
    p.strokeWeight(2);
    p.rect(x, y, CELL_SIZE, CELL_SIZE);

    // TODO: replace rect with corner track graphic, rotated to match entry/exit
    // determine rotation based on entryDir + exitDir combo:
    // e.g. right+down = top-left corner piece
    // e.g. left+down  = top-right corner piece
    // p.push(); p.translate(x, y); p.rotate(angle); p.image(cornerTrackImg, 0, 0); p.pop();
  };

  const drawAnimator = () => {
    if (!animating || path.length === 0) return;

    const current = path[Math.floor(animIndex)];
    const next = path[Math.min(Math.floor(animIndex) + 1, path.length - 1)];

    const from = gridToScreen(current.col, current.row);
    const to = gridToScreen(next.col, next.row);

    const cx = p.lerp(from.x + CELL_SIZE / 2, to.x + CELL_SIZE / 2, animT);
    const cy = p.lerp(from.y + CELL_SIZE / 2, to.y + CELL_SIZE / 2, animT);

    // TODO: replace with roller coaster character graphic
    p.fill(255, 200, 0);
    p.noStroke();
    p.circle(cx, cy, 30);

    animT += 0.02; // speed — increase to go faster
    if (animT >= 1) {
      animT = 0;
      animIndex++;
      if (animIndex >= path.length - 1) {
        animating = false;
        animIndex = 0;
      }
    }
  };

  // --- p5 lifecycle ---

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight);
  };

  p.draw = () => {
    p.background(30);
    drawGrid();
    drawTrack();
    drawAnimator();
  };

  let lastCol = null;
  let lastRow = null;

  p.mouseDragged = () => {
    if (animating) return;

    const { col, row } = screenToGrid(p.mouseX, p.mouseY);

    if (lastCol === null) {
      lastCol = col;
      lastRow = row;
    }

    // Fill any skipped cells
    if (col !== lastCol || row !== lastRow) {
      fillGap(lastCol, lastRow, col, row);
      addCell(col, row, lastCol, lastRow);
      lastCol = col;
      lastRow = row;
    }
  };

  p.mouseReleased = () => {
    if (path.length > 1) {
      animating = true;
      animIndex = 0;
      animT = 0;
    }
    lastCol = null;
    lastRow = null;
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
  };
};

new p5(sketch);
