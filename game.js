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

function randomPurpose(dungeonType) {
  function general(){
    let roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= 1) {
        return "Antechamber";
    } else if (roll <= 3) {
        return "Armory";
    } else if (roll <= 4) {
        return "Audience chamber";
    } else if (roll <= 5) {
        return "Aviary";
    } else if (roll <= 7) {
        return "Banquet room";
    } else if (roll <= 10) {
        return "Barracks";
    } else if (roll <= 11) {
        return "Bath or latrine";
    } else if (roll <= 12) {
        return "Bedroom";
    } else if (roll <= 13) {
        return "Bestiary";
    } else if (roll <= 16) {
        return "Cell";
    } else if (roll <= 17) {
        return "Chantry";
    } else if (roll <= 18) {
        return "Chapel";
    } else if (roll <= 20) {
        return "Cistern";
    } else if (roll <= 21) {
        return "Classroom";
    } else if (roll <= 22) {
        return "Closet";
    } else if (roll <= 24) {
        return "Conjuring room";
    } else if (roll <= 26) {
        return "Court";
    } else if (roll <= 29) {
        return "Crypt";
    } else if (roll <= 31) {
        return "Dining room";
    } else if (roll <= 33) {
        return "Divination room";
    } else if (roll <= 34) {
        return "Dormitory";
    } else if (roll <= 35) {
        return "Dressing room";
    } else if (roll <= 36) {
        return "Entry room or vestibule";
    } else if (roll <= 38) {
        return "Gallery";
    } else if (roll <= 40) {
        return "Game room";
    } else if (roll <= 43) {
        return "Guardroom";
    } else if (roll <= 45) {
        return "Hall";
    } else if (roll <= 47) {
        return "Hall, great";
    } else if (roll <= 49) {
        return "Hallway";
    } else if (roll <= 50) {
        return "Kennel";
    } else if (roll <= 52) {
        return "Kitchen";
    } else if (roll <= 54) {
        return "Laboratory";
    } else if (roll <= 57) {
        return "Library";
    } else if (roll <= 59) {
        return "Lounge";
    } else if (roll <= 60) {
        return "Meditation chamber";
    } else if (roll <= 61) {
        return "Observatory";
    } else if (roll <= 62) {
        return "Office";
    } else if (roll <= 64) {
        return "Pantry";
    } else if (roll <= 66) {
        return "Pen or prison";
    } else if (roll <= 68) {
        return "Reception room";
    } else if (roll <= 70) {
        return "Refectory";
    } else if (roll <= 71) {
        return "Robing room";
    } else if (roll <= 72) {
        return "Salon";
    } else if (roll <= 74) {
        return "Shrine";
    } else if (roll <= 76) {
        return "Sitting room";
    } else if (roll <= 78) {
        return "Smithy";
    } else if (roll <= 79) {
        return "Stable";
    } else if (roll <= 81) {
        return "Storage room";
    } else if (roll <= 83) {
        return "Strong room or vault";
    } else if (roll <= 85) {
        return "Study";
    } else if (roll <= 88) {
        return "Temple";
    } else if (roll <= 90) {
        return "Throne room";
    } else if (roll <= 91) {
        return "Torture chamber";
    } else if (roll <= 93) {
        return "Training or exercise room";
    } else if (roll <= 95) {
        return "Trophy room or museum";
    } else if (roll <= 96) {
        return "Waiting room";
    } else if (roll <= 97) {
        return "Nursery or schoolroom";
    } else if (roll <= 98) {
        return "Well";
    } else if (roll <= 100) {
        return "Workshop";
    }
  }
  function lair(){
    let roll = Math.floor(Math.random() * 20) + 1;
    if (roll === 1) {
      return "Armory stocked with weapons and armor";
  } else if (roll === 2) {
      return "Audience chamber, used to receive guests";
  } else if (roll === 3) {
      return "Banquet room for important celebrations";
  } else if (roll === 4) {
      return "Barracks where the lair’s defenders are quartered";
  } else if (roll === 5) {
      return "Bedroom, for use by leaders";
  } else if (roll === 6) {
      return "Chapel where the lair’s inhabitants worship";
  } else if (roll === 7) {
      return "Cistern or well for drinking water";
  } else if (roll <= 9) {
      return "Guardroom for the defense of the lair";
  } else if (roll === 10) {
      return "Kennel for pets or guard beasts";
  } else if (roll === 11) {
      return "Kitchen for food storage and preparation";
  } else if (roll === 12) {
      return "Pen or prison where captives are held";
  } else if (roll <= 14) {
      return "Storage, mostly nonperishable goods";
  } else if (roll === 15) {
      return "Throne room where the lair’s leaders hold court";
  } else if (roll === 16) {
      return "Torture chamber";
  } else if (roll === 17) {
      return "Training and exercise room";
  } else if (roll === 18) {
      return "Trophy room or museum";
  } else if (roll === 19) {
      return "Latrine or bath";
  } else if (roll === 20) {
      return "Workshop for the construction of weapons, armor, tools, and other goods";
  }
  }
  function maze(){
    let roll = Math.floor(Math.random() * 20) + 1;
    if (roll === 1) {
      return "Conjuring room, used to summon creatures that guard the maze";
  } else if (roll <= 5) {
      return "Guardroom for sentinels that patrol the maze";
  } else if (roll <= 10) {
      return "Lair for guard beasts that patrol the maze";
  } else if (roll === 11) {
      return "Pen or prison accessible only by secret door, used to hold captives condemned to the maze";
  } else if (roll === 12) {
      return "Shrine dedicated to a god or other entity";
  } else if (roll <= 14) {
      return "Storage for food, as well as tools used by the maze’s guardians to keep the complex in working order";
  } else if (roll <= 18) {
      return "Trap to confound or kill those sent into the maze";
  } else if (roll === 19) {
      return "Well that provides drinking water";
  } else if (roll === 20) {
      return "Workshop where doors, torch sconces, and other furnishings are repaired and maintained";
  }
  }
  function mine(){
    let roll = Math.floor(Math.random() * 20) + 1;
    if (roll <= 2) {
      return "Barracks for miners";
  } else if (roll === 3) {
      return "Bedroom for a supervisor or manager";
  } else if (roll === 4) {
      return "Chapel dedicated to a patron deity of miners, earth, or protection";
  } else if (roll === 5) {
      return "Cistern providing drinking water for miners";
  } else if (roll <= 7) {
      return "Guardroom";
  } else if (roll === 8) {
      return "Kitchen used to feed workers";
  } else if (roll === 9) {
      return "Laboratory used to conduct tests on strange minerals extracted from the mine";
  } else if (roll <= 15) {
      return "Lode where metal ore is mined (75 percent chance of being depleted)";
  } else if (roll === 16) {
      return "Office used by the mine supervisor";
  } else if (roll === 17) {
      return "Smithy for repairing damaged tools";
  } else if (roll <= 19) {
      return "Storage for tools and other equipment";
  } else if (roll === 20) {
      return "Strong room or vault used to store ore for transport to the surface";
  }
  }
  function planarGate(){
    let roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= 3) {
      return "Decorated foyer or antechamber";
  } else if (roll <= 8) {
      return "Armory used by the portal’s guardians";
  } else if (roll <= 10) {
      return "Audience chamber for receiving visitors";
  } else if (roll <= 19) {
      return "Barracks used by the portal’s guards";
  } else if (roll <= 23) {
      return "Bedroom for use by the high-ranking members of the order that guards the portal";
  } else if (roll <= 30) {
      return "Chapel dedicated to a deity or deities related to the portal and its defenders";
  } else if (roll <= 35) {
      return "Cistern providing fresh water";
  } else if (roll <= 38) {
      return "Classroom for use of initiates learning about the portal’s secrets";
  } else if (roll === 39) {
      return "Conjuring room for summoning creatures used to investigate or defend the portal";
  } else if (roll <= 41) {
      return "Crypt where the remains of those that died guarding the portal are kept";
  } else if (roll <= 47) {
      return "Dining room";
  } else if (roll <= 50) {
      return "Divination room used to investigate the portal and events tied to it";
  } else if (roll <= 55) {
      return "Dormitory for visitors and guards";
  } else if (roll <= 57) {
      return "Entry room or vestibule";
  } else if (roll <= 59) {
      return "Gallery for displaying trophies and objects related to the portal and those that guard it";
  } else if (roll <= 67) {
      return "Guardroom to protect or watch over the portal";
  } else if (roll <= 72) {
      return "Kitchen";
  } else if (roll <= 77) {
      return "Laboratory for conducting experiments relating to the portal and creatures that emerge from it";
  } else if (roll <= 80) {
      return "Library holding books about the portal’s history";
  } else if (roll <= 85) {
      return "Pen or prison for holding captives or creatures that emerge from the portal";
  } else if (roll <= 87) {
      return "Planar junction, where the gate to another plane once stood (25 percent chance of being active)";
  } else if (roll <= 90) {
      return "Storage";
  } else if (roll === 91) {
      return "Strong room or vault, for guarding valuable treasures connected to the portal or funds used to pay the planar gate’s guardians";
  } else if (roll <= 93) {
      return "Study";
  } else if (roll === 94) {
      return "Torture chamber, for questioning creatures that pass through the portal or that attempt to clandestinely use it";
  } else if (roll <= 98) {
      return "Latrine or bath";
  } else if (roll <= 100) {
      return "Workshop for constructing tools and gear needed to study the portal";
  }
  
  }
  function stronghold(){
    let roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= 2) {
      return "Antechamber where visitors seeking access to the stronghold wait";
  } else if (roll <= 5) {
      return "Armory holding high-quality gear, including light siege weapons such as ballistas";
  } else if (roll === 6) {
      return "Audience chamber used by the master of the stronghold to receive visitors";
  } else if (roll === 7) {
      return "Aviary or zoo for keeping exotic creatures";
  } else if (roll <= 11) {
      return "Banquet room for hosting celebrations and guests";
  } else if (roll <= 15) {
      return "Barracks used by elite guards";
  } else if (roll === 16) {
      return "Bath outfitted with a marble floor and other luxurious accoutrements";
  } else if (roll === 17) {
      return "Bedroom for use by the stronghold’s master or important guests";
  } else if (roll === 18) {
      return "Chapel dedicated to a deity associated with the stronghold’s master";
  } else if (roll <= 21) {
      return "Cistern providing drinking water";
  } else if (roll <= 25) {
      return "Dining room for intimate gatherings or informal meals";
  } else if (roll === 26) {
      return "Dressing room featuring a number of wardrobes";
  } else if (roll <= 29) {
      return "Gallery for the display of expensive works of art and trophies";
  } else if (roll <= 32) {
      return "Game room used to entertain visitors";
  } else if (roll <= 50) {
      return "Guardroom";
  } else if (roll === 51) {
      return "Kennel where monsters or trained animals that protect the stronghold are kept";
  } else if (roll <= 57) {
      return "Kitchen designed to prepare exotic foods for large numbers of guests";
  } else if (roll <= 61) {
      return "Library with an extensive collection of rare books";
  } else if (roll === 62) {
      return "Lounge used to entertain guests";
  } else if (roll <= 70) {
      return "Pantry, including cellar for wine or spirits";
  } else if (roll <= 74) {
      return "Sitting room for family and intimate guests";
  } else if (roll <= 78) {
      return "Stable";
  } else if (roll <= 86) {
      return "Storage for mundane goods and supplies";
  } else if (roll === 87) {
      return "Strong room or vault for protecting important treasures (75 percent chance of being hidden behind a secret door)";
  } else if (roll <= 92) {
      return "Study, including a writing desk";
  } else if (roll === 93) {
      return "Throne room, elaborately decorated";
  } else if (roll <= 96) {
      return "Waiting room where lesser guests are held before receiving an audience";
  } else if (roll <= 98) {
      return "Latrine or bath";
  } else if (roll <= 100) {
      return "Crypt belonging to the stronghold’s master or someone else of importance";
  }
  
  }
  function temple(){
    let roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= 3) {
      return "Armory filled with weapons and armor, battle banners, and pennants";
  } else if (roll <= 5) {
      return "Audience chamber where priests of the temple receive commoners and low-ranking visitors";
  } else if (roll <= 7) {
      return "Banquet room used for celebrations and holy days";
  } else if (roll <= 10) {
      return "Barracks for the temple’s military arm or its hired guards";
  } else if (roll <= 14) {
      return "Cells where the faithful can sit in quiet contemplation";
  } else if (roll <= 24) {
      return "Central temple built to accommodate rituals";
  } else if (roll <= 28) {
      return "Chapel dedicated to a lesser deity associated with the temple’s major deity";
  } else if (roll <= 31) {
      return "Classroom used to train initiates and priests";
  } else if (roll <= 34) {
      return "Conjuring room, specially sanctified and used to summon extraplanar creatures";
  } else if (roll <= 40) {
      return "Crypt for a high priest or similar figure, hidden and heavily guarded by creatures and traps";
  } else if (roll <= 42) {
      return "Dining room (large) for the temple’s servants and lesser priests";
  } else if (roll === 43) {
      return "Dining room (small) for the temple’s high priests";
  } else if (roll <= 46) {
      return "Divination room, inscribed with runes and stocked with soothsaying implements";
  } else if (roll <= 50) {
      return "Dormitory for lesser priests or students";
  } else if (roll <= 56) {
      return "Guardroom";
  } else if (roll === 57) {
      return "Kennel for animals or monsters associated with the temple’s deity";
  } else if (roll <= 60) {
      return "Kitchen (might bear a disturbing resemblance to a torture chamber in an evil temple)";
  } else if (roll <= 65) {
      return "Library, well stocked with religious treatises";
  } else if (roll <= 68) {
      return "Prison for captured enemies (in good or neutral temples) or those designated as sacrifices (in evil temples)";
  } else if (roll <= 73) {
      return "Robing room containing ceremonial outfits and items";
  } else if (roll === 74) {
      return "Stable for riding horses and mounts belonging to the temple, or for visiting messengers and caravans";
  } else if (roll <= 79) {
      return "Storage holding mundane supplies";
  } else if (roll === 80) {
      return "Strong room or vault holding important relics and ceremonial items, heavily trapped";
  } else if (roll <= 82) {
      return "Torture chamber, used in inquisitions (in good or neutral temples with a lawful bent) or for the sheer joy of causing pain (evil temples)";
  } else if (roll <= 89) {
      return "Trophy room where art celebrating key figures and events from mythology is displayed";
  } else if (roll === 90) {
      return "Latrine or bath";
  } else if (roll <= 94) {
      return "Well for drinking water, defendable in the case of attack or siege";
  } else if (roll <= 100) {
      return "Workshop for repairing or creating weapons, religious items, and tools";
  }
  
  }
  function tomb(){
    let roll = Math.floor(Math.random() * 20) + 1;
    if (roll === 1) {
      return "Antechamber for those that have come to pay respect to the dead or prepare themselves for burial rituals";
  } else if (roll <= 3) {
      return "Chapel dedicated to deities that watch over the dead and protect their resting places";
  } else if (roll <= 8) {
      return "Crypt for less important burials";
  } else if (roll === 9) {
      return "Divination room, used in rituals to contact the dead for guidance";
  } else if (roll === 10) {
      return "False crypt (trapped) to kill or capture thieves";
  } else if (roll === 11) {
      return "Gallery to display the deeds of the deceased through trophies, statues, paintings and so forth";
  } else if (roll === 12) {
      return "Grand crypt for a noble, high priest, or other important individual";
  } else if (roll <= 14) {
      return "Guardroom, usually guarded by undead, constructs, or other creatures that don’t need to eat or sleep";
  } else if (roll === 15) {
      return "Robing room for priests to prepare for burial rituals";
  } else if (roll <= 17) {
      return "Storage, stocked with tools for maintaining the tomb and preparing the dead for burial";
  } else if (roll === 18) {
      return "Tomb where the wealthiest and most important folk are interred, protected by secret doors and traps";
  } else if (roll <= 20) {
      return "Workshop for embalming the dead";
  }
  
  }
  function treasureVault(){
    let roll = Math.floor(Math.random() * 20) + 1;
    if (roll === 1) {
      return "Antechamber for visiting dignitaries";
  } else if (roll === 2) {
      return "Armory containing mundane and magic gear used by the treasure vault’s guards";
  } else if (roll <= 4) {
      return "Barracks for guards";
  } else if (roll === 5) {
      return "Cistern providing fresh water";
  } else if (roll <= 9) {
      return "Guardroom to defend against intruders";
  } else if (roll === 10) {
      return "Kennel for trained beasts used to guard the treasure vault";
  } else if (roll === 11) {
      return "Kitchen for feeding guards";
  } else if (roll === 12) {
      return "Watch room that allows guards to observe those who approach the dungeon";
  } else if (roll === 13) {
      return "Prison for holding captured intruders";
  } else if (roll <= 15) {
      return "Strong room or vault, for guarding the treasure hidden in the dungeon, accessible only by locked or secret door";
  } else if (roll === 16) {
      return "Torture chamber for extracting information from captured intruders";
  } else if (roll <= 20) {
      return "Trap or other trick designed to kill or capture creatures that enter the dungeon";
  }
  
  }
  if (dungeonType == null){
    dungeonType = document.getElementById("dungeonType").value;
  }
  
  switch (dungeonType){
    case "general":
      return general()
    case "lair":
      return lair()
    case "maze":
      return maze()
    case "mine":
      return mine()
    case "planarGate":
      return planarGate()
    case "stronghold":
      return stronghold()
    case "temple":
      return temple()
    case "tomb":
      return tomb()
    case "treasureVault":
      return treasureVault()
  }
}

function randomState() {
  let roll = Math.floor(Math.random() * 20) + 1;
  if (roll <= 3) {
    return "Rubble, ceiling partially collapsed";
  } else if (roll <= 5) {
      return "Holes, floor partially collapsed";
  } else if (roll <= 7) {
      return "Ashes, contents mostly burned";
  } else if (roll <= 9) {
      return "Used as a campsite";
  } else if (roll <= 11) {
      return "Pool of water; chamber’s original contents are water damaged";
  } else if (roll <= 16) {
      return "Furniture wrecked but still present";
  } else if (roll <= 18) {
      return `Converted to some other use: ${randomPurpose("general")}`;
  } else if (roll <= 19) {
      return "Stripped bare";
  } else if (roll <= 20) {
      return "Pristine and in original state";
  }
}

function randomContents() {
  let roll = Math.floor(Math.random() * 100) + 1;
  if (roll <= 8) {
    return "Monster (dominant inhabitant)";
  } else if (roll <= 15) {
      return "Monster (dominant inhabitant) with treasure";
  } else if (roll <= 27) {
      return "Monster (pet or ally)";
  } else if (roll <= 33) {
      return "Monster (pet or ally) guarding treasure";
  } else if (roll <= 42) {
      return "Monster (random)";
  } else if (roll <= 50) {
      return "Monster (random) with treasure";
  } else if (roll <= 58) {
      return "Dungeon Hazard";
  } else if (roll <= 63) {
      return "Obstacle";
  } else if (roll <= 73) {
      return "Trap";
  } else if (roll <= 76) {
      return "Trap with treasure";
  } else if (roll <= 80) {
      return "Trick";
  } else if (roll <= 88) {
      return "Empty";
  } else if (roll <= 94) {
      return "Hazard";
  } else if (roll <= 100) {
      return "Treasure";
  }
}

function randomTreasure() {
  let roll = Math.floor(Math.random() * 100) + 1;
  if (roll <= 30) {
    return `${roll/2} cp`;
  } else if (roll <= 60){
    return `${roll/3} sp`;
  } else if (roll <= 70) {
    return `${roll/4} ep`;
  } else if (roll <=95) {
    return `${roll/5} gp`;
  } else {
    return `${roll/10} pp`;
  }
}

function randomHazard() {
  let roll = Math.floor(Math.random() * 20) + 1;
  if (roll <= 3) {
    return `
    Brown Mold

Brown mold feeds on warmth, drawing heat from anything around it. A patch of brown mold typically covers a 10-foot square, and the temperature within 30 feet of it is always frigid.

When a creature moves to within 5 feet of the mold for the first time on a turn or starts its turn there, it must make a DC 12 Constitution saving throw, taking 22 (4d10) cold damage on a failed save, or half as much damage on a successful one.

Brown mold is immune to fire, and any source of fire brought within 5 feet of a patch causes it to instantly expand outward in the direction of the fire, covering a 10-foot-square area (with the source of the fire at the center of that area). A patch of brown mold exposed to an effect that deals cold damage is instantly destroyed.
    
    `;
  } else if (roll <= 8) {
      return `
      Green Slime

This acidic slime devours flesh, organic material, and metal on contact. Bright green, wet, and sticky, it clings to walls, floors, and ceilings in patches.

A patch of green slime covers a 5-foot square, has blindsight out to a range of 30 feet, and drops from walls and ceilings when it detects movement below it. Beyond that, it has no ability to move. A creature aware of the slime’s presence can avoid being struck by it with a successful DC 10 Dexterity saving throw. Otherwise, the slime can’t be avoided as it drops.

A creature that comes into contact with green slime takes 5 (1d10) acid damage. The creature takes the damage again at the start of each of its turns until the slime is scraped off or destroyed. Against wood or metal, green slime deals 11 (2d10) acid damage each round, and any nonmagical wood or metal weapon or tool used to scrape off the slime is effectively destroyed.

Sunlight, any effect that cures disease, and any effect that deals cold, fire, or radiant damage destroys a patch of green slime.
      `;
  } else if (roll <= 10) {
      return "<a href='https://www.dndbeyond.com/monsters/17013-shrieker' target='_blank'>Shrieker</a>";
  } else if (roll <= 15) {
      return `Webs

Giant spiders weave thick, sticky webs across passages and at the bottom of pits to snare prey. These web-filled areas are difficult terrain. Moreover, a creature entering a webbed area for the first time on a turn or starting its turn there must succeed on a DC 12 Dexterity saving throw or become restrained by the webs. A restrained creature can use its action to try to escape, doing so with a successful DC 12 Strength (Athletics) or Dexterity (Acrobatics) check.

Each 10-foot cube of giant webs has AC 10, 15 hit points, vulnerability to fire, and immunity to bludgeoning, piercing, and psychic damage.`;
  } else if (roll <= 17) {
      return "<a href='https://www.dndbeyond.com/monsters/17046-violet-fungus' target='_blank'>Violet fungus</a>";
  } else if (roll <= 20) {
      return `
      Yellow mold grows in dark places, and one patch covers a 5-foot square. If touched, the mold ejects a cloud of spores that fills a 10-foot cube originating from the mold. Any creature in the area must succeed on a DC 15 Constitution saving throw or take 11 (2d10) poison damage and become poisoned for 1 minute. While poisoned in this way, the creature takes 5 (1d10) poison damage at the start of each of its turns. The creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a successful save.

Sunlight or any amount of fire damage instantly destroys one patch of yellow mold.`;
  }
}

function randomTrap(){
  function trigger(){
    let roll = Math.floor(Math.random() * 6) + 1;
    if (roll === 1) {
      return "Stepped on (floor, stairs)";
  } else if (roll === 2) {
      return "Moved through (doorway, hallway)";
  } else if (roll === 3) {
      return "Touched (doorknob, statue)";
  } else if (roll === 4) {
      return "Opened (door, treasure chest)";
  } else if (roll === 5) {
      return "Looked at (mural, arcane symbol)";
  } else if (roll === 6) {
      return "Moved (cart, stone block)";
  }
  }
  function damage(){
    let roll = Math.floor(Math.random() * 6) + 1;
    if (roll <= 2) {
      return "Setback 1d10";
  } else if (roll <= 5) {
      return "Dangerous 2d10";
  } else if (roll === 6) {
      return "Deadly 4d10";
  }
  }
  function effects(){
    let roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= 4) {
      return "Magic missiles shoot from a statue or object";
  } else if (roll <= 7) {
      return "Collapsing staircase creates a ramp that deposits characters into a pit at its lower end";
  } else if (roll <= 10) {
      return "Ceiling block falls, or entire ceiling collapses";
  } else if (roll <= 12) {
      return "Ceiling lowers slowly in locked room";
  } else if (roll <= 14) {
      return "Chute opens in floor";
  } else if (roll <= 16) {
      return "Clanging noise attracts nearby monsters";
  } else if (roll <= 19) {
      return "Touching an object triggers a disintegrate spell";
  } else if (roll <= 23) {
      return "Door or other object is coated with contact poison";
  } else if (roll <= 27) {
      return "Fire shoots out from wall, floor, or object";
  } else if (roll <= 30) {
      return "Touching an object triggers a flesh to stone spell";
  } else if (roll <= 33) {
      return "Floor collapses or is an illusion";
  } else if (roll <= 36) {
      return "Vent releases gas: blinding, acidic, obscuring, paralyzing, poisonous, or sleep-inducing";
  } else if (roll <= 39) {
      return "Floor tiles are electrified";
  } else if (roll <= 43) {
      return "Glyph of warding";
  } else if (roll <= 46) {
      return "Huge wheeled statue rolls down corridor";
  } else if (roll <= 49) {
      return "Lightning bolt shoots from wall or object";
  } else if (roll <= 52) {
      return "Locked room floods with water or acid";
  } else if (roll <= 56) {
      return "Darts shoot out of an opened chest";
  } else if (roll <= 59) {
      return "A weapon, suit of armor, or rug animates and attacks when touched (see “Animated Objects” in the Monster Manual)";
  } else if (roll <= 62) {
      return "Pendulum, either bladed or weighted as a maul, swings across the room or hall";
  } else if (roll <= 67) {
      return "Hidden pit opens beneath characters (25 percent chance that a black pudding or gelatinous cube fills the bottom of the pit)";
  } else if (roll <= 70) {
      return "Hidden pit floods with acid or fire";
  } else if (roll <= 73) {
      return "Locking pit floods with water";
  } else if (roll <= 77) {
      return "Scything blade emerges from wall or object";
  } else if (roll <= 81) {
      return "Spears (possibly poisoned) spring out";
  } else if (roll <= 84) {
      return "Brittle stairs collapse over spikes";
  } else if (roll <= 88) {
      return "Thunderwave knocks characters into a pit or spikes";
  } else if (roll <= 91) {
      return "Steel or stone jaws restrain a character";
  } else if (roll <= 94) {
      return "Stone block smashes across hallway";
  } else if (roll <= 97) {
      return "Symbol";
  } else if (roll <= 100) {
      return "Walls slide together";
  }
  }

  let card = `
  <p>Trigger: ${trigger()}</p>
  <p>Damage: ${damage()}</p>
  <p>Effects:</p>
  <p>${effects()}</p>
  `;
  return card

}

function randomObstacle(){
  let roll = Math.floor(Math.random() * 20) + 1;
  if (roll === 1) {
    return "Antilife aura with a radius of 1d10 × 10 ft.; while in the aura, living creatures can’t regain hit points";
} else if (roll === 2) {
    return "Battering winds reduce speed by half, impose disadvantage on ranged attack rolls";
} else if (roll === 3) {
    return "Blade barrier blocks passage";
} else if (roll <= 8) {
    return "Cave-in";
} else if (roll <= 12) {
    return "Chasm 1d4 × 10 ft. wide and 2d6 × 10 ft. deep, possibly connected to other levels of the dungeon";
} else if (roll <= 14) {
    return "Flooding leaves 2d10 ft. of water in the area; create nearby upward-sloping passages, raised floors, or rising stairs to contain the water";
} else if (roll === 15) {
    return "Lava flows through the area (50 percent chance of a stone bridge crossing it)";
} else if (roll === 16) {
    return "Overgrown mushrooms block progress and must be hacked down (25 percent chance of a mold or fungus dungeon hazard hidden among them)";
} else if (roll === 17) {
    return "Poisonous gas (deals 1d6 poison damage per minute of exposure)";
} else if (roll === 18) {
    return "Reverse gravity effect causes creatures to fall toward the ceiling";
} else if (roll === 19) {
    return "Wall of fire blocks passage";
} else if (roll === 20) {
    return "Wall of force blocks passage";
}
}

function randomTrick(){
  function trickObject(){
    let roll = Math.floor(Math.random() * 20) + 1;
    if (roll === 1) {
        return "Book";
    } else if (roll === 2) {
        return "Brain preserved in a jar";
    } else if (roll === 3) {
        return "Burning fire";
    } else if (roll === 4) {
        return "Cracked gem";
    } else if (roll === 5) {
        return "Door";
    } else if (roll === 6) {
        return "Fresco";
    } else if (roll === 7) {
        return "Furniture";
    } else if (roll === 8) {
        return "Glass sculpture";
    } else if (roll === 9) {
        return "Mushroom field";
    } else if (roll === 10) {
        return "Painting";
    } else if (roll === 11) {
        return "Plant or tree";
    } else if (roll === 12) {
        return "Pool of water";
    } else if (roll === 13) {
        return "Runes engraved on wall or floor";
    } else if (roll === 14) {
        return "Skull";
    } else if (roll === 15) {
        return "Sphere of magical energy";
    } else if (roll === 16) {
        return "Statue";
    } else if (roll === 17) {
        return "Stone obelisk";
    } else if (roll === 18) {
        return "Suit of armor";
    } else if (roll === 19) {
        return "Tapestry or rug";
    } else if (roll === 20) {
        return "Target dummy";
    }
  }

  function trick(){
    let roll = Math.floor(Math.random() * 100) + 1;
    if (roll <= 3) {
      return "Ages the first person to touch the object";
  } else if (roll <= 6) {
      return "The touched object animates, or it animates other objects nearby";
  } else if (roll <= 10) {
      return "Asks three skill-testing questions (if all three are answered correctly, a reward appears)";
  } else if (roll <= 13) {
      return "Bestows resistance or vulnerability";
  } else if (roll <= 16) {
      return "Changes a character’s alignment, personality, size, appearance, or sex when touched";
  } else if (roll <= 19) {
      return "Changes one substance to another, such as gold to lead or metal to brittle crystal";
  } else if (roll <= 22) {
      return "Creates a force field";
  } else if (roll <= 26) {
      return "Creates an illusion";
  } else if (roll <= 29) {
      return "Suppresses magic items for a time";
  } else if (roll <= 32) {
      return "Enlarges or reduces characters";
  } else if (roll <= 35) {
      return "Magic mouth speaks a riddle";
  } else if (roll <= 38) {
      return "Confusion (targets all creatures within 10 ft.)";
  } else if (roll <= 41) {
      return "Gives directions (true or false)";
  } else if (roll <= 44) {
      return "Grants a wish";
  } else if (roll <= 47) {
      return "Flies about to avoid being touched";
  } else if (roll <= 50) {
      return "Casts geas on the characters";
  } else if (roll <= 53) {
      return "Increases, reduces, negates, or reverses gravity";
  } else if (roll <= 56) {
      return "Induces greed";
  } else if (roll <= 59) {
      return "Contains an imprisoned creature";
  } else if (roll <= 62) {
      return "Locks or unlocks exits";
  } else if (roll <= 65) {
      return "Offers a game of chance, with the promise of a reward or valuable information";
  } else if (roll <= 68) {
      return "Helps or harms certain types of creatures";
  } else if (roll <= 71) {
      return "Casts polymorph on the characters (lasts 1 hour)";
  } else if (roll <= 75) {
      return "Presents a puzzle or riddle";
  } else if (roll <= 78) {
      return "Prevents movement";
  } else if (roll <= 81) {
      return "Releases coins, false coins, gems, false gems, a magic item, or a map";
  } else if (roll <= 84) {
      return "Releases, summons, or turns into a monster";
  } else if (roll <= 87) {
      return "Casts suggestion on the characters";
  } else if (roll <= 90) {
      return "Wails loudly when touched";
  } else if (roll <= 93) {
      return "Talks (normal speech, nonsense, poetry and rhymes, singing, spellcasting, or screaming)";
  } else if (roll <= 97) {
      return "Teleports characters to another place";
  } else if (roll <= 100) {
      return "Swaps two or more characters’ minds";
  }
  }

  let card = `
  <p>Trick Object: ${trickObject()}</p>
  <p>${trick()}</p>
  `;
  return card
}

function randomChamber() {
  let chamberPurpose = randomPurpose();
  document.getElementById("chamberPurpose").innerHTML = chamberPurpose;
  let chamberState = randomState();
  document.getElementById("chamberState").innerHTML = chamberState;
  let chamberContents = randomContents();
  document.getElementById("chamberContents").innerHTML = chamberContents;

  let contents = chamberContents.toLowerCase();
  if (contents.includes("monster")) {
    generateMonster(null, "chamberMonster");
  } else {
    document.getElementById("chamberMonster").innerHTML = "";
  }

  if (contents.includes("treasure")) {
    document.getElementById("chamberTreasure").innerHTML = randomTreasure();
  } else {
    document.getElementById("chamberTreasure").innerHTML = "";
  }

  if (contents.includes("hazard")){
    document.getElementById("chamberHazard").innerHTML = randomHazard();
  } else {
    document.getElementById("chamberHazard").innerHTML = "";
  }

  if (contents.includes("trap")){
    document.getElementById("chamberTrap").innerHTML = randomTrap();
  } else {
    document.getElementById("chamberTrap").innerHTML = "";
  }

  if (contents.includes("obstacle")){
    document.getElementById("chamberObstacle").innerHTML = randomObstacle();
  } else {
    document.getElementById("chamberObstacle").innerHTML = "";
  }

  if (contents.includes("trick")){
    document.getElementById("chamberTrick").innerHTML = randomTrick();
  } else {
    document.getElementById("chamberTrick").innerHTML = "";
  }

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

  this.draw = function (ctx, room_number) {
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

    if (room_number){
      console.log(room_number);
    }
  }
  return this;
}

async function generateMonster(event, element_id){
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
        console.log(element_id);
        if (element_id == null){
          element_id = "monster";
        }
        console.log(element_id);
        document.getElementById(element_id).innerHTML = card;
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
  this.purpose = "";

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

  // Room Contents 5E style
  if (this.characterIsHere) {
    let roll = Math.floor(Math.random() * 100) + 1;
    if (this.w > 1 && this.h > 1) {
      if (roll <= 8) {
        this.contents = "Monster (dominant inhabitant)";
      } else if (roll <= 15) {
          this.contents = "Monster (dominant inhabitant) with treasure";
      } else if (roll <= 27) {
          this.contents = "Monster (pet or ally)";
      } else if (roll <= 33) {
          this.contents = "Monster (pet or ally) guarding treasure";
      } else if (roll <= 42) {
          this.contents = "Monster (random)";
      } else if (roll <= 50) {
          this.contents = "Monster (random) with treasure";
      } else if (roll <= 58) {
          this.contents = "Dungeon Hazard";
      } else if (roll <= 63) {
          this.contents = "Obstacle";
      } else if (roll <= 73) {
          this.contents = "Trap";
      } else if (roll <= 76) {
          this.contents = "Trap with treasure";
      } else if (roll <= 80) {
          this.contents = "Trick";
      } else if (roll <= 88) {
          this.contents = "Empty";
      } else if (roll <= 94) {
          this.contents = "Hazard";
      } else if (roll <= 100) {
          this.contents = "Treasure";
      }
    } else {
      // hallway
      if (roll <= 18*5) {
        this.contents = "Empty";
      } else if (roll <= 19*5) {
        this.contents = "Trick or Trap";
      } else {
        this.contents = "Wandering Monster";
      }
    }
    randomChamber();
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

    let first_tile = this.tiles[0];
    first_tile.draw(ctx, 12);
    for (let i=1; i<this.tiles.length; i++){
      this.tiles[i].draw(ctx);
    }
    //this.tiles.forEach(tile => tile.draw(ctx));

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
        ${5 * (timeInDungeon)} minutes
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

function resetTravel(){
  travelDays = 0;
}
document.getElementById('enterDungeon').addEventListener('click', enterDungeon);

document.getElementById('monsterButton').addEventListener('click', generateMonster);

document.getElementById('chamberButton').addEventListener('click', randomChamber);


init();
