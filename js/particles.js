(function () {
  "use strict";

  var canvas = document.getElementById("particles");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1;
  var particles = [];
  // O mouse é suavizado (smx/smy perseguem x/y) para que a influência
  // nas partículas nunca dê saltos bruscos
  var mouse = { x: -9999, y: -9999, smx: -9999, smy: -9999, active: false, strength: 0 };
  var scrollProgress = 0;
  var smoothScroll = 0;
  var docHeight = 1;
  var running = true;
  var rafId = null;
  var time = 0;

  var COLORS = ["#c0a5f3", "#f2a2b5", "#8f89c9"];
  var LINK_DIST = 110;

  function particleCount() {
    return W < 640 ? 45 : W < 1100 ? 75 : 110;
  }

  // Três formações: hero (órbita dispersa), pipeline (fluxo em faixas), grade
  var formations = { orbit: [], flow: [], grid: [] };

  function buildFormations() {
    var n = particleCount();
    formations.orbit = [];
    formations.flow = [];
    formations.grid = [];

    var cx = W / 2, cy = H / 2;
    var maxR = Math.min(W, H) * 0.42;

    for (var i = 0; i < n; i++) {
      var angle = (i / n) * Math.PI * 2 * 3.1;
      var r = maxR * (0.15 + 0.85 * ((i * 2654435761) % 1000) / 1000);
      formations.orbit.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      });

      var lane = i % 8;
      formations.flow.push({
        x: (i / n) * W * 1.4 - W * 0.2,
        y: (H / 9) * (lane + 1) + (Math.sin(i) * 18)
      });

      var cols = Math.ceil(Math.sqrt(n * (W / H)));
      var col = i % cols;
      var row = Math.floor(i / cols);
      var rows = Math.ceil(n / cols);
      var gapX = W / (cols + 1);
      var gapY = H / (rows + 1);
      formations.grid.push({
        x: gapX * (col + 1),
        y: gapY * (row + 1)
      });
    }
  }

  function rebuildParticles() {
    var n = particleCount();
    particles = [];
    for (var i = 0; i < n; i++) {
      particles.push({
        x: formations.orbit[i] ? formations.orbit[i].x : Math.random() * W,
        y: formations.orbit[i] ? formations.orbit[i].y : Math.random() * H,
        vx: 0,
        vy: 0,
        r: 1 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        phase: Math.random() * Math.PI * 2,
        // amplitude e frequência próprias do drift orgânico em volta do "lar"
        driftA: 8 + Math.random() * 14,
        driftF: 0.00035 + Math.random() * 0.00045,
        idx: i
      });
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    docHeight = Math.max(document.body.scrollHeight - H, 1);
    buildFormations();
    rebuildParticles();
    if (reduceMotion) seedStatic();
  }

  function seedStatic() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.5;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // "Lar" da partícula: mistura das formações conforme o scroll,
  // mais um drift senoidal individual para o repouso nunca ficar estático
  function homeFor(p, t) {
    var s = smoothScroll;
    var a, b, mix;
    if (s < 0.5) {
      a = formations.orbit[p.idx];
      b = formations.flow[p.idx];
      mix = s / 0.5;
    } else {
      a = formations.flow[p.idx];
      b = formations.grid[p.idx];
      mix = (s - 0.5) / 0.5;
    }
    if (!a || !b) return { x: p.x, y: p.y };
    // easing na mistura para a transição entre formações ser mais orgânica
    mix = mix * mix * (3 - 2 * mix);
    return {
      x: a.x + (b.x - a.x) * mix + Math.cos(t * p.driftF + p.phase) * p.driftA,
      y: a.y + (b.y - a.y) * mix + Math.sin(t * p.driftF * 1.3 + p.phase) * p.driftA
    };
  }

  function drawLinks() {
    ctx.lineWidth = 0.5;
    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      for (var j = i + 1; j < particles.length; j++) {
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          ctx.globalAlpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.12;
          ctx.strokeStyle = "#c0a5f3";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    if (!running) return;
    time = now || 0;

    scrollProgress = Math.min(window.scrollY / docHeight, 1);
    // o scroll "sentido" persegue o real: a formação muda sem trancos
    smoothScroll += (scrollProgress - smoothScroll) * 0.04;

    mouse.smx += (mouse.x - mouse.smx) * 0.08;
    mouse.smy += (mouse.y - mouse.smy) * 0.08;
    mouse.strength += ((mouse.active ? 1 : 0) - mouse.strength) * 0.05;

    ctx.clearRect(0, 0, W, H);
    drawLinks();

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var home = homeFor(p, time);

      // mola fraca de retorno ao lar: as partículas voltam devagar,
      // sem o efeito de "ímã" da versão anterior
      p.vx += (home.x - p.x) * 0.0035;
      p.vy += (home.y - p.y) * 0.0035;

      if (mouse.strength > 0.01) {
        var mdx = p.x - mouse.smx;
        var mdy = p.y - mouse.smy;
        var distSq = mdx * mdx + mdy * mdy;
        var radius = 160;
        if (distSq < radius * radius && distSq > 0.01) {
          var dist = Math.sqrt(distSq);
          // queda quadrática suave em vez de linear: sem "parede" dura
          var falloff = 1 - dist / radius;
          var force = falloff * falloff * 0.5 * mouse.strength;
          p.vx += (mdx / dist) * force;
          p.vy += (mdy / dist) * force;
        }
      }

      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx;
      p.y += p.vy;

      var twinkle = 0.45 + 0.25 * Math.sin(time * 0.0012 + p.phase);
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = twinkle;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(tick);
  }

  function onPointerMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!mouse.active) {
      mouse.smx = mouse.x;
      mouse.smy = mouse.y;
    }
    mouse.active = true;
  }

  function onPointerLeave() {
    mouse.active = false;
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
      stop();
    } else if (!reduceMotion) {
      running = true;
      start();
    }
  });

  if (!reduceMotion) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  resize();

  if (reduceMotion) {
    seedStatic();
  } else {
    start();
  }
})();
