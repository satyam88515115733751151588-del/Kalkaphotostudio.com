(function () {
  var SHOP_URL = "/contact.html"; // change this to your shop page link

  var css = `
    #promo-bar{position:fixed;top:0;left:0;right:0;z-index:99999;
      display:flex;align-items:center;justify-content:center;gap:14px;
      padding:9px 16px;color:#fff;overflow:hidden;
      background:linear-gradient(110deg,#6d1414 0%,#b8860b 35%,#e6b84a 50%,#b8860b 65%,#6d1414 100%);
      background-size:250% 100%;animation:promoShine 6s linear infinite;
      font:600 14.5px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      letter-spacing:.3px;box-shadow:0 3px 12px rgba(0,0,0,.3)}
    @keyframes promoShine{0%{background-position:100% 0}100%{background-position:-150% 0}}
    #promo-bar .pb-icon{flex:none;width:26px;height:26px;animation:promoWiggle 2.4s ease-in-out infinite;transform-origin:50% 20%}
    @keyframes promoWiggle{0%,60%,100%{transform:rotate(0)}10%{transform:rotate(-14deg)}20%{transform:rotate(12deg)}30%{transform:rotate(-8deg)}40%{transform:rotate(6deg)}}
    #promo-bar .pb-spark{animation:promoTwinkle 1.6s ease-in-out infinite;transform-origin:center}
    @keyframes promoTwinkle{0%,100%{opacity:.2;transform:scale(.6)}50%{opacity:1;transform:scale(1.15)}}
    #promo-bar .pb-text b{color:#fff3c4;text-transform:uppercase;letter-spacing:.8px}
    #promo-bar .pb-text em{font-style:normal;font-weight:500;opacity:.95}
    #promo-bar .pb-btn{flex:none;background:#fff;color:#6d1414;text-decoration:none;
      font-weight:800;font-size:12.5px;padding:6px 14px;border-radius:999px;
      text-transform:uppercase;letter-spacing:.6px;animation:promoPulse 1.8s ease-in-out infinite}
    #promo-bar .pb-btn:hover{background:#fff3c4}
    @keyframes promoPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.7)}50%{box-shadow:0 0 0 9px rgba(255,255,255,0)}}
    #promo-bar .pb-marquee{overflow:hidden;white-space:nowrap;flex:1 1 auto;min-width:0}
    #promo-bar .pb-track{display:inline-block;animation:none}
    @media(max-width:700px){
      #promo-bar{gap:10px;padding:8px 10px;font-size:13px;justify-content:flex-start}
      #promo-bar .pb-track{padding-left:100%;animation:promoScroll 14s linear infinite}
      @keyframes promoScroll{to{transform:translateX(-100%)}}
    }
    @media(prefers-reduced-motion:reduce){#promo-bar,#promo-bar *{animation:none!important}}
  `;

  var icon = `
    <svg class="pb-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.2 3H5.5A2.5 2.5 0 0 0 3 5.5v11.7c0 .66.26 1.3.73 1.77l9.3 9.3a2.5 2.5 0 0 0 3.54 0l9.7-9.7a2.5 2.5 0 0 0 0-3.54l-9.3-9.3A2.5 2.5 0 0 0 17.2 3Z" fill="#fff3c4" stroke="#6d1414" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="9.5" cy="9.5" r="2.3" fill="#6d1414"/>
      <path d="M13 21l7-7M14.2 14.6h.01M19.8 20.4h.01" stroke="#6d1414" stroke-width="2" stroke-linecap="round"/>
      <path class="pb-spark" d="M27 3v5M24.5 5.5h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var bar = document.createElement("div");
  bar.id = "promo-bar";
  bar.innerHTML =
    icon +
    '<div class="pb-marquee"><div class="pb-track"><span class="pb-text">' +
    '<b>Visit our shop today</b> &amp; get festive discounts! ' +
    '<em>Less price, yet better quality than others.</em></span></div></div>' +
    '<a class="pb-btn" href="' + SHOP_URL + '">Shop Now</a>';
  document.body.insertBefore(bar, document.body.firstChild);

  // ---- Push navbar & page content below the banner ----
  var shifted = new Map(); // element -> original top (px)

  function adjust() {
    var h = bar.offsetHeight;
    document.body.style.paddingTop = h + "px";

    document.querySelectorAll("body *").forEach(function (el) {
      if (el === bar || bar.contains(el)) return;
      var cs = getComputedStyle(el);
      if (cs.position !== "fixed" && cs.position !== "sticky") return;

      if (!shifted.has(el)) {
        var top = parseFloat(cs.top);
        // only elements pinned to the top edge (menus, headers)
        if (isNaN(top) || top > 40) return;
        shifted.set(el, top);
      }
      el.style.setProperty("top", shifted.get(el) + h + "px", "important");
    });
  }

  adjust();
  window.addEventListener("load", adjust);
  window.addEventListener("resize", adjust);
  setTimeout(adjust, 400);
  setTimeout(adjust, 1500);
  // catches menus that are added or restyled after the page loads
  new MutationObserver(function () { setTimeout(adjust, 50); })
    .observe(document.body, { childList: true });
})();
/* ---------- Festive fireworks intro ---------- */
(function () {
  var ALWAYS_PLAY = false;  // true = every page load, false = once per visit
  var DURATION = 8000;      // how long new fireworks keep launching (ms)

  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if (!ALWAYS_PLAY && sessionStorage.getItem("fw_done")) return;
    sessionStorage.setItem("fw_done", "1");
  } catch (e) {}

  var c = document.createElement("canvas");
  c.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:99998;pointer-events:none;transition:opacity 1.2s";
  document.body.appendChild(c);
  var ctx = c.getContext("2d"), W, H, S, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = innerWidth; H = innerHeight;
    S = Math.max(0.6, Math.min(1.2, Math.min(W, H) / 700));
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  var parts = [], rockets = [], flashes = [], events = [];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  function P(x, y, vx, vy, h, o) {
    o = o || {};
    parts.push({ x: x, y: y, px: x, py: y, vx: vx, vy: vy, h: h,
      l: o.l || 60, g: o.g == null ? 0.06 : o.g, f: o.f || 0.97,
      a: 1, d: o.d || 0.015, s: o.s || 2, tw: o.tw });
  }

  function flash(x, y, r, h) { flashes.push({ x: x, y: y, r: r, h: h, a: 1 }); }

  /* ----- burst shapes ----- */
  function burst(x, y, type, h) {
    var i, n, a, v;
    flash(x, y, 140 * S, h);
    if (type === "ring") {
      n = 70;
      for (i = 0; i < n; i++) {
        a = (i / n) * Math.PI * 2;
        P(x, y, Math.cos(a) * 4.2 * S, Math.sin(a) * 4.2 * S, h, { f: 0.975, d: 0.013, g: 0.05 });
      }
    } else if (type === "heart") {
      n = 80;
      for (i = 0; i < n; i++) {
        var t = (i / n) * Math.PI * 2;
        var hx = 16 * Math.pow(Math.sin(t), 3);
        var hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        P(x, y, hx * 0.26 * S, hy * 0.26 * S, 345, { f: 0.972, d: 0.012, g: 0.04, l: 62 });
      }
    } else if (type === "willow") {
      n = 80;
      for (i = 0; i < n; i++) {
        a = rnd(0, Math.PI * 2); v = Math.sqrt(Math.random()) * 4 * S;
        P(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(38, 50), { f: 0.965, d: 0.0065, g: 0.035, l: 65, s: 1.8 });
      }
    } else if (type === "crackle") {
      n = 70;
      for (i = 0; i < n; i++) {
        a = rnd(0, Math.PI * 2); v = Math.sqrt(Math.random()) * 5.5 * S;
        P(x, y, Math.cos(a) * v, Math.sin(a) * v, h, { d: 0.02, tw: true });
      }
      for (i = 0; i < 6; i++) {
        (function () {
          var ox = x + rnd(-90, 90) * S, oy = y + rnd(-60, 70) * S;
          events.push({ t: performance.now() + rnd(350, 900), fn: function () {
            flash(ox, oy, 50 * S, 55);
            for (var k = 0; k < 14; k++) {
              var aa = rnd(0, 6.28), vv = rnd(1, 3) * S;
              P(ox, oy, Math.cos(aa) * vv, Math.sin(aa) * vv, 55, { l: 90, d: 0.05, tw: true, s: 1.6 });
            }
          }});
        })();
      }
    } else { // peony
      n = 100;
      for (i = 0; i < n; i++) {
        a = rnd(0, Math.PI * 2); v = Math.sqrt(Math.random()) * 6 * S;
        P(x, y, Math.cos(a) * v, Math.sin(a) * v, h + rnd(-12, 12), { d: rnd(0.011, 0.018) });
      }
    }
  }

  /* ----- rockets ----- */
  var types = ["peony", "ring", "heart", "willow", "crackle", "peony"];
  function launch() {
    var x = rnd(W * 0.12, W * 0.88);
    rockets.push({ x: x, y: H + 10, vx: rnd(-0.6, 0.6) * S, vy: -rnd(H / 75, H / 58),
      ty: rnd(H * 0.14, H * 0.45), h: rnd(0, 360), type: types[(Math.random() * types.length) | 0] });
  }

  /* ----- ground crackers (sutli bombs) ----- */
  function cracker() {
    var x = rnd(W * 0.05, W * 0.95), y = H - rnd(6, 40);
    flash(x, y, 60 * S, 50);
    for (var i = 0; i < 18; i++) {
      var a = rnd(Math.PI, Math.PI * 2), v = rnd(1.5, 5) * S;
      P(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(30, 55), { l: 80, d: 0.05, g: 0.12, s: 1.7 });
    }
  }

  /* ----- ground fountains (anar) ----- */
  var anars = [{ x: 0.16 }, { x: 0.84 }, { x: 0.5 }];
  function anarEmit(k) {
    for (var i = 0; i < 4; i++) {
      P(W * anars[k].x + rnd(-6, 6), H - 4, rnd(-1.6, 1.6) * S, -rnd(5, 10) * S,
        rnd(25, 55), { g: 0.14, f: 0.985, d: 0.028, l: 70, s: 1.8, tw: true });
    }
  }

  /* ----- main loop ----- */
  var start = performance.now(), last = start, nextRocket = start + 250, nextCracker = start + 600, ending = false;

  function frame(now) {
    var dt = Math.min((now - last) / 16.67, 3); last = now;
    var elapsed = now - start, i;

    if (elapsed < DURATION) {
      if (now > nextRocket) { launch(); if (Math.random() < 0.4) launch(); nextRocket = now + rnd(380, 800); }
      if (now > nextCracker) { cracker(); nextCracker = now + rnd(150, 420); }
      if (elapsed < DURATION - 2000) anars.forEach(function (_, k) { anarEmit(k); });
    }

    for (i = events.length - 1; i >= 0; i--) if (now >= events[i].t) { events[i].fn(); events.splice(i, 1); }

    // fade previous frame (keeps canvas transparent, leaves light trails)
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // rockets
    for (i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i];
      r.x += r.vx * dt; r.y += r.vy * dt;
      P(r.x, r.y, rnd(-0.3, 0.3), rnd(0.8, 2), 35, { g: 0.02, d: 0.07, s: 1.6, l: 70 });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.vx * 2, r.y - r.vy * 2); ctx.stroke();
      ctx.strokeStyle = "hsl(30,100%,60%)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(r.x - r.vx * 2, r.y - r.vy * 2); ctx.lineTo(r.x - r.vx * 5, r.y - r.vy * 5); ctx.stroke();
      if (r.y <= r.ty) { burst(r.x, r.y, r.type, r.h); rockets.splice(i, 1); }
    }

    // flashes
    for (i = flashes.length - 1; i >= 0; i--) {
      var f = flashes[i];
      var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, "hsla(" + f.h + ",100%,85%," + f.a * 0.55 + ")");
      g.addColorStop(1, "hsla(" + f.h + ",100%,60%,0)");
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      f.a -= 0.09 * dt;
      if (f.a <= 0) flashes.splice(i, 1);
    }

    // particles
    for (i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.px = p.x; p.py = p.y;
      var fr = Math.pow(p.f, dt);
      p.vx *= fr; p.vy *= fr; p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.a -= p.d * dt;
      if (p.a <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = p.tw ? p.a * (0.35 + Math.random() * 0.65) : p.a;
      ctx.strokeStyle = "hsl(" + p.h + ",100%," + p.l + "%)";
      ctx.lineWidth = p.s; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    var finished = elapsed >= DURATION && !rockets.length && !events.length && parts.length < 5;
    if (finished && !ending) {
      ending = true;
      c.style.opacity = "0";
      setTimeout(function () {
        window.removeEventListener("resize", resize);
        c.remove();
      }, 1300);
    }
    if (!ending || parts.length) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
/* ---------- Hanging diyas ---------- */
(function () {
  var css = `
    #diyas{position:fixed;left:0;right:0;top:0;height:0;z-index:100000;pointer-events:none}
    #diyas .diya{position:absolute;top:0;display:flex;flex-direction:column;align-items:center;
      transform-origin:50% 0;animation:diyaSwing 4.2s ease-in-out infinite}
    #diyas .diya.L{left:8px;--len:78px}
    #diyas .diya.R{right:8px;--len:50px;animation-delay:-1.7s}
    #diyas .str{width:2px;height:var(--len);background:linear-gradient(#f6d77a,#b8860b);border-radius:2px}
    #diyas svg{width:56px;height:auto;display:block;margin-top:-1px;overflow:visible}
    @keyframes diyaSwing{0%,100%{transform:rotate(3deg)}50%{transform:rotate(-3deg)}}
    #diyas .flame{transform-origin:30px 14px;animation:diyaFlicker 1.3s ease-in-out infinite}
    #diyas .flame2{animation-delay:-.5s}
    @keyframes diyaFlicker{0%,100%{transform:scale(1,1) skewX(0)}25%{transform:scale(.92,1.08) skewX(3deg)}
      50%{transform:scale(1.06,.94) skewX(-3deg)}75%{transform:scale(.95,1.05) skewX(2deg)}}
    #diyas .glow{animation:diyaGlow 1.6s ease-in-out infinite}
    @keyframes diyaGlow{0%,100%{opacity:.55}50%{opacity:.95}}
    @media(max-width:700px){
      #diyas .diya.L{left:4px;--len:58px} #diyas .diya.R{right:4px;--len:36px}
      #diyas svg{width:40px}
    }
    @media(prefers-reduced-motion:reduce){#diyas,#diyas *{animation:none!important}}
  `;

  var svg = `
    <svg viewBox="0 -40 60 86" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="dg" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#ffd36b" stop-opacity=".9"/>
          <stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="dc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c8501e"/><stop offset="1" stop-color="#7a2a0c"/>
        </linearGradient>
      </defs>
      <path d="M30 -40 L5 16 M30 -40 L55 16" stroke="#e0b94a" stroke-width="1.3" stroke-linecap="round"/>
      <circle class="glow" cx="30" cy="2" r="22" fill="url(#dg)"/>
      <path d="M3 17 C6 36 20 43 30 43 C40 43 54 36 57 17 Z" fill="url(#dc)" stroke="#4a1a06" stroke-width="1.2" stroke-linejoin="round"/>
      <ellipse cx="30" cy="17" rx="27" ry="5.5" fill="#4a1a06"/>
      <ellipse cx="30" cy="16.6" rx="22" ry="3.4" fill="#e7a93a" opacity=".85"/>
      <path d="M11 27c5 4 12 6 19 6s14-2 19-6" stroke="#f3d27a" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="1 4.2"/>
      <path d="M30 17v-4" stroke="#3a1a0a" stroke-width="2" stroke-linecap="round"/>
      <path class="flame" d="M30 14C21 8 26 1 30 -9 34 1 39 8 30 14Z" fill="#ff8a1e"/>
      <path class="flame flame2" d="M30 13C25 9.500 28 4 30 -2 32 4 35 9.500 30 13Z" fill="#ffe27a"/>
    </svg>`;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var d = document.createElement("div");
  d.id = "diyas";
  d.innerHTML =
    '<div class="diya L"><div class="str"></div>' + svg + '</div>' +
    '<div class="diya R"><div class="str"></div>' + svg.replace(/id="dg"/, 'id="dg2"').replace(/id="dc"/, 'id="dc2"')
      .replace(/url\(#dg\)/, "url(#dg2)").replace(/url\(#dc\)/, "url(#dc2)") + '</div>';
  document.body.appendChild(d);

  function place() {
    var bar = document.getElementById("promo-bar");
    d.style.top = (bar ? bar.offsetHeight : 0) + "px";
  }
  place();
  window.addEventListener("load", place);
  window.addEventListener("resize", place);
  setTimeout(place, 400);
  setTimeout(place, 1500);
})();
