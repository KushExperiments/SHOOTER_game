// ======================
// CANVAS SETUP
// ======================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ======================
// PLAYER TYPES
// ======================
const playerTypes = {
  player: { img: "player.png", speed: 2.5, maxHp: 100 },
  slasher: { img: "slasher.png", speed: 3, maxHp: 80 },
  superslayer: { img: "superslayer.png", speed: 2, maxHp: 150 }
};

const playerImages = {};
for (let p in playerTypes) {
  playerImages[p] = new Image();
  playerImages[p].src = playerTypes[p].img;
}

// ======================
// WEAPONS
// ======================
const weapons = {
  sword: { img: "sword.png", range: 50, damage: 2, cooldown: 25 },
  knife: { img: "knife.png", range: 30, damage: 1, cooldown: 12 },
  thorhammer: { img: "thorhammer.png", range: 60, damage: 4, cooldown: 40 },
  woodslasher: { img: "woodslasher.png", range: 45, damage: 3, cooldown: 30 }
};

const weaponImages = {};
for (let w in weapons) {
  weaponImages[w] = new Image();
  weaponImages[w].src = weapons[w].img;
}

// ======================
// ENEMY TYPES
// ======================
const enemyTypes = {
  ghost: { img: "enemy_ghost.png", speed: 1.2, hp: 2 },
  spider: { img: "enemy_spider.png", speed: 2, hp: 1 },
  soldier: { img: "enemy_soldier.png", speed: 1, hp: 4 },
  oneeyed: { img: "enemy_oneeyed.png", speed: 1.5, hp: 3 }
};

const enemyImages = {};
for (let e in enemyTypes) {
  enemyImages[e] = new Image();
  enemyImages[e].src = enemyTypes[e].img;
}

// ======================
// GAME STATE
// ======================
let player = {
  type: "player",
  x: 150,
  y: 150,
  hp: 100,
  weapon: "sword",
  attackCooldown: 0
};

let enemies = [];

// ======================
// SPAWN ENEMY
// ======================
function spawnEnemy(x, y) {
  const types = Object.keys(enemyTypes);
  const type = types[Math.floor(Math.random() * types.length)];

  enemies.push({
    x,
    y,
    type,
    hp: enemyTypes[type].hp,
    speed: enemyTypes[type].speed,
    alive: true,
    dying: false,
    opacity: 1,
    angle: 0,
    scale: 1,
    hitFlash: 0,
    remove: false
  });
}

// spawn some enemies
spawnEnemy(400, 200);
spawnEnemy(550, 300);
spawnEnemy(300, 350);

// ======================
// INPUT
// ======================
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

document.getElementById("shoot").onclick = attack;

// ======================
// ATTACK (MELEE)
// ======================
function attack() {
  const w = weapons[player.weapon];
  if (player.attackCooldown > 0) return;

  player.attackCooldown = w.cooldown;

  enemies.forEach(e => {
    if (!e.alive) return;

    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist < w.range) {
      e.hp -= w.damage;
      e.hitFlash = 6;

      if (e.hp <= 0) {
        e.alive = false;
        e.dying = true;
      }
    }
  });
}

// ======================
// UPDATE
// ======================
function update() {
  const speed = playerTypes[player.type].speed;

  if (keys["ArrowUp"]) player.y -= speed;
  if (keys["ArrowDown"]) player.y += speed;
  if (keys["ArrowLeft"]) player.x -= speed;
  if (keys["ArrowRight"]) player.x += speed;

  if (player.attackCooldown > 0) player.attackCooldown--;

  enemies.forEach(e => {
    if (e.dying) {
      e.opacity -= 0.04;
      e.y += 0.5;
      e.angle += 0.15;
      if (e.opacity <= 0) e.remove = true;
      return;
    }

    // chase player
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy);

    if (d < 160) {
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    }
  });

  enemies = enemies.filter(e => !e.remove);
}

// ======================
// DRAW
// ======================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // PLAYER
  const pImg = playerImages[player.type];
  if (pImg.complete) {
    ctx.drawImage(pImg, player.x - 16, player.y - 16, 32, 32);
  }

  // WEAPON
  const wImg = weaponImages[player.weapon];
  if (wImg.complete) {
    ctx.drawImage(wImg, player.x + 10, player.y - 8, 16, 16);
  }

  // ENEMIES
  enemies.forEach(e => {
    const img = enemyImages[e.type];
    if (!img.complete) return;

    ctx.save();
    ctx.globalAlpha = e.hitFlash > 0 ? 0.5 : e.opacity;
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    ctx.drawImage(img, -12, -12, 24, 24);
    ctx.restore();

    if (e.hitFlash > 0) e.hitFlash--;
  });
}

// ======================
// GAME LOOP
// ======================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
