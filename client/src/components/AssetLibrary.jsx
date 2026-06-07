import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { v4 as uuid } from 'uuid';

// Prebuilt building templates — collections of primitives
export const TEMPLATES = [
  {
    id: 'house',
    name: 'Simple House',
    icon: '🏠',
    category: 'residential',
    objects: [
      { geometry: 'box',      position: {x:0,y:0.5,z:0},   scale: {x:2,y:1,z:2},    rotation: {x:0,y:0,z:0}, color: '#C8A028', name: 'House_Walls' },
      { geometry: 'wedge',    position: {x:0,y:1.55,z:0},  scale: {x:2.2,y:1,z:2.2},rotation: {x:0,y:0,z:0}, color: '#E24B4A', name: 'House_Roof' },
      { geometry: 'box',      position: {x:0,y:0.25,z:1.01},scale: {x:0.5,y:0.5,z:0.1},rotation: {x:0,y:0,z:0}, color: '#4a3a1a', name: 'House_Door' },
    ],
  },
  {
    id: 'skyscraper',
    name: 'Skyscraper',
    icon: '🏢',
    category: 'commercial',
    objects: [
      { geometry: 'box',   position: {x:0,y:2,z:0},     scale: {x:1.5,y:4,z:1.5},  rotation: {x:0,y:0,z:0}, color: '#378ADD', name: 'Sky_Body' },
      { geometry: 'box',   position: {x:0,y:4.6,z:0},   scale: {x:1.1,y:1.2,z:1.1},rotation: {x:0,y:0,z:0}, color: '#45B7D1', name: 'Sky_Top' },
      { geometry: 'cylinder', position: {x:0,y:5.4,z:0},scale: {x:0.15,y:0.8,z:0.15},rotation: {x:0,y:0,z:0}, color: '#ffffff', name: 'Sky_Antenna' },
    ],
  },
  {
    id: 'office',
    name: 'Office Block',
    icon: '🏬',
    category: 'commercial',
    objects: [
      { geometry: 'box', position: {x:0,y:1.2,z:0},  scale: {x:3,y:2.4,z:2},   rotation: {x:0,y:0,z:0}, color: '#556688', name: 'Office_Body' },
      { geometry: 'box', position: {x:0,y:2.55,z:0}, scale: {x:3.1,y:0.15,z:2.1},rotation: {x:0,y:0,z:0}, color: '#333a4a', name: 'Office_Roof' },
      { geometry: 'box', position: {x:1.1,y:1,z:1.01},scale: {x:0.7,y:0.6,z:0.08},rotation: {x:0,y:0,z:0}, color: '#99bbdd', name: 'Office_Window1' },
      { geometry: 'box', position: {x:-1.1,y:1,z:1.01},scale: {x:0.7,y:0.6,z:0.08},rotation: {x:0,y:0,z:0}, color: '#99bbdd', name: 'Office_Window2' },
    ],
  },
  {
    id: 'factory',
    name: 'Factory',
    icon: '🏭',
    category: 'industrial',
    objects: [
      { geometry: 'box',      position: {x:0,y:0.6,z:0},    scale: {x:3.5,y:1.2,z:2.5}, rotation: {x:0,y:0,z:0}, color: '#667788', name: 'Factory_Body' },
      { geometry: 'cylinder', position: {x:-1.2,y:2,z:0.5}, scale: {x:0.3,y:2.2,z:0.3}, rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Factory_Chimney1' },
      { geometry: 'cylinder', position: {x:-0.4,y:1.8,z:0.5},scale: {x:0.3,y:1.8,z:0.3},rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Factory_Chimney2' },
      { geometry: 'box',      position: {x:0.8,y:1.2,z:0},  scale: {x:1.5,y:2,z:2},     rotation: {x:0,y:0,z:0}, color: '#556677', name: 'Factory_Annex' },
    ],
  },
  {
    id: 'park',
    name: 'Park Feature',
    icon: '🌳',
    category: 'green',
    objects: [
      { geometry: 'cylinder', position: {x:0,y:0.6,z:0},    scale: {x:0.2,y:1.2,z:0.2},  rotation: {x:0,y:0,z:0}, color: '#5a3a1a', name: 'Tree_Trunk' },
      { geometry: 'sphere',   position: {x:0,y:1.7,z:0},    scale: {x:1,y:1.2,z:1},       rotation: {x:0,y:0,z:0}, color: '#2d7a2d', name: 'Tree_Canopy' },
      { geometry: 'cylinder', position: {x:1.5,y:0.5,z:1},  scale: {x:0.18,y:1,z:0.18},  rotation: {x:0,y:0,z:0}, color: '#5a3a1a', name: 'Tree2_Trunk' },
      { geometry: 'sphere',   position: {x:1.5,y:1.4,z:1},  scale: {x:0.85,y:1,z:0.85},  rotation: {x:0,y:0,z:0}, color: '#3a8a3a', name: 'Tree2_Canopy' },
      { geometry: 'box',      position: {x:-0.5,y:0.18,z:-0.8},scale: {x:1.8,y:0.06,z:0.5},rotation: {x:0,y:0,z:0}, color: '#8a7a6a', name: 'Park_Path' },
    ],
  },
  {
    id: 'townhall',
    name: 'Town Hall',
    icon: '🏛️',
    category: 'civic',
    objects: [
      { geometry: 'box',      position: {x:0,y:1,z:0},      scale: {x:4,y:2,z:3},      rotation: {x:0,y:0,z:0}, color: '#c8c0a8', name: 'TH_Body' },
      { geometry: 'box',      position: {x:0,y:2.55,z:0},   scale: {x:2,y:1.1,z:1.5},  rotation: {x:0,y:0,z:0}, color: '#b8b0a0', name: 'TH_Tower' },
      { geometry: 'sphere',   position: {x:0,y:3.35,z:0},   scale: {x:0.6,y:0.5,z:0.6},rotation: {x:0,y:0,z:0}, color: '#c8a028', name: 'TH_Dome' },
      { geometry: 'cylinder', position: {x:-1.5,y:1,z:1.51},scale: {x:0.2,y:2,z:0.2},  rotation: {x:0,y:0,z:0}, color: '#a0988a', name: 'TH_Column1' },
      { geometry: 'cylinder', position: {x:1.5,y:1,z:1.51}, scale: {x:0.2,y:2,z:0.2},  rotation: {x:0,y:0,z:0}, color: '#a0988a', name: 'TH_Column2' },
      { geometry: 'box',      position: {x:0,y:0.15,z:1.51},scale: {x:1,y:0.3,z:0.12}, rotation: {x:0,y:0,z:0}, color: '#4a3a2a', name: 'TH_Door' },
    ],
  },
  {
    id: 'apartment',
    name: 'Apartment Block',
    icon: '🏘️',
    category: 'residential',
    objects: [
      { geometry: 'box', position: {x:0,y:1.5,z:0},    scale: {x:2.5,y:3,z:2},   rotation: {x:0,y:0,z:0}, color: '#d4b896', name: 'Apt_Body' },
      { geometry: 'box', position: {x:0,y:3.1,z:0},    scale: {x:2.6,y:0.2,z:2.1},rotation: {x:0,y:0,z:0}, color: '#b09070', name: 'Apt_Roof' },
      { geometry: 'box', position: {x:0.7,y:1.5,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win1' },
      { geometry: 'box', position: {x:-0.7,y:1.5,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win2' },
      { geometry: 'box', position: {x:0.7,y:0.6,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win3' },
      { geometry: 'box', position: {x:-0.7,y:0.6,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win4' },
    ],
  },
  {
    id: 'station',
    name: 'Metro Station',
    icon: '🚇',
    category: 'civic',
    objects: [
      { geometry: 'box',      position: {x:0,y:0.3,z:0},    scale: {x:4,y:0.6,z:2.5},  rotation: {x:0,y:0,z:0}, color: '#445566', name: 'Stn_Platform' },
      { geometry: 'box',      position: {x:0,y:1.2,z:0},    scale: {x:4,y:1.2,z:0.1},  rotation: {x:0,y:0,z:0}, color: '#334455', name: 'Stn_BackWall' },
      { geometry: 'cylinder', position: {x:-1.6,y:1.1,z:0}, scale: {x:0.12,y:1.6,z:0.12},rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Stn_Pole1' },
      { geometry: 'cylinder', position: {x:1.6,y:1.1,z:0},  scale: {x:0.12,y:1.6,z:0.12},rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Stn_Pole2' },
      { geometry: 'box',      position: {x:0,y:1.95,z:0},   scale: {x:4,y:0.1,z:2.2},  rotation: {x:0,y:0,z:0}, color: '#4ECDC4', name: 'Stn_Canopy' },
    ],
  },
];

const CATEGORY_FILTER = ['all', 'residential', 'commercial', 'industrial', 'green', 'civic'];

export default function AssetLibrary({ onClose }) {
  const { addObject, updateObjectProp, editorObjects } = useStore();
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t =>
    (catFilter === 'all' || t.category === catFilter) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  function loadTemplate(template) {
    // Clear nothing — just add all objects from template
    const idMap = {};
    template.objects.forEach(obj => {
      const newId = uuid();
      idMap[obj.name] = newId;
      // We call addObject just for the base geometry then override props
      // Actually we need to directly inject — use store's addObject pattern
      const { editorSceneId } = useStore.getState();
      const op = {
        kind: 'CREATE', objectId: newId, geometry: obj.geometry, objType: 'mesh',
        position: obj.position, rotation: obj.rotation, scale: obj.scale,
        color: obj.color, name: obj.name,
        vectorClock: { ...useStore.getState().editorVectorClock },
      };
      useStore.setState(state => ({
        editorObjects: {
          ...state.editorObjects,
          [newId]: {
            id: newId, type: 'mesh', geometry: obj.geometry,
            position: obj.position, rotation: obj.rotation, scale: obj.scale,
            color: obj.color, name: obj.name,
            createdBy: state.username, timestamp: Date.now(),
          },
        },
        selectedObjectId: newId,
      }));
      useStore.getState().send({ type: 'EDITOR_OP', sceneId: editorSceneId, op });
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 540, maxHeight: '80vh' }}>
        <div className="modal-header">
          <div className="modal-title">📚 Asset Library</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            className="form-input"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {CATEGORY_FILTER.map(c => (
            <button
              key={c}
              className={`btn sm ${catFilter === c ? 'primary' : ''}`}
              onClick={() => setCatFilter(c)}
              style={{ textTransform: 'capitalize' }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => loadTemplate(t)}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; e.currentTarget.style.background = 'var(--bg4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>
                {t.category} · {t.objects.length} objects
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>
              No templates match your search.
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text3)' }}>
          Templates add objects to your current scene. Use as a starting point and customize from there.
        </div>
      </div>
    </div>
  );
}
