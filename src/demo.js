/* ———— demo.js ———— */
/* Handles the logo path sampling, progressive draw, and auto-trigger of the coaster animation */

export let demoPoints = [];
export let demoPath = [];
export let demoRevealIndex = 0;
export let demoComplete = false;

const demoRevealSpeed = 3; // points revealed per frame

export function sampleLogoPath(canvasWidth, canvasHeight) {
  const svgPath = document.getElementById("logo-path");
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
    (canvasWidth * 0.7) / pathW,
    (canvasHeight * 0.4) / pathH,
  );

  const offsetX = (canvasWidth - pathW * scale) / 2 - minX * scale;
  const offsetY = (canvasHeight - pathH * scale) / 2 - minY * scale;

  return points.map((p) => [p[0] * scale + offsetX, p[1] * scale + offsetY]);
}

export function initDemo(canvasWidth, canvasHeight) {
  const svgPath = document.getElementById("logo-path");
  console.log("svg path found:", svgPath);
  console.log("total length:", svgPath?.getTotalLength());

  demoPoints = sampleLogoPath(canvasWidth, canvasHeight);
  console.log("demo points sampled:", demoPoints.length);
  console.log("first point:", demoPoints[0]);

  demoRevealIndex = 0;
  demoPath = [];
  demoComplete = false;
}

export function runDemo(c, strokeSize, onComplete) {
  console.log(
    "runDemo called",
    demoComplete,
    demoPoints.length,
    demoRevealIndex,
  );
  if (demoComplete) return;

  // reveal points progressively
  if (demoRevealIndex < demoPoints.length) {
    demoRevealIndex += demoRevealSpeed;
    demoPath = demoPoints.slice(0, demoRevealIndex);
  }

  // draw the revealed portion
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
  c.drawingContext.strokeStyle = "white";
  c.drawingContext.lineWidth = strokeSize;
  c.drawingContext.lineCap = "round";
  c.drawingContext.lineJoin = "round";
  c.drawingContext.stroke();

  // once fully drawn, call back to main to trigger animation
  if (demoRevealIndex >= demoPoints.length) {
    demoComplete = true;
    onComplete(demoPoints);
  }
}
