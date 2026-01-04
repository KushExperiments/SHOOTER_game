// =====================
// CANVAS
// =====================
const mapImg = new Image();
mapImg.src = "dungeon.png";

mapImg.onload = () => {
  canvas.width = mapImg.width;
  canvas.height = mapImg.height;
  console.log("Dungeon loaded:", mapImg.width, mapImg.height);
};

mapImg.onerror = () => {
  console.error("Dungeon failed to load");
};

// =====================
// PLAYER
// =====================
const playerImg = new Image();
playerImg.src = "player.png";

const player = {
  x: 400,
  y: 225,
  speed: 3,
  attackCooldown: 0
};

// =====================
// ENEMIES
// =====================
const enemyImg = new Image();
enemyImg.src = "enemy_spider.png";

let enemies = [
  { x: 200, y: 150, alive: true },
  { x: 600, y: 300, alive: true }
];

// =====================
// INPUT STATE (FIXED)
// =====================
const input = {
  up: false,
  down: false,
  left: false,
  right: false
};

// KEYBOARD
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

// ON-SCREEN BUTTONS (IMPORTANT)
["up","down","left","right"].forEach(dir => {
  const btn = document.getElementById(dir);
  if (!btn) return;

  btn.addEventListener("mousedown", () => input[dir] = true);
  btn.addEventListener("mouseup", () => input[dir] = false);
  btn.addEventListener("mouseleave", () => input[dir] = false);

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

  // Keep player inside screen
  player.x = Math.max(16, Math.min(canvas.width - 16, player.x));
  player.y = Math.max(16, Math.min(canvas.height - 16, player.y));
}

// =====================
// DRAW
// =====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mapImg.complete && mapImg.naturalWidth > 0) {
    ctx.drawImage(mapImg, 0, 0);
  } else {
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(playerImg, player.x - 16, player.y - 16, 32, 32);

  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x - 12, e.y - 12, 24, 24);
  });
}


// =====================
// GAME LOOP
// =====================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();



