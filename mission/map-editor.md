# Gemini Sector Mission Map Editor

A **drag-and-drop** mission generator for Gemini Sector. Instead of filling in
forms (as in `index.html` / `generator.js`), you place **nav points** and
**mission items** directly on a 2D map, attach encounters/objectives/events to
them, and export a mission file that validates against `mission.schema.json`.

Open **`map-editor.html`** in a browser (serve the repo root so `../header.js`
and `../styles.css` resolve — e.g. `python3 -m http.server` at the repo root and
visit `/mission/map-editor.html`).

---

## Layout

| Zone | Purpose |
|------|---------|
| Toolbar (top) | Mission name, system, location, time limit, barter flag, plus **Add Nav Point / Import / Export**. |
| Palette (left) | Drag sources: **Nav Point**, **Objective**, **Encounter**, **Event**, plus the **trash** well. |
| Map (centre) | 2D space canvas. Nav points are draggable markers. |
| Property panel (right) | Edit whatever is currently selected. Shows an overview list of all nav points / objectives / events / rewards when nothing is selected. |
| Output (bottom) | Live JSON preview, validation result, and download/copy controls. |

---

## Drag and drop

- **Nav Point → map**: drop anywhere on the canvas to create a nav point. The
  first one is named `Home: base`; later ones auto-number (`Nav 1`, `Nav 2`, …).
- **Objective → map / marker**: drop on a nav marker to attach the objective to
  it. A `navigate` objective automatically targets that nav point.
- **Encounter → marker**: drop on a nav marker to add a ship encounter there.
- **Event → map**: drop anywhere to create a scripted (SEXP) event.
- **Marker → anywhere**: drag an existing marker to reposition it (snaps to a
  grid).
- **Marker → trash well**: drag a marker into the trash to delete it (confirm
  prompt).
- **Click** any item (map marker, or a row in the overview/property lists) to
  edit it.

### Nav point icons

Each nav point marker conveys its type and flags at a glance:

- **Home base** — hollow white triangle pointing up (transparent fill).
- **Normal nav point** — green-bordered square (transparent fill).
- **Jump point** — blue circle.
- **Asteroid field** — a large grey dashed ring around the marker.
- **Hidden nav point** — greyed out.

Encounter **ship type** is a free-text field (suggestions come from the selected
faction's ships, but you can type any ship name). The **arrival** and
**arrival message** fields sit side by side, with a greyed-out example on the
message field.

Each exported nav point also carries its map **`x` / `y`** coordinates (rounded
to pixels) — not part of `mission.schema.json`, but included so positions
survive an import/export round-trip.

## Draft persistence & cookies

Your work is **auto-saved** and restored on your next visit:

- The whole mission draft is written to a **cookie** (`gemini_mission_draft`,
  30-day expiry) shortly after you make a change. If the draft is too large for a
  cookie, it falls back to **local storage**. Everything is stored only in your
  browser — nothing is sent to a server.
- On load, a saved draft is restored automatically. Use the **Clear draft**
  toolbar button to delete it and start fresh.
- A **cookie notice** banner appears on first visit; clicking **Got it** stores a
  preference cookie so it won't show again.

---

## Editors

- **Nav Point** — name, description, environment (from `environments.json`),
  hidden / asteroids / jump-destination flags, X/Y position, attached objectives
  and encounters.
- **Objective** — id, type (destroy / scan / escort / defend / navigate /
  capture / has_tractored), target, required, hidden, reward conditions,
  description. `navigate` auto-targets its nav point.
- **Encounter** — number of ships, faction (from `factions.json`), ship type
  (filtered by faction), aggression + skill (combined into the `pilot` string),
  probability, name, team, cargo (JSON), opening hail, nemesis, arrival.
- **Event** — id, a **SEXP condition tree**, and a list of actions (message /
  spawn / objective / music / environment / reveal_nav).

### SEXP condition builder

Conditions are built from the operators documented in `SEXPS.md`:

- **Logical:** `and`, `or`, `not` (nested conditions).
- **Turn:** `turn-at-least`, `turn-less-than`.
- **Combat:** `is-destroyed`, `is-damaged`, `is-scanned`, `component_damaged`,
  `has_tractored`.
- **Navigation:** `has-arrived-at` (pick a placed nav point).
- **Event:** `event-triggered` (pick an event id).

Use the kind dropdown on a node to switch between logical and atomic operators,
the **+ condition** button to add children to a logical node, and **✕** to
remove a child.

**Assistance built in:**

- **Quick condition presets** — a dropdown above the condition tree inserts a
  complete, common condition for you (all enemies destroyed, arrive at a nav,
  target scanned, reach turn N, enemy below X% HP, component damaged, tractored
  cargo, another event fired, and combined AND / OR / NOT examples). Pick one and
  just tweak the values.
- **Autocomplete suggestions** — the condition's free-text fields (target, nav,
  cargo, event id) and the **Objective → Target** field offer suggestions drawn
  from the mission itself: your nav-point names, encounter callsigns/teams,
  faction ship types, components, and existing event/objective ids.

---

## Export

- **Preview JSON / Export** — validates the mission against the schema rules and
  shows any issues (missing `descr`, `encounters`, required objective/reward
  fields, etc.).
- **Download .mission** — base64-encoded mission file (same format as
  `generator.js`) named `<mission-name>.mission`.
- **Copy JSON** — copies the pretty-printed JSON to the clipboard.
- **Import JSON** — load an existing mission JSON (or base64 `.mission`) to edit
  it visually; nav points are laid out in a ring.

---

## Files

- `map-editor.html` — the page.
- `map-editor.css` — scoped styling.
- `map-editor.js` — all logic (drag/drop, state, editors, SEXP builder,
  validation, import/export).

The existing form-based generator (`index.html` + `generator.js`) is untouched.
