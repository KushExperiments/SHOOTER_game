// =====================
// GET CANVAS (THIS WAS MISSING)
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// IMAGE LOADER (SAFE)
// =====================
function loadImage(src) {
  const img = new Image();
  img.src = src;
  img.loaded = false;

  img.onload = () => {
    img.loaded = true;
    console.log("Loaded:", src);
  };

  img.onerror = () => {
    console.error("FAILED TO LOAD:", src);
  };

  return img;
}

// =====================
// LOAD ASSETS
// =====================
const mapImg = loadImage("dungeon.png");
const playerImg = loadImage("player.png");
const enemyImg = loadImage("enemy_spider.png");

// Resize canvas to map size when ready
mapImg.onload = () => {
  canvas.width = mapImg.width;
  canvas.height = mapImg.height;
  console.log("Dungeon size:", mapImg.width, mapImg.height);
};

// =====================
// PLAYER
// =====================
const player = {
  x: 100,
  y: 100,
  speed: 3
};

// =====================
// ENEMIES
// =====================
const enemies = [
  { x: 300, y: 200 },
  { x: 500, y: 350 }
];

// =====================
// INPUT
// =====================
const input = { up:false, down:false, left:false, right:false };

// Keyboard
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") input.up = true;
  if (e.key === "ArrowDown") input.down = true;
  if (e.key === "ArrowLeft") input.left = true;
  if (e.key === "ArrowRight") input.right = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowUp") input.up = false;
  if (e.key === "ArrowDown") input.down = false;
  if (e.key === "ArrowLeft") input.left = false;
  if (e.key === "ArrowRight") input.right = false;
});

// Mobile buttons
["up","down","left","right"].forEach(dir => {
  const btn = document.getElementById(dir);
  if (!btn) return;

  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    input[dir] = true;
  });

  btn.addEventListener("touchend", () => input[dir] = false);
});

// =====================
// UPDATE
// =====================
function update() {
  if (input.up) player.y -= player.speed;
  if (input.down) player.y += player.speed;
  if (input.left) player.x -= player.speed;
  if (input.right) player.x += player.speed;

  // keep inside map
  player.x = Math.max(16, Math.min(canvas.width - 16, player.x));
  player.y = Math.max(16, Math.min(canvas.height - 16, player.y));
}

// =====================
// DRAW
// =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Map
  if (mapImg.loaded) {
    ctx.drawImage(mapImg, 0, 0);
  } else {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Player
  if (playerImg.loaded) {
    ctx.drawImage(playerImg, player.x - 16, player.y - 16, 32, 32);
  }

  // Enemies
  enemies.forEach(e => {
    if (enemyImg.loaded) {
      ctx.drawImage(enemyImg, e.x - 12, e.y - 12, 24, 24);
    }
  });
}

// =====================
// LOOP
// =====================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
