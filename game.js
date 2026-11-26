/*
 * Seelig's Scrap Run
 * A small repair-shop game for the Gemini Sector Hub.
 *
 * Grab all three ship parts, then bring them to the repair bay.
 * The faster the turnaround, the more points Seelig pays out.
 */
(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  // ---------------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------------
  const scoreEl = document.getElementById('scoreValue');
  const timeEl = document.getElementById('timeValue');
  const streakEl = document.getElementById('streakValue');
  const bestEl = document.getElementById('bestValue');
  const statusEl = document.getElementById('gameStatus');
  const calloutEl = document.getElementById('gameCallout');
  const touchActionEl = document.getElementById('touchAction');

  const partChips = new Map();
  document.querySelectorAll('.part-chip').forEach((chip) => {
    partChips.set(chip.dataset.part, chip);
  });

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  const STORAGE_KEY = 'gemini-sector:seelig-best';
  const PLAY_BOUNDS = { minX: 34, maxX: W - 34, minY: 262, maxY: H - 28 };
  const START = { x: 152, y: 452 };
  const BAY = { x: 406, y: 452, r: 46 };
  const PICKUP_RADIUS = 34;
  const REPAIR_BASE = 50;
  const FAST_REPAIR_SECONDS = 22;
  const ROUND_BREAK_MS = 3200;
  const MULTIPLIER_STEP = 0.25;
  const MULTIPLIER_CAP = 4;
  const PICKUP_POINTS = 10;

  const PART_DEFS = [
    { id: 'scrap', name: 'Scrap Metal', short: 'Scrap', color: '#ffb14e' },
    { id: 'circuit', name: 'Circuit Board', short: 'Circuit', color: '#57e6ff' },
    { id: 'cell', name: 'Power Cell', short: 'Cell', color: '#b8ff5e' }
  ];

  const PICKUP_LINES = ['FAQ Yeah!', 'Skookum.', "That'll do nicely.", 'Right on.'];
  const REPAIR_LINES = ['Key on tact! Good as new.', "That'll fly.", "There's the cockford ollie."];
  const NEXT_LINES = ['No hair off my lower back.', "I'll keep making the dog pee to feed the cat.", "Looks like the next job will be 3 beers long."];
  const START_LINES = ['Three parts and she flies.', 'Find the parts, then the bay.'];

  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // Sprites
  // ---------------------------------------------------------------------------
  const sprites = {
    front: new Image(),
    side: new Image(),
    back: new Image(),
    scrap: new Image(),
    background: new Image()
  };

  const spriteSources = {
    front: 'images/seelig-1.png',
    side: 'images/seelig-3.png',
    back: 'images/seelig-4.png',
    scrap: 'images/item-scrap.png',
    background: 'images/background.png'
  };

  let loadedImages = 0;
  const totalImages = Object.keys(spriteSources).length;
  let started = false;

  Object.entries(spriteSources).forEach(([key, src]) => {
    const image = sprites[key];
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      loadedImages += 1;
      if (loadedImages === totalImages && !started) {
        started = true;
        init();
      }
    };
    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
    image.src = src;
  });

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const player = {
    x: START.x,
    y: START.y,
    dir: 'front',
    facing: 'right',
    speed: 200,
    height: 80,
    radius: 18,
    inventory: [],
    renderHeight: 80,
    bob: 0,
    moving: false,
    dialogue: { text: '', expires: 0 }
  };

  const game = {
    score: 0,
    best: loadBest(),
    streak: 0,
    round: 0,
    state: 'collect', // collect | repair | complete
    items: [],
    collected: new Set(),
    timerRunning: false,
    elapsed: 0,
    completeUntil: 0,
    actionQueued: false,
    keys: { up: false, down: false, left: false, right: false },
    particles: [],
    floaters: [],
    calloutTimer: 0,
    lastFrame: 0,
    lastHudUpdate: 0,
    statusText: ''
  };

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  function loadBest() {
    try {
      return Number(localStorage.getItem(STORAGE_KEY)) || 0;
    } catch (err) {
      return 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(STORAGE_KEY, String(game.best));
    } catch (err) {
      // Storage can be unavailable (private mode, file://). The game still works.
    }
  }

  function hexToRgba(hex, alpha) {
    const value = parseInt(hex.slice(1), 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function roundRectPath(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function formatScore(value) {
    return value.toLocaleString('en-US');
  }

  function multiplier() {
    return 1 + Math.min(game.streak, MULTIPLIER_CAP) * MULTIPLIER_STEP;
  }

  function formatMultiplier(value) {
    return Number.isInteger(value) ? `x${value}` : `x${value.toFixed(2)}`;
  }

  // Seelig shrinks toward the back of the shop and grows as he walks toward
  // the camera. The range is deliberately wider than a subtle scale tick so
  // the depth change reads clearly against the busy floor.
  function perspectiveScale(y) {
    const depth = clamp((y - PLAY_BOUNDS.minY) / (PLAY_BOUNDS.maxY - PLAY_BOUNDS.minY), 0, 1);
    return 0.8 + depth * 1.28;
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------
  function setStatus(text, tone = '') {
    if (game.statusText === text && statusEl.dataset.tone === tone) return;
    game.statusText = text;
    statusEl.textContent = text;
    statusEl.dataset.tone = tone;
  }

  function updatePartsTracker() {
    partChips.forEach((chip, id) => {
      const found = game.collected.has(id);
      chip.classList.toggle('found', found);
      chip.setAttribute('aria-label', `${chip.textContent.trim()} ${found ? 'recovered' : 'missing'}`);
    });
  }

  function updateStreakHud() {
    if (streakEl) streakEl.textContent = formatMultiplier(multiplier());
  }

  function addPoints(points, bump = true) {
    if (!points) return;
    game.score += points;
    if (scoreEl) {
      scoreEl.textContent = formatScore(game.score);
      if (bump) {
        scoreEl.classList.remove('bump');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('bump');
      }
    }
    if (game.score > game.best) {
      game.best = game.score;
      if (bestEl) bestEl.textContent = formatScore(game.best);
    }
    saveBest();
  }

  function updateHud(now = performance.now()) {
    if (timeEl) {
      timeEl.textContent = game.elapsed > 0 ? `${game.elapsed.toFixed(1)}s` : '--.-';
    }
    if (now - game.lastHudUpdate > 250) {
      game.lastHudUpdate = now;
      if (bestEl) bestEl.textContent = formatScore(game.best);
      updateStreakHud();
    }
  }

  function showCallout(title, points, sub) {
    if (!calloutEl) return;
    clearTimeout(game.calloutTimer);
    calloutEl.innerHTML =
      `<strong>${title}</strong>` +
      (points ? `<span class="callout-points">${points}</span>` : '') +
      (sub ? `<span class="callout-sub">${sub}</span>` : '');
    calloutEl.classList.remove('show');
    void calloutEl.offsetWidth;
    calloutEl.classList.add('show');
    game.calloutTimer = window.setTimeout(() => {
      calloutEl.classList.remove('show');
    }, 2600);
  }

  function showDialogue(text, duration = 2000) {
    player.dialogue.text = text;
    player.dialogue.expires = performance.now() + duration;
  }

  function syncTouchAction() {
    if (!touchActionEl) return;
    touchActionEl.hidden = game.state !== 'repair';
  }

  // ---------------------------------------------------------------------------
  // Rounds and pickups
  // ---------------------------------------------------------------------------
  function spawnItems() {
    const positions = [];
    const minItemGap = 78;

    for (let attempt = 0; attempt < 240 && positions.length < PART_DEFS.length; attempt += 1) {
      const x = rand(PLAY_BOUNDS.minX + 28, PLAY_BOUNDS.maxX - 28);
      const y = rand(310, PLAY_BOUNDS.maxY - 8);
      if (dist(x, y, BAY.x, BAY.y) < 112) continue;
      if (dist(x, y, player.x, player.y) < 96) continue;
      if (positions.some((pos) => dist(x, y, pos.x, pos.y) < minItemGap)) continue;
      positions.push({ x, y });
    }

    const fallback = [
      { x: 112, y: 340 },
      { x: 286, y: 402 },
      { x: 196, y: 306 }
    ];
    while (positions.length < PART_DEFS.length) {
      positions.push(fallback[positions.length]);
    }

    game.items = PART_DEFS.map((def, index) => ({
      ...def,
      x: positions[index].x,
      y: positions[index].y,
      phase: rand(0, Math.PI * 2),
      collected: false
    }));
  }

  function startRound(initial = false) {
    game.round += 1;
    game.state = 'collect';
    game.collected.clear();
    game.items = [];
    game.timerRunning = false;
    game.elapsed = 0;
    game.completeUntil = 0;
    player.inventory.length = 0;
    player.dialogue.text = '';

    if (calloutEl) calloutEl.classList.remove('show');
    clearTimeout(game.calloutTimer);

    spawnItems();
    updatePartsTracker();
    updateStreakHud();
    updateHud();
    syncTouchAction();

    if (initial) {
      setStatus('Grab all three parts, then get to the repair bay.');
      showDialogue(pick(START_LINES), 2400);
    } else {
      setStatus(`Ship #${game.round}: find three parts for Seelig.`);
      showDialogue(pick(NEXT_LINES), 1900);
    }

    if (timeEl) timeEl.textContent = '--.-';
    if (scoreEl) scoreEl.textContent = formatScore(game.score);
    if (bestEl) bestEl.textContent = formatScore(game.best);
  }

  function collectItem(item) {
    if (item.collected) return;
    item.collected = true;
    game.collected.add(item.id);
    player.inventory.push(item.name);

    if (!game.timerRunning) {
      game.timerRunning = true;
      game.elapsed = 0;
    }

    addPoints(PICKUP_POINTS);
    updatePartsTracker();

    game.floaters.push({
      x: item.x,
      y: item.y - 40,
      text: `+${PICKUP_POINTS}`,
      color: item.color,
      life: 0.9,
      maxLife: 0.9
    });
    burst(item.x, item.y - 18, item.color, 10);

    if (game.collected.size >= PART_DEFS.length) {
      game.state = 'repair';
      setStatus('All parts! Head to the repair bay and press E.', 'ready');
      showDialogue('Gotta get my meat hooks to the bay!', 2600);
    } else {
      const remaining = PART_DEFS.length - game.collected.size;
      setStatus(`${game.collected.size} of ${PART_DEFS.length} parts recovered — ${remaining} to go.`);
      showDialogue(`${pick(PICKUP_LINES)} ${item.name}.`, 1700);
    }

    syncTouchAction();
    updateHud();
  }

  // ---------------------------------------------------------------------------
  // Repair
  // ---------------------------------------------------------------------------
  function completeRepair() {
    const elapsed = Math.max(0.1, game.elapsed);
    game.timerRunning = false;
    game.state = 'complete';
    game.completeUntil = performance.now() + ROUND_BREAK_MS;

    const base = REPAIR_BASE;
    const speedBonus = Math.max(0, Math.round(150 - elapsed * 5));
    const mult = multiplier();
    const gain = Math.round((base + speedBonus) * mult);
    const fast = elapsed <= FAST_REPAIR_SECONDS;
    const previousBest = game.best;

    let grade = 'D';
    if (elapsed <= 10) grade = 'S';
    else if (elapsed <= 15) grade = 'A';
    else if (elapsed <= 20) grade = 'B';
    else if (elapsed <= 28) grade = 'C';

    game.streak = fast ? game.streak + 1 : 0;
    addPoints(gain, true);
    updateStreakHud();

    const subParts = [`Grade ${grade}`, `${elapsed.toFixed(1)}s`];
    if (mult > 1) subParts.push(formatMultiplier(mult));
    if (game.score > previousBest) subParts.push('New best!');

    showCallout('REPAIR COMPLETE', `+${formatScore(gain)}`, subParts.join(' · '));
    setStatus(`Ship #${game.round} fixed in ${elapsed.toFixed(1)}s for ${formatScore(gain)} points — next one rolling in…`);
    showDialogue(pick(REPAIR_LINES), 3000);

    burst(BAY.x, BAY.y - 20, '#8dffb0', 34);
    burst(BAY.x, BAY.y - 20, '#ffd86b', 18);
    syncTouchAction();
    updateHud();
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  const directionFor = {
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right'
  };

  const arrowFor = {
    arrowup: 'up',
    arrowleft: 'left',
    arrowdown: 'down',
    arrowright: 'right'
  };

  function setKey(direction, pressed) {
    if (direction) game.keys[direction] = pressed;
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const canvasFocused = document.activeElement === canvas;

    if (directionFor[key]) setKey(directionFor[key], true);

    if (arrowFor[key]) {
      if (canvasFocused) {
        event.preventDefault();
        setKey(arrowFor[key], true);
      }
      return;
    }

    if (key === 'e' || key === ' ') {
      if (key === ' ' && canvasFocused) event.preventDefault();
      if (!event.repeat) game.actionQueued = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (directionFor[key]) setKey(directionFor[key], false);
    if (arrowFor[key]) setKey(arrowFor[key], false);
  });

  window.addEventListener('blur', () => {
    game.keys.up = false;
    game.keys.down = false;
    game.keys.left = false;
    game.keys.right = false;
  });

  canvas.addEventListener('pointerdown', () => {
    canvas.focus({ preventScroll: true });
  });

  // Touch D-pad
  document.querySelectorAll('[data-move]').forEach((button) => {
    const direction = button.dataset.move;
    const release = (event) => {
      if (event) event.preventDefault();
      setKey(direction, false);
      button.classList.remove('pressed');
    };

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      setKey(direction, true);
      button.classList.add('pressed');
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  });

  if (touchActionEl) {
    touchActionEl.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      game.actionQueued = true;
    });
  }

  // ---------------------------------------------------------------------------
  // Particles and floaters
  // ---------------------------------------------------------------------------
  function burst(x, y, color, count) {
    if (reduceMotion) count = Math.min(count, 5);
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(24, 118);
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(8, 42),
        gravity: rand(80, 150),
        size: rand(1.3, 3.1),
        color,
        life: rand(0.35, 0.8),
        maxLife: 0.8
      });
    }
  }

  function updateEffects(dt) {
    for (const particle of game.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
    }
    game.particles = game.particles.filter((particle) => particle.life > 0);

    for (const floater of game.floaters) {
      floater.life -= dt;
      floater.y -= 32 * dt;
    }
    game.floaters = game.floaters.filter((floater) => floater.life > 0);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function updateMovement(dt) {
    let inputX = 0;
    let inputY = 0;

    if (game.keys.left) inputX -= 1;
    if (game.keys.right) inputX += 1;
    if (game.keys.up) inputY -= 1;
    if (game.keys.down) inputY += 1;

    player.moving = inputX !== 0 || inputY !== 0;
    if (!player.moving) return;

    const length = Math.hypot(inputX, inputY) || 1;
    inputX /= length;
    inputY /= length;

    const depth = 0.62 + 0.52 * (player.y / H);
    const step = player.speed * depth * dt;

    player.x = clamp(player.x + inputX * step, PLAY_BOUNDS.minX, PLAY_BOUNDS.maxX);
    player.y = clamp(player.y + inputY * step, PLAY_BOUNDS.minY, PLAY_BOUNDS.maxY);

    if (inputX !== 0) {
      player.dir = 'side';
      player.facing = inputX < 0 ? 'left' : 'right';
    } else {
      player.dir = inputY < 0 ? 'back' : 'front';
    }

    player.bob += dt * 11;
  }

  function update(dt, now) {
    if (game.timerRunning) game.elapsed += dt;

    if (game.state !== 'complete') updateMovement(dt);
    else player.moving = false;

    if (game.state === 'collect') {
      for (const item of game.items) {
        if (!item.collected && dist(player.x, player.y, item.x, item.y) < PICKUP_RADIUS) {
          collectItem(item);
          if (game.state !== 'collect') break;
        }
      }
    }

    if (game.actionQueued) {
      game.actionQueued = false;
      if (game.state === 'repair') {
        if (dist(player.x, player.y, BAY.x, BAY.y) <= BAY.r + 8) {
          completeRepair();
        } else {
          showDialogue('Bring the parts to the repair bay!', 1400);
        }
      } else if (game.state === 'collect' && game.collected.size < PART_DEFS.length) {
        showDialogue('Need all three parts first.', 1200);
      }
    }

    if (game.state === 'complete' && now >= game.completeUntil) {
      startRound();
    }

    updateEffects(dt);
    updateHud(now);
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------
  function drawBackground() {
    if (sprites.background.complete && sprites.background.naturalWidth) {
      ctx.drawImage(sprites.background, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#0a111c';
      ctx.fillRect(0, 0, W, H);
    }

    // Gentle vignette so the HUD and prompts stay readable.
    const gradient = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.78);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(2, 5, 12, 0.45)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  function drawRepairBay(now) {
    const ready = game.state === 'repair';
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    const color = ready ? '#8dffb0' : '#4fd8ff';

    ctx.save();
    ctx.translate(BAY.x, BAY.y);

    ctx.beginPath();
    ctx.ellipse(0, 0, BAY.r, BAY.r * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = ready
      ? `rgba(141, 255, 176, ${0.1 + pulse * 0.12})`
      : 'rgba(79, 216, 255, 0.06)';
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.globalAlpha = ready ? 0.95 : 0.65;
    ctx.lineWidth = ready ? 2.6 : 1.8;
    ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -(now / 45) % 16;
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.ellipse(0, 0, BAY.r * 0.62, BAY.r * 0.31, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Slowly turning hex nut.
    ctx.globalAlpha = ready ? 0.9 : 0.45;
    ctx.save();
    ctx.translate(0, -24);
    ctx.rotate(now / 2600);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const px = Math.cos(angle) * 10;
      const py = Math.sin(angle) * 10;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = ready ? 'rgba(141, 255, 176, 0.16)' : 'rgba(79, 216, 255, 0.12)';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    const prompt = ready ? (isTouch ? 'TAP REPAIR' : 'PRESS E TO REPAIR') : 'REPAIR BAY';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelWidth = ctx.measureText(prompt).width + 16;
    ctx.globalAlpha = 1;
    roundRectPath(-labelWidth / 2, -55, labelWidth, 18, 4);
    ctx.fillStyle = 'rgba(5, 12, 18, 0.78)';
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, ready ? 0.8 : 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = ready ? 1 : 0.8;
    ctx.fillText(prompt, 0, -46);
    ctx.restore();
  }

  function drawPartGlow(item, now) {
    const bob = Math.sin(now / 380 + item.phase) * 2.5;
    const x = item.x;
    const y = item.y + bob;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(item.x, item.y + 2, 17, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y - 16, 2, x, y - 16, 34);
    glow.addColorStop(0, hexToRgba(item.color, 0.34));
    glow.addColorStop(1, hexToRgba(item.color, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - 34, y - 50, 68, 68);
    ctx.restore();

    return { x, y };
  }

  function drawScrapIcon(x, y) {
    if (sprites.scrap.complete && sprites.scrap.naturalWidth) {
      ctx.drawImage(sprites.scrap, x - 15, y - 32, 30, 27);
    } else {
      ctx.fillStyle = '#9aa4b4';
      ctx.fillRect(x - 12, y - 26, 24, 18);
    }
  }

  function drawCircuitIcon(x, y) {
    ctx.save();
    ctx.translate(x, y - 20);
    ctx.fillStyle = '#123a33';
    ctx.strokeStyle = '#57e6ff';
    ctx.lineWidth = 1.5;
    roundRectPath(-15, -10, 30, 20, 3);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#b8ff5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-11, -5);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 1);
    ctx.lineTo(6, 1);
    ctx.moveTo(-8, 5);
    ctx.lineTo(-2, 5);
    ctx.lineTo(2, 1);
    ctx.moveTo(9, -6);
    ctx.lineTo(9, 6);
    ctx.stroke();

    ctx.fillStyle = '#57e6ff';
    ctx.fillRect(-3, -4, 6, 6);
    ctx.restore();
  }

  function drawCellIcon(x, y) {
    ctx.save();
    ctx.translate(x, y - 22);
    ctx.fillStyle = '#1e3a1c';
    ctx.strokeStyle = '#b8ff5e';
    ctx.lineWidth = 1.5;
    roundRectPath(-7, -13, 14, 26, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b8ff5e';
    ctx.fillRect(-4, -15, 8, 2);
    ctx.fillRect(-4, 13, 8, 2);

    ctx.fillStyle = '#eaff7a';
    ctx.beginPath();
    ctx.moveTo(1, -9);
    ctx.lineTo(-4, 1);
    ctx.lineTo(0, 1);
    ctx.lineTo(-1, 9);
    ctx.lineTo(4, -1);
    ctx.lineTo(0, -1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPart(item, now) {
    if (item.collected) return;
    const { x, y } = drawPartGlow(item, now);

    if (item.id === 'scrap') drawScrapIcon(x, y);
    else if (item.id === 'circuit') drawCircuitIcon(x, y);
    else drawCellIcon(x, y);

    // Label the part when Seelig is close enough to notice it.
    if (dist(player.x, player.y, item.x, item.y) < 92) {
      ctx.save();
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = item.name;
      const width = ctx.measureText(text).width + 12;
      const top = y - 58;
      roundRectPath(x - width / 2, top - 8, width, 16, 4);
      ctx.fillStyle = 'rgba(5, 10, 18, 0.82)';
      ctx.fill();
      ctx.strokeStyle = hexToRgba(item.color, 0.6);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = item.color;
      ctx.fillText(text, x, top);
      ctx.restore();
    }
  }

  function drawPlayer() {
    const image = sprites[player.dir];
    const scale = perspectiveScale(player.y);
    const height = player.height * scale;
    const aspect = image.naturalWidth && image.naturalHeight
      ? image.naturalWidth / image.naturalHeight
      : 0.47;
    const width = height * aspect;
    player.renderHeight = height;

    const walkBob = player.moving ? Math.abs(Math.sin(player.bob)) * 1.8 : 0;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, width * 0.52, 3 + scale * 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.dir === 'side' && player.facing === 'left') {
      ctx.scale(-1, 1);
    }

    if (image.complete && image.naturalWidth) {
      ctx.drawImage(image, -width / 2, -height - walkBob, width, height);
    } else {
      ctx.fillStyle = '#2c4b86';
      ctx.fillRect(-width / 2, -height - walkBob, width, height);
    }

    // Walking dust.
    if (player.moving && !reduceMotion && Math.random() < 0.08) {
      game.particles.push({
        x: player.x + rand(-8, 8),
        y: player.y - 1,
        vx: rand(-6, 6),
        vy: rand(-14, -4),
        gravity: 20,
        size: rand(1, 2),
        color: '#8dd6ff',
        life: 0.3,
        maxLife: 0.3
      });
    }

    ctx.restore();
  }

  function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawDialogue(now) {
    if (!player.dialogue.text || now >= player.dialogue.expires) return;

    ctx.save();
    ctx.font = '13px "Share Tech Mono", monospace';
    const lines = wrapText(player.dialogue.text, 230);
    const lineHeight = 16;
    const paddingX = 9;
    const paddingY = 7;
    let boxWidth = 0;
    for (const line of lines) boxWidth = Math.max(boxWidth, ctx.measureText(line).width);
    boxWidth += paddingX * 2;
    const boxHeight = lines.length * lineHeight + paddingY * 2;

    const boxX = clamp(player.x, boxWidth / 2 + 8, W - boxWidth / 2 - 8);
    let boxY = player.y - player.renderHeight - boxHeight - 12;
    boxY = Math.max(8, boxY);

    roundRectPath(boxX - boxWidth / 2, boxY, boxWidth, boxHeight, 6);
    ctx.fillStyle = 'rgba(255, 233, 138, 0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boxX - 5, boxY + boxHeight);
    ctx.lineTo(boxX + 5, boxY + boxHeight);
    ctx.lineTo(boxX, boxY + boxHeight + 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 233, 138, 0.96)';
    ctx.fill();

    ctx.fillStyle = '#151515';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((line, index) => {
      ctx.fillText(line, boxX, boxY + paddingY + index * lineHeight);
    });
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of game.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.font = 'bold 14px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const floater of game.floaters) {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(4, 8, 16, 0.75)';
      ctx.strokeText(floater.text, floater.x, floater.y);
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawRepairBay(now);

    const drawables = [];
    for (const item of game.items) {
      if (!item.collected) {
        drawables.push({ y: item.y, render: () => drawPart(item, now) });
      }
    }
    drawables.push({ y: player.y, render: drawPlayer });
    drawables.sort((a, b) => a.y - b.y);
    for (const drawable of drawables) drawable.render();

    drawParticles();
    drawFloaters();
    drawDialogue(now);
  }

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------
  function frame(now) {
    const dt = game.lastFrame ? Math.min((now - game.lastFrame) / 1000, 0.05) : 0;
    game.lastFrame = now;

    try {
      update(dt, now);
      draw(now);
    } catch (err) {
      console.error('Seelig game error:', err);
    }

    requestAnimationFrame(frame);
  }

  function init() {
    if (scoreEl) scoreEl.textContent = formatScore(game.score);
    if (timeEl) timeEl.textContent = '--.-';
    if (bestEl) bestEl.textContent = formatScore(game.best);
    updateStreakHud();

    startRound(true);
    requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', () => {
      game.lastFrame = 0;
    });

    // Optional debug hooks, only when the page is opened with ?debug.
    if (new URLSearchParams(window.location.search).has('debug')) {
      window.__seelig = {
        game,
        player,
        bay: BAY,
        teleport(x, y) {
          player.x = x;
          player.y = y;
        },
        collectAll() {
          for (const item of game.items) {
            if (!item.collected) collectItem(item);
          }
        },
        repair() {
          game.actionQueued = true;
        }
      };
    }
  }
})();
