(function () {
  "use strict";

  var canvas = document.getElementById("particles");
  var stage = document.getElementById("graph-stage");
  var mode = document.getElementById("graph-mode");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DEFAULT_MODE = "MOVE TO DISTURB · HOLD CENTER TO REORDER";
  var W = 0, H = 0, DPR = 1, raf = null, lastFrame = 0;
  var pointer = { x: 0, y: 0, active: false, down: false };
  var CHARGE_DURATION = 1650;
  var interaction = {
    charge: 0,
    locked: false,
    burstStarted: -Infinity
  };

  var definitions = [
    { label: "DATA", x: .24, y: .32, cluster: 0, core: true },
    { label: "ETL", x: .09, y: .16, cluster: 0 },
    { label: "POSTGRES", x: .10, y: .43, cluster: 0 },
    { label: "500K+", x: .33, y: .13, cluster: 0 },
    { label: "MIGRATION", x: .39, y: .39, cluster: 0 },
    { label: "AI", x: .72, y: .25, cluster: 1, core: true },
    { label: "MCP", x: .58, y: .09, cluster: 1 },
    { label: "CLAUDE", x: .86, y: .10, cluster: 1 },
    { label: "GEMINI", x: .89, y: .34, cluster: 1 },
    { label: "AUTOMATION", x: .57, y: .37, cluster: 1 },
    { label: "SYSTEMS", x: .28, y: .72, cluster: 2, core: true },
    { label: "LARAVEL", x: .09, y: .61, cluster: 2 },
    { label: "APIs", x: .13, y: .84, cluster: 2 },
    { label: "PIX", x: .40, y: .87, cluster: 2 },
    { label: "13+", x: .46, y: .65, cluster: 2 },
    { label: "PRODUCT", x: .73, y: .70, cluster: 3, core: true },
    { label: "REACT", x: .59, y: .57, cluster: 3 },
    { label: "SUPABASE", x: .88, y: .56, cluster: 3 },
    { label: "FINTECH", x: .89, y: .83, cluster: 3 },
    { label: "MOBILE", x: .61, y: .87, cluster: 3 }
  ];

  var clusterOrigins = definitions
    .filter(function (definition) { return definition.core; })
    .sort(function (a, b) { return a.cluster - b.cluster; })
    .map(function (definition) { return { x: definition.x, y: definition.y }; });
  var slotByCluster = [0, 1, 2, 3];

  var nodes = definitions.map(function (definition, index) {
    var origin = clusterOrigins[definition.cluster];
    return {
      label: definition.label,
      cluster: definition.cluster,
      core: !!definition.core,
      nx: definition.x,
      ny: definition.y,
      offsetX: definition.x - origin.x,
      offsetY: definition.y - origin.y,
      x: 0,
      y: 0,
      hx: 0,
      hy: 0,
      vx: 0,
      vy: 0,
      phase: index * 1.73
    };
  });

  var links = [];
  definitions.forEach(function (node, index) {
    if (node.core) return;
    var coreIndex = definitions.findIndex(function (candidate) {
      return candidate.cluster === node.cluster && candidate.core;
    });
    links.push([coreIndex, index]);
  });
  links.push([0, 5], [0, 10], [5, 15], [10, 15], [0, 15], [5, 10]);

  function updateHomePositions() {
    nodes.forEach(function (node) {
      var slot = clusterOrigins[slotByCluster[node.cluster]];
      node.nx = Math.max(.07, Math.min(.93, slot.x + node.offsetX));
      node.ny = Math.max(.07, Math.min(.93, slot.y + node.offsetY));
      node.hx = node.nx * W;
      node.hy = node.ny * H;
    });
  }

  function shuffledSlots() {
    var next;
    do {
      next = slotByCluster.slice();
      for (var i = next.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var value = next[i];
        next[i] = next[j];
        next[j] = value;
      }
    } while (next.some(function (slot, cluster) { return slot === slotByCluster[cluster]; }));
    return next;
  }

  function reorderSystem(time) {
    slotByCluster = shuffledSlots();
    updateHomePositions();
    interaction.burstStarted = time;
    interaction.locked = true;
    interaction.charge = 0;

    var centerX = W / 2;
    var centerY = H / 2;
    nodes.forEach(function (node) {
      var dx = node.x - centerX;
      var dy = node.y - centerY;
      var distance = Math.sqrt(dx * dx + dy * dy) || 1;
      var impulse = 2.2 + Math.random() * 1.1;
      node.vx += dx / distance * impulse;
      node.vy += dy / distance * impulse;
    });

    if (mode) mode.textContent = "SYSTEM REORDERED / RELEASE TO RESET";
  }

  function resize() {
    var rect = stage.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    updateHomePositions();
    nodes.forEach(function (node) {
      if (!node.x && !node.y) {
        node.x = node.hx;
        node.y = node.hy;
      }
    });
    draw(performance.now(), false);
  }

  function drawLink(a, b, time, index) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var pointerDistance = Math.hypot((a.x + b.x) / 2 - pointer.x, (a.y + b.y) / 2 - pointer.y);
    var engaged = pointer.active && pointerDistance < 130;

    ctx.strokeStyle = engaged ? "rgba(200,255,98,.52)" : "rgba(240,244,237,.13)";
    ctx.lineWidth = engaged ? 1.1 : .65;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    var progress = ((time * .00008 * (index % 3 + 1)) + index * .17) % 1;
    ctx.fillStyle = engaged ? "#c8ff62" : "rgba(157,255,220,.65)";
    ctx.beginPath();
    ctx.arc(a.x + dx * progress, a.y + dy * progress, engaged ? 2.1 : 1.25, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNode(node, time, nearest) {
    var energy = .5 + Math.sin(time * .0012 + node.phase) * .12;
    var highlighted = node === nearest;
    var radius = node.core ? 6 : highlighted ? 4.2 : 2.6;

    if (node.core || highlighted) {
      ctx.strokeStyle = highlighted ? "rgba(200,255,98,.72)" : "rgba(200,255,98,.25)";
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (node.core ? 7 : 5) + energy * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = node.core || highlighted ? "#c8ff62" : "rgba(240,244,237," + energy + ")";
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (node.core || highlighted) {
      ctx.font = (node.core ? "600 10px" : "500 9px") + " 'JetBrains Mono', monospace";
      ctx.fillStyle = node.core ? "rgba(240,244,237,.9)" : "rgba(200,255,98,.92)";
      ctx.textAlign = "left";
      ctx.fillText(node.label, node.x + radius + 10, node.y + 3);
    }
  }

  function isCenterHotspot() {
    var radius = Math.max(48, Math.min(W, H) * .105);
    return Math.hypot(pointer.x - W / 2, pointer.y - H / 2) <= radius;
  }

  function updateCharge(time, delta) {
    if (reduceMotion || interaction.locked) return;

    if (pointer.down && isCenterHotspot()) {
      interaction.charge = Math.min(1, interaction.charge + delta / CHARGE_DURATION);
      if (mode) mode.textContent = "CHARGING FIELD / " + Math.round(interaction.charge * 100) + "%";
      if (interaction.charge >= 1) reorderSystem(time);
      return;
    }

    if (interaction.charge > 0) {
      interaction.charge = Math.max(0, interaction.charge - delta / 520);
      if (pointer.down && mode) {
        mode.textContent = interaction.charge > 0
          ? "RETURN TO CENTER / " + Math.round(interaction.charge * 100) + "%"
          : "GRAVITY FIELD / ATTRACT";
      }
    }
  }

  function drawCenterTrigger(time) {
    var centerX = W / 2;
    var centerY = H / 2;
    var hot = pointer.active && isCenterHotspot();

    ctx.strokeStyle = hot || interaction.charge > 0
      ? "rgba(200,255,98,.55)"
      : "rgba(240,244,237,.16)";
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, hot ? 15 : 11, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = hot ? "#c8ff62" : "rgba(240,244,237,.45)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, hot ? 3.2 : 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (interaction.charge > 0) {
      ctx.strokeStyle = "#c8ff62";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        21,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * interaction.charge
      );
      ctx.stroke();
    }

    if (hot && !interaction.locked) {
      ctx.font = "500 8px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(200,255,98,.86)";
      ctx.textAlign = "center";
      ctx.fillText(pointer.down ? "KEEP HOLDING" : "HOLD TO REORDER", centerX, centerY + 37);
    }

    var burstProgress = (time - interaction.burstStarted) / 780;
    if (burstProgress >= 0 && burstProgress < 1) {
      var eased = 1 - Math.pow(1 - burstProgress, 3);
      ctx.strokeStyle = "rgba(200,255,98," + ((1 - burstProgress) * .62) + ")";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18 + eased * Math.min(W, H) * .24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function draw(time, scheduleNext) {
    var delta = lastFrame ? Math.min(48, Math.max(0, time - lastFrame)) : 16;
    lastFrame = time;
    updateCharge(time, delta);
    ctx.clearRect(0, 0, W, H);
    var nearest = null;
    var nearestDistance = 86;

    nodes.forEach(function (node) {
      if (reduceMotion) {
        node.x = node.hx;
        node.y = node.hy;
        return;
      }

      var driftX = Math.cos(time * .00025 + node.phase) * (node.core ? 2 : 5);
      var driftY = Math.sin(time * .00031 + node.phase) * (node.core ? 2 : 5);
      node.vx += (node.hx + driftX - node.x) * .012;
      node.vy += (node.hy + driftY - node.y) * .012;

      if (pointer.active) {
        var dx = node.x - pointer.x;
        var dy = node.y - pointer.y;
        var distance = Math.sqrt(dx * dx + dy * dy) || 1;
        var radius = pointer.down ? 210 : 135;
        if (distance < radius) {
          var falloff = Math.pow(1 - distance / radius, 2);
          var force = (pointer.down ? -1.1 : .72) * falloff;
          node.vx += dx / distance * force;
          node.vy += dy / distance * force;
        }
      }

      node.vx *= .9;
      node.vy *= .9;
      node.x += node.vx;
      node.y += node.vy;

      var distanceToPointer = Math.hypot(node.x - pointer.x, node.y - pointer.y);
      if (pointer.active && distanceToPointer < nearestDistance) {
        nearest = node;
        nearestDistance = distanceToPointer;
      }
    });

    links.forEach(function (link, index) {
      drawLink(nodes[link[0]], nodes[link[1]], time, index);
    });
    drawCenterTrigger(time);
    nodes.forEach(function (node) { drawNode(node, time, nearest); });

    if (pointer.active) {
      ctx.strokeStyle = pointer.down ? "rgba(200,255,98,.75)" : "rgba(240,244,237,.28)";
      ctx.lineWidth = .75;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, pointer.down ? 30 : 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (!reduceMotion && scheduleNext !== false) raf = requestAnimationFrame(draw);
  }

  function positionPointer(event) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    stage.style.setProperty("--pointer-x", (pointer.x / W * 100) + "%");
    stage.style.setProperty("--pointer-y", (pointer.y / H * 100) + "%");
    if (!pointer.down && mode) {
      mode.textContent = isCenterHotspot() ? "CENTER READY / HOLD TO REORDER" : DEFAULT_MODE;
    }
  }

  canvas.addEventListener("pointermove", positionPointer, { passive: true });
  canvas.addEventListener("pointerenter", positionPointer, { passive: true });
  canvas.addEventListener("pointerleave", function () {
    pointer.active = false;
    pointer.down = false;
    interaction.charge = 0;
    interaction.locked = false;
    if (mode) mode.textContent = DEFAULT_MODE;
  });
  canvas.addEventListener("pointerdown", function (event) {
    positionPointer(event);
    pointer.down = true;
    canvas.setPointerCapture(event.pointerId);
    if (mode) mode.textContent = isCenterHotspot() ? "CHARGING FIELD / 0%" : "GRAVITY FIELD / ATTRACT";
  });
  canvas.addEventListener("pointerup", function () {
    pointer.down = false;
    interaction.charge = 0;
    interaction.locked = false;
    if (mode) mode.textContent = isCenterHotspot() ? "CENTER READY / HOLD TO REORDER" : DEFAULT_MODE;
  });
  canvas.addEventListener("pointercancel", function () {
    pointer.down = false;
    interaction.charge = 0;
    interaction.locked = false;
    if (mode) mode.textContent = DEFAULT_MODE;
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(stage);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!document.hidden && !reduceMotion && !raf) {
      raf = requestAnimationFrame(draw);
    }
  });

  resize();
  if (!reduceMotion) raf = requestAnimationFrame(draw);
})();
