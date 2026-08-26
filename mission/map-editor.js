/* ============================================================
   Gemini Sector Mission Map Editor
   Drag-and-drop mission generator producing JSON that validates
   against mission/mission.schema.json.
   ============================================================ */
(function () {
  'use strict';

  /* ── Constants ────────────────────────────────────────────── */
  const MAP_W = 1000;
  const MAP_H = 720;
  const SNAP = 20;

  const OBJECTIVE_TYPES = [
    { value: 'destroy',  label: 'Destroy',  title: 'Kill a named target or enemy_squadron (all non-hero enemies)' },
    { value: 'scan',     label: 'Scan',     title: 'Successfully scan a named target' },
    { value: 'escort',   label: 'Escort',   title: 'A named combatant must survive until mission end' },
    { value: 'defend',   label: 'Defend',   title: 'A named combatant must survive until mission end' },
    { value: 'navigate', label: 'Navigate', title: 'Heroes must visit a specific nav point (auto-targets its nav)' },
    { value: 'capture',  label: 'Capture',  title: 'Target must be scanned, hacked, and alive at mission end' },
    { value: 'has_tractored', label: 'Has Tractored', title: 'A tractor action carrying specified cargo occurred' },
  ];

  const AGGRESSIONS = ['fanatical', 'confident', 'timid'];
  const SKILLS = ['Ace', 'Good', 'pro', 'Fair', 'Poor', 'novice', 'Pathetic'];

  const ENVIRONMENTS = ['space', 'water', 'planet', 'ion nebula', 'ice field', 'solar winds'];

  const REWARD_CONDITIONS = [
    'success', 'failure', 'no_casualties', 'friendly_fire',
    'exact_kill:', 'shared_kill:', 'scanned:', 'time_bonus:',
  ];

  // SEXP kinds and the fields each atomic kind exposes.
  const SEXP_ATOMIC = {
    'turn-at-least':       ['value'],
    'turn-less-than':      ['value'],
    'is-destroyed':        ['target'],
    'is-damaged':          ['target', 'percent'],
    'is-scanned':          ['target'],
    'component_damaged':   ['target', 'component', 'percent'],
    'has-arrived-at':      ['nav'],
    'event-triggered':     ['id'],
    'has_tractored':       ['cargo'],
  };
  const SEXP_ATOMIC_ORDER = ['is-destroyed', 'is-damaged', 'is-scanned', 'component_damaged',
    'has-arrived-at', 'event-triggered', 'has_tractored', 'turn-at-least', 'turn-less-than'];
  const SEXP_ATOMIC_LABELS = {
    'is-destroyed': 'Is Destroyed', 'is-damaged': 'Is Damaged', 'is-scanned': 'Is Scanned',
    'component_damaged': 'Component Damaged', 'has-arrived-at': 'Has Arrived At',
    'event-triggered': 'Event Triggered', 'has_tractored': 'Has Tractored',
    'turn-at-least': 'Turn ≥', 'turn-less-than': 'Turn <',
  };
  const COMPONENTS = ['life_support', 'engines', 'cockpit', 'weapons', 'shields', 'sensors', 'comm'];

  const ACTION_TYPES = ['message', 'spawn', 'objective', 'music', 'environment', 'reveal_nav'];

  /* ── Loaded configs ──────────────────────────────────────── */
  let factions = [];       // array from factions.json
  let envChoices = {};     // map from environments.json

  /* ── State ───────────────────────────────────────────────── */
  let uidCounter = 0;
  const uid = () => 'u' + (++uidCounter) + '_' + Math.random().toString(36).slice(2, 8);

  const state = {
    navPoints: [],   // {uid, name, x, y, descr, env, hidden, asteroids, jump, dest, objectiveUids:[], encounters:[]}
    objectives: [],  // {uid, id, type, target, required, hidden, reward_conditions:[], description}
    rewards: [],     // {uid, condition, faction, reputation, credits, description}
    events: [],      // {uid, id, condition, actions:[]}
    selected: null,  // {kind:'nav'|'objective'|'encounter'|'event'|'reward', uid}
  };

  /* ── DOM refs ────────────────────────────────────────────── */
  let mapCanvas, mapMarkers, mapDropHint, propertyPanel, trashZone,
      jsonPreview, validationResult, navCountLabel, cursorCoords, mapStatus;

  /* ── Bootstrap ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    mapCanvas = document.getElementById('mapCanvas');
    mapMarkers = document.getElementById('mapMarkers');
    mapDropHint = document.getElementById('mapDropHint');
    propertyPanel = document.getElementById('propertyPanel');
    trashZone = document.getElementById('trashZone');
    jsonPreview = document.getElementById('jsonPreview');
    validationResult = document.getElementById('validationResult');
    navCountLabel = document.getElementById('navCountLabel');
    cursorCoords = document.getElementById('cursorCoords');
    mapStatus = document.getElementById('mapStatus');

    await loadConfigs();
    addStarfield();
    wireUI();
    initCookieNotice();

    // Restore any saved draft; otherwise start with a Home base nav point so the map is never empty.
    const draft = loadDraft();
    if (draft) {
      applyState(draft);
    } else {
      addNavPoint(Math.round(MAP_W / 2), Math.round(MAP_H / 2), 'Home: base', true);
      addDefaultReward();
    }
    renderMap();
    ready = true;
  }

  async function loadConfigs() {
    try {
      const [f, e] = await Promise.all([
        fetch('./factions.json'),
        fetch('./environments.json'),
      ]);
      factions = await f.json();
      envChoices = await e.json();
    } catch (err) {
      console.error('Failed to load configs', err);
      setStatus('⚠ Could not load factions/environments');
    }
  }

  function addStarfield() {
    for (let i = 0; i < 130; i++) {
      const s = document.createElement('div');
      s.className = 'map-star';
      s.style.left = (Math.random() * MAP_W) + 'px';
      s.style.top = (Math.random() * MAP_H) + 'px';
      const r = 0.5 + Math.random() * 1.3;
      s.style.width = r + 'px';
      s.style.height = r + 'px';
      s.style.background = ['#fff', '#bcd9ff', '#ffe9c9', '#d9c9ff'][Math.floor(Math.random() * 4)];
      s.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
      mapCanvas.insertBefore(s, mapCanvas.querySelector('.map-grid-bg').nextSibling || null);
    }
  }

  function wireUI() {
    document.getElementById('addNavBtn').addEventListener('click', () => {
      const nav = addNavPoint(MAP_W / 2 + (Math.random() * 200 - 100), MAP_H / 2 + (Math.random() * 200 - 100));
      renderMap();
      select({ kind: 'nav', uid: nav.uid });
    });

    document.getElementById('exportBtn').addEventListener('click', doExport);
    document.getElementById('previewBtn').addEventListener('click', doExport);
    document.getElementById('copyBtn').addEventListener('click', copyJson);
    document.getElementById('downloadBtn').addEventListener('click', downloadMission);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', handleImportFile);
    document.getElementById('clearDraftBtn').addEventListener('click', () => {
      if (confirm('Delete the saved draft and start fresh? This clears the saved cookie / local storage.')) clearDraft();
    });

    // Mission toolbar fields update on change (and auto-save the draft)
    ['missionName', 'missionSystem', 'missionLocation', 'missionTimeLimit'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => {
        state.meta[id] = el.value;
        scheduleSave();
      });
    });
    document.getElementById('missionBarter').addEventListener('change', (e) => {
      state.meta.barter_on_end = e.target.checked;
      scheduleSave();
    });

    // Palette item drags
    document.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('pointerdown', (e) => startPaletteDrag(e, item.dataset.dragType));
    });

    // Map surface drag (dropping new nav points directly on empty space)
    mapCanvas.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.map-marker')) return; // marker handles its own move
      if (drag && drag.kind === 'new') return;
      // Allow selecting nav by clicking empty space to clear selection
      if (e.target.closest('#mapCanvas')) {
        clearSelection();
      }
    });

    // Marker move + click handling (delegation)
    mapMarkers.addEventListener('pointerdown', (e) => {
      const marker = e.target.closest('.map-marker');
      if (!marker) return;
      e.preventDefault();
      const nav = navByUid(marker.dataset.navUid);
      if (!nav) return;
      startMoveDrag(e, nav);
    });

    // Global pointer move/up for any active drag
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', endDrag);

    wirePanelEvents();
  }

  // Store mission metadata in a meta object for convenience.
  state.meta = {
    missionName: '', missionSystem: '', missionLocation: '', missionTimeLimit: '', barter_on_end: false,
  };

  /* ── Draft persistence (cookie + localStorage fallback) ──── */
  const DRAFT_COOKIE = 'gemini_mission_draft';
  const COOKIE_OK_COOKIE = 'gemini_cookie_ok';
  const COOKIE_MAX = 3800; // keep comfortably under the ~4KB cookie limit
  let ready = false;       // gates saving until init is done

  function setCookie(name, value, maxAgeSeconds) {
    try {
      const enc = encodeURIComponent(value);
      const ma = maxAgeSeconds ? `; max-age=${maxAgeSeconds}` : '';
      document.cookie = `${name}=${enc}; path=/; SameSite=Lax${ma}`;
      return document.cookie.indexOf(name + '=') !== -1;
    } catch (err) { return false; }
  }
  function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function deleteCookie(name) {
    document.cookie = `${name}=; path=/; max-age=0`;
  }

  function serializeState() {
    return JSON.stringify({
      meta: state.meta,
      navPoints: state.navPoints,
      objectives: state.objectives,
      rewards: state.rewards,
      events: state.events,
    });
  }

  let saveTimer = null;
  function scheduleSave() {
    if (!ready) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 450);
  }

  function saveDraft() {
    try {
      const str = serializeState();
      let stored = false;
      if (str.length <= COOKIE_MAX) stored = setCookie(DRAFT_COOKIE, str, 60 * 60 * 24 * 30); // 30 days
      if (!stored) {
        // Cookie too large (or unavailable) → fall back to local storage.
        try { localStorage.setItem(DRAFT_COOKIE, str); setStatus('Draft too large for a cookie — saved to local storage.'); }
        catch (e) { setStatus('⚠ Could not save draft (too large).'); }
      } else {
        try { localStorage.removeItem(DRAFT_COOKIE); } catch (e) {}
      }
    } catch (err) {
      console.warn('Could not save draft', err);
    }
  }

  function loadDraft() {
    try {
      let raw = getCookie(DRAFT_COOKIE);
      if (!raw) { raw = localStorage.getItem(DRAFT_COOKIE) || null; }
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.navPoints)) return null;
      return data;
    } catch (err) { return null; }
  }

  function applyState(data) {
    state.meta = Object.assign({ missionName: '', missionSystem: '', missionLocation: '', missionTimeLimit: '', barter_on_end: false }, data.meta || {});
    state.navPoints = (data.navPoints || []).slice();
    state.objectives = (data.objectives || []).slice();
    state.rewards = (data.rewards || []).slice();
    state.events = (data.events || []).slice();
    document.getElementById('missionName').value = state.meta.missionName || '';
    document.getElementById('missionSystem').value = state.meta.missionSystem || '';
    document.getElementById('missionLocation').value = state.meta.missionLocation || '';
    document.getElementById('missionTimeLimit').value = state.meta.missionTimeLimit || '';
    document.getElementById('missionBarter').checked = !!state.meta.barter_on_end;
    clearSelection();
  }

  function clearDraft() {
    deleteCookie(DRAFT_COOKIE);
    try { localStorage.removeItem(DRAFT_COOKIE); } catch (e) {}
    location.reload();
  }

  function initCookieNotice() {
    const notice = document.getElementById('cookieNotice');
    if (notice && getCookie(COOKIE_OK_COOKIE) !== '1') notice.hidden = false;
    document.getElementById('cookieDismiss').addEventListener('click', () => {
      setCookie(COOKIE_OK_COOKIE, '1', 60 * 60 * 24 * 365);
      document.getElementById('cookieNotice').hidden = true;
    });
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function navByUid(u) { return state.navPoints.find(n => n.uid === u); }
  function objByUid(u) { return state.objectives.find(o => o.uid === u); }
  function evtByUid(u) { return state.events.find(ev => ev.uid === u); }
  function rewardByUid(u) { return state.rewards.find(r => r.uid === u); }
  function navByName(n) { return state.navPoints.find(np => np.name === n); }

  function mapCoords(clientX, clientY) {
    const rect = mapCanvas.getBoundingClientRect();
    return {
      x: clamp(clientX - rect.left, 0, MAP_W),
      y: clamp(clientY - rect.top, 0, MAP_H),
    };
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function setStatus(msg) {
    if (mapStatus) mapStatus.textContent = msg || '';
  }

  /* ── Nav point CRUD ──────────────────────────────────────── */
  function addNavPoint(x, y, name, isHome) {
    let n = name;
    if (!n) {
      if (state.navPoints.length === 0) {
        n = 'Home: base';
      } else {
        let i = 1;
        while (state.navPoints.some(np => np.name === `Nav ${i}`)) i++;
        n = `Nav ${i}`;
      }
    }
    const nav = {
      uid: uid(), name: n, x: Math.round(x), y: Math.round(y),
      descr: '', env: 'space', hidden: false, asteroids: false,
      jump: false, dest: '', objectiveUids: [], encounters: [],
    };
    state.navPoints.push(nav);
    // Nudge to avoid overlap
    resolveOverlap(nav);
    return nav;
  }

  function resolveOverlap(nav) {
    let attempts = 0;
    let overlapping = true;
    while (overlapping && attempts < 200) {
      overlapping = state.navPoints.some(other =>
        other.uid !== nav.uid && Math.abs(other.x - nav.x) < 60 && Math.abs(other.y - nav.y) < 60
      );
      if (overlapping) {
        nav.x = clamp(nav.x + 70, 30, MAP_W - 30);
        nav.y = clamp(nav.y + 70, 30, MAP_H - 30);
        attempts++;
      }
    }
  }

  function removeNavPoint(nav) {
    // Remove objectives that are only attached to this nav (and not others)
    nav.objectiveUids.forEach(ouid => {
      const stillUsed = state.navPoints.some(o => o.uid !== nav.uid && o.objectiveUids.includes(ouid));
      if (!stillUsed) {
        state.objectives = state.objectives.filter(o => o.uid !== ouid);
      }
    });
    state.navPoints = state.navPoints.filter(np => np.uid !== nav.uid);
    if (state.selected && state.selected.kind === 'nav' && state.selected.uid === nav.uid) clearSelection();
  }

  /* ── Objectives ──────────────────────────────────────────── */
  function addObjective(navUid) {
    const nav = navUid ? navByUid(navUid) : null;
    const objective = {
      uid: uid(),
      id: defaultObjId(),
      type: nav ? 'navigate' : 'destroy',
      target: nav ? nav.name : '',
      required: true,
      hidden: false,
      reward_conditions: [],
      description: '',
    };
    state.objectives.push(objective);
    if (nav) nav.objectiveUids.push(objective.uid);
    return objective;
  }

  function defaultObjId() {
    const base = 'objective';
    let i = 1;
    while (state.objectives.some(o => o.id === `${base}_${i}`)) i++;
    return `${base}_${i}`;
  }

  function removeObjective(obj, skipDetach) {
    state.objectives = state.objectives.filter(o => o.uid !== obj.uid);
    if (!skipDetach) {
      state.navPoints.forEach(n => {
        n.objectiveUids = n.objectiveUids.filter(u => u !== obj.uid);
      });
    }
  }

  /* ── Encounters ──────────────────────────────────────────── */
  function addEncounter(nav) {
    const enc = {
      uid: uid(), nb: 2, faction: 'kilrathi', ship_type: '',
      aggression: 'confident', skill: 'Fair', probability: 100,
      name: '', team: '', cargo: '', comms: '',
      nemesis: false, arrival: '', arrival_message: '',
    };
    if (nav.shipChoices && nav.shipChoices.length) enc.ship_type = nav.shipChoices[0];
    nav.encounters.push(enc);
    return enc;
  }

  /* ── Events ──────────────────────────────────────────────── */
  function addEvent() {
    const ev = {
      uid: uid(), id: defaultEventId(),
      condition: { type: 'event-triggered', id: '' },
      actions: [{ type: 'message', target: 'HQ', text: '' }],
    };
    state.events.push(ev);
    return ev;
  }
  function defaultEventId() {
    const base = 'event';
    let i = 1;
    while (state.events.some(ev => ev.id === `${base}_${i}`)) i++;
    return `${base}_${i}`;
  }

  /* ── Rewards ─────────────────────────────────────────────── */
  function addReward(condition = 'success', faction = 'confederation', reputation = 5, credits = 0) {
    const r = { uid: uid(), condition, faction, reputation, credits, description: '' };
    state.rewards.push(r);
    return r;
  }
  function addDefaultReward() { addReward(); }

  /* ── Selection ───────────────────────────────────────────── */
  function select(sel) {
    state.selected = sel;
    renderMap();
    renderPanel();
  }
  function clearSelection() {
    state.selected = null;
    renderMap();
    renderPanel();
  }

  /* ── Rendering: map ──────────────────────────────────────── */
  function renderMap() {
    mapMarkers.innerHTML = '';
    state.navPoints.forEach(nav => mapMarkers.appendChild(buildMarker(nav)));
    navCountLabel.textContent = `${state.navPoints.length} nav point${state.navPoints.length === 1 ? '' : 's'}`;
    refreshSexpDatalists();
    scheduleSave();
  }

  function buildMarker(nav) {
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.dataset.navUid = nav.uid;
    setMarkerTransform(el, nav.x, nav.y);
    if (state.selected && state.selected.kind === 'nav' && state.selected.uid === nav.uid) {
      el.classList.add('is-selected');
    }
    if (nav.hidden) el.classList.add('hidden-marker');

    // Icon shape by type: home = white triangle, jump = blue circle, else green square.
    const shape = (nav.name === 'Home: base') ? 'home-dot' : (nav.jump ? 'jump-dot' : 'nav-dot');
    // Home base is a hollow (transparent-fill) triangle outline.
    const dotContent = shape === 'home-dot'
      ? '<svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="8,1 15,15 1,15" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/></svg>'
      : '';
    const asteroidRing = nav.asteroids ? '<div class="asteroid-ring"></div>' : '';

    const badges = [];
    if (nav.objectiveUids.length) badges.push(`<span class="marker-badge obj-b">${nav.objectiveUids.length} obj</span>`);
    if (nav.encounters.length) badges.push(`<span class="marker-badge enc-b">${nav.encounters.length} enc</span>`);
    const attachedEvts = state.events.filter(ev => JSON.stringify(ev.actions).includes('"' + nav.name + '"'));
    if (attachedEvts.length) badges.push('<span class="marker-badge evt-b">evt</span>');

    el.innerHTML = `
      <div class="marker-dot ${shape}">${dotContent}</div>
      ${asteroidRing}
      <div class="marker-label">${esc(nav.name)}</div>
      ${badges.length ? `<div class="marker-badges">${badges.join('')}</div>` : ''}`;
    return el;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Position a marker so its centre (the dot) sits at (x, y). The marker is a
  // 0x0 anchor point, so translate by the pixel offset directly (compositor-driven).
  function setMarkerTransform(el, x, y) {
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  /* ── Drag & drop ─────────────────────────────────────────── */
  let drag = null; // {kind, type, navUid, moved, startX, startY, offX, offY, ghost}

  function makeGhost(label, color) {
    const g = document.createElement('div');
    g.className = 'map-ghost';
    g.style.padding = '6px 10px';
    g.style.borderRadius = '6px';
    g.style.background = 'rgba(10,16,30,0.92)';
    g.style.border = '1px solid ' + color;
    g.style.color = '#fff';
    g.style.fontSize = '0.8rem';
    g.textContent = label;
    document.body.appendChild(g);
    return g;
  }

  function startPaletteDrag(e, type) {
    e.preventDefault();
    try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* capture is best-effort */ }
    const labelMap = { navpoint: 'New Nav Point', objective: 'New Objective', encounter: 'New Encounter', event: 'New Event' };
    const colorMap = { navpoint: '#5ec8ff', objective: '#9bf28a', encounter: '#ff9d6b', event: '#ffd75e' };
    const ghost = makeGhost(labelMap[type], colorMap[type]);
    drag = { kind: 'new', type, moved: false, startX: e.clientX, startY: e.clientY, ghost };
    ghost.style.left = (e.clientX + 12) + 'px';
    ghost.style.top = (e.clientY + 8) + 'px';
    scheduleDragFrame(e.clientX, e.clientY);
  }

  function startMoveDrag(e, nav) {
    e.preventDefault();
    try { e.target.closest('.map-marker').setPointerCapture(e.pointerId); } catch (err) {}
    const ghost = makeGhost(nav.name, '#5ec8ff');
    drag = { kind: 'move', navUid: nav.uid, moved: false, startX: e.clientX, startY: e.clientY, offX: nav.x, offY: nav.y, ghost };
    const marker = e.target.closest('.map-marker');
    if (marker) marker.classList.add('is-dragging');
    scheduleDragFrame(e.clientX, e.clientY);
  }

  // ── rAF-throttled drag loop (smooth, compositor-friendly) ──
  let rafPending = false;
  let lastClientX = 0, lastClientY = 0;

  function scheduleDragFrame(cx, cy) {
    lastClientX = cx;
    lastClientY = cy;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(applyDragFrame);
    }
  }

  function onPointerMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    scheduleDragFrame(e.clientX, e.clientY);
  }

  function applyDragFrame() {
    rafPending = false;
    if (!drag) return;
    const cx = lastClientX, cy = lastClientY;

    // Ghost follows the cursor
    drag.ghost.style.left = (cx + 12) + 'px';
    drag.ghost.style.top = (cy + 8) + 'px';

    // Auto-scroll the map when near an edge of the scroll viewport
    autoScrollMap(cx, cy);

    clearDropTargets();
    if (drag.kind === 'move') {
      if (drag.moved) {
        const nav = navByUid(drag.navUid);
        if (nav) {
          nav.x = clamp(drag.offX + (cx - drag.startX), 30, MAP_W - 30);
          nav.y = clamp(drag.offY + (cy - drag.startY), 30, MAP_H - 30);
          const marker = document.querySelector(`.map-marker[data-nav-uid="${nav.uid}"]`);
          if (marker) setMarkerTransform(marker, nav.x, nav.y);
        }
      }
      const overTrash = elementFromPointOr(cx, cy, '.palette-trash');
      if (overTrash) trashZone.classList.add('drag-over');
      return;
    }

    // New-item drop target detection
    if (drag.type === 'navpoint') {
      const { x, y } = mapCoords(cx, cy);
      mapCanvas.classList.add('drag-over-surface');
      mapDropHint.style.left = x + 'px';
      mapDropHint.style.top = y + 'px';
      mapDropHint.innerHTML = '◎';
      mapDropHint.classList.add('active');
      cursorCoords.textContent = `${Math.round(x)}, ${Math.round(y)}`;
    } else {
      const marker = elementFromPointOr(cx, cy, '.map-marker');
      if (marker) marker.classList.add('drop-target');
    }
  }

  // Scroll the map so the dragged item can reach off-screen areas.
  function autoScrollMap(cx, cy) {
    const sc = document.querySelector('.map-scroll');
    if (!sc) return;
    const r = sc.getBoundingClientRect();
    const edge = 52;
    const speed = 22;
    let sx = 0, sy = 0;
    if (cx < r.left + edge) sx = -speed;
    else if (cx > r.right - edge) sx = speed;
    if (cy < r.top + edge) sy = -speed;
    else if (cy > r.bottom - edge) sy = speed;
    if (sx || sy) {
      sc.scrollLeft += sx;
      sc.scrollTop += sy;
      // Keep updating while near an edge (via the rAF loop).
      if (drag && rafPending === false) scheduleDragFrame(cx, cy);
    }
  }

  function elementFromPointOr(x, y, selector) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest(selector) : null;
  }

  function clearDropTargets() {
    document.querySelectorAll('.map-marker.drop-target').forEach(m => m.classList.remove('drop-target'));
    trashZone.classList.remove('drag-over');
    mapCanvas.classList.remove('drag-over-surface');
    mapDropHint.classList.remove('active');
  }

  function onPointerUp(e) {
    if (!drag) return;
    const d = drag;
    endDrag();

    if (d.kind === 'move') {
      handleMoveDrop(d, e);
      return;
    }
    handleNewDrop(d, e);
  }

  function handleMoveDrop(d, e) {
    const nav = navByUid(d.navUid);
    if (!nav) return;
    if (!d.moved) {
      // Treat as a click → select this nav point
      select({ kind: 'nav', uid: nav.uid });
      return;
    }
    // Snap
    nav.x = Math.round(nav.x / SNAP) * SNAP;
    nav.y = Math.round(nav.y / SNAP) * SNAP;
    // Delete if dropped in trash
    const overTrash = elementFromPointOr(e.clientX, e.clientY, '.palette-trash');
    if (overTrash) {
      if (confirm(`Delete nav point "${nav.name}" and its ${nav.encounters.length} encounter(s)?`)) {
        removeNavPoint(nav);
        renderMap();
        return;
      }
    }
    resolveOverlap(nav);
    renderMap();
    select({ kind: 'nav', uid: nav.uid });
  }

  function handleNewDrop(d, e) {
    const marker = elementFromPointOr(e.clientX, e.clientY, '.map-marker');
    const targetNav = marker ? navByUid(marker.dataset.navUid) : null;

    if (d.type === 'navpoint') {
      const { x, y } = mapCoords(e.clientX, e.clientY);
      const nav = addNavPoint(x, y);
      renderMap();
      select({ kind: 'nav', uid: nav.uid });
      setStatus(`Added nav point "${nav.name}"`);
      return;
    }

    if (d.type === 'objective') {
      const obj = addObjective(targetNav ? targetNav.uid : null);
      renderMap();
      select({ kind: 'objective', uid: obj.uid });
      setStatus(targetNav ? `Objective added to "${targetNav.name}"` : 'Objective added (not attached to a nav point)');
      return;
    }

    if (d.type === 'encounter') {
      if (!targetNav) {
        setStatus('⚠ Drop an Encounter onto a nav point marker.');
        return;
      }
      const enc = addEncounter(targetNav);
      renderMap();
      select({ kind: 'encounter', uid: enc.uid });
      setStatus(`Encounter added to "${targetNav.name}"`);
      return;
    }

    if (d.type === 'event') {
      const ev = addEvent();
      renderMap();
      select({ kind: 'event', uid: ev.uid });
      setStatus('Event added');
    }
  }

  function endDrag() {
    rafPending = false; // drop any queued drag frame
    if (drag && drag.ghost && drag.ghost.parentNode) drag.ghost.remove();
    document.querySelectorAll('.map-marker.is-dragging').forEach(m => m.classList.remove('is-dragging'));
    clearDropTargets();
    drag = null;
  }

  /* ── Property panel ──────────────────────────────────────── */
  function renderPanel() {
    const sel = state.selected;
    scheduleSave();
    if (!sel) {
      const list = (title, itemsHtml) => `
        <div class="prop-sublist">
          <div class="prop-sublist-title">${title}</div>
          ${itemsHtml || '<div style="opacity:.6;font-size:.78rem">None.</div>'}
        </div>`;
      propertyPanel.innerHTML = `
        <div class="panel-empty" style="margin-bottom:10px">
          <strong>Nothing selected</strong><br>
          <span style="font-size:.8rem">Click an item below to edit it, or drag items from the palette onto the map.</span>
        </div>
        ${list(`Nav Points (${state.navPoints.length})`, state.navPoints.map(n =>
          `<div class="prop-sublist-item" data-action="select-nav" data-arg="${n.uid}"><span class="badge">◎</span><span>${esc(n.name)}</span></div>`).join(''))}
        ${list(`Objectives (${state.objectives.length})`, state.objectives.map(o =>
          `<div class="prop-sublist-item" data-action="select-objective" data-arg="${o.uid}"><span class="badge">${esc(o.type)}</span><span>${esc(o.id)}</span></div>`).join(''))}
        ${list(`Events (${state.events.length})`, state.events.map(ev =>
          `<div class="prop-sublist-item" data-action="select-event" data-arg="${ev.uid}"><span class="badge">⚡</span><span>${esc(ev.id)}</span></div>`).join(''))}
        ${list(`Rewards (${state.rewards.length})`, (state.rewards.map(r =>
          `<div class="prop-sublist-item" data-action="select-reward" data-arg="${r.uid}"><span class="badge">${esc(r.condition)}</span><span>${esc(r.faction)} ${r.reputation}/${r.credits}</span></div>`).join('') +
          `<div class="prop-actions"><button type="button" class="btn-small" data-action="add-reward">+ Add Reward</button></div>`))}
        <div class="prop-actions">
          <button type="button" class="btn-small" data-action="add-reward">+ Add Reward</button>
        </div>
      `;
      return;
    }
    if (sel.kind === 'nav') renderNavPanel(navByUid(sel.uid));
    else if (sel.kind === 'objective') renderObjectivePanel(objByUid(sel.uid));
    else if (sel.kind === 'encounter') renderEncounterPanel(sel);
    else if (sel.kind === 'event') renderEventPanel(evtByUid(sel.uid));
    else if (sel.kind === 'reward') renderRewardPanel(rewardByUid(sel.uid));
  }

  function panelHead(title, extraClass, onClose) {
    return `<div class="prop-header">
      <span class="prop-title ${extraClass || ''}">${title}</span>
      <button type="button" class="prop-close" data-action="clear-sel" title="Close">✕</button>
    </div>`;
  }

  function field(id, label, inner, help) {
    return `<div class="prop-field"><label for="${id}">${label}${help ? `<span class="prop-help"> — ${help}</span>` : ''}</label>${inner}</div>`;
  }

  function selText(id, label, val, placeholder, help) {
    return field(id, label, `<input type="text" id="${id}" value="${esc(val)}" placeholder="${esc(placeholder || '')}">`, help);
  }
  function selNum(id, label, val, help) {
    return field(id, label, `<input type="number" id="${id}" value="${esc(val)}">`, help);
  }
  function selCk(id, label, checked, help) {
    return `<div class="prop-field prop-check"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><label for="${id}">${label}</label>${help ? `<span class="prop-help"> — ${help}</span>` : ''}</div>`;
  }

  // Delegated handlers for the property panel (wired in init via wireUI)
  function wirePanelEvents() {
    propertyPanel.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="clear-sel"]')) { clearSelection(); return; }
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      const arg = el.dataset.arg;
      handlePanelAction(action, arg, e);
    });
    propertyPanel.addEventListener('change', (e) => handlePanelChange(e));
    propertyPanel.addEventListener('input', (e) => handlePanelInput(e));
  }

  function handlePanelAction(action, arg, e) {
    if (action === 'add-objective') {
      const obj = addObjective(arg);
      renderMap(); renderPanel(); select({ kind: 'objective', uid: obj.uid });
    } else if (action === 'select-nav') {
      select({ kind: 'nav', uid: arg });
    } else if (action === 'select-event') {
      select({ kind: 'event', uid: arg });
    } else if (action === 'select-reward') {
      select({ kind: 'reward', uid: arg });
    } else if (action === 'add-reward') {
      const r = addReward();
      renderPanel();
      select({ kind: 'reward', uid: r.uid });
    } else if (action === 'remove-objective') {
      const obj = objByUid(arg);
      if (obj) { removeObjective(obj); renderMap(); renderPanel(); }
    } else if (action === 'select-objective') {
      select({ kind: 'objective', uid: arg });
    } else if (action === 'add-encounter') {
      const nav = navByUid(arg);
      const enc = addEncounter(nav);
      renderMap(); renderPanel(); select({ kind: 'encounter', uid: enc.uid });
    } else if (action === 'remove-encounter') {
      const enc = findEncounter(arg);
      if (enc) { enc.nav.encounters = enc.nav.encounters.filter(x => x.uid !== arg); renderMap(); renderPanel(); }
    } else if (action === 'select-encounter') {
      select({ kind: 'encounter', uid: arg });
    } else if (action === 'remove-nav') {
      const nav = navByUid(arg);
      if (nav && confirm(`Delete nav point "${nav.name}"?`)) { removeNavPoint(nav); renderMap(); }
    } else if (action === 'remove-event') {
      const ev = evtByUid(arg);
      if (ev) { state.events = state.events.filter(x => x.uid !== arg); renderMap(); renderPanel(); clearSelection(); }
    } else if (action === 'add-action') {
      const ev = evtByUid(arg);
      if (ev) { ev.actions.push({ type: 'message', target: 'HQ', text: '' }); renderPanel(); }
    } else if (action === 'remove-action') {
      const ev = evtByUid(arg.split(':')[0]);
      const idx = parseInt(arg.split(':')[1], 10);
      if (ev) { ev.actions.splice(idx, 1); renderPanel(); }
    } else if (action === 'remove-reward') {
      const r = rewardByUid(arg);
      if (r) { state.rewards = state.rewards.filter(x => x.uid !== arg); renderPanel(); }
    } else if (action === 'sexp-remove') {
      const ev = evtByUid(arg.split(':')[0]);
      if (ev) { ev.condition = defaultSexp(); renderPanel(); }
    }
  }

  function findEncounter(uidToFind) {
    for (const nav of state.navPoints) {
      for (const enc of nav.encounters) {
        if (enc.uid === uidToFind) return { enc, nav };
      }
    }
    return null;
  }

  /* ── Nav panel ───────────────────────────────────────────── */
  function renderNavPanel(nav) {
    if (!nav) { clearSelection(); return; }
    const envOptions = ENVIRONMENTS.map(env =>
      `<option value="${env}" ${nav.env === env ? 'selected' : ''}>${env.charAt(0).toUpperCase() + env.slice(1)}</option>`).join('');

    const attachedObjs = nav.objectiveUids.map(u => objByUid(u)).filter(Boolean);
    const objList = attachedObjs.length
      ? attachedObjs.map(o => `
        <div class="prop-sublist-item" data-action="select-objective" data-arg="${o.uid}">
          <span class="badge">${o.type}</span>
          <span>${esc(o.id)}</span>
        </div>`).join('')
      : `<div style="opacity:.6;font-size:.78rem">No objectives attached.</div>`;

    const encList = nav.encounters.length
      ? nav.encounters.map(enc => `
        <div class="prop-sublist-item" data-action="select-encounter" data-arg="${enc.uid}">
          <span class="badge">${enc.nb}×</span>
          <span>${esc(enc.ship_type || '?')}</span>
        </div>`).join('')
      : `<div style="opacity:.6;font-size:.78rem">No encounters.</div>`;

    const evtCount = state.events.filter(ev => ev.actions.some(a => a.target === nav.name)).length;

    propertyPanel.innerHTML = `
      ${panelHead('Nav Point', 'nav-icon')}
      ${selText('np-name', 'Name', nav.name, 'Nav 1', 'Also the key in nav_points.')}
      ${selText('np-descr', 'Description', nav.descr, 'You see empty space.', 'descr field')}
      ${field('np-env', 'Environment', `<select id="np-env">${envOptions}</select>`)}
      <div class="prop-row">
        ${selNum('np-x', 'X', nav.x)}
        ${selNum('np-y', 'Y', nav.y)}
      </div>
      ${selCk('np-hidden', 'Hidden nav point', nav.hidden, 'Appears during the mission.')}
      ${selCk('np-asteroids', 'Has asteroids', nav.asteroids)}
      ${selCk('np-jump', 'Is jump point', nav.jump, 'Sets a jump destination.')}
      ${nav.jump ? selText('np-dest', 'Jump destination', nav.dest, 'e.g. Vega') : ''}

      <div class="prop-sublist">
        <div class="prop-sublist-title">Objectives (${attachedObjs.length})</div>
        ${objList}
        <div class="prop-actions">
          <button type="button" class="btn-small" data-action="add-objective" data-arg="${nav.uid}">+ Add Objective</button>
        </div>
      </div>

      <div class="prop-sublist">
        <div class="prop-sublist-title">Encounters (${nav.encounters.length})</div>
        ${encList}
        <div class="prop-actions">
          <button type="button" class="btn-small" data-action="add-encounter" data-arg="${nav.uid}">+ Add Encounter</button>
        </div>
      </div>

      <div class="prop-sublist">
        <div class="prop-sublist-title">Referenced by ${evtCount} event(s)</div>
        <div style="font-size:.76rem;opacity:.7">Events whose action targets "${esc(nav.name)}" run at this nav point.</div>
      </div>

      <div class="prop-actions">
        <button type="button" class="btn-small danger" data-action="remove-nav" data-arg="${nav.uid}">Delete Nav Point</button>
      </div>`;
  }

  /* ── Objective panel ─────────────────────────────────────── */
  function renderObjectivePanel(obj) {
    if (!obj) { clearSelection(); return; }
    const typeOptions = OBJECTIVE_TYPES.map(t =>
      `<option value="${t.value}" ${obj.type === t.value ? 'selected' : ''} title="${esc(t.title)}">${t.label}</option>`).join('');

    // Which navs reference this objective
    const attachedNavs = state.navPoints.filter(n => n.objectiveUids.includes(obj.uid));
    const navInfo = attachedNavs.length
      ? attachedNavs.map(n => `<span style="color:#9cc9ff">${esc(n.name)}</span>`).join(', ')
      : '<span style="opacity:.6">not attached to any nav point</span>';

    const targetSugg = computeSexpSuggestions().target;
    const targetOptions = targetSugg.map(v => `<option value="${esc(v)}"></option>`).join('');

    propertyPanel.innerHTML = `
      ${panelHead('Objective', 'obj-icon')}
      ${selText('ob-id', 'ID', obj.id, 'kill_ace', 'Must be unique.')}
      ${field('ob-type', 'Type', `<select id="ob-type">${typeOptions}</select>`, 'navigate auto-targets its nav point')}
      ${field('ob-target', 'Target', `<input type="text" id="ob-target" value="${esc(obj.target)}" list="objTargetList" placeholder="e.g. enemy_squadron" autocomplete="off"><datalist id="objTargetList">${targetOptions}</datalist>`, 'Auto-links to the owning nav point for navigate.')}
      <div style="font-size:.76rem;opacity:.8;margin-bottom:8px">Attached to: ${navInfo}</div>
      ${selCk('ob-required', 'Required', obj.required)}
      ${selCk('ob-hidden', 'Hidden', obj.hidden)}
      ${selText('ob-rc', 'Reward conditions', (obj.reward_conditions || []).join(', '), 'success, exact_kill:Name', 'Comma-separated.')}
      ${field('ob-desc', 'Description', `<textarea id="ob-desc" placeholder="Optional objective briefing.">${esc(obj.description || '')}</textarea>`)}
      <div class="prop-actions">
        <button type="button" class="btn-small danger" data-action="remove-objective" data-arg="${obj.uid}">Delete Objective</button>
      </div>`;
  }

  /* ── Encounter panel ─────────────────────────────────────── */
  function renderEncounterPanel(sel) {
    const found = findEncounter(sel.uid);
    if (!found) { clearSelection(); return; }
    const { enc, nav } = found;

    const factionOptions = factions.map(f => {
      const display = f.name.charAt(0).toUpperCase() + f.name.slice(1);
      return `<option value="${f.name}" ${enc.faction === f.name ? 'selected' : ''} title="${esc(f.help_text || '')}">${display}</option>`;
    }).join('');

    const shipChoices = (factions.find(f => f.name === enc.faction) || {}).ships || [];
    const shipOptions = shipChoices.map(s => `<option value="${esc(s)}"></option>`).join('');

    const aggOptions = AGGRESSIONS.map(a => `<option ${enc.aggression === a ? 'selected' : ''}>${a}</option>`).join('');
    const skillOptions = SKILLS.map(s => `<option ${enc.skill === s ? 'selected' : ''}>${s}</option>`).join('');

    propertyPanel.innerHTML = `
      ${panelHead(`Encounter @ ${esc(nav.name)}`, 'enc-icon')}
      ${field('en-faction', 'Faction', `<select id="en-faction">${factionOptions}</select>`)}
      ${field('en-ship', 'Ship type', `<input type="text" id="en-ship" list="enShipList" value="${esc(enc.ship_type)}" placeholder="Type a ship type…"><datalist id="enShipList">${shipOptions}</datalist>`)}
      <div class="prop-row">
        ${selNum('en-nb', 'Ships', enc.nb, '1–9')}
        ${selNum('en-prob', 'Probability %', enc.probability)}
      </div>
      <div class="prop-row">
        ${field('en-agg', 'Aggression', `<select id="en-agg">${aggOptions}</select>`)}
        ${field('en-skill', 'Skill', `<select id="en-skill">${skillOptions}</select>`)}
      </div>
      ${selText('en-name', 'Name', enc.name, "Individual's name (1 ship only)")}
      ${selText('en-team', 'Team / Wing', enc.team, "Wing name (blank = random)")}
      ${selText('en-cargo', 'Cargo (JSON)', enc.cargo, '{"grain":400,"iron":20}', 'Must be valid JSON object.')}
      ${selText('en-comms', 'Opening hail', enc.comms, 'Identify yourself.')}
      ${selCk('en-nemesis', 'Nemesis', enc.nemesis)}
      <div class="prop-row">
        ${selText('en-arrival', 'Arrival', enc.arrival, 'e.g. jump-in')}
        ${selText('en-arrmsg', 'Arrival message', enc.arrival_message, 'I shall be victorious')}
      </div>
      <div class="prop-actions">
        <button type="button" class="btn-small danger" data-action="remove-encounter" data-arg="${enc.uid}">Delete Encounter</button>
      </div>`;
  }

  /* ── Reward panel ────────────────────────────────────────── */
  function renderRewardPanel(r) {
    if (!r) return;
    const condDatalist = REWARD_CONDITIONS.map(c => `<option value="${c}">`).join('');
    const factionOptions = factions.map(f =>
      `<option value="${f.name}" ${r.faction === f.name ? 'selected' : ''}>${f.name.charAt(0).toUpperCase() + f.name.slice(1)}</option>`).join('');
    propertyPanel.innerHTML = `
      ${panelHead('Reward', '')}
      ${field('rw-cond', 'Condition', `<input type="text" id="rw-cond" value="${esc(r.condition)}" list="mapRewardConditions"><datalist id="mapRewardConditions">${condDatalist}</datalist>`)}
      ${field('rw-fac', 'Faction', `<select id="rw-fac">${factionOptions}</select>`)}
      <div class="prop-row">
        ${selNum('rw-rep', 'Reputation', r.reputation, '-100 to 100')}
        ${selNum('rw-cred', 'Credits', r.credits)}
      </div>
      ${selText('rw-desc', 'Description', r.description, 'Optional')}
      <div class="prop-actions">
        <button type="button" class="btn-small danger" data-action="remove-reward" data-arg="${r.uid}">Delete Reward</button>
      </div>`;
  }

  /* ── Event panel + SEXP builder ──────────────────────────── */

  // Autocomplete suggestions for SEXP atomic fields, derived from the mission.
  let sexpSuggestions = { target: [], nav: [], component: [], id: [], cargo: [] };

  function computeSexpSuggestions() {
    const navs = state.navPoints.map(n => n.name);
    const callsigns = [];
    state.navPoints.forEach(n => n.encounters.forEach(e => {
      if (e.name) callsigns.push(e.name);
      if (e.team) callsigns.push(e.team);
    }));
    const ships = new Set();
    factions.forEach(f => (f.ships || []).forEach(s => ships.add(s)));
    const target = Array.from(new Set([...navs, ...callsigns, 'enemy_squadron', ...ships])).sort();
    const id = Array.from(new Set([
      ...state.events.map(ev => ev.id).filter(Boolean),
      ...state.objectives.map(o => o.id).filter(Boolean),
      ...navs,
    ])).sort();
    const cargo = ['Life Sign', 'grain', 'iron', 'tungsten', 'ore', 'food', 'water', 'fuel',
      'electronics', 'medicine', 'weapons', 'drugs', 'crystals'];
    return { nav: navs, target, component: COMPONENTS, id, cargo };
  }

  // Quick-condition presets: one-click templates for common SEXP conditions.
  const SEXP_PRESETS = {
    all_enemies: { label: 'All enemies destroyed', make: () => ({ type: 'is-destroyed', target: 'enemy_squadron' }) },
    arrive: { label: 'Player arrives at a nav point', make: s => ({ type: 'has-arrived-at', nav: s.nav[0] || '' }) },
    scan: { label: 'Target scanned', make: () => ({ type: 'is-scanned', target: '' }) },
    turn: { label: 'Reach turn N', make: () => ({ type: 'turn-at-least', value: 5 }) },
    damaged: { label: 'Enemy below X% HP', make: () => ({ type: 'is-damaged', target: '', percent: 50 }) },
    component: { label: 'Component damaged', make: () => ({ type: 'component_damaged', target: '', component: 'life_support', percent: 50 }) },
    tractor: { label: 'Tractored cargo', make: () => ({ type: 'has_tractored', cargo: 'Life Sign' }) },
    other_event: { label: 'Another event fired', make: s => ({ type: 'event-triggered', id: s.id[0] || '' }) },
    and_arrive_scan: { label: 'Arrived at a nav AND scanned', make: s => ({ type: 'and', args: [{ type: 'has-arrived-at', nav: s.nav[0] || '' }, { type: 'is-scanned', target: '' }] }) },
    or_destroy_turn: { label: 'Destroyed OR turn passed', make: () => ({ type: 'or', args: [{ type: 'is-destroyed', target: 'enemy_squadron' }, { type: 'turn-at-least', value: 10 }] }) },
    not_arrive: { label: 'NOT arrived at a nav', make: s => ({ type: 'not', args: [{ type: 'has-arrived-at', nav: s.nav[0] || '' }] }) },
  };

  function sexpDatalistsHtml() {
    const make = (id, arr) => `<datalist id="${id}">${arr.map(v => `<option value="${esc(v)}">`).join('')}</datalist>`;
    return make('sexpNavList', sexpSuggestions.nav)
      + make('sexpTargetList', sexpSuggestions.target)
      + make('sexpComponentList', sexpSuggestions.component)
      + make('sexpEventIdList', sexpSuggestions.id)
      + make('sexpCargoList', sexpSuggestions.cargo);
  }

  // Full event templates: a whole scenario (id + condition + actions) in one click.
  const EVENT_TEMPLATES = {
    arrive_message: {
      label: 'Message when the player arrives',
      build: s => ({ id: 'arrived_msg', condition: { type: 'has-arrived-at', nav: s.nav[0] || '' }, actions: [{ type: 'message', target: 'HQ', text: 'You have arrived.' }] }),
    },
    wing_down_message: {
      label: 'Message when a wing is destroyed',
      build: () => ({ id: 'wing_down_msg', condition: { type: 'is-destroyed', target: '' }, actions: [{ type: 'message', target: 'HQ', text: 'Wing eliminated.' }] }),
    },
    arrive_ambush: {
      label: 'Spawn an ambush when the player arrives',
      build: s => ({ id: 'ambush', condition: { type: 'has-arrived-at', nav: s.nav[0] || '' }, actions: [
        { type: 'message', target: 'HQ', text: 'Ambush!' },
        { type: 'spawn', target: s.nav[0] || '', encounter: '[{"nb":"3","faction":"kilrathi","ship_type":"Dralthi","pilot":"confident Fair"}]' },
      ] }),
    },
    reveal_after_turn: {
      label: 'Reveal a hidden nav after N turns',
      build: () => ({ id: 'reveal_hidden', condition: { type: 'turn-at-least', value: 5 }, actions: [{ type: 'reveal_nav', target: '' }] }),
    },
    scan_spawn: {
      label: 'Spawn enemies when a target is scanned',
      build: () => ({ id: 'scan_spawn', condition: { type: 'is-scanned', target: '' }, actions: [{ type: 'spawn', target: '', encounter: '[{"nb":"2","faction":"kilrathi","ship_type":"Salthi","pilot":"timid Poor"}]' }] }),
    },
    all_down_message: {
      label: 'Message when all enemies are destroyed',
      build: () => ({ id: 'all_hostiles_down', condition: { type: 'is-destroyed', target: 'enemy_squadron' }, actions: [{ type: 'message', target: 'HQ', text: 'All hostiles destroyed.' }] }),
    },
    scan_then_message: {
      label: 'Message when a target is scanned',
      build: () => ({ id: 'scanned_msg', condition: { type: 'is-scanned', target: '' }, actions: [{ type: 'message', target: 'HQ', text: 'Scan complete.' }] }),
    },
  };

  // Human-readable sentence for a SEXP condition, so the tree is understandable.
  function sexpToPlainText(node) {
    if (typeof node === 'string') return `the event "${node}" has fired`;
    if (!node || typeof node !== 'object') return 'a condition';
    // Canonical logic.py form: {"type": "and"/"or"/"not", "args": [...]}
    if (node.type === 'and') return 'all of: ' + (node.args || []).map(sexpToPlainText).join(' AND ');
    if (node.type === 'or') return 'any of: ' + (node.args || []).map(sexpToPlainText).join(' OR ');
    if (node.type === 'not') return 'NOT (' + sexpToPlainText((node.args || [])[0]) + ')';
    // Legacy shorthand form (still accepted on import)
    if (node.and) return 'all of: ' + node.and.map(sexpToPlainText).join(' AND ');
    if (node.or) return 'any of: ' + node.or.map(sexpToPlainText).join(' OR ');
    if ('not' in node && !node.type) return 'NOT (' + sexpToPlainText(node.not) + ')';
    switch (node.type) {
      case 'turn-at-least': return `turn is at least ${node.value}`;
      case 'turn-less-than': return `turn is before ${node.value}`;
      case 'is-destroyed': return `${node.target || 'the target'} is destroyed`;
      case 'is-damaged': return `${node.target || 'the target'} is at ${node.percent}% HP or below`;
      case 'is-scanned': return `${node.target || 'the target'} has been scanned`;
      case 'component_damaged': return `${node.target || 'the target'}'s ${node.component || 'component'} is at ${node.percent}% or below`;
      case 'has-arrived-at': return `you have arrived at ${node.nav || 'a nav point'}`;
      case 'event-triggered': return `the event "${node.id || ''}" has fired`;
      case 'has_tractored': return node.cargo ? `a tractor has moved ${node.cargo}` : 'a tractor has moved some cargo';
      default: return 'a condition';
    }
  }

  // Keep any open SEXP datalists in sync when the mission changes (e.g. a new
  // nav point is added while the event editor is showing).
  function refreshSexpDatalists() {
    sexpSuggestions = computeSexpSuggestions();
    const sets = { sexpNavList: 'nav', sexpTargetList: 'target', sexpComponentList: 'component', sexpEventIdList: 'id', sexpCargoList: 'cargo' };
    for (const [id, key] of Object.entries(sets)) {
      const dl = document.getElementById(id);
      if (!dl) continue;
      dl.innerHTML = sexpSuggestions[key].map(v => `<option value="${esc(v)}">`).join('');
    }
  }

  function renderEventPanel(ev) {
    if (!ev) { clearSelection(); return; }
    sexpSuggestions = computeSexpSuggestions();
    const presetOptions = Object.entries(SEXP_PRESETS)
      .map(([k, p]) => `<option value="${k}">${p.label}</option>`).join('');
    const templateOptions = Object.entries(EVENT_TEMPLATES)
      .map(([k, t]) => `<option value="${k}">${t.label}</option>`).join('');
    const actionList = ev.actions.map((a, i) => {
      const typeOptions = ACTION_TYPES.map(t => `<option value="${t}" ${a.type === t ? 'selected' : ''}>${t}</option>`).join('');
      return `<div class="sexp-node atomic" style="border-left-color:#ffd75e">
        <div class="sexp-head">
          <select data-action="change" data-evt="${ev.uid}" data-act="${i}" data-field="type" data-save="action-type">${typeOptions}</select>
          <button type="button" class="btn-small danger" data-action="remove-action" data-arg="${ev.uid}:${i}">✕</button>
        </div>
        ${a.type !== 'environment' ? selText(`act-${i}-target`, 'Target', a.target, '', '') : ''}
        ${a.type === 'message' || a.type === 'objective' || a.type === 'music' ? selText(`act-${i}-text`, 'Text', a.text, '') : ''}
        ${a.type === 'spawn' ? field(`act-${i}-enc`, 'Encounter (JSON array)', `<textarea id="act-${i}-enc" placeholder='[{"nb":"3","faction":"kilrathi","ship_type":"Dralthi","pilot":"confident Fair"}]'>${esc(typeof a.encounter === 'string' ? a.encounter : JSON.stringify(a.encounter || [], null, 0))}</textarea>`) : ''}
      </div>`;
    }).join('');

    propertyPanel.innerHTML = `
      ${panelHead('Scripted Event', 'evt-icon')}
      ${selText('ev-id', 'Event ID', ev.id, 'e.g. ambush_spawned', 'Must be unique.')}

      <div class="prop-field">
        <label for="eventTemplate">Common event templates</label>
        <select id="eventTemplate">
          <option value="">— Pick a whole scenario to start from —</option>
          ${templateOptions}
        </select>
        <span class="prop-help">Creates a complete event (trigger + actions) that you just tweak.</span>
      </div>

      <div class="prop-field">
        <label for="sexpPreset">Quick condition presets</label>
        <select id="sexpPreset">
          <option value="">— Insert a common condition —</option>
          ${presetOptions}
        </select>
        <span class="prop-help">Pick a template to fill the condition for you, then tweak the values.</span>
      </div>

      <div class="prop-sublist-title" style="margin-top:8px">Condition (SEXP)</div>
      <div id="sexpSummary" class="sexp-summary"></div>
      <div id="sexpRoot"></div>

      <div class="prop-sublist">
        <div class="prop-sublist-title">Actions (${ev.actions.length})</div>
        ${actionList || '<div style="opacity:.6;font-size:.78rem">No actions.</div>'}
        <div class="prop-actions">
          <button type="button" class="btn-small" data-action="add-action" data-arg="${ev.uid}">+ Add Action</button>
        </div>
      </div>

      <div class="prop-actions">
        <button type="button" class="btn-small danger" data-action="remove-event" data-arg="${ev.uid}">Delete Event</button>
      </div>
      ${sexpDatalistsHtml()}`;

    document.getElementById('sexpSummary').textContent = 'Fires when: ' + sexpToPlainText(ev.condition);

    const root = document.getElementById('sexpRoot');
    root.appendChild(buildSexpNode(ev, ev.condition, 'root'));
  }

  function buildSexpNode(ev, node, path) {
    const div = document.createElement('div');
    div.className = 'sexp-node';
    const logical = isLogical(node);

    const kindSelect = document.createElement('select');
    kindSelect.dataset.arg = `${ev.uid}::${path}`;
    const currentKind = logical ? getLogicalKind(node) : (node && node.type);
    [['and', 'AND'], ['or', 'OR'], ['not', 'NOT']].forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      if (v === currentKind) o.selected = true;
      kindSelect.appendChild(o);
    });
    SEXP_ATOMIC_ORDER.forEach(k => {
      const o = document.createElement('option');
      o.value = k; o.textContent = SEXP_ATOMIC_LABELS[k];
      if (k === currentKind) o.selected = true;
      kindSelect.appendChild(o);
    });

    div.classList.add(logical ? 'logical' : 'atomic');

    kindSelect.addEventListener('change', () => {
      changeSexpKind(ev, path, kindSelect.value);
    });

    const head = document.createElement('div');
    head.className = 'sexp-head';
    head.appendChild(kindSelect);

    if (path !== 'root') {
      const rem = document.createElement('button');
      rem.type = 'button';
      rem.className = 'btn-small danger';
      rem.textContent = '✕';
      rem.dataset.action = 'sexp-remove-child';
      rem.dataset.arg = `${ev.uid}::${path}`;
      rem.addEventListener('click', () => removeSexpChild(ev, path));
      head.appendChild(rem);
    }
    div.appendChild(head);

    if (logical) {
      const childrenBox = document.createElement('div');
      childrenBox.className = 'sexp-children';
      const kids = getLogicalChildren(node);
      (kids || []).forEach((child, i) => {
        childrenBox.appendChild(buildSexpNode(ev, child, path === 'root' ? `${i}` : `${path}.${i}`));
      });
      div.appendChild(childrenBox);
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn-small';
      addBtn.textContent = '+ condition';
      addBtn.dataset.action = 'sexp-add-child';
      addBtn.dataset.arg = `${ev.uid}::${path}`;
      addBtn.addEventListener('click', () => { addSexpChild(ev, path); });
      childrenBox.appendChild(addBtn);
    } else {
      // Atomic fields
      const nodeObj = node || { type: kindSelect.value };
      (SEXP_ATOMIC[nodeObj.type] || ['target']).forEach(fname => {
        const w = document.createElement('div');
        w.className = 'sexp-field';
        const lab = document.createElement('label');
        lab.textContent = fname;
        w.appendChild(lab);
        const val = nodeObj[fname] != null ? nodeObj[fname] : '';
        if (fname === 'component') {
          const s = document.createElement('select');
          COMPONENTS.forEach(c => {
            const o = document.createElement('option');
            o.value = c; o.textContent = c;
            if (c === val) o.selected = true;
            s.appendChild(o);
          });
          s.addEventListener('change', () => { nodeObj.component = s.value; });
          w.appendChild(s);
        } else if (fname === 'nav') {
          // Text input with autocomplete from the mission's nav points.
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.value = val;
          inp.setAttribute('list', 'sexpNavList');
          inp.setAttribute('autocomplete', 'off');
          inp.placeholder = '— pick nav —';
          inp.addEventListener('input', () => { nodeObj.nav = inp.value; });
          w.appendChild(inp);
        } else {
          const inp = document.createElement('input');
          inp.type = (fname === 'value' || fname === 'percent') ? 'number' : 'text';
          inp.value = val;
          // Autocomplete assistance for the common free-text fields.
          const listId = { target: 'sexpTargetList', nav: 'sexpNavList', cargo: 'sexpCargoList', id: 'sexpEventIdList' }[fname];
          if (listId) inp.setAttribute('list', listId);
          inp.setAttribute('autocomplete', 'off');
          inp.addEventListener('input', () => {
            if (fname === 'value' || fname === 'percent') nodeObj[fname] = parseInt(inp.value, 10) || 0;
            else nodeObj[fname] = inp.value;
          });
          w.appendChild(inp);
        }
        div.appendChild(w);
      });
    }
    return div;
  }

  function isLogical(node) {
    if (!node || typeof node !== 'object') return false;
    // Canonical: {"type":"and"/"or"/"not","args":[...]}; legacy shorthand: {"and":[...]} etc.
    if (node.type === 'and' || node.type === 'or' || node.type === 'not') return true;
    return !node.type && (node.and || node.or || 'not' in node);
  }
  function getLogicalKind(node) {
    if (node && (node.and || node.type === 'and')) return 'and';
    if (node && (node.or || node.type === 'or')) return 'or';
    return 'not';
  }
  // Children of a logical node, for either the canonical args form or the legacy shorthand.
  function getLogicalChildren(node) {
    if (node.type) return node.args || [];
    const kind = getLogicalKind(node);
    if (kind === 'not') return 'not' in node ? [node.not] : [];
    return node[kind] || [];
  }
  function defaultSexp() { return { type: 'is-destroyed', target: '' }; }

  // Convert the legacy shorthand logical form ({"and":[...]}, {"or":[...]},
  // {"not": ...}) into logic.py's canonical {"type":..., "args":[...]} form,
  // recursively. Atomic conditions and strings pass through unchanged.
  function normalizeSexp(node) {
    if (Array.isArray(node)) return node.map(normalizeSexp);
    if (node && typeof node === 'object') {
      const out = {};
      for (const k of Object.keys(node)) out[k] = normalizeSexp(node[k]);
      if (out.and && !out.type) return { type: 'and', args: out.and };
      if (out.or && !out.type) return { type: 'or', args: out.or };
      if ('not' in out && !out.type) return { type: 'not', args: [out.not] };
      return out;
    }
    return node;
  }

  function changeSexpKind(ev, path, newKind) {
    const old = getNodeAtPath(ev.condition, path) || ev.condition;
    const replacement = rebuildSexpKind(old, newKind);
    if (path === 'root') {
      ev.condition = replacement;
    } else {
      const parts = path.split('.').map(Number);
      const parent = getNodeAtPath(ev.condition, parts.slice(0, -1).join('.'));
      const i = parts[parts.length - 1];
      if (!parent) return;
      setSexpChild(parent, i, replacement);
    }
    renderPanel();
  }

  function rebuildSexpKind(node, newKind) {
    if (newKind === 'and' || newKind === 'or' || newKind === 'not') {
      // logic.py's canonical form: {"type": ..., "args": [...]}
      return { type: newKind, args: [isLogical(node) ? node : defaultSexp()] };
    }
    const n = { type: newKind };
    SEXP_ATOMIC[newKind].forEach(f => { n[f] = f === 'percent' ? 50 : (f === 'value' ? 1 : ''); });
    return n;
  }

  // Replace the child at index i of a logical parent (canonical or shorthand).
  function setSexpChild(parent, i, replacement) {
    const kind = getLogicalKind(parent);
    if (parent.type) {
      parent.args[i] = replacement;
    } else if (kind === 'not') {
      parent.not = replacement;
    } else {
      parent[kind][i] = replacement;
    }
  }

  function appendSexpChild(node) {
    if (!isLogical(node)) return;
    const kind = getLogicalKind(node);
    if (node.type) {
      (node.args = node.args || []).push(defaultSexp());
    } else if (kind === 'not') {
      node.not = defaultSexp();
    } else {
      (node[kind] = node[kind] || []).push(defaultSexp());
    }
  }
  function addSexpChild(ev, path) {
    const target = getNodeAtPath(ev.condition, path);
    if (target) { appendSexpChild(target); renderPanel(); }
  }
  function removeSexpChild(ev, path) {
    const parts = path.split('.').map(Number);
    const parent = getNodeAtPath(ev.condition, parts.slice(0, -1).join('.'));
    if (!parent) return;
    const i = parts[parts.length - 1];
    if (parent.type) {
      parent.args.splice(i, 1);
    } else {
      const kind = getLogicalKind(parent);
      if (kind === 'not') parent.not = defaultSexp();
      else parent[kind].splice(i, 1);
    }
    renderPanel();
  }
  function getNodeAtPath(node, path) {
    if (!path || path === 'root') return node;
    return path.split('.').reduce((cur, seg) => {
      if (!cur) return null;
      const i = parseInt(seg, 10);
      if (!isLogical(cur)) return null;
      return getLogicalChildren(cur)[i];
    }, node);
  }

  /* ── Panel change / input handlers ───────────────────────── */
  function handlePanelChange(e) {
    const el = e.target;
    const id = el.id;
    const sel = state.selected;
    if (!sel) return;
    scheduleSave();

    if (sel.kind === 'nav') {
      const nav = navByUid(sel.uid);
      if (!nav) return;
      if (id === 'np-env') { nav.env = el.value; }
      else if (id === 'np-hidden') { nav.hidden = el.checked; renderMap(); }
      else if (id === 'np-asteroids') { nav.asteroids = el.checked; renderMap(); }
      else if (id === 'np-jump') { nav.jump = el.checked; renderMap(); renderPanel(); }
    } else if (sel.kind === 'objective') {
      const obj = objByUid(sel.uid);
      if (!obj) return;
      if (id === 'ob-type') {
        obj.type = el.value;
        if (obj.type === 'navigate') {
          // auto-target the first nav it's attached to
          const n = state.navPoints.find(np => np.objectiveUids.includes(obj.uid));
          if (n) obj.target = n.name;
        }
        renderPanel();
      } else if (id === 'ob-required') obj.required = el.checked;
      else if (id === 'ob-hidden') obj.hidden = el.checked;
    } else if (sel.kind === 'encounter') {
      const found = findEncounter(sel.uid);
      if (!found) return;
      const { enc } = found;
      if (id === 'en-faction') {
        enc.faction = el.value;
        const ships = (factions.find(f => f.name === enc.faction) || {}).ships || [];
        enc.ship_type = ships[0] || '';
        renderPanel();
      } else if (id === 'en-agg') enc.aggression = el.value;
      else if (id === 'en-skill') enc.skill = el.value;
      else if (id === 'en-nemesis') enc.nemesis = el.checked;
    } else if (sel.kind === 'event') {
      const ev = evtByUid(sel.uid);
      if (!ev) return;
      if (id === 'eventTemplate') {
        const key = el.value;
        if (key && EVENT_TEMPLATES[key]) {
          const t = EVENT_TEMPLATES[key].build(sexpSuggestions);
          ev.condition = t.condition;
          ev.actions = t.actions;
          if (!ev.id) ev.id = t.id;
          renderPanel();
        }
        return;
      }
      if (id === 'sexpPreset') {
        const key = el.value;
        if (key && SEXP_PRESETS[key]) {
          ev.condition = SEXP_PRESETS[key].make(sexpSuggestions);
          renderPanel();
        }
        return;
      }
      const typeEl = el.matches('[data-save="action-type"]');
      if (typeEl) {
        const i = parseInt(typeEl.dataset.act, 10);
        ev.actions[i].type = typeEl.value;
        renderPanel();
      }
    } else if (sel.kind === 'reward') {
      const r = rewardByUid(sel.uid);
      if (!r) return;
      if (id === 'rw-fac') r.faction = el.value;
    }
  }

  function handlePanelInput(e) {
    const el = e.target;
    const id = el.id;
    const sel = state.selected;
    if (!sel) return;
    scheduleSave();

    if (sel.kind === 'nav') {
      const nav = navByUid(sel.uid);
      if (!nav) return;
      if (id === 'np-name') { nav.name = el.value; renderMap(); }
      else if (id === 'np-descr') nav.descr = el.value;
      else if (id === 'np-x') nav.x = parseInt(el.value, 10) || 0;
      else if (id === 'np-y') nav.y = parseInt(el.value, 10) || 0;
      else if (id === 'np-dest') nav.dest = el.value;
    } else if (sel.kind === 'objective') {
      const obj = objByUid(sel.uid);
      if (!obj) return;
      if (id === 'ob-id') obj.id = el.value;
      else if (id === 'ob-target') obj.target = el.value;
      else if (id === 'ob-rc') obj.reward_conditions = el.value.split(',').map(s => s.trim()).filter(Boolean);
      else if (id === 'ob-desc') obj.description = el.value;
    } else if (sel.kind === 'encounter') {
      const found = findEncounter(sel.uid);
      if (!found) return;
      const { enc } = found;
      if (id === 'en-nb') enc.nb = parseInt(el.value, 10) || 1;
      else if (id === 'en-ship') enc.ship_type = el.value;
      else if (id === 'en-prob') enc.probability = parseInt(el.value, 10) || 0;
      else if (id === 'en-name') enc.name = el.value;
      else if (id === 'en-team') enc.team = el.value;
      else if (id === 'en-cargo') enc.cargo = el.value;
      else if (id === 'en-comms') enc.comms = el.value;
      else if (id === 'en-arrival') enc.arrival = el.value;
      else if (id === 'en-arrmsg') enc.arrival_message = el.value;
    } else if (sel.kind === 'event') {
      const ev = evtByUid(sel.uid);
      if (!ev) return;
      if (id === 'ev-id') ev.id = el.value;
      else if (id.startsWith('act-')) {
        const m = id.match(/^act-(\d+)-(.+)$/);
        if (m) {
          const i = parseInt(m[1], 10);
          const fld = m[2];
          if (fld === 'target') ev.actions[i].target = el.value;
          else if (fld === 'text') ev.actions[i].text = el.value;
          else if (fld === 'enc') ev.actions[i].encounter = el.value;
        }
      }
    } else if (sel.kind === 'reward') {
      const r = rewardByUid(sel.uid);
      if (!r) return;
      if (id === 'rw-cond') r.condition = el.value;
      else if (id === 'rw-rep') r.reputation = parseInt(el.value, 10) || 0;
      else if (id === 'rw-cred') r.credits = parseInt(el.value, 10) || 0;
      else if (id === 'rw-desc') r.description = el.value;
    }
  }

  /* ── Build mission JSON ──────────────────────────────────── */
  function buildMission() {
    const meta = state.meta;
    const mission = {};
    if (meta.missionName) mission.name = meta.missionName;
    if (meta.missionSystem) mission.system = meta.missionSystem;
    if (meta.missionLocation) mission.location = meta.missionLocation;
    if (meta.missionTimeLimit) mission.time_limit = parseInt(meta.missionTimeLimit, 10) || 0;
    if (meta.barter_on_end) mission.barter_on_end = true;

    const objectives = state.objectives
      .filter(o => o.id && o.type && o.target !== undefined)
      .map(o => ({
        id: o.id, type: o.type, target: o.target,
        required: !!o.required,
        ...(o.hidden && { hidden: true }),
        ...(o.reward_conditions.length && { reward_conditions: o.reward_conditions }),
        ...(o.description ? { description: o.description } : {}),
      }));
    if (objectives.length) mission.objectives = objectives;

    const rewards = state.rewards
      .filter(r => r.condition && r.faction)
      .map(r => ({
        condition: r.condition, faction: r.faction,
        reputation: r.reputation || 0, credits: r.credits || 0,
        ...(r.description ? { description: r.description } : {}),
      }));
    if (rewards.length) mission.rewards = rewards;

    const events = state.events
      .filter(ev => ev.id)
      .map(ev => ({
        id: ev.id,
        condition: ev.condition,
        actions: ev.actions.map(a => {
          const action = { type: a.type };
          if (a.target) action.target = a.target;
          if (a.text) action.text = a.text;
          if (a.type === 'spawn' && a.encounter) {
            action.encounter = parseEncounterJson(a.encounter);
          }
          return action;
        }),
      }));
    if (events.length) mission.events = events;

    const nav_points = {};
    state.navPoints.forEach(nav => {
      const objRefs = nav.objectiveUids
        .map(u => { const o = objByUid(u); return o ? o.id : null; })
        .filter(Boolean);
      const np = {
        descr: nav.descr || '',
        x: Math.round(nav.x),
        y: Math.round(nav.y),
        ...(envChoices[nav.env] ? { environment: envChoices[nav.env] } : {}),
        ...(objRefs.length && { objectives: objRefs }),
        ...(nav.hidden && { hidden: true }),
        ...(nav.asteroids && { asteroids: true }),
        ...(nav.jump && nav.dest ? { dest: nav.dest } : {}),
        encounters: [nav.encounters.map(enc => buildEncounter(enc))],
      };
      nav_points[nav.name] = np;
    });
    mission.nav_points = nav_points;
    return { mission };
  }

  function buildEncounter(enc) {
    const cargo = parseCargo(enc.cargo);
    return {
      nb: String(enc.nb || 1),
      faction: enc.faction,
      ship_type: enc.ship_type,
      pilot: `${enc.aggression || 'confident'} ${enc.skill || 'Fair'}`.trim(),
      probability: String(enc.probability || 100),
      ...(enc.name && { name: enc.name }),
      ...(enc.team && { team: enc.team }),
      ...(cargo && { cargo }),
      ...(enc.nemesis && { nemesis: true }),
      ...(enc.arrival && { arrival: enc.arrival }),
      ...(enc.arrival_message && { arrival_message: enc.arrival_message }),
      ...(enc.comms && { comms: enc.comms }),
    };
  }

  function parseCargo(str) {
    if (!str) return null;
    try { const v = JSON.parse(str); return v && typeof v === 'object' ? v : null; }
    catch (e) { return null; }
  }
  function parseEncounterJson(str) {
    if (!str) return [];
    try { const v = JSON.parse(str); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }

  /* ── Validation ──────────────────────────────────────────── */
  function validateMission(m) {
    const errors = [];
    if (!m || typeof m !== 'object') return ['Missing mission object.'];
    if (!m.nav_points || Object.keys(m.nav_points).length === 0) errors.push('No nav points defined — drop a Nav Point on the map.');
    Object.entries(m.nav_points || {}).forEach(([k, v]) => {
      if (!v || typeof v !== 'object') { errors.push(`Nav "${k}" is not an object.`); return; }
      if (!v.descr) errors.push(`Nav "${k}": missing "descr".`);
      if (!Array.isArray(v.encounters)) errors.push(`Nav "${k}": missing "encounters" array.`);
    });
    (m.objectives || []).forEach(o => {
      if (!o.id || !o.type || !o.target || typeof o.required !== 'boolean') {
        errors.push(`Objective "${o.id || '?'}": needs id, type, target and boolean required.`);
      }
    });
    (m.rewards || []).forEach(r => {
      if (!r.condition || !r.faction || typeof r.reputation !== 'number' || typeof r.credits !== 'number') {
        errors.push(`Reward "${r.condition || '?'}": needs condition, faction, reputation, credits.`);
      }
    });
    (m.events || []).forEach(ev => {
      if (!ev.id) errors.push('Event missing id.');
      if (ev.condition === undefined || ev.condition === null) errors.push(`Event "${ev.id}": missing condition.`);
      if (!Array.isArray(ev.actions) || ev.actions.length === 0) errors.push(`Event "${ev.id}": needs at least one action.`);
    });
    return errors;
  }

  /* ── Export ──────────────────────────────────────────────── */
  function doExport() {
    const m = buildMission();
    const errors = validateMission(m.mission);
    jsonPreview.textContent = JSON.stringify(m, null, 2);
    if (errors.length === 0) {
      validationResult.textContent = '✓ Valid against mission.schema.json requirements.';
      validationResult.className = 'validation-result ok';
    } else {
      validationResult.textContent = '⚠ Issues:\n' + errors.join('\n');
      validationResult.className = 'validation-result error';
    }
    return m;
  }

  function copyJson() {
    const m = buildMission();
    const text = JSON.stringify(m, null, 2);
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(() => setStatus('Copied JSON to clipboard.'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
        setStatus('Copied JSON to clipboard.');
      });
  }

  function downloadMission() {
    const m = buildMission();
    const minified = JSON.stringify(m);
    const base64 = btoa(unescape(encodeURIComponent(minified)));
    const name = (m.mission.name || 'mission').replace(/[^a-zA-Z0-9_-]/g, '_');
    const blob = new Blob([base64], { type: 'application/base64EncodedJson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.mission';
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${name}.mission`);
  }

  /* ── Import ──────────────────────────────────────────────── */
  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let text = reader.result;
      // .mission files are base64; try to decode
      let data = text.trim();
      try { data = JSON.parse(data); }
      catch (err) {
        try {
          const decoded = decodeURIComponent(escape(atob(data.trim())));
          data = JSON.parse(decoded);
        } catch (err2) {
          setStatus('⚠ Could not parse file as JSON or base64.');
          return;
        }
      }
      importMission(data);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function importMission(data) {
    const m = data.mission || data;
    if (!m || !m.nav_points) { setStatus('⚠ Imported data has no mission.nav_points.'); return; }

    // Reset state
    state.navPoints = []; state.objectives = []; state.events = []; state.rewards = [];

    // meta
    state.meta.missionName = m.name || '';
    state.meta.missionSystem = m.system || '';
    state.meta.missionLocation = m.location || '';
    state.meta.missionTimeLimit = m.time_limit || '';
    state.meta.barter_on_end = !!m.barter_on_end;
    document.getElementById('missionName').value = state.meta.missionName;
    document.getElementById('missionSystem').value = state.meta.missionSystem;
    document.getElementById('missionLocation').value = state.meta.missionLocation;
    document.getElementById('missionTimeLimit').value = state.meta.missionTimeLimit;
    document.getElementById('missionBarter').checked = state.meta.barter_on_end;

    // objectives (collect globally, referenced by id)
    const objIdToUid = {};
    (m.objectives || []).forEach(o => {
      const obj = {
        uid: uid(), id: o.id, type: o.type, target: o.target,
        required: !!o.required, hidden: !!o.hidden,
        reward_conditions: o.reward_conditions || [], description: o.description || '',
      };
      state.objectives.push(obj);
      objIdToUid[o.id] = obj.uid;
    });

    // nav points — use their stored x/y coordinates when present, otherwise lay
    // them out on a circle.
    const names = Object.keys(m.nav_points);
    names.forEach((name, i) => {
      const raw = m.nav_points[name];
      const hasCoords = Number.isFinite(Number(raw && raw.x)) && Number.isFinite(Number(raw && raw.y));
      const angle = (i / Math.max(1, names.length)) * 2 * Math.PI;
      const r = 250;
      const nav = {
        uid: uid(), name,
        x: hasCoords ? clamp(Math.round(Number(raw.x)), 30, MAP_W - 30) : Math.round(MAP_W / 2 + r * Math.cos(angle)),
        y: hasCoords ? clamp(Math.round(Number(raw.y)), 30, MAP_H - 30) : Math.round(MAP_H / 2 + r * Math.sin(angle)),
        descr: raw.descr || '', env: detectEnv(raw.environment),
        hidden: !!raw.hidden, asteroids: !!raw.asteroids,
        jump: !!raw.dest, dest: raw.dest || '',
        objectiveUids: [], encounters: [],
      };
      (raw.objectives || []).forEach(oid => {
        if (objIdToUid[oid]) nav.objectiveUids.push(objIdToUid[oid]);
      });
      (raw.encounters || []).forEach(wave => {
        (wave || []).forEach(u => nav.encounters.push(importEncounter(u)));
      });
      state.navPoints.push(nav);
    });

    // events
    (m.events || []).forEach(ev => {
      const actions = (ev.actions || []).map(a => ({
        type: a.type,
        target: a.target || '',
        text: a.text || '',
        encounter: a.type === 'spawn' ? (Array.isArray(a.encounter) ? JSON.stringify(a.encounter) : (a.encounter || '')) : '',
      }));
      state.events.push({ uid: uid(), id: ev.id, condition: normalizeSexp(ev.condition) || { type: 'event-triggered', id: '' }, actions });
    });

    // rewards
    (m.rewards || []).forEach(r => {
      state.rewards.push({ uid: uid(), condition: r.condition, faction: r.faction, reputation: r.reputation, credits: r.credits, description: r.description || '' });
    });

    clearSelection();
    renderMap();
    setStatus(`Imported ${state.navPoints.length} nav point(s) from JSON.`);
  }

  function importEncounter(u) {
    const pilot = u.pilot || '';
    const parts = pilot.split(/\s+/);
    return {
      uid: uid(), nb: u.nb || 1, faction: u.faction || 'kilrathi', ship_type: u.ship_type || '',
      aggression: parts[0] || 'confident', skill: parts.slice(1).join(' ') || 'Fair',
      probability: u.probability || 100,
      name: u.name || '', team: u.team || '',
      cargo: u.cargo ? JSON.stringify(u.cargo) : '',
      comms: u.comms || '', nemesis: !!u.nemesis,
      arrival: u.arrival || '', arrival_message: u.arrival_message || '',
    };
  }

  function detectEnv(env) {
    if (typeof env === 'string') return env;
    if (env && typeof env === 'object') {
      for (const key of ENVIRONMENTS) {
        if (envChoices[key] && JSON.stringify(envChoices[key]) === JSON.stringify(env)) return key;
      }
      if (env.name) {
        const low = env.name.toLowerCase();
        const found = ENVIRONMENTS.find(k => low.includes(k.split(' ')[0]) || k.includes(low));
        if (found) return found;
      }
    }
    return 'space';
  }
})();
