import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAVED_CITIES_DIR = path.join(__dirname, 'saved_cities');

// Initialize saved_cities folder
if (!fs.existsSync(SAVED_CITIES_DIR)) {
  fs.mkdirSync(SAVED_CITIES_DIR, { recursive: true });
}

let activeCityName = 'default';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// ── In-memory state ────────────────────────────────────────────────────────

const state = {
  // Editor scenes: sceneId -> { objects: {id: obj}, vectorClock: {} }
  scenes: {},
  // City: single shared city state, loaded from disk or default initialized
  city: null,
  // Governance: proposals list
  proposals: createInitialProposals(),
  // Connected clients: ws -> { id, username, room, color }
  clients: new Map(),
};

function saveCity() {
  try {
    const file = path.join(SAVED_CITIES_DIR, `${activeCityName}.json`);
    fs.writeFileSync(file, JSON.stringify(state.city, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save city:', err);
  }
}

function loadCity(name = 'default') {
  try {
    activeCityName = name;
    const file = path.join(SAVED_CITIES_DIR, `${activeCityName}.json`);
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      state.city = JSON.parse(data);
      console.log(`City loaded from disk: ${activeCityName}`);
    } else {
      state.city = createInitialCity();
      // Ensure the file is written to establish it
      fs.writeFileSync(file, JSON.stringify(state.city, null, 2), 'utf8');
    }
  } catch (err) {
    console.error(`Failed to load city '${name}', using defaults:`, err);
    state.city = createInitialCity();
  }
}

loadCity('default');

function createInitialCity() {
  const COLS = 20, ROWS = 20;
  return {
    id: 'nova-arcadia',
    name: 'Nova Arcadia',
    cols: COLS,
    rows: ROWS,
    placedAssets: [], // { id, assetId, name, col, row, rotation, color, placedBy }
    roads: [
      {
        id: 'road-init-1',
        points: [
          { x: 2, z: 5 },
          { x: 5, z: 8 },
          { x: 10, z: 5 },
          { x: 15, z: 8 },
          { x: 18, z: 5 }
        ]
      },
      {
        id: 'road-init-2',
        points: [
          { x: 5, z: 2 },
          { x: 10, z: 10 },
          { x: 15, z: 18 }
        ]
      }
    ],
    stats: { population: 0, happiness: 100, treasury: 500000, traffic: 'low' },
    simulationTick: 0,
    zones: [],
  };
}

function createEmptyCity() {
  const COLS = 20, ROWS = 20;
  return {
    id: 'nova-arcadia',
    name: 'Nova Arcadia',
    cols: COLS,
    rows: ROWS,
    placedAssets: [],
    roads: [],
    zones: [],
    stats: { population: 0, happiness: 100, treasury: 500000, traffic: 'low' },
    simulationTick: 0,
  };
}

function createInitialProposals() {
  return [
    {
      id: uuid(),
      type: 'infrastructure',
      title: 'Build Metro Line 1 — North to Central',
      description: 'Construct a metro line connecting the northern residential zone to the central commercial district. Estimated cost ₡ 280,000. Projected to reduce road traffic by 22% and raise northern residential happiness.',
      proposedBy: 'Mayor',
      proposedByUser: 'System',
      status: 'open',
      createdAt: Date.now() - 86400000,
      expiresAt: Date.now() + 86400000 * 2,
      votes: { for: [], against: [], abstain: [] },
      cost: 280000,
      category: 'transit',
    },
    {
      id: uuid(),
      type: 'zoning',
      title: 'Rezone Block B3 — Industrial to Residential',
      description: 'Residents near Block B3 report pollution concerns from the adjacent industrial zone. Rezoning to residential would house ~600 more people but reduce industrial tax revenue by ₡ 8,000 per cycle.',
      proposedBy: 'Citizen petition',
      proposedByUser: 'System',
      status: 'open',
      createdAt: Date.now() - 172800000,
      expiresAt: Date.now() + 86400000 * 3,
      votes: { for: [], against: [], abstain: [] },
      cost: 0,
      category: 'zoning',
    },
    {
      id: uuid(),
      type: 'budget',
      title: 'Increase green space allocation by 15%',
      description: 'Allocate an additional 15% of the quarterly budget to green space construction and park maintenance. This would raise city happiness by an estimated 4 points but reduce available capital for infrastructure.',
      proposedBy: 'Council',
      proposedByUser: 'System',
      status: 'open',
      createdAt: Date.now() - 43200000,
      expiresAt: Date.now() + 86400000 * 5,
      votes: { for: [], against: [], abstain: [] },
      cost: 45000,
      category: 'budget',
    },
  ];
}

// ── CRDT helpers ───────────────────────────────────────────────────────────

function mergeVectorClocks(a, b) {
  const result = { ...a };
  for (const [k, v] of Object.entries(b)) result[k] = Math.max(result[k] || 0, v);
  return result;
}

function getOrCreateScene(sceneId) {
  if (!state.scenes[sceneId]) {
    state.scenes[sceneId] = { objects: {}, vectorClock: {} };
  }
  return state.scenes[sceneId];
}

// ── Simulation ─────────────────────────────────────────────────────────────

function runSimTick() {
  const city = state.city;
  let res = 0, com = 0, ind = 0, green = 0;
  
  (city.placedAssets || []).forEach(asset => {
    const name = (asset.name || '').toLowerCase();
    if (name.includes('home') || name.includes('manor') || name.includes('villa') || name.includes('residential') || name.includes('house') || name.includes('resort') || name.includes('sky')) {
      res++;
    } else if (name.includes('mall') || name.includes('diner') || name.includes('commercial') || name.includes('shop') || name.includes('hq') || name.includes('office')) {
      com++;
    } else if (name.includes('refinery') || name.includes('warehouse') || name.includes('industrial') || name.includes('factory') || name.includes('nuclear') || name.includes('port')) {
      ind++;
    } else if (name.includes('dome') || name.includes('fountain') || name.includes('green') || name.includes('park') || name.includes('tree') || name.includes('willow') || name.includes('blossom') || name.includes('pine')) {
      green++;
    } else if (name.includes('townhall') || name.includes('hospital') || name.includes('solar') || name.includes('turbine') || name.includes('watertower') || name.includes('bridge') || name.includes('station') || name.includes('cathedral') || name.includes('university') || name.includes('hyperloop') || name.includes('civic')) {
      // Civic structures, counted as general assets
    } else {
      res++;
    }
  });

  const assets = city.placedAssets.length;
  const basePop = res * 240 + assets * 80;
  const happiness = basePop === 0 ? 100 : Math.min(95, Math.max(20,
    50 + (green * 3) + (com * 2) - (ind * 1.5) + (assets * 2)
  ));
  const revenue = com * 1200 + ind * 800 - (res * 50);
  city.stats.population = Math.round(basePop);
  city.stats.happiness = Math.round(happiness);
  city.stats.treasury = Math.round(city.stats.treasury + revenue / 60); // per tick
  city.stats.traffic = ind > 8 ? 'high' : ind > 4 ? 'medium' : 'low';
  city.simulationTick++;

  broadcast({ type: 'CITY_STATS_UPDATE', stats: city.stats, tick: city.simulationTick });
}

setInterval(runSimTick, 5000);

// ── WebSocket ──────────────────────────────────────────────────────────────

const COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F'];
let colorIdx = 0;

function broadcast(msg, except = null) {
  const data = JSON.stringify(msg);
  for (const [ws] of state.clients) {
    if (ws !== except && ws.readyState === 1) ws.send(data);
  }
}

function broadcastToRoom(room, msg, except = null) {
  const data = JSON.stringify(msg);
  for (const [ws, client] of state.clients) {
    if (ws !== except && client.room === room && ws.readyState === 1) ws.send(data);
  }
}

function getPresence() {
  return [...state.clients.values()].map(c => ({ id: c.id, username: c.username, color: c.color, room: c.room }));
}

wss.on('connection', (ws) => {
  const clientId = uuid();
  const color = COLORS[colorIdx++ % COLORS.length];
  const client = { id: clientId, username: `Player_${clientId.slice(0,4)}`, color, room: 'city' };
  state.clients.set(ws, client);

  ws.send(JSON.stringify({
    type: 'WELCOME',
    clientId,
    color,
    city: state.city,
    proposals: state.proposals,
    presence: getPresence(),
  }));

  broadcast({ type: 'PRESENCE_UPDATE', presence: getPresence() }, ws);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    handleMessage(ws, client, msg);
  });

  ws.on('close', () => {
    state.clients.delete(ws);
    broadcast({ type: 'PRESENCE_UPDATE', presence: getPresence() });
  });
});

function getCitiesList() {
  try {
    const files = fs.readdirSync(SAVED_CITIES_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(SAVED_CITIES_DIR, f);
        const stats = fs.statSync(filePath);
        const name = path.basename(f, '.json');
        let roads = [];
        try {
          const data = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(data);
          roads = parsed.roads || [];
        } catch (e) {}
        return {
          name,
          createdAt: stats.birthtimeMs,
          modifiedAt: stats.mtimeMs,
          size: stats.size,
          isActive: name === activeCityName,
          roads
        };
      });
  } catch (err) {
    console.error('Failed to read saved cities:', err);
    return [];
  }
}

function handleMessage(ws, client, msg) {
  switch (msg.type) {

    case 'CITY_LIST_REQUEST': {
      ws.send(JSON.stringify({
        type: 'CITY_LIST_RESPONSE',
        cities: getCitiesList()
      }));
      break;
    }

    case 'CITY_LOAD_REQUEST': {
      saveCity();
      loadCity(msg.name);
      broadcast({
        type: 'CITY_STATE_UPDATE',
        city: state.city,
        proposals: state.proposals
      });
      broadcast({
        type: 'CITY_LIST_RESPONSE',
        cities: getCitiesList()
      });
      break;
    }

    case 'CITY_CREATE_REQUEST': {
      saveCity();
      activeCityName = msg.name;
      state.city = createInitialCity();
      saveCity();
      broadcast({
        type: 'CITY_STATE_UPDATE',
        city: state.city,
        proposals: state.proposals
      });
      broadcast({
        type: 'CITY_LIST_RESPONSE',
        cities: getCitiesList()
      });
      break;
    }

    case 'CITY_DELETE_REQUEST': {
      const file = path.join(SAVED_CITIES_DIR, `${msg.name}.json`);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      if (activeCityName === msg.name) {
        activeCityName = 'default';
        loadCity('default');
        broadcast({
          type: 'CITY_STATE_UPDATE',
          city: state.city,
          proposals: state.proposals
        });
      }
      broadcast({
        type: 'CITY_LIST_RESPONSE',
        cities: getCitiesList()
      });
      break;
    }

    case 'CITY_RENAME_REQUEST': {
      const oldFile = path.join(SAVED_CITIES_DIR, `${msg.oldName}.json`);
      const newFile = path.join(SAVED_CITIES_DIR, `${msg.newName}.json`);
      if (fs.existsSync(oldFile) && !fs.existsSync(newFile)) {
        fs.renameSync(oldFile, newFile);
        if (activeCityName === msg.oldName) {
          activeCityName = msg.newName;
          if (state.city) {
            state.city.name = msg.newName;
          }
          saveCity();
          broadcast({
            type: 'CITY_STATE_UPDATE',
            city: state.city,
            proposals: state.proposals
          });
        }
        broadcast({
          type: 'CITY_LIST_RESPONSE',
          cities: getCitiesList()
        });
      }
      break;
    }

    case 'SET_USERNAME': {
      client.username = msg.username.slice(0, 20);
      broadcast({ type: 'PRESENCE_UPDATE', presence: getPresence() });
      break;
    }

    case 'JOIN_ROOM': {
      client.room = msg.room; // 'city' | 'editor' | 'governance'
      broadcast({ type: 'PRESENCE_UPDATE', presence: getPresence() });
      break;
    }

    // ── EDITOR OPS ──────────────────────────────────────────────────────
    case 'EDITOR_JOIN': {
      const scene = getOrCreateScene(msg.sceneId);
      client.room = `editor:${msg.sceneId}`;
      ws.send(JSON.stringify({ type: 'EDITOR_SNAPSHOT', sceneId: msg.sceneId, objects: scene.objects, vectorClock: scene.vectorClock }));
      broadcastToRoom(`editor:${msg.sceneId}`, { type: 'PRESENCE_UPDATE', presence: getPresence() }, ws);
      break;
    }

    case 'EDITOR_OP': {
      const scene = getOrCreateScene(msg.sceneId);
      const { op } = msg;
      scene.vectorClock = mergeVectorClocks(scene.vectorClock, op.vectorClock || {});
      scene.vectorClock[client.id] = (scene.vectorClock[client.id] || 0) + 1;

      if (op.kind === 'CREATE') {
        scene.objects[op.objectId] = {
          id: op.objectId,
          type: op.objType || 'box',
          geometry: op.geometry || 'box',
          position: op.position || { x: 0, y: 0.5, z: 0 },
          rotation: op.rotation || { x: 0, y: 0, z: 0 },
          scale: op.scale || { x: 1, y: 1, z: 1 },
          color: op.color || '#4ECDC4',
          name: op.name || 'Object',
          createdBy: client.username,
          timestamp: Date.now(),
          isSubtractive: op.isSubtractive || false,
          children: op.children || undefined,
          text: op.text || undefined,
          textColor: op.textColor || undefined,
          textFont: op.textFont || undefined,
          textSize: op.textSize || undefined,
          textSurfaces: op.textSurfaces || undefined,
        };
      } else if (op.kind === 'UPDATE') {
        const obj = scene.objects[op.objectId];
        if (obj) {
          const existing = obj[op.property + '_ts'] || 0;
          if (op.timestamp >= existing) {
            obj[op.property] = op.value;
            obj[op.property + '_ts'] = op.timestamp;
          }
        }
      } else if (op.kind === 'DELETE') {
        delete scene.objects[op.objectId];
      }

      broadcastToRoom(`editor:${msg.sceneId}`, {
        type: 'EDITOR_OP_BROADCAST', sceneId: msg.sceneId, op, clientId: client.id, username: client.username,
      }, ws);
      break;
    }

    case 'EDITOR_CURSOR': {
      broadcastToRoom(`editor:${msg.sceneId}`, {
        type: 'EDITOR_CURSOR', clientId: client.id, username: client.username, color: client.color, position: msg.position,
      }, ws);
      break;
    }

    case 'PUBLISH_ASSET': {
      // Move asset from editor scene to city placed assets
      const asset = {
        id: uuid(),
        assetId: msg.assetId,
        sceneId: msg.sceneId,
        name: msg.name || 'Building',
        objects: msg.objects, // snapshot of editor objects
        col: msg.col || 2,
        row: msg.row || 2,
        rotation: msg.rotation || 0,
        color: msg.color || '#4ECDC4',
        placedBy: client.username,
        placedAt: Date.now(),
      };
      state.city.placedAssets.push(asset);
      broadcast({ type: 'CITY_ASSET_PLACED', asset });
      saveCity();
      break;
    }

    // ── CITY OPS ────────────────────────────────────────────────────────
    case 'CITY_ADD_ROAD': {
      state.city.roads.push(msg.road);
      broadcast({ type: 'CITY_ROAD_ADDED', road: msg.road });
      saveCity();
      break;
    }

    case 'CITY_REMOVE_ROAD': {
      state.city.roads = state.city.roads.filter(r => r.id !== msg.roadId);
      broadcast({ type: 'CITY_ROAD_REMOVED', roadId: msg.roadId });
      saveCity();
      break;
    }

    case 'CITY_PLACE_ASSET': {
      const asset = {
        id: msg.id || uuid(),
        name: msg.name || 'Building',
        objects: msg.objects || [],
        col: msg.col,
        row: msg.row,
        rotation: msg.rotation || 0,
        color: msg.color || '#4ECDC4',
        placedBy: client.username,
        placedAt: Date.now(),
        width: msg.width || 1,
        height: msg.height || 1,
        scaleMultiplier: msg.scaleMultiplier !== undefined ? msg.scaleMultiplier : undefined,
        locked: msg.locked !== undefined ? msg.locked : undefined,
      };
      state.city.placedAssets.push(asset);
      broadcast({ type: 'CITY_ASSET_PLACED', asset });
      saveCity();
      break;
    }

    case 'CITY_REMOVE_ASSET': {
      state.city.placedAssets = state.city.placedAssets.filter(a => a.id !== msg.assetId);
      broadcast({ type: 'CITY_ASSET_REMOVED', assetId: msg.assetId });
      saveCity();
      break;
    }

    case 'CITY_UPDATE_ASSET': {
      const asset = state.city.placedAssets.find(a => a.id === msg.assetId);
      if (asset) {
        if (msg.scaleMultiplier !== undefined) asset.scaleMultiplier = msg.scaleMultiplier;
        if (msg.objects !== undefined) asset.objects = msg.objects;
        if (msg.color !== undefined) asset.color = msg.color;
        if (msg.col !== undefined) asset.col = msg.col;
        if (msg.row !== undefined) asset.row = msg.row;
        if (msg.rotation !== undefined) asset.rotation = msg.rotation;
        if (msg.locked !== undefined) asset.locked = msg.locked;
        if (msg.customName !== undefined) asset.customName = msg.customName;
        broadcast({ type: 'CITY_ASSET_UPDATED', asset });
        saveCity();
      }
      break;
    }

    case 'CITY_UPDATE_ROAD': {
      const road = state.city.roads.find(r => r.id === msg.roadId);
      if (road) {
        if (msg.locked !== undefined) road.locked = msg.locked;
        broadcast({ type: 'CITY_ROAD_UPDATED', road });
        saveCity();
      }
      break;
    }

    case 'CITY_ADD_ZONE': {
      if (!state.city.zones) state.city.zones = [];
      state.city.zones.push(msg.zone);
      broadcast({ type: 'CITY_ZONE_ADDED', zone: msg.zone });
      saveCity();
      break;
    }

    case 'CITY_REMOVE_ZONE': {
      if (state.city.zones) {
        state.city.zones = state.city.zones.filter(z => z.id !== msg.zoneId);
      }
      broadcast({ type: 'CITY_ZONE_REMOVED', zoneId: msg.zoneId });
      saveCity();
      break;
    }

    case 'CITY_UPDATE_ZONE': {
      if (state.city.zones) {
        const zone = state.city.zones.find(z => z.id === msg.zoneId);
        if (zone) {
          if (msg.name !== undefined) zone.name = msg.name;
          if (msg.points !== undefined) zone.points = msg.points;
          if (msg.color !== undefined) zone.color = msg.color;
          broadcast({ type: 'CITY_ZONE_UPDATED', zone });
          saveCity();
        }
      }
      break;
    }

    case 'CITY_CLEAR': {
      state.city = createEmptyCity();
      broadcast({ type: 'CITY_CLEARED', city: state.city });
      saveCity();
      break;
    }

    // ── GOVERNANCE OPS ──────────────────────────────────────────────────
    case 'GOV_CREATE_PROPOSAL': {
      const proposal = {
        id: uuid(),
        type: msg.proposalType || 'general',
        title: msg.title,
        description: msg.description,
        proposedBy: client.username,
        proposedByUser: client.username,
        status: 'open',
        createdAt: Date.now(),
        expiresAt: Date.now() + (msg.durationDays || 3) * 86400000,
        votes: { for: [], against: [], abstain: [] },
        cost: msg.cost || 0,
        category: msg.category || 'general',
      };
      state.proposals.push(proposal);
      broadcast({ type: 'GOV_PROPOSAL_CREATED', proposal });
      break;
    }

    case 'GOV_VOTE': {
      const proposal = state.proposals.find(p => p.id === msg.proposalId);
      if (!proposal || proposal.status !== 'open') break;
      // Remove existing vote
      proposal.votes.for = proposal.votes.for.filter(u => u !== client.username);
      proposal.votes.against = proposal.votes.against.filter(u => u !== client.username);
      proposal.votes.abstain = proposal.votes.abstain.filter(u => u !== client.username);
      // Add new vote
      if (['for','against','abstain'].includes(msg.vote)) {
        proposal.votes[msg.vote].push(client.username);
      }
      broadcast({ type: 'GOV_VOTE_UPDATE', proposalId: proposal.id, votes: proposal.votes, voter: client.username });

      // Auto-pass/fail if all connected users voted
      const totalVoters = state.clients.size;
      const totalVoted = proposal.votes.for.length + proposal.votes.against.length + proposal.votes.abstain.length;
      if (totalVoted >= Math.max(1, totalVoters)) {
        const passed = proposal.votes.for.length > proposal.votes.against.length;
        proposal.status = passed ? 'passed' : 'failed';
        if (passed) applyProposal(proposal);
        broadcast({ type: 'GOV_PROPOSAL_RESOLVED', proposal });
      }
      break;
    }

    case 'GOV_CLOSE_PROPOSAL': {
      const proposal = state.proposals.find(p => p.id === msg.proposalId);
      if (!proposal) break;
      const passed = proposal.votes.for.length > proposal.votes.against.length;
      proposal.status = passed ? 'passed' : 'failed';
      if (passed) applyProposal(proposal);
      broadcast({ type: 'GOV_PROPOSAL_RESOLVED', proposal });
      break;
    }

    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG' }));
      break;
  }
}

function applyProposal(proposal) {
  if (proposal.cost > 0) {
    state.city.stats.treasury = Math.max(0, state.city.stats.treasury - proposal.cost);
  }
  if (proposal.category === 'transit') {
    state.city.stats.happiness = Math.min(95, state.city.stats.happiness + 5);
  }
  if (proposal.category === 'budget') {
    state.city.stats.happiness = Math.min(95, state.city.stats.happiness + 3);
  }
  saveCity();
}

// ── REST API ───────────────────────────────────────────────────────────────

app.get('/api/city', (_, res) => res.json(state.city));
app.get('/api/proposals', (_, res) => res.json(state.proposals));
app.get('/api/scenes/:id', (req, res) => {
  const scene = state.scenes[req.params.id];
  res.json(scene || { objects: {}, vectorClock: {} });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Commune server running on :${PORT}`));
