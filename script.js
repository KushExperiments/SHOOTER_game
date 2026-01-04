// =====================
// CANVAS
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// =====================
// MAP
// =====================
const mapImg = new Image();
mapImg.src = "dungeon.png";

// =====================
// PLAYER
// =====================
const playerImg = new Image();
playerImg.src = "player.png";

const player = {
  x: 400,
  y: 220,
  speed: 2.5,
  weapon: "sword",
  cooldown: 0
};

// =====================
// WEAPON
// =====================
const weaponImg = new Image();
weaponImg.src = "sword.png";

// =====================
// ENEMY
// =====================
const enemyImg = new Image();
enemyImg.src = "enemy_spider.png";

let enemies = [
  { x: 200, y: 200, hp: 3, alive: true },
  { x: 600, y: 300, hp: 3, alive: true }
];

// =====================
// INPUT (KEYBOARD + BUTTONS)
// =====================
const keys = { up:false, down:false, left:false, right:false };

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") keys.up = true;
  if (e.key === "ArrowDown") keys.down = true;
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowUp") keys.up = false;
  if (e.key === "ArrowDown") keys.down = false;
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});

// MOBILE BUTTONS
["up","down","left","right"].forEach(dir=>{
  const btn = document.getElementById(dir);
  if(!btn) return;
  btn.addEventListener("touchstart", ()=> keys[dir]=true);
  btn.addEventListener("touchend", ()=> keys[dir]=false);
});

// ATTACK BUTTON
document.getElementById("shoot").onclick = attack;

// =====================
// ATTACK
// =====================
function attack(){
  if(player.cooldown > 0) return;
  player.cooldown = 25;

  enemies.forEach(e=>{
    if(!e.alive) return;
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if(d < 50){
      e.hp--;
      if(e.hp <= 0) e.alive = false;
    }
  });
}

// =====================
// UPDATE
// =====================
function update(){
  if(keys.up) player.y -= player.speed;
  if(keys.down) player.y += player.speed;
  if(keys.left) player.x -= player.speed;
  if(keys.right) player.x += player.speed;

  if(player.cooldown > 0) player.cooldown--;

  enemies.forEach(e=>{
    if(!e.alive) return;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx,dy);
    if(d < 200){
      e.x += dx/d;
      e.y += dy/d;
    }
  });
}

// =====================
// DRAW
// =====================
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // MAP
  if(mapImg.complete){
    ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
  }

  // PLAYER
  if(playerImg.complete){
    ctx.drawImage(playerImg, player.x-16, player.y-16, 32, 32);
  }

  // WEAPON
  if(weaponImg.complete){
    ctx.drawImage(weaponImg, player.x+10, player.y-8, 16, 16);
  }

  // ENEMIES
  enemies.forEach(e=>{
    if(!e.alive) return;
    if(enemyImg.complete){
      ctx.drawImage(enemyImg, e.x-12, e.y-12, 24, 24);
    }
  });
}

// =====================
// LOOP
// =====================
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

