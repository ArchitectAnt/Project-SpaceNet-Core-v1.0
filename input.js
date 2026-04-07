/* ================================================================
   SPACE NET — INPUT.JS v2
   Controles táctiles. Joystick izquierda.
   Translúcido en reposo. Brillante al usar.
================================================================ */
"use strict";

window.Input = {
  mirando:false, mirId:null, mirPX:0, mirPY:0,
  moviendo:false, movId:null, movBX:0, movBY:0,
  joyLado:"izq",
  _fadeTimer:null,
};

function initInput() {
  const zm = document.getElementById("zona-mirar");
  const zv = document.getElementById("zona-mover");

  zm.addEventListener("touchstart", mS, {passive:false});
  zm.addEventListener("touchmove",  mM, {passive:false});
  zm.addEventListener("touchend",   mE, {passive:false});
  zm.addEventListener("touchcancel",mE, {passive:false});

  zv.addEventListener("touchstart", vS, {passive:false});
  zv.addEventListener("touchmove",  vM, {passive:false});
  zv.addEventListener("touchend",   vE, {passive:false});
  zv.addEventListener("touchcancel",vE, {passive:false});
}

// ── MIRAR ─────────────────────────────────────────────────────────
function mS(e) {
  e.preventDefault();
  if (Input.mirando) return;
  const t = e.changedTouches[0];
  Input.mirando=true; Input.mirId=t.identifier;
  Input.mirPX=t.clientX; Input.mirPY=t.clientY;
}
function mM(e) {
  e.preventDefault();
  if (!Input.mirando) return;
  for (const t of e.changedTouches) {
    if (t.identifier!==Input.mirId) continue;
    Engine.input.dMirX += t.clientX - Input.mirPX;
    Engine.input.dMirY += t.clientY - Input.mirPY;
    Input.mirPX=t.clientX; Input.mirPY=t.clientY;
  }
}
function mE(e) {
  e.preventDefault();
  for (const t of e.changedTouches)
    if (t.identifier===Input.mirId) { Input.mirando=false; Input.mirId=null; }
}

// ── MOVER ─────────────────────────────────────────────────────────
const jBase  = ()=> document.getElementById("joystick-base");
const jPunto = ()=> document.getElementById("joystick-punto");

function joyActivo(on) {
  const b = jBase(); if(!b) return;
  clearTimeout(Input._fadeTimer);
  if (on) {
    b.classList.remove("fade-out");
    b.classList.add("activo");
  } else {
    b.classList.remove("activo");
    // Espera 1.2s antes del fade
    Input._fadeTimer = setTimeout(()=>{
      b.classList.add("fade-out");
      setTimeout(()=>b.classList.remove("fade-out"),1500);
    },1200);
  }
}

function vS(e) {
  e.preventDefault();
  if (Input.moviendo) return;
  const t = e.changedTouches[0];
  Input.moviendo=true; Input.movId=t.identifier;
  Input.movBX=t.clientX; Input.movBY=t.clientY;
  joyActivo(true);
}

function vM(e) {
  e.preventDefault();
  if (!Input.moviendo) return;
  for (const t of e.changedTouches) {
    if (t.identifier!==Input.movId) continue;
    const dx = t.clientX - Input.movBX;
    const dy = t.clientY - Input.movBY;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const dead = 14;

    if (dist < dead) {
      Engine.input.adelante=Engine.input.atras=Engine.input.izq=Engine.input.der=false;
    } else {
      const nx=dx/dist, ny=dy/dist;
      Engine.input.adelante = ny < -0.3;
      Engine.input.atras    = ny >  0.3;
      Engine.input.izq      = nx < -0.3;
      Engine.input.der      = nx >  0.3;
    }

    // Punto joystick
    const maxR = 34;
    const clamp = Math.min(dist,maxR);
    const ang = Math.atan2(dy,dx);
    const p = jPunto(); if(p) p.style.transform=`translate(${Math.cos(ang)*clamp}px,${Math.sin(ang)*clamp}px)`;
  }
}

function vE(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier!==Input.movId) continue;
    Input.moviendo=false; Input.movId=null;
    Engine.input.adelante=Engine.input.atras=Engine.input.izq=Engine.input.der=false;
    const p=jPunto(); if(p) p.style.transform="";
    joyActivo(false);
  }
}
