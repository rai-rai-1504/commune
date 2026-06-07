
# 🏙️ Commune — Collaborative 3D City Builder

> Build together. Govern together. Grow together.

A real-time collaborative city building platform where multiple players design 3D buildings, zone land, plan infrastructure, and vote on civic decisions — all simultaneously in the browser.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Three.js, Zustand |
| Backend | Node.js, Express, WebSocket (ws) |
| Real-time sync | CRDT (LWW registers + vector clocks) |
| Styling | Pure CSS custom properties |
| State | Zustand (client), in-memory (server) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Quick Start
```bash
# Clone / unzip the project
cd commune

# Start everything
chmod +x start.sh
./start.sh
```

Or manually:
```bash
# Terminal 1 — Server
cd server
npm install
node server.js   # runs on :4000

# Terminal 2 — Client
cd client
npm install
npm start        # runs on :3000
```

Open **http://localhost:3000** in multiple browser tabs to test real-time collaboration.

---

## Modules

### 🏙️ City Module
- **Zoning**: Paint residential, commercial, industrial, green space, and civic zones on a 20×20 grid
- **Roads**: Lay road networks across the city
- **Placed Assets**: Buildings published from the 3D editor appear here as interactive landmarks
- **Street View**: First-person Three.js walkthrough of the city you've built (WASD to move, drag to look)
- **Live simulation**: Population, happiness, treasury, and traffic update every 5 seconds based on your zoning decisions
- **Multi-user painting**: All players see each other's zone changes in real time

### ✏️ 3D Editor Module
- **6 geometry types**: Box, Sphere, Cylinder, Cone, Torus, Wedge
- **8 prebuilt templates**: House, Skyscraper, Office Block, Factory, Park, Town Hall, Apartment, Metro Station
- **CRDT sync**: Concurrent edits from multiple players merge deterministically
- **Transform controls**: Position (Arrow keys / drag), Rotation (Q/E), Scale (W/S), Elevation (F/V)
- **Property panel**: Live numeric editing of all transform values
- **Colour picker**: Full colour wheel + 12 preset swatches
- **Publish to City**: Send your scene as a building asset to the City module
- **Undo stack** (⌘Z), Duplicate (⌘D), Delete (Del)

### 🏛️ Governance Module
- **Proposals**: Any player can submit civic proposals — transit, zoning, budget, infrastructure
- **Voting**: For / Against / Abstain — live vote bars with real-time updates
- **Auto-resolution**: Proposals pass or fail automatically when all online players have voted
- **Effects**: Passed proposals modify city treasury and happiness
- **History**: View closed proposals and their outcomes

---

## Architecture

```
commune/
├── server/
│   └── server.js          # Express + WebSocket server, in-memory state
├── client/
│   └── src/
│       ├── store/
│       │   └── useStore.js        # Zustand store — all client state + WS handling
│       ├── components/
│       │   ├── Navbar.jsx          # Navigation + presence avatars
│       │   ├── WelcomeScreen.jsx   # Splash / name entry
│       │   ├── AssetLibrary.jsx    # 8 prebuilt building templates
│       │   ├── ActivityFeed.jsx    # Shared activity log component
│       │   └── Notifications.jsx   # Toast notifications
│       ├── modules/
│       │   ├── city/
│       │   │   └── CityModule.jsx  # Canvas grid + Street View (Three.js)
│       │   ├── editor/
│       │   │   └── EditorModule.jsx # Three.js 3D editor
│       │   └── governance/
│       │       └── GovernanceModule.jsx # Proposals + voting
│       └── App.jsx
└── start.sh
```

### Real-time Protocol (WebSocket messages)

| Message | Direction | Description |
|---------|-----------|-------------|
| `WELCOME` | S→C | Initial state dump on connect |
| `EDITOR_JOIN` | C→S | Join an editor scene |
| `EDITOR_SNAPSHOT` | S→C | Full scene snapshot on join |
| `EDITOR_OP` | C→S | CREATE / UPDATE / DELETE operation |
| `EDITOR_OP_BROADCAST` | S→C | Broadcast op to other clients |
| `CITY_ZONE` | C→S | Zone a cell |
| `CITY_ROAD` | C→S | Add/remove road |
| `CITY_PLACE_ASSET` | C→S | Place editor scene as city asset |
| `CITY_REMOVE_ASSET` | C→S | Remove a placed asset |
| `CITY_STATS_UPDATE` | S→C | Simulation tick results |
| `GOV_CREATE_PROPOSAL` | C→S | Submit new proposal |
| `GOV_VOTE` | C→S | Cast a vote |
| `GOV_VOTE_UPDATE` | S→C | Updated vote tally |
| `GOV_PROPOSAL_RESOLVED` | S→C | Proposal passed / failed |
| `PRESENCE_UPDATE` | S→C | Player list changed |

### CRDT Model
- Each object property is a **Last-Write-Wins (LWW) register**
- Concurrent edits are ordered by **timestamp + clientId tiebreak**
- **Vector clocks** track causal ordering across clients
- Server maintains authoritative scene state, new joiners receive full snapshot

---

## Keyboard Shortcuts (Editor)

| Key | Action |
|-----|--------|
| Arrow keys | Move selected object on X/Z |
| F / V | Move up / down on Y axis |
| Q / E | Rotate on Y axis |
| W / S | Scale up / down uniformly |
| Delete | Remove selected object |
| ⌘D / Ctrl+D | Duplicate selected |
| ⌘Z / Ctrl+Z | Undo |
| RMB / Alt+drag | Orbit camera |
| Scroll | Zoom |

## Street View Controls

| Key | Action |
|-----|--------|
| W / A / S / D | Walk forward / left / back / right |
| Arrow keys | Same as WASD |
| Mouse drag | Look around |

---

## Roadmap (Post-MVP)

- [ ] Persistent database (PostgreSQL via Prisma — schema already designed)
- [ ] Hand gesture controls via MediaPipe (already prototyped in Sculpt 3D)
- [ ] Player roles — Mayor, Architect, Citizen with different permissions  
- [ ] Asset marketplace — publish buildings for other cities to use
- [ ] In-editor collaboration cursors (position broadcast already in server)
- [ ] Mobile support
- [ ] City version history / snapshots
- [ ] Advanced simulation — pollution, commute time, education levels

# commune
Commune is a browser-based, real-time collaborative city-building platform that combines user-generated 3D content, urban simulation, and democratic governance into a single persistent world. Players design buildings and infrastructure using an integrated 3D editor, contribute them to a shared city, and collectively shape urban development.

