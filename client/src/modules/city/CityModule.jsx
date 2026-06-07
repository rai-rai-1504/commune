import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

const CELL = 34;

const ZONE_META = {
  residential: { color: '#378ADD', label: 'Residential', icon: '🏠' },
  commercial:  { color: '#1D9E75', label: 'Commercial',  icon: '🏪' },
  industrial:  { color: '#E24B4A', label: 'Industrial',  icon: '🏭' },
  green:       { color: '#639922', label: 'Green Space', icon: '🌳' },
  civic:       { color: '#7F77DD', label: 'Civic',       icon: '🏛️' },
  empty:       { color: '#1a2332', label: 'Empty',       icon: '◻️' },
};

const TOOLS = [
  { id: 'select',             label: 'Select',      icon: '🖱️', group: 'tools' },
  { id: 'zone_residential',   label: 'Residential', icon: '🏠', color: '#378ADD', group: 'zone' },
  { id: 'zone_commercial',    label: 'Commercial',  icon: '🏪', color: '#1D9E75', group: 'zone' },
  { id: 'zone_industrial',    label: 'Industrial',  icon: '🏭', color: '#E24B4A', group: 'zone' },
  { id: 'zone_green',         label: 'Green Space', icon: '🌳', color: '#639922', group: 'zone' },
  { id: 'zone_civic',         label: 'Civic',       icon: '🏛️', color: '#7F77DD', group: 'zone' },
  { id: 'road',               label: 'Road',        icon: '🛣️', color: '#445566', group: 'infra' },
  { id: 'erase',              label: 'Erase',       icon: '🗑️', group: 'tools' },
];

// Building shapes per zone, drawn on canvas
function drawBuilding(ctx, x, y, size, zoneType, seed) {
  const c = ZONE_META[zoneType]?.color || '#999';
  const rnd = (s) => { let r = Math.sin(s) * 43758.5453123; return r - Math.floor(r); };
  const floors = Math.floor(rnd(seed) * 3) + 2;
  const bw = size * (0.45 + rnd(seed+1) * 0.25);
  const bh = size * (0.15 * floors);
  const bx = x + (size - bw) / 2;
  const by = y + size - bh - 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(bx + 2, by + 2, bw, bh);

  // Main body
  ctx.fillStyle = c;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(bx, by, bw, bh);

  // Roof highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(bx, by, bw, 2);

  // Windows
  if (size >= 26) {
    ctx.fillStyle = 'rgba(255,255,210,0.6)';
    const cols = Math.max(1, Math.floor(bw / 7));
    const rows = Math.max(1, floors);
    const ww = 3, wh = 3;
    const hgap = (bw - cols * ww) / (cols + 1);
    const vgap = (bh - rows * wh) / (rows + 1);
    for (let r = 0; r < rows; r++) for (let ci = 0; ci < cols; ci++) {
      if (rnd(seed + r * 17 + ci * 5) > 0.25)
        ctx.fillRect(bx + hgap + ci * (ww + hgap), by + vgap + r * (wh + vgap), ww, wh);
    }
  }
  ctx.globalAlpha = 1;
}

export default function CityModule() {
  const {
    city, cityTool, setCityTool, applyCityTool,
    presence, streetView, setStreetView,
    selectedAssetId, selectAsset, removeAsset,
  } = useStore();

  const canvasRef = useRef(null);
  const [painting, setPainting] = useState(false);
  const [offset, setOffset] = useState({ x: 16, y: 16 });
  const [zoom, setZoom] = useState(1.0);
  const [panning, setPanning] = useState(false);
  const panStart = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  const cellSize = CELL * zoom;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !city) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0a1118';
    ctx.fillRect(0, 0, W, H);

    // Cells
    for (let r = 0; r < city.rows; r++) {
      for (let c = 0; c < city.cols; c++) {
        const cell = city.grid[r][c];
        const x = offset.x + c * cellSize;
        const y = offset.y + r * cellSize;
        if (x + cellSize < 0 || x > W || y + cellSize < 0 || y > H) continue;

        if (cell.road) {
          // Road cell
          ctx.fillStyle = '#1e2a38';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          // centre dashes
          ctx.fillRect(x + cellSize/2 - 1, y + 2, 2, cellSize - 4);
          ctx.fillRect(x + 2, y + cellSize/2 - 1, cellSize - 4, 2);
        } else if (cell.zoneType) {
          const meta = ZONE_META[cell.zoneType];
          ctx.fillStyle = meta.color;
          ctx.globalAlpha = 0.18;
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.globalAlpha = 1;
          if (cellSize >= 22) drawBuilding(ctx, x, y, cellSize, cell.zoneType, r * 31 + c * 17);
        } else {
          ctx.fillStyle = '#111922';
          ctx.globalAlpha = 0.5;
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.globalAlpha = 1;
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.035)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    // Placed assets
    (city.placedAssets || []).forEach(asset => {
      const ax = offset.x + asset.col * cellSize;
      const ay = offset.y + asset.row * cellSize;
      const aw = (asset.width || 2) * cellSize;
      const ah = (asset.height || 2) * cellSize;
      const isSelected = asset.id === selectedAssetId;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(ax + 3, ay + 3, aw, ah);

      ctx.fillStyle = asset.color || '#4ECDC4';
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.roundRect?.(ax, ay, aw, ah, 3) || ctx.rect(ax, ay, aw, ah);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = isSelected ? '#fff' : (asset.color || '#4ECDC4');
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect?.(ax, ay, aw, ah, 3) || ctx.rect(ax, ay, aw, ah);
      ctx.stroke();

      if (cellSize >= 20) {
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.9;
        ctx.font = `bold ${Math.max(10, Math.min(13, cellSize * 0.3))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = (asset.name || '🏢').slice(0, 12);
        ctx.fillText(label, ax + aw / 2, ay + ah / 2);
        ctx.globalAlpha = 1;
      }
    });

    // Hover highlight
    if (hovered && cityTool !== 'select') {
      const { col, row } = hovered;
      const hx = offset.x + col * cellSize;
      const hy = offset.y + row * cellSize;
      const toolDef = TOOLS.find(t => t.id === cityTool);
      ctx.fillStyle = toolDef?.color || '#4ECDC4';
      ctx.globalAlpha = 0.22;
      ctx.fillRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = toolDef?.color || '#4ECDC4';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
    }

    // Selected cell highlight
    if (selectedCell) {
      const sx = offset.x + selectedCell.col * cellSize;
      const sy = offset.y + selectedCell.row * cellSize;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);
      ctx.setLineDash([]);
    }
  }, [city, offset, cellSize, hovered, cityTool, selectedAssetId, selectedCell]);

  // Resize + redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      draw();
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas.parentElement);
    return () => obs.disconnect();
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  function cellFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = Math.floor((mx - offset.x) / cellSize);
    const row = Math.floor((my - offset.y) / cellSize);
    if (!city || col < 0 || col >= city.cols || row < 0 || row >= city.rows) return null;
    return { col, row };
  }

  function assetAtCell(col, row) {
    return (city?.placedAssets || []).find(a =>
      col >= a.col && col < a.col + (a.width || 2) &&
      row >= a.row && row < a.row + (a.height || 2)
    );
  }

  function onMouseDown(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning(true);
      panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
      return;
    }
    if (e.button === 0) {
      const cell = cellFromEvent(e);
      if (!cell) return;
      if (cityTool === 'select') {
        setSelectedCell(cell);
        const asset = assetAtCell(cell.col, cell.row);
        selectAsset(asset ? asset.id : null);
        return;
      }
      setPainting(true);
      applyCityTool(cell.col, cell.row);
    }
  }

  function onMouseMove(e) {
    if (panning && panStart.current) {
      setOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }
    const cell = cellFromEvent(e);
    setHovered(cell);
    if (painting && cell && cityTool !== 'select') applyCityTool(cell.col, cell.row);
  }

  function onMouseUp() { setPainting(false); setPanning(false); panStart.current = null; }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.88 : 1.13;
    setZoom(z => Math.max(0.35, Math.min(3.5, z * delta)));
  }

  const stats = city?.stats;
  const popTarget = 30000;
  const selectedAsset = selectedAssetId ? (city?.placedAssets || []).find(a => a.id === selectedAssetId) : null;

  // Zone counts
  const zoneCounts = { residential:0, commercial:0, industrial:0, green:0, civic:0 };
  if (city) for (const row of city.grid) for (const cell of row) if (cell.zoneType && zoneCounts[cell.zoneType] !== undefined) zoneCounts[cell.zoneType]++;

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

      {/* ── Left panel ── */}
      <div className="side-panel">
        <div className="panel-section">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🏙️</span>
            <div>
              <div className="panel-title">{city?.name || 'Loading…'}</div>
              <div className="panel-sub">{presence.length} player{presence.length!==1?'s':''} online</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Population</div>
            <div className="stat-val">{stats?.population?.toLocaleString() || '–'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Happiness</div>
            <div className={`stat-val ${(stats?.happiness||0)>70?'green':(stats?.happiness||0)>45?'amber':'red'}`}>
              {stats?.happiness || '–'}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Treasury</div>
            <div className={`stat-val ${(stats?.treasury||0)>300000?'green':'amber'}`}>
              ₡{stats?.treasury ? (stats.treasury>=1000000 ? (stats.treasury/1000000).toFixed(1)+'M' : Math.round(stats.treasury/1000)+'k') : '–'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Traffic</div>
            <div className={`stat-val ${stats?.traffic==='low'?'green':stats?.traffic==='medium'?'amber':'red'}`}>
              {stats?.traffic || '–'}
            </div>
          </div>
        </div>

        {/* Progress */}
        {stats && (
          <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', marginBottom:3 }}>
              <span>Next unlock</span><span>{stats.population?.toLocaleString()} / 30k</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width:`${Math.min(100,(stats.population/popTarget)*100)}%` }} />
            </div>
          </div>
        )}

        {/* Zone summary */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)' }}>
          <div className="panel-label">Zone Breakdown</div>
          {Object.entries(zoneCounts).map(([type, count]) => (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:ZONE_META[type].color, flexShrink:0 }} />
              <span style={{ flex:1, fontSize:11, color:'var(--text2)' }}>{ZONE_META[type].label}</span>
              <span style={{ fontSize:11, color:'var(--text3)' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Tools */}
        <div className="panel-label" style={{ padding:'10px 12px 4px' }}>Tools</div>
        <div className="tool-group" style={{ paddingTop:2, paddingBottom:4, overflowY:'auto', flex:1 }}>
          {TOOLS.map((t, i) => {
            const prev = TOOLS[i-1];
            const showSep = prev && prev.group !== t.group;
            return (
              <React.Fragment key={t.id}>
                {showSep && <div className="tool-sep" />}
                <button className={`tool-btn ${cityTool===t.id?'active':''}`} onClick={() => setCityTool(t.id)}>
                  <span className="tb-icon">{t.icon}</span>
                  {t.label}
                  {t.color && <span style={{ marginLeft:'auto', width:9, height:9, borderRadius:2, background:t.color, display:'inline-block', flexShrink:0 }} />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)' }}>
          <button className={`btn full ${streetView?'primary':''}`} onClick={() => setStreetView(!streetView)}>
            {streetView ? '🗺️ Map View' : '🚶 Street View'}
          </button>
          <div style={{ fontSize:10, color:'var(--text3)', marginTop:6, lineHeight:1.6 }}>
            Click/drag: paint · Alt+drag: pan · Scroll: zoom
          </div>
        </div>
      </div>

      {/* ── Map / Street view ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {streetView ? (
          <StreetView city={city} onExit={() => setStreetView(false)} />
        ) : (
          <canvas
            ref={canvasRef}
            style={{ display:'block', cursor: panning ? 'grabbing' : cityTool==='select'?'default':'crosshair' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          />
        )}

        {/* Zoom controls */}
        {!streetView && (
          <div style={{ position:'absolute', top:10, right:10, display:'flex', flexDirection:'column', gap:4 }}>
            <button className="btn sm" onClick={() => setZoom(z=>Math.min(3.5,z*1.25))}>＋</button>
            <button className="btn sm" onClick={() => setZoom(z=>Math.max(0.35,z*0.8))}>－</button>
            <button className="btn sm" onClick={() => { setZoom(1); setOffset({x:16,y:16}); }}>⟳</button>
          </div>
        )}

        {/* Cell info tooltip */}
        {hovered && !streetView && (
          <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', background:'rgba(10,17,24,0.92)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 14px', fontSize:11, color:'var(--text2)', pointerEvents:'none', whiteSpace:'nowrap' }}>
            ({hovered.col}, {hovered.row}) · {city?.grid[hovered.row]?.[hovered.col]?.road ? '🛣️ Road' : (city?.grid[hovered.row]?.[hovered.col]?.zoneType ? ZONE_META[city.grid[hovered.row][hovered.col].zoneType]?.label : 'Empty')} · Tool: {TOOLS.find(t=>t.id===cityTool)?.label}
          </div>
        )}

        {/* Legend */}
        {!streetView && (
          <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(10,17,24,0.88)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px' }}>
            {Object.entries(ZONE_META).filter(([k])=>k!=='empty').map(([type,meta]) => (
              <div key={type} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, fontSize:11, color:'var(--text2)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:meta.color, flexShrink:0 }} />
                {meta.label}
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, fontSize:11, color:'var(--text2)' }}>
              <div style={{ width:10, height:10, borderRadius:2, background:'#1e2a38', border:'1px solid #445566', flexShrink:0 }} />
              Road
            </div>
          </div>
        )}
      </div>

      {/* ── Right: asset info panel ── */}
      <div className="side-panel side-panel-right" style={{ width:190 }}>
        <div className="panel-section">
          <div className="panel-label">Placed Buildings</div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--accent)' }}>{city?.placedAssets?.length || 0}</div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {(city?.placedAssets || []).length === 0 && (
            <div style={{ padding:'16px 12px', fontSize:11, color:'var(--text3)', textAlign:'center', lineHeight:1.7 }}>
              No buildings placed.<br />Build something in the<br />3D Editor and publish it!
            </div>
          )}
          {(city?.placedAssets || []).map(asset => (
            <div key={asset.id} onClick={() => selectAsset(asset.id === selectedAssetId ? null : asset.id)}
              style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: asset.id===selectedAssetId ? 'rgba(78,205,196,0.07)' : 'transparent', borderLeft: asset.id===selectedAssetId ? '2px solid var(--accent)' : '2px solid transparent' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:asset.color||'#4ECDC4', flexShrink:0 }} />
                <span style={{ fontSize:12, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{asset.name}</span>
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                @{asset.placedBy} · ({asset.col},{asset.row})
              </div>
            </div>
          ))}
        </div>
        {selectedAsset && (
          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', marginBottom:4 }}>{selectedAsset.name}</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:8 }}>
              Placed by @{selectedAsset.placedBy}<br />
              Position: ({selectedAsset.col}, {selectedAsset.row})<br />
              {selectedAsset.objects?.length || 0} objects
            </div>
            <button className="btn sm danger full" onClick={() => removeAsset(selectedAsset.id)}>Remove Building</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Street View: simple Three.js first-person walk ────────────────────────
function StreetView({ city, onExit }) {
  const mountRef = useRef(null);
  const animRef = useRef(null);
  const keys = useRef({});
  const camRef = useRef(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const isDraggingMouse = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !city) return;

    const W = mount.clientWidth || 600, H = mount.clientHeight || 400;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x87CEEB);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 15, 60);
    scene.background = new THREE.Color(0x87CEEB);

    const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 200);
    camera.position.set(4, 1.7, 4);
    camRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xfffbe0, 1.1);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x9ecce8, 0x335522, 0.4));

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x1a2e1a, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Road grid
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222a33, roughness: 0.9 });
    const cellS = 3.4;
    for (let r = 0; r < city.rows; r++) {
      for (let c = 0; c < city.cols; c++) {
        const cell = city.grid[r][c];
        const wx = c * cellS; const wz = r * cellS;
        if (cell.road) {
          const road = new THREE.Mesh(new THREE.BoxGeometry(cellS, 0.05, cellS), roadMat);
          road.position.set(wx + cellS/2, 0.026, wz + cellS/2);
          scene.add(road);
          // Dashes
          const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
          const dash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, cellS * 0.6), dashMat);
          dash.position.set(wx + cellS/2, 0.032, wz + cellS/2);
          scene.add(dash);
        } else if (cell.zoneType) {
          const meta = ZONE_META[cell.zoneType];
          const color = parseInt(meta.color.replace('#',''), 16);
          const floors = Math.floor(((r*31+c*17) % 3)) + 1;
          const bh = 0.8 + floors * 1.2;
          const bw = cellS * 0.55;
          const buildingMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
          const building = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), buildingMat);
          building.position.set(wx + cellS/2, bh/2, wz + cellS/2);
          building.castShadow = true;
          building.receiveShadow = true;
          scene.add(building);
          // Roof
          const roofMat = new THREE.MeshStandardMaterial({ color: Math.max(0, color - 0x101010), roughness: 0.8 });
          const roof = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.08, bw), roofMat);
          roof.position.set(wx + cellS/2, bh + 0.04, wz + cellS/2);
          scene.add(roof);
        }
      }
    }

    // Placed assets as taller landmarks
    (city.placedAssets || []).forEach(asset => {
      const wx = asset.col * cellS; const wz = asset.row * cellS;
      const aw = (asset.width || 2) * cellS; const ah = (asset.height || 2) * cellS;
      const bh = 4 + Math.random() * 3;
      const color = parseInt((asset.color || '#4ECDC4').replace('#',''), 16);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.12 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(aw * 0.8, bh, ah * 0.8), mat);
      mesh.position.set(wx + aw/2, bh/2, wz + ah/2);
      mesh.castShadow = true;
      scene.add(mesh);
    });

    camera.position.set(city.cols * cellS / 2, 1.7, city.rows * cellS / 2);

    // Input
    const onKey = (e) => { keys.current[e.code] = e.type === 'keydown'; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    const onMouseDown = (e) => { isDraggingMouse.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
      if (!isDraggingMouse.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      yawRef.current -= dx * 0.004;
      pitchRef.current = Math.max(-1.2, Math.min(0.8, pitchRef.current - dy * 0.004));
    };
    const onMouseUp = () => { isDraggingMouse.current = false; };
    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const SPEED = 0.08;
    const dir = new THREE.Vector3();
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const yaw = yawRef.current, pitch = pitchRef.current;
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      dir.set(0, 0, 0);
      if (keys.current['KeyW'] || keys.current['ArrowUp'])    dir.z -= 1;
      if (keys.current['KeyS'] || keys.current['ArrowDown'])  dir.z += 1;
      if (keys.current['KeyA'] || keys.current['ArrowLeft'])  dir.x -= 1;
      if (keys.current['KeyD'] || keys.current['ArrowRight']) dir.x += 1;
      if (dir.lengthSq() > 0) {
        dir.normalize().multiplyScalar(SPEED);
        dir.applyEuler(new THREE.Euler(0, yaw, 0));
        camera.position.add(dir);
        camera.position.y = 1.7;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [city]);

  return (
    <div ref={mountRef} style={{ width:'100%', height:'100%', position:'relative', cursor:'crosshair' }}>
      <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', borderRadius:8, padding:'8px 14px', fontSize:12, color:'#fff', lineHeight:1.8, pointerEvents:'none' }}>
        🚶 <strong>Street View</strong><br />
        WASD / Arrows: walk<br />
        Drag: look around
      </div>
      <button className="btn" style={{ position:'absolute', top:12, right:12, zIndex:10 }} onClick={onExit}>
        🗺️ Back to Map
      </button>
    </div>
  );
}

// Need THREE in StreetView
