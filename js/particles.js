(function () {
  "use strict";

  var canvas = document.getElementById("particles");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1;
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var scrollProgress = 0;
  var docHeight = 1;
  var running = true;
  var rafId = null;

  var COLORS = ["#ffc266", "#6fa8ff"];

  function particleCount() {
    var base = W < 640 ? 70 : W < 1100 ? 120 : 170;
    return base;
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
  }

  // Three formation sets: hero (dispersed orbit), pipeline (directional flow), grid (ordered)
  var formations = { orbit: [], flow: [], grid: [] };

  function buildFormations() {
    var n = particleCount();
    formations.orbit = [];
    formations.flow = [];
    formations.grid = [];

    var cx = W / 2, cy = H / 2;
    var maxR = Math.min(W, H) * 0.42;

    for (var i = 0; i < n; i++) {
      // orbit: rings of particles around center
      var angle = (i / n) * Math.PI * 2 * 3.1;
      var r = maxR * (0.15 + 0.85 * ((i * 2654435761) % 1000) / 1000);
      formations.orbit.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r
      });

      // flow: horizontal bands drifting like a pipeline
      var lane = i % 8;
      formations.flow.push({
        x: (i / n) * W * 1.4 - W * 0.2,
        y: (H / 9) * (lane + 1) + (Math.sin(i) * 18)
      });

      // grid: ordered rows/cols
      var cols = Math.ceil(Math.sqrt(n * (W / H)));
      var rows = Math.ceil(n / cols);
      var col = i % cols;
      var row = Math.floor(i / cols);
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
        r: 1.2 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        idx: i
      });
    }
  }

  function seedStatic() {
    // reduced-motion: draw one calm static frame, no loop
    buildFormations();
    rebuildParticles();
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.6;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function targetFor(p) {
    // scrollProgress 0..1 blends orbit -> flow -> grid
    var t = scrollProgress;
    var a, b, mix;
    if (t < 0.5) {
      a = formations.orbit[p.idx];
      b = formations.flow[p.idx];
      mix = t / 0.5;
    } else {
      a = formations.flow[p.idx];
      b = formations.grid[p.idx];
      mix = (t - 0.5) / 0.5;
    }
    if (!a || !b) return { x: p.x, y: p.y };
    return {
      x: a.x + (b.x - a.x) * mix,
      y: a.y + (b.y - a.y) * mix
    };
  }

  function tick() {
    if (!running) return;
    scrollProgress = Math.min(window.scrollY / docHeight, 1);

    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var target = targetFor(p);

      var dx = target.x - p.x;
      var dy = target.y - p.y;
      p.vx += dx * 0.02;
      p.vy += dy * 0.02;

      if (mouse.active) {
        var mdx = p.x - mouse.x;
        var mdy = p.y - mouse.y;
        var distSq = mdx * mdx + mdy * mdy;
        var radius = 130;
        if (distSq < radius * radius) {
          var dist = Math.sqrt(distSq) || 1;
          var force = (1 - dist / radius) * 3.2;
          p.vx += (mdx / dist) * force;
          p.vy += (mdy / dist) * force;
        }
      }

      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.7;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(tick);
  }

  function onPointerMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }

  function onPointerLeave() {
    mouse.active = false;
  }

  function start() {
    if (rafId === null) {
      rafId = requestAnimationFrame(tick);
    }
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
