let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");

let width = window.innerWidth * .95;
let height = window.innerHeight * .90;

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

let currentLevel = 0;

let numTilesWide = Math.floor(width/(cellSize*scale));
let numTilesTall = Math.floor(height/(cellSize*scale));

let isOutside = true;
let hexTiles = [];
let hexTilesCache = {};

const a = 2 * Math.PI / 6;
const r = cellSize;
const r_p = r * Math.cos(Math.PI / 6);
let x_spacing = 6*r*Math.cos(a);
let y_spacing = 2*r*Math.sin(a);
let characterHexPosition = [];
let currentHexTile;

let timeInDungeon = 0;
let travelDays = 0;
let status = "";

function init() {
  resizeCanvas();
  addEventListeners();
  calculate();
  // load();
  loadHex();
  drawHex();
}

function randomStatus(){
  let roll = Math.random() * 100;
  if (currentHexTile && currentHexTile.type !== "city" && roll < 10){
    status = "Monster!";
  } else {
    status = "No Event";
  }
  document.getElementById("status").innerHTML = (`
        ${travelDays / 2} days traveled - ${status}
      `);
}

function HexTile(x, y, type){
  this.x = x;
  this.y = y;
  this.hash = `${this.x}, ${this.y}`;
  this.contents = "";

  this.rooms = [];
  this.dungeonTiles = new Set();

  if (type === "red") {
    this.contents = "city";
  } else {
    let roll = Math.random() * 100;
    if (roll < 5){
      this.contents = "dungeon";
    }
  }

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

  hexTilesCache[this.hash] = this;
  hexTiles.push(this);

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
    if (!(`${x}, ${y}` in hexTilesCache)){
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
      new HexTile(x, y, new_type);
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
      if (currentHexTile !== this){
        randomStatus();
        travelDays++;
        currentHexTile = this;
      }

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
        if (!(hash in hexTilesCache)){
          tile = new HexTile(x, y);
        } else {
          tile = hexTilesCache[hash];
        }
        tile.isCharacterHere = true;
        tile.generate_surrounding();
        this.isCharacterHere = false;
      }



    }
    if (this.contents === "dungeon"){
      ctx.beginPath();
      ctx.fillStyle = "black";
      ctx.fillText("🏰", this.x_c(), this.y_c());
    }
  }

  return this;
}

function drawHex() {
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

  hexTiles.forEach(tile => tile.draw(ctx));
  ctx.restore();

  localStorage.setItem("tiles", JSON.stringify(hexTiles));
  localStorage.setItem("travelDays", travelDays);
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

function loadHex(){
  if (localStorage.tiles){
    let hex_tile_data = JSON.parse(localStorage.getItem("tiles"));
    for (let i=0; i<hex_tile_data.length; i++){
      let hexTile = new HexTile(hex_tile_data[i].x, hex_tile_data[i].y, hex_tile_data[i].type);
      hexTile.isCharacterHere = hex_tile_data[i].isCharacterHere;
      hexTile.contents = hex_tile_data[i].contents;

      if (hexTile.contents === "dungeon"){
        let rooms_data = hex_tile_data[i].rooms;

        for (let j=0; j < rooms_data.length; j++){
          let this_rooms_tiles = [];
          for (let k=0; k < rooms_data[j].tiles.length; k++) {
            let tile_data = rooms_data[j].tiles[k];
            let tile = new Tile(hexTile, tile_data.x, tile_data.y, tile_data.z, tile_data.loc);
            tile.real = tile_data.real;
            tile.hash = tile_data.hash;
            tile.isCont = tile_data.isCont;
            tile.top = tile_data.top;
            tile.right = tile_data.right;
            tile.left = tile_data.left;
            tile.bottom = tile_data.bottom;
            hexTile.dungeonTiles.add(tile.hash);
            this_rooms_tiles.push(tile);
          }
          let room = new Room(
            hexTile,
            rooms_data[j].x,
            rooms_data[j].y,
            rooms_data[j].z,
            rooms_data[j].h,
            rooms_data[j].w,
            rooms_data[j].entrance,
            rooms_data[j].type,
            this_rooms_tiles
          );
          room.characterIsHere = rooms_data[j].characterIsHere;
          room.entranceTileLoc = rooms_data[j].entranceTileLoc;
          room.flip = rooms_data[j].flip;
          hexTile.rooms.push(room);
        }

      }

      if (hexTile.isCharacterHere){
        characterHexPosition = [hexTile.x, hexTile.y];
        currentHexTile = hexTile;
      }
    }
  } else {
    let starting_tile = new HexTile(4.5,4.5,"city");
    starting_tile.isCharacterHere = true;
    starting_tile.generate_surrounding();
  }

  if (localStorage.getItem("travelDays")){
    travelDays = localStorage.getItem("travelDays");
    randomStatus();
  }
}

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
  if (num <= 45) {
    // hallway
    length = Math.floor(Math.random()*10) + 6;
    width = 1;
  }
  else if (num <= 80) {
    // room
    length = Math.floor(Math.random()*5) + 1;
    width = Math.floor(Math.random()*5) + 1;
  }
  else if (num <= 90) {
    // large room
    length = Math.floor(Math.random()*10) + 5;
    width = Math.floor(Math.random()*10) + 5;
  }
  else if (num <= 100) {
    // stairs
    length = 2;
    width = 1;
    type = "stairs";
  }
  else {
    // trap
    length = 1;
    width = 1;
  }
  return [length, width, type];
}

function Tile(hexTile, x, y, z, loc) {
  this.x = x;
  this.y = y;
  this.z = z;

  this.left = 0;
  this.top = 0;
  this.right = 0;
  this.bottom = 0;
  const hash = `${this.x}, ${this.y}, ${this.z}`;
  this.real = !hexTile.dungeonTiles.has(hash);
  hexTile.dungeonTiles.add(hash);

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
        if (!hexTile.dungeonTiles.has(`${this.x - 1}, ${this.y}, ${this.z}`)) {
          let [nextW, nextH, type] = behind_door();
          hexTile.rooms.push(
              new Room(
                  hexTile,
                  this.x - nextW,
                  this.y + Math.floor(nextH / 2),
                  this.z,
                  nextH,
                  nextW,
                  "east",
                  type
              )
          );
          if (type === "stairs") {
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x - nextW,
                  this.y + Math.floor(nextH / 2),
                  this.z + 1,
                  nextH,
                  nextW,
                  "east",
                  "stairs_up"
              )
            );
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x - nextW - 3,
                  this.y + Math.floor(nextH / 2) + 1,
                  this.z + 1,
                  3,
                  3,
                  "east",
                  "room"
              )
            );
            currentLevel += 1;
          }
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
        if (!hexTile.dungeonTiles.has(`${this.x + 1}, ${this.y}, ${this.z}`)) {
          let [nextW, nextH, type] = behind_door();
          hexTile.rooms.push(
              new Room(
                  hexTile,
                  this.x + 1,
                  this.y + Math.floor(nextH / 2),
                  this.z,
                  nextH,
                  nextW,
                  "west",
                  type
              )
          );
          if (type === "stairs") {
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x + 1,
                  this.y,
                  this.z + 1,
                  nextH,
                  nextW,
                  "west",
                  "stairs_up"
              )
            );
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x + 3,
                  this.y + 1,
                  this.z + 1,
                  3,
                  3,
                  "west",
                  "room"
              )
            );
            currentLevel += 1;
          }
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
        if (!hexTile.dungeonTiles.has(`${this.x}, ${this.y - 1}, ${this.z}`)) {
          let [nextH, nextW, type] = behind_door();
          hexTile.rooms.push(
              new Room(
                  hexTile,
                  this.x - Math.floor(nextW / 2),
                  this.y - 1,
                  this.z,
                  nextH,
                  nextW,
                  "south",
                  type
              )
          );
          if (type === "stairs") {
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x,
                  this.y - 1,
                  this.z + 1,
                  nextH,
                  nextW,
                  "south",
                  "stairs_up"
              )
            );
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x - 1,
                  this.y - 1 - 2,
                  this.z + 1,
                  3,
                  3,
                  "south",
                  "room"
              )
            );
            currentLevel += 1;
          }
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
        if (!hexTile.dungeonTiles.has(`${this.x}, ${this.y + 1}, ${this.z}`)) {
          let [nextH, nextW, type] = behind_door();
          hexTile.rooms.push(
              new Room(
                  hexTile,
                  this.x - Math.floor(nextW / 2),
                  this.y + nextH,
                  this.z,
                  nextH,
                  nextW,
                  "north",
                  type
              )
          );
          if (type === "stairs") {
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x,
                  this.y + 2,
                  this.z + 1,
                  nextH,
                  nextW,
                  "north",
                  "stairs_up"
              )
            );
            hexTile.rooms.push(
                new Room(
                    hexTile,
                  this.x - 1,
                  this.y + 2 + 3,
                  this.z + 1,
                  3,
                  3,
                  "north",
                  "room"
              )
            );
            currentLevel += 1;
          }
        }
      }
    }

    ctx.stroke();
  }
  return this;
}

async function generateMonster(){
  let level = document.getElementById("level").value;
  // CR 1 = 200 xp
  const encounter_difficulty = [
      //easy, medium, difficult, deadly
      [25, 50, 75, 100],
      [50, 100, 150, 200],
      [75, 150, 225, 400],
      [125, 250, 375, 500],
      [250, 500, 750, 1100],
      [300, 600, 900, 1400],
      [350, 750, 1100, 1700],
      [450, 900, 1400, 2100],
      [550, 1100, 1600, 2400],
      [600, 1200, 1900, 2800]
  ];
  let roll = Math.floor(Math.random()*100);
  roll *= (1 + currentLevel*.5);
  let difficulty;
  if (roll < 60){
    difficulty = 0;
  } else if (roll < 90) {
    difficulty = 1;
  } else if (roll < 97) {
    difficulty = 2;
  } else {
    difficulty = 3;
  }
  let xp = encounter_difficulty[level - 1][difficulty];

  let num_monsters = Math.ceil(Math.random() * 2);
  let multiplier = 1;
  if (num_monsters === 2){
    multiplier = 1.5;
  }
  let monster_xp = xp / num_monsters;

  let monster_cr = monster_xp / 200;
  if (monster_cr < 0.50){
    monster_cr = .25;
  } else if (monster_cr < 1) {
    monster_cr = .5;
  } else {
    monster_cr = Math.floor(monster_cr);
  }

  let monster_key;
  await fetch(`https://www.dnd5eapi.co/api/monsters/?challenge_rating=${monster_cr}`)
    .then(response => response.json())
    .then(data => {
      let num_results = data["count"];
      let random_monster = Math.floor(Math.random() * num_results);
      monster_key = data["results"][random_monster]["index"];
    })
    .catch(error => console.error(error));

  await fetch(`https://www.dnd5eapi.co/api/monsters/${monster_key}`)
    .then(response => response.json())
      .then(monster => {
        let card = (
            `
              <div>
                  <h3>${num_monsters} ${monster.name} ${monster.xp * num_monsters * multiplier} XP</h3>
                  <p><b>${monster.size} ${monster.type} ${monster.alignment}</b></p>
                  <p>AC: ${monster.armor_class[0].value}, HP: ${monster.hit_points}, Speed: ${monster.speed.walk}</p>
                  <p>Str: ${monster.strength}, Dex: ${monster.dexterity}, Con: ${monster.constitution}, Int: ${monster.intelligence}, Wis: ${monster.wisdom}, Cha: ${monster.charisma}</p>
                  <p><b>Actions:</b></p>
            `
        );

        monster.actions.forEach(action => {
          card += (`
              <p><b>${action.name}</b></p>
              <p>${action.desc}</p>
              <hr>
              <form>
              <div class="form-group">
              `);

        });
        for (let i=0; i < num_monsters; i++){
          card += (`

              <label for="quantity">Monster ${i+1} HP</label>
              <input class="form-control" type="number" id="quantity" name="quantity" value="${monster.hit_points}">
            
          `)
        }
        card += (`
            </div>
            </form>
            
        `);

        card += `</div>`;
        document.getElementById("monster").innerHTML = card;
      })
    .catch(error => console.error(error));
}

function Room(hexTile, x, y, z, h, w, entrance, type, tiles) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.h = h;
  this.w = w;
  this.type = type;
  this.entrance = entrance;
  this.flip = (Math.floor(Math.random()*10) % 2);
  if (type !== "stairs" && type !== "stairs_up") {
    hexTile.rooms.forEach(room => room.characterIsHere = false);
    this.characterIsHere = true;
  }
  this.entranceTileLoc = 0;
  if (tiles === undefined || tiles.length == 0) {
    this.tiles = [];
  } else {
    this.tiles = tiles;
  }

  this.contents = "";

  timeInDungeon++;

  // Generate the room's contents
  if (this.characterIsHere) {
    let roll = Math.floor(Math.random() * 20) + 1;
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
      } else if (roll <= 19) {
        this.contents = "Trick or Trap";
      } else {
        this.contents = "Wandering Monster";
      }
    }
  }

  // construct all the room's tiles starting in the lower left hand corner and working up then to the right
  if (tiles === undefined || tiles.length == 0) {
    let loc = 0;
    for (let dx = 0; dx < this.w; dx++) {
      for (let dy = 0; dy < this.h; dy++) {
        let tile = new Tile(hexTile, this.x + dx, this.y - dy, this.z, loc);
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
  if (type !== "stairs" && type !== "stairs_up" && (tiles === undefined || tiles.length == 0)) {
    let directions = ["south", "west", "north", "east"];
    for (let i in directions) {
      let direction = directions[i];
      if (entrance !== direction) {
        if (hexTile.rooms.length === 1 || Math.random() * 100 < 50) {
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

    if (this.type === "stairs" || this.type === "stairs_up"){
      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;

      if (entrance === "north" || entrance === "south"){
        // stairs are vertical
        if (this.flip) {
          // base on north side
          ctx.moveTo(this.x * cellSize * scale + right, (this.y - 2) * cellSize * scale + bottom);
          ctx.lineTo((this.x + 0.5) * cellSize * scale + right, (this.y) * cellSize * scale + bottom);
          ctx.lineTo((this.x + 1) * cellSize * scale + right, (this.y - 2) * cellSize * scale + bottom);
        } else {
          // base on south side
          ctx.moveTo(this.x * cellSize * scale + right, this.y * cellSize * scale + bottom);
          ctx.lineTo((this.x + 0.5) * cellSize * scale + right, (this.y - 2) * cellSize * scale + bottom);
          ctx.lineTo((this.x + 1) * cellSize * scale + right, this.y * cellSize * scale + bottom);
        }

      } else {
        //stairs are horizontal
        if (this.flip) {
          // base on west side
          ctx.moveTo(this.x * cellSize * scale + right, this.y * cellSize * scale + bottom);
          ctx.lineTo((this.x + 2) * cellSize * scale + right, (this.y - .5) * cellSize * scale + bottom);
          ctx.lineTo((this.x) * cellSize * scale + right, (this.y - 1) * cellSize * scale + bottom);
        } else {
          // base on east side
          ctx.moveTo((this.x+2) * cellSize * scale + right, this.y * cellSize * scale + bottom);
          ctx.lineTo((this.x) * cellSize * scale + right, (this.y - .5) * cellSize * scale + bottom);
          ctx.lineTo((this.x+2) * cellSize * scale + right, (this.y - 1) * cellSize * scale + bottom);
        }
      }
      ctx.closePath();
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

      document.getElementById("status").innerHTML = (`
        ${5 * (timeInDungeon)} minutes - ${this.contents}
      `);

    }

  }

  return this;
}

// Draws the grid
function draw(hexTile) {

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
  if (hexTile.rooms.length === 0){
    let stairs = new Room(hexTile, Math.floor(numTilesWide / 2) - 1, numTilesTall - 4, 0, 2, 1, "south", "stairs_up");
    hexTile.rooms.push(stairs);

    let myRoom = new Room(hexTile, Math.floor(numTilesWide / 2) - 2, numTilesTall - 6, 0, 5, 3, "south");
    hexTile.rooms.push(myRoom);
  }
  hexTile.rooms.forEach(room => {
    if (room.z === currentLevel) {
      room.draw(ctx)
    }
  });

  ctx.restore();

  localStorage.setItem("tiles", JSON.stringify(hexTiles));
  document.getElementById("levelNum").innerText = `Level ${currentLevel + 1}`;
}

function reset(){
  localStorage.clear();
  location.reload();
}

function update() {
  ctx.clearRect(0, 0, width * dpi, height * dpi);
  if (isOutside === false && currentHexTile.contents === "dungeon") {
    draw(currentHexTile);
  } else {
    drawHex()
  }
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

function upOneLevel(){
  currentLevel -= 1;
  update();
}
document.getElementById('upOneLevel').addEventListener('click', upOneLevel);

function downOneLevel(){
  currentLevel += 1;
  update();
}
document.getElementById('downOneLevel').addEventListener('click', downOneLevel);

function leaveDungeon(){
  if (isOutside === false) {
    [right, left, _top, bottom] = last_zoom;
    currentLevel = 0;
    isOutside = true;
    update();
  }
}
document.getElementById('leaveDungeon').addEventListener('click', leaveDungeon);

let last_zoom = [];
function enterDungeon(){
  if (currentHexTile.contents === "dungeon"){
    currentLevel = 0;
    timeInDungeon = 0;
    isOutside = false;
    last_zoom = [right, left, _top, bottom];
    right = 0;
    _top = 0;
    left = 0
    bottom = 0;
    update();
  }
}
document.getElementById('enterDungeon').addEventListener('click', enterDungeon);

document.getElementById('monsterButton').addEventListener('click', generateMonster);

init();
