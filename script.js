/* ================= SETUP ================= */
const mapImg = new Image();
mapImg.src = "dungeon.png";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let keys = {};
document.addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

/* ================= MAP ================= */

const walls = [
  // outer walls
  { x:60,  y:60,  w:780, h:30 },
  { x:60,  y:60,  w:30,  h:380 },
  { x:810, y:60,  w:30,  h:380 },
  { x:60,  y:410, w:780, h:30 },

  // inner dungeon walls
  { x:300, y:60,  w:30,  h:200 },
  { x:500, y:240, w:30,  h:200 }
];


const doors = [
  {x:300,y:260,w:30,h:40,open:false,locked:true}
];

/* ================= PLAYER ================= */
const player = {
  x:150,y:150,
  speed:3,
  hp:100,
  angle:0,
  ammo:30,
  maxAmmo:30,
  reloadTime:0,
  keys:0,
  weapon:"pistol"
};

/* ================= ENEMIES ================= */
const TYPES = {
  runner:{hp:6,speed:3},
  tank:{hp:20,speed:1},
  shooter:{hp:10,speed:1.5}
};

let enemies = [
  createEnemy(650,120,"shooter"),
  createEnemy(700,360,"tank"),
  createEnemy(200,350,"runner")
];

function createEnemy(x,y,type){
  return{
    x,y,type,
    hp:TYPES[type].hp,
    speed:TYPES[type].speed,
    state:"idle",
    angle:0,
    visionRange:180,
    visionAngle:Math.PI/3,
    lastSeen:null,
    dying:false,
    deathTimer:0,
    opacity:1,
    fall:0
  };
}

/* ================= BULLETS & LOOT ================= */
let bullets = [];
let loots = [];

/* ================= MOBILE INPUT ================= */
let move = {up:false,down:false,left:false,right:false};

function bindBtn(id,dir){
  const b=document.getElementById(id);
  b.addEventListener("touchstart",e=>{e.preventDefault();move[dir]=true;});
  b.addEventListener("touchend",()=>move[dir]=false);
}
["up","down","left","right"].forEach(d=>bindBtn(d,d));

document.getElementById("shootBtn")
  .addEventListener("touchstart",e=>{
    e.preventDefault();
    autoShoot();
  });

/* ================= GAME LOOP ================= */
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  function drawMap(){
  if(mapImg.complete){
    ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
  }
}

  drawWalls();
  drawDoors();

  updatePlayer();
  drawPlayer();

  enemies.forEach(e=>{
    updateEnemy(e);
    drawVisionCone(e);
    drawEnemy(e);
  });

  updateBullets();
  drawLoot();
  pickupLoot();
  drawDarkness();
  drawUI();

  requestAnimationFrame(loop);
}
loop();

/* ================= PLAYER ================= */
function updatePlayer(){
  let vx=0,vy=0;
  if(keys.w||move.up)vy-=player.speed;
  if(keys.s||move.down)vy+=player.speed;
  if(keys.a||move.left)vx-=player.speed;
  if(keys.d||move.right)vx+=player.speed;

  if(vx||vy)player.angle=Math.atan2(vy,vx);
  moveWithCollision(player,vx,vy);

  if(keys.e)tryOpenDoor();

  if(player.reloadTime>0){
    player.reloadTime--;
    if(player.reloadTime===0)player.ammo=player.maxAmmo;
  }
}

function drawPlayer(){
  ctx.fillStyle="white";
  ctx.beginPath();
  ctx.arc(player.x,player.y,10,0,Math.PI*2);
  ctx.fill();
}

/* ================= ENEMY AI ================= */
function updateEnemy(e){
  if(e.dying){
    e.deathTimer++;
    e.fall+=0.8;
    if(e.deathTimer>40)e.opacity-=0.03;
    return;
  }

  if(e.state==="idle"&&canSeePlayer(e)){
    e.state="alerted";
  }

  if(e.state==="alerted"){
    e.lastSeen={x:player.x,y:player.y};
    let a=Math.atan2(player.y-e.y,player.x-e.x);
    e.angle=a;
    moveWithCollision(e,Math.cos(a)*e.speed,Math.sin(a)*e.speed);
    if(distance(e,player)<16)player.hp-=0.5;
    if(!canSeePlayer(e))e.state="searching";
  }

  if(e.state==="searching"){
    let dx=e.lastSeen.x-e.x;
    let dy=e.lastSeen.y-e.y;
    if(Math.hypot(dx,dy)>5){
      let a=Math.atan2(dy,dx);
      moveWithCollision(e,Math.cos(a)*e.speed,Math.sin(a)*e.speed);
    }else e.state="idle";
  }
}

/* ================= SHOOTING ================= */
function autoShoot(){
  if(player.ammo<=0||player.reloadTime>0)return;
  let nearest=null,min=9999;
  enemies.forEach(e=>{
    let d=distance(player,e);
    if(d<min&&!e.dying){min=d;nearest=e;}
  });
  if(!nearest)return;

  let a=Math.atan2(nearest.y-player.y,nearest.x-player.x);
  player.angle=a;
  player.ammo--;

  let speed=player.weapon==="rifle"?10:8;
  bullets.push({
    x:player.x,y:player.y,
    vx:Math.cos(a)*speed,
    vy:Math.sin(a)*speed
  });
}

function updateBullets(){
  bullets.forEach((b,i)=>{
    b.x+=b.vx;
    b.y+=b.vy;
    ctx.fillStyle="yellow";
    ctx.fillRect(b.x,b.y,4,4);

    enemies.forEach(e=>{
      if(distance(b,e)<12&&!e.dying){
        e.hp--;
        enemies.forEach(x=>x.state="alerted");
        bullets.splice(i,1);
        if(e.hp<=0){
          e.dying=true;
          dropLoot(e.x,e.y);
        }
      }
    });
  });
  enemies=enemies.filter(e=>e.opacity>0);
}

/* ================= LOOT ================= */
function dropLoot(x,y){
  let r=Math.random(),type=null;
  if(r<0.4)type="ammo";
  else if(r<0.7)type="health";
  else if(r<0.85)type="key";
  else if(r<0.95)type="weapon";
  if(type)loots.push({x,y,type});
}

function drawLoot(){
  loots.forEach(l=>{
    ctx.fillStyle=
      l.type==="ammo"?"gold":
      l.type==="health"?"lime":
      l.type==="key"?"cyan":"purple";
    ctx.beginPath();
    ctx.arc(l.x,l.y,6,0,Math.PI*2);
    ctx.fill();
  });
}

function pickupLoot(){
  loots=loots.filter(l=>{
    if(distance(player,l)<15){
      if(l.type==="health")player.hp=Math.min(100,player.hp+25);
      if(l.type==="ammo")player.ammo=player.maxAmmo;
      if(l.type==="key")player.keys++;
      if(l.type==="weapon"){
        player.weapon="rifle";
        player.maxAmmo=50;
        player.ammo=50;
      }
      return false;
    }
    return true;
  });
}

/* ================= HELPERS ================= */
function drawMap(){
  if(mapImg.complete)ctx.drawImage(mapImg,0,0,canvas.width,canvas.height);
}
function drawWalls(){walls.forEach(w=>ctx.fillRect(w.x,w.y,w.w,w.h));}
function drawDoors(){
  doors.forEach(d=>{
    ctx.fillStyle=d.open?"#444":d.locked?"#4b2e2e":"#8b5a2b";
    ctx.fillRect(d.x,d.y,d.w,d.h);
  });
}
function tryOpenDoor(){
  doors.forEach(d=>{
    if(distance(player,{x:d.x+d.w/2,y:d.y+d.h/2})<30){
      if(d.locked&&player.keys>0){
        player.keys--;d.locked=false;d.open=true;
      }else if(!d.locked)d.open=true;
    }
  });
}
function drawEnemy(e){
  ctx.save();ctx.globalAlpha=e.opacity;
  ctx.fillStyle=e.dying?"darkred":e.state==="alerted"?"darkred":"gray";
  ctx.beginPath();
  ctx.arc(e.x,e.y+e.fall,10,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}
function drawVisionCone(e){
  ctx.save();ctx.translate(e.x,e.y);
  ctx.fillStyle=e.state==="alerted"?"rgba(255,0,0,0.35)":"rgba(255,0,0,0.2)";
  ctx.beginPath();ctx.moveTo(0,0);
  ctx.arc(0,0,e.visionRange,e.angle-e.visionAngle/2,e.angle+e.visionAngle/2);
  ctx.fill();ctx.restore();
}
function drawDarkness(){
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.85)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation="destination-out";
  let g=ctx.createRadialGradient(player.x,player.y,20,player.x,player.y,160);
  g.addColorStop(0,"rgba(0,0,0,1)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(player.x,player.y,160,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawUI(){
  ctx.fillStyle="red";
  ctx.fillRect(20,20,(player.hp/100)*150,8);
  ctx.fillStyle="white";
  ctx.fillText("Ammo:"+player.ammo,20,45);
  ctx.fillText("Keys:"+player.keys,20,65);
}
function moveWithCollision(ent,vx,vy){
  ent.x+=vx;allWalls().forEach(w=>{if(circleRect(ent.x,ent.y,10,w))ent.x-=vx;});
  ent.y+=vy;allWalls().forEach(w=>{if(circleRect(ent.x,ent.y,10,w))ent.y-=vy;});
}
function allWalls(){return [...walls,...doors.filter(d=>!d.open)];}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function circleRect(cx,cy,r,w){
  let x=Math.max(w.x,Math.min(cx,w.x+w.w));
  let y=Math.max(w.y,Math.min(cy,w.y+w.h));
  return((cx-x)**2+(cy-y)**2)<r*r;
}
function rayBlocked(x1,y1,x2,y2){
  return allWalls().some(w=>lineRect(x1,y1,x2,y2,w));
}
function lineRect(x1,y1,x2,y2,r){
  return lineLine(x1,y1,x2,y2,r.x,r.y,r.x+r.w,r.y)||
         lineLine(x1,y1,x2,y2,r.x,r.y,r.x,r.y+r.h)||
         lineLine(x1,y1,x2,y2,r.x+r.w,r.y,r.x+r.w,r.y+r.h)||
         lineLine(x1,y1,x2,y2,r.x,r.y+r.h,r.x+r.w,r.y+r.h);
}
function lineLine(x1,y1,x2,y2,x3,y3,x4,y4){
  let d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
  if(d===0)return false;
  let t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/d;
  let u=-((x1-x2)*(y1-y3)-(y1-y2)*(x1-x3))/d;
  return t>0&&t<1&&u>0&&u<1;
}
function canSeePlayer(e){
  let dx=player.x-e.x,dy=player.y-e.y;
  let d=Math.hypot(dx,dy);
  if(d>e.visionRange)return false;
  let a=Math.atan2(dy,dx);
  let diff=Math.abs(Math.atan2(Math.sin(a-e.angle),Math.cos(a-e.angle)));
  if(diff>e.visionAngle/2)return false;
  return !rayBlocked(e.x,e.y,player.x,player.y);
}


