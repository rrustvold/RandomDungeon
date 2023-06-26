let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

let dpi = 2;

let cellSize = 30;
let backgroundColor = "white";
let lineColor = "silver";

let pressed = false;

let scaleStep = 0.1;
let scale = 1;
let lastScale = scale;
let maxScale = 10;
let minScale = 0.1;

let lastX;
let lastY;

let zoomPoint = {
  x: 0,
  y: 0
};
let lastZoomPoint = zoomPoint;

let rx = 0,
  ry = 0;
let left = 0,
  right = 0,
  _top = 0,
  bottom = 0;

let mouseX, mouseY;

let doorWidth = 10;

let rooms = [];
let tiles = new Set();

let numTilesWide = Math.floor(width/(cellSize*scale));
let numTilesTall = Math.floor(height/(cellSize*scale));

stairs = new Room(numTilesWide/2 - 1, numTilesTall-4, 2, 1, "south", "stairs");
rooms.push(stairs);

myRoom = new Room(numTilesWide/2 - 2, numTilesTall - 6, 5, 3, "south");
rooms.push(myRoom);

resizeCanvas();
addEventListeners();
calculate();
draw();

function resizeCanvas() {
  canvas.height = height * dpi;
  canvas.width = width * dpi;
  canvas.style.height = height + "px";
  canvas.style.width = width + "px";
}

function addEventListeners() {
  canvas.addEventListener("mousedown", (e) => mousedown(e));
  canvas.addEventListener("mouseup", (e) => mouseup(e));
  canvas.addEventListener("mousemove", (e) => mousemove(e));
  // canvas.addEventListener("wheel", (e) => wheel(e));
  canvas.addEventListener("touchstart", (e) => mousedown(e));
  canvas.addEventListener("touchmove", (e) => mousemove(e));
  canvas.addEventListener("touchend", (e) => mouseup(e));
  canvas.addEventListener("touchstart", handleTouchStart);
}

function calculate() {
  calculateDistancesToCellBorders();
  calculateDrawingPositions();
}

function calculateDistancesToCellBorders() {
  let dx = zoomPoint.x - lastZoomPoint.x + rx * lastScale;
  rx = dx - Math.floor(dx / (lastScale * cellSize)) * lastScale * cellSize;
  rx /= lastScale;

  let dy = zoomPoint.y - lastZoomPoint.y + ry * lastScale;
  ry = dy - Math.floor(dy / (lastScale * cellSize)) * lastScale * cellSize;
  ry /= lastScale;
}

function calculateDrawingPositions() {
  let scaledCellSize = cellSize * scale;

  left = zoomPoint.x - rx * scale;
  right = left + scaledCellSize;
  _top = zoomPoint.y - ry * scale;
  bottom = _top + scaledCellSize;
}



function behind_door(){
  let length;
  let width;
  let type;
  let num = Math.random()*100;
  if (num <= 50) {
    // hallway
    length = Math.floor(Math.random()*10) + 6;
    width = 1;
  }
  else if (num <= 85) {
    // room
    length = Math.floor(Math.random()*5) + 1;
    width = Math.floor(Math.random()*5) + 1;
  }
  else if (num <= 95) {
    // large room
    length = Math.floor(Math.random()*10) + 5;
    width = Math.floor(Math.random()*10) + 5;
  }
  // else if (num <= 100) {
  //   // stairs
  //   length = 2;
  //   width = 1;
  //   type = "stairs";
  // }
  else {
    // trap
    length = 1;
    width = 1;
  }
  return [length, width, type];
}

function Tile(x, y, loc) {
  this.x = x;
  this.y = y;

  this.left = 0;
  this.top = 0;
  this.right = 0;
  this.bottom = 0;
  const hash = `${this.x}, ${this.y}`;
  this.real = !tiles.has(hash);
  tiles.add(hash);

  this.isCont = false;
  this.loc = loc;

  this.draw = function (ctx) {
    if (!this.real || !this.isCont){
      return;
    }

    ctx.beginPath()

    // THE LEFT SIDE
    if (this.left === "wall") {
      ctx.moveTo(this.x * cellSize * scale + right, this.y * cellSize * scale + bottom);
      ctx.lineTo(this.x * cellSize * scale + right, (this.y - 1) * cellSize * scale + bottom);
    }
    else if (this.left === "open_door") {
      ctx.strokeRect(
          this.x * cellSize * scale + right - (doorWidth / 2) * scale,
          (this.y - 0) * cellSize * scale + bottom,
          doorWidth,
          -cellSize * scale
      )
    }
    else if (this.left === "closed_door") {
      ctx.fillStyle = "black";
      let startX = (this.x + 0)*cellSize*scale + right - (doorWidth/2)*scale;
      let startY = (this.y - 0) * cellSize*scale + bottom;
      ctx.fillRect(
          startX,
          startY,
          doorWidth,
          -cellSize*scale
      );

      if (
          mouseX >= startX &&
          mouseX <= startX + doorWidth &&
          mouseY <= startY &&
          mouseY >= startY - cellSize*scale
      ){
        this.left = "open_door";
        if (!tiles.has(`${this.x - 1}, ${this.y}`)) {
          let [nextW, nextH, type] = behind_door();
          rooms.push(
              new Room(
                  this.x - nextW,
                  this.y + Math.floor(nextH / 2),
                  nextH,
                  nextW,
                  "east",
                  type
              )
          )
        }
      }
    }

    // THE RIGHT SIDE
    if (this.right === "wall") {
      ctx.moveTo((this.x + 1) * cellSize * scale + right, this.y * cellSize * scale + bottom);
      ctx.lineTo((this.x + 1) * cellSize * scale + right, (this.y - 1) * cellSize * scale + bottom);

    }
    else if (this.right === "open_door") {
      let startX = (this.x + 1)*cellSize*scale + right - (doorWidth/2)*scale;
      let startY = (this.y - 0) * cellSize*scale + bottom;
      ctx.strokeRect(
          startX,
          startY,
          doorWidth,
          -cellSize*scale
      );
    }
    else if (this.right === "closed_door") {
      ctx.fillStyle = "black";
      let startX = (this.x + 1)*cellSize*scale + right - (doorWidth/2)*scale;
      let startY = (this.y - 0) * cellSize*scale + bottom;
      ctx.fillRect(
          startX,
          startY,
          doorWidth,
          -cellSize*scale
      );

      if (
          mouseX >= startX &&
          mouseX <= startX + doorWidth &&
          mouseY <= startY &&
          mouseY >= startY - cellSize*scale
      ){
        this.right = "open_door";
        if (!tiles.has(`${this.x + 1}, ${this.y}`)) {
          let [nextW, nextH, type] = behind_door();
          rooms.push(
              new Room(
                  this.x + 1,
                  this.y + Math.floor(nextH / 2),
                  nextH,
                  nextW,
                  "west",
                  type
              )
          )
        }
      }

    }

    // THE TOP SIDE
    if (this.top === "wall") {
      ctx.moveTo((this.x + 0)*cellSize*scale + right, (this.y - 1)*cellSize*scale + bottom);
      ctx.lineTo((this.x + 1)*cellSize*scale + right, (this.y - 1)*cellSize*scale + bottom);
    }
    else if (this.top === "closed_door") {
      ctx.fillStyle = "black";
      let startX = this.x*cellSize*scale + right;
      let startY = (this.y - 1) * cellSize*scale + bottom - doorWidth/2;
      ctx.fillRect(startX, startY, cellSize*scale, doorWidth);

      if (
          mouseX >= startX &&
          mouseX <= startX + cellSize*scale &&
          mouseY >= startY &&
          mouseY <= startY + doorWidth
      ){
        this.top = "open_door";
        if (!tiles.has(`${this.x}, ${this.y - 1}`)) {
          let [nextH, nextW, type] = behind_door();
          rooms.push(
              new Room(
                  this.x - Math.floor(nextW / 2),
                  this.y - 1,
                  nextH,
                  nextW,
                  "south",
                  type
              )
          )
        }
      }
    }

    // THE BOTTOM SIDE
    if (this.bottom === "wall") {
      ctx.moveTo((this.x + 0)*cellSize*scale + right, (this.y - 0)*cellSize*scale + bottom);
      ctx.lineTo((this.x + 1)*cellSize*scale + right, (this.y - 0)*cellSize*scale + bottom);
    } else if (this.bottom === "open_door") {
      ctx.fillStyle = "black";
      ctx.strokeRect(
          this.x * cellSize * scale + right,
          this.y * cellSize * scale - (doorWidth / 2) * scale + bottom,
          cellSize * scale,
          doorWidth
      );
    }
    else if (this.bottom === "closed_door") {
      ctx.fillStyle = "black";
      let startX = this.x * cellSize * scale + right;
      let startY = this.y * cellSize * scale - (doorWidth / 2) * scale + bottom;
      ctx.fillRect(
          startX,
          startY,
          cellSize * scale,
          doorWidth
      );

      if (
          mouseX >= startX &&
          mouseX <= startX + cellSize*scale &&
          mouseY >= startY &&
          mouseY <= startY + doorWidth
      ){
        this.bottom = "open_door";
        if (!tiles.has(`${this.x}, ${this.y + 1}`)) {
          let [nextH, nextW, type] = behind_door();
          rooms.push(
              new Room(
                  this.x - Math.floor(nextW / 2),
                  this.y + nextH,
                  nextH,
                  nextW,
                  "north",
                  type
              )
          )
        }
      }
    }

    ctx.stroke();
  }
  return this;
}

function Room(x, y, h, w, entrance, type) {
  this.x = x;
  this.y = y;
  this.h = h;
  this.w = w;
  this.type = type;
  this.flip = (Math.floor(Math.random()*10) % 2);
  rooms.forEach(room => room.characterIsHere = false);
  this.characterIsHere = true;
  this.entranceTileLoc = 0;

  this.tiles = [];

  this.contents = "";

  // Generate the room's contents
  let roll = Math.floor(Math.random()*20) + 1;
  if (this.w > 1 && this.h > 1) {
    if (roll <= 12) {
      this.contents = "Empty";
    } else if (roll <= 14) {
      this.contents = "Monster";
    } else if (roll <= 17) {
      this.contents = "Monster & Treasure";
    } else if (roll <= 19) {
      this.contents = "Trick or Trap";
    } else {
      this.contents = "Treasure!";
    }
  } else {
    // hallway
    if (roll <= 18) {
      this.contents = "Empty";
    }
    else if (roll <= 19) {
      this.contents = "Trick or Trap";
    } else {
      this.contents = "Wandering Monster";
    }
  }

  // construct all the room's tiles starting in the lower left hand corner and working up then to the right
  let loc = 0;
  for (let dx=0; dx<this.w; dx++){
    for (let dy=0; dy<this.h; dy++){
      tile = new Tile(this.x + dx, this.y - dy, loc);
      loc++;
      if (dx === 0) {
        tile.left = "wall";
      }
      if (dx === this.w - 1) {
        tile.right = "wall";
      }
      if (dy === 0) {
        tile.bottom = "wall";
      }
      if (dy === this.h - 1) {
        tile.top = "wall";
      }
      this.tiles.push(tile);
    }
  }

  // add the entrance
  let entrance_tile;
  let cursor;
  if (entrance === "south" || entrance === "north"){
    cursor = this.h * (Math.floor(this.w / 2));
    if (entrance === "south") {
      entrance_tile = this.tiles[cursor];
      entrance_tile.bottom = "open_door"
    } else {
      cursor += this.h - 1;
      entrance_tile = this.tiles[cursor];
      entrance_tile.top = "open_door";
    }
  } else if (entrance === "west" || entrance === "east") {
    cursor = Math.floor(this.h / 2);
    if (entrance === "west") {
      entrance_tile = this.tiles[cursor];
      entrance_tile.left = "open_door";
    } else {
      cursor += this.h * (this.w - 1);
      entrance_tile = this.tiles[cursor];
      entrance_tile.right = "open_door";
    }
  }
  entrance_tile.isCont = true;
  this.entranceTileLoc = cursor;

  // Check that the room is contiguous. Any tiles that can't be connected to the
  // entrance are marked as not contiguous.
  let to_check = new Set([entrance_tile.loc]);

  for (let i=0; i<to_check.size; i++) {
    let current_tile = this.tiles[Array.from(to_check)[i]];
    let current_col = Math.floor(current_tile.loc / this.h);

    let tile_above_loc = current_tile.loc + 1;
    if (Math.floor(tile_above_loc / this.h) === current_col) {
      let tile_above = this.tiles[tile_above_loc];
      if (tile_above.real) {
        tile_above.isCont = true;
        to_check.add(tile_above.loc);
      }
    }

    let tile_below_loc = current_tile.loc - 1;
    if (Math.floor(tile_below_loc / this.h) === current_col) {
      let tile_below = this.tiles[tile_below_loc];
      if (tile_below.real) {
        tile_below.isCont = true;
        to_check.add(tile_below.loc);
      }
    }

    let tile_left_loc = current_tile.loc - this.h;
    if (tile_left_loc >= 0) {
      let tile_left = this.tiles[tile_left_loc];
      if (tile_left.real) {
        tile_left.isCont = true;
        to_check.add(tile_left.loc);
      }
    }

    let tile_right_loc = current_tile.loc + this.h;
    if (tile_right_loc < this.tiles.length) {
      let tile_right = this.tiles[tile_right_loc];
      if (tile_right.real) {
        tile_right.isCont = true;
        to_check.add(tile_right.loc);
      }
    }
  }

  // add random doors
  if (type !== "stairs") {
    let directions = ["south", "west", "north", "east"];
    for (let i in directions) {
      let direction = directions[i];
      if (entrance !== direction) {
        if (rooms.length === 1 || Math.random() * 100 < 50) {
          let door_type = "closed_door";
          if (direction === "south") {
            cursor = this.h * (Math.floor(this.w / 2) + this.w % w);
            this.tiles[cursor].bottom = door_type;
          } else if (direction === "north") {
            cursor = this.h * (Math.floor(this.w / 2) + this.w % w) + this.h - 1;
            this.tiles[cursor].top = door_type;
          } else if (direction === "west") {
            cursor = Math.floor(this.h / 2);
            this.tiles[cursor].left = door_type;
          } else if (direction === "east") {
            cursor = Math.floor(this.h / 2) + this.h * (this.w - 1);
            this.tiles[cursor].right = door_type;
          }
        }
      }
    }
  }

  this.draw = function(ctx) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    this.tiles.forEach(tile => tile.draw(ctx));

    if (this.type === "stairs"){
      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;

      if (entrance === "north" || entrance === "south"){
        // stairs are vertical
        if (this.flip) {
          ctx.moveTo(this.x * cellSize * scale + right, (this.y - 2) * cellSize * scale + bottom);
          ctx.lineTo((this.x + 0.5) * cellSize * scale + right, (this.y) * cellSize * scale + bottom);
          ctx.lineTo((this.x + 1) * cellSize * scale + right, (this.y - 2) * cellSize * scale + bottom);
        } else {
          ctx.moveTo(this.x * cellSize * scale + right, this.y * cellSize * scale + bottom);
          ctx.lineTo((this.x + 0.5) * cellSize * scale + right, (this.y - 2) * cellSize * scale + bottom);
          ctx.lineTo((this.x + 1) * cellSize * scale + right, this.y * cellSize * scale + bottom);
        }

      } else {
        //stairs are horizontal
        if (this.flip) {
          ctx.moveTo(this.x * cellSize * scale + right, this.y * cellSize * scale + bottom);
          ctx.lineTo((this.x + 2) * cellSize * scale + right, (this.y - .5) * cellSize * scale + bottom);
          ctx.lineTo((this.x) * cellSize * scale + right, (this.y - 1) * cellSize * scale + bottom);
        } else {
          ctx.moveTo((this.x+2) * cellSize * scale + right, this.y * cellSize * scale + bottom);
          ctx.lineTo((this.x) * cellSize * scale + right, (this.y - .5) * cellSize * scale + bottom);
          ctx.lineTo((this.x+2) * cellSize * scale + right, (this.y - 1) * cellSize * scale + bottom);
        }
      }
      ctx.stroke();
    }

    if (this.characterIsHere){
      ctx.fillStyle = "red";
      let x = this.tiles[this.entranceTileLoc].x;
      let y = this.tiles[this.entranceTileLoc].y;
      ctx.fillRect(
          (x + .25) * cellSize*scale + right,
          (y - .5) * cellSize*scale + bottom,
          cellSize/2 * scale,
          cellSize/2 * scale
      )

      ctx.font = "15px Arial";
      ctx.fillText(`${5 * (rooms.length - 1)} minutes`, 10, 50)
      ctx.fillText(this.contents, 10, 100);

    }

  }

  return this;
}

// Draws the grid
function draw() {

  ctx.save();
  ctx.scale(dpi, dpi);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = lineColor;
  ctx.translate(-0.5, -0.5);

  ctx.beginPath();

  let scaledCellSize = cellSize * scale;

  for (let x = left; x > 0; x -= scaledCellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  for (let x = right; x < width; x += scaledCellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  for (let y = _top; y > 0; y -= scaledCellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  for (let y = bottom; y < height; y += scaledCellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  ctx.stroke();


  // Draw the rooms
  rooms.forEach(room => room.draw(ctx));

  ctx.restore();
}

function update() {
  ctx.clearRect(0, 0, width * dpi, height * dpi);
  draw();
}

function move(dx, dy) {
  zoomPoint.x += dx;
  zoomPoint.y += dy;
}

function zoom(amt, point) {
  lastScale = scale;
  scale += amt * scaleStep;

  if (scale < minScale) {
    scale = minScale;
  }

  if (scale > maxScale) {
    scale = maxScale;
  }

  lastZoomPoint = zoomPoint;
  zoomPoint = point;
}

function wheel(e) {
  zoom(e.deltaY > 0 ? -1 : 1, {
    x: e.offsetX,
    y: e.offsetY
  });
  
  calculate();
  update();
}

function mousedown(e) {
  pressed = true;
  let x;
  let y;
  if (e.type.startsWith("touch")) {
      var touch = e.touches[0] || e.changedTouches[0];
      x = touch.clientX;
      y = touch.clientY;
  } else {
      x = e.offsetX;
      y = e.offsetY;
  }

  mouseX = x;
  mouseY = y;
  update();
}

function mouseup(e) {
  pressed = false;
  update();
}

function handleTouchStart(e) {
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
}

function mousemove(e) {
  if (!pressed) {
    return;
  }
  mouseX = null;
  mouseY = null;

  if (e.type.startsWith("touch")) {
    var touch = e.touches[0];
    var touchX = touch.clientX;
    var touchY = touch.clientY;
    var movementX = touchX - lastX;
    var movementY = touchY - lastY;

    lastX = touchX;
    lastY = touchY;
  } else {
    movementX = e.movementX;
    movementY = e.movementY;
  }

  move(movementX, movementY);

  // do not recalculate the distances again, this wil lead to wronrg drawing
  calculateDrawingPositions();
  update();
}