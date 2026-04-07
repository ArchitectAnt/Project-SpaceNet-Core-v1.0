/* ================================================================
   SPACE NET — WORLD.JS v2
   Habitación Núcleo. Sector Cero. Nexo A-B.
================================================================ */
"use strict";

function initWorld() {
  Engine.cam.x = 0;
  Engine.cam.z = 600;
  Engine.cam.rotY = Math.PI;

  Engine.objetos = [

    // ── MONOLITO CENTRAL ──────────────────────────────────────
    {
      x:-60, z:-120, w:120, h:520, d:60,
      solido:true, tipo:"monolito",
      texto:"[ INDEX ]",
      colorRGB:[0,255,136],
    },

    // ── CUBOS MAESTROS ────────────────────────────────────────
    {
      x:-240, z:60, w:80, h:80, d:80,
      solido:true, tipo:"cubo",
      texto:"HTML",
      colorRGB:[0,200,255],
    },
    {
      x:160, z:60, w:80, h:80, d:80,
      solido:true, tipo:"cubo",
      texto:"CSS",
      colorRGB:[255,80,200],
    },
    {
      x:-40, z:-320, w:80, h:80, d:80,
      solido:true, tipo:"cubo",
      texto:"JS",
      colorRGB:[255,220,0],
    },

    // ── MUROS ─────────────────────────────────────────────────
    { x:-1500,z:-900, w:3000,h:550,d:18, solido:true, tipo:"muro", colorRGB:[0,255,136] },
    { x:-1500,z:1100, w:3000,h:550,d:18, solido:true, tipo:"muro", colorRGB:[0,255,136] },
    { x:1100, z:-900, w:18,h:550,d:2000, solido:true, tipo:"muro", colorRGB:[0,255,136] },
    { x:-1118,z:-900, w:18,h:550,d:2000, solido:true, tipo:"muro", colorRGB:[0,255,136] },

    // ── PILARES ───────────────────────────────────────────────
    { x:-900,z:-700, w:35,h:700,d:35, solido:true, tipo:"pilar", colorRGB:[0,255,136] },
    { x:865, z:-700, w:35,h:700,d:35, solido:true, tipo:"pilar", colorRGB:[0,255,136] },
    { x:-900,z:900,  w:35,h:700,d:35, solido:true, tipo:"pilar", colorRGB:[0,255,136] },
    { x:865, z:900,  w:35,h:700,d:35, solido:true, tipo:"pilar", colorRGB:[0,255,136] },

    // ── TERMINALES LATERALES (pequeñas) ───────────────────────
    { x:-700,z:100, w:40,h:120,d:20, solido:true, tipo:"terminal", texto:">_", colorRGB:[0,255,136] },
    { x:660, z:100, w:40,h:120,d:20, solido:true, tipo:"terminal", texto:">_", colorRGB:[0,255,136] },

    // ── MINICUBOS EN EL SUELO ─────────────────────────────────
    { x:-80, z:200, w:30,h:30,d:30, solido:false, tipo:"mini", texto:"", colorRGB:[0,255,136] },
    { x:50,  z:180, w:25,h:25,d:25, solido:false, tipo:"mini", texto:"", colorRGB:[0,200,255] },
    { x:-30, z:300, w:20,h:20,d:20, solido:false, tipo:"mini", texto:"", colorRGB:[255,220,0] },

  ];

  // Pulso del monolito
  pulsarMonolito();
  // Glitch
  setTimeout(glitch, 6000 + Math.random()*8000);
}

let _pFase = 0;
function pulsarMonolito() {
  _pFase += 0.025;
  const m = Engine.objetos.find(o=>o.tipo==="monolito");
  if (m) {
    const a = 180 + Math.round(Math.sin(_pFase)*75);
    m.colorRGB = [0, a, Math.round(a*0.53)];
  }
  requestAnimationFrame(pulsarMonolito);
}

function glitch() {
  const c = Engine.canvas;
  if (!c) return;
  c.style.transform = `translate(${(Math.random()-.5)*5}px,${(Math.random()-.5)*2}px)`;
  c.style.filter = `hue-rotate(${Math.random()*15}deg) brightness(1.1)`;
  setTimeout(()=>{ c.style.transform=""; c.style.filter=""; },70);
  setTimeout(glitch, 9000 + Math.random()*15000);
}
