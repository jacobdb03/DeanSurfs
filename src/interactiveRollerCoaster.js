import "./style.css";
import p5 from "p5";
import { loadAssets } from "./assets.js";

/* ———— Image and p5 loaded Checker ———— */

let cart;
loadAssets().then((assets) => {
  cart = assets.cart;
  new p5(coaster);
});

/* ———— Variable assets ———— */

let bgCol = ["#FE6533", "#FDC928", "#EC91FA", "#09A982"];
let strokeCol = [
  "#FE6533",
  "#FDC928",
  "#EC91FA",
  "#09A982",
  "#EEEEEE",
  "#D9D9D9",
];
let strokeChoice;
let bgChoice;

let pathArray = [];
let strokeSize = 20;

let animPlay = false;
let animIndex = 0;
let animProgress = 0;
let speedMultiplier = 1.0;
const basePixelsPerFrame = 12;

// Second cart
let animIndex2 = 0;
let animProgress2 = 0;
let speedMultiplier2 = 1.0;
let smoothedAngle2 = 0;

let smoothedAngle = 0;
let smoothedPath = [];

// Looping path (smoothedPath + closing curve points)
let loopedPath = [];

let drawGridControl = false;

/* ———— Demo variables ———— */

let demoPoints = [];
let demoDrawIndex = 0; // float index into demoPoints for consistent speed
let demoPath = [];
let demoComplete = false;
const demoPixelsPerFrame = 12; // consistent pixel speed for draw-in
let demoStrokeSize = 20;

/* ———— Helper functions ———— */

function drawGrid(c) {
  if (!drawGridControl) return;
  c.strokeWeight(1);
  c.stroke(100);
  c.noFill();
  for (let x = 0; x < window.innerWidth; x += 50) {
    for (let y = 0; y < window.innerHeight; y += 50) {
      c.rect(x, y, 50, 50);
    }
  }
}

function getAngleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

function getVerticalTravel(y1, y2) {
  return y2 - y1;
}

function smoothPath(points, passes = 2) {
  let smoothed = points;
  for (let p = 0; p < passes; p++) {
    const result = [smoothed[0]];
    for (let i = 1; i < smoothed.length - 1; i++) {
      result.push([
        (smoothed[i - 1][0] + smoothed[i][0] + smoothed[i + 1][0]) / 3,
        (smoothed[i - 1][1] + smoothed[i][1] + smoothed[i + 1][1]) / 3,
      ]);
    }
    result.push(smoothed[smoothed.length - 1]);
    smoothed = result;
  }
  return smoothed;
}

/*
  Build a looped version of a path by inserting a smooth cubic-bezier
  bridge between the last point and the first point, then appending
  the first point so the path genuinely closes.
*/
function buildLoopedPath(points, bridgeSamples = 60) {
  if (points.length < 2) return points;

  const first = points[0];
  const last = points[points.length - 1];

  // Tangent at the end (backwards from last two points)
  const prev = points[points.length - 2];
  const endTangentX = last[0] - prev[0];
  const endTangentY = last[1] - prev[1];

  // Tangent at the start (forward from first two points)
  const next = points[1];
  const startTangentX = next[0] - first[0];
  const startTangentY = next[1] - first[1];

  const bridgeDist = Math.sqrt(
    (last[0] - first[0]) ** 2 + (last[1] - first[1]) ** 2,
  );
  const handleScale = bridgeDist * 0.4;

  // Control points
  const cp1x =
    last[0] +
    (endTangentX / (Math.sqrt(endTangentX ** 2 + endTangentY ** 2) || 1)) *
      handleScale;
  const cp1y =
    last[1] +
    (endTangentY / (Math.sqrt(endTangentX ** 2 + endTangentY ** 2) || 1)) *
      handleScale;
  const cp2x =
    first[0] -
    (startTangentX /
      (Math.sqrt(startTangentX ** 2 + startTangentY ** 2) || 1)) *
      handleScale;
  const cp2y =
    first[1] -
    (startTangentY /
      (Math.sqrt(startTangentX ** 2 + startTangentY ** 2) || 1)) *
      handleScale;

  // Sample the cubic bezier bridge
  const bridge = [];
  for (let i = 1; i <= bridgeSamples; i++) {
    const t = i / bridgeSamples;
    const mt = 1 - t;
    const bx =
      mt * mt * mt * last[0] +
      3 * mt * mt * t * cp1x +
      3 * mt * t * t * cp2x +
      t * t * t * first[0];
    const by =
      mt * mt * mt * last[1] +
      3 * mt * mt * t * cp1y +
      3 * mt * t * t * cp2y +
      t * t * t * first[1];
    bridge.push([bx, by]);
  }

  return [...points, ...bridge];
}

/* ———— Demo functions ———— */

// Samples points along the SVG logo path and scales them to fit the canvas — centred
function sampleLogoPath(canvasWidth, canvasHeight) {
  const svgPath = document.getElementById("logo-path");
  if (!svgPath) return [];

  const totalLength = svgPath.getTotalLength();
  const numPoints = 300;
  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const pt = svgPath.getPointAtLength((i / numPoints) * totalLength);
    const ctm = svgPath.getScreenCTM();
    const screenPt = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
    points.push([screenPt.x, screenPt.y]);
  }

  // Find bounds
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pathW = maxX - minX;
  const pathH = maxY - minY;

  // Scale to fit with padding
  const scale = Math.min(
    (canvasWidth * 0.8) / pathW,
    (canvasHeight * 0.5) / pathH,
  );

  // Centre on canvas
  const offsetX = (canvasWidth - pathW * scale) / 2 - minX * scale;
  const offsetY = (canvasHeight - pathH * scale) / 2 - minY * scale;

  return points.map((p) => [p[0] * scale + offsetX, p[1] * scale + offsetY]);
}

// Initialises the demo path on setup
function initDemo(canvasWidth, canvasHeight) {
  demoPoints = sampleLogoPath(canvasWidth, canvasHeight);
  demoDrawIndex = 0;
  demoPath = [];
  demoComplete = false;
}

// Advances the demo draw-in at a consistent pixel speed
function advanceDemoDrawIn() {
  if (demoComplete || demoPoints.length === 0) return;

  // Advance by enough steps to cover ~demoPixelsPerFrame pixels
  let budget = demoPixelsPerFrame;
  while (budget > 0 && Math.floor(demoDrawIndex) < demoPoints.length - 1) {
    const i = Math.floor(demoDrawIndex);
    const next = Math.min(i + 1, demoPoints.length - 1);
    const dx = demoPoints[next][0] - demoPoints[i][0];
    const dy = demoPoints[next][1] - demoPoints[i][1];
    const segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    const step = budget / segLen;
    demoDrawIndex = Math.min(demoDrawIndex + step, demoPoints.length - 1);
    budget -= segLen * step;
    if (demoDrawIndex >= demoPoints.length - 1) break;
  }

  demoPath = demoPoints.slice(0, Math.floor(demoDrawIndex) + 1);

  // Once fully drawn, kick off looping animation
  if (demoDrawIndex >= demoPoints.length - 1) {
    demoComplete = true;
    pathArray = [...demoPoints];
    const base = smoothPath(pathArray, 3);
    smoothedPath = base;
    loopedPath = buildLoopedPath(base, 60);
    strokeSize = demoStrokeSize;
    animPlay = true;
    animIndex = 0;
    animProgress = 0;
    speedMultiplier = 1.0;
    smoothedAngle = 0;

    // Start second cart offset by half the path
    const halfwayIndex = Math.floor(loopedPath.length / 2);
    animIndex2 = halfwayIndex;
    animProgress2 = 0;
    speedMultiplier2 = 1.0;
    smoothedAngle2 = 0;
  }
}

// Draws the currently revealed portion of the demo
function drawDemoStroke(c) {
  if (demoPath.length < 2) return;

  c.drawingContext.beginPath();
  c.drawingContext.moveTo(demoPath[0][0], demoPath[0][1]);

  for (let i = 1; i < demoPath.length - 1; i++) {
    const midX = (demoPath[i][0] + demoPath[i + 1][0]) / 2;
    const midY = (demoPath[i][1] + demoPath[i + 1][1]) / 2;
    c.drawingContext.quadraticCurveTo(
      demoPath[i][0],
      demoPath[i][1],
      midX,
      midY,
    );
  }

  const last = demoPath[demoPath.length - 1];
  c.drawingContext.lineTo(last[0], last[1]);
  c.drawingContext.strokeStyle = strokeChoice;
  c.drawingContext.lineWidth = demoStrokeSize;
  c.drawingContext.lineCap = "butt";
  c.drawingContext.lineJoin = "butt";
  c.drawingContext.stroke();
}

function runDemo(c) {
  if (demoComplete) return;
  advanceDemoDrawIn();
  drawDemoStroke(c);
}

/* ———— Track functions ———— */

// Adds the current mouse position to the path
function checkTrack(c) {
  const x = c.mouseX;
  const y = c.mouseY;

  if (pathArray.length > 0) {
    const last = pathArray[pathArray.length - 1];
    const dx = x - last[0];
    const dy = y - last[1];
    const cartDistance = Math.sqrt(dx * dx + dy * dy);
    if (cartDistance < 5) return;
  }

  pathArray.push([x, y]);
}

// Draws the track — uses loopedPath when animating so the closing curve is visible
function drawTrack(c) {
  const points = animPlay ? loopedPath : smoothPath(pathArray, 2);
  if (points.length < 2 || !points[0] || !points[points.length - 1]) return;

  c.drawingContext.beginPath();
  c.drawingContext.moveTo(points[0][0], points[0][1]);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i][0] + points[i + 1][0]) / 2;
    const midY = (points[i][1] + points[i + 1][1]) / 2;
    c.drawingContext.quadraticCurveTo(points[i][0], points[i][1], midX, midY);
  }

  const last = points[points.length - 1];
  c.drawingContext.lineTo(last[0], last[1]);

  c.drawingContext.strokeStyle = strokeChoice;
  c.drawingContext.lineWidth = strokeSize;
  c.drawingContext.lineCap = "butt";
  c.drawingContext.lineJoin = "butt";
  c.drawingContext.stroke();
}

/* ———— Animation functions ———— */

// Draws a cart dot at the given position with perpendicular nudge
function drawCart(c, x, y, angle, nx, ny) {
  const size = strokeSize * 1.5;
  c.fill(strokeChoice);
  c.noStroke();
  c.circle(x + nx, y + ny, size);
}

// Returns speed multiplier delta based on vertical travel
function calcSpeedDelta(verticalTravel) {
  if (verticalTravel > 2) return 0.03;
  if (verticalTravel < -2) return -0.025;
  return 0; // flat — handled by drift separately
}

// Advances a single cart along loopedPath; returns updated state
function stepCart(c, idx, prog, sAngle, sMultiplier) {
  const path = loopedPath;
  if (!path || path.length < 2)
    return { idx, prog, sAngle, sMultiplier, x: 0, y: 0, nx: 0, ny: 0 };

  // Wrap at end for looping
  if (idx >= path.length - 1) {
    idx = 0;
    prog = 0;
  }

  const cur = path[idx];
  const nxt = path[idx + 1] || path[0];

  const lerpX = c.lerp(cur[0], nxt[0], prog);
  const lerpY = c.lerp(cur[1], nxt[1], prog);

  // Stable tangent
  const behind = Math.max(idx - 4, 0);
  const ahead = Math.min(idx + 4, path.length - 1);
  const rawAngle = getAngleBetween(
    path[behind][0],
    path[behind][1],
    path[ahead][0],
    path[ahead][1],
  );

  let diff = rawAngle - sAngle;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  sAngle += diff * 0.08;

  const nudgeAmount = strokeSize * 2;
  const perpAngle = (sAngle - 90) * (Math.PI / 180);
  const nx = Math.cos(perpAngle) * nudgeAmount;
  const ny = Math.sin(perpAngle) * nudgeAmount;

  const dx = nxt[0] - cur[0];
  const dy = nxt[1] - cur[1];
  const segLen = Math.sqrt(dx * dx + dy * dy) || 1;

  const verticalTravel = getVerticalTravel(cur[1], nxt[1]);
  sMultiplier += calcSpeedDelta(verticalTravel);
  if (Math.abs(verticalTravel) <= 2) {
    sMultiplier += (1.0 - sMultiplier) * 0.08;
  }
  sMultiplier = Math.max(0.4, Math.min(sMultiplier, 3.0));

  prog += (basePixelsPerFrame * sMultiplier) / segLen;

  if (prog >= 1) {
    prog = 0;
    idx++;
    if (idx >= path.length - 1) {
      idx = 0; // loop
    }
  }

  return { idx, prog, sAngle, sMultiplier, x: lerpX, y: lerpY, nx, ny };
}

// Animates both carts along the looped path
function playAnimation(c) {
  if (!animPlay || loopedPath.length < 2) return;

  // Cart 1
  const s1 = stepCart(
    c,
    animIndex,
    animProgress,
    smoothedAngle,
    speedMultiplier,
  );
  drawCart(c, s1.x, s1.y, s1.sAngle, s1.nx, s1.ny);
  animIndex = s1.idx;
  animProgress = s1.prog;
  smoothedAngle = s1.sAngle;
  speedMultiplier = s1.sMultiplier;

  // Cart 2
  const s2 = stepCart(
    c,
    animIndex2,
    animProgress2,
    smoothedAngle2,
    speedMultiplier2,
  );
  drawCart(c, s2.x, s2.y, s2.sAngle, s2.nx, s2.ny);
  animIndex2 = s2.idx;
  animProgress2 = s2.prog;
  smoothedAngle2 = s2.sAngle;
  speedMultiplier2 = s2.sMultiplier;
}

/* ———— The p5 Logic ———— */

const coaster = (c) => {
  c.setup = () => {
    const container = document.getElementById("canvas-container");

    const w = container.clientWidth;
    const h = container.clientHeight;

    const canvas = c.createCanvas(w, h);
    canvas.parent("canvas-container");

    c.frameRate(60);
    bgChoice = c.random(bgCol);
    strokeChoice = c.random(strokeCol);

    while (strokeChoice === bgChoice) {
      strokeChoice = c.random(strokeCol);
    }

    initDemo(window.innerWidth, window.innerHeight);
    window.sharedBgChoice = bgChoice;
  };

  c.draw = () => {
    c.background(bgChoice);
    drawGrid(c);
    runDemo(c);
    drawTrack(c);
    playAnimation(c);
  };

  c.mouseDragged = () => {
    // Interrupt demo or ongoing animation to let the user draw
    if (animPlay || !demoComplete) {
      animPlay = false;
      animIndex = 0;
      animProgress = 0;
      animIndex2 = 0;
      animProgress2 = 0;
      pathArray = [];
      smoothedPath = [];
      loopedPath = [];
      demoComplete = true;
      strokeSize = 50;
    }
    checkTrack(c);
  };

  c.mouseReleased = () => {
    if (pathArray.length > 1) {
      const base = smoothPath(pathArray, 2);
      smoothedPath = base;
      loopedPath = buildLoopedPath(base, 60);
      animPlay = true;
      animIndex = 0;
      animProgress = 0;
      speedMultiplier = 1.0;
      smoothedAngle = 0;

      const halfwayIndex = Math.floor(loopedPath.length / 2);
      animIndex2 = halfwayIndex;
      animProgress2 = 0;
      speedMultiplier2 = 1.0;
      smoothedAngle2 = 0;
    }
  };

  c.windowResized = () => {
    const container = document.getElementById("canvas-container");
    c.resizeCanvas(container.clientWidth, container.clientHeight);
    // Re-sample the logo path for the new canvas size if demo hasn't completed
    if (!demoComplete) {
      initDemo(container.clientWidth, container.clientHeight);
    }
  };
};
