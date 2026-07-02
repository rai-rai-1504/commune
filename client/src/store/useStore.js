import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000';

// ── Vector clock helpers ─────────────────────────────────────────────────
function mergeVC(a, b) {
  const r = { ...a };
  for (const [k, v] of Object.entries(b || {})) r[k] = Math.max(r[k] || 0, v);
  return r;
}


// ── Green color check and color randomization helpers ───────────────────
function isGreenColor(colorStr) {
  if (!colorStr) return false;
  const lower = colorStr.toLowerCase();
  if (lower.includes('green')) return true;
  if (lower.startsWith('#')) {
    let r, g, b;
    if (lower.length === 4) {
      r = parseInt(lower[1] + lower[1], 16);
      g = parseInt(lower[2] + lower[2], 16);
      b = parseInt(lower[3] + lower[3], 16);
    } else if (lower.length === 7) {
      r = parseInt(lower.substring(1, 3), 16);
      g = parseInt(lower.substring(3, 5), 16);
      b = parseInt(lower.substring(5, 7), 16);
    } else {
      return false;
    }
    // Dominant green check
    if (g > r && g > b && g > (r + b) * 0.6) {
      return true;
    }
  }
  return false;
}

export const PRESET_PALETTES = [
  {
    id: 'modern',
    name: 'Modern Architecture',
    colors: [
      { id: 'white', label: 'White/Cream', color: '#f8fafc', generator: () => `hsl(${30 + Math.floor(Math.random() * 30)}, ${5 + Math.floor(Math.random() * 10)}%, ${85 + Math.floor(Math.random() * 10)}%)` },
      { id: 'grey', label: 'Grey', color: '#64748b', generator: () => `hsl(${Math.floor(Math.random() * 360)}, ${Math.floor(Math.random() * 8)}%, ${30 + Math.floor(Math.random() * 45)}%)` },
      { id: 'beige', label: 'Beige/Tan', color: '#d97706', generator: () => `hsl(${30 + Math.floor(Math.random() * 15)}, ${20 + Math.floor(Math.random() * 20)}%, ${65 + Math.floor(Math.random() * 15)}%)` },
      { id: 'black', label: 'Black/Charcoal', color: '#1e293b', generator: () => `hsl(${Math.floor(Math.random() * 360)}, ${Math.floor(Math.random() * 10)}%, ${8 + Math.floor(Math.random() * 10)}%)` },
      { id: 'blue', label: 'Slate Blue', color: '#334155', generator: () => `hsl(${200 + Math.floor(Math.random() * 25)}, ${15 + Math.floor(Math.random() * 25)}%, ${35 + Math.floor(Math.random() * 20)}%)` },
      { id: 'red', label: 'Brick Red', color: '#991b1b', generator: () => `hsl(${Math.random() > 0.5 ? 355 + Math.floor(Math.random() * 5) : Math.floor(Math.random() * 15)}, ${45 + Math.floor(Math.random() * 20)}%, ${35 + Math.floor(Math.random() * 15)}%)` },
      { id: 'brown', label: 'Brown/Wood', color: '#78350f', generator: () => `hsl(${15 + Math.floor(Math.random() * 20)}, ${30 + Math.floor(Math.random() * 20)}%, ${25 + Math.floor(Math.random() * 20)}%)` },
    ]
  },
  {
    id: 'warm',
    name: 'Warm Terracotta',
    colors: [
      { id: 'terracotta', label: 'Terracotta', color: '#c2410c', generator: () => `hsl(${10 + Math.floor(Math.random() * 15)}, ${50 + Math.floor(Math.random() * 15)}%, ${45 + Math.floor(Math.random() * 10)}%)` },
      { id: 'sand', label: 'Sand/Clay', color: '#eab308', generator: () => `hsl(${35 + Math.floor(Math.random() * 15)}, ${35 + Math.floor(Math.random() * 15)}%, ${65 + Math.floor(Math.random() * 15)}%)` },
      { id: 'mustard', label: 'Mustard', color: '#ca8a04', generator: () => `hsl(${45 + Math.floor(Math.random() * 10)}, ${50 + Math.floor(Math.random() * 15)}%, ${50 + Math.floor(Math.random() * 10)}%)` },
      { id: 'peach', label: 'Peach', color: '#fdba74', generator: () => `hsl(${20 + Math.floor(Math.random() * 15)}, ${50 + Math.floor(Math.random() * 15)}%, ${75 + Math.floor(Math.random() * 10)}%)` },
      { id: 'charcoal', label: 'Charcoal', color: '#374151', generator: () => `hsl(${210 + Math.floor(Math.random() * 20)}, ${5 + Math.floor(Math.random() * 10)}%, ${15 + Math.floor(Math.random() * 15)}%)` },
      { id: 'cream', label: 'Cream', color: '#fef3c7', generator: () => `hsl(${35 + Math.floor(Math.random() * 15)}, ${10 + Math.floor(Math.random() * 15)}%, ${90 + Math.floor(Math.random() * 5)}%)` },
      { id: 'bronze', label: 'Bronze', color: '#854d0e', generator: () => `hsl(${25 + Math.floor(Math.random() * 10)}, ${35 + Math.floor(Math.random() * 15)}%, ${35 + Math.floor(Math.random() * 10)}%)` },
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk City',
    colors: [
      { id: 'neon_blue', label: 'Neon Blue', color: '#06b6d4', generator: () => `hsl(${185 + Math.floor(Math.random() * 20)}, 95%, 50%)` },
      { id: 'hot_pink', label: 'Hot Pink', color: '#ec4899', generator: () => `hsl(${320 + Math.floor(Math.random() * 25)}, 95%, 55%)` },
      { id: 'toxic_green', label: 'Toxic Green', color: '#22c55e', generator: () => `hsl(${95 + Math.floor(Math.random() * 30)}, 90%, 48%)` },
      { id: 'laser_purple', label: 'Laser Purple', color: '#a855f7', generator: () => `hsl(${265 + Math.floor(Math.random() * 20)}, 90%, 55%)` },
      { id: 'acid_yellow', label: 'Acid Yellow', color: '#eab308', generator: () => `hsl(${55 + Math.floor(Math.random() * 10)}, 95%, 50%)` },
      { id: 'dark_grey', label: 'Dark Void', color: '#090d16', generator: () => `hsl(${220 + Math.floor(Math.random() * 20)}, 25%, ${6 + Math.floor(Math.random() * 8)}%)` },
      { id: 'neon_cyan', label: 'Neon Cyan', color: '#00f2ff', generator: () => `hsl(${175 + Math.floor(Math.random() * 15)}, 100%, 50%)` },
    ]
  },
  {
    id: 'coastal',
    name: 'Coastal Breeze',
    colors: [
      { id: 'seafoam', label: 'Seafoam', color: '#a7f3d0', generator: () => `hsl(${140 + Math.floor(Math.random() * 25)}, ${35 + Math.floor(Math.random() * 15)}%, ${75 + Math.floor(Math.random() * 10)}%)` },
      { id: 'ocean_blue', label: 'Ocean Blue', color: '#0284c7', generator: () => `hsl(${200 + Math.floor(Math.random() * 15)}, ${55 + Math.floor(Math.random() * 15)}%, ${45 + Math.floor(Math.random() * 15)}%)` },
      { id: 'sky_blue', label: 'Sky Blue', color: '#bae6fd', generator: () => `hsl(${195 + Math.floor(Math.random() * 15)}, ${45 + Math.floor(Math.random() * 15)}%, ${80 + Math.floor(Math.random() * 8)}%)` },
      { id: 'sand_beige', label: 'Sandy Beige', color: '#fef3c7', generator: () => `hsl(${35 + Math.floor(Math.random() * 15)}, ${25 + Math.floor(Math.random() * 15)}%, ${80 + Math.floor(Math.random() * 10)}%)` },
      { id: 'pearl_white', label: 'Pearl White', color: '#f8fafc', generator: () => `hsl(${210 + Math.floor(Math.random() * 20)}, ${10 + Math.floor(Math.random() * 10)}%, ${92 + Math.floor(Math.random() * 6)}%)` },
      { id: 'coral', label: 'Coral Pink', color: '#fca5a5', generator: () => `hsl(${0 + Math.floor(Math.random() * 15)}, ${60 + Math.floor(Math.random() * 15)}%, ${75 + Math.floor(Math.random() * 10)}%)` },
      { id: 'slate', label: 'Slate Grey', color: '#94a3b8', generator: () => `hsl(${210 + Math.floor(Math.random() * 15)}, ${15 + Math.floor(Math.random() * 10)}%, ${60 + Math.floor(Math.random() * 15)}%)` },
    ]
  }
];

export function randomizeObjectsColor(objects, activeColorIds, paletteId) {
  if (!objects) return [];
  const colorMap = {};
  const activePalette = PRESET_PALETTES.find(p => p.id === (paletteId || 'modern')) || PRESET_PALETTES[0];
  const activeIds = activeColorIds && activeColorIds.length > 0 ? activeColorIds : activePalette.colors.map(c => c.id);
  const colorsToUse = activePalette.colors.filter(c => activeIds.includes(c.id));
  const finalColors = colorsToUse.length > 0 ? colorsToUse : activePalette.colors;

  return objects.map(obj => {
    if (isGreenColor(obj.color)) {
      return obj;
    }
    if (obj.children && obj.children.length > 0) {
      return { ...obj, children: randomizeObjectsColor(obj.children, activeIds, paletteId) };
    }
    if (!colorMap[obj.color]) {
      const chosenColorInfo = finalColors[Math.floor(Math.random() * finalColors.length)];
      colorMap[obj.color] = chosenColorInfo.generator();
    }
    return { ...obj, color: colorMap[obj.color] };
  });
}

function propagateAndConstrain(objects, updatedId, property, prevValue, nextValue) {
  const nextObjects = { ...objects };

  // 1. Delta propagation for position
  if (property === 'position' && prevValue && nextValue && nextObjects[updatedId]) {
    const dx = nextValue.x - prevValue.x;
    const dy = nextValue.y - prevValue.y;
    const dz = nextValue.z - prevValue.z;

    // Find all children stacked on this object
    for (const [id, obj] of Object.entries(nextObjects)) {
      if (obj.stackedOnObjectId === updatedId) {
        nextObjects[id] = {
          ...obj,
          position: {
            x: obj.position.x + dx,
            y: obj.position.y + dy,
            z: obj.position.z + dz
          }
        };
      }
    }
  }

  // 2. Cascade constraints loop
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (const [id, obj] of Object.entries(nextObjects)) {
      if (obj.stackedOnObjectId) {
        const platform = nextObjects[obj.stackedOnObjectId];
        if (!platform) {
          nextObjects[id] = { ...obj, stackedOnObjectId: null };
          changed = true;
          continue;
        }

        // Clamp scale: child scale cannot exceed platform scale
        const scaleX = Math.min(obj.scale.x, platform.scale.x);
        const scaleZ = Math.min(obj.scale.z, platform.scale.z);

        // Lock Y position
        const posY = platform.position.y + platform.scale.y / 2 + obj.scale.y / 2;

        // Bound X and Z positions to stay within platform bounds
        const halfRangeX = Math.max(0, (platform.scale.x - scaleX) / 2);
        const posX = Math.max(platform.position.x - halfRangeX, Math.min(platform.position.x + halfRangeX, obj.position.x));

        const halfRangeZ = Math.max(0, (platform.scale.z - scaleZ) / 2);
        const posZ = Math.max(platform.position.z - halfRangeZ, Math.min(platform.position.z + halfRangeZ, obj.position.z));

        if (
          Math.abs(obj.position.x - posX) > 0.001 ||
          Math.abs(obj.position.y - posY) > 0.001 ||
          Math.abs(obj.position.z - posZ) > 0.001 ||
          Math.abs(obj.scale.x - scaleX) > 0.001 ||
          Math.abs(obj.scale.z - scaleZ) > 0.001
        ) {
          nextObjects[id] = {
            ...obj,
            position: { x: parseFloat(posX.toFixed(2)), y: parseFloat(posY.toFixed(2)), z: parseFloat(posZ.toFixed(2)) },
            scale: { ...obj.scale, x: parseFloat(scaleX.toFixed(2)), z: parseFloat(scaleZ.toFixed(2)) }
          };
          changed = true;
        }
      }
    }
  }
  return nextObjects;
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
  selectedObjectIds: [],
  pendingPlacementAsset: null,
  editorTool: 'select',
  stackingObjectId: null,
  setStackingObjectId(id) {
    set({ stackingObjectId: id });
  },
  editorCursors: {},      // clientId -> {username, color, position}
  undoStack: [],
  redoStack: [],

  // ── City ───────────────────────────────────────────────────────────────
  city: null,
  cityTool: 'select',
  hoveredCell: null,
  streetView: false,      // toggle ground-level preview
  selectedAssetId: null,  // selected placed asset
  selectedAssetIds: [],   // multi-selected placed assets
  cityUndoStack: [],      // city actions undo stack
  publishedBuildings: JSON.parse(localStorage.getItem('commune_published_buildings') || '[]'),
  randomiseAssetColors: false,
  randomColorPalette: ['white', 'grey', 'beige', 'black', 'blue', 'red', 'brown'],
  activePaletteId: 'modern',

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
    set({ activeModule: mod, streetView: false, pendingPlacementAsset: null });
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

      case 'CITY_ROAD_ADDED':
        set(state => ({
          city: state.city ? {
            ...state.city,
            roads: [...(state.city.roads || []), msg.road]
          } : state.city
        }));
        break;

      case 'CITY_ROAD_REMOVED':
        set(state => ({
          city: state.city ? {
            ...state.city,
            roads: (state.city.roads || []).filter(r => r.id !== msg.roadId)
          } : state.city
        }));
        break;

      case 'CITY_ROAD_UPDATED':
        set(state => ({
          city: state.city ? {
            ...state.city,
            roads: (state.city.roads || []).map(r => r.id === msg.road.id ? msg.road : r)
          } : state.city
        }));
        break;

      case 'CITY_ZONE_ADDED':
        set(state => ({
          city: state.city ? {
            ...state.city,
            zones: [...(state.city.zones || []), msg.zone]
          } : state.city
        }));
        break;

      case 'CITY_ZONE_REMOVED':
        set(state => ({
          city: state.city ? {
            ...state.city,
            zones: (state.city.zones || []).filter(z => z.id !== msg.zoneId)
          } : state.city
        }));
        break;

      case 'CITY_ZONE_UPDATED':
        set(state => ({
          city: state.city ? {
            ...state.city,
            zones: (state.city.zones || []).map(z => z.id === msg.zone.id ? msg.zone : z)
          } : state.city
        }));
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

      case 'CITY_ASSET_UPDATED':
        set(state => ({
          city: state.city ? {
            ...state.city,
            placedAssets: (state.city.placedAssets || []).map(a => a.id === msg.asset.id ? msg.asset : a)
          } : state.city
        }));
        break;

      case 'CITY_CLEARED':
        set({
          city: msg.city,
          selectedAssetId: null,
        });
        get().pushNotif('The city has been cleared!');
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
  addObject(geometry, position) {
    const id = uuid();
    const PALETTE = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F7DC6F','#C8A028','#378ADD','#E24B4A'];
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const pos = position
      ? { x: Math.max(-20, Math.min(20, position.x)), y: position.y, z: Math.max(-20, Math.min(20, position.z)) }
      : { x: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)), y: 0.5, z: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)) };
    const op = {
      kind: 'CREATE', objectId: id, geometry, objType: 'mesh',
      position: pos, rotation: { x:0,y:0,z:0 }, scale: { x:1,y:1,z:1 },
      color, name: geometry.charAt(0).toUpperCase() + geometry.slice(1) + '_' + id.slice(0,4),
      vectorClock: { ...get().editorVectorClock },
    };
    const newObj = mkObj(op, get().username);
    set(state => ({
      editorObjects: { ...state.editorObjects, [id]: newObj },
      selectedObjectId: id,
      selectedObjectIds: [id],
      undoStack: [...state.undoStack, { type: 'DELETE', objectId: id }].slice(-30),
      redoStack: [],
    }));
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
  },

  updateObjectProp(objectId, property, value, skipUndo = false) {
    const ts = Date.now();
    const oldObjs = get().editorObjects;
    const prev = oldObjs[objectId]?.[property];
    
    // Create candidate updated object
    let candidateObjs = {
      ...oldObjs,
      [objectId]: oldObjs[objectId] ? { ...oldObjs[objectId], [property]: value, [property + '_ts']: ts } : oldObjs[objectId]
    };
    
    // Apply propagation and constraints
    const nextObjs = propagateAndConstrain(candidateObjs, objectId, property, prev, value);
    
    set(state => {
      const nextUndoStack = skipUndo ? state.undoStack : [...state.undoStack, { type: 'UPDATE', objectId, property, value: prev }].slice(-30);
      return {
        editorObjects: nextObjs,
        undoStack: nextUndoStack,
        redoStack: [],
      };
    });

    // Send updates for all changed objects
    for (const [id, nextObj] of Object.entries(nextObjs)) {
      const oldObj = oldObjs[id];
      if (!oldObj) continue;
      
      if (oldObj.position.x !== nextObj.position.x || oldObj.position.y !== nextObj.position.y || oldObj.position.z !== nextObj.position.z) {
        const op = { kind: 'UPDATE', objectId: id, property: 'position', value: nextObj.position, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      }
      if (oldObj.scale.x !== nextObj.scale.x || oldObj.scale.y !== nextObj.scale.y || oldObj.scale.z !== nextObj.scale.z) {
        const op = { kind: 'UPDATE', objectId: id, property: 'scale', value: nextObj.scale, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      }
      if (id === objectId && property !== 'position' && property !== 'scale') {
        const op = { kind: 'UPDATE', objectId: id, property, value, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      }
    }
  },

  updateObjectsProp(objectIds, property, value) {
    const ts = Date.now();
    const oldObjs = get().editorObjects;
    const prevValues = {};
    objectIds.forEach(id => {
      prevValues[id] = oldObjs[id]?.[property];
    });

    let candidateObjs = { ...oldObjs };
    objectIds.forEach(id => {
      if (candidateObjs[id]) {
        candidateObjs[id] = { ...candidateObjs[id], [property]: value, [property + '_ts']: ts };
      }
    });

    let nextObjs = candidateObjs;
    objectIds.forEach(id => {
      nextObjs = propagateAndConstrain(nextObjs, id, property, prevValues[id], value);
    });

    set(state => {
      return {
        editorObjects: nextObjs,
        undoStack: [...state.undoStack, { type: 'UPDATE_GROUP', property, values: prevValues }].slice(-30),
        redoStack: [],
      };
    });

    for (const [id, nextObj] of Object.entries(nextObjs)) {
      const oldObj = oldObjs[id];
      if (!oldObj) continue;

      if (oldObj.position.x !== nextObj.position.x || oldObj.position.y !== nextObj.position.y || oldObj.position.z !== nextObj.position.z) {
        const op = { kind: 'UPDATE', objectId: id, property: 'position', value: nextObj.position, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      }
      if (oldObj.scale.x !== nextObj.scale.x || oldObj.scale.y !== nextObj.scale.y || oldObj.scale.z !== nextObj.scale.z) {
        const op = { kind: 'UPDATE', objectId: id, property: 'scale', value: nextObj.scale, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      }
      if (objectIds.includes(id) && property !== 'position' && property !== 'scale') {
        const op = { kind: 'UPDATE', objectId: id, property, value, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      }
    }
  },

  deleteObject(objectId, skipUndo = false) {
    const snapshot = get().editorObjects[objectId];
    if (!snapshot) return;
    const op = { kind: 'DELETE', objectId, vectorClock: { ...get().editorVectorClock } };
    set(state => {
      const objs = { ...state.editorObjects };
      delete objs[objectId];
      
      for (const [id, obj] of Object.entries(objs)) {
        if (obj.stackedOnObjectId === objectId) {
          objs[id] = { ...obj, stackedOnObjectId: null };
          const childOp = { kind: 'UPDATE', objectId: id, property: 'stackedOnObjectId', value: null, timestamp: Date.now(), vectorClock: { ...get().editorVectorClock } };
          get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op: childOp });
        }
      }

      const nextIds = state.selectedObjectIds.filter(id => id !== objectId);
      const primaryId = nextIds.length > 0 ? nextIds[nextIds.length - 1] : null;
      const nextUndoStack = skipUndo ? state.undoStack : [...state.undoStack, { type: 'RESTORE', snapshot }].slice(-30);
      return {
        editorObjects: objs,
        selectedObjectId: primaryId,
        selectedObjectIds: nextIds,
        undoStack: nextUndoStack,
        redoStack: [],
      };
    });
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
  },

  deleteObjects(objectIds, skipUndo = false) {
    const snapshots = objectIds.map(id => get().editorObjects[id]).filter(Boolean);
    if (!snapshots.length) return;
    set(state => {
      const nextObjs = { ...state.editorObjects };
      objectIds.forEach(id => delete nextObjs[id]);
      
      for (const [id, obj] of Object.entries(nextObjs)) {
        if (objectIds.includes(obj.stackedOnObjectId)) {
          nextObjs[id] = { ...obj, stackedOnObjectId: null };
          const childOp = { kind: 'UPDATE', objectId: id, property: 'stackedOnObjectId', value: null, timestamp: Date.now(), vectorClock: { ...get().editorVectorClock } };
          get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op: childOp });
        }
      }

      const nextIds = state.selectedObjectIds.filter(id => !objectIds.includes(id));
      const primaryId = nextIds.length > 0 ? nextIds[nextIds.length - 1] : null;
      const nextUndoStack = skipUndo ? state.undoStack : [...state.undoStack, { type: 'RESTORE_GROUP', snapshots }].slice(-30);
      return {
        editorObjects: nextObjs,
        selectedObjectId: primaryId,
        selectedObjectIds: nextIds,
        undoStack: nextUndoStack,
        redoStack: [],
      };
    });
    snapshots.forEach(snapshot => {
      const op = { kind: 'DELETE', objectId: snapshot.id, vectorClock: { ...get().editorVectorClock } };
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    });
  },

  duplicateObject(objectId) {
    get().duplicateObjects([objectId]);
  },

  duplicateObjects(objectIds) {
    const nextObjs = { ...get().editorObjects };
    const newIds = [];
    const ops = [];

    objectIds.forEach(id => {
      const obj = get().editorObjects[id];
      if (!obj) return;
      const newId = uuid();
      newIds.push(newId);
      const op = {
        kind: 'CREATE', objectId: newId, geometry: obj.geometry, objType: 'mesh',
        position: {
          x: Math.max(-20, Math.min(20, obj.position.x + 1.2)),
          y: obj.position.y,
          z: Math.max(-20, Math.min(20, obj.position.z + 1.2))
        },
        rotation: { ...obj.rotation }, scale: { ...obj.scale }, color: obj.color,
        name: obj.name + '_copy', vectorClock: { ...get().editorVectorClock },
        isSubtractive: obj.isSubtractive || false,
        children: obj.children ? JSON.parse(JSON.stringify(obj.children)) : undefined,
        text: obj.text || undefined,
        textColor: obj.textColor || undefined,
        textFont: obj.textFont || undefined,
        textSize: obj.textSize || undefined,
        textSurfaces: obj.textSurfaces || undefined,
      };
      nextObjs[newId] = mkObj(op, get().username);
      ops.push({ op, newId });
    });

    if (newIds.length === 0) return;

    set(state => {
      const undoAction = { type: 'DELETE_GROUP', objectIds: newIds };
      return {
        editorObjects: nextObjs,
        selectedObjectId: newIds[newIds.length - 1],
        selectedObjectIds: newIds,
        undoStack: [...state.undoStack, undoAction].slice(-30),
        redoStack: [],
      };
    });

    ops.forEach(({ op }) => {
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    });
  },

  carveSelectedObjects() {
    const { editorObjects, selectedObjectIds, username } = get();
    if (selectedObjectIds.length < 2) {
      get().pushNotif("Select 2 or more shapes to carve! 🪓");
      return;
    }

    const objectsToGroup = selectedObjectIds.map(id => editorObjects[id]).filter(Boolean);
    if (objectsToGroup.length < 2) return;

    const solids = objectsToGroup.filter(o => !o.isSubtractive);
    if (solids.length === 0) {
      get().pushNotif("Need at least one Solid shape to carve! ⬜");
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    objectsToGroup.forEach(obj => {
      const bounds = getObjectBounds(obj);
      if (bounds.minX < minX) minX = bounds.minX;
      if (bounds.maxX > maxX) maxX = bounds.maxX;
      if (bounds.minY < minY) minY = bounds.minY;
      if (bounds.maxY > maxY) maxY = bounds.maxY;
      if (bounds.minZ < minZ) minZ = bounds.minZ;
      if (bounds.maxZ > maxZ) maxZ = bounds.maxZ;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const groupPosition = {
      x: parseFloat(centerX.toFixed(2)),
      y: parseFloat(centerY.toFixed(2)),
      z: parseFloat(centerZ.toFixed(2))
    };

    const children = objectsToGroup.map(obj => ({
      ...obj,
      position: {
        x: parseFloat((obj.position.x - centerX).toFixed(2)),
        y: parseFloat((obj.position.y - centerY).toFixed(2)),
        z: parseFloat((obj.position.z - centerZ).toFixed(2))
      }
    }));

    const newId = uuid();
    const op = {
      kind: 'CREATE',
      objectId: newId,
      geometry: 'csg',
      objType: 'mesh',
      position: groupPosition,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: solids[0].color,
      name: 'Carved_' + newId.slice(0, 4),
      isSubtractive: false,
      children,
      vectorClock: { ...get().editorVectorClock }
    };

    const newObj = mkObj(op, username);

    const undoAction = {
      type: 'COMPOUND_EDITOR',
      actions: [
        { type: 'DELETE', objectId: newId },
        ...objectsToGroup.map(obj => ({ type: 'RESTORE', object: obj }))
      ]
    };

    const nextObjs = { ...editorObjects };
    objectsToGroup.forEach(obj => {
      delete nextObjs[obj.id];
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op: { kind: 'DELETE', objectId: obj.id, vectorClock: { ...get().editorVectorClock } } });
    });

    nextObjs[newId] = newObj;

    set(state => ({
      editorObjects: nextObjs,
      selectedObjectId: newId,
      selectedObjectIds: [newId],
      undoStack: [...state.undoStack, undoAction].slice(-30),
      redoStack: [],
    }));

    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    get().pushNotif("Objects carved into group! 🪓");
  },

  uncarveSelectedObject() {
    const { editorObjects, selectedObjectId } = get();
    if (!selectedObjectId) return;
    const csgObj = editorObjects[selectedObjectId];
    if (!csgObj || csgObj.geometry !== 'csg' || !csgObj.children) return;

    const childrenToRestore = csgObj.children;
    const nextObjs = { ...editorObjects };

    delete nextObjs[csgObj.id];
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op: { kind: 'DELETE', objectId: csgObj.id, vectorClock: { ...get().editorVectorClock } } });

    const opsToRestore = [];
    const restoredIds = [];

    childrenToRestore.forEach(child => {
      const restoredChild = {
        ...child,
        position: {
          x: parseFloat((child.position.x + csgObj.position.x).toFixed(2)),
          y: parseFloat((child.position.y + csgObj.position.y).toFixed(2)),
          z: parseFloat((child.position.z + csgObj.position.z).toFixed(2))
        }
      };
      
      nextObjs[child.id] = restoredChild;
      restoredIds.push(child.id);

      const op = {
        kind: 'CREATE',
        objectId: child.id,
        geometry: child.geometry,
        objType: 'mesh',
        position: restoredChild.position,
        rotation: child.rotation,
        scale: child.scale,
        color: child.color,
        name: child.name,
        isSubtractive: child.isSubtractive || false,
        children: child.children || undefined,
        text: child.text || undefined,
        textColor: child.textColor || undefined,
        textFont: child.textFont || undefined,
        textSize: child.textSize || undefined,
        textSurfaces: child.textSurfaces || undefined,
        vectorClock: { ...get().editorVectorClock }
      };
      opsToRestore.push(op);
    });

    const undoAction = {
      type: 'COMPOUND_EDITOR',
      actions: [
        { type: 'RESTORE', object: csgObj },
        ...restoredIds.map(id => ({ type: 'DELETE', objectId: id }))
      ]
    };

    set(state => ({
      editorObjects: nextObjs,
      selectedObjectId: restoredIds[restoredIds.length - 1],
      selectedObjectIds: restoredIds,
      undoStack: [...state.undoStack, undoAction].slice(-30),
      redoStack: [],
    }));

    opsToRestore.forEach(op => {
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    });

    get().pushNotif("Group split back into shapes! 🔓");
  },

  pushUndoAction(action) {
    set(state => ({
      undoStack: [...state.undoStack, action].slice(-30),
      redoStack: [],
    }));
  },

  undo() {
    const { undoStack } = get();
    if (!undoStack.length) return;
    const action = undoStack[undoStack.length - 1];
    set(state => ({ undoStack: state.undoStack.slice(0, -1) }));
    if (action.type === 'DELETE') {
      get().deleteObject(action.objectId, true);
    } else if (action.type === 'UPDATE') {
      get().updateObjectProp(action.objectId, action.property, action.value, true);
    } else if (action.type === 'RESTORE') {
      const s = action.snapshot;
      const op = {
        kind: 'CREATE', objectId: s.id, geometry: s.geometry, objType: 'mesh',
        position: s.position, rotation: s.rotation, scale: s.scale, color: s.color, name: s.name,
        isSubtractive: s.isSubtractive, children: s.children,
        text: s.text, textColor: s.textColor, textFont: s.textFont, textSize: s.textSize, textSurfaces: s.textSurfaces,
        vectorClock: { ...get().editorVectorClock }
      };
      set(state => ({ editorObjects: { ...state.editorObjects, [s.id]: s } }));
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    } else if (action.type === 'MOVE_GROUP') {
      Object.entries(action.positions).forEach(([id, pos]) => {
        get().updateObjectProp(id, 'position', pos, true);
      });
    } else if (action.type === 'RESTORE_GROUP') {
      const nextObjs = { ...get().editorObjects };
      action.snapshots.forEach(s => {
        nextObjs[s.id] = s;
        const op = {
          kind: 'CREATE', objectId: s.id, geometry: s.geometry, objType: 'mesh',
          position: s.position, rotation: s.rotation, scale: s.scale, color: s.color, name: s.name,
          isSubtractive: s.isSubtractive, children: s.children,
          text: s.text, textColor: s.textColor, textFont: s.textFont, textSize: s.textSize, textSurfaces: s.textSurfaces,
          vectorClock: { ...get().editorVectorClock }
        };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      });
      set({ editorObjects: nextObjs });
    } else if (action.type === 'DELETE_GROUP') {
      get().deleteObjects(action.objectIds, true);
    } else if (action.type === 'UPDATE_GROUP') {
      Object.entries(action.values).forEach(([id, val]) => {
        get().updateObjectProp(id, action.property, val, true);
      });
    } else if (action.type === 'COMPOUND_EDITOR') {
      action.actions.forEach(subAction => {
        if (subAction.type === 'DELETE') {
          get().deleteObject(subAction.objectId, true);
        } else if (subAction.type === 'RESTORE') {
          const s = subAction.object;
          const op = {
            kind: 'CREATE', objectId: s.id, geometry: s.geometry, objType: 'mesh',
            position: s.position, rotation: s.rotation, scale: s.scale, color: s.color, name: s.name,
            isSubtractive: s.isSubtractive, children: s.children,
            text: s.text, textColor: s.textColor, textFont: s.textFont, textSize: s.textSize, textSurfaces: s.textSurfaces,
            vectorClock: { ...get().editorVectorClock }
          };
          set(state => ({ editorObjects: { ...state.editorObjects, [s.id]: s } }));
          get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
        }
      });
    }
  },

  clearScene() {
    const ids = Object.keys(get().editorObjects);
    get().deleteObjects(ids);
  },

  selectObject(id, ctrlKey = false) {
    set(state => {
      let nextIds = [...state.selectedObjectIds];
      if (ctrlKey) {
        if (id) {
          if (nextIds.includes(id)) {
            nextIds = nextIds.filter(x => x !== id);
          } else {
            nextIds.push(id);
          }
        }
      } else {
        nextIds = id ? [id] : [];
      }
      const primaryId = nextIds.length > 0 ? nextIds[nextIds.length - 1] : null;
      return {
        selectedObjectIds: nextIds,
        selectedObjectId: primaryId,
      };
    });
  },

  selectObjects(ids, accumulate = false) {
    set(state => {
      let nextIds = accumulate ? [...state.selectedObjectIds] : [];
      ids.forEach(id => {
        if (!nextIds.includes(id)) nextIds.push(id);
      });
      const primaryId = nextIds.length > 0 ? nextIds[nextIds.length - 1] : null;
      return {
        selectedObjectIds: nextIds,
        selectedObjectId: primaryId,
      };
    });
  },

  setEditorTool(t) { set({ editorTool: t }); },

  publishToCity(name) {
    const { editorObjects, selectedObjectIds, username } = get();
    const objectsToPublish = Object.values(editorObjects).filter(obj => selectedObjectIds.includes(obj.id));
    if (objectsToPublish.length === 0) return;

    // Calculate bounding box in editor units
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    objectsToPublish.forEach(obj => {
      const sx = obj.scale?.x ?? 1;
      const sy = obj.scale?.y ?? 1;
      const sz = obj.scale?.z ?? 1;
      const px = obj.position?.x ?? 0;
      const py = obj.position?.y ?? 0;
      const pz = obj.position?.z ?? 0;

      const hx = sx / 2;
      const hy = sy / 2;
      const hz = sz / 2;

      if (px - hx < minX) minX = px - hx;
      if (px + hx > maxX) maxX = px + hx;
      if (py - hy < minY) minY = py - hy;
      if (py + hy > maxY) maxY = py + hy;
      if (pz - hz < minZ) minZ = pz - hz;
      if (pz + hz > maxZ) maxZ = pz + hz;
    });

    if (minX === Infinity) {
      minX = -1; maxX = 1;
      minY = 0;  maxY = 1;
      minZ = -1; maxZ = 1;
    }

    const width = maxX - minX;
    const height = maxZ - minZ;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Center the objects around the calculated bounding box center
    const centeredObjects = objectsToPublish.map(obj => ({
      ...obj,
      position: {
        x: obj.position.x - centerX,
        y: obj.position.y,
        z: obj.position.z - centerZ
      }
    }));

    const finalName = name || `Building by @${username}`;
    const newPublishedAsset = {
      id: uuid(),
      name: finalName,
      objects: centeredObjects,
      color: '#4ECDC4',
      width,
      height,
      publishedAt: Date.now(),
    };

    const publishedBuildings = [newPublishedAsset, ...(get().publishedBuildings || [])];

    set({
      publishedBuildings,
      pendingPlacementAsset: {
        name: finalName,
        objects: centeredObjects,
        color: '#4ECDC4',
        width,
        height,
      },
      activeModule: 'city',
      streetView: false,
    });
    localStorage.setItem('commune_published_buildings', JSON.stringify(publishedBuildings));
    get().pushNotif(`Building ready for placement! Click on the city map.`);
  },

  deletePublishedBuilding(id) {
    const publishedBuildings = (get().publishedBuildings || []).filter(b => b.id !== id);
    set({ publishedBuildings });
    localStorage.setItem('commune_published_buildings', JSON.stringify(publishedBuildings));
  },

  placePendingAsset(col, row, rotation = 0) {
    const { pendingPlacementAsset, randomiseAssetColors } = get();
    if (!pendingPlacementAsset) return;

    let objectsToPlace = pendingPlacementAsset.objects;
    let assetColor = pendingPlacementAsset.color;
    const isStation = pendingPlacementAsset.isMetroStation || pendingPlacementAsset.name.toLowerCase().includes('metro');

    if (randomiseAssetColors && !isStation) {
      objectsToPlace = randomizeObjectsColor(pendingPlacementAsset.originalObjects || pendingPlacementAsset.objects, get().randomColorPalette, get().activePaletteId);
      if (objectsToPlace && objectsToPlace.length > 0) {
        assetColor = objectsToPlace[0].color;
      }
    }

    const id = uuid();
    get().send({
      type: 'CITY_PLACE_ASSET',
      id,
      name: pendingPlacementAsset.name,
      objects: objectsToPlace,
      col, row, color: assetColor,
      width: pendingPlacementAsset.width, height: pendingPlacementAsset.height,
      rotation,
    });
    get().pushCityUndo({ type: 'REMOVE_ASSET', assetId: id });
    get().pushNotif(`Placed "${pendingPlacementAsset.name}" in the city!`);

    // Immediately generate a new randomized preview for the next placement!
    if (randomiseAssetColors && !isStation) {
      const randomizedPreviewObjects = randomizeObjectsColor(pendingPlacementAsset.originalObjects || pendingPlacementAsset.objects, get().randomColorPalette, get().activePaletteId);
      set({
        pendingPlacementAsset: {
          ...pendingPlacementAsset,
          originalObjects: pendingPlacementAsset.originalObjects || pendingPlacementAsset.objects,
          objects: randomizedPreviewObjects,
          color: randomizedPreviewObjects[0]?.color || assetColor
        }
      });
    }
  },

  selectPendingAsset(asset) {
    if (!asset) {
      set({ pendingPlacementAsset: null });
      return;
    }
    const isStation = asset.isMetroStation || asset.name.toLowerCase().includes('metro');
    if (get().randomiseAssetColors && !isStation) {
      const randomized = randomizeObjectsColor(asset.objects, get().randomColorPalette, get().activePaletteId);
      set({
        pendingPlacementAsset: {
          ...asset,
          originalObjects: asset.objects,
          objects: randomized,
          color: randomized[0]?.color || asset.color
        },
        cityTool: 'select'
      });
    } else {
      set({
        pendingPlacementAsset: asset,
        cityTool: 'select'
      });
    }
  },

  toggleRandomiseAssetColors() {
    const nextVal = !get().randomiseAssetColors;
    set({ randomiseAssetColors: nextVal });

    const { pendingPlacementAsset } = get();
    if (pendingPlacementAsset) {
      const isStation = pendingPlacementAsset.isMetroStation || pendingPlacementAsset.name.toLowerCase().includes('metro');
      if (!isStation) {
        if (nextVal) {
          const original = pendingPlacementAsset.originalObjects || pendingPlacementAsset.objects;
          const randomized = randomizeObjectsColor(original, get().randomColorPalette, get().activePaletteId);
          set({
            pendingPlacementAsset: {
              ...pendingPlacementAsset,
              originalObjects: original,
              objects: randomized,
              color: randomized[0]?.color || pendingPlacementAsset.color
            }
          });
        } else {
          const original = pendingPlacementAsset.originalObjects || pendingPlacementAsset.objects;
          set({
            pendingPlacementAsset: {
              ...pendingPlacementAsset,
              objects: original,
              color: original[0]?.color || pendingPlacementAsset.color
            }
          });
        }
      }
    }
  },

  toggleColorFamilyInPalette(familyId) {
    set(state => {
      let nextPalette = [...state.randomColorPalette];
      if (nextPalette.includes(familyId)) {
        nextPalette = nextPalette.filter(id => id !== familyId);
      } else {
        nextPalette.push(familyId);
      }
      return { randomColorPalette: nextPalette };
    });

    const { pendingPlacementAsset } = get();
    if (pendingPlacementAsset) {
      const isStation = pendingPlacementAsset.isMetroStation || pendingPlacementAsset.name.toLowerCase().includes('metro');
      if (!isStation && get().randomiseAssetColors) {
        const original = pendingPlacementAsset.originalObjects || pendingPlacementAsset.objects;
        const randomized = randomizeObjectsColor(original, get().randomColorPalette, get().activePaletteId);
        set({
          pendingPlacementAsset: {
            ...pendingPlacementAsset,
            originalObjects: original,
            objects: randomized,
            color: randomized[0]?.color || pendingPlacementAsset.color
          }
        });
      }
    }
  },

  selectActivePalette(paletteId) {
    const palette = PRESET_PALETTES.find(p => p.id === paletteId);
    if (!palette) return;
    set({
      activePaletteId: paletteId,
      randomColorPalette: palette.colors.map(c => c.id)
    });

    const { pendingPlacementAsset } = get();
    if (pendingPlacementAsset) {
      const isStation = pendingPlacementAsset.isMetroStation || pendingPlacementAsset.name.toLowerCase().includes('metro');
      if (!isStation && get().randomiseAssetColors) {
        const original = pendingPlacementAsset.originalObjects || pendingPlacementAsset.objects;
        const randomized = randomizeObjectsColor(original, palette.colors.map(c => c.id), paletteId);
        set({
          pendingPlacementAsset: {
            ...pendingPlacementAsset,
            originalObjects: original,
            objects: randomized,
            color: randomized[0]?.color || pendingPlacementAsset.color
          }
        });
      }
    }
  },

  // ── City actions ───────────────────────────────────────────────────────
  setCityTool(t) { set({ cityTool: t, pendingPlacementAsset: null }); },
  setHoveredCell(c) { set({ hoveredCell: c }); },
  setStreetView(v) { set({ streetView: v }); },
  selectAsset(id) { set({ selectedAssetId: id, selectedAssetIds: id ? [id] : [] }); },
  selectAssets(ids) {
    set(state => {
      const nextIds = ids || [];
      const primaryId = nextIds.length > 0 ? nextIds[nextIds.length - 1] : null;
      return {
        selectedAssetIds: nextIds,
        selectedAssetId: primaryId,
      };
    });
  },

  addRoadSegment(points, roadType = 'standard', skipUndo = false) {
    // Collision check bypassed to allow building roads anywhere

    const id = uuid();
    const newRoad = { id, points, roadType };
    if (!skipUndo) {
      get().pushCityUndo({ type: 'REMOVE_ROAD', roadId: id });
    }
    get().send({ type: 'CITY_ADD_ROAD', road: newRoad });
    set(state => ({
      city: state.city ? { ...state.city, roads: [...(state.city.roads || []), newRoad] } : state.city
    }));
  },

  removeRoadSegment(roadId, skipUndo = false) {
    const road = (get().city?.roads || []).find(r => r.id === roadId);
    if (road && !skipUndo) {
      get().pushCityUndo({ type: 'ADD_ROAD', road });
    }
    get().send({ type: 'CITY_REMOVE_ROAD', roadId });
    set(state => ({
      city: state.city ? { ...state.city, roads: (state.city.roads || []).filter(r => r.id !== roadId) } : state.city
    }));
  },

  updateRoad(roadId, updates, sendToServer = true, skipUndo = false) {
    const road = (get().city?.roads || []).find(r => r.id === roadId);
    if (road && !skipUndo) {
      const prevUpdates = {};
      Object.keys(updates).forEach(k => {
        prevUpdates[k] = road[k];
      });
      get().pushCityUndo({ type: 'UPDATE_ROAD', roadId, updates: prevUpdates, timestamp: Date.now() });
    }
    if (sendToServer) {
      get().send({ type: 'CITY_UPDATE_ROAD', roadId, ...updates });
    }
    set(state => ({
      city: state.city ? {
        ...state.city,
        roads: (state.city.roads || []).map(r => r.id === roadId ? { ...r, ...updates } : r)
      } : state.city
    }));
  },

  addZone(name, points, color = '#4ECDC4') {
    const id = uuid();
    const newZone = { id, name, points, color };
    get().send({ type: 'CITY_ADD_ZONE', zone: newZone });
    set(state => ({
      city: state.city ? { ...state.city, zones: [...(state.city.zones || []), newZone] } : state.city
    }));
  },

  removeZone(zoneId) {
    get().send({ type: 'CITY_REMOVE_ZONE', zoneId });
    set(state => ({
      city: state.city ? { ...state.city, zones: (state.city.zones || []).filter(z => z.id !== zoneId) } : state.city
    }));
  },

  updateZone(zoneId, updates) {
    get().send({ type: 'CITY_UPDATE_ZONE', zoneId, ...updates });
    set(state => ({
      city: state.city ? {
        ...state.city,
        zones: (state.city.zones || []).map(z => z.id === zoneId ? { ...z, ...updates } : z)
      } : state.city
    }));
  },

  removeAsset(assetId, skipUndo = false) {
    const asset = (get().city?.placedAssets || []).find(a => a.id === assetId);
    if (asset && !skipUndo) {
      get().pushCityUndo({ type: 'PLACE_ASSET', asset });
    }
    get().send({ type: 'CITY_REMOVE_ASSET', assetId });
    set(state => ({
      city: state.city ? { ...state.city, placedAssets: state.city.placedAssets.filter(a => a.id !== assetId) } : state.city,
      selectedAssetId: state.selectedAssetId === assetId ? null : state.selectedAssetId,
      selectedAssetIds: (state.selectedAssetIds || []).filter(id => id !== assetId),
    }));
  },

  removeAssets(assetIds, skipUndo = false) {
    const assets = (get().city?.placedAssets || []).filter(a => assetIds.includes(a.id));
    if (assets.length === 0) return;
    if (!skipUndo) {
      const compoundActions = assets.map(asset => ({ type: 'PLACE_ASSET', asset }));
      get().pushCityUndo({ type: 'COMPOUND', actions: compoundActions });
    }
    assetIds.forEach(id => {
      get().send({ type: 'CITY_REMOVE_ASSET', assetId: id });
    });
    set(state => ({
      city: state.city ? { ...state.city, placedAssets: state.city.placedAssets.filter(a => !assetIds.includes(a.id)) } : state.city,
      selectedAssetId: assetIds.includes(state.selectedAssetId) ? null : state.selectedAssetId,
      selectedAssetIds: (state.selectedAssetIds || []).filter(id => !assetIds.includes(id)),
    }));
  },

  updateAsset(assetId, updates, sendToServer = true, skipUndo = false) {
    const asset = (get().city?.placedAssets || []).find(a => a.id === assetId);
    if (asset && !skipUndo) {
      const prevUpdates = {};
      Object.keys(updates).forEach(k => {
        prevUpdates[k] = asset[k];
      });
      const now = Date.now();
      const lastAction = get().cityUndoStack[get().cityUndoStack.length - 1];
      if (lastAction && lastAction.type === 'UPDATE_ASSET' && lastAction.assetId === assetId && (now - (lastAction.timestamp || 0) < 3000)) {
        const mergedUpdates = { ...prevUpdates, ...lastAction.updates };
        const cityUndoStack = [...get().cityUndoStack.slice(0, -1), { type: 'UPDATE_ASSET', assetId, updates: mergedUpdates, timestamp: lastAction.timestamp || now }];
        set({ cityUndoStack });
      } else {
        get().pushCityUndo({ type: 'UPDATE_ASSET', assetId, updates: prevUpdates, timestamp: now });
      }
    }

    if (sendToServer) {
      get().send({ type: 'CITY_UPDATE_ASSET', assetId, ...updates });
    }
    set(state => ({
      city: state.city ? {
        ...state.city,
        placedAssets: (state.city.placedAssets || []).map(a => a.id === assetId ? { ...a, ...updates } : a)
      } : state.city
    }));
  },

  pushCityUndo(action) {
    const cityUndoStack = [...get().cityUndoStack, action].slice(-10);
    set({ cityUndoStack });
  },

  undoCity() {
    const { cityUndoStack } = get();
    if (!cityUndoStack.length) return;
    const action = cityUndoStack[cityUndoStack.length - 1];
    set({ cityUndoStack: cityUndoStack.slice(0, -1) });

    const executeAction = (act) => {
      switch (act.type) {
        case 'REMOVE_ASSET':
          get().removeAsset(act.assetId, true);
          break;
        case 'PLACE_ASSET': {
          const asset = act.asset;
          get().send({
            type: 'CITY_PLACE_ASSET',
            id: asset.id,
            name: asset.name,
            objects: asset.objects,
            col: asset.col,
            row: asset.row,
            color: asset.color,
            width: asset.width,
            height: asset.height,
            rotation: asset.rotation,
            scaleMultiplier: asset.scaleMultiplier,
            locked: asset.locked,
          });
          set(state => ({
            city: state.city ? { ...state.city, placedAssets: [...(state.city.placedAssets || []), asset] } : state.city
          }));
          break;
        }
        case 'UPDATE_ASSET':
          get().updateAsset(act.assetId, act.updates, true, true);
          break;
        case 'UPDATE_ROAD':
          get().updateRoad(act.roadId, act.updates, true);
          break;
        case 'ADD_ROAD':
          get().send({ type: 'CITY_ADD_ROAD', road: act.road });
          set(state => ({
            city: state.city ? { ...state.city, roads: [...(state.city.roads || []), act.road] } : state.city
          }));
          break;
        case 'REMOVE_ROAD':
          get().send({ type: 'CITY_REMOVE_ROAD', roadId: act.roadId });
          set(state => ({
            city: state.city ? { ...state.city, roads: (state.city.roads || []).filter(r => r.id !== act.roadId) } : state.city
          }));
          break;
        case 'COMPOUND':
          for (let i = act.actions.length - 1; i >= 0; i--) {
            executeAction(act.actions[i]);
          }
          break;
        default:
          break;
      }
    };

    executeAction(action);
  },

  lockAllAssets(lock = true) {
    const { city } = get();
    const assets = city?.placedAssets || [];
    const roads = city?.roads || [];
    if (assets.length === 0 && roads.length === 0) return;
    const compoundActions = [];
    assets.forEach(asset => {
      if (!!asset.locked !== lock) {
        compoundActions.push({ type: 'UPDATE_ASSET', assetId: asset.id, updates: { locked: !!asset.locked } });
      }
    });
    roads.forEach(road => {
      if (!!road.locked !== lock) {
        compoundActions.push({ type: 'UPDATE_ROAD', roadId: road.id, updates: { locked: !!road.locked } });
      }
    });
    if (compoundActions.length > 0) {
      get().pushCityUndo({ type: 'COMPOUND', actions: compoundActions });
    }
    assets.forEach(asset => {
      get().updateAsset(asset.id, { locked: lock }, true, true); // skipUndo = true
    });
    roads.forEach(road => {
      get().updateRoad(road.id, { locked: lock }, true, true); // skipUndo = true
    });
    if (lock) {
      set({ selectedAssetId: null, selectedAssetIds: [] });
    }
    get().pushNotif(lock ? "All objects and roads locked! 🔒" : "All objects and roads unlocked! 🔓");
  },

  clearCity() {
    get().send({ type: 'CITY_CLEAR' });
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
    isSubtractive: op.isSubtractive || false,
    isSolid: op.isSolid || false,
    isStacked: op.isStacked || false,
    lockX: op.lockX || false,
    lockY: op.lockY || false,
    lockZ: op.lockZ || false,
    children: op.children || undefined,
    text: op.text || undefined,
    textColor: op.textColor || undefined,
    textFont: op.textFont || undefined,
    textSize: op.textSize || undefined,
    textSurfaces: op.textSurfaces || undefined,
  };
}

function getObjectBounds(obj) {
  if (obj.geometry === 'csg') {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    const children = obj.children || [];
    children.forEach(child => {
      const childAbs = {
        ...child,
        position: {
          x: child.position.x + obj.position.x,
          y: child.position.y + obj.position.y,
          z: child.position.z + obj.position.z,
        }
      };
      const cb = getObjectBounds(childAbs);
      if (cb.minX < minX) minX = cb.minX;
      if (cb.maxX > maxX) maxX = cb.maxX;
      if (cb.minY < minY) minY = cb.minY;
      if (cb.maxY > maxY) maxY = cb.maxY;
      if (cb.minZ < minZ) minZ = cb.minZ;
      if (cb.maxZ > maxZ) maxZ = cb.maxZ;
    });
    if (minX === Infinity) {
      return {
        minX: obj.position.x - 0.5, maxX: obj.position.x + 0.5,
        minY: obj.position.y - 0.5, maxY: obj.position.y + 0.5,
        minZ: obj.position.z - 0.5, maxZ: obj.position.z + 0.5,
      };
    }
    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  const sx = obj.scale?.x ?? 1;
  const sy = obj.scale?.y ?? 1;
  const sz = obj.scale?.z ?? 1;
  const px = obj.position?.x ?? 0;
  const py = obj.position?.y ?? 0;
  const pz = obj.position?.z ?? 0;
  return {
    minX: px - sx / 2,
    maxX: px + sx / 2,
    minY: py - sy / 2,
    maxY: py + sy / 2,
    minZ: pz - sz / 2,
    maxZ: pz + sz / 2,
  };
}
