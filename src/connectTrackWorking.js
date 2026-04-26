function connectTrack(c, prevSquare, currSquare) {
  // if the stacks length isnt long enough, escape
  if (gridArray.length < 1) return;

  let connectX = prevSquare.x;
  let connectY = prevSquare.y;
  let stepDir;

  if (prevSquare.x !== currSquare.x) {
    if (currSquare.x > prevSquare.x) {
      connectX = prevSquare.x + gridScale;
      stepDir = 1;
    } else {
      connectX = prevSquare.x - gridScale;
      stepDir = 3;
    }
  } else if (prevSquare.y !== currSquare.y) {
    if (currSquare.y > prevSquare.y) {
      connectY = prevSquare.y + gridScale;
      stepDir = 4;
    } else {
      connectY = prevSquare.y - gridScale;
      stepDir = 2;
    }
  }

  // stop one step before current square, let checkTrack push the final cell
  if (connectX === currSquare.x && connectY === currSquare.y) return;

  const corner = getCorner(stepDir, prevSquare.d);
  if (corner >= 11 && gridArray.length > 0) {
    gridArray[gridArray.length - 1][2] = corner;
  }

  const connectSquare = { x: connectX, y: connectY, d: stepDir };
  gridArray.push([connectX, connectY, stepDir]);
  connectTrack(c, connectSquare, currSquare);
}
