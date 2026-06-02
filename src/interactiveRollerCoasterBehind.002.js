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
let strokeSize = 50;

let animPlay = false;
let animIndex = 0;
let animProgress = 0;
let speedMultiplier = 1.0;
const basePixelsPerFrame = 20;

let smoothedAngle = 0;
let smoothedPath = [];

let drawGridControl = false;

/* ———— Demo variables ———— */

let demoPoints = [];
let demoPath = [];
let demoRevealIndex = 0;
let demoComplete = false;
const demoRevealSpeed = 3;
let demoStrokeSize = 40;

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

/* ———— Demo functions ———— */

//    Samples points along the SVG logo path and scales them to fit the canvas
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

  // scale and centre on canvas
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pathW = maxX - minX;
  const pathH = maxY - minY;

  const scale = Math.min(
    (canvasWidth * 1) / pathW,
    (canvasHeight * 0.8) / pathH,
  );

  const offsetX = (canvasWidth - pathW * scale) / 2 - minX * scale;
  const offsetY = canvasHeight - pathH * scale - minY * scale + 150;
  return points.map((p) => [p[0] * scale + offsetX, p[1] * scale + offsetY]);
}

//    Initialises the demo path on setup
function initDemo(canvasWidth, canvasHeight) {
  demoPoints = sampleLogoPath(canvasWidth, canvasHeight);
  demoRevealIndex = 0;
  demoPath = [];
  demoComplete = false;
}

//    Progressively draws the logo path and triggers the animation when complete
function runDemo(c) {
  if (demoComplete) return;

  if (demoRevealIndex < demoPoints.length) {
    const demoProgress = demoRevealIndex / demoPoints.length;
    const eased = (1 - Math.cos(demoProgress * Math.PI)) / 2; // 0 to 1, ease in and out
    const easedSpeed = demoRevealSpeed * (0.1 + eased * 2); // min speed 0.1, max ~2x
    demoRevealIndex += easedSpeed;

    demoPath = demoPoints.slice(0, demoRevealIndex);
  }

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

  // once fully drawn, trigger the coaster animation
  if (demoRevealIndex >= demoPoints.length) {
    demoComplete = true;
    pathArray = [...demoPoints];
    smoothedPath = smoothPath(pathArray, 3);
    strokeSize = demoStrokeSize;
    animPlay = true;
    animIndex = 0;
    animProgress = 0;
    speedMultiplier = 1.0;
    smoothedAngle = 0;
  }
}

/* ———— Track functions ———— */

//    Adds the current mouse position to the path
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

//    Draws the track as a smooth stroked line through all points
function drawTrack(c) {
  const points = animPlay ? smoothedPath : smoothPath(pathArray, 2);
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

//    Draws the cart at the correct position with nudge offset
function drawCart(c, x, y, angle, nx, ny) {
  const size = strokeSize * 1.5;
  c.fill(strokeChoice);
  c.noStroke();
  c.circle(x + nx, y + ny, size);
}

//    Animates the cart along the drawn path
function playAnimation(c) {
  if (!animPlay || smoothedPath.length < 2) return;

  if (animIndex >= smoothedPath.length - 1) {
    animPlay = false;
    animIndex = 0;
    animProgress = 0;
    pathArray = [];
    smoothedPath = [];
    return;
  }

  const cur = smoothedPath[animIndex];
  const nxt = smoothedPath[animIndex + 1];

  // interpolate position
  const lerpX = c.lerp(cur[0], nxt[0], animProgress);
  const lerpY = c.lerp(cur[1], nxt[1], animProgress);

  // rotation — sample ahead and behind for stable tangent
  const behind = Math.max(animIndex - 4, 0);
  const ahead = Math.min(animIndex + 4, smoothedPath.length - 1);
  const rawAngle = getAngleBetween(
    smoothedPath[behind][0],
    smoothedPath[behind][1],
    smoothedPath[ahead][0],
    smoothedPath[ahead][1],
  );

  let diff = rawAngle - smoothedAngle;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  smoothedAngle += diff * 0.08;

  // nudge cart above the track
  const nudgeAmount = strokeSize * 2;
  const perpAngle = (smoothedAngle - 90) * (Math.PI / 180);
  const nx = Math.cos(perpAngle) * nudgeAmount;
  const ny = Math.sin(perpAngle) * nudgeAmount;

  drawCart(c, lerpX, lerpY, smoothedAngle, nx, ny);

  // segment length for consistent pixel speed
  const dx = nxt[0] - cur[0];
  const dy = nxt[1] - cur[1];
  const segmentLength = Math.sqrt(dx * dx + dy * dy);

  // momentum — multiplier builds up over time based on slope
  const verticalTravel = getVerticalTravel(cur[1], nxt[1]);

  if (verticalTravel > 2) {
    speedMultiplier += 0.03; // downhill, gain speed
  } else if (verticalTravel < -2) {
    speedMultiplier -= 0.025; // uphill, lose speed
  } else {
    speedMultiplier += (1.0 - speedMultiplier) * 0.08; // flat, drift back
  }

  speedMultiplier = Math.max(0.4, Math.min(speedMultiplier, 3.0));
  animProgress += (basePixelsPerFrame * speedMultiplier) / segmentLength;

  if (animProgress >= 1) {
    animProgress = 0;
    animIndex++;
  }
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

    while (strokeChoice == bgChoice) {
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
    if (animPlay || !demoComplete) {
      animPlay = false;
      animIndex = 0;
      animProgress = 0;
      pathArray = [];
      smoothedPath = [];
      demoComplete = true;
      strokeSize = 50;
    }
    checkTrack(c);
  };

  c.mouseReleased = () => {
    if (pathArray.length > 1) {
      smoothedPath = smoothPath(pathArray, 2);
      animPlay = true;
      animIndex = 0;
      animProgress = 0;
      speedMultiplier = 1.0;
      smoothedAngle = 0;
    }
  };

  c.windowResized = () => {
    const container = document.getElementById("canvas-container");
    c.resizeCanvas(container.clientWidth, container.clientHeight);
  };
};
