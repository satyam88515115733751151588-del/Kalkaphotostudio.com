/* =============================================
   DIWALI NIGHT-SKY HERO
   Fireworks + sky lanterns + a lit-up skyline.
   Self-contained: needs #festive-stage > #festive-canvas
   ============================================= */
(function () {
  const stage = document.getElementById('festive-stage');
  const canvas = document.getElementById('festive-canvas');
  if (!stage || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  // seeded RNG so the skyline stays identical on every resize
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let W = 0, H = 0, dpr = 1, unit = 1, sc = 1, groundY = 0, groundH = 0;
  let skyGrad, houseCanvas;
  let stars = [], bulbs = [], diyas = [], lanterns = [];
  let rockets = [], particles = [], flashes = [];
  let drag = null, suppressClick = false;
  let t = 0, nextShot = 700, running = false, raf = 0, last = 0;

  /* ---------- glow sprites (cached) ---------- */
  const glowCache = {};
  function glow(r, g, b) {
    const key = r + ',' + g + ',' + b;
    if (glowCache[key]) return glowCache[key];
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
    gr.addColorStop(0.22, `rgba(${r},${g},${b},0.5)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (glowCache[key] = c);
  }
  const BULB_COLORS = [
    [255, 190, 80], [255, 150, 50], [255, 215, 120], // warm (default)
    [255, 80, 120], [110, 230, 160], [120, 180, 255], [255, 245, 225]
  ];
  const lanternGlow = glow(255, 140, 40);
  const flameGlow = glow(255, 225, 150);

  /* ---------- scene build (stars, skyline, lights) ---------- */
  function buildScene() {
    unit = clamp(W / 1280, 0.6, 1.15);
    sc = clamp(H / 650, 0.6, 1.35);
    groundH = Math.round(clamp(H * 0.05, 20, 44));
    groundY = H - groundH;

    skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#02030d');
    skyGrad.addColorStop(0.45, '#0a0d2e');
    skyGrad.addColorStop(0.75, '#1e1446');
    skyGrad.addColorStop(0.92, '#4d2050');
    skyGrad.addColorStop(1, '#8c3b2b');

    // stars (no moon — Diwali falls on the new-moon night)
    const rs = mulberry(11);
    stars = [];
    const nStars = Math.round(clamp((W * H) / 4500, 60, 320));
    for (let i = 0; i < nStars; i++) {
      stars.push({
        x: rs() * W, y: rs() * groundY * 0.8,
        r: 0.3 + rs() * 1.1, p: rs() * TAU, s: 0.6 + rs() * 2.2,
        a: 0.35 + rs() * 0.65
      });
    }

    // skyline on an offscreen canvas
    houseCanvas = document.createElement('canvas');
    houseCanvas.width = Math.round(W * dpr);
    houseCanvas.height = Math.round(H * dpr);
    const h = houseCanvas.getContext('2d');
    h.scale(dpr, dpr);
    const rnd = mulberry(42);
    const R = (a, b) => a + rnd() * (b - a);
    bulbs = []; diyas = [];

    // walk a polyline and drop bulbs at even spacing
    function addLine(pts, spacing, opt) {
      let carry = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        const len = Math.hypot(x2 - x1, y2 - y1);
        let d = carry;
        while (d <= len) {
          const k = len ? d / len : 0;
          pushBulb(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, opt);
          d += spacing;
        }
        carry = d - len;
      }
    }
    function quadPts(x1, y1, cx, cy, x2, y2, n) {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const k = i / n, m = 1 - k;
        out.push([m * m * x1 + 2 * m * k * cx + k * k * x2, m * m * y1 + 2 * m * k * cy + k * k * y2]);
      }
      return out;
    }
    let bi = 0;
    function pushBulb(x, y, o) {
      let ci;
      if (o.multi) ci = [0, 1, 2, 3, 4, 5, 6][Math.floor(rnd() * 7)];
      else ci = Math.floor(rnd() * 3);
      bulbs.push({
        x, y, c: BULB_COLORS[ci], s: o.size,
        ph: o.mode === 1 ? bi * 0.55 : rnd() * TAU,
        sp: o.mode === 1 ? 3 : 1.5 + rnd() * 3,
        base: o.alpha
      });
      bi++;
    }

    // --- far layer: taller, hazy, a hint of lights ---
    let x = -20;
    while (x < W + 20) {
      const w = R(50, 110) * unit, ht = R(120, 230) * sc;
      const top = groundY - ht;
      const gr = h.createLinearGradient(0, top, 0, groundY);
      gr.addColorStop(0, 'rgb(22,18,52)'); gr.addColorStop(1, 'rgb(62,32,62)');
      h.fillStyle = gr;
      h.fillRect(x, top, w, ht);
      if (rnd() < 0.4) { // small dome / gable cap
        h.beginPath();
        h.moveTo(x + w * 0.15, top); h.quadraticCurveTo(x + w / 2, top - w * 0.5, x + w * 0.85, top);
        h.fill();
      }
      // dim windows
      h.fillStyle = 'rgba(255,196,120,0.55)';
      for (let wy = top + 14 * sc; wy < groundY - 14 * sc; wy += 24 * sc)
        for (let wx = x + 10 * unit; wx < x + w - 12 * unit; wx += 18 * unit)
          if (rnd() < 0.22) h.fillRect(wx, wy, 3.5 * unit, 5 * unit);
      if (rnd() < 0.35)
        addLine([[x, top], [x + w, top]], 13 * unit, { size: 9 * unit, alpha: 0.55, mode: 0, multi: false });
      x += w + R(0, 8) * unit;
    }

    // --- near layer: houses covered in lights ---
    x = -10;
    while (x < W + 10) {
      const w = R(72, 140) * unit, ht = R(64, 130) * sc;
      const type = rnd();
      const top = groundY - ht;
      const mode = rnd() < 0.5 ? 1 : 0;
      const multi = rnd() < 0.3;
      const o = { size: 15 * unit, alpha: 1, mode, multi };
      const sp = 9.5 * unit;
      h.fillStyle = '#080614';

      let roofTop = top;
      if (type < 0.4) { // flat roof with parapet + roof room
        h.fillRect(x, top, w, ht);
        h.fillRect(x - 2, top - 4 * sc, w + 4, 4 * sc);
        if (rnd() < 0.5) {
          const rw = w * 0.32, rh = 16 * sc, rx = x + R(w * 0.1, w * 0.55);
          h.fillRect(rx, top - 4 * sc - rh, rw, rh);
          addLine([[rx, top - 4 * sc - rh], [rx + rw, top - 4 * sc - rh]], sp, o);
        }
        addLine([[x - 2, top - 4 * sc], [x + w + 2, top - 4 * sc]], sp, o);
      } else if (type < 0.75) { // gable roof
        const gh = w * 0.28;
        h.beginPath();
        h.moveTo(x - 3, top + gh); h.lineTo(x + w / 2, top); h.lineTo(x + w + 3, top + gh);
        h.closePath(); h.fill();
        h.fillRect(x, top + gh - 1, w, ht - gh + 1);
        addLine([[x - 3, top + gh], [x + w / 2, top], [x + w + 3, top + gh]], sp, o);
      } else { // mandir with shikhara spire
        h.fillRect(x, top, w, ht);
        h.fillRect(x - 2, top - 3 * sc, w + 4, 3 * sc);
        const sx = x + w * 0.22, ex = x + w * 0.78, peak = top - w * 0.55;
        const mx = x + w / 2;
        h.beginPath();
        h.moveTo(sx, top - 3 * sc);
        h.quadraticCurveTo(sx + 2, peak + w * 0.2, mx, peak);
        h.quadraticCurveTo(ex - 2, peak + w * 0.2, ex, top - 3 * sc);
        h.closePath(); h.fill();
        h.fillRect(mx - 1, peak - 9 * sc, 2, 9 * sc); // kalash pole
        h.beginPath(); h.arc(mx, peak - 10 * sc, 2.5 * unit, 0, TAU); h.fill();
        addLine(quadPts(sx, top - 3 * sc, sx + 2, peak + w * 0.2, mx, peak, 8), sp, o);
        addLine(quadPts(mx, peak, ex - 2, peak + w * 0.2, ex, top - 3 * sc, 8), sp, o);
        addLine([[x - 2, top - 3 * sc], [sx, top - 3 * sc]], sp, o);
        addLine([[ex, top - 3 * sc], [x + w + 2, top - 3 * sc]], sp, o);
        roofTop = peak;
      }

      // windows
      const cols = Math.max(2, Math.floor(w / (24 * unit)));
      const gap = w / cols;
      const rows = Math.max(1, Math.floor((ht - 24 * sc) / (28 * sc)));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = x + gap * c + gap / 2 - 4 * unit, wy = top + (type < 0.75 ? w * 0.28 : 0) + 12 * sc + r * 28 * sc;
          if (wy + 12 * sc > groundY - 14 * sc) continue;
          if (rnd() < 0.5) {
            const g2 = h.createLinearGradient(0, wy, 0, wy + 12 * sc);
            g2.addColorStop(0, 'rgba(255,214,130,0.95)'); g2.addColorStop(1, 'rgba(255,150,60,0.9)');
            h.fillStyle = g2;
          } else h.fillStyle = 'rgba(30,24,60,0.7)';
          h.fillRect(wx, wy, 8 * unit, 12 * sc);
        }
      }
      // lit doorway arch
      if (rnd() < 0.7) {
        const dx = x + w / 2 - 5 * unit;
        h.fillStyle = 'rgba(255,170,70,0.9)';
        h.beginPath(); h.rect(dx, groundY - 17 * sc, 10 * unit, 17 * sc);
        h.arc(dx + 5 * unit, groundY - 17 * sc, 5 * unit, Math.PI, 0); h.fill();
      }

      // sagging "jhalar" swag across the facade
      if (rnd() < 0.6) {
        const sy = top + (type < 0.75 ? w * 0.28 : 0) + 6 * sc;
        const pts = quadPts(x + 3, sy, x + w / 2, sy + w * 0.2, x + w - 3, sy, 14);
        h.strokeStyle = 'rgba(120,90,50,0.45)'; h.lineWidth = 0.8;
        h.beginPath(); pts.forEach((p, i) => i ? h.lineTo(p[0], p[1]) : h.moveTo(p[0], p[1])); h.stroke();
        addLine(pts, sp * 1.05, o);
      }
      // hanging light strings
      if (rnd() < 0.4) {
        const n = 2 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) {
          const dxs = x + (w / (n + 1)) * (k + 1), len = R(0.25, 0.5) * ht;
          const y0 = type < 0.4 ? top - 2 * sc : top + (type < 0.75 ? w * 0.28 * Math.abs(1 - 2 * (k + 1) / (n + 1)) : 0);
          addLine([[dxs, y0], [dxs, y0 + len]], 8 * unit, { ...o, size: 12 * unit });
        }
      }
      x += w + R(0, 4) * unit;
    }

    // ground strip
    h.fillStyle = '#05040c';
    h.fillRect(0, groundY, W, groundH + 2);
    // diyas on the ground (bowls static, flames animated)
    for (let dx = 12; dx < W; dx += R(24, 40) * unit) {
      const dy = groundY + groundH * 0.55;
      diyas.push({ x: dx, y: dy, p: rnd() * TAU });
      h.fillStyle = '#7a3418';
      h.beginPath(); h.ellipse(dx, dy, 4.5 * unit, 2.4 * unit, 0, 0, Math.PI); h.fill();
    }
  }

  /* ---------- lanterns ---------- */
  function makeLantern(initial) {
    const s = rand(18, 38) * Math.max(unit, 0.8);
    const depth = (s - 18 * Math.max(unit, 0.8)) / (20 * Math.max(unit, 0.8));
    return {
      x: rand(0.03, 0.97) * W,
      y: initial ? rand(0.05, 0.95) * groundY : groundY - rand(0, 10),
      s, v: (0.14 + depth * 0.2 + rand(0, 0.08)) * sc,
      sa: rand(8, 22), sf: rand(0.3, 0.7), sp: rand(0, TAU), fp: rand(0, TAU),
      al: 0.55 + 0.45 * clamp(depth, 0, 1), drift: rand(-0.05, 0.12),
      swk: 1, held: false, fvx: 0, fvy: 0, dvx: 0, dvy: 0, ox: 0, oy: 0, tilt: 0
    };
  }
  function initLanterns() {
    lanterns = [];
    const n = Math.round(clamp(W / 85, 7, 16));
    for (let i = 0; i < n; i++) lanterns.push(makeLantern(true));
    lanterns.sort((a, b) => a.s - b.s);
  }
  function drawLantern(L) {
    const w = L.s, hh = L.s * 1.3;
    const x = L.x + Math.sin(t * L.sf + L.sp) * L.sa * L.swk;
    const fl = 0.85 + 0.15 * Math.sin(t * 7 + L.fp) + (Math.random() - 0.5) * 0.05;
    const rise = L.held ? 1 : clamp((groundY - L.y + 10) / 80, 0, 1);       // fade in off the rooftops
    const fade = L.held ? 1 : clamp((L.y + hh) / (H * 0.15), 0, 1);          // fade out near the top
    const al = L.al * rise * fade;
    if (al <= 0.01) return;
    ctx.save();
    ctx.translate(x, L.y);
    ctx.rotate(Math.cos(t * L.sf + L.sp) * 0.06 * L.swk + L.tilt);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, al * 0.55 * fl * (L.held ? 1.5 : 1));
    const hs = w * (L.held ? 5 : 4.2);
    ctx.drawImage(lanternGlow, -hs / 2, -hs / 2, hs, hs);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.moveTo(-w * 0.30, hh / 2);
    ctx.bezierCurveTo(-w * 0.55, hh * 0.2, -w * 0.58, -hh * 0.25, -w * 0.36, -hh * 0.42);
    ctx.quadraticCurveTo(0, -hh * 0.58, w * 0.36, -hh * 0.42);
    ctx.bezierCurveTo(w * 0.58, -hh * 0.25, w * 0.55, hh * 0.2, w * 0.30, hh / 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -hh / 2, 0, hh / 2);
    g.addColorStop(0, 'rgb(190,70,25)'); g.addColorStop(0.55, 'rgb(255,150,50)'); g.addColorStop(1, 'rgb(255,226,140)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(110,40,10,0.35)'; ctx.lineWidth = Math.max(0.6, w * 0.03);
    for (const sx of [-0.17, 0.17]) {
      ctx.beginPath(); ctx.moveTo(sx * w, -hh * 0.47);
      ctx.quadraticCurveTo(sx * w * 1.9, 0, sx * w * 0.9, hh / 2); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(90,30,10,0.6)';
    ctx.beginPath(); ctx.moveTo(-w * 0.3, hh / 2); ctx.lineTo(w * 0.3, hh / 2); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = al * fl;
    const fs = w * 0.95;
    ctx.drawImage(flameGlow, -fs / 2, hh * 0.38 - fs / 2, fs, fs);
    ctx.restore();
  }

  /* ---------- fireworks ---------- */
  const HUES = [45, 45, 30, 20, 0, 350, 320, 140, 185, 215, 275];
  const TYPES = ['peony', 'peony', 'ring', 'willow', 'crackle', 'double', 'multi', 'heart'];
  const maxParticles = () => (W < 600 ? 700 : 1500);

  function spark(x, y, vx, vy, o) {
    if (particles.length > maxParticles()) return;
    particles.push(Object.assign({
      x, y, vx, vy, life: 1, decay: 0.015, drag: 0.965, grav: 0.03 * sc,
      h: 45, s: 100, l: 62, size: 1.8, k: 2.4, sparkle: false, tw: false
    }, o));
  }

  function launch(x, ty, type) {
    const y0 = groundY - 4;
    ty = clamp(ty, H * 0.1, groundY - 90 * sc);
    const g = 0.07 * sc;
    rockets.push({
      x, y: y0, vx: rand(-0.5, 0.5) * sc, vy: -Math.sqrt(2 * g * (y0 - ty)), g, ty,
      h: HUES[Math.floor(Math.random() * HUES.length)],
      type: type || TYPES[Math.floor(Math.random() * TYPES.length)]
    });
  }

  function explode(x, y, type, h) {
    const n0 = W < 600 ? 0.65 : 1;
    const base = rand(3.2, 4.8) * sc;
    const h2 = (h + rand(120, 200)) % 360;
    flashes.push({ x, y, a: 0.5, h });
    for (let i = 0; i < 10; i++) // white-hot core
      spark(x, y, rand(-1, 1) * 5 * sc, rand(-1, 1) * 5 * sc, { h: 45, s: 20, l: 90, decay: 0.07, size: 2.4 });

    if (type === 'peony' || type === 'double') {
      const n = Math.round(90 * n0);
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), s = base * (0.7 + 0.3 * Math.random());
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, { h, decay: rand(0.011, 0.017) });
      }
      if (type === 'double')
        for (let i = 0; i < n * 0.6; i++) {
          const a = rand(0, TAU), s = base * 0.5 * (0.7 + 0.3 * Math.random());
          spark(x, y, Math.cos(a) * s, Math.sin(a) * s, { h: h2, decay: rand(0.013, 0.019) });
        }
    } else if (type === 'ring') {
      const n = Math.round(70 * n0), tilt = rand(0.15, 1), rot = rand(0, TAU);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, cx = Math.cos(a) * base, cy = Math.sin(a) * base * tilt;
        spark(x, y, cx * Math.cos(rot) - cy * Math.sin(rot), cx * Math.sin(rot) + cy * Math.cos(rot),
          { h, drag: 0.97, decay: 0.014 });
      }
    } else if (type === 'willow') {
      const n = Math.round(65 * n0);
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), s = rand(0.8, 3.6) * sc;
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s,
          { h: 42, s: 95, l: 66, drag: 0.972, grav: 0.045 * sc, decay: 0.0065, k: 3.8, size: 1.5 });
      }
    } else if (type === 'crackle') {
      const n = Math.round(60 * n0);
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), s = base * (0.6 + 0.4 * Math.random());
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, { h: 40, s: 80, l: 75, decay: 0.014, sparkle: true, tw: true });
      }
    } else if (type === 'multi') {
      const n = Math.round(90 * n0), hs = [h, h2, 45];
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), s = base * (0.65 + 0.35 * Math.random());
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, { h: hs[i % 3], decay: rand(0.011, 0.017) });
      }
    } else if (type === 'heart') {
      const n = Math.round(60 * n0);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const hx = 16 * Math.pow(Math.sin(a), 3);
        const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        spark(x, y, (hx / 16) * base * 0.95, (hy / 16) * base * 0.95,
          { h: rand(335, 358), drag: 0.968, decay: 0.014 });
      }
    }
  }

  function salvo() {
    const n = Math.random() < 0.25 ? 3 + Math.floor(Math.random() * 2) : 1;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        if (!running || rockets.length > 9) return;
        launch(rand(0.08, 0.92) * W, rand(0.12, 0.5) * H);
      }, i * 180);
    }
  }

  /* ---------- update ---------- */
  function update(dt, dms) {
    // auto launch
    if (!reduceMotion && t > 0.7) {
      nextShot -= dms;
      if (nextShot <= 0) { salvo(); nextShot = rand(380, 1100); }
    }
    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.vy += r.g * dt; r.x += r.vx * dt; r.y += r.vy * dt;
      spark(r.x, r.y, rand(-0.3, 0.3), rand(0.3, 1), { h: 40, s: 100, l: 70, decay: 0.06, drag: 0.9, size: 1.3, k: 1 });
      if (r.vy >= -0.4 || r.y <= r.ty) { explode(r.x, r.y, r.type, r.h); rockets.splice(i, 1); }
    }
    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const d = Math.pow(p.drag, dt);
      p.vx *= d; p.vy = p.vy * d + p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        if (p.sparkle) for (let k = 0; k < 2; k++)
          spark(p.x, p.y, rand(-1.4, 1.4), rand(-1.4, 1.4), { h: 50, s: 40, l: 92, decay: 0.07, size: 1.3, k: 1 });
        particles.splice(i, 1);
      }
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].a -= 0.03 * dt;
      if (flashes[i].a <= 0) flashes.splice(i, 1);
    }
    // lanterns
    for (const L of lanterns) {
      if (L.held && drag) {
        // follow the finger / cursor with a little lag, and track velocity for the throw
        const tx = drag.x + L.ox, ty = clamp(drag.y + L.oy, -L.s * 0.5, groundY - 20);
        const px = L.x, py = L.y, k = Math.min(1, 0.4 * dt);
        L.x += (tx - L.x) * k; L.y += (ty - L.y) * k;
        L.dvx += ((L.x - px) / dt - L.dvx) * 0.3;
        L.dvy += ((L.y - py) / dt - L.dvy) * 0.3;
        L.tilt += (clamp(L.dvx * 0.05, -0.4, 0.4) - L.tilt) * 0.2 * dt;
        L.swk = 0;
        continue;
      }
      // free flight: gentle rise + whatever momentum a throw left behind
      L.y -= L.v * dt; L.x += L.drift * dt;
      L.x += L.fvx * dt; L.y += L.fvy * dt;
      const fd = Math.pow(0.94, dt);
      L.fvx *= fd; L.fvy *= fd;
      L.swk += (1 - L.swk) * 0.02 * dt;
      L.tilt += (clamp(L.fvx * 0.05, -0.4, 0.4) - L.tilt) * 0.1 * dt;
      if (L.y < -L.s * 2 || L.x > W + 60 || L.x < -60) {
        Object.assign(L, makeLantern(false));
        lanterns.sort((a, b) => a.s - b.s);
      }
    }
  }

  /* ---------- draw ---------- */
  function draw() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);

    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      const tw = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(t * s.s + s.p);
      ctx.globalAlpha = s.a * tw;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // burst flashes lighting the sky
    ctx.globalCompositeOperation = 'lighter';
    for (const f of flashes) {
      const rad = 300 * sc;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
      g.addColorStop(0, `hsla(${f.h},100%,60%,${f.a * 0.35})`);
      g.addColorStop(1, `hsla(${f.h},100%,50%,0)`);
      ctx.fillStyle = g; ctx.fillRect(f.x - rad, f.y - rad, rad * 2, rad * 2);
    }

    // rockets + sparks
    ctx.lineCap = 'round';
    for (const r of rockets) {
      ctx.strokeStyle = 'rgba(255,235,180,0.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x - r.vx * 3, r.y - r.vy * 3); ctx.lineTo(r.x, r.y); ctx.stroke();
    }
    for (const p of particles) {
      let a = Math.pow(Math.max(p.life, 0), 1.2);
      if (p.tw && Math.random() < 0.35) a *= 0.15;
      ctx.strokeStyle = `hsla(${p.h},${p.s}%,${p.l}%,${a})`;
      ctx.lineWidth = p.size;
      ctx.beginPath(); ctx.moveTo(p.x - p.vx * p.k, p.y - p.vy * p.k); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // lanterns (small/far first)
    for (const L of lanterns) drawLantern(L);

    // skyline
    ctx.globalAlpha = 1;
    ctx.drawImage(houseCanvas, 0, 0, W, H);

    // string lights
    ctx.globalCompositeOperation = 'lighter';
    for (const b of bulbs) {
      const a = reduceMotion ? b.base * 0.85 : b.base * (0.6 + 0.4 * Math.sin(t * b.sp + b.ph));
      ctx.globalAlpha = a;
      const g = glow(b.c[0], b.c[1], b.c[2]);
      ctx.drawImage(g, b.x - b.s / 2, b.y - b.s / 2, b.s, b.s);
      ctx.fillStyle = 'rgb(255,248,225)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.s * 0.1, 0, TAU); ctx.fill();
    }
    // diya flames
    for (const d of diyas) {
      const f = reduceMotion ? 0.9 : 0.8 + 0.2 * Math.sin(t * 9 + d.p) + (Math.random() - 0.5) * 0.08;
      ctx.globalAlpha = 0.85 * f;
      const s = 22 * unit;
      ctx.drawImage(flameGlow, d.x - s / 2, d.y - 3 * unit - s / 2, s, s);
      ctx.globalAlpha = f;
      ctx.fillStyle = 'rgb(255,225,150)';
      ctx.beginPath(); ctx.ellipse(d.x, d.y - 3.5 * unit, 1.4 * unit, 3 * unit, 0, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // fade in from pure night
    const intro = 1 - clamp(t / 1.8, 0, 1);
    if (intro > 0) { ctx.globalAlpha = intro; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    ctx.globalAlpha = 1;
  }

  /* ---------- loop / lifecycle ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dms = Math.min(now - last, 50);
    last = now;
    t += dms / 1000;
    update(dms / 16.667, dms);
    draw();
  }
  function start() {
    if (running || reduceMotion) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; H = h;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildScene();
    initLanterns();
    if (reduceMotion) { t = 2; draw(); }
  }

  /* ---------- interaction: drag lanterns, tap the sky for crackers ---------- */
  function canvasPos(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return [cx - r.left, cy - r.top];
  }
  function lanternAt(x, y) {
    for (let i = lanterns.length - 1; i >= 0; i--) { // front-most first
      const L = lanterns[i];
      const lx = L.x + Math.sin(t * L.sf + L.sp) * L.sa * L.swk;
      if (Math.hypot(x - lx, y - L.y) < Math.max(L.s * 0.8, 26)) return L;
    }
    return null;
  }
  function grab(x, y) {
    const L = lanternAt(x, y);
    if (!L) return false;
    L.x = L.x + Math.sin(t * L.sf + L.sp) * L.sa * L.swk; // absorb sway so it doesn't jump
    L.swk = 0; L.held = true; L.fvx = L.fvy = L.dvx = L.dvy = 0;
    L.ox = L.x - x; L.oy = L.y - y;
    drag = { L, x, y, id: null };
    canvas.style.cursor = 'grabbing';
    return true;
  }
  function release() {
    if (!drag) return;
    const L = drag.L;
    L.held = false;
    L.fvx = clamp(L.dvx, -12, 12); L.fvy = clamp(L.dvy, -12, 12); // throw
    drag = null;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 60);
    canvas.style.cursor = 'pointer';
  }

  if (!reduceMotion) {
    // mouse
    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      const [x, y] = canvasPos(e.clientX, e.clientY);
      if (grab(x, y)) e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
      const [x, y] = canvasPos(e.clientX, e.clientY);
      if (drag && drag.id === null) { drag.x = x; drag.y = y; }
      else if (!drag && e.target === canvas) canvas.style.cursor = lanternAt(x, y) ? 'grab' : 'pointer';
    });
    window.addEventListener('mouseup', () => { if (drag && drag.id === null) release(); });

    // touch — preventDefault only when a lantern is actually grabbed, so the page still scrolls elsewhere
    canvas.addEventListener('touchstart', e => {
      if (drag) return;
      const tc = e.changedTouches[0];
      const [x, y] = canvasPos(tc.clientX, tc.clientY);
      if (grab(x, y)) { drag.id = tc.identifier; e.preventDefault(); }
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      if (!drag || drag.id === null) return;
      for (const tc of e.changedTouches) if (tc.identifier === drag.id) {
        const [x, y] = canvasPos(tc.clientX, tc.clientY);
        drag.x = x; drag.y = y; e.preventDefault();
      }
    }, { passive: false });
    const touchDone = e => {
      if (!drag || drag.id === null) return;
      for (const tc of e.changedTouches) if (tc.identifier === drag.id) release();
    };
    canvas.addEventListener('touchend', touchDone);
    canvas.addEventListener('touchcancel', touchDone);
  }

  // tap / click empty sky to launch a cracker there
  canvas.addEventListener('click', e => {
    if (reduceMotion || suppressClick) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (lanternAt(x, y)) return;
    if (y > groundY - 40) return;
    launch(clamp(x + rand(-30, 30), 20, W - 20), y);
    if (rockets.length > 9) rockets.shift();
  });

  new ResizeObserver(resize).observe(stage);
  resize();

  // only animate while the hero is on screen
  new IntersectionObserver(entries => {
    entries[0].isIntersecting ? start() : stop();
  }, { threshold: 0.01 }).observe(stage);
})();
