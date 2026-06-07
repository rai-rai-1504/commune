import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000';

// ── Vector clock helpers ─────────────────────────────────────────────────
function mergeVC(a, b) {
  const r = { ...a };
  for (const [k, v] of Object.entries(b || {})) r[k] = Math.max(r[k] || 0, v);
  return r;
}

function deepCloneCity(city) {
  if (!city) return city;
  return {
    ...city,
    grid: city.grid.map(row => row.map(cell => ({ ...cell }))),
    placedAssets: [...(city.placedAssets || [])],
    stats: { ...city.stats },
  };
}

export const useStore = create((set, get) => ({
  // ── Connection ─────────────────────────────────────────────────────────
  ws: null,
  connected: false,
  clientId: null,
  username: localStorage.getItem('commune_username') || 'Wanderer',
  clientColor: '#4ECDC4',
  presence: [],

  // ── Navigation ─────────────────────────────────────────────────────────
  activeModule: 'city',

  // ── Editor ─────────────────────────────────────────────────────────────
  editorSceneId: 'default-scene',
  editorObjects: {},
  editorVectorClock: {},
  selectedObjectId: null,
  editorTool: 'select',
  editorCursors: {},      // clientId -> {username, color, position}
  undoStack: [],
  redoStack: [],

  // ── City ───────────────────────────────────────────────────────────────
  city: null,
  cityTool: 'select',
  hoveredCell: null,
  streetView: false,      // toggle ground-level preview
  selectedAssetId: null,  // selected placed asset

  // ── Governance ─────────────────────────────────────────────────────────
  proposals: [],

  // ── Notifications ──────────────────────────────────────────────────────
  notifications: [],

  // ── Connect ────────────────────────────────────────────────────────────
  connect() {
    if (get().ws) return;
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => {
      set({ connected: true });
      const uname = get().username;
      if (uname) ws.send(JSON.stringify({ type: 'SET_USERNAME', username: uname }));
      ws.send(JSON.stringify({ type: 'EDITOR_JOIN', sceneId: get().editorSceneId }));
    };
    ws.onclose = () => {
      set({ connected: false, ws: null });
      setTimeout(() => get().connect(), 3000);
    };
    ws.onmessage = (e) => {
      try { get().handleServerMessage(JSON.parse(e.data)); } catch (_) {}
    };
    ws.onerror = () => {};
    set({ ws });
    setInterval(() => { if (get().ws?.readyState === 1) get().ws.send(JSON.stringify({ type: 'PING' })); }, 20000);
  },

  send(msg) {
    const { ws } = get();
    if (ws?.readyState === 1) ws.send(JSON.stringify(msg));
  },

  setUsername(name) {
    const clean = name.trim().slice(0, 20);
    set({ username: clean });
    localStorage.setItem('commune_username', clean);
    get().send({ type: 'SET_USERNAME', username: clean });
  },

  setActiveModule(mod) {
    set({ activeModule: mod, streetView: false });
    get().send({ type: 'JOIN_ROOM', room: mod });
  },

  // ── Server message handler ─────────────────────────────────────────────
  handleServerMessage(msg) {
    switch (msg.type) {
      case 'WELCOME': {
        set({ clientId: msg.clientId, clientColor: msg.color, city: msg.city, proposals: msg.proposals, presence: msg.presence });
        break;
      }
      case 'PRESENCE_UPDATE':
        set({ presence: msg.presence });
        break;

      case 'EDITOR_SNAPSHOT':
        set({ editorObjects: msg.objects || {}, editorVectorClock: msg.vectorClock || {} });
        break;

      case 'EDITOR_OP_BROADCAST': {
        const { op } = msg;
        set(state => {
          const objs = { ...state.editorObjects };
          const vc = mergeVC(state.editorVectorClock, op.vectorClock);
          if (op.kind === 'CREATE') {
            objs[op.objectId] = mkObj(op, msg.username);
          } else if (op.kind === 'UPDATE' && objs[op.objectId]) {
            const existing_ts = objs[op.objectId][op.property + '_ts'] || 0;
            if (op.timestamp >= existing_ts) {
              objs[op.objectId] = { ...objs[op.objectId], [op.property]: op.value, [op.property + '_ts']: op.timestamp };
            }
          } else if (op.kind === 'DELETE') {
            delete objs[op.objectId];
          }
          return { editorObjects: objs, editorVectorClock: vc };
        });
        const verb = op.kind === 'CREATE' ? 'added' : op.kind === 'DELETE' ? 'deleted' : 'updated';
        get().pushNotif(`@${msg.username} ${verb} an object`);
        break;
      }

      case 'EDITOR_CURSOR':
        set(state => ({ editorCursors: { ...state.editorCursors, [msg.clientId]: { username: msg.username, color: msg.color, position: msg.position } } }));
        break;

      case 'CITY_ZONE_UPDATE':
        set(state => {
          if (!state.city) return {};
          const city = deepCloneCity(state.city);
          if (city.grid[msg.row]?.[msg.col]) city.grid[msg.row][msg.col] = msg.cell;
          return { city };
        });
        break;

      case 'CITY_ROAD_UPDATE':
        set(state => {
          if (!state.city) return {};
          const city = deepCloneCity(state.city);
          if (city.grid[msg.row]?.[msg.col]) city.grid[msg.row][msg.col] = msg.cell;
          return { city };
        });
        break;

      case 'CITY_STATS_UPDATE':
        set(state => ({ city: state.city ? { ...state.city, stats: msg.stats } : state.city }));
        break;

      case 'CITY_ASSET_PLACED':
        set(state => ({ city: state.city ? { ...state.city, placedAssets: [...(state.city.placedAssets || []), msg.asset] } : state.city }));
        get().pushNotif(`@${msg.asset.placedBy} placed "${msg.asset.name}" in the city`);
        break;

      case 'CITY_ASSET_REMOVED':
        set(state => ({ city: state.city ? { ...state.city, placedAssets: (state.city.placedAssets || []).filter(a => a.id !== msg.assetId) } : state.city }));
        break;

      case 'GOV_PROPOSAL_CREATED':
        set(state => ({ proposals: [msg.proposal, ...state.proposals] }));
        get().pushNotif(`New proposal: "${msg.proposal.title}"`);
        break;

      case 'GOV_VOTE_UPDATE':
        set(state => ({ proposals: state.proposals.map(p => p.id === msg.proposalId ? { ...p, votes: msg.votes } : p) }));
        break;

      case 'GOV_PROPOSAL_RESOLVED':
        set(state => ({ proposals: state.proposals.map(p => p.id === msg.proposal.id ? msg.proposal : p) }));
        get().pushNotif(`Proposal "${msg.proposal.title.slice(0,30)}..." ${msg.proposal.status}!`);
        break;

      default: break;
    }
  },

  // ── Editor actions ─────────────────────────────────────────────────────
  addObject(geometry) {
    const id = uuid();
    const PALETTE = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F7DC6F','#C8A028','#378ADD','#E24B4A'];
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const position = { x: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)), y: 0.5, z: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)) };
    const op = {
      kind: 'CREATE', objectId: id, geometry, objType: 'mesh',
      position, rotation: { x:0,y:0,z:0 }, scale: { x:1,y:1,z:1 },
      color, name: geometry.charAt(0).toUpperCase() + geometry.slice(1) + '_' + id.slice(0,4),
      vectorClock: { ...get().editorVectorClock },
    };
    const newObj = mkObj(op, get().username);
    set(state => ({
      editorObjects: { ...state.editorObjects, [id]: newObj },
      selectedObjectId: id,
      undoStack: [...state.undoStack, { type: 'DELETE', objectId: id }].slice(-30),
      redoStack: [],
    }));
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
  },

  updateObjectProp(objectId, property, value) {
    const ts = Date.now();
    const prev = get().editorObjects[objectId]?.[property];
    const op = { kind: 'UPDATE', objectId, property, value, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
    set(state => ({
      editorObjects: {
        ...state.editorObjects,
        [objectId]: state.editorObjects[objectId]
          ? { ...state.editorObjects[objectId], [property]: value, [property + '_ts']: ts }
          : state.editorObjects[objectId],
      },
      undoStack: [...state.undoStack, { type: 'UPDATE', objectId, property, value: prev }].slice(-30),
      redoStack: [],
    }));
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
  },

  deleteObject(objectId) {
    const snapshot = get().editorObjects[objectId];
    const op = { kind: 'DELETE', objectId, vectorClock: { ...get().editorVectorClock } };
    set(state => {
      const objs = { ...state.editorObjects };
      delete objs[objectId];
      return {
        editorObjects: objs,
        selectedObjectId: state.selectedObjectId === objectId ? null : state.selectedObjectId,
        undoStack: [...state.undoStack, { type: 'RESTORE', snapshot }].slice(-30),
        redoStack: [],
      };
    });
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
  },

  duplicateObject(objectId) {
    const obj = get().editorObjects[objectId];
    if (!obj) return;
    const newId = uuid();
    const op = {
      kind: 'CREATE', objectId: newId, geometry: obj.geometry, objType: 'mesh',
      position: { x: obj.position.x + 1.2, y: obj.position.y, z: obj.position.z + 1.2 },
      rotation: { ...obj.rotation }, scale: { ...obj.scale }, color: obj.color,
      name: obj.name + '_copy', vectorClock: { ...get().editorVectorClock },
    };
    set(state => ({
      editorObjects: { ...state.editorObjects, [newId]: mkObj(op, get().username) },
      selectedObjectId: newId,
    }));
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
  },

  undo() {
    const { undoStack } = get();
    if (!undoStack.length) return;
    const action = undoStack[undoStack.length - 1];
    set(state => ({ undoStack: state.undoStack.slice(0, -1) }));
    if (action.type === 'DELETE') get().deleteObject(action.objectId);
    else if (action.type === 'UPDATE') get().updateObjectProp(action.objectId, action.property, action.value);
    else if (action.type === 'RESTORE') {
      const op = { kind: 'CREATE', objectId: action.snapshot.id, geometry: action.snapshot.geometry, objType: 'mesh', position: action.snapshot.position, rotation: action.snapshot.rotation, scale: action.snapshot.scale, color: action.snapshot.color, name: action.snapshot.name, vectorClock: { ...get().editorVectorClock } };
      set(state => ({ editorObjects: { ...state.editorObjects, [action.snapshot.id]: action.snapshot } }));
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    }
  },

  clearScene() {
    const ids = Object.keys(get().editorObjects);
    ids.forEach(id => get().deleteObject(id));
  },

  selectObject(id) { set({ selectedObjectId: id }); },
  setEditorTool(t) { set({ editorTool: t }); },

  publishToCity(name) {
    const { editorObjects, username } = get();
    const keys = Object.keys(editorObjects);
    if (!keys.length) return;
    const col = Math.floor(Math.random() * 14) + 2;
    const row = Math.floor(Math.random() * 14) + 2;
    get().send({
      type: 'CITY_PLACE_ASSET',
      name: name || `Building by @${username}`,
      objects: Object.values(editorObjects),
      col, row, color: '#4ECDC4', width: 2, height: 2,
    });
    set(state => ({
      city: state.city ? {
        ...state.city,
        placedAssets: [...(state.city.placedAssets || []), { id: uuid(), name: name || `Building by @${username}`, objects: Object.values(editorObjects), col, row, color: '#4ECDC4', width: 2, height: 2, placedBy: username, placedAt: Date.now() }],
      } : state.city,
    }));
    get().pushNotif(`Published "${name || 'Building'}" to city!`);
  },

  // ── City actions ───────────────────────────────────────────────────────
  setCityTool(t) { set({ cityTool: t }); },
  setHoveredCell(c) { set({ hoveredCell: c }); },
  setStreetView(v) { set({ streetView: v }); },
  selectAsset(id) { set({ selectedAssetId: id }); },

  applyCityTool(col, row) {
    const { cityTool } = get();
    if (cityTool === 'select') return;
    if (cityTool === 'road') {
      get().send({ type: 'CITY_ROAD', col, row, value: true });
      set(state => {
        const city = deepCloneCity(state.city);
        if (city.grid[row]?.[col]) city.grid[row][col].road = true;
        return { city };
      });
    } else if (cityTool === 'erase') {
      get().send({ type: 'CITY_ZONE', col, row, zoneType: null });
      get().send({ type: 'CITY_ROAD', col, row, value: false });
      set(state => {
        const city = deepCloneCity(state.city);
        if (city.grid[row]?.[col]) { city.grid[row][col].type = 'empty'; city.grid[row][col].zoneType = null; city.grid[row][col].road = false; }
        return { city };
      });
    } else {
      const zoneType = cityTool.replace('zone_', '');
      get().send({ type: 'CITY_ZONE', col, row, zoneType });
      set(state => {
        const city = deepCloneCity(state.city);
        if (city.grid[row]?.[col]) { city.grid[row][col].type = zoneType; city.grid[row][col].zoneType = zoneType; city.grid[row][col].road = false; }
        return { city };
      });
    }
  },

  removeAsset(assetId) {
    get().send({ type: 'CITY_REMOVE_ASSET', assetId });
    set(state => ({
      city: state.city ? { ...state.city, placedAssets: state.city.placedAssets.filter(a => a.id !== assetId) } : state.city,
      selectedAssetId: state.selectedAssetId === assetId ? null : state.selectedAssetId,
    }));
  },

  // ── Governance ─────────────────────────────────────────────────────────
  vote(proposalId, voteType) {
    const { username } = get();
    get().send({ type: 'GOV_VOTE', proposalId, vote: voteType });
    set(state => ({
      proposals: state.proposals.map(p => {
        if (p.id !== proposalId) return p;
        const votes = {
          for: p.votes.for.filter(u => u !== username),
          against: p.votes.against.filter(u => u !== username),
          abstain: p.votes.abstain.filter(u => u !== username),
        };
        votes[voteType].push(username);
        return { ...p, votes };
      }),
    }));
  },

  createProposal(data) { get().send({ type: 'GOV_CREATE_PROPOSAL', ...data }); },

  // ── Notifications ──────────────────────────────────────────────────────
  pushNotif(text) {
    const id = uuid();
    set(state => ({ notifications: [{ id, text, ts: Date.now() }, ...state.notifications].slice(0, 6) }));
    setTimeout(() => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })), 4500);
  },
}));

function mkObj(op, createdBy) {
  return {
    id: op.objectId,
    type: op.objType || 'mesh',
    geometry: op.geometry || 'box',
    position: op.position || { x: 0, y: 0.5, z: 0 },
    rotation: op.rotation || { x: 0, y: 0, z: 0 },
    scale: op.scale || { x: 1, y: 1, z: 1 },
    color: op.color || '#4ECDC4',
    name: op.name || 'Object',
    createdBy: createdBy || 'unknown',
    timestamp: Date.now(),
  };
}
