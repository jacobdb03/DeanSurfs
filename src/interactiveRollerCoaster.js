import "./style.css";
import p5 from "p5";

import { loadAssets } from "./assets.js";

/* ———— Image and p5 loaded Checker ———— */

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

/* ———— Variable assets ———— */

let bgCol = "#1d1d1d";
let gridArray = [];
let gridScale = 50;

let showSetup = true;
let drawGridControl = false;

/* ———— Other functions ———— */

//    Sets up the text that explains what to do before you start
function tutorial(c) {
  let font;
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
}

//    Creates a grid thats helpful in development
function drawGrid(c) {
  if (!drawGridControl) return;

  let xGrid;
  let yGrid;

  c.strokeWeight(1);
  c.stroke(100);
  c.noFill();

  for (xGrid = 0; xGrid < window.innerWidth; xGrid += gridScale) {
    for (yGrid = 0; yGrid < window.innerHeight; yGrid += gridScale) {
      c.rect(xGrid, yGrid, gridScale, gridScale);
    }
  }
}

/* ———— Define custom track variables ———— */
//    Returns the x and y of the current box the mouse is in
const getCurrentSquare = (c) => {
  let xSquare = Math.floor(c.mouseX / gridScale);
  let ySquare = Math.floor(c.mouseY / gridScale);

  let x = xSquare * gridScale;
  let y = ySquare * gridScale;

  return { x: x, y: y };
};

//    Returns the x, y and direction[d] of the square immediately before the current one
const getPrevSquare = () => {
  if (gridArray.length <= 1) return { x: 0, y: 0, d: 0 };

  const prevSquare = gridArray[gridArray.length - 1];
  return { x: prevSquare[0], y: prevSquare[1], d: prevSquare[2] };
};

//    Returns the direction[d] of the current box compared to previous box   // 1 = trackRight // 2 = trackUp // 3 = trackLeft // 4 = trackDown
const getCurrentDirection = (c) => {
  let prevSquare = getPrevSquare();
  let curSquare = getCurrentSquare(c);

  if (prevSquare.x < curSquare.x) return { d: 1 };
  else if (prevSquare.y > curSquare.y) return { d: 2 };
  else if (prevSquare.x > curSquare.x) return { d: 3 };
  else if (prevSquare.y < curSquare.y) return { d: 4 };
  else return { d: 1 };
};

/* ———— Variable track functions ———— */
//    Checks whether the previous tile needs to be a corner tile, by comparing the current direciton to the previous tiles direction
function getCorner(currDir) {
  let cornerDir = 0;

  if (gridArray.length <= 1) return;
  let prevDir = gridArray[gridArray.length - 1][2];

  if (currDir === prevDir || prevDir === 0) return;

  if (currDir === 2 && prevDir === 1) cornerDir = 11;
  else if (currDir === 4 && prevDir === 1) cornerDir = 12;
  else if (currDir === 1 && prevDir === 2) cornerDir = 21;
  else if (currDir === 3 && prevDir === 2) cornerDir = 22;
  else if (currDir === 2 && prevDir === 3) cornerDir = 31;
  else if (currDir === 4 && prevDir === 3) cornerDir = 32;
  else if (currDir === 1 && prevDir === 4) cornerDir = 41;
  else if (currDir === 3 && prevDir === 4) cornerDir = 42;

  if (cornerDir >= 11 && gridArray.length > 0) {
    // Overwrite the direction of the PREVIOUS tile with the corner ID
    gridArray[gridArray.length - 1][2] = cornerDir;
  }

  return cornerDir;
}

//    Checks if there is a gap between the previous tile and the current tile, and connects them if so.
function connectTrack(prevSquare, currSquare) {
  // if (gridArray.length <= 1) return;
  if (prevSquare.x === currSquare.x && prevSquare.y === currSquare.y) return;

  let diffX = currSquare.x - prevSquare.x;
  let diffY = currSquare.y - prevSquare.y;

  if (Math.abs(diffX) > gridScale || Math.abs(diffY) > gridScale) {
    let nextX = prevSquare.x;
    let nextY = prevSquare.y;
    let nextDir = 0;

    if (diffX !== 0) {
      if (diffX > 0) {
        nextX += gridScale;
        nextDir = 1;
      } else {
        nextX -= gridScale;
        nextDir = 3;
      }
    }
    // Then move Y
    else if (diffY !== 0) {
      if (diffY > 0) {
        nextY += gridScale;
        nextDir = 4;
      } else {
        nextY -= gridScale;
        nextDir = 2;
      }
    }

    getCorner(nextDir);
    addToTrack(nextX, nextY, nextDir);
    connectTrack({ x: nextX, y: nextY, d: nextDir }, currSquare);
  }
}

/* ———— The track functions ———— */
//    Completes the checks to make sure a piece of track can be drawn and adds it to the stack.
function checkTrack(c) {
  // Set up variables
  let currentSquare = getCurrentSquare(c);
  let direction = getCurrentDirection(c);

  let previousSquare = getPrevSquare();

  // Check for movement to new square: break if not
  if (
    currentSquare.x === previousSquare.x &&
    currentSquare.y === previousSquare.y
  )
    return;

  // If the array is empty, just place the first piece and STOP.
  if (gridArray.length <= 1) {
    gridArray.push([currentSquare.x, currentSquare.y, 1]);
    return;
  }

  // Check for illegal movements immediately backwards: break if so
  if (previousSquare.d === 1 && direction.d === 3) return;
  else if (previousSquare.d === 3 && direction.d === 1) return;
  else if (previousSquare.d === 2 && direction.d === 4) return;
  else if (previousSquare.d === 4 && direction.d === 2) return;

  // function that connects track together from fast mouse movement skipping boxes
  connectTrack(previousSquare, currentSquare);
}

function addToTrack(x, y, dir) {
  getCorner(dir);
  gridArray.push([x, y, dir]);
}

//    Draws the track from the stack, correct to the direction/corner.
function drawTrack(c) {
  if (!trackUp) return;

  for (let i = 0; i < gridArray.length; i++) {
    const x = gridArray[i][0];
    const y = gridArray[i][1];
    const s = gridScale;
    const dir = gridArray[i][2];

    if (dir >= 11) {
      if (dir === 11) c.drawingContext.drawImage(corner270, x, y, s, s);
      else if (dir === 12) c.drawingContext.drawImage(corner90, x, y, s, s);
      else if (dir === 21) c.drawingContext.drawImage(corner0, x, y, s, s);
      else if (dir === 22) c.drawingContext.drawImage(corner90, x, y, s, s);
      else if (dir === 31) c.drawingContext.drawImage(corner180, x, y, s, s);
      else if (dir === 32) c.drawingContext.drawImage(corner0, x, y, s, s);
      else if (dir === 41) c.drawingContext.drawImage(corner180, x, y, s, s);
      else if (dir === 42) c.drawingContext.drawImage(corner270, x, y, s, s);
    } else {
      if (dir === 1) c.drawingContext.drawImage(trackRight, x, y, s, s);
      else if (dir === 2) c.drawingContext.drawImage(trackUp, x, y, s, s);
      else if (dir === 3) c.drawingContext.drawImage(trackLeft, x, y, s, s);
      else if (dir === 4) c.drawingContext.drawImage(trackDown, x, y, s, s);
    }
  }
}

/* ———— Visual additions ———— */
//    Connects the drawn track to the bottom of the page.
function addSupports() {
  return;
}

//    Draws the cart to animate along the track
function playAnimation() {
  return;
}

//    Checks if there are any patterns in the shape of the coaster to replace them blocks with smoother curves/custom track shapes
function extraStyleChecks() {
  return;
}

/* ———— The p5 Logic ———— */

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
