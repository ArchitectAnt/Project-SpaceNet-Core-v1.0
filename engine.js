/* ================================================================
   SPACE NET — ENGINE.JS v2
   Motor 3D corregido. Canvas 2D con perspectiva real.
   Primera persona. Física. Bobbing. Colisiones.
================================================================ */
"use strict";

// Configuración global accesible
window.Cfg = {
  sensH: 5,
  sensV: 5,
};

const Engine = {
  canvas: null, ctx: null, W: 0, H: 0,
  cam: {
    x: 0, y: 275, z: 600,
    rotY: Math.PI,  // mirando al monolito
    rotX: 0,
    fov: 75,
  },
  vel: { x: 0, z: 0 },
  friction: 0.88,
  bobbing: { fase: 0, activo: false },
  input: {
    adelante: false, atras: false, izq: false, der: false,
    dMirX: 0, dMirY: 0,
  },
  objetos: [],
  radio: 35,
  corriendo: false,
  tPrev: 0,
};

// ── INIT ──────────────────────────────────────────────────────────
function initEngine() {
  Engine.canvas = document.getElementById("canvas-3d");
  Engine.ctx    = Engine.canvas.getContext("2d");
  resize(); window.addEventListener("resize", resize);
  Engine.corriendo = true;
  Engine.tPrev = performance.now();
  requestAnimationFrame(loop);
}

function resize() {
  Engine.W = Engine.canvas.width  = window.innerWidth;
  Engine.H = Engine.canvas.height = window.innerHeight;
}

// ── LOOP ──────────────────────────────────────────────────────────
function loop(now) {
  if (!Engine.corriendo) return;
  const dt = Math.min((now - Engine.tPrev) / 1000, 0.05);
  Engine.tPrev = now;
  update(dt);
  draw();
  hudTick();
  requestAnimationFrame(loop);
}

// ── UPDATE ────────────────────────────────────────────────────────
function update(dt) {
  const cam = Engine.cam;
  const inp = Engine.input;
  const sensBase = 0.0025;

  // Sensibilidad desde config
  const sensH = sensBase * (Cfg.sensH / 5);
  const sensV = sensBase * (Cfg.sensV / 5) * 0.7;

  cam.rotY += inp.dMirX * sensH;
  cam.rotX -= inp.dMirY * sensV;

  const lim = (55 * Math.PI) / 180;
  cam.rotX = Math.max(-lim, Math.min(lim, cam.rotX));

  inp.dMirX = 0; inp.dMirY = 0;

  // Movimiento
  const fuerza = 750;
  const cY = Math.cos(cam.rotY), sY = Math.sin(cam.rotY);
  let ax = 0, az = 0;
  if (inp.adelante) { az += cY; ax += sY; }
  if (inp.atras)    { az -= cY; ax -= sY; }
  if (inp.der)      { ax += cY; az -= sY; }
  if (inp.izq)      { ax -= cY; az += sY; }

  const mag = Math.sqrt(ax*ax + az*az);
  if (mag > 0) { ax /= mag; az /= mag; }

  Engine.vel.x += ax * fuerza * dt;
  Engine.vel.z += az * fuerza * dt;

  // Fricción
  const fr = Math.pow(Engine.friction, dt * 60);
  Engine.vel.x *= fr;
  Engine.vel.z *= fr;

  // Clamp velocidad
  const vMax = 280;
  const vMag = Math.sqrt(Engine.vel.x**2 + Engine.vel.z**2);
  if (vMag > vMax) { Engine.vel.x *= vMax/vMag; Engine.vel.z *= vMax/vMag; }

  // Colisión y movimiento
  const nx = cam.x + Engine.vel.x * dt;
  const nz = cam.z + Engine.vel.z * dt;

  if (!colision(nx, nz)) {
    cam.x = nx; cam.z = nz;
  } else if (!colision(nx, cam.z)) {
    cam.x = nx; Engine.vel.z = 0;
  } else if (!colision(cam.x, nz)) {
    cam.z = nz; Engine.vel.x = 0;
  } else {
    Engine.vel.x = 0; Engine.vel.z = 0;
  }

  // Bobbing
  if (vMag > 15) {
    Engine.bobbing.fase += 0.07 * Math.sqrt(vMag) * dt;
    cam.y = 275 + Math.sin(Engine.bobbing.fase) * 5;
    Engine.bobbing.activo = true;
  } else {
    cam.y += (275 - cam.y) * 0.12;
    Engine.bobbing.activo = false;
  }
}

function colision(nx, nz) {
  for (const o of Engine.objetos) {
    if (!o.solido) continue;
    const r = Engine.radio;
    if (nx + r > o.x && nx - r < o.x + o.w &&
        nz + r > o.z && nz - r < o.z + o.d) return true;
  }
  return false;
}

// ── DRAW ──────────────────────────────────────────────────────────
function draw() {
  const ctx = Engine.ctx, W = Engine.W, H = Engine.H, cam = Engine.cam;

  // Fondo negro total
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Línea de horizonte sutil
  const horizY = H * 0.5 + Math.sin(cam.rotX) * H * 0.45;

  // Suelo — degradado oscuro
  const gSuelo = ctx.createLinearGradient(0, horizY, 0, H);
  gSuelo.addColorStop(0, "rgba(0,8,4,1)");
  gSuelo.addColorStop(1, "rgba(0,3,1,1)");
  ctx.fillStyle = gSuelo;
  ctx.fillRect(0, horizY, W, H - horizY);

  // Techo — negro absoluto con tinte
  const gTecho = ctx.createLinearGradient(0, 0, 0, horizY);
  gTecho.addColorStop(0, "rgba(0,0,0,1)");
  gTecho.addColorStop(1, "rgba(0,5,3,1)");
  ctx.fillStyle = gTecho;
  ctx.fillRect(0, 0, W, horizY);

  // Rejilla del suelo
  dibujarRejilla(ctx, W, H, cam, horizY);

  // Objetos (ordenados por distancia)
  const ordenados = Engine.objetos.map(o => {
    const dx = o.x + o.w/2 - cam.x;
    const dz = o.z + o.d/2 - cam.z;
    return { ...o, dist: Math.sqrt(dx*dx + dz*dz) };
  }).sort((a,b) => b.dist - a.dist);

  for (const o of ordenados) dibujarObjeto(ctx, W, H, cam, o);

  // Partículas
  dibujarParticulas(ctx, W, H, cam);

  // Niebla de profundidad arriba
  const niebla = ctx.createLinearGradient(0, 0, 0, horizY * 0.6);
  niebla.addColorStop(0, "rgba(0,0,0,0.5)");
  niebla.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = niebla;
  ctx.fillRect(0, 0, W, horizY * 0.6);
}

// ── REJILLA ───────────────────────────────────────────────────────
function dibujarRejilla(ctx, W, H, cam, horizY) {
  const cel = 80;
  const dist = 3000;
  const fov = cam.fov * Math.PI / 180;
  const f   = (W/2) / Math.tan(fov/2);

  ctx.lineWidth = 0.6;

  // Líneas hacia horizonte
  for (let i = -14; i <= 14; i++) {
    const wx = Math.round(cam.x / cel) * cel + i * cel;
    const al = Math.max(0, 1 - Math.abs(i)/15) * 0.5;
    ctx.strokeStyle = `rgba(0,255,136,${al})`;

    const pCerca = proyectar2(wx, 0, cam.z + 1,    cam, W, H, f);
    const pLejos = proyectar2(wx, 0, cam.z + dist,  cam, W, H, f);
    if (!pCerca || !pLejos) continue;

    ctx.beginPath();
    ctx.moveTo(pCerca.x, Math.max(pCerca.y, horizY));
    ctx.lineTo(pLejos.x,  Math.max(pLejos.y,  horizY));
    ctx.stroke();
  }

  // Líneas horizontales
  for (let j = 1; j <= 16; j++) {
    const wz  = Math.round(cam.z / cel) * cel + j * cel;
    const al  = Math.max(0, 1 - j/17) * 0.4;
    ctx.strokeStyle = `rgba(0,255,136,${al})`;

    const pL = proyectar2(cam.x - dist/2, 0, wz, cam, W, H, f);
    const pR = proyectar2(cam.x + dist/2, 0, wz, cam, W, H, f);
    if (!pL || !pR) continue;

    const yClamp = Math.max(pL.y, horizY);
    ctx.beginPath();
    ctx.moveTo(pL.x, yClamp);
    ctx.lineTo(pR.x, yClamp);
    ctx.stroke();
  }
}

// ── OBJETO / CUBO ─────────────────────────────────────────────────
function dibujarObjeto(ctx, W, H, cam, o) {
  const fov = cam.fov * Math.PI / 180;
  const f   = (W/2) / Math.tan(fov/2);

  // 8 vértices
  const vs = [
    [o.x,       -o.h, o.z      ],
    [o.x+o.w,   -o.h, o.z      ],
    [o.x+o.w,   -o.h, o.z+o.d  ],
    [o.x,       -o.h, o.z+o.d  ],
    [o.x,        0,   o.z      ],
    [o.x+o.w,    0,   o.z      ],
    [o.x+o.w,    0,   o.z+o.d  ],
    [o.x,        0,   o.z+o.d  ],
  ].map(v => proyectar2(v[0], v[1], v[2], cam, W, H, f));

  if (vs.some(p => !p)) return;

  const caras = [
    { idx:[0,1,5,4], brillo:1.0 },   // frente
    { idx:[1,2,6,5], brillo:0.6 },   // derecha
    { idx:[2,3,7,6], brillo:0.7 },   // atrás
    { idx:[3,0,4,7], brillo:0.6 },   // izquierda
    { idx:[4,5,6,7], brillo:0.4 },   // techo
  ];

  // Alpha por distancia
  const distAlpha = Math.max(0, 1 - o.dist / 2200);

  for (const cara of caras) {
    const pts = cara.idx.map(i => vs[i]);
    if (pts.some(p => !p)) continue;

    // Face culling
    const ax = pts[1].x - pts[0].x, ay = pts[1].y - pts[0].y;
    const bx = pts[2].x - pts[0].x, by = pts[2].y - pts[0].y;
    if (ax * by - ay * bx > 0) continue;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();

    // Relleno
    const c = o.colorRGB || [0,255,136];
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.12 * cara.brillo * distAlpha})`;
    ctx.fill();

    // Borde neón
    ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${cara.brillo * distAlpha * 0.9})`;
    ctx.lineWidth = o.tipo === "monolito" ? 1.5 : 1;
    ctx.stroke();
  }

  // Texto en cara frontal
  if (o.texto && o.dist < 1000) {
    const centro = proyectar2(o.x+o.w/2, -o.h/2, o.z, cam, W, H, f);
    if (centro) {
      const c = o.colorRGB || [0,255,136];
      const a = Math.max(0, 1 - o.dist/1000);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.font = `${Math.max(9, 13 - o.dist/80)}px 'Courier New'`;
      ctx.textAlign = "center";
      ctx.fillText(o.texto, centro.x, centro.y);

      // Código real debajo si es monolito
      if (o.tipo === "monolito" && o.dist < 500) {
        ctx.font = "7px 'Courier New'";
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a*0.5})`;
        const lineas = [
          "function initEngine(){",
          "  canvas=document.get",
          "  ElementById('c3d');",
          "  ctx=canvas.getContext",
          "  ('2d');resize();",
          "  requestAnimationFrame",
          "  (loop);",
          "}"
        ];
        lineas.forEach((l,i)=>{
          ctx.fillText(l, centro.x, centro.y + 20 + i*11);
        });
      }
    }
  }
}

// ── PARTÍCULAS ────────────────────────────────────────────────────
const _part = Array.from({length:35},()=>({
  x:(Math.random()-.5)*5000,
  y:-(Math.random()*700+50),
  z:(Math.random()-.5)*5000,
  v:Math.random()*18+4,
}));

function dibujarParticulas(ctx, W, H, cam) {
  const fov = cam.fov*Math.PI/180;
  const f   = (W/2)/Math.tan(fov/2);
  for(const p of _part){
    p.y += p.v * 0.016;
    if(p.y>0){ p.y=-(Math.random()*700+50); p.x=(Math.random()-.5)*5000; p.z=(Math.random()-.5)*5000; }
    const pr = proyectar2(p.x,p.y,p.z,cam,W,H,f);
    if(!pr) continue;
    const d = Math.sqrt((p.x-cam.x)**2+(p.z-cam.z)**2);
    const a = Math.max(0,1-d/2500)*0.35;
    ctx.fillStyle=`rgba(0,255,136,${a})`;
    ctx.beginPath(); ctx.arc(pr.x,pr.y,1,0,Math.PI*2); ctx.fill();
  }
}

// ── PROYECCIÓN ────────────────────────────────────────────────────
function proyectar2(wx, wy, wz, cam, W, H, f) {
  const dx = wx - cam.x;
  const dy = wy - cam.y;
  const dz = wz - cam.z;

  // Rotación Y
  const cY = Math.cos(-cam.rotY), sY = Math.sin(-cam.rotY);
  const rx  =  dx*cY - dz*sY;
  const rz0 =  dx*sY + dz*cY;

  // Rotación X
  const cX = Math.cos(-cam.rotX), sX = Math.sin(-cam.rotX);
  const ry  =  dy*cX - rz0*sX;
  const rz  =  dy*sX + rz0*cX;

  if (rz < 0.5) return null;

  const sx = (rx/rz)*f + W/2;
  const sy = (ry/rz)*f + H/2;

  return { x:sx, y:sy, z:rz };
}

// ── HUD TICK ──────────────────────────────────────────────────────
function hudTick() {
  const cam = Engine.cam;
  const ex = document.getElementById("coord-x");
  const ey = document.getElementById("coord-y");
  const ez = document.getElementById("coord-z");
  const pz = document.getElementById("pov-z");
  if(ex) ex.textContent = Math.round(cam.x);
  if(ey) ey.textContent = Math.round(cam.y);
  if(ez) ez.textContent = Math.round(cam.z);
  if(pz) pz.textContent = Math.round(cam.z);
}
