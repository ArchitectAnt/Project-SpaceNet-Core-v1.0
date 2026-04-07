/* ================================================================
   SPACE NET — HUD.JS v2
   Hora real. README con código real del engine.
   Chunks dramáticos.
================================================================ */
"use strict";

// Código REAL del engine que aparece en el panel README
const CODIGO_REAL = `function initEngine(){
  canvas=getElementById('c3d');
  ctx=canvas.getContext('2d');
  resize();
  requestAnimationFrame(loop);
}
function loop(now){
  const dt=Math.min(
    (now-tPrev)/1000,0.05);
  tPrev=now;
  update(dt);
  draw();
  hudTick();
  requestAnim
  ationFrame(loop);
}
function update(dt){
  cam.rotY+=inp.dMirX*sensH;
  cam.rotX-=inp.dMirY*sensV;
  cam.rotX=clamp(
    cam.rotX,-lim,lim);
  vel.x+=ax*fuerza*dt;
  vel.z+=az*fuerza*dt;
  vel.x*=friction;
  vel.z*=friction;
  cam.x=nx; cam.z=nz;
  cam.y=275+sin(fase)*5;
}
function proyectar2(
  wx,wy,wz,cam,W,H,f){
  const rx=dx*cY-dz*sY;
  const rz=dx*sY+dz*cY;
  if(rz<0.5) return null;
  return{
    x:(rx/rz)*f+W/2,
    y:(ry/rz)*f+H/2
  };
}`;

function initHUD() {
  // Hora real
  actualizarHora();
  setInterval(actualizarHora, 1000);

  // Chunks dramáticos
  let c = 0;
  const iv = setInterval(()=>{
    c += Math.floor(Math.random()*14)+1;
    if(c>=81){ c=81; clearInterval(iv); }
    const e1 = document.getElementById("chunks-cargados");
    const e2 = document.getElementById("chunks-bottom");
    if(e1) e1.textContent = c;
    if(e2) e2.textContent = c;
  }, 70);

  // README con código real scrolleando
  iniciarREADME();
}

function actualizarHora() {
  const el = document.getElementById("hud-hora");
  if (!el) return;
  const d = new Date();
  const h = String(d.getHours()).padStart(2,"0");
  const m = String(d.getMinutes()).padStart(2,"0");
  el.textContent = `${h}:${m}`;
}

function iniciarREADME() {
  const el = document.getElementById("readme-codigo");
  if (!el) return;

  const lineas = CODIGO_REAL.split("\n");
  let li = 0, ci = 0, txt = "";

  function tick() {
    if (li >= lineas.length) {
      // Reiniciar con scroll visual
      setTimeout(()=>{ txt=""; li=0; ci=0; }, 2000);
      setTimeout(tick, 2200);
      return;
    }
    const linea = lineas[li];
    if (ci < linea.length) {
      txt += linea[ci++];
      el.innerHTML = txt.replace(/\n/g,"<br>");
      el.scrollTop = el.scrollHeight;
      setTimeout(tick, 22);
    } else {
      txt += "\n"; li++; ci=0;
      setTimeout(tick, 80);
    }
  }
  setTimeout(tick, 1000);
}
