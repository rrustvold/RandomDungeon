const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const a = 2 * Math.PI / 6;
const r = 50;
const r_p = r * Math.cos(Math.PI / 6);
const dpi = 1;
let width = window.innerWidth;
let height = window.innerHeight;

let cellSize = r;
let backgroundColor = "white";
let lineColor = "silver";

let pressed = false;

let scaleStep = 0.1;
let scale = 1;
let lastScale = scale;
let maxScale = 10;
let minScale = 0.1;


let x_spacing = 6*r*Math.cos(a);
let y_spacing = 2*r*Math.sin(a);


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

let tiles = [];
let tiles_cache = {};
// Create the starting tile
let mouseX = 0;
let mouseY = 0;


function Tile(x, y, type){
  this.x = x;
  this.y = y;
  this.hash = `${this.x}, ${this.y}`;

  if (type != null){
    this.type = type;
  } else {
    this.type = "water";
  }

  this.x_c = function() {
    // get the hex center's x coordinate in global frame
    return this.x*x_spacing + right;
  }
  this.y_c = function() {
    // get the hex center's y coordinate in global frame
    return this.y*y_spacing + bottom;
  }
  this.isCharacterHere = false;

  tiles_cache[this.hash] = this;
  tiles.push(this);

  const type_to_color = {
    grass: "lightGreen",
    city: "red",
    water: "blue",
    hill: "brown",
    mountain: "gray",
    desert: "yellow",
    forest: "green"
  }

  const type_to_markov = {
    grass: [.75, .01, .05, .05, .01, .01, .12],
    city: [.35, .05, .25, .15, .09, .03, .08],
    water: [.05, .05, .70, .09, .05, .01, .05],
    hill: [.05, .03, .05, .70, .10, .02, .05],
    mountain: [.01, .01, .03, .70, .20, .02, .03],
    desert: [.06, .01, .03, .05, .08, .75, .02],
    forest: [.05, .01, .03, .05, .10, .01, .75]
}

  // generate the tiles around this one
  this.create_tile_if_dne = function(x, y) {
    let new_type;
    if (!(`${x}, ${y}` in tiles_cache)){
      let roll = Math.random();
      let markov = type_to_markov[this.type];
      let sum = 0;
      for (let i=0; i < markov.length; i++){
        sum += markov[i];
        if (roll <= sum) {
          new_type = Object.keys(type_to_color)[i];
          break;
        }
      }
      new Tile(x, y, new_type);
    }
  }

  this.generate_surrounding = function() {
    //north
    let x;
    let y;
    x = this.x;
    y = this.y - 1;
    this.create_tile_if_dne(x,y);

    // north east
    x = this.x + .5;
    y = this.y - .5;
    this.create_tile_if_dne(x,y);

    // south east
    x = this.x + .5;
    y = this.y + .5;
    this.create_tile_if_dne(x,y);

    // south
    x = this.x;
    y = this.y + 1;
    this.create_tile_if_dne(x,y);

    //south west
    x = this.x - .5;
    y = this.y + .5;
    this.create_tile_if_dne(x,y);

    // north west
    x = this.x - .5;
    y = this.y - .5;
    this.create_tile_if_dne(x,y);

  }

  this.draw = function(){
    drawHexagon(this.x_c(), this.y_c(), type_to_color[this.type]);
    if (this.isCharacterHere){
      // draw the player marker
      ctx.fillStyle = "black";
      ctx.fillRect(this.x_c() -5, this.y_c()-5, 10, 10);

      // check mouse clicks around this tile
      let x;
      let y;
      if (
          mouseX >= this.x_c() - r_p &&
          mouseX <= this.x_c() + r_p &&
          mouseY <= this.y_c() + 3*r_p &&
          mouseY >= this.y_c() + r_p
      ){
        // tile south
        console.log("south");
        x = this.x;
        y = this.y + 1;
      }
      else if (
          mouseX >= this.x_c() - r_p &&
          mouseX <= this.x_c() + r_p &&
          mouseY <= this.y_c() - r_p &&
          mouseY >= this.y_c() - 3*r_p
      ) {
        // north tile
        console.log("north");
        x = this.x;
        y = this.y - 1;
      }
      else if (
          mouseX >= this.x_c() + .5*x_spacing - r_p&&
          mouseX <= this.x_c() + .5*x_spacing + r_p &&
          mouseY <= this.y_c() &&
          mouseY >= this.y_c() - 2*r_p
      ) {
        // north east
        console.log("north east");
        x = this.x + .5;
        y = this.y - .5;
      }
      else if (
          mouseX >= this.x_c() + .5*x_spacing - r_p&&
          mouseX <= this.x_c() + .5*x_spacing + r_p &&
          mouseY <= this.y_c() + 2*r_p &&
          mouseY >= this.y_c()
      ) {
        // south east
        x = this.x + .5;
        y = this.y + .5;
      }
      else if (
          mouseX >= this.x_c() - .5*x_spacing - r_p&&
          mouseX <= this.x_c() - .5*x_spacing + r_p &&
          mouseY <= this.y_c() + 2*r_p &&
          mouseY >= this.y_c()
      ) {
        // south west
        x = this.x - .5;
        y = this.y + .5;
      }
      else if (
          mouseX >= this.x_c() - .5*x_spacing - r_p&&
          mouseX <= this.x_c() - .5*x_spacing + r_p &&
          mouseY <= this.y_c() &&
          mouseY >= this.y_c() - 2*r_p
      ) {
        // north west
        x = this.x - .5;
        y = this.y - .5;
      }

      if (x && y) {
        let tile;
        let hash = `${x}, ${y}`;
        if (!(hash in tiles_cache)){
          tile = new Tile(x, y);
        } else {
          tile = tiles_cache[hash];
        }
        tile.isCharacterHere = true;
        tile.generate_surrounding();
        this.isCharacterHere = false;
      }



    }



    }

  return this;
}

function init() {
  if (localStorage.tiles){
    // let starting_tile = new Tile(4.5,4.5,"city");
    // starting_tile.isCharacterHere = true;
    // starting_tile.generate_surrounding();
    let tile_data = JSON.parse(localStorage.getItem("tiles"));
    for (let i=0; i<tile_data.length; i++){
      let tile = new Tile(tile_data[i].x, tile_data[i].y, tile_data[i].type);
      tile.isCharacterHere = tile_data[i].isCharacterHere;
      tiles_cache[tile.hash] = tile;
      tiles.push(tile);
    }
  } else {
    let starting_tile = new Tile(4.5,4.5,"city");
    starting_tile.isCharacterHere = true;
    starting_tile.generate_surrounding();
  }
  draw();
}
resizeCanvas();
addEventListeners();
calculate();
init();

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

function draw() {
  ctx.save();
  ctx.scale(dpi, dpi);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  ctx.strokeStyle = lineColor;
  ctx.translate(-0.5, -0.5);

  let x_pts = [];
  let y_pts = [];
  let x_prime_pts = [];
  let y_prime_pts = [];

  for (let x = right - .5*x_spacing; x > 0; x -= x_spacing) {
    x_prime_pts.push(x);
    x_pts.push(x-.5*x_spacing);
  }

  for (let x = right; x < width; x += x_spacing) {
    x_pts.push(x);
    x_prime_pts.push(x+.5*x_spacing);
  }

  for (let y = bottom - .5*y_spacing; y > 0; y -= y_spacing) {
    y_prime_pts.push(y);
    y_pts.push(y - .5*y_spacing);
  }

  for (let y = bottom; y < height; y += y_spacing) {
    y_pts.push(y);
    y_prime_pts.push(y + .5*y_spacing);
  }

  for (let i=0; i < x_pts.length; i++){
    for (let j=0; j < y_pts.length; j++){
      drawHexagon(x_pts[i], y_pts[j]);
      drawHexagon(x_prime_pts[i], y_prime_pts[j]);
    }
  }

  tiles.forEach(tile => tile.draw());
  ctx.fillRect(mouseX, mouseY, 10, 10);
  ctx.restore();

  localStorage.setItem("tiles", JSON.stringify(tiles));
}

function drawHexagon(x, y, color) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(x + r * Math.cos(a * i), y + r * Math.sin(a * i));
  }
  ctx.closePath();
  ctx.stroke();
  if (color){
    ctx.fillStyle = color;
    ctx.fill();
  }
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