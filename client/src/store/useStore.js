import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000';

// ── Vector clock helpers ─────────────────────────────────────────────────
function mergeVC(a, b) {
  const r = { ...a };
  for (const [k, v] of Object.entries(b || {})) r[k] = Math.max(r[k] || 0, v);
  return r;
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
    const prev = get().editorObjects[objectId]?.[property];
    const op = { kind: 'UPDATE', objectId, property, value, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
    set(state => {
      const nextUndoStack = skipUndo ? state.undoStack : [...state.undoStack, { type: 'UPDATE', objectId, property, value: prev }].slice(-30);
      return {
        editorObjects: {
          ...state.editorObjects,
          [objectId]: state.editorObjects[objectId]
            ? { ...state.editorObjects[objectId], [property]: value, [property + '_ts']: ts }
            : state.editorObjects[objectId],
        },
        undoStack: nextUndoStack,
        redoStack: [],
      };
    });
    get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
  },

  updateObjectsProp(objectIds, property, value) {
    const ts = Date.now();
    const prevValues = {};
    objectIds.forEach(id => {
      prevValues[id] = get().editorObjects[id]?.[property];
    });
    set(state => {
      const nextObjs = { ...state.editorObjects };
      objectIds.forEach(id => {
        if (nextObjs[id]) {
          nextObjs[id] = { ...nextObjs[id], [property]: value, [property + '_ts']: ts };
        }
      });
      return {
        editorObjects: nextObjs,
        undoStack: [...state.undoStack, { type: 'UPDATE_GROUP', property, values: prevValues }].slice(-30),
        redoStack: [],
      };
    });
    objectIds.forEach(id => {
      const op = { kind: 'UPDATE', objectId: id, property, value, timestamp: ts, vectorClock: { ...get().editorVectorClock } };
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    });
  },

  deleteObject(objectId, skipUndo = false) {
    const snapshot = get().editorObjects[objectId];
    if (!snapshot) return;
    const op = { kind: 'DELETE', objectId, vectorClock: { ...get().editorVectorClock } };
    set(state => {
      const objs = { ...state.editorObjects };
      delete objs[objectId];
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
      const op = { kind: 'CREATE', objectId: action.snapshot.id, geometry: action.snapshot.geometry, objType: 'mesh', position: action.snapshot.position, rotation: action.snapshot.rotation, scale: action.snapshot.scale, color: action.snapshot.color, name: action.snapshot.name, vectorClock: { ...get().editorVectorClock } };
      set(state => ({ editorObjects: { ...state.editorObjects, [action.snapshot.id]: action.snapshot } }));
      get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
    } else if (action.type === 'MOVE_GROUP') {
      Object.entries(action.positions).forEach(([id, pos]) => {
        get().updateObjectProp(id, 'position', pos, true);
      });
    } else if (action.type === 'RESTORE_GROUP') {
      const nextObjs = { ...get().editorObjects };
      action.snapshots.forEach(snapshot => {
        nextObjs[snapshot.id] = snapshot;
        const op = { kind: 'CREATE', objectId: snapshot.id, geometry: snapshot.geometry, objType: 'mesh', position: snapshot.position, rotation: snapshot.rotation, scale: snapshot.scale, color: snapshot.color, name: snapshot.name, vectorClock: { ...get().editorVectorClock } };
        get().send({ type: 'EDITOR_OP', sceneId: get().editorSceneId, op });
      });
      set({ editorObjects: nextObjs });
    } else if (action.type === 'DELETE_GROUP') {
      get().deleteObjects(action.objectIds, true);
    } else if (action.type === 'UPDATE_GROUP') {
      Object.entries(action.values).forEach(([id, val]) => {
        get().updateObjectProp(id, action.property, val, true);
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
    const { pendingPlacementAsset } = get();
    if (!pendingPlacementAsset) return;
    const id = uuid();
    get().send({
      type: 'CITY_PLACE_ASSET',
      id,
      name: pendingPlacementAsset.name,
      objects: pendingPlacementAsset.objects,
      col, row, color: pendingPlacementAsset.color,
      width: pendingPlacementAsset.width, height: pendingPlacementAsset.height,
      rotation,
    });
    get().pushCityUndo({ type: 'REMOVE_ASSET', assetId: id });
    get().pushNotif(`Placed "${pendingPlacementAsset.name}" in the city!`);
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
  };
}
