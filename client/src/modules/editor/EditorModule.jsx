import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import AssetLibrary from '../../components/AssetLibrary';

// ── Geometry cache ─────────────────────────────────────────────────────────
const GEO = {};
function getGeo(type) {
  if (!GEO[type]) {
    switch (type) {
      case 'sphere':   GEO[type] = new THREE.SphereGeometry(0.5, 24, 18); break;
      case 'cylinder': GEO[type] = new THREE.CylinderGeometry(0.4, 0.4, 1, 20); break;
      case 'cone':     GEO[type] = new THREE.ConeGeometry(0.5, 1, 20); break;
      case 'torus':    GEO[type] = new THREE.TorusGeometry(0.38, 0.16, 14, 28); break;
      case 'wedge': {
        const g = new THREE.BufferGeometry();
        const v = new Float32Array([
          -0.5,0,-0.5,  0.5,0,-0.5,  0.5,0,0.5,  -0.5,0,0.5,
          -0.5,1,-0.5,  0.5,1,-0.5,
        ]);
        const idx = [0,1,2, 0,2,3, 0,1,5, 0,5,4, 0,4,3, 1,2,5, 3,4,5, 2,3,5];
        g.setAttribute('position', new THREE.BufferAttribute(v, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        GEO[type] = g;
        break;
      }
      default: GEO[type] = new THREE.BoxGeometry(1, 1, 1);
    }
  }
  return GEO[type];
}

const GEOMETRY_LIST = [
  { id: 'box', label: '⬜ Cube' },
  { id: 'sphere', label: '⚪ Sphere' },
  { id: 'cylinder', label: '🥫 Cylinder' },
  { id: 'cone', label: '🔺 Cone' },
  { id: 'torus', label: '⭕ Torus' },
  { id: 'wedge', label: '📐 Wedge' },
];

export default function EditorModule() {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshMapRef = useRef({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVec = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0,1,0), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const isDragging = useRef(false);
  const isOrbiting = useRef(false);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const orb = useRef({ theta: 0.7, phi: 1.0, radius: 12, lastX: 0, lastY: 0 });
  const animRef = useRef(null);
  const [showPublish, setShowPublish] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const {
    editorObjects, selectedObjectId, editorTool,
    addObject, deleteObject, duplicateObject, selectObject,
    updateObjectProp, setEditorTool, publishToCity, clearScene,
    undo, username,
  } = useStore();

  // ── Init Three.js ─────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 600, H = mount.clientHeight || 500;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0c1018);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c1018, 0.025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const sun = new THREE.DirectionalLight(0xfff8e7, 1.2);
    sun.position.set(10, 16, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -15;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4ECDC4, 0.4);
    fill.position.set(-8, 5, -8);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0x334466, 0x0c1018, 0.3));

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x111822, roughness: 0.98, metalness: 0.0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = '__ground';
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(40, 40, 0x1a2535, 0x161f2e);
    grid.position.y = 0.001;
    scene.add(grid);

    // Small axis indicator in corner
    const axesHelper = new THREE.AxesHelper(1.5);
    axesHelper.position.set(-14, 0.01, -14);
    scene.add(axesHelper);

    updateCameraPos();

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ── Sync objects → Three.js ───────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const ids = new Set(Object.keys(editorObjects));
    const existing = new Set(Object.keys(meshMapRef.current));

    // Remove stale meshes
    for (const id of existing) {
      if (!ids.has(id)) {
        const mesh = meshMapRef.current[id];
        scene.remove(mesh);
        mesh.material.dispose();
        delete meshMapRef.current[id];
      }
    }

    // Add / update
    for (const id of ids) {
      const obj = editorObjects[id];
      if (!meshMapRef.current[id]) {
        const mat = new THREE.MeshStandardMaterial({
          color: obj.color, roughness: 0.65, metalness: 0.08,
        });
        const mesh = new THREE.Mesh(getGeo(obj.geometry), mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = id;
        scene.add(mesh);
        meshMapRef.current[id] = mesh;
      }
      const mesh = meshMapRef.current[id];
      mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
      mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
      mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
      mesh.material.color.set(obj.color);
      const sel = id === selectedObjectId;
      mesh.material.emissive.set(sel ? 0x4ECDC4 : 0x000000);
      mesh.material.emissiveIntensity = sel ? 0.28 : 0;
    }
  }, [editorObjects, selectedObjectId]);

  function updateCameraPos() {
    const { theta, phi, radius } = orb.current;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    if (cameraRef.current) {
      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(0, 0, 0);
    }
  }

  function canvasMouse(e) {
    const rect = mountRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }

  function onMouseDown(e) {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    if (e.button === 2 || e.button === 1 || (e.button === 0 && e.altKey)) {
      isOrbiting.current = true;
      orb.current.lastX = e.clientX;
      orb.current.lastY = e.clientY;
      return;
    }
    if (e.button === 0) {
      const m = canvasMouse(e);
      mouseVec.current.set(m.x, m.y);
      raycasterRef.current.setFromCamera(mouseVec.current, cameraRef.current);
      const meshes = Object.values(meshMapRef.current);
      const hits = raycasterRef.current.intersectObjects(meshes);
      if (hits.length) {
        const hit = hits[0];
        selectObject(hit.object.name);
        if (editorTool === 'move') {
          isDragging.current = true;
          dragPlane.current.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0), hit.point);
          const pt = new THREE.Vector3();
          raycasterRef.current.ray.intersectPlane(dragPlane.current, pt);
          dragOffset.current.copy(pt).sub(hit.object.position);
        }
      } else {
        selectObject(null);
      }
    }
  }

  function onMouseMove(e) {
    if (isOrbiting.current) {
      const dx = e.clientX - orb.current.lastX;
      const dy = e.clientY - orb.current.lastY;
      orb.current.lastX = e.clientX;
      orb.current.lastY = e.clientY;
      orb.current.theta -= dx * 0.012;
      orb.current.phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.04, orb.current.phi - dy * 0.012));
      updateCameraPos();
      return;
    }
    if (isDragging.current && selectedObjectId) {
      const m = canvasMouse(e);
      mouseVec.current.set(m.x, m.y);
      raycasterRef.current.setFromCamera(mouseVec.current, cameraRef.current);
      const pt = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(dragPlane.current, pt)) {
        const newP = pt.sub(dragOffset.current);
        const cur = editorObjects[selectedObjectId];
        if (cur) updateObjectProp(selectedObjectId, 'position', { x: +newP.x.toFixed(2), y: cur.position.y, z: +newP.z.toFixed(2) });
      }
    }
  }

  function onMouseUp() { isDragging.current = false; isOrbiting.current = false; }

  function onWheel(e) {
    orb.current.radius = Math.max(2.5, Math.min(35, orb.current.radius + e.deltaY * 0.02));
    updateCameraPos();
  }

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (!selectedObjectId) return;
    const obj = editorObjects[selectedObjectId];
    if (!obj) return;
    const S = 0.25, R = 0.15, SF = 1.12;
    e.preventDefault();
    if (e.key === 'Delete' || e.key === 'Backspace') { deleteObject(selectedObjectId); return; }
    if (e.key === 'd' && (e.metaKey || e.ctrlKey)) { duplicateObject(selectedObjectId); return; }
    const pos = { ...obj.position };
    const rot = { ...obj.rotation };
    const scl = { ...obj.scale };
    if (e.key === 'ArrowLeft')  updateObjectProp(selectedObjectId, 'position', { ...pos, x: pos.x - S });
    if (e.key === 'ArrowRight') updateObjectProp(selectedObjectId, 'position', { ...pos, x: pos.x + S });
    if (e.key === 'ArrowUp')    updateObjectProp(selectedObjectId, 'position', { ...pos, z: pos.z - S });
    if (e.key === 'ArrowDown')  updateObjectProp(selectedObjectId, 'position', { ...pos, z: pos.z + S });
    if (e.key === 'q') updateObjectProp(selectedObjectId, 'rotation', { ...rot, y: rot.y - R });
    if (e.key === 'e') updateObjectProp(selectedObjectId, 'rotation', { ...rot, y: rot.y + R });
    if (e.key === 'f') updateObjectProp(selectedObjectId, 'position', { ...pos, y: pos.y + S });
    if (e.key === 'v') updateObjectProp(selectedObjectId, 'position', { ...pos, y: Math.max(0.01, pos.y - S) });
    if (e.key === 'w') { const s = +(scl.x * SF).toFixed(3); updateObjectProp(selectedObjectId, 'scale', { x:s,y:s,z:s }); }
    if (e.key === 's') { const s = +(scl.x / SF).toFixed(3); updateObjectProp(selectedObjectId, 'scale', { x:s,y:s,z:s }); }
  }

  const objList = Object.values(editorObjects);
  const selected = selectedObjectId ? editorObjects[selectedObjectId] : null;

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }} tabIndex={0} onKeyDown={onKeyDown} style={{ display:'flex', flex:1, overflow:'hidden', outline:'none' }}>

      {/* ── Left panel ── */}
      <div className="side-panel">
        <div className="panel-section">
          <div className="panel-label">Add Geometry</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
            {GEOMETRY_LIST.map(g => (
              <button key={g.id} className="btn sm" onClick={() => addObject(g.id)} style={{ justifyContent:'center', fontSize:11 }}>
                {g.label}
              </button>
            ))}
          </div>
          <button className="btn primary full" style={{ marginTop:8 }} onClick={() => setShowLibrary(true)}>
            📚 Template Library
          </button>
        </div>

        <div className="panel-section">
          <div className="panel-label">Tools</div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {[
              { id:'select', icon:'↖', label:'Select', hint:'Click objects' },
              { id:'move',   icon:'✥', label:'Move',   hint:'Drag selected' },
            ].map(t => (
              <button key={t.id} className={`tool-btn ${editorTool===t.id?'active':''}`} onClick={() => setEditorTool(t.id)}>
                <span style={{ width:18, textAlign:'center', fontSize:15 }}>{t.icon}</span>
                {t.label}
                <span style={{ marginLeft:'auto', fontSize:10, opacity:0.4 }}>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px 2px' }}>
          <div className="panel-label" style={{ marginBottom:0 }}>Objects ({objList.length})</div>
          {objList.length > 0 && (
            <button className="btn sm danger" onClick={clearScene} style={{ padding:'2px 8px', fontSize:10 }}>Clear</button>
          )}
        </div>
        <div className="obj-list">
          {objList.map(obj => (
            <div key={obj.id} className={`obj-item ${selectedObjectId===obj.id?'selected':''}`} onClick={() => selectObject(obj.id)}>
              <div className="obj-dot" style={{ background:obj.color }} />
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:11 }}>{obj.name}</span>
              <span style={{ fontSize:10, opacity:0.35 }}>{obj.geometry}</span>
            </div>
          ))}
          {!objList.length && (
            <div style={{ padding:'16px 12px', fontSize:11, color:'var(--text3)', textAlign:'center', lineHeight:1.7 }}>
              No objects.<br />Add one above.
            </div>
          )}
        </div>

        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', marginTop:'auto', display:'flex', flexDirection:'column', gap:6 }}>
          {selected && (
            <>
              <button className="btn sm" style={{ justifyContent:'center' }} onClick={() => duplicateObject(selectedObjectId)}>⧉ Duplicate</button>
              <button className="btn sm danger" style={{ justifyContent:'center' }} onClick={() => deleteObject(selectedObjectId)}>🗑 Delete</button>
            </>
          )}
          <button className="btn sm" style={{ justifyContent:'center' }} onClick={undo}>↩ Undo (⌘Z)</button>
          <button className="btn primary" style={{ justifyContent:'center' }} onClick={() => setShowPublish(true)}>↑ Publish to City</button>
        </div>
      </div>

      {/* ── Viewport ── */}
      <div
        ref={mountRef}
        style={{ flex:1, position:'relative', overflow:'hidden', cursor: isOrbiting.current ? 'grabbing' : editorTool==='move' ? 'grab' : 'default' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
      >
        {/* HUD hints */}
        <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', background:'rgba(12,16,24,0.85)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 14px', fontSize:11, color:'var(--text3)', pointerEvents:'none', whiteSpace:'nowrap' }}>
          RMB / Alt+drag: orbit · Scroll: zoom · Arrow keys: move · Q/E: rotate · W/S: scale · F/V: up/down · Del: delete
        </div>
        {/* Object count badge */}
        <div style={{ position:'absolute', top:10, left:10, background:'rgba(12,16,24,0.75)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 10px', fontSize:11, color:'var(--text2)' }}>
          {objList.length} object{objList.length!==1?'s':''}
        </div>
      </div>

      {/* ── Right properties panel ── */}
      <div className="side-panel side-panel-right">
        {selected ? (
          <>
            <div className="panel-section">
              <div className="panel-title" style={{ wordBreak:'break-all' }}>{selected.name}</div>
              <div className="panel-sub">@{selected.createdBy} · {selected.geometry}</div>
            </div>

            <PropSection title="Position" obj={selected} prop="position" fields={['x','y','z']} id={selectedObjectId} update={updateObjectProp} step={0.1} />
            <PropSection title="Rotation" obj={selected} prop="rotation" fields={['x','y','z']} id={selectedObjectId} update={updateObjectProp} step={0.05} deg />
            <PropSection title="Scale" obj={selected} prop="scale" fields={['x','y','z']} id={selectedObjectId} update={updateObjectProp} step={0.05} />

            <div className="panel-section">
              <div className="panel-label">Color</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <input type="color" value={selected.color}
                  onChange={e => updateObjectProp(selectedObjectId,'color',e.target.value)}
                  style={{ width:32, height:28, border:'none', borderRadius:4, cursor:'pointer', background:'transparent', padding:0 }} />
                <input className="form-input" value={selected.color}
                  onChange={e => updateObjectProp(selectedObjectId,'color',e.target.value)}
                  style={{ fontFamily:'monospace', fontSize:11 }} />
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F7DC6F','#C8A028','#378ADD','#E24B4A','#fff','#888'].map(c => (
                  <div key={c} onClick={() => updateObjectProp(selectedObjectId,'color',c)}
                    style={{ width:20, height:20, borderRadius:3, background:c, cursor:'pointer', border:selected.color===c?'2px solid var(--accent)':'1px solid rgba(255,255,255,0.15)', flexShrink:0 }} />
                ))}
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-label">Name</div>
              <input className="form-input" value={selected.name}
                onChange={e => updateObjectProp(selectedObjectId,'name',e.target.value)} />
            </div>
          </>
        ) : (
          <div style={{ padding:'24px 16px', fontSize:12, color:'var(--text3)', textAlign:'center', lineHeight:1.9 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>✏️</div>
            <strong style={{ color:'var(--text2)' }}>Select an object</strong>
            <br />to edit properties
            <br /><br />
            <div style={{ textAlign:'left', background:'var(--bg3)', borderRadius:8, padding:'12px 14px', fontSize:11, lineHeight:2 }}>
              <strong style={{ color:'var(--text2)' }}>Keyboard shortcuts</strong><br />
              Arrow keys → move XZ<br />
              F / V → move up / down<br />
              Q / E → rotate Y<br />
              W / S → scale ±<br />
              Del → delete<br />
              ⌘D → duplicate<br />
              ⌘Z → undo
            </div>
          </div>
        )}
      </div>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} onPublish={name => { publishToCity(name); setShowPublish(false); }} count={objList.length} />}
      {showLibrary && <AssetLibrary onClose={() => setShowLibrary(false)} />}
    </div>
  );
}

function PropSection({ title, obj, prop, fields, id, update, step, deg }) {
  return (
    <div className="panel-section">
      <div className="panel-label">{title}</div>
      {fields.map(f => {
        const raw = obj[prop][f];
        const display = deg ? +(raw * 180 / Math.PI).toFixed(1) : +raw.toFixed(3);
        return (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:10, color:'var(--text3)', width:12, textAlign:'center', fontWeight:700, textTransform:'uppercase' }}>{f}</span>
            <input
              className="form-input"
              style={{ fontFamily:'monospace', fontSize:11, padding:'3px 6px' }}
              type="number" step={step || 0.1} value={display}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) update(id, prop, { ...obj[prop], [f]: deg ? v * Math.PI / 180 : v });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function PublishModal({ onClose, onPublish, count }) {
  const [name, setName] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Publish to City</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, marginBottom:16 }}>
          Place your scene ({count} object{count!==1?'s':''}) as a building in Nova Arcadia. It will appear as a placed asset on the city map.
        </p>
        <div className="form-group">
          <label className="form-label">Building name</label>
          <input className="form-input" placeholder={`e.g. City Hall, Park Pavilion...`} value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onPublish(name || undefined)}>Publish to City →</button>
        </div>
      </div>
    </div>
  );
}
