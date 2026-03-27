# Gemini Sector Hub

This repository contains the Gemini Sector Hub, a companion website and set of tools for the "Gemini Sector" space combat game (inspired by Wing Commander).

## Project Overview

The project is a static website serving as a central hub for game resources, including character/mission generators, command manuals, and ship databases.

## Foundational Mandates

- **Aesthetic:** Maintain a "Wing Commander" retro-space aesthetic.
- **Dependencies:** Prioritize Vanilla JavaScript for frontend functionality. Avoid adding heavy frameworks unless necessary.
- **Data-Driven:** Most content (manuals, ship stats, mission parameters) is stored in JSON or SQLite and rendered dynamically.

## Architecture & Key Components

### 1. Frontend Hub
- `index.html`: The main entry point with a card-based navigation grid.
- `styles.css`: Central styling, maintaining the dark space theme.
- `game.js`: A simple canvas-based mini-game featured on the home page.
- `footer.js`: Injected footer across all pages.

### 2. Manuals & Documentation (`/man`)
- Manuals are managed via a Markdown -> JSON -> HTML pipeline.
- **Workflow:**
  1. Edit `commands.md` or `gm.md`.
  2. Run `python3 update_commands.py` to synchronize examples and data into `commands.json`.
  3. `common.js` fetches `commands.json` to render searchable command cards in `commands.html` and `gm.html`.

### 3. Mission Generator & MCP (`/mission`)
- Includes an interactive web generator (`generator.js`) and a Model Context Protocol (MCP) server.
- **MCP Server:** `gemini-mission-mcp-server.js` allows LLMs (like Claude) to generate game-compatible missions.
- **Data:** `factions.json` and `environments.json` define the available entities and locations.

### 4. Ships & Weapons (`/ships`)
- Data is stored in `ships_and_weapons.db` (SQLite).
- Ship VDU (Visual Display Unit) images are located in `ships/img/vdu/`.

### 5. Character & Nomad Virtues
- `/character`: Character generation logic.
- `/nomad_virtues`: Resources related to the "Nomad Virtues" game mechanic, driven by `virtues.json`.

## Development Workflows

### Updating Commands
When asked to update or add commands:
1. Modify the relevant `.md` file in `/man`.
2. Run the update scripts:
   ```bash
   python3 man/update_commands.py
   python3 man/update_params.py
   ```
3. Verify the changes by checking `man/commands.json`.

### Working with the Mission Generator
- If modifying mission logic, ensure consistency between `generator.js` (web) and `gemini-mission-mcp-server.js` (MCP).
- New ship types or factions should be added to `factions.json`.

### Static Assets
- Always use the `image-hover.js` convention for interactive cards on the home page:
  ```html
  <a href="..." class="card" onmouseover="changeImage('imgID', 'over.png')" onmouseout="changeImage('imgID', 'base.png')">
  ```

## Contextual Precedence
This `GEMINI.md` file serves as the primary guide for Gemini CLI. Adhere to these patterns and workflows for all tasks within this repository.
