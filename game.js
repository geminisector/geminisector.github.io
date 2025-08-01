const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player config
const player = {
  x: 200,
  y: 200,
  dir: 'front',
  speed: 2,
  facing: 'right',
  inventory: [],
  dialogue : {
   text: "", 
   timer:0},
  width: 64, // Player width
  height: 64, // Player height
};

// Sprites
const sprites = {
  front: new Image(),
  side: new Image(),
  back: new Image(),
  scrap: new Image(),
  background: new Image(),
};

sprites.front.src = "images/seelig-1.png";
sprites.side.src = "images/seelig-3.png";
sprites.back.src = "images/seelig-4.png";
sprites.scrap.src = "images/item-scrap.png";
sprites.background.src = "images/background.png";

// Wait for all images to load
let loadedImages = 0;
for (let key in sprites) {
  sprites[key].onload = () => {
    loadedImages++;
    if (loadedImages === Object.keys(sprites).length) {
      requestAnimationFrame(gameLoop);
    }
  };
}

// Items
const items = [
  { x: 250, y: 250, name: "Scrap Metal", collected: false },
  { x: 400, y: 350, name: "Circuit Board", collected: false },
  { x: 150, y: 300, name: "Power Cell", collected: false }
];

function respawnItem(item, delay = 5000) {
  setTimeout(() => {
    item.collected = false;
  }, delay);
}

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// UI
const dialogueBox = document.getElementById('dialogueBox');
const inventoryBox = document.getElementById('inventory');

function showDialogue(text, duration = 3000) {
  player.dialogue.text = text;
  player.dialogue.timer = Date.now() + duration;
}

function updateInventoryDisplay() {
  inventoryBox.textContent = "Inventory: " + (player.inventory.length === 0
    ? "(empty)"
    : player.inventory.join(', '));
}

function addItemToInventory(itemName) {
  if (!player.inventory.includes(itemName)) {
    player.inventory.push(itemName);
    updateInventoryDisplay();

    const lines = ["FAQ Yeah!", "Skookum."];
    const line = lines[Math.floor(Math.random() * lines.length)];
    showDialogue(`${line} Picked up: ${itemName}`);
  }
}

// Collision detection for canvas boundaries
function checkCollision(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;
  const playerHalfWidth = player.width / 2;
  const playerHalfHeight = player.height / 2;
  
  if (newX - playerHalfWidth < 0 || newX + playerHalfWidth > canvas.width) {
    return false; // Collision with horizontal boundaries
  }
  if (newY - playerHalfHeight < 0 || newY + playerHalfHeight > canvas.height) {
    return false; // Collision with vertical boundaries
  }
  return true;
}

// Update
function update() {
  let dx = 0;
  let dy = 0;
  const scale = (player.y / canvas.height);
  if (keys['w']) {
    dy -= player.speed  * scale;
    player.dir = 'back';
  }
  if (keys['s']) {
    dy += player.speed  * scale;
    player.dir = 'front';
  }
  if (keys['a']) {
    dx -= player.speed  * scale;
    player.dir = 'side';
    player.facing = 'left';
  }
  if (keys['d']) {
    dx += player.speed  * scale;
    player.dir = 'side';
    player.facing = 'right';
  }

  // Apply movement only if no collision
  if (checkCollision(dx, dy)) {
    if (((player.y + dy) > 180) && ((player.y + dy) < 350)) {
       player.y += dy;
    }
    player.x += dx;
  }

  // Item collision detection
  for (const item of items) {
    if (!item.collected &&
        Math.abs(player.x - item.x) < 32 &&
        Math.abs(player.y - item.y) < 32) {
      item.collected = true;
      addItemToInventory(item.name);
      respawnItem(item);  // Respawn after delay
    }
  }
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprites.background, 0,0,512,512);
  // Draw items
  for (const item of items) {
    if (!item.collected) {
      ctx.drawImage(sprites.scrap, item.x, item.y, 32, 32);
    }
  }

  ctx.save();
  
  // Calculate scale based on player's y position
  const scale = (player.y / canvas.height);
  const scaledWidth = player.width * scale;
  const scaledHeight = player.height * scale;

  const sprite = sprites[player.dir];
  const x = player.x;
  const y = player.y;

  if (player.dir === 'side' && player.facing === 'left') {
    ctx.translate(x, y);
    ctx.scale(-scale, scale);
    ctx.drawImage(sprite, -scaledWidth / 2, -scaledHeight);
  } else {
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.drawImage(sprite, -scaledWidth / 2, -scaledHeight);
  }

if (player.dialogue.text && Date.now() < player.dialogue.timer) {
  const text = player.dialogue.text;
  ctx.font = "14px Arial";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";

  const textWidth = ctx.measureText(text).width;
  const padding = 6;

  const boxX = 0;
  const boxY = -scaledHeight - 10;

  // Yellow background
  ctx.fillStyle = "#ffff88";
  ctx.fillRect(
    boxX - textWidth / 2 - padding,
    boxY - 20,
    textWidth + padding * 2,
    20
  );

  // Black text
  ctx.fillStyle = "#000";
  ctx.fillText(text, boxX, boxY);
}

  ctx.restore();
}

// Game loop
function gameLoop() {
  try {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } catch (err) {
    console.error("Game error:", err);
  }
}
