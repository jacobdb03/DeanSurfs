import "./style.css";
import p5 from "p5";

/* ———— Variable assets ———— */

const bgCol = ["#FE6533", "#FDC928", "#EC91FA", "#09A982"];
const strokeCol = ["#FE6533", "#FDC928", "#EC91FA", "#09A982", "#D9D9D9"];
let strokeSize = 32;
const basePixelsPerFrame = 10;
const demoDrawSpeed = 1;
let pathScale = 1;

let speed1 = basePixelsPerFrame;
let speed2 = basePixelsPerFrame;

let pathArray = [];

let animPlay = false;

let loopedPath = [];
let t1 = 0;
let t2 = 0;

let bgChoice;
let strokeChoice;

/* ———— Demo variables ———— */

let demoPoints = [];
let demoDrawIndex = 0;
let demoPath = [];
let demoComplete = false;

/* ———— Helper functions ———— */

let arcLengths = [];
let totalArcLength = 0;

function buildArcLengths(path) {
  arcLengths = [0];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    arcLengths.push(arcLengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  totalArcLength = arcLengths[arcLengths.length - 1];
}

function getPointAtDistance(dist) {
  dist = ((dist % totalArcLength) + totalArcLength) % totalArcLength;
  let lo = 0,
    hi = arcLengths.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (arcLengths[mid] < dist) lo = mid;
    else hi = mid;
  }
  const t = (dist - arcLengths[lo]) / (arcLengths[hi] - arcLengths[lo] || 1);
  return [
    loopedPath[lo][0] + t * (loopedPath[hi][0] - loopedPath[lo][0]),
    loopedPath[lo][1] + t * (loopedPath[hi][1] - loopedPath[lo][1]),
  ];
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

function buildLoopedPath(points, bridgeSamples = 120) {
  if (points.length < 2) return points;

  const first = points[0];
  const last = points[points.length - 1];

  const normalise = ([x, y]) => {
    const l = Math.sqrt(x * x + y * y) || 1;
    return [x / l, y / l];
  };
  const cubic = (t, p0, p1, p2, p3) => {
    const mt = 1 - t;
    return (
      mt ** 3 * p0 + 3 * mt ** 2 * t * p1 + 3 * mt * t ** 2 * p2 + t ** 3 * p3
    );
  };

  const [etX, etY] = normalise([
    last[0] - points[points.length - 2][0],
    last[1] - points[points.length - 2][1],
  ]);
  const [stX, stY] = normalise([
    points[1][0] - first[0],
    points[1][1] - first[1],
  ]);

  const handleScale =
    Math.sqrt((last[0] - first[0]) ** 2 + (last[1] - first[1]) ** 2) * 0.4;
  const cp1 = [last[0] + etX * handleScale, last[1] + etY * handleScale];
  const cp2 = [first[0] - stX * handleScale, first[1] - stY * handleScale];

  const bridge = Array.from({ length: bridgeSamples }, (_, i) => {
    const t = (i + 1) / bridgeSamples;
    return [
      cubic(t, last[0], cp1[0], cp2[0], first[0]),
      cubic(t, last[1], cp1[1], cp2[1], first[1]),
    ];
  });

  return [...points, ...bridge];
}

/* ———— Demo functions ———— */

function sampleLogoPath(canvasWidth, canvasHeight) {
  const svgPath = document.getElementById("logo-path");
  if (!svgPath) return [];

  const totalLength = svgPath.getTotalLength();
  const ctm = svgPath.getScreenCTM();
  const numPoints = 300;

  const points = Array.from({ length: numPoints + 1 }, (_, i) => {
    const pt = svgPath.getPointAtLength((i / numPoints) * totalLength);
    const { x, y } = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
    return [x, y];
  });

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);

  pathScale = Math.min(
    (canvasWidth * 0.95) / (maxX - minX),
    (canvasHeight * 0.8) / (maxY - minY),
  );
  const offsetX =
    (canvasWidth - (maxX - minX) * pathScale) / 2 - minX * pathScale;
  const offsetY =
    (canvasHeight - (maxY - minY) * pathScale) / 2 - minY * pathScale;

  return points.map(([x, y]) => [
    x * pathScale + offsetX,
    y * pathScale + offsetY,
  ]);
}

function update(c) {
  if (!demoComplete) {
    demoDrawIndex = Math.min(
      demoDrawIndex + demoDrawSpeed,
      demoPoints.length - 1,
    );
    demoPath = demoPoints.slice(0, Math.floor(demoDrawIndex) + 1);

    if (demoDrawIndex >= demoPoints.length - 1) {
      demoComplete = true;
      pathArray = [...demoPoints];
      loopedPath = buildLoopedPath(pathArray, 60);
      buildArcLengths(loopedPath);
      pathScale = Math.pow(200 / loopedPath.length, 2);

      animPlay = true;
      t1 = 0;
      t2 = totalArcLength / 2;
    }
    return;
  }

  if (animPlay) playAnimation(c);
}

/* ———— Track functions ———— */

function checkTrack(c) {
  const [x, y] = [c.mouseX, c.mouseY];
  const last = pathArray[pathArray.length - 1];
  if (last) {
    const dx = x - last[0],
      dy = y - last[1];
    if (Math.sqrt(dx * dx + dy * dy) < 5) return;
  }
  pathArray.push([x, y]);
}

function drawTrack(c) {
  const points = (
    animPlay ? loopedPath : demoComplete ? smoothPath(pathArray, 2) : demoPath
  ).filter(Boolean);
  if (points.length < 2) return;

  const ctx = c.drawingContext;
  ctx.beginPath();
  ctx.moveTo(...points[0]);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i][0] + points[i + 1][0]) / 2;
    const midY = (points[i][1] + points[i + 1][1]) / 2;
    ctx.quadraticCurveTo(...points[i], midX, midY);
  }

  ctx.lineTo(...points[points.length - 1]);
  ctx.strokeStyle = strokeChoice;
  ctx.lineWidth = strokeSize;
  ctx.lineCap = ctx.lineJoin = "butt";
  ctx.stroke();
}

/* ———— Animation functions ———— */

function drawCart(c, x, y) {
  const size = strokeSize * 2;
  c.fill(strokeChoice);
  c.noStroke();
  c.circle(x, y, size);
}

function moveCart(t, speed) {
  if (!loopedPath || loopedPath.length < 2) return { t, x: 0, y: 0, speed };

  const [rawX, rawY] = getPointAtDistance(t);
  const w = 30;
  const [bx, by] = getPointAtDistance(t - w);
  const [ax, ay] = getPointAtDistance(t + w);

  const dx = ax - bx;
  const dy = ay - by;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Momentum based on vertical travel
  const verticalTravel = ay - by;
  if (verticalTravel > 2) speed += 1.5;
  else if (verticalTravel < -2) speed -= 0.01;
  else speed += (basePixelsPerFrame - speed) * 0.5;
  speed = Math.max(2, Math.min(speed, 15));
  t = (t + speed) % totalArcLength;

  const x = rawX + (dy / len) * strokeSize * 1.5;
  const y = rawY - (dx / len) * strokeSize * 1.5;

  return { t, x, y, speed };
}
function playAnimation(c) {
  if (!animPlay || loopedPath.length < 2) return;

  const s1 = moveCart(t1, speed1);
  t1 = s1.t;
  speed1 = s1.speed;
  drawCart(c, s1.x, s1.y);

  const s2 = moveCart(t2, speed2);
  t2 = s2.t;
  speed2 = s2.speed;
  drawCart(c, s2.x, s2.y);
}

function resetAnimation() {
  animPlay = false;
  t1 = 0;
  t2 = 0;
  pathArray = [];
  speed1 = basePixelsPerFrame;
  speed2 = basePixelsPerFrame;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function newBackground() {
  bgChoice = randomChoice(bgCol);
  strokeChoice = randomChoice(strokeCol);
  while (strokeChoice === bgChoice) {
    strokeChoice = randomChoice(strokeCol);
  }
  document.getElementById("bg-layer").style.backgroundColor = bgChoice;
}

/* ———— The p5 Logic ———— */

const coaster = (c) => {
  c.setup = () => {
    strokeSize = window.innerWidth < 360 ? 5 : 30;
    const container = document.getElementById("canvas-container");

    const canvas = c.createCanvas(
      container.clientWidth,
      container.clientHeight,
    );
    canvas.parent("canvas-container");

    c.frameRate(60);
    newBackground();
  };

  c.draw = () => {
    if (demoPoints.length === 0) {
      demoPoints = sampleLogoPath(c.width, c.height);
      return;
    }

    c.clear();
    update(c);
    drawTrack(c);
  };

  c.mouseDragged = () => {
    if (animPlay || !demoComplete) {
      resetAnimation();
      demoComplete = true;
    }
    checkTrack(c);
  };

  c.mouseReleased = () => {
    if (pathArray.length > 1) {
      loopedPath = buildLoopedPath(pathArray, 60);
      buildArcLengths(loopedPath);
      resetAnimation();
      animPlay = true;
      t1 = 0;
      t2 = totalArcLength / 2;
      newBackground();
    }
  };

  c.windowResized = () => {
    const container = document.getElementById("canvas-container");
    c.resizeCanvas(container.clientWidth, container.clientHeight);
    strokeSize = window.innerWidth < 768 ? 15 : 30;

    demoPoints = [];
    demoDrawIndex = 0;
    demoPath = [];
    demoComplete = false;
    resetAnimation();
    loopedPath = [];
  };
};

window.addEventListener("load", () => {
  new p5(coaster);
});
