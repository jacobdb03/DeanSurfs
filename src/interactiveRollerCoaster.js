import "./style.css";
import p5 from "p5";
import trackRightSrc from "./assets/trackRight.png";
import trackDownSrc from "./assets/trackDown.png";
import trackLeftSrc from "./assets/trackLeft.png";
import trackUpSrc from "./assets/trackUp.png";

let trackRight, trackDown, trackLeft, trackUp;

const loadImg = (src, callback) => {
  const img = new Image();
  img.src = src;
  img.onload = () => callback(img);
};

loadImg(trackRightSrc, (img) => (trackRight = img));
loadImg(trackDownSrc, (img) => (trackDown = img));
loadImg(trackLeftSrc, (img) => (trackLeft = img));
loadImg(trackUpSrc, (img) => (trackUp = img));

let bgCol = "#1d1d1d";
let font;

let xGrid;
let yGrid;
let gridArray = [];
let gridScale = 100;

let showSetup = true;

const tutorial = (c) => {
  if (showSetup) {
    c.fill(255);
    c.strokeWeight(0);
    if (font) c.textFont(font);
    c.textAlign(c.CENTER, c.CENTER);
    c.textSize(42);
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

const getPrevSquare = () => {
  if (gridArray.length <= 1) {
    return null;
  } else {
    const prev = gridArray[gridArray.length - 1];
    return { x: prev[0], y: prev[1] };
  }
};

const checkDirection = (c) => {
  let prevSquare = getPrevSquare();
  let currentSquare = getCurrentSquare(c);

  if (!prevSquare) {
    return { d: 0 };
  } else {
    // Right Up Left Down
    if (prevSquare.x < currentSquare.x) {
      return { d: 0 };
    } else if (prevSquare.y > currentSquare.y) {
      return { d: 1 };
    } else if (prevSquare.x > currentSquare.x) {
      return { d: 2 };
    } else if (prevSquare.y < currentSquare.y) {
      return { d: 3 };
    }
  }
};

const checkTrack = (c) => {
  let currentSquare = getCurrentSquare(c);
  let direction = checkDirection(c);

  // If not in array already, and need to check if there is a direction or not
  if (direction && direction.d !== undefined) {
    gridArray.push([currentSquare.x, currentSquare.y, direction.d]);
  }
};

const drawTrack = (c) => {
  if (!trackUp) return;

  for (let i = 0; i < gridArray.length; i++) {
    // Right Up Left Down

    if (gridArray[i][2] === 0) {
      c.drawingContext.drawImage(
        trackRight,
        gridArray[i][0],
        gridArray[i][1],
        gridScale,
        gridScale,
      );
    } else if (gridArray[i][2] == 1) {
      c.drawingContext.drawImage(
        trackUp,
        gridArray[i][0],
        gridArray[i][1],
        gridScale,
        gridScale,
      );
    } else if (gridArray[i][2] == 2) {
      c.drawingContext.drawImage(
        trackLeft,
        gridArray[i][0],
        gridArray[i][1],
        gridScale,
        gridScale,
      );
    } else if (gridArray[i][2] == 3) {
      c.drawingContext.drawImage(
        trackDown,
        gridArray[i][0],
        gridArray[i][1],
        gridScale,
        gridScale,
      );
    }
  }
};

const coaster = (c) => {
  c.setup = () => {
    c.createCanvas(window.innerWidth, window.innerHeight);
  };

  c.draw = () => {
    c.background(bgCol);
    // drawGrid(c);

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

new p5(coaster);

/*
LOGIC FOR ROLLER COASTER:

  On mouse drag > check  to see if a roller coaster has been drawn in a roller coaster frame <<< STILL HERE
    Roller coaster frame = bounding box holding an image in an invisible grid around the screen + a directional indicator to show where the direction of the coaster is heading
    If yes: dont draw new roller coaster frame that check
    If no: draw a new roller coaster frame in that new frame/box

    Also: if skiped a square, draw a connecting path between the two (consider how to path this)
    Also: for loop de loops, specifically designed shapes in the grid

  On mouse release > animate the roller coaster character going along the drawn path



  // If the mouse moves and its a new square: do the check

  //   If it doesnt already exist in the array: add it

  //   In gridArray.some look for [currentPosX and current pos y] (as an array) compared to the other arrays within grid array

  //        If found, dont add it to the array, if it is

  //        Draw whatever is in the array
*/
