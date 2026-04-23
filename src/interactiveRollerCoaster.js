import "./style.css";
import p5 from "p5";
import horizontalTrackSrc from "./assets/horizontalTrackPiece.png";
import cornerTrackSrc from "./assets/cornerTrackPiece.png";

let horizontalTrackImg;
let cornerTrackImg;

const loadImage = (src, callback) => {
  const img = new Image();
  img.src = src;
  img.onload = () => callback(img);
};

loadImage(horizontalTrackSrc, (img) => (horizontalTrackImg = img));
loadImage(cornerTrackSrc, (img) => (cornerTrackImg = img));

let bgCol = "#1d1d1d";
let font;

let xGrid;
let yGrid;
let gridArray = [];
let gridScale = 100;
let direction = 0;

let currentSquare;

let showSetup = true;

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

const checkTrack = (c) => {
  currentSquare = getCurrentSquare(c);

  gridArray.push([currentSquare.x, currentSquare.y]);
};

const checkDirection = (c) => {
  c.stroke("white");
  c.strokeWeight(10);
  if (direction == 0) {
    c.line(
      getCurrentSquare(c).x,
      getCurrentSquare(c).y,
      getCurrentSquare(c).x + 100,
      getCurrentSquare(c).y,
    );
  }
};

const drawTrack = (c) => {
  c.fill("#2560e0");
  c.noStroke();

  if (!horizontalTrackImg) return;

  for (let i = 0; i < gridArray.length; i++) {
    // c.rect(gridArray[i][0], gridArray[i][1], gridScale, gridScale);
    c.drawingContext.drawImage(
      horizontalTrackImg,
      gridArray[i][0],
      gridArray[i][1],
      gridScale,
      gridScale,
    );
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
    //Need a draw direction
  };

  c.mouseDragged = () => {
    showSetup = false;

    checkTrack(c);
    checkDirection(c);
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
