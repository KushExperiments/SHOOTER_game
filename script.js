const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// MAP
const mapImg = new Image();
mapImg.src = "dungeon.png";

// PLAYER
const playerImg = new Image();
playerImg.src = "player.png";

const player = {
  x: 100,
  y: 100,
  speed: 2,
  angle: 0
};

// ENEMY IMAGES
const enemyImages = {
  skeleton: new Image(),
  goblin: new Image(),
  slime: new Image()
};

enemyImages.skeleton.src = "enemy_skeleton.png";
enemyImages.goblin.src   = "enemy_goblin.png";
enemyImages.slime.src    = "enemy_slime.png";

// ENEMY ANIMATIONS
const enemyAnim = {
  skeleton: { fall: 1.2, spin: 0.2, fade: 0.04, shrink: false },
  goblin:   { fall: 0.6, spin: 0.1, fade: 0.03, shrink: false },
  slime:    { fall: 0.3, spin: 0,   fade: 0.03, shrink: true  }
};

let enemies = [];
let bullets = [];

// SPAWN ENEMIES
function spawnEnemy(x, y) {
  const types = ["skeleton","goblin","slime"];
  const type = types[Math.floor(Math.random()*types.length)];

  enemies.push({
    x, y,
    type,
    hp: 3,
    alive: true,
    dying: false,
    opacity: 1,
    scale: 1,
    angle: 0,
    timer: 30,
    remove: false
  });
}

spawnEnemy(500,150);
spawnEnemy(600,300);
spawnEnemy(400,250);

// INPUT
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// MOBILE BUTTONS
["up","down","left","right"].forEach(id=>{
  document.getElementById(id).onclick = ()=> keys[id] = true;
  document.getElementById(id).onmouseup = ()=> keys[id] = false;
});

document.getElementById("shoot").onclick = shoot;

// SHOOT
function shoot(){
  bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(player.angle) * 5,
    vy: Math.sin(player.angle) * 5
  });
}

// UPDATE
function update(){
  if(keys["ArrowUp"] || keys.up) player.y -= player.speed;
  if(keys["ArrowDown"] || keys.down) player.y += player.speed;
  if(keys["ArrowLeft"] || keys.left) player.x -= player.speed;
  if(keys["ArrowRight"] || keys.right) player.x += player.speed;

  bullets.forEach(b=>{
    b.x += b.vx;
    b.y += b.vy;
  });

  enemies.forEach(e=>{
    if(e.dying){
      const a = enemyAnim[e.type];
      e.y += a.fall;
      e.angle += a.spin;
      e.opacity -= a.fade;
      if(a.shrink) e.scale -= 0.02;
      e.timer--;
      if(e.timer <= 0) e.remove = true;
      return;
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx,dy);

    if(dist < 150){
      e.x += dx/dist;
      e.y += dy/dist;
    }
  });

  bullets.forEach(b=>{
    enemies.forEach(e=>{
      if(!e.alive) return;
      if(Math.hypot(b.x-e.x,b.y-e.y) < 12){
        e.hp--;
        b.remove = true;
        if(e.hp <= 0){
          e.alive = false;
          e.dying = true;
        }
      }
    });
  });

  bullets = bullets.filter(b=>!b.remove);
  enemies = enemies.filter(e=>!e.remove);
}

// DRAW
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(mapImg.complete){
    ctx.drawImage(mapImg,0,0,canvas.width,canvas.height);
  }

  bullets.forEach(b=>{
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x,b.y,4,4);
  });

  enemies.forEach(e=>{
    const img = enemyImages[e.type];
    if(!img.complete) return;
    ctx.save();
    ctx.globalAlpha = e.opacity;
    ctx.translate(e.x,e.y);
    ctx.rotate(e.angle);
    ctx.scale(e.scale,e.scale);
    ctx.drawImage(img,-12,-12,24,24);
    ctx.restore();
  });

  if(playerImg.complete){
    ctx.save();
    ctx.translate(player.x,player.y);
    ctx.drawImage(playerImg,-16,-16,32,32);
    ctx.restore();
  }
}

// LOOP
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

