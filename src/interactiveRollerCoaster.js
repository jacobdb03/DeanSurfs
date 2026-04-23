import "./style.css";
import p5 from "p5";

import { loadAssets } from "./assets.js";

let trackRight,
  trackDown,
  trackLeft,
  trackUp,
  corner0,
  corner90,
  corner180,
  corner270;
loadAssets().then((assets) => {
  trackRight = assets.trackRight;
  trackDown = assets.trackDown;
  trackLeft = assets.trackLeft;
  trackUp = assets.trackUp;
  corner0 = assets.corner0;
  corner90 = assets.corner90;
  corner180 = assets.corner180;
  corner270 = assets.corner270;
  new p5(coaster);
});

let bgCol = "#1d1d1d";
let font;

let xGrid;
let yGrid;
let gridArray = [];
let gridScale = 40;

let showSetup = true;

const tutorial = (c) => {
  if (showSetup) {
    c.fill(255);
    c.strokeWeight(0);
    if (font) c.textFont(font);
    c.textAlign(c.CENTER, c.CENTER);
    c.textSize(18);
    c.text(
      "click + hold anywhere to ride",
      window.innerWidth / 2,
      window.innerHeight / 2,
    );
  }
};

const drawGrid = (c) => {
  c.strokeWeight(1);
  c.stroke(100);
  c.noFill();

  for (xGrid = 0; xGrid < window.innerWidth; xGrid += gridScale) {
    for (yGrid = 0; yGrid < window.innerHeight; yGrid += gridScale) {
      c.rect(xGrid, yGrid, gridScale, gridScale);
    }
  }
};

const getCurrentSquare = (c) => {
  let xSquare = Math.floor(c.mouseX / gridScale);
  let ySquare = Math.floor(c.mouseY / gridScale);

  let x = xSquare * gridScale;
  let y = ySquare * gridScale;

  return { x: x, y: y };
};

const getFullCurrentSquare = (c) => {
  let x = getCurrentSquare(c).x;
  let y = getCurrentSquare(c).y;
  let d = getDirection(c).d;

  return { x: x, y: y, d: d };
};

const getPrevSquare = () => {
  if (gridArray <= 1) return { x: 0, y: 0, d: 0 };

  const prevSquare = gridArray[gridArray.length - 1];
  return { x: prevSquare[0], y: prevSquare[1], d: prevSquare[2] };
};

const getDirection = (c) => {
  let prevSquare = getPrevSquare();
  let curSquare = getCurrentSquare(c);

  if (prevSquare.x < curSquare.x) return { d: 1 };
  else if (prevSquare.y > curSquare.y) return { d: 2 };
  else if (prevSquare.x > curSquare.x) return { d: 3 };
  else if (prevSquare.y < curSquare.y) return { d: 4 };
  else return { d: 1 };
};

const getCornerDirection = (c) => {
  let prevSquare = getPrevSquare();
  let curSquare = getFullCurrentSquare(c);

  if (curSquare.d === 1 && prevSquare.d === 2) return { d: 11 };
  else if (curSquare.d === 1 && prevSquare.d === 4) return { d: 12 };
  else if (curSquare.d === 2 && prevSquare.d === 1) return { d: 21 };
  else if (curSquare.d === 2 && prevSquare.d === 3) return { d: 22 };
  else if (curSquare.d === 3 && prevSquare.d === 2) return { d: 31 };
  else if (curSquare.d === 3 && prevSquare.d === 4) return { d: 32 };
  else if (curSquare.d === 4 && prevSquare.d === 1) return { d: 41 };
  else if (curSquare.d === 4 && prevSquare.d === 3) return { d: 42 };
  else return { d: 1 };
};

const checkTrack = (c) => {
  let currentSquare = getCurrentSquare(c);
  let previousSquare = getPrevSquare();
  let direction = getFullCurrentSquare(c);
  let corner = getCornerDirection(c);

  if (
    currentSquare.x === previousSquare.x &&
    currentSquare.y === previousSquare.y
  )
    return;

  if (corner.d >= 10) gridArray[gridArray.length - 1][2] = direction.d;
  gridArray.push([currentSquare.x, currentSquare.y, direction.d]);

  // let corner = checkCorner(c);

  // console.log(currentSquare, previousSquare);
  // console.log(getDirection(c));

  // console.log(gridArray);

  // if (gridArray.length > 0 && direction.d >= 11) {
  //   gridArray[gridArray.length - 1][2] = direction.d;
  // } else
};

const drawTrack = (c) => {
  if (!trackUp) return;

  for (let i = 0; i < gridArray.length; i++) {
    const x = gridArray[i][0];
    const y = gridArray[i][1];
    const s = gridScale;
    const dir = gridArray[i][2];

    if (dir >= 11) {
      if (dir === 11 || 31) c.drawingContext.drawImage(corner0, x, y, s, s);
      else if (dir === 12 || 32)
        c.drawingContext.drawImage(corner90, x, y, s, s);
      else if (dir === 21 || 41)
        c.drawingContext.drawImage(corner180, x, y, s, s);
      else if (dir === 22 || 42)
        c.drawingContext.drawImage(corner270, x, y, s, s);
    } else {
      if (dir === 1) c.drawingContext.drawImage(trackRight, x, y, s, s);
      else if (dir === 2) c.drawingContext.drawImage(trackUp, x, y, s, s);
      else if (dir === 3) c.drawingContext.drawImage(trackLeft, x, y, s, s);
      else if (dir === 4) c.drawingContext.drawImage(trackDown, x, y, s, s);
    }
  }
};

const coaster = (c) => {
  c.setup = () => {
    c.createCanvas(window.innerWidth, window.innerHeight);
  };

  c.draw = () => {
    c.background(bgCol);
    drawGrid(c);

    tutorial(c);

    drawTrack(c);
  };

  c.mouseDragged = () => {
    showSetup = false;

    checkTrack(c);
  };

  c.mouseReleased = () => {
    gridArray = [];
  };

  c.windowResized = () => {
    c.resizeCanvas(window.innerWidth, window.innerHeight);
  };
};

/*
LOGIC FOR ROLLER COASTER:

  On mouse drag > check  to see if a roller coaster has been drawn in a roller coaster frame <<< STILL HERE
    Roller coaster frame = bounding box holding an image in an invisible grid around the screen + a directional indicator to show where the direction of the coaster is heading
    If yes: dont draw new roller coaster frame that check
    If no: draw a new roller coaster frame in that new frame/box

    Also: if skiped a square, draw a connecting path between the two (consider how to path this)
    Also: for loop de loops, specifically designed shapes in the grid

  On mouse release > animate the roller coaster character going along the drawn path
*/
