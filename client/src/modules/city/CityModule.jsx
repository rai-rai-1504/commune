import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SUBTRACTION, ADDITION, Evaluator, Brush } from 'three-bvh-csg';
import { useStore, PRESET_PALETTES, randomizeObjectsColor } from '../../store/useStore';
import { TEMPLATES } from '../../components/AssetLibrary';
import BuildingThumbnail from './BuildingThumbnail';
import Icon from '../../components/Icon';
const formatGameTime = (minutes) => {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mmStr = m.toString().padStart(2, '0');
  let period = 'DAWN';
  if (h24 >= 8 && h24 < 17) period = 'DAY';
  else if (h24 >= 17 && h24 < 19) period = 'DUSK';
  else if (h24 >= 19 || h24 < 6) period = 'NIGHT';
  return `${h12}:${mmStr} ${ampm}  ·  ${period}`;
};


function SmoothColorPicker({ value, onChange, disabled, style }) {
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleChange = (e) => {
      onChange({ target: { value: e.target.value } });
    };

    input.addEventListener('change', handleChange);
    return () => {
      input.removeEventListener('change', handleChange);
    };
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      type="color"
      value={localVal}
      disabled={disabled}
      onChange={(e) => setLocalVal(e.target.value)}
      style={style}
    />
  );
}

const CELL = 34;

// Cache for road curves to prevent massive GC pressure and CPU overhead in the render loops
const roadCurveCache = new Map();

function getRoadSamples(roadId, roadPoints) {
  if (!roadPoints || roadPoints.length < 2) return [];
  const hash = roadPoints.map(p => `${p.x},${p.z}`).join('|');
  const cached = roadCurveCache.get(roadId);
  if (cached && cached.hash === hash) {
    return cached.samples;
  }
  const points3d = roadPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
  const curve = new THREE.CatmullRomCurve3(points3d);
  const samples = curve.getPoints(Math.max(30, roadPoints.length * 10));
  roadCurveCache.set(roadId, { hash, samples });
  return samples;
}

function getAdjustedAssetPosition(asset, roads) {
  if (!roads || roads.length === 0) return { col: asset.col, row: asset.row };
  
  let closestDist = Infinity;
  let closestNormal = { x: 0, z: 0 };
  let closestRoadType = 'standard';
  
  const p = { x: asset.col, z: asset.row };
  
  roads.forEach(road => {
    if (road.points.length < 2) return;
    
    const samples = getRoadSamples(road.id, road.points);
    if (!samples || samples.length < 2) return;
    
    for (let i = 0; i < samples.length - 1; i++) {
      const a = { x: samples[i].x, z: samples[i].z };
      const b = { x: samples[i+1].x, z: samples[i+1].z };
      
      const l2 = (a.x - b.x)**2 + (a.z - b.z)**2;
      let t = 0;
      if (l2 > 0) {
        t = ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / l2;
        t = Math.max(0, Math.min(1, t));
      }
      const proj = {
        x: a.x + t * (b.x - a.x),
        z: a.z + t * (b.z - a.z)
      };
      
      const dx = p.x - proj.x;
      const dz = p.z - proj.z;
      const d = Math.sqrt(dx*dx + dz*dz);
      
      if (d < closestDist) {
        closestDist = d;
        closestRoadType = road.roadType || 'standard';
        if (d > 0.0001) {
          closestNormal = { x: dx / d, z: dz / d };
        } else {
          closestNormal = { x: 0, z: 0 };
        }
      }
    }
  });
  
  const getRadii = (type) => {
    switch (type) {
      case 'highway': return { oldR: 2.2, newR: 6.0 };
      case 'avenue': return { oldR: 2.0, newR: 4.0 };
      case 'multilane': return { oldR: 1.5, newR: 3.0 };
      case 'cyberway': return { oldR: 1.1, newR: 2.2 };
      case 'dirt': return { oldR: 0.75, newR: 1.5 };
      case 'railway': return { oldR: 1.2, newR: 2.4 };
      case 'brick': return { oldR: 0.9, newR: 1.8 };
      default: return { oldR: 0.9, newR: 1.8 };
    }
  };
  
  const { oldR, newR } = getRadii(closestRoadType);
  const deltaRadius = newR - oldR;
  
  if (closestDist < 6.0 && deltaRadius > 0) {
    return {
      col: asset.col + closestNormal.x * deltaRadius,
      row: asset.row + closestNormal.z * deltaRadius
    };
  }
  
  return { col: asset.col, row: asset.row };
}

function findIntersections(roads) {
  if (!roads || roads.length < 2) return [];
  
  const roadCurves = roads.map(r => {
    if (r.points.length < 2) return null;
    const samples = getRoadSamples(r.id, r.points);
    const radius = r.roadType === 'highway' ? 6.0 
                 : r.roadType === 'avenue' ? 4.0
                 : r.roadType === 'multilane' ? 3.0 
                 : r.roadType === 'cyberway' ? 2.2
                 : r.roadType === 'dirt' ? 1.5 
                 : 1.8;
    return { id: r.id, type: r.roadType || 'standard', radius, samples };
  }).filter(Boolean);

  const rawPoints = [];

  for (let i = 0; i < roadCurves.length; i++) {
    const rA = roadCurves[i];
    for (let j = i + 1; j < roadCurves.length; j++) {
      const rB = roadCurves[j];
      
      let closestDist = Infinity;
      let closestPt = null;

      for (let pA of rA.samples) {
        for (let pB of rB.samples) {
          const dx = pA.x - pB.x;
          const dz = pA.z - pB.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < 0.25 && d < closestDist) {
            closestDist = d;
            closestPt = { x: (pA.x + pB.x) / 2, z: (pA.z + pB.z) / 2 };
          }
        }
      }

      if (closestPt) {
        rawPoints.push({ x: closestPt.x, z: closestPt.z, roads: [rA.id, rB.id] });
      }
    }
  }

  const nodes = [];
  rawPoints.forEach(pt => {
    let merged = false;
    for (let n of nodes) {
      const dx = n.x - pt.x;
      const dz = n.z - pt.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.6) {
        pt.roads.forEach(rId => {
          if (!n.roads.includes(rId)) n.roads.push(rId);
        });
        merged = true;
        break;
      }
    }
    if (!merged) {
      nodes.push({ x: pt.x, z: pt.z, roads: [...pt.roads] });
    }
  });

  return nodes.map((n, idx) => {
    let maxRadiusMeters = 0.9;
    let primaryRoadType = 'standard';
    
    n.roads.forEach(rId => {
      const r = roadCurves.find(rc => rc.id === rId);
      if (r) {
        if (r.radius > maxRadiusMeters) {
          maxRadiusMeters = r.radius;
          primaryRoadType = r.type;
        }
      }
    });

    let color = '#475569';
    if (primaryRoadType === 'dirt') color = '#8b5a2b';
    else if (primaryRoadType === 'brick') color = '#a63a3a';
    else if (primaryRoadType === 'highway') color = '#1e293b';

    return {
      id: `node_${idx}`,
      x: n.x,
      z: n.z,
      radiusGrid: maxRadiusMeters / 3.4,
      radiusMeters: maxRadiusMeters,
      roads: n.roads,
      color,
      primaryRoadType
    };
  });
}

function isSampleCulled(pt, roadId, intersections) {
  for (const node of intersections) {
    if (!node.roads.includes(roadId)) continue;
    const dx = pt.x - node.x;
    const dz = pt.z - node.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < node.radiusGrid * node.radiusGrid) {
      return true;
    }
  }
  return false;
}

const createGrassTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Base grass color
  ctx.fillStyle = '#689f38';
  ctx.fillRect(0, 0, 256, 256);

  // Add noise/blades
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const len = 2 + Math.random() * 3;
    const angle = (Math.random() - 0.5) * 0.2;
    
    // Vary shade of green
    const green = 110 + Math.floor(Math.random() * 40);
    ctx.strokeStyle = `rgb(${Math.floor(green*0.55)}, ${green}, ${Math.floor(green*0.35)})`;
    ctx.lineWidth = 0.8 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1000, 1000);
  return texture;
};

const createAsphaltTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Base asphalt grey
  ctx.fillStyle = '#2a2e35';
  ctx.fillRect(0, 0, 128, 128);

  // Fine speckles
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const size = 0.5 + Math.random() * 0.8;
    const shade = 30 + Math.floor(Math.random() * 15);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const createDirtTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Dirt brown
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, 0, 128, 128);

  // Pebbles and grit
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const size = 0.6 + Math.random() * 1.4;
    const shade = 80 + Math.floor(Math.random() * 30);
    ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.68)}, ${Math.floor(shade * 0.38)})`;
    ctx.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const createBrickTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Brick red
  ctx.fillStyle = '#a63a3a';
  ctx.fillRect(0, 0, 128, 128);

  // Add some brick texture variation
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const size = 1.0 + Math.random() * 2.0;
    const shade = 140 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.3)}, ${Math.floor(shade * 0.3)})`;
    ctx.fillRect(x, y, size, size);
  }

  // Draw mortar joints
  ctx.fillStyle = '#bababa'; // Light grey mortar
  
  // Horizontal mortar lines
  for (let y = 0; y < 128; y += 16) {
    ctx.fillRect(0, y, 128, 1.5);
  }

  // Vertical mortar joints (staggered)
  for (let y = 0; y < 128; y += 16) {
    const isStaggered = (y % 32 === 0);
    const startX = isStaggered ? 0 : 16;
    for (let x = startX; x < 128; x += 32) {
      ctx.fillRect(x, y, 1.5, 16);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const SHAPE_FACES = {
  box: ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'],
  cylinder: ['Side', 'Top', 'Bottom'],
  cone: ['Side', 'Bottom']
};

const ZONE_META = {
  residential: { color: '#3b82f6', label: 'Residential', icon: '🏠' },
  commercial:  { color: '#10b981', label: 'Commercial',  icon: '🏪' },
  industrial:  { color: '#f59e0b', label: 'Industrial',  icon: '🏭' },
  green:       { color: '#84cc16', label: 'Green Space', icon: '🌳' },
  civic:       { color: '#8b5cf6', label: 'Civic',       icon: '🏛️' },
  empty:       { color: '#cbd5e1', label: 'Empty',       icon: '◻️' },
};

function distanceToSegment(p, a, b) {
  const l2 = (a.x - b.x)**2 + (a.z - b.z)**2;
  if (l2 === 0) return Math.sqrt((p.x - a.x)**2 + (p.z - a.z)**2);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((p.x - (a.x + t * (b.x - a.x)))**2 + (p.z - (a.z + t * (b.z - a.z)))**2);
}

const TOOLS = [
  { id: 'select',             label: 'Select',      icon: '🖱️', group: 'tools' },
  { id: 'road',               label: 'Road',        icon: '🛣️', color: '#445566', group: 'infra' },
  { id: 'pencil',             label: 'Zone Pencil', icon: '✏️', group: 'tools' },
  { id: 'erase',              label: 'Erase',       icon: '🗑️', group: 'tools' },
];



const STREET_GEO = {};
function getStreetGeo(type) {
  if (!STREET_GEO[type]) {
    switch (type) {
      case 'sphere':   STREET_GEO[type] = new THREE.SphereGeometry(0.5, 16, 12); break;
      case 'cylinder': STREET_GEO[type] = new THREE.CylinderGeometry(0.4, 0.4, 1, 16); break;
      case 'cone':     STREET_GEO[type] = new THREE.ConeGeometry(0.5, 1, 16); break;
      case 'torus':    STREET_GEO[type] = new THREE.TorusGeometry(0.38, 0.16, 8, 16); break;
      case 'wedge': {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array([
          // Bottom face (y = 0, normal points down: 0, -1, 0)
          -0.5, 0, -0.5,   0.5, 0,  0.5,  -0.5, 0,  0.5,
          -0.5, 0, -0.5,   0.5, 0, -0.5,   0.5, 0,  0.5,
          // Back face (z = -0.5, normal points back: 0, 0, -1)
          -0.5, 0, -0.5,   0.5, 1, -0.5,   0.5, 0, -0.5,
          -0.5, 0, -0.5,  -0.5, 1, -0.5,   0.5, 1, -0.5,
          // Left face (x = -0.5, normal points left: -1, 0, 0)
          -0.5, 0, -0.5,  -0.5, 0,  0.5,  -0.5, 1, -0.5,
          // Right face (x = 0.5, normal points right: 1, 0, 0)
           0.5, 0, -0.5,   0.5, 1, -0.5,   0.5, 0,  0.5,
          // Slanted front face (normal points up/forward: 0, 0.707, 0.707)
          -0.5, 0,  0.5,   0.5, 0,  0.5,   0.5, 1, -0.5,
          -0.5, 0,  0.5,   0.5, 1, -0.5,  -0.5, 1, -0.5,
        ]);
        const uvs = new Float32Array([
          // Bottom face
          0, 0,   1, 1,   0, 1,
          0, 0,   1, 0,   1, 1,
          // Back face
          0, 0,   1, 1,   1, 0,
          0, 0,   0, 1,   1, 1,
          // Left face
          0, 0,   1, 0,   0, 1,
          // Right face
          0, 0,   0, 1,   1, 0,
          // Slanted face
          0, 0,   1, 0,   1, 1,
          0, 0,   1, 1,   0, 1,
        ]);
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        g.computeVertexNormals();
        STREET_GEO[type] = g;
        break;
      }
      default: STREET_GEO[type] = new THREE.BoxGeometry(1, 1, 1);
    }
  }
  return STREET_GEO[type];
}

const cityCSGEvaluator = new Evaluator();

const cityCSGGeometriesSet = new Set();
const cityCSGGeometryCache = new Map();

const getCityCSGKey = (obj) => {
  return (obj.children || []).map(c => 
    `${c.id}_${c.geometry}_${c.color}_${c.isSubtractive}_` +
    `${c.position?.x},${c.position?.y},${c.position?.z}_` +
    `${c.rotation?.x},${c.rotation?.y},${c.rotation?.z}_` +
    `${c.scale?.x},${c.scale?.y},${c.scale?.z}` +
    (c.geometry === 'csg' ? `_CSG_${getCityCSGKey(c)}` : '')
  ).join('|');
};

function buildCSGGeometryInStreetView(obj) {
  const cacheKey = getCityCSGKey(obj);
  if (cityCSGGeometryCache.has(cacheKey)) {
    const cached = cityCSGGeometryCache.get(cacheKey);
    const materials = Array.isArray(cached.materials)
      ? cached.materials.map(m => m.clone())
      : cached.materials.clone();
    return { geometry: cached.geometry, materials };
  }

  const children = obj.children || [];
  if (children.length === 0) {
    return { geometry: new THREE.BoxGeometry(0.1, 0.1, 0.1), materials: new THREE.MeshStandardMaterial({ color: 0xcccccc }) };
  }

  const solids = children.filter(c => !c.isSubtractive);
  const subtractives = children.filter(c => c.isSubtractive);

  if (solids.length === 0) {
    return { geometry: new THREE.BoxGeometry(0.001, 0.001, 0.001), materials: new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0 }) };
  }

  let resultBrush = null;
  const brushMaterials = [];

  solids.forEach((solid, idx) => {
    let geom;
    let mat;
    if (solid.geometry === 'csg') {
      const compiled = buildCSGGeometryInStreetView(solid);
      geom = compiled.geometry;
      mat = compiled.materials;
    } else {
      geom = getStreetGeo(solid.geometry);
      mat = new THREE.MeshStandardMaterial({
        color: solid.color,
        roughness: 0.65,
        metalness: 0.08
      });
    }

    if (Array.isArray(mat)) {
      brushMaterials.push(...mat);
    } else {
      brushMaterials.push(mat);
    }
    
    const brush = new Brush(geom, mat);
    brush.position.set(solid.position.x, solid.position.y, solid.position.z);
    brush.rotation.set(solid.rotation.x, solid.rotation.y, solid.rotation.z);
    brush.scale.set(solid.scale.x, solid.scale.y, solid.scale.z);
    brush.updateMatrixWorld(true);

    if (idx === 0) {
      resultBrush = brush;
    } else {
      resultBrush = cityCSGEvaluator.evaluate(resultBrush, brush, ADDITION);
    }
  });

  subtractives.forEach(sub => {
    let geom;
    let mat;
    if (sub.geometry === 'csg') {
      const compiled = buildCSGGeometryInStreetView(sub);
      geom = compiled.geometry;
      mat = compiled.materials;
    } else {
      geom = getStreetGeo(sub.geometry);
      mat = new THREE.MeshStandardMaterial({
        color: sub.color,
        roughness: 0.65,
        metalness: 0.08
      });
    }

    if (Array.isArray(mat)) {
      brushMaterials.push(...mat);
    } else {
      brushMaterials.push(mat);
    }

    const brush = new Brush(geom, mat);
    brush.position.set(sub.position.x, sub.position.y, sub.position.z);
    brush.rotation.set(sub.rotation.x, sub.rotation.y, sub.rotation.z);
    brush.scale.set(sub.scale.x, sub.scale.y, sub.scale.z);
    brush.updateMatrixWorld(true);

    resultBrush = cityCSGEvaluator.evaluate(resultBrush, brush, SUBTRACTION);
  });

  const resGeom = resultBrush.geometry;
  const resMats = resultBrush.material || brushMaterials;

  cityCSGGeometryCache.set(cacheKey, { geometry: resGeom, materials: resMats });
  cityCSGGeometriesSet.add(resGeom);

  const materials = Array.isArray(resMats)
    ? resMats.map(m => m.clone())
    : resMats.clone();

  return {
    geometry: resGeom,
    materials
  };
}

function drawObject2D(ctx, obj, baseScale, defaultColor, strokeColor) {
  if (obj.isSubtractive) return; // Skip subtractive/cutter elements entirely

  if (obj.geometry === 'csg') {
    const children = obj.children || [];
    children.forEach(child => {
      ctx.save();
      const ox = (child.position?.x !== undefined ? child.position.x : 0) * baseScale;
      const oz = (child.position?.z !== undefined ? child.position.z : 0) * baseScale;
      ctx.translate(ox, oz);
      ctx.rotate(-(child.rotation?.y || 0));

      drawObject2D(ctx, child, baseScale, defaultColor, strokeColor);
      ctx.restore();
    });
    return;
  }

  const sx = (obj.scale?.x !== undefined ? obj.scale.x : 1) * baseScale;
  const sz = (obj.scale?.z !== undefined ? obj.scale.z : 1) * baseScale;

  ctx.fillStyle = obj.color || defaultColor || '#4ECDC4';
  ctx.strokeStyle = strokeColor || 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;

  if (obj.geometry === 'cylinder' || obj.geometry === 'sphere' || obj.geometry === 'cone' || obj.geometry === 'torus') {
    ctx.beginPath();
    ctx.ellipse(0, 0, sx / 2, sz / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.rect(-sx / 2, -sz / 2, sx, sz);
    ctx.fill();
    ctx.stroke();
  }
}

const getOffsetPoints = (samples, dist) => {
  const result = [];
  for (let i = 0; i < samples.length; i++) {
    const pt = samples[i];
    let dx = 0, dz = 0;
    if (i === 0) {
      dx = samples[1].x - pt.x;
      dz = samples[1].z - pt.z;
    } else if (i === samples.length - 1) {
      dx = pt.x - samples[i-1].x;
      dz = pt.z - samples[i-1].z;
    } else {
      dx = samples[i+1].x - samples[i-1].x;
      dz = samples[i+1].z - samples[i-1].z;
    }
    const len = Math.sqrt(dx*dx + dz*dz);
    if (len > 0) {
      const nx = -dz / len;
      const nz = dx / len;
      result.push({ x: pt.x + nx * dist, z: pt.z + nz * dist });
    } else {
      result.push({ x: pt.x, z: pt.z });
    }
  }
  return result;
};

const getMaxScaleFactor = (asset) => {
  return 5.0;
};

const getDefaultScaleFactor = (asset) => {
  return 1.0;
};

function drawWaypointPin(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size * 0.8, -size * 0.6, -size, -size * 1.0, -size, -size * 1.5);
  ctx.arc(0, -size * 1.5, size, Math.PI, 0, false);
  ctx.bezierCurveTo(size, -size * 1.0, size * 0.8, -size * 0.6, 0, 0);
  ctx.closePath();
  ctx.arc(0, -size * 1.5, size * 0.35, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  
  ctx.beginPath();
  ctx.arc(0, size * 0.3, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

const MiniRoadsMap = ({ roads }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!roads || roads.length === 0) {
      // Draw placeholder or simple empty grid
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Roads Built', canvas.width / 2, canvas.height / 2 + 3);
      return;
    }

    // Fill dark blueprint style background
    ctx.fillStyle = 'rgba(10, 15, 30, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find bounding box of all points across all roads
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    roads.forEach(road => {
      if (road.points) {
        road.points.forEach(pt => {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.z < minZ) minZ = pt.z;
          if (pt.z > maxZ) maxZ = pt.z;
        });
      }
    });

    if (minX === Infinity) {
      minX = 0; maxX = 100; minZ = 0; maxZ = 100;
    }

    const padding = 15;
    const w = maxX - minX || 1;
    const h = maxZ - minZ || 1;
    const scaleX = (canvas.width - padding * 2) / w;
    const scaleY = (canvas.height - padding * 2) / h;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (canvas.width - w * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - h * scale) / 2 - minZ * scale;

    roads.forEach(road => {
      if (!road.points || road.points.length < 2) return;
      ctx.beginPath();
      
      let roadColor = '#4ECDC4'; 
      if (road.roadType === 'highway' || road.roadType === 'avenue') {
        roadColor = '#FFD166';
      } else if (road.roadType === 'dirt') {
        roadColor = '#8D5B4C';
      } else if (road.roadType === 'cyberway') {
        roadColor = '#00f2ff';
      } else if (road.roadType === 'railway') {
        roadColor = '#FF6B6B';
      } else if (road.roadType === 'brick') {
        roadColor = '#E76F51';
      }

      ctx.strokeStyle = roadColor;
      ctx.lineWidth = Math.max(1.5, scale * 0.4); 
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      road.points.forEach((pt, index) => {
        const cx = pt.x * scale + offsetX;
        const cy = pt.z * scale + offsetY;
        if (index === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      });
      ctx.stroke();
    });
  }, [roads]);

  return (
    <canvas 
      ref={canvasRef} 
      width={240} 
      height={140} 
      style={{ 
        borderRadius: 12, 
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
        display: 'block',
        margin: '8px auto'
      }} 
    />
  );
};

function getAssetPreRenderedCanvas(asset, cacheMap) {
  const hash = `${asset.color || ''}_${asset.objects?.length || 0}_${(asset.objects || []).map(o => o.color || '').join(',')}_${asset.scaleMultiplier || 1.0}`;
  const cached = cacheMap.get(asset.id);
  if (cached && cached.hash === hash) {
    return cached.canvas;
  }

  const canvas = document.createElement('canvas');
  const wCells = asset.width || 2;
  const hCells = asset.height || 2;
  const cacheCellResolution = 10 * (asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : 1.0);
  const margin = 10 * (asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : 1.0); 
  canvas.width = Math.ceil(wCells * cacheCellResolution + margin * 2);
  canvas.height = Math.ceil(hCells * cacheCellResolution + margin * 2);
  
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  const objScale = cacheCellResolution;
  const baseColor = asset.color || '#4ECDC4';

  if (asset.objects && asset.objects.length > 0) {
    asset.objects.forEach(obj => {
      ctx.save();
      const ox = (obj.position?.x !== undefined ? obj.position.x : 0) * objScale;
      const oz = (obj.position?.z !== undefined ? obj.position.z : 0) * objScale;
      ctx.translate(ox, oz);
      ctx.rotate(-(obj.rotation?.y || 0));
      drawObject2D(ctx, obj, objScale, baseColor);
      ctx.restore();
    });
  }
  ctx.restore();

  cacheMap.set(asset.id, { canvas, hash });
  return canvas;
}

export default function CityModule() {
  const {
    city, cityTool,
    presence, streetView, setStreetView,
    selectedAssetId, selectAsset, removeAsset, updateAsset,
    pendingPlacementAsset, placePendingAsset, clearCity,
    addRoadSegment, removeRoadSegment,
    selectedAssetIds, selectAssets, removeAssets, undoCity,
    publishedBuildings, deletePublishedBuilding, lockAllAssets,
    updateRoad, addZone, removeZone, updateZone,
    selectPendingAsset, randomiseAssetColors, toggleRandomiseAssetColors,
    randomColorPalette, toggleColorFamilyInPalette, activePaletteId, selectActivePalette,
    savedCitiesList, loadCity, createCity, deleteCity, renameCity,
    showCitiesManager, setShowCitiesManager
  } = useStore();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [showColorRandomizer, setShowColorRandomizer] = useState(false);
  const [editingCityName, setEditingCityName] = useState(null); 
  const [tempCityName, setTempCityName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [offset, setOffset] = useState({ x: 16, y: 16 });
  const [zoom, setZoom] = useState(1.0);
  const intersections = useMemo(() => findIntersections(city?.roads || []), [city?.roads]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [showObjectsPanel, setShowObjectsPanel] = useState(false);
  const [zoneView, setZoneView] = useState(false);
  const [metroView, setMetroView] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [zoneShape, setZoneShape] = useState('pencil');
  const [assetContextMenu, setAssetContextMenu] = useState(null); // { x, y, asset }
  const [waypoint, setWaypoint] = useState(null);
  const [isSettingWaypoint, setIsSettingWaypoint] = useState(false);
  const canvasCacheRef = useRef(new Map());
  const [sizeRandomizeMode, setSizeRandomizeMode] = useState('default'); // 'default' | 'randomize'
  const [sizeRandomizeMin, setSizeRandomizeMin] = useState(0.8);
  const [sizeRandomizeMax, setSizeRandomizeMax] = useState(2.2);

  const getInitialClampedCoords = (mx, my, type, isRandomizerOpen) => {
    const isAsset = type === 'asset';
    const menuW = 222;
    const menuH = isAsset ? (isRandomizerOpen ? 560 : 420) : 200;
    const containerW = containerRef.current?.offsetWidth || window.innerWidth;
    const containerH = containerRef.current?.offsetHeight || window.innerHeight;

    const targetX = mx + menuW > containerW - 12 ? mx - menuW : mx + 10;
    const targetY = my + menuH > containerH - 12 ? my - menuH : my + 10;

    const x = Math.max(12, Math.min(targetX, containerW - menuW - 12));
    const y = Math.max(12, Math.min(targetY, containerH - menuH - 12));

    return { x, y };
  };

  const handleMenuMouseDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button initiates dragging
    if (e.target.closest('button, input, select, textarea')) return; // Ignore clicks on interactive components

    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = assetContextMenu.x;
    const initialY = assetContextMenu.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const newX = initialX + dx;
      const newY = initialY + dy;

      const isAsset = assetContextMenu.type === 'asset';
      const menuW = 222;
      const menuH = isAsset ? (showColorRandomizer ? 560 : 420) : 200;
      const containerW = containerRef.current?.offsetWidth || window.innerWidth;
      const containerH = containerRef.current?.offsetHeight || window.innerHeight;

      const clampedX = Math.max(12, Math.min(newX, containerW - menuW - 12));
      const clampedY = Math.max(12, Math.min(newY, containerH - menuH - 12));

      setAssetContextMenu(prev => prev ? { ...prev, x: clampedX, y: clampedY } : null);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const zoneAnchorRef = useRef(null);
  const [gameTime, setGameTime] = useState(780);
  const [transitionProgress, setTransitionProgress] = useState(0.0);
  const gameTimeRef = useRef(780);
  
  const [activeZonePoints, setActiveZonePoints] = useState([]);
  const isDrawingZoneRef = useRef(false);

  const targetZoomRef = useRef(1.0);
  const targetOffsetRef = useRef({ x: 16, y: 16 });
  const mapKeysRef = useRef({});
  const dragStartPos = useRef(null);

  useEffect(() => {
    targetZoomRef.current = zoom;
    targetOffsetRef.current = offset;
    return () => {
      cityCSGGeometryCache.clear();
      cityCSGGeometriesSet.clear();
      roadCurveCache.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    gameTimeRef.current = gameTime;
  }, [gameTime]);

  useEffect(() => {
    let frameId;
    const tick = () => {
      // Frozen at 1:00 PM (780 mins) for testing
      setGameTime(780);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let frameId;
    const updateTransition = () => {
      const now = performance.now();
      const deltaMs = now - lastTime;
      lastTime = now;
      const speed = 0.0035; // transition takes ~300ms
      setTransitionProgress(prev => {
        if (zoneView) {
          return Math.min(1.0, prev + deltaMs * speed);
        } else {
          return Math.max(0.0, prev - deltaMs * speed);
        }
      });
      frameId = requestAnimationFrame(updateTransition);
    };
    frameId = requestAnimationFrame(updateTransition);
    return () => cancelAnimationFrame(frameId);
  }, [zoneView]);
  useEffect(() => {
    if (streetView) return;
    const handleKeyDown = (e) => {
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' || 
        document.activeElement.isContentEditable
      )) {
        return;
      }
      const k = e.key;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k.toLowerCase())) {
        mapKeysRef.current[k] = true;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e) => {
      const k = e.key;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k.toLowerCase())) {
        mapKeysRef.current[k] = false;
        e.preventDefault();
      }
    };
    const handleBlur = () => {
      mapKeysRef.current = {};
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [streetView]);

  useEffect(() => {
    const handleUndoShortcut = (e) => {
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' || 
        document.activeElement.isContentEditable
      )) {
        return;
      }
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'z') {
        e.preventDefault();
        undoCity();
      } else if (k === 'u') {
        e.preventDefault();
        lockAllAssets(false);
      } else if (k === 'l') {
        e.preventDefault();
        lockAllAssets(true);
        setSelectedRoadId(null);
      } else if (k === 'q') {
        if (selectedAssetId) {
          const latestCity = useStore.getState().city;
          const asset = (latestCity?.placedAssets || []).find(a => a.id === selectedAssetId);
          if (asset && !asset.locked) {
            e.preventDefault();
            let nextRot = (asset.rotation || 0) - Math.PI / 180;
            nextRot = (nextRot % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            updateAsset(selectedAssetId, { rotation: nextRot });
          }
        }
      } else if (k === 'e') {
        if (selectedAssetId) {
          const latestCity = useStore.getState().city;
          const asset = (latestCity?.placedAssets || []).find(a => a.id === selectedAssetId);
          if (asset && !asset.locked) {
            e.preventDefault();
            let nextRot = (asset.rotation || 0) + Math.PI / 180;
            nextRot = (nextRot % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            updateAsset(selectedAssetId, { rotation: nextRot });
          }
        }
      }
    };
    window.addEventListener('keydown', handleUndoShortcut);
    return () => window.removeEventListener('keydown', handleUndoShortcut);
  }, [undoCity, lockAllAssets, selectedAssetId, updateAsset]);

  useEffect(() => {
    let animFrame;
    const lerpFactor = 0.15; // Smooth interpolation speed
    
    const tick = () => {
      // Check keyboard panning
      const panSpeed = 7.0;
      let dxKey = 0;
      let dyKey = 0;
      const k = mapKeysRef.current;
      
      if (k['ArrowUp'] || k['w'] || k['W']) dyKey += panSpeed;
      if (k['ArrowDown'] || k['s'] || k['S']) dyKey -= panSpeed;
      if (k['ArrowLeft'] || k['a'] || k['A']) dxKey += panSpeed;
      if (k['ArrowRight'] || k['d'] || k['D']) dxKey -= panSpeed;
      
      if (dxKey !== 0 || dyKey !== 0) {
        targetOffsetRef.current = {
          x: targetOffsetRef.current.x + dxKey,
          y: targetOffsetRef.current.y + dyKey
        };
      }

      setZoom(currentZoom => {
        const targetZoom = targetZoomRef.current;
        if (Math.abs(currentZoom - targetZoom) > 0.001) {
          return currentZoom + (targetZoom - currentZoom) * lerpFactor;
        }
        return currentZoom;
      });

      setOffset(currentOffset => {
        const targetOffset = targetOffsetRef.current;
        const dx = targetOffset.x - currentOffset.x;
        const dy = targetOffset.y - currentOffset.y;
        
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          return {
            x: currentOffset.x + dx * lerpFactor,
            y: currentOffset.y + dy * lerpFactor
          };
        }
        return currentOffset;
      });

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const handleZoomButton = (zoomIn) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    const delta = zoomIn ? 1.25 : 0.8;
    const currentTargetZoom = targetZoomRef.current;
    const nextZoom = Math.max(0.05, Math.min(3.5, currentTargetZoom * delta));
    
    if (currentTargetZoom !== nextZoom) {
      targetZoomRef.current = nextZoom;
      targetOffsetRef.current = {
        x: cx - (cx - targetOffsetRef.current.x) * (nextZoom / currentTargetZoom),
        y: cy - (cy - targetOffsetRef.current.y) * (nextZoom / currentTargetZoom)
      };
    }
  };
  const [panning, setPanning] = useState(false);
  const panStart = useRef(null);
  const [hoveredFloat, setHoveredFloat] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [activeRoadPoints, setActiveRoadPoints] = useState([]);
  const [manualRotation, setManualRotation] = useState(0);
  const [activeRoadType, setActiveRoadType] = useState('standard');
  const [draggingAssetId, setDraggingAssetId] = useState(null);
  const [selectedRoadId, setSelectedRoadId] = useState(null);
  const [marqueeStart, setMarqueeStart] = useState(null);
  const [marqueeEnd, setMarqueeEnd] = useState(null);
  const dragOffset = useRef({ col: 0, row: 0 });

  useEffect(() => {
    setManualRotation(0);
  }, [pendingPlacementAsset]);

  const cellSize = CELL * zoom;

  const getFloatCoords = useCallback((e) => {
    if (!canvasRef.current) return { col: 0, row: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = (mx - offset.x) / cellSize;
    const row = (my - offset.y) / cellSize;
    return { col, row };
  }, [offset, cellSize]);

  const isPlacementValid = useCallback((col, row) => {
    if (!city || !pendingPlacementAsset) return false;

    // Enforce view placement constraint
    const isStation = pendingPlacementAsset.isMetroStation;
    if (isStation) {
      return true; // Metro stations can be built anywhere, in any view!
    }
    if (!isStation && metroView) return false;

    // Overlapping roads and buildings is allowed, do not restrict placement
    return true;
  }, [city, pendingPlacementAsset, metroView]);

  const getMetroPorts = useCallback(() => {
    if (!city || !city.placedAssets) return [];
    
    const railways = (city.roads || []).filter(r => r.roadType === 'railway');
    const occupiedPoints = [];
    railways.forEach(r => {
      if (r.points.length >= 2) {
        occupiedPoints.push(r.points[0]);
        occupiedPoints.push(r.points[r.points.length - 1]);
      }
    });

    const ports = [];
    (city.placedAssets || []).forEach(asset => {
      if (asset.isMetroStation || asset.name === 'Elevated Metro Station') {
        const rot = -(asset.rotation || 0);
        
        const offsets = [
          { label: 'A1', dx: -10.0 / 3.4, dz: -1.8 / 3.4 },
          { label: 'A2', dx: -10.0 / 3.4, dz: 1.8 / 3.4 },
          { label: 'B1', dx: 10.0 / 3.4, dz: -1.8 / 3.4 },
          { label: 'B2', dx: 10.0 / 3.4, dz: 1.8 / 3.4 }
        ];

        offsets.forEach(off => {
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          
          const rx = off.dx * cos - off.dz * sin;
          const rz = off.dx * sin + off.dz * cos;

          const px = asset.col + rx;
          const pz = asset.row + rz;

          const isOccupied = occupiedPoints.some(pt => Math.sqrt((pt.x - px)**2 + (pt.z - pz)**2) < 0.2);

          ports.push({
            id: `${asset.id}_${off.label}`,
            stationId: asset.id,
            stationName: asset.name,
            label: off.label,
            x: px,
            z: pz,
            isOccupied
          });
        });
      }
    });
    return ports;
  }, [city]);

  const getElevatedStationSnap = useCallback((col, row) => {
    if (activeRoadType !== 'railway') return null;
    const ports = getMetroPorts();
    let bestPort = null;
    let bestDist = 2.4;
    
    ports.forEach(port => {
      if (!port.isOccupied) {
        const dist = Math.sqrt((col - port.x)**2 + (row - port.z)**2);
        if (dist < bestDist) {
          bestDist = dist;
          bestPort = port;
        }
      }
    });
    return bestPort;
  }, [activeRoadType, getMetroPorts]);

  const validateRailwaySegment = useCallback((points) => {
    if (activeRoadType !== 'railway') return true;
    if (points.length < 2) return false;
    
    const start = points[0];
    const end = points[points.length - 1];
    const ports = getMetroPorts();
    
    const startPort = ports.find(p => Math.sqrt((p.x - start.x)**2 + (p.z - start.z)**2) < 0.25);
    const endPort = ports.find(p => Math.sqrt((p.x - end.x)**2 + (p.z - end.z)**2) < 0.25);
    
    if (!startPort) {
      useStore.getState().pushNotif("Metro track must start at a free station platform!");
      return false;
    }
    if (!endPort) {
      useStore.getState().pushNotif("Metro track must end at a free station platform!");
      return false;
    }
    if (startPort.stationId === endPort.stationId) {
      useStore.getState().pushNotif("Metro track cannot start and end at the same station!");
      return false;
    }
    return true;
  }, [activeRoadType, getMetroPorts]);

  const getRoadAlignment = useCallback((col, row) => {
    if (!city || !city.roads || city.roads.length === 0) return null;
    let closestDist = Infinity;
    let closestPt = null;
    let closestRoadType = 'standard';
    const p = { x: col, z: row };

    city.roads.forEach(road => {
      if (road.points.length < 2) return;
      const points3d = road.points.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
      const curve = new THREE.CatmullRomCurve3(points3d);
      const samples = curve.getPoints(Math.max(20, road.points.length * 5));
      for (let i = 0; i < samples.length - 1; i++) {
        const a = { x: samples[i].x, z: samples[i].z };
        const b = { x: samples[i+1].x, z: samples[i+1].z };
        const d = distanceToSegment(p, a, b);
        if (d < closestDist) {
          closestDist = d;
          closestRoadType = road.roadType || 'standard';

          const l2 = (a.x - b.x)**2 + (a.z - b.z)**2;
          let t = 0;
          if (l2 > 0) {
            t = ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / l2;
            t = Math.max(0, Math.min(1, t));
          }
          closestPt = {
            x: a.x + t * (b.x - a.x),
            z: a.z + t * (b.z - a.z)
          };
        }
      }
    });

    const getNewRadius = (type) => {
      switch (type) {
        case 'highway': return 6.0;
        case 'avenue': return 4.0;
        case 'multilane': return 3.0;
        case 'cyberway': return 2.2;
        case 'dirt': return 1.5;
        case 'railway': return 2.4;
        case 'brick': return 1.8;
        default: return 1.8;
      }
    };
    
    const snapThreshold = getNewRadius(closestRoadType) + 1.3;

    if (closestDist < snapThreshold && closestPt) {
      const dx = closestPt.x - col;
      const dz = closestPt.z - row;
      const rotation = Math.atan2(dx, dz);
      return { rotation, distance: closestDist };
    }
    return null;
  }, [city]);

  const getRoadSnapPoint = useCallback((col, row) => {
    if (!city || !city.roads || city.roads.length === 0) return null;
    let closestDist = Infinity;
    let closestPt = null;
    let closestRoadType = 'standard';
    const p = { x: col, z: row };

    city.roads.forEach(road => {
      if (road.points.length < 2) return;
      const points3d = road.points.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
      const curve = new THREE.CatmullRomCurve3(points3d);
      const samples = curve.getPoints(Math.max(20, road.points.length * 5));
      for (let i = 0; i < samples.length - 1; i++) {
        const a = { x: samples[i].x, z: samples[i].z };
        const b = { x: samples[i+1].x, z: samples[i+1].z };
        const d = distanceToSegment(p, a, b);
        if (d < closestDist) {
          closestDist = d;
          closestRoadType = road.roadType || 'standard';

          const l2 = (a.x - b.x)**2 + (a.z - b.z)**2;
          let t = 0;
          if (l2 > 0) {
            t = ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / l2;
            t = Math.max(0, Math.min(1, t));
          }
          closestPt = {
            x: a.x + t * (b.x - a.x),
            z: a.z + t * (b.z - a.z)
          };
        }
      }
    });

    const getNewRadius = (type) => {
      switch (type) {
        case 'highway': return 6.0;
        case 'avenue': return 4.0;
        case 'multilane': return 3.0;
        case 'cyberway': return 2.2;
        case 'dirt': return 1.5;
        case 'railway': return 2.4;
        case 'brick': return 1.8;
        default: return 1.8;
      }
    };

    if (closestDist < getNewRadius(closestRoadType) && closestPt) {
      return closestPt;
    }
    return null;
  }, [city]);
const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !city) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background - soft grass green, off-white in zone view, dark blueprint in metro view
    let bgR = Math.round(183 * (1 - transitionProgress) + 240 * transitionProgress);
    let bgG = Math.round(228 * (1 - transitionProgress) + 244 * transitionProgress);
    let bgB = Math.round(199 * (1 - transitionProgress) + 248 * transitionProgress);
    if (metroView) {
      bgR = 15; bgG = 23; bgB = 42; // Slate 900
    }
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.fillRect(0, 0, W, H);

    // Decorative infinite grid overlay
    const gridAlpha = 0.03 * (1 - transitionProgress) + 0.05 * transitionProgress;
    ctx.strokeStyle = metroView ? 'rgba(255, 255, 255, 0.07)' : `rgba(0,0,0,${gridAlpha})`;
    ctx.lineWidth = 0.5;
    const startX = ((offset.x % cellSize) + cellSize) % cellSize;
    const startY = ((offset.y % cellSize) + cellSize) % cellSize;

    for (let x = startX - cellSize; x < W + cellSize; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = startY - cellSize; y < H + cellSize; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Draw central origin axes (col = 0, row = 0 reference)
    const axisX = offset.x;
    const axisY = offset.y;
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1.0;
    if (axisX >= 0 && axisX <= W) {
      ctx.beginPath();
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, H);
      ctx.stroke();
    }
    if (axisY >= 0 && axisY <= H) {
      ctx.beginPath();
      ctx.moveTo(0, axisY);
      ctx.lineTo(W, axisY);
      ctx.stroke();
    }

    const drawRoad = (roadPoints, type, isPreview, isSelected, roadId) => {
      if (roadPoints.length < 2) return;
      
      const samples = roadId ? getRoadSamples(roadId, roadPoints) : (() => {
        const points3d = roadPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
        const curve = new THREE.CatmullRomCurve3(points3d);
        return curve.getPoints(Math.max(30, roadPoints.length * 10));
      })();
      
      const segments = [];
      let currentSeg = [];
      for (const pt of samples) {
        const isCulled = roadId ? isSampleCulled(pt, roadId, intersections) : false;
        if (isCulled) {
          if (currentSeg.length >= 2) {
            segments.push(currentSeg);
          }
          currentSeg = [];
        } else {
          currentSeg.push(pt);
        }
      }
      if (currentSeg.length >= 2) {
        segments.push(currentSeg);
      }

      const untrimmedScreenPoints = [samples.map(pt => ({
        x: offset.x + pt.x * cellSize,
        z: offset.y + pt.z * cellSize
      }))];

      const segmentScreenPoints = segments.map(seg => seg.map(pt => ({
        x: offset.x + pt.x * cellSize,
        z: offset.y + pt.z * cellSize
      })));

      const opacity = isPreview ? 0.6 : 1.0;
      
      const drawCurvePoints = (segList) => {
        segList.forEach(points => {
          if (points.length < 2) return;
          ctx.beginPath();
          points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.z);
            else ctx.lineTo(pt.x, pt.z);
          });
          ctx.stroke();
        });
      };

      const getOffsetSegments = (segmentsList, dist) => {
        return segmentsList.map(seg => getOffsetPoints(seg, dist));
      };

      if (transitionProgress > 0.0) {
        ctx.save();
        ctx.globalAlpha = transitionProgress * opacity;
        const roadW = (type === 'highway' ? 64 
                    : type === 'avenue' ? 44
                    : type === 'multilane' ? 36 
                    : type === 'cyberway' ? 28
                    : type === 'dirt' ? 20 
                    : 24) * zoom;
        // 1. Outer border
        ctx.save();
        ctx.strokeStyle = isSelected ? 'rgba(239, 68, 68, 0.5)' : 'rgba(15, 23, 42, 0.12)';
        ctx.lineWidth = roadW + 2.5 * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawCurvePoints(untrimmedScreenPoints);
        ctx.restore();

        // 2. Inner lane
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = roadW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawCurvePoints(untrimmedScreenPoints);
        ctx.restore();
        ctx.restore();
      }

      if (transitionProgress < 1.0) {
        ctx.save();
        let rAlpha = (1 - transitionProgress) * opacity;
        if (metroView) {
          rAlpha = type === 'railway' ? 1.0 : 0.12;
        }
        ctx.globalAlpha = rAlpha;

        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = (type === 'highway' ? 144 
                        : type === 'avenue' ? 96 
                        : type === 'multilane' ? 72 
                        : type === 'cyberway' ? 56 
                        : type === 'dirt' ? 40 
                        : 48) * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);
          ctx.restore();
        }

        if (type === 'multilane') {
          // Main pavement
          ctx.strokeStyle = `rgba(51, 65, 85, 1.0)`;
          ctx.lineWidth = 56 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Double yellow center lines
          ctx.strokeStyle = `rgba(245, 158, 11, 1.0)`;
          ctx.lineWidth = 1.5 * zoom;
          ctx.lineCap = 'butt';
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 4 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -4 * zoom));

          // Dashed lane lines
          ctx.strokeStyle = `rgba(255, 255, 255, 0.45)`;
          ctx.lineWidth = 1.5 * zoom;
          ctx.setLineDash([5 * zoom, 8 * zoom]);
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 16 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -16 * zoom));
          ctx.setLineDash([]);
        } else if (type === 'highway') {
          // Main pavement
          ctx.strokeStyle = `rgba(30, 41, 59, 1.0)`;
          ctx.lineWidth = 120 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Concrete median (center)
          ctx.strokeStyle = `rgba(203, 213, 225, 1.0)`;
          ctx.lineWidth = 8 * zoom;
          ctx.lineCap = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Solid yellow inner shoulders
          ctx.strokeStyle = `rgba(245, 158, 11, 1.0)`;
          ctx.lineWidth = 1.5 * zoom;
          ctx.lineCap = 'butt';
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 12 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -12 * zoom));

          // Dashed lane lines
          ctx.strokeStyle = `rgba(255, 255, 255, 0.45)`;
          ctx.lineWidth = 1.5 * zoom;
          ctx.setLineDash([6 * zoom, 10 * zoom]);
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 32 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -32 * zoom));
          ctx.setLineDash([]);

          // Solid white outer shoulders
          ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
          ctx.lineWidth = 1.5 * zoom;
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 52 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -52 * zoom));
        } else if (type === 'dirt') {
          // Dirt Road pavement
          ctx.strokeStyle = `rgba(139, 90, 43, 1.0)`;
          ctx.lineWidth = 24 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Ground grit texture overlay
          ctx.strokeStyle = `rgba(110, 68, 30, 0.45)`;
          ctx.lineWidth = 20 * zoom;
          ctx.setLineDash([2 * zoom, 4 * zoom]);
          drawCurvePoints(untrimmedScreenPoints);
          ctx.setLineDash([]);
        } else if (type === 'brick') {
          // Brick road pavement
          ctx.strokeStyle = `rgba(166, 58, 58, 1.0)`;
          ctx.lineWidth = 32 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Brick joints pattern
          ctx.strokeStyle = `rgba(186, 186, 186, 0.4)`;
          ctx.lineWidth = 32 * zoom;
          ctx.setLineDash([1.5 * zoom, 4.5 * zoom]);
          drawCurvePoints(untrimmedScreenPoints);
          ctx.setLineDash([]);
        } else if (type === 'avenue') {
          // Main wide dark pavement
          ctx.strokeStyle = `rgba(51, 65, 85, 1.0)`;
          ctx.lineWidth = 76 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Green grass median strip
          ctx.strokeStyle = `#22c55e`;
          ctx.lineWidth = 10 * zoom;
          ctx.lineCap = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Dashed lane dividers (two lanes on each side)
          ctx.strokeStyle = `rgba(255, 255, 255, 0.45)`;
          ctx.lineWidth = 1.5 * zoom;
          ctx.setLineDash([5 * zoom, 8 * zoom]);
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 18 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -18 * zoom));
          ctx.setLineDash([]);

          // Solid white shoulders
          ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
          ctx.lineWidth = 1.5 * zoom;
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 36 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -36 * zoom));
        } else if (type === 'cyberway') {
          // Dark pavement
          ctx.strokeStyle = `#0f172a`;
          ctx.lineWidth = 40 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Glowing neon cyan edges
          ctx.save();
          ctx.strokeStyle = `#00ffff`;
          ctx.lineWidth = 2 * zoom;
          ctx.shadowColor = `#00ffff`;
          ctx.shadowBlur = 8 * zoom;
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 19 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -19 * zoom));
          ctx.restore();

          // Dashed center line
          ctx.save();
          ctx.strokeStyle = `#00ffff`;
          ctx.lineWidth = 1.5 * zoom;
          ctx.shadowColor = `#00ffff`;
          ctx.shadowBlur = 4 * zoom;
          ctx.setLineDash([4 * zoom, 6 * zoom]);
          drawCurvePoints(untrimmedScreenPoints);
          ctx.setLineDash([]);
          ctx.restore();
        } else if (type === 'railway') {
          // 1. Viaduct shadow or intense neon cyan glow underlay
          ctx.save();
          if (metroView) {
            ctx.shadowColor = '#00f2ff';
            ctx.shadowBlur = 20 * zoom;
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
          } else {
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
          }
          ctx.lineWidth = 44 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const offsetScreenPoints = untrimmedScreenPoints.map(points => 
            points.map(pt => ({ x: pt.x + (metroView ? 0 : 3 * zoom), z: pt.z + (metroView ? 0 : 4 * zoom) }))
          );
          drawCurvePoints(offsetScreenPoints);
          ctx.restore();

          // 2. Concrete Bridge Deck (Broader)
          ctx.strokeStyle = metroView ? '#1e293b' : '#64748b';
          ctx.lineWidth = 44 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // 3. Side Parapets (concrete border lines)
          ctx.strokeStyle = metroView ? '#00f2ff' : '#cbd5e1';
          ctx.lineWidth = 2.0 * zoom;
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 21 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -21 * zoom));

          // 4. Inner Dark Track Bed
          ctx.strokeStyle = metroView ? '#0f172a' : '#1e293b';
          ctx.lineWidth = 30 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // 5. Wooden Sleepers (dashes)
          ctx.strokeStyle = metroView ? '#334155' : '#78350f';
          ctx.lineWidth = 28 * zoom;
          ctx.setLineDash([2 * zoom, 5 * zoom]);
          drawCurvePoints(untrimmedScreenPoints);
          ctx.setLineDash([]);

          // 6. Parallel Steel Rails (Broader offset)
          ctx.strokeStyle = metroView ? '#00f2ff' : '#94a3b8';
          ctx.lineWidth = 1.8 * zoom;
          if (metroView) {
            ctx.save();
            ctx.shadowColor = '#00f2ff';
            ctx.shadowBlur = 10 * zoom;
          }
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, 6.4 * zoom));
          drawCurvePoints(getOffsetSegments(segmentScreenPoints, -6.4 * zoom));
          if (metroView) {
            ctx.restore();
          }

          // 7. Draw circular support columns (piers)
          try {
            const points3d = roadPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
            const curve = new THREE.CatmullRomCurve3(points3d);
            const totalLength = curve.getLength();
            const numPillars = Math.max(2, Math.floor(totalLength / 3.2));
            for (let pIdx = 0; pIdx <= numPillars; pIdx++) {
              const pt = curve.getPointAt(pIdx / numPillars);
              const sx = offset.x + pt.x * cellSize;
              const sz = offset.y + pt.z * cellSize;

              ctx.beginPath();
              ctx.arc(sx, sz, 9.0 * zoom, 0, Math.PI * 2);
              ctx.fillStyle = metroView ? '#1e293b' : '#94a3b8';
              ctx.fill();
              ctx.strokeStyle = metroView ? '#00f2ff' : '#334155';
              ctx.lineWidth = 1.5 * zoom;
              ctx.stroke();
            }
          } catch (err) {}
        } else {
          // Standard
          ctx.strokeStyle = `rgba(71, 85, 105, 1.0)`;
          ctx.lineWidth = 32 * zoom;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          drawCurvePoints(untrimmedScreenPoints);

          // Center dashes
          ctx.strokeStyle = `rgba(255, 255, 255, 0.45)`;
          ctx.lineWidth = 2 * zoom;
          ctx.setLineDash([6 * zoom, 8 * zoom]);
          drawCurvePoints(segmentScreenPoints);
          ctx.setLineDash([]);
        }
        ctx.restore();
      }
    };

    // Render placed curvy roads sorted by priority so higher-priority roads overlay lower-priority ones
    const getRoadPriority = (rType) => {
      if (rType === 'highway') return 6;
      if (rType === 'avenue') return 5;
      if (rType === 'multilane') return 4;
      if (rType === 'cyberway') return 3;
      if (rType === 'brick') return 2;
      if (rType === 'standard') return 1;
      return 0; // dirt
    };

    const sortedRoads = [...(city.roads || [])].sort((a, b) => {
      return getRoadPriority(a.roadType) - getRoadPriority(b.roadType);
    });

    sortedRoads.forEach(road => {
      const isSel = road.id === selectedRoadId;
      drawRoad(road.points, road.roadType || 'standard', false, isSel, road.id);
    });

    // Render trains moving along railways
    city.roads.forEach(road => {
      if (road.roadType !== 'railway' || road.points.length < 2) return;
      try {
        const points3d = road.points.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
        const curve = new THREE.CatmullRomCurve3(points3d);
        const totalLen = curve.getLength();
        if (totalLen <= 0.1) return;

        const speedFactor = 0.02; // units per frame
        const now = performance.now();
        const cycleMs = (totalLen / speedFactor) * 16.7; // scaled loop cycle
        const t = (now / cycleMs) % 1.0;

        const carriageCount = 3;
        const spacing = 1.0 / totalLen; // Carriage spacing factor

        for (let c = 0; c < carriageCount; c++) {
          const cartT = (t - c * spacing + 1.0) % 1.0;
          const pt = curve.getPointAt(cartT);
          const sx = offset.x + pt.x * cellSize;
          const sz = offset.y + pt.z * cellSize;

          const tangent = curve.getTangentAt(cartT);
          const angle = Math.atan2(tangent.z, tangent.x);

          ctx.save();
          ctx.translate(sx, sz);
          ctx.rotate(angle);

          if (c === 0) {
            ctx.fillStyle = '#ef4444'; // Locomotive cab
            ctx.fillRect(-8 * zoom, -4 * zoom, 16 * zoom, 8 * zoom);
            ctx.fillStyle = '#38bdf8'; // Windshield
            ctx.fillRect(4 * zoom, -3 * zoom, 3 * zoom, 6 * zoom);
          } else {
            ctx.fillStyle = '#1e3a8a'; // Carriage
            ctx.fillRect(-7 * zoom, -3.5 * zoom, 14 * zoom, 7 * zoom);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1 * zoom;
            ctx.beginPath();
            ctx.moveTo(-10 * zoom, 0);
            ctx.lineTo(-7 * zoom, 0);
            ctx.stroke();
          }
          ctx.restore();
        }
      } catch (err) {
        // Curve build failguard
      }
    });

    // Render Metro Snapping Ports (Blinking/Pulsing) when railway pencil is active
    if (cityTool === 'road' && activeRoadType === 'railway') {
      const ports = getMetroPorts();
      ports.forEach(port => {
        const px = offset.x + port.x * cellSize;
        const pz = offset.y + port.z * cellSize;

        ctx.save();
        if (port.isOccupied) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.beginPath();
          ctx.arc(px, pz, 3.5 * zoom, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          const pulse = 1.0 + 0.25 * Math.sin(Date.now() / 160);
          
          ctx.shadowColor = '#00f2ff';
          ctx.shadowBlur = 8 * zoom;

          ctx.strokeStyle = '#00f2ff';
          ctx.lineWidth = 1.5 * zoom;
          ctx.beginPath();
          ctx.arc(px, pz, 7 * zoom * pulse, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#00f2ff';
          ctx.beginPath();
          ctx.arc(px, pz, 3.5 * zoom, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // Render active road under construction
    if (cityTool === 'road' && activeRoadPoints.length > 0) {
      let pts = [...activeRoadPoints];
      if (hoveredFloat) {
        pts.push({ x: hoveredFloat.col, z: hoveredFloat.row });
      }
      drawRoad(pts, activeRoadType, true, false, null);

      // Node circles
      ctx.fillStyle = '#4ECDC4';
      activeRoadPoints.forEach(pt => {
        ctx.beginPath();
        ctx.arc(offset.x + pt.x * cellSize, offset.y + pt.z * cellSize, 5 * zoom, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // Render existing zones on the 2D map
    if (city.zones && city.zones.length > 0) {
      city.zones.forEach(zone => {
        if (!zone.points || zone.points.length < 3) return;
        ctx.save();
        
        const isSel = zone.id === selectedZoneId;
        
        // 1. Draw claymorphic zone if transition is active
        if (transitionProgress > 0.0) {
          ctx.save();
          ctx.globalAlpha = transitionProgress;
          
          // Draw base path
          const path = new Path2D();
          zone.points.forEach((pt, idx) => {
            const sx = offset.x + pt.x * cellSize;
            const sy = offset.y + pt.z * cellSize;
            if (idx === 0) path.moveTo(sx, sy);
            else path.lineTo(sx, sy);
          });
          path.closePath();

          // 1. Draw outer drop shadow (glowing red if selected, soft slate shadow if not)
          ctx.shadowColor = isSel ? 'rgba(239, 68, 68, 0.45)' : 'rgba(15, 23, 42, 0.16)';
          ctx.shadowBlur = isSel ? 20 * zoom : 12 * zoom;
          ctx.shadowOffsetX = isSel ? 0 : 3 * zoom;
          ctx.shadowOffsetY = isSel ? 2 * zoom : 5 * zoom;
          ctx.fillStyle = zone.color;
          ctx.fill(path);
          
          // 2. Draw soft inner white highlight (top-left inner shadow)
          ctx.save();
          ctx.shadowColor = 'transparent';
          ctx.clip(path);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.lineWidth = 4 * zoom;
          ctx.translate(-2 * zoom, -2 * zoom);
          ctx.stroke(path);
          ctx.restore();

          // 3. Draw soft inner dark shadow (bottom-right inner shadow)
          ctx.save();
          ctx.shadowColor = 'transparent';
          ctx.clip(path);
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
          ctx.lineWidth = 4 * zoom;
          ctx.translate(2 * zoom, 2 * zoom);
          ctx.stroke(path);
          ctx.restore();
          
          // 4. Draw outer border line (thick red if selected)
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = isSel ? '#ef4444' : 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = isSel ? 2.5 * zoom : 1.0 * zoom;
          if (isSel) {
            ctx.setLineDash([4 * zoom, 4 * zoom]);
          }
          ctx.stroke(path);
          if (isSel) {
            ctx.setLineDash([]);
          }
          
          ctx.restore();
        }

        // 2. Draw normal map style zone if transition is active
        if (transitionProgress < 1.0) {
          ctx.save();
          ctx.globalAlpha = 1 - transitionProgress;
          
          // 1. Draw filled polygon
          ctx.fillStyle = zone.color;
          ctx.globalAlpha = 0.32 * (1 - transitionProgress);
          ctx.beginPath();
          zone.points.forEach((pt, idx) => {
            const sx = offset.x + pt.x * cellSize;
            const sy = offset.y + pt.z * cellSize;
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fill();
          
          // 2. Draw border
          ctx.globalAlpha = 0.85 * (1 - transitionProgress);
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = 1.8 * zoom;
          ctx.stroke();
          
          // If selected in normal map view, draw a bold outer border!
          if (isSel) {
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3.0 * zoom;
            ctx.setLineDash([4 * zoom, 4 * zoom]);
            ctx.beginPath();
            zone.points.forEach((pt, idx) => {
              const sx = offset.x + pt.x * cellSize;
              const sy = offset.y + pt.z * cellSize;
              if (idx === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            });
            ctx.closePath();
            ctx.stroke();
          }
          ctx.restore();
        }
        
        // 3. Draw zone name at centroid
        let sumX = 0, sumZ = 0;
        zone.points.forEach(pt => {
          sumX += pt.x;
          sumZ += pt.z;
        });
        const cx = offset.x + (sumX / zone.points.length) * cellSize;
        const cz = offset.y + (sumZ / zone.points.length) * cellSize;
        
        ctx.globalAlpha = 1.0;
        const upperName = zone.name.toUpperCase();
        ctx.font = `bold ${Math.max(9, 10 * zoom)}px "Courier New", Courier, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw small shadow/outline for readability
        ctx.fillStyle = 'rgba(22, 27, 38, 0.82)';
        const textWidth = ctx.measureText(upperName).width;
        ctx.fillRect(cx - textWidth / 2 - 6, cz - 8, textWidth + 12, 16);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(upperName, cx, cz);
        
        ctx.restore();
      });
    }

    // Render active zone drawing under construction (pencil tool)
    if (cityTool === 'pencil' && activeZonePoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6.0 * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      activeZonePoints.forEach((pt, idx) => {
        const sx = offset.x + pt.x * cellSize;
        const sy = offset.y + pt.z * cellSize;
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      
      // Draw line to current hover point if moving mouse and in freeform mode
      if (zoneShape === 'pencil' && hoveredFloat) {
        const hx = offset.x + hoveredFloat.col * cellSize;
        const hy = offset.y + hoveredFloat.row * cellSize;
        ctx.lineTo(hx, hy);
      }
      
      if (zoneShape !== 'pencil' && activeZonePoints.length >= 3) {
        ctx.closePath();
      }
      ctx.stroke();
      
      if (zoneShape !== 'pencil' && activeZonePoints.length >= 3) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.fill();
      }
      
      // Draw starting node circle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(offset.x + activeZonePoints[0].x * cellSize, offset.y + activeZonePoints[0].z * cellSize, 6 * zoom, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    // Render marquee selection box
    if (marqueeStart && marqueeEnd) {
      const sx = offset.x + marqueeStart.col * cellSize;
      const sy = offset.y + marqueeStart.row * cellSize;
      const ex = offset.x + marqueeEnd.col * cellSize;
      const ey = offset.y + marqueeEnd.row * cellSize;

      ctx.save();
      if (cityTool === 'erase') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = 'rgba(78, 205, 196, 0.15)';
        ctx.strokeStyle = '#4ECDC4';
      }
      ctx.fillRect(sx, sy, ex - sx, ey - sy);
      ctx.lineWidth = 1.5 * zoom;
      ctx.setLineDash([4 * zoom, 4 * zoom]);
      ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      ctx.restore();
    }

    // Placed assets are rendered below

    // Placed assets
    if (transitionProgress < 1.0) {
      (city.placedAssets || []).forEach(asset => {
        const scaleFactor = asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : 1.0;
        const aw = (asset.width || 2) * (cellSize / 3.4) * scaleFactor;
        const ah = (asset.height || 2) * (cellSize / 3.4) * scaleFactor;
        const isSelected = asset.id === selectedAssetId || (selectedAssetIds || []).includes(asset.id);

        // 1. Viewport frustum culling check
        const pos = getAdjustedAssetPosition(asset, city.roads);
        const cx = offset.x + pos.col * cellSize;
        const cy = offset.y + pos.row * cellSize;
        const maxDim = Math.max(aw, ah) * 1.5;

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          if (
            cx + maxDim < 0 ||
            cx - maxDim > canvas.width ||
            cy + maxDim < 0 ||
            cy - maxDim > canvas.height
          ) {
            return; // Skip rendering this building entirely!
          }
        }

        ctx.save();
        let assetAlpha = 1 - transitionProgress;
        if (metroView) {
          assetAlpha = asset.isMetroStation || asset.name === 'Metro Station' ? 1.0 : 0.12;
        }
        ctx.globalAlpha = assetAlpha;
        ctx.translate(cx, cy);
        ctx.rotate(-(asset.rotation || 0));

        const ax = -aw / 2;
        const ay = -ah / 2;

        // 1. Draw generic footprint shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(ax + 2, ay + 2, aw, ah);

        // 2. Draw actual constituent 3D primitives in 2D top view
        const drawDetailed = aw >= 16 && ah >= 16 && zoom >= 0.65;

        const baseColor = (metroView && asset.isMetroStation) ? '#00f2ff' : (asset.color || '#4ECDC4');

        if (drawDetailed && asset.objects && asset.objects.length > 0) {
          const cachedCanvas = getAssetPreRenderedCanvas(asset, canvasCacheRef.current);
          const cw = cachedCanvas.width * zoom;
          const ch = cachedCanvas.height * zoom;
          ctx.drawImage(cachedCanvas, -cw / 2, -ch / 2, cw, ch);
        } else {
          ctx.fillStyle = baseColor;
          ctx.globalAlpha = 0.82 * assetAlpha;
          ctx.beginPath();
          ctx.roundRect?.(ax, ay, aw, ah, 3) || ctx.rect(ax, ay, aw, ah);
          ctx.fill();
          ctx.globalAlpha = assetAlpha;
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect?.(ax, ay, aw, ah, 3) || ctx.rect(ax, ay, aw, ah);
          ctx.stroke();
        }

        // 3. Draw white select border highlight around building bounds
        if (isSelected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.roundRect?.(ax, ay, aw, ah, 3) || ctx.rect(ax, ay, aw, ah);
          ctx.stroke();
        }

        ctx.restore();

        const isStation = asset.isMetroStation || asset.name === 'Elevated Metro Station' || asset.name === 'Metro Station';
        if (isStation) {
          ctx.save();
          const labelName = asset.customName || asset.name;
          ctx.font = `bold ${Math.max(9, 10 * zoom)}px "Outfit", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const labelTextWidth = ctx.measureText(labelName).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect?.(cx - labelTextWidth / 2 - 8, cy - ah / 2 - 18, labelTextWidth + 16, 16, 4) || ctx.rect(cx - labelTextWidth / 2 - 8, cy - ah / 2 - 18, labelTextWidth + 16, 16);
          ctx.fill();
          
          ctx.strokeStyle = '#00f2ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect?.(cx - labelTextWidth / 2 - 8, cy - ah / 2 - 18, labelTextWidth + 16, 16, 4) || ctx.rect(cx - labelTextWidth / 2 - 8, cy - ah / 2 - 18, labelTextWidth + 16, 16);
          ctx.stroke();

          ctx.fillStyle = '#00f2ff';
          ctx.fillText(labelName, cx, cy - ah / 2 - 10);
          ctx.restore();
        }
      });
    }

    // Hover highlight or pending placement
    if (hoveredFloat && pendingPlacementAsset && !zoneView) {
      const isValid = isPlacementValid(hoveredFloat.col, hoveredFloat.row);
      const hx = offset.x + hoveredFloat.col * cellSize;
      const hy = offset.y + hoveredFloat.row * cellSize;
      const aw = pendingPlacementAsset.width * (cellSize / 3.4);
      const ah = pendingPlacementAsset.height * (cellSize / 3.4);

      const alignment = getRoadAlignment(hoveredFloat.col, hoveredFloat.row);
      const rotation = alignment ? alignment.rotation : manualRotation;

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-rotation);

      // Draw background bounding area
      ctx.fillStyle = isValid ? 'rgba(78, 205, 196, 0.12)' : 'rgba(226, 75, 74, 0.12)';
      ctx.fillRect(-aw / 2, -ah / 2, aw, ah);
      
      // Draw actual preview sub-objects
      if (pendingPlacementAsset.objects && pendingPlacementAsset.objects.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.55; // semi-transparent for preview
        const objScale = cellSize / 3.4;
        pendingPlacementAsset.objects.forEach(obj => {
          ctx.save();
          const ox = (obj.position?.x !== undefined ? obj.position.x : 0) * objScale;
          const oz = (obj.position?.z !== undefined ? obj.position.z : 0) * objScale;
          ctx.translate(ox, oz);
          ctx.rotate(-(obj.rotation?.y || 0));

          const strokeColor = isValid ? 'rgba(78, 205, 196, 0.4)' : 'rgba(226, 75, 74, 0.4)';
          drawObject2D(ctx, obj, objScale, pendingPlacementAsset.color, strokeColor);
          ctx.restore();
        });
        ctx.restore();
      }

      ctx.strokeStyle = isValid ? '#4ECDC4' : '#E24B4A';
      ctx.lineWidth = 2;
      ctx.strokeRect(-aw / 2, -ah / 2, aw, ah);

      ctx.restore();
    }

    // Selected cell highlight
    if (selectedCell && !selectedAssetId && !selectedRoadId) {
      const sx = offset.x + selectedCell.col * cellSize;
      const sy = offset.y + selectedCell.row * cellSize;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);
      ctx.setLineDash([]);
    }

    // Placed Waypoint
    if (waypoint) {
      const wx = offset.x + waypoint.col * cellSize;
      const wy = offset.y + waypoint.row * cellSize;
      drawWaypointPin(ctx, wx, wy, 16 * zoom, '#ef4444');
    }

    // Hover preview Waypoint
    if (isSettingWaypoint && hoveredFloat) {
      const hx = offset.x + hoveredFloat.col * cellSize;
      const hy = offset.y + hoveredFloat.row * cellSize;
      drawWaypointPin(ctx, hx, hy, 16 * zoom, 'rgba(239, 68, 68, 0.6)');
    }

    // ── Day/Night Cycle Rendering (2D Overlay & Streetlights) ──
    const hours = gameTime / 60;
    
    // Draw 2D Streetlights
    if (transitionProgress < 1.0 && (hours >= 19.0 || hours < 6.0)) {
      ctx.save();
      ctx.globalAlpha = 1 - transitionProgress;
      ctx.globalCompositeOperation = 'screen';
      
      (city.roads || []).forEach(road => {
        if (road.points.length < 2) return;
        road.points.forEach((pt, pIdx) => {
          if (pIdx % 2 !== 0) return; 
          
          const sx = offset.x + pt.x * cellSize;
          const sy = offset.y + pt.z * cellSize;
          
          const grad = ctx.createRadialGradient(sx, sy, 1 * zoom, sx, sy, 12 * zoom);
          grad.addColorStop(0, 'rgba(253, 224, 71, 0.7)');
          grad.addColorStop(0.3, 'rgba(253, 224, 71, 0.3)');
          grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, 12 * zoom, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.restore();
    }

    // Draw Night overlay
    if (transitionProgress < 1.0) {
      let overlayColor = null;
      if (hours >= 19.5 || hours < 5.5) {
        overlayColor = `rgba(15, 23, 42, ${0.45 * (1 - transitionProgress)})`;
      } else if (hours >= 18.0 && hours < 19.5) {
        const t = (hours - 18.0) / 1.5;
        const r = Math.round(245 * (1 - t) + 15 * t);
        const g = Math.round(158 * (1 - t) + 23 * t);
        const b = Math.round(11 * (1 - t) + 42 * t);
        const alpha = (0.15 * (1 - t) + 0.45 * t) * (1 - transitionProgress);
        overlayColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else if (hours >= 5.5 && hours < 7.0) {
        const t = (hours - 5.5) / 1.5;
        const r = Math.round(15 * (1 - t) + 253 * t);
        const g = Math.round(23 * (1 - t) + 224 * t);
        const b = Math.round(42 * (1 - t) + 71 * t);
        const alpha = (0.45 * (1 - t) + 0.05 * (1 - t)) * (1 - transitionProgress);
        overlayColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      if (overlayColor) {
        ctx.save();
        ctx.fillStyle = overlayColor;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
  }, [city, offset, cellSize, zoom, hoveredFloat, cityTool, selectedAssetId, selectedRoadId, selectedCell, pendingPlacementAsset, isPlacementValid, activeRoadPoints, getRoadAlignment, manualRotation, activeRoadType, marqueeStart, marqueeEnd, selectedAssetIds, intersections, activeZonePoints, zoneShape, zoneView, metroView, selectedZoneId, gameTime, transitionProgress, getMetroPorts, waypoint, isSettingWaypoint]);

  // Resize + redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
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
    if (!canvasRef.current || !city) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = Math.floor((mx - offset.x) / cellSize);
    const row = Math.floor((my - offset.y) / cellSize);
    return { col, row };
  }

  function assetAtCell(col, row) {
    return (city?.placedAssets || []).find(a => {
      const pos = getAdjustedAssetPosition(a, city.roads);
      const scaleFactor = a.scaleMultiplier !== undefined ? a.scaleMultiplier : 1.0;
      const dx = col - pos.col;
      const dy = row - pos.row;
      const rot = a.rotation || 0;
      const localX = dx * Math.cos(rot) + dy * Math.sin(rot);
      const localY = -dx * Math.sin(rot) + dy * Math.cos(rot);
      const localX_m = localX * 3.4;
      const localY_m = localY * 3.4;

      if (a.objects && a.objects.length > 0) {
        // Precise check against individual objects
        for (const obj of a.objects) {
          const ox = (obj.position?.x || 0) * scaleFactor;
          const oz = (obj.position?.z || 0) * scaleFactor;
          const sX = (obj.scale?.x || 1) * scaleFactor;
          const sZ = (obj.scale?.z || 1) * scaleFactor;
          const oRot = obj.rotation?.y || 0;

          const odx = localX_m - ox;
          const ody = localY_m - oz;

          const objLocalX = odx * Math.cos(oRot) + ody * Math.sin(oRot);
          const objLocalY = -odx * Math.sin(oRot) + ody * Math.cos(oRot);

          const rx = sX / 2;
          const rz = sZ / 2;
          if (rx <= 0 || rz <= 0) continue;

          if (['cylinder', 'sphere', 'cone', 'torus'].includes(obj.geometry)) {
            if ((objLocalX * objLocalX) / (rx * rx) + (objLocalY * objLocalY) / (rz * rz) <= 1.0) {
              return true;
            }
          } else {
            if (objLocalX >= -rx && objLocalX <= rx && objLocalY >= -rz && objLocalY <= rz) {
              return true;
            }
          }
        }
        return false;
      } else {
        const hw = ((a.width || 2) * scaleFactor) / 2;
        const hh = ((a.height || 2) * scaleFactor) / 2;
        return localX_m >= -hw && localX_m <= hw && localY_m >= -hh && localY_m <= hh;
      }
    });
  }

  function roadAtCoords(col, row) {
    if (!city || !city.roads) return null;
    const p = { x: col, z: row };
    for (const road of city.roads) {
      if (road.points.length < 2) continue;
      for (let i = 0; i < road.points.length - 1; i++) {
        const a = road.points[i];
        const b = road.points[i+1];
        // Wider distance threshold (1.2 units instead of 0.6) for easy selection/erasing of curvy roads
        if (distanceToSegment(p, a, b) < 1.2) {
          return road;
        }
      }
    }
    return null;
  }

  useEffect(() => {
    if (streetView) return;
    const handleGlobalKey = (e) => {
      if (e.key === 'Enter') {
        if (cityTool === 'road' && activeRoadPoints.length >= 2) {
          const uniquePoints = [];
          activeRoadPoints.forEach(pt => {
            if (uniquePoints.length === 0) {
              uniquePoints.push(pt);
            } else {
              const prev = uniquePoints[uniquePoints.length - 1];
              const dist = Math.sqrt((pt.x - prev.x)**2 + (pt.z - prev.z)**2);
              if (dist > 0.05) {
                uniquePoints.push(pt);
              }
            }
          });
          if (uniquePoints.length >= 2) {
            if (validateRailwaySegment(uniquePoints)) {
              addRoadSegment(uniquePoints, activeRoadType);
            }
          }
          setActiveRoadPoints([]);
        }
      } else if (e.key === 'Escape') {
        if (cityTool === 'road') {
          setActiveRoadPoints([]);
        }
      } else if (e.key.toLowerCase() === 'r') {
        if (pendingPlacementAsset) {
          setManualRotation(prev => (prev + Math.PI / 2) % (Math.PI * 2));
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAssetIds && selectedAssetIds.length > 0) {
          removeAssets(selectedAssetIds);
        } else if (selectedAssetId) {
          removeAsset(selectedAssetId);
          selectAsset(null);
        } else if (selectedRoadId) {
          removeRoadSegment(selectedRoadId);
          setSelectedRoadId(null);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [cityTool, activeRoadPoints, addRoadSegment, streetView, pendingPlacementAsset, activeRoadType, selectedAssetId, selectedRoadId, removeAsset, selectAsset, removeRoadSegment, selectedAssetIds, removeAssets, validateRailwaySegment]);

  function onMouseDown(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning(true);
      panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
      return;
    }

    const floatCoords = getFloatCoords(e);

    // Right click cancels pending building placement
    if (e.button === 2 && pendingPlacementAsset) {
      e.preventDefault();
      useStore.setState({ pendingPlacementAsset: null, cityTool: 'select' });
      return;
    }

    // Right click completes the road segment OR opens context menu for road
    if (e.button === 2 && cityTool === 'road') {
      e.preventDefault();
      if (activeRoadPoints.length >= 2) {
        const uniquePoints = [];
        activeRoadPoints.forEach(pt => {
          if (uniquePoints.length === 0) {
            uniquePoints.push(pt);
          } else {
            const prev = uniquePoints[uniquePoints.length - 1];
            const dist = Math.sqrt((pt.x - prev.x)**2 + (pt.z - prev.z)**2);
            if (dist > 0.05) {
              uniquePoints.push(pt);
            }
          }
        });
        if (uniquePoints.length >= 2) {
          if (validateRailwaySegment(uniquePoints)) {
            addRoadSegment(uniquePoints, activeRoadType);
          }
        }
      }
      setActiveRoadPoints([]);
      return;
    }

    // Right click in select mode: open context menu on asset or road
    if (e.button === 2 && cityTool === 'select') {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      const mx = rect ? e.clientX - rect.left : e.clientX;
      const my = rect ? e.clientY - rect.top : e.clientY;
      const asset = assetAtCell(floatCoords.col, floatCoords.row);
      if (asset) {
        selectAsset(asset.id);
        setSelectedRoadId(null);
        const coords = getInitialClampedCoords(mx, my, 'asset', showColorRandomizer);
        setAssetContextMenu({ ...coords, asset, type: 'asset' });
        return;
      }
      const road = roadAtCoords(floatCoords.col, floatCoords.row);
      if (road) {
        setSelectedRoadId(road.id);
        selectAsset(null);
        const coords = getInitialClampedCoords(mx, my, 'road', showColorRandomizer);
        setAssetContextMenu({ ...coords, road, type: 'road' });
        return;
      }
      setAssetContextMenu(null);
      return;
    }

    if (e.button === 0) {
      if (isSettingWaypoint) {
        setWaypoint({ col: floatCoords.col, row: floatCoords.row });
        setIsSettingWaypoint(false);
        return;
      }
      if (pendingPlacementAsset) {
        if (isPlacementValid(floatCoords.col, floatCoords.row)) {
          const alignment = getRoadAlignment(floatCoords.col, floatCoords.row);
          const rotation = alignment ? alignment.rotation : manualRotation;
          let scaleMultiplier = 1.0;
          if (sizeRandomizeMode === 'randomize') {
            scaleMultiplier = Math.random() * (sizeRandomizeMax - sizeRandomizeMin) + sizeRandomizeMin;
            scaleMultiplier = Math.round(scaleMultiplier * 100) / 100;
          }
          placePendingAsset(floatCoords.col, floatCoords.row, rotation, scaleMultiplier);
        }
        return;
      }
      if (cityTool === 'select') {
        const cell = cellFromEvent(e);
        const asset = assetAtCell(floatCoords.col, floatCoords.row);
        if (asset && !asset.locked) {
          e.preventDefault();
          setAssetContextMenu(null);
          selectAsset(asset.id);
          setSelectedRoadId(null);
          setSelectedCell(null);
          setDraggingAssetId(asset.id);
          dragOffset.current = {
            col: floatCoords.col - asset.col,
            row: floatCoords.row - asset.row
          };
          dragStartPos.current = { col: asset.col, row: asset.row };
        } else if (asset && asset.locked) {
          e.preventDefault();
          setAssetContextMenu(null);
          selectAsset(asset.id);
          setSelectedRoadId(null);
          setSelectedCell(null);
        } else {
          selectAsset(null);
          setAssetContextMenu(null);
          const road = roadAtCoords(floatCoords.col, floatCoords.row);
          if (road && !road.locked) {
            setSelectedRoadId(road.id);
            setSelectedCell(null);
          } else {
            setSelectedRoadId(null);
            setSelectedCell(cell);
          }
          setMarqueeStart(floatCoords);
          setMarqueeEnd(floatCoords);
        }
        return;
      }
      if (cityTool === 'road') {
        const elevatedSnap = getElevatedStationSnap(floatCoords.col, floatCoords.row);
        if (elevatedSnap) {
          setActiveRoadPoints(prev => [...prev, { x: elevatedSnap.x, z: elevatedSnap.z }]);
        } else {
          const snap = getRoadSnapPoint(floatCoords.col, floatCoords.row);
          const finalCol = snap ? snap.x : floatCoords.col;
          const finalRow = snap ? snap.z : floatCoords.row;
          setActiveRoadPoints(prev => [...prev, { x: finalCol, z: finalRow }]);
        }
        return;
      }
      if (cityTool === 'pencil') {
        e.preventDefault();
        isDrawingZoneRef.current = true;
        zoneAnchorRef.current = { x: floatCoords.col, z: floatCoords.row };
        setActiveZonePoints([{ x: floatCoords.col, z: floatCoords.row }]);
        return;
      }
      if (cityTool === 'erase') {
        e.preventDefault();
        // Start marquee erase selection immediately
        setMarqueeStart(floatCoords);
        setMarqueeEnd(floatCoords);
        return;
      }
    }
  }

  function onDoubleClick(e) {
    if (cityTool === 'road' && activeRoadPoints.length >= 2) {
      const uniquePoints = [];
      activeRoadPoints.forEach(pt => {
        if (uniquePoints.length === 0) {
          uniquePoints.push(pt);
        } else {
          const prev = uniquePoints[uniquePoints.length - 1];
          const dist = Math.sqrt((pt.x - prev.x)**2 + (pt.z - prev.z)**2);
          if (dist > 0.05) {
            uniquePoints.push(pt);
          }
        }
      });
      if (uniquePoints.length >= 2) {
        if (validateRailwaySegment(uniquePoints)) {
          addRoadSegment(uniquePoints, activeRoadType);
        }
      }
      setActiveRoadPoints([]);
    }
  }

  function onMouseMove(e) {
    if (panning && panStart.current) {
      const nextX = e.clientX - panStart.current.x;
      const nextY = e.clientY - panStart.current.y;
      targetOffsetRef.current = { x: nextX, y: nextY };
      setOffset({ x: nextX, y: nextY });
      return;
    }
    let floatCoords = getFloatCoords(e);
    if (cityTool === 'road') {
      const elevatedSnap = getElevatedStationSnap(floatCoords.col, floatCoords.row);
      if (elevatedSnap) {
        floatCoords = { col: elevatedSnap.x, row: elevatedSnap.z };
      } else {
        const snap = getRoadSnapPoint(floatCoords.col, floatCoords.row);
        if (snap) {
          floatCoords = { col: snap.x, row: snap.z };
        }
      }
    }
    setHoveredFloat(floatCoords);

    if (cityTool === 'pencil' && isDrawingZoneRef.current) {
      if (zoneShape === 'pencil') {
        const lastPt = activeZonePoints[activeZonePoints.length - 1];
        const dist = lastPt ? Math.sqrt((floatCoords.col - lastPt.x)**2 + (floatCoords.row - lastPt.z)**2) : 999;
        if (dist > 0.15) { // 0.15 cell threshold for fine-grained drawing detail
          setActiveZonePoints(prev => [...prev, { x: floatCoords.col, z: floatCoords.row }]);
        }
      } else {
        const startPt = zoneAnchorRef.current;
        if (startPt) {
          const sx = startPt.x;
          const sz = startPt.z;
          const cx = floatCoords.col;
          const cz = floatCoords.row;
          
          if (zoneShape === 'rectangle') {
            setActiveZonePoints([
              { x: sx, z: sz },
              { x: cx, z: sz },
              { x: cx, z: cz },
              { x: sx, z: cz }
            ]);
          } else if (zoneShape === 'square') {
            const dx = cx - sx;
            const dz = cz - sz;
            const side = Math.max(Math.abs(dx), Math.abs(dz));
            const adjCx = sx + Math.sign(dx) * side;
            const adjCz = sz + Math.sign(dz) * side;
            setActiveZonePoints([
              { x: sx, z: sz },
              { x: adjCx, z: sz },
              { x: adjCx, z: adjCz },
              { x: sx, z: adjCz }
            ]);
          } else if (zoneShape === 'triangle') {
            setActiveZonePoints([
              { x: (sx + cx) / 2, z: sz },
              { x: cx, z: cz },
              { x: sx, z: cz }
            ]);
          }
        }
      }
      return;
    }

    if (draggingAssetId) {
      const newCol = floatCoords.col - dragOffset.current.col;
      const newRow = floatCoords.row - dragOffset.current.row;
      updateAsset(draggingAssetId, { col: newCol, row: newRow }, false); // local-only update during drag
    }

    if (marqueeStart) {
      setMarqueeEnd(floatCoords);
    }
  }

  function onMouseUp() {
    setPanning(false);
    panStart.current = null;

    if (cityTool === 'pencil' && isDrawingZoneRef.current) {
      isDrawingZoneRef.current = false;
      if (activeZonePoints.length >= 3) {
        const closedPoints = [...activeZonePoints, { x: activeZonePoints[0].x, z: activeZonePoints[0].z }];
        setTimeout(() => {
          const name = prompt('Enter a name for this zone:', `Zone ${city?.zones?.length + 1 || 1}`);
          if (name) {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const snappedPoints = snapZonePointsToSurrounding(closedPoints, city?.zones || [], 4.0);
            
            let overlaps = false;
            if (city?.zones) {
              for (const z of city.zones) {
                if (doPolygonsOverlap(snappedPoints, z.points)) {
                  overlaps = true;
                  break;
                }
              }
            }
            
            if (overlaps) {
              alert("Zone overlaps with an existing zone! Overlapping zones are not allowed.");
            } else {
              addZone(name, snappedPoints, color);
            }
          }
          setActiveZonePoints([]);
        }, 50);
      } else {
        setActiveZonePoints([]);
      }
      return;
    }

    if (draggingAssetId) {
      const latestCity = useStore.getState().city;
      const asset = (latestCity?.placedAssets || []).find(a => a.id === draggingAssetId);
      if (asset) {
        if (dragStartPos.current && (dragStartPos.current.col !== asset.col || dragStartPos.current.row !== asset.row)) {
          useStore.getState().pushCityUndo({
            type: 'UPDATE_ASSET',
            assetId: draggingAssetId,
            updates: { col: dragStartPos.current.col, row: dragStartPos.current.row }
          });
        }
        updateAsset(draggingAssetId, { col: asset.col, row: asset.row }, true, true); // save final to server, skipUndo = true
      }
      setDraggingAssetId(null);
    }
    if (marqueeStart && marqueeEnd) {
      const minCol = Math.min(marqueeStart.col, marqueeEnd.col);
      const maxCol = Math.max(marqueeStart.col, marqueeEnd.col);
      const minRow = Math.min(marqueeStart.row, marqueeEnd.row);
      const maxRow = Math.max(marqueeStart.row, marqueeEnd.row);

      const width = maxCol - minCol;
      const height = maxRow - minRow;

      if (cityTool === 'erase') {
        if (width > 0.1 || height > 0.1) {
          // Marquee drag: Delete assets inside marquee box
          const assetsToDelete = (city?.placedAssets || []).filter(a => {
            return a.col >= minCol && a.col <= maxCol &&
                   a.row >= minRow && a.row <= maxRow;
          });
          const roadsToDelete = (city?.roads || []).filter(road => {
            return road.points.some(pt => pt.x >= minCol && pt.x <= maxCol && pt.z >= minRow && pt.z <= maxRow);
          });
          const zonesToDelete = (city?.zones || []).filter(zone => {
            let sumX = 0, sumZ = 0;
            zone.points.forEach(pt => { sumX += pt.x; sumZ += pt.z; });
            const cx = sumX / zone.points.length;
            const cz = sumZ / zone.points.length;
            return cx >= minCol && cx <= maxCol &&
                   cz >= minRow && cz <= maxRow;
          });

          if (assetsToDelete.length > 0 || roadsToDelete.length > 0 || zonesToDelete.length > 0) {
            const compoundActions = [];
            assetsToDelete.forEach(a => compoundActions.push({ type: 'PLACE_ASSET', asset: a }));
            roadsToDelete.forEach(r => compoundActions.push({ type: 'ADD_ROAD', road: r }));
            useStore.getState().pushCityUndo({ type: 'COMPOUND', actions: compoundActions });

            assetsToDelete.forEach(a => removeAsset(a.id, true));
            roadsToDelete.forEach(r => removeRoadSegment(r.id, true));
            zonesToDelete.forEach(z => removeZone(z.id));
          }
        } else {
          // Single click: delete whatever was clicked
          const clickCol = marqueeStart.col;
          const clickRow = marqueeStart.row;
          const asset = assetAtCell(clickCol, clickRow);
          if (asset) {
            removeAsset(asset.id);
            selectAsset(null);
          } else {
            const road = roadAtCoords(clickCol, clickRow);
            if (road) {
              removeRoadSegment(road.id);
            } else {
              // Check if we clicked near a zone centroid to delete it
              const zone = (city?.zones || []).find(z => {
                let sumX = 0, sumZ = 0;
                z.points.forEach(pt => { sumX += pt.x; sumZ += pt.z; });
                const cx = sumX / z.points.length;
                const cz = sumZ / z.points.length;
                const dist = Math.sqrt((clickCol - cx)**2 + (clickRow - cz)**2);
                return dist < 1.5; // click within 1.5 cells of centroid
              });
              if (zone) {
                removeZone(zone.id);
              }
            }
          }
        }
      } else if (cityTool === 'select') {
        if (width > 0.1 || height > 0.1) {
          // Marquee select
          const assetsToSelect = (city?.placedAssets || []).filter(a => {
            const w = a.width || 1;
            const h = a.height || 1;
            return !a.locked && !(a.col + w < minCol || a.col > maxCol || a.row + h < minRow || a.row > maxRow);
          });
          const ids = assetsToSelect.map(a => a.id);
          selectAssets(ids);
          setSelectedRoadId(null);
          setSelectedCell(null);
        } else {
          // Single click
          const clickCol = marqueeStart.col;
          const clickRow = marqueeStart.row;
          const road = roadAtCoords(clickCol, clickRow);
          if (road && !road.locked) {
            selectAsset(null);
            setSelectedRoadId(road.id);
            setSelectedCell(null);
          } else {
            // Check if we clicked inside a zone polygon!
            const clickedZone = (city?.zones || []).find(z => isPointInPolygon({ x: clickCol, z: clickRow }, z.points));
            if (clickedZone) {
              selectAsset(null);
              setSelectedRoadId(null);
              setSelectedCell(null);
              setSelectedZoneId(clickedZone.id);
              setShowObjectsPanel(true); // auto-open objects panel to edit the zone!
            } else {
              // Single click empty space: clear selections
              selectAsset(null);
              setSelectedRoadId(null);
              setSelectedCell(null);
              setSelectedZoneId(null);
            }
          }
        }
      }

      setMarqueeStart(null);
      setMarqueeEnd(null);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.82 : 1.22;
    const currentTargetZoom = targetZoomRef.current;
    const nextZoom = Math.max(0.05, Math.min(3.5, currentTargetZoom * delta));

    if (currentTargetZoom !== nextZoom) {
      targetZoomRef.current = nextZoom;
      targetOffsetRef.current = {
        x: mx - (mx - targetOffsetRef.current.x) * (nextZoom / currentTargetZoom),
        y: my - (my - targetOffsetRef.current.y) * (nextZoom / currentTargetZoom)
      };
    }
  }

  const selectedAsset = selectedAssetId ? (city?.placedAssets || []).find(a => a.id === selectedAssetId) : null;
  const selectedRoad = selectedRoadId ? (city?.roads || []).find(r => r.id === selectedRoadId) : null;
  const selectedZone = selectedZoneId ? (city?.zones || []).find(z => z.id === selectedZoneId) : null;

  let centroidScreen = null;
  if (selectedZone && !streetView) {
    let sumX = 0, sumZ = 0;
    const pts = selectedZone.points.slice(0, -1); // exclude closing point duplicate for correct centroid
    pts.forEach(pt => {
      sumX += pt.x;
      sumZ += pt.z;
    });
    const cx = sumX / pts.length;
    const cz = sumZ / pts.length;
    centroidScreen = {
      x: offset.x + cx * cellSize,
      y: offset.y + cz * cellSize
    };
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Map / Street view canvas ── */}
      {streetView ? (
        <StreetView
          city={city}
          onExit={() => setStreetView(false)}
          selectedRoadId={selectedRoadId}
          setSelectedRoadId={setSelectedRoadId}
          intersections={intersections}
          gameTime={gameTime}
          metroView={metroView}
          setAssetContextMenu={setAssetContextMenu}
          containerRef={containerRef}
          getInitialClampedCoords={getInitialClampedCoords}
          showColorRandomizer={showColorRandomizer}
          waypoint={waypoint}
        />
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display:'block', cursor: panning ? 'grabbing' : cityTool==='select'?'default':'crosshair' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onDoubleClick={onDoubleClick}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {/* Centroid floating editor card for selected zone */}
      {selectedZone && centroidScreen && (
        <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
          position: 'absolute',
          left: centroidScreen.x - 70,
          top: centroidScreen.y - 45,
          zIndex: 105,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 6,
          borderRadius: 12,
          animation: 'fadeIn 0.15s ease',
          pointerEvents: 'auto',
          minWidth: 140,
          border: zoneView ? '1px solid rgba(255,255,255,0.7)' : undefined,
          boxShadow: zoneView ? undefined : '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <input
              type="text"
              value={selectedZone.name}
              onChange={(e) => updateZone(selectedZone.id, { name: e.target.value })}
              className={zoneView ? "clay-input" : ""}
              style={{
                width: 90,
                fontSize: 9,
                padding: '2px 4px',
                background: zoneView ? '#ffffff' : 'rgba(0,0,0,0.3)',
                border: zoneView ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4,
                color: zoneView ? '#1e293b' : '#ffffff',
                fontWeight: 600,
                outline: 'none'
              }}
            />
            <SmoothColorPicker
              value={selectedZone.color || '#4ECDC4'}
              onChange={(e) => updateZone(selectedZone.id, { color: e.target.value })}
              style={{ width: 16, height: 12, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={zoneView ? "clay-button danger" : "glass-button danger"}
              onClick={() => {
                removeZone(selectedZone.id);
                setSelectedZoneId(null);
              }}
              style={{ flex: 1, padding: '2px 6px', fontSize: 8, height: 18, border: 'none', borderRadius: 6 }}
            >
              Delete
            </button>
            <button
              className={zoneView ? "clay-button" : "glass-button"}
              onClick={() => setSelectedZoneId(null)}
              style={{ flex: 1, padding: '2px 6px', fontSize: 8, height: 18, border: 'none', borderRadius: 6 }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Glassmorphic Context Menu (Asset & Road) ── */}
      {assetContextMenu && (() => {
        const { x, y, type } = assetContextMenu;
        const isAsset = type === 'asset';
        const asset = isAsset ? assetContextMenu.asset : null;
        const road  = !isAsset ? assetContextMenu.road : null;

        const menuW = 222;


        const rotDeg = isAsset ? Math.round(((asset.rotation || 0) * 180 / Math.PI) % 360 + 360) % 360 : 0;

        return (
          <div
            className="asset-ctx-menu"
            style={{ left: x, top: y, width: menuW }}
            onMouseDown={handleMenuMouseDown}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* ── Header ── */}
            <div className="asset-ctx-header">
              <div className="asset-ctx-icon" style={{ background: isAsset ? 'linear-gradient(135deg,rgba(99,102,241,.55),rgba(168,85,247,.55))' : 'linear-gradient(135deg,rgba(16,185,129,.45),rgba(6,182,212,.45))' }}>
                <Icon name={isAsset ? 'building' : 'roadInfo'} size={15} color="#fff" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="asset-ctx-name">
                  {isAsset ? asset.name : `${road.roadType || 'Standard'} Road`}
                </div>
                <div className="asset-ctx-sub">
                  {isAsset
                    ? `(${asset.col.toFixed(1)}, ${asset.row.toFixed(1)}) · @${asset.placedBy}`
                    : `${road.points?.length || 0} nodes · Right-click to manage`}
                </div>
              </div>
            </div>

            {/* ── ASSET-ONLY sections ── */}
            {isAsset && (
              <>
                {/* Station Name Input */}
                {(asset.isMetroStation || asset.name === 'Elevated Metro Station' || asset.name === 'Metro Station') && (
                  <div style={{ padding: '4px 10px 8px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="pencil" size={11} /> Station Name
                    </div>
                    <input
                      type="text"
                      className="glass-input"
                      value={asset.customName || ''}
                      placeholder="e.g. Central Station"
                      onChange={(e) => {
                        const newName = e.target.value;
                        updateAsset(asset.id, { customName: newName });
                        setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, customName: newName } } : null);
                      }}
                      style={{
                        width: '100%',
                        fontSize: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 6,
                        color: '#fff',
                        padding: '4px 8px',
                        outline: 'none'
                      }}
                    />
                    <div className="asset-ctx-divider" style={{ marginTop: 8 }} />
                  </div>
                )}
                {/* Scale */}
                <div className="asset-ctx-scale-row">
                  <label>Scale</label>
                  <input
                    type="range"
                    min={Math.min(0.1, getMaxScaleFactor(asset)).toFixed(2)}
                    max={getMaxScaleFactor(asset).toFixed(2)}
                    step="0.05"
                    value={asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : getDefaultScaleFactor(asset)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      updateAsset(asset.id, { scaleMultiplier: v });
                      setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, scaleMultiplier: v } } : null);
                    }}
                  />
                  <span className="asset-ctx-scale-val">
                    {(asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : getDefaultScaleFactor(asset)).toFixed(2)}×
                  </span>
                </div>

                <div className="asset-ctx-divider" />

                {/* Rotation row: slider + number input + 15°/90° buttons */}
                <div style={{ padding: '6px 10px 6px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:4 }}>
                      <Icon name="rotateCW" size={11} /> Rotation
                    </span>
                    <input
                      type="number"
                      min={0} max={359} step={1}
                      value={rotDeg}
                      onChange={(e) => {
                        let deg = parseInt(e.target.value) || 0;
                        deg = ((deg % 360) + 360) % 360;
                        const rad = deg * Math.PI / 180;
                        updateAsset(asset.id, { rotation: rad });
                        setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, rotation: rad } } : null);
                      }}
                      style={{ width: 48, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, color:'#818cf8', fontSize:11, fontWeight:700, textAlign:'center', padding:'1px 4px' }}
                    />
                  </div>
                  <input
                    type="range" min={0} max={359} step={1}
                    value={rotDeg}
                    onChange={(e) => {
                      const deg = parseInt(e.target.value);
                      const rad = deg * Math.PI / 180;
                      updateAsset(asset.id, { rotation: rad });
                      setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, rotation: rad } } : null);
                    }}
                    style={{ width:'100%', accentColor:'#818cf8', marginBottom: 6 }}
                  />
                  {/* 15° / 90° buttons in one row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4 }}>
                    {[
                      { label:'-90°', delta:-90 }, { label:'-15°', delta:-15 },
                      { label:'+15°', delta:15  }, { label:'+90°', delta:90  }
                    ].map(btn => (
                      <button
                        key={btn.label}
                        className="asset-ctx-item accent"
                        style={{ padding:'4px 2px', justifyContent:'center', borderRadius:8, fontSize:10, fontWeight:700 }}
                        onClick={() => {
                          const newDeg = ((rotDeg + btn.delta) % 360 + 360) % 360;
                          const rad = newDeg * Math.PI / 180;
                          updateAsset(asset.id, { rotation: rad });
                          setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, rotation: rad } } : null);
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="asset-ctx-divider" />

                {/* Per-object color pickers */}
                {asset.objects && asset.objects.length > 0 && (
                  <div style={{ padding:'4px 10px 6px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                      <Icon name="palette" size={11} color="rgba(255,255,255,0.45)" />
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>Object Colors</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:72, overflowY:'auto' }}>
                      {asset.objects.map((obj, idx) => (
                        <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.04)', padding:'3px 6px', borderRadius:6 }}>
                          <span style={{ fontSize:9, color:'rgba(255,255,255,0.55)', textTransform:'capitalize', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>
                            {idx + 1}. {obj.geometry}
                          </span>
                          <SmoothColorPicker
                            value={obj.color || '#4ECDC4'}
                            onChange={(e) => {
                              const newObjects = asset.objects.map((o, oIdx) => oIdx === idx ? { ...o, color: e.target.value } : o);
                              updateAsset(asset.id, { objects: newObjects });
                              setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, objects: newObjects } } : null);
                            }}
                            style={{ width:16, height:14, border:'none', padding:0, background:'none' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Randomise Colours */}
                <button
                  className="asset-ctx-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorRandomizer(prevVal => {
                      const newVal = !prevVal;
                      setAssetContextMenu(prev => {
                        if (!prev) return null;
                        const isAsset = prev.type === 'asset';
                        const menuW = 222;
                        const menuH = isAsset ? (newVal ? 560 : 420) : 200;
                        const containerW = containerRef.current?.offsetWidth || window.innerWidth;
                        const containerH = containerRef.current?.offsetHeight || window.innerHeight;
                        const clampedX = Math.max(12, Math.min(prev.x, containerW - menuW - 12));
                        const clampedY = Math.max(12, Math.min(prev.y, containerH - menuH - 12));
                        return { ...prev, x: clampedX, y: clampedY };
                      });
                      return newVal;
                    });
                  }}
                  style={{ justifyContent: 'space-between', marginTop: 2, background: 'rgba(255,255,255,0.02)' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🎨</span> Randomise Colours
                  </span>
                  <span style={{ fontSize: 9, opacity: 0.7 }}>{showColorRandomizer ? '▼' : '▶'}</span>
                </button>

                {showColorRandomizer && (
                  <div style={{ padding: '6px 10px 8px', display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.15)', borderRadius: 8, margin: '2px 4px 6px' }}>
                    {/* Preset Palettes */}
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>Palette Presets</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {PRESET_PALETTES.map(p => (
                        <button
                          key={p.id}
                          className={`btn sm ${activePaletteId === p.id ? 'primary' : ''}`}
                          style={{
                            fontSize: 9,
                            padding: '3px 4px',
                            background: activePaletteId === p.id ? 'rgba(129, 140, 248, 0.2)' : 'rgba(0,0,0,0.2)',
                            color: activePaletteId === p.id ? '#818cf8' : '#ccc',
                            border: activePaletteId === p.id ? '1px solid rgba(129,140,248,0.5)' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectActivePalette(p.id);
                          }}
                        >
                          {p.name.replace(' Architecture', '').replace(' City', '').replace(' Breeze', '')}
                        </button>
                      ))}
                    </div>

                    {/* Circular Color Swatches */}
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Toggle Swatch Colors</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(PRESET_PALETTES.find(p => p.id === activePaletteId)?.colors || []).map(colorFamily => {
                        const isSelected = randomColorPalette.includes(colorFamily.id);
                        return (
                          <button
                            key={colorFamily.id}
                            title={colorFamily.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleColorFamilyInPalette(colorFamily.id);
                            }}
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: colorFamily.color,
                              border: isSelected ? '2px solid #fff' : '2px solid transparent',
                              boxShadow: isSelected ? '0 0 4px rgba(255,255,255,0.6)' : 'none',
                              opacity: isSelected ? 1 : 0.3,
                              cursor: 'pointer',
                              padding: 0,
                              transition: 'all 0.15s ease'
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Re-roll Button */}
                    <button
                      className="asset-ctx-item accent"
                      style={{
                        marginTop: 4,
                        padding: '5px 10px',
                        justifyContent: 'center',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #818cf8, #a855f7)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const original = asset.originalObjects || TEMPLATES.find(t => t.name === asset.name)?.objects || asset.objects;
                        const randomized = randomizeObjectsColor(original, randomColorPalette, activePaletteId);
                        
                        updateAsset(asset.id, { objects: randomized, originalObjects: original });
                        setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, objects: randomized, originalObjects: original } } : null);
                      }}
                    >
                      🎲 Re-roll Colors
                    </button>
                  </div>
                )}

                <div className="asset-ctx-divider" />
              </>
            )}

            {/* ── Shared action buttons ── */}
            <div className="asset-ctx-items">
              {/* Lock / Unlock */}
              <button
                className="asset-ctx-item success"
                onClick={() => {
                  if (isAsset) {
                    updateAsset(asset.id, { locked: !asset.locked });
                    setAssetContextMenu(prev => prev ? { ...prev, asset: { ...prev.asset, locked: !prev.asset.locked } } : null);
                  } else {
                    updateRoad(road.id, { locked: !road.locked });
                    setAssetContextMenu(prev => prev ? { ...prev, road: { ...prev.road, locked: !prev.road.locked } } : null);
                  }
                }}
              >
                <span className="asset-ctx-icon-badge" style={{ background:'rgba(52,211,153,0.12)' }}>
                  <Icon name={((isAsset ? asset.locked : road.locked)) ? 'unlock' : 'lock'} size={13} color="#34d399" />
                </span>
                {((isAsset ? asset.locked : road.locked)) ? 'Unlock' : 'Lock'}
              </button>

              {/* Delete */}
              <button
                className="asset-ctx-item danger"
                onClick={() => {
                  if (isAsset) {
                    removeAsset(asset.id);
                    selectAsset(null);
                  } else {
                    removeRoadSegment(road.id);
                    setSelectedRoadId(null);
                  }
                  setAssetContextMenu(null);
                }}
              >
                <span className="asset-ctx-icon-badge" style={{ background:'rgba(239,68,68,0.12)' }}>
                  <Icon name="trash" size={13} color="#f87171" />
                </span>
                Delete {isAsset ? 'Building' : 'Road'}
              </button>

              {/* Dismiss */}
              <button
                className="asset-ctx-item"
                onClick={() => setAssetContextMenu(null)}
                style={{ opacity: 0.45, marginTop: 1 }}
              >
                <span className="asset-ctx-icon-badge" style={{ background:'rgba(255,255,255,0.04)' }}>
                  <Icon name="close" size={12} />
                </span>
                Dismiss
              </button>
            </div>
          </div>
        );
      })()}


      {/* ── Top-Left: City Info Pill ── */}
      {!showCitiesManager && (
        <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
          position: 'absolute',
          top: 80,
          left: 16,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 20,
          pointerEvents: 'none',
          border: zoneView ? '1px solid rgba(255, 255, 255, 0.6)' : undefined
        }}>
          <Icon name="city" size={18} color={zoneView ? '#1e293b' : 'rgba(255,255,255,0.9)'} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', color: zoneView ? '#1e293b' : '#ffffff' }}>{city?.name || 'Loading…'}</div>
            <div style={{ fontSize: 9, opacity: 0.8, whiteSpace: 'nowrap', color: zoneView ? '#64748b' : 'rgba(255,255,255,0.8)' }}>{presence.length} player{presence.length!==1?'s':''} online</div>
            <div style={{ fontSize: 10, color: zoneView ? '#2563eb' : '#60a5fa', fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap' }}>
              {formatGameTime(gameTime)}
            </div>
          </div>
        </div>
      )}

      {/* ── Top-Center: Tooltip / Placement Banner ── */}
      {pendingPlacementAsset && !streetView && (
        <div className="glass-panel" style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: 20,
          padding: '6px 16px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: '1px solid var(--accent)'
        }}>
          <Icon name="place" size={16} color="#60a5fa" />
          <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 600 }}>
            Click to place "{pendingPlacementAsset.name}" ({pendingPlacementAsset.width.toFixed(0)}x{pendingPlacementAsset.height.toFixed(0)})
          </span>
          <button
            className="glass-button danger"
            onClick={() => useStore.setState({ pendingPlacementAsset: null })}
            style={{ padding: '2px 8px', fontSize: 10, borderRadius: 12 }}
          >
            Cancel
          </button>
        </div>
      )}

      {hoveredFloat && !streetView && !pendingPlacementAsset && (
        <div className="glass-panel" style={{
          position:'absolute',
          top: 80,
          left:'50%',
          transform:'translateX(-50%)',
          borderRadius: 20,
          padding:'4px 14px',
          fontSize:10,
          pointerEvents:'none',
          whiteSpace:'nowrap',
          zIndex: 100
        }}>
          ({hoveredFloat.col.toFixed(1)}, {hoveredFloat.row.toFixed(1)}) · {assetAtCell(hoveredFloat.col, hoveredFloat.row) ? assetAtCell(hoveredFloat.col, hoveredFloat.row).name : (roadAtCoords(hoveredFloat.col, hoveredFloat.row) ? 'Road' : 'Empty')} · Tool: {TOOLS.find(t=>t.id===cityTool)?.label || 'Place'}
        </div>
      )}

      {/* ── Left-Side: Floating Tools Toolbar ── */}
      {!showCitiesManager && (
        <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
        position: 'absolute',
        left: 16,
        top: 136,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 10,
        width: 50,
        alignItems: 'center',
        borderRadius: 25
      }}>
        <button
          className={zoneView ? `clay-button ${cityTool === 'select' && !pendingPlacementAsset ? 'active' : ''}` : `glass-button ${cityTool === 'select' && !pendingPlacementAsset ? 'active' : ''}`}
          onClick={() => {
            useStore.setState({ cityTool: 'select', pendingPlacementAsset: null });
          }}
          title="Select Tool"
          style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 14, border: 'none', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon name="select" size={14} />
        </button>
        <button
          className={zoneView ? `clay-button ${cityTool === 'pencil' ? 'active' : ''}` : `glass-button ${cityTool === 'pencil' ? 'active' : ''}`}
          onClick={() => {
            useStore.setState({ cityTool: 'pencil', pendingPlacementAsset: null });
            setActiveCategory(null);
          }}
          title="Zone Pencil"
          style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 14, border: 'none', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon name="pencil" size={14} />
        </button>
        <button
          className={zoneView ? `clay-button ${cityTool === 'erase' ? 'active' : ''}` : `glass-button ${cityTool === 'erase' ? 'active' : ''}`}
          onClick={() => {
            useStore.setState({ cityTool: 'erase', pendingPlacementAsset: null });
            setActiveCategory(null);
          }}
          title="Erase Tool"
          style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 14, border: 'none', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon name="erase" size={14} />
        </button>
        
        <div style={{ height: 1, width: '70%', background: zoneView ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
        
        <button
          className={zoneView ? "clay-button" : "glass-button"}
          onClick={() => { lockAllAssets(true); setSelectedRoadId(null); }}
          title="Lock all objects"
          style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 12, border: 'none', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon name="lock" size={14} />
        </button>
        <button
          className={zoneView ? "clay-button" : "glass-button"}
          onClick={() => lockAllAssets(false)}
          title="Unlock all objects"
          style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 12, border: 'none', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon name="unlock" size={14} />
        </button>
 
        <div style={{ height: 1, width: '70%', background: zoneView ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
 
        <button
          className={zoneView ? "clay-button" : "glass-button"}
          onClick={() => undoCity()}
          title="Undo (Ctrl+Z)"
          style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 12, border: 'none', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon name="undo" size={14} />
        </button>
 
        <button
          className={zoneView ? "clay-button danger" : "glass-button danger"}
          onClick={() => {
            if (window.confirm("Are you sure you want to clean the entire city? This will remove all zones, roads, and placed buildings!")) {
              clearCity();
            }
          }}
          title="Clean City"
          style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 12, border: 'none', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <Icon name="sweep" size={14} />
        </button>
      </div>
      )}

      {/* Flyout shape options for Pencil Tool */}
      {cityTool === 'pencil' && (
        <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
          position: 'absolute',
          left: 74,
          top: 176, // aligned with the pencil tool button
          zIndex: 100,
          display: 'flex',
          gap: 6,
          padding: 6,
          borderRadius: 20,
          animation: 'fadeIn 0.2s ease'
        }}>
          {[
            { id: 'pencil', label: 'Freeform', iconName: 'freeform' },
            { id: 'rectangle', label: 'Rect', iconName: 'rectangle' },
            { id: 'square', label: 'Square', iconName: 'square' },
            { id: 'triangle', label: 'Triangle', iconName: 'triangle' }
          ].map(s => (
            <button
              key={s.id}
              className={zoneView ? `clay-button ${zoneShape === s.id ? 'active' : ''}` : `glass-button ${zoneShape === s.id ? 'active' : ''}`}
              onClick={() => {
                setZoneShape(s.id);
                setActiveZonePoints([]);
              }}
              style={{
                borderRadius: 14,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 600,
                height: 28
              }}
              title={s.label}
            >
              <Icon name={s.iconName} size={12} />
              <span style={{ fontSize: 9 }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Top-Right: View Toggles & Placed Objects Menu ── */}
      {!showCitiesManager && (
        <div style={{ position: 'absolute', top: 80, right: 16, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8 }}>
          <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 20,
            pointerEvents: 'auto'
          }}>
            {[
              {
                id: 'waypoint',
                label: '',
                iconElement: (
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
                    <path d="M10 2.5C7.2 2.5 5 4.7 5 7.5C5 11.5 10 16 10 16C10 16 15 11.5 15 7.5C15 4.7 12.8 2.5 10 2.5ZM10 10C8.6 10 7.5 8.9 7.5 7.5C7.5 6.1 8.6 5 10 5C11.4 5 12.5 6.1 12.5 7.5C12.5 8.9 11.4 10 10 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                    <circle cx="10" cy="18" r="1" fill="currentColor" />
                  </svg>
                )
              },
              { id: 'map', label: 'Map', iconName: 'map' },
              { id: 'street', label: 'Street', iconName: 'street' },
              { id: 'zone', label: 'Zone', iconName: 'zone' },
              { id: 'metro', label: 'Metro', iconName: 'train' }
            ].map(v => {
              const isAct = v.id === 'waypoint' ? isSettingWaypoint : (v.id === 'street' ? streetView : (v.id === 'zone' ? zoneView : (v.id === 'metro' ? metroView : (!streetView && !zoneView && !metroView && !isSettingWaypoint))));
              const activeTheme = zoneView || metroView;
              return (
                <button
                  key={v.id}
                  className={activeTheme ? `clay-button ${isAct ? 'active' : ''}` : `glass-button ${isAct ? 'active' : ''}`}
                  onClick={() => {
                    if (v.id === 'waypoint') {
                      setIsSettingWaypoint(!isSettingWaypoint);
                      setStreetView(false);
                      setZoneView(false);
                      setMetroView(false);
                      useStore.setState({ cityTool: 'select' });
                    } else {
                      setIsSettingWaypoint(false);
                      if (v.id === 'street') {
                        setStreetView(true);
                        setZoneView(false);
                        setMetroView(false);
                      } else if (v.id === 'zone') {
                        setStreetView(false);
                        setZoneView(true);
                        setMetroView(false);
                        setSelectedZoneId(null);
                        useStore.setState({ cityTool: 'pencil' });
                      } else if (v.id === 'metro') {
                        setStreetView(false);
                        setZoneView(false);
                        setMetroView(true);
                        useStore.setState({ cityTool: 'select', pendingPlacementAsset: null });
                      } else {
                        setStreetView(false);
                        setZoneView(false);
                        setMetroView(false);
                      }
                    }
                  }}
                  style={{
                    borderRadius: 16,
                    padding: '4px 10px',
                    fontSize: 10,
                    fontWeight: 600,
                    height: 28,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {v.iconElement ? v.iconElement : <Icon name={v.iconName} size={12} />}
                  {v.label && <span>{v.label}</span>}
                </button>
              );
            })}
          </div>

          <button
            className={zoneView ? `clay-button ${showObjectsPanel ? 'active' : ''}` : `glass-button ${showObjectsPanel ? 'active' : ''}`}
            onClick={() => {
              setShowObjectsPanel(!showObjectsPanel);
              setShowCitiesManager(false);
            }}
            style={{ height: 36, padding: '0 14px', fontWeight: 600, border: 'none', display:'flex', alignItems:'center', gap: 6 }}
          >
            <Icon name="stats" size={13} />
            {zoneView ? 'Zones' : 'Objects'} ({zoneView ? (city?.zones || []).length : ((city?.placedAssets || []).length + (city?.roads || []).length)})
          </button>

          <button
            className={zoneView ? `clay-button ${showCitiesManager ? 'active' : ''}` : `glass-button ${showCitiesManager ? 'active' : ''}`}
            onClick={() => {
              setShowCitiesManager(!showCitiesManager);
              setShowObjectsPanel(false);
            }}
            style={{ height: 36, padding: '0 14px', fontWeight: 600, border: 'none', display:'flex', alignItems:'center', gap: 6 }}
          >
            <Icon name="city" size={13} />
            MyCities
          </button>
        </div>

        {/* Objects Panel Overlay */}
        {showObjectsPanel && (
          <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
            width: 240,
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 10,
            gap: 8,
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              borderBottom: zoneView ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)',
              paddingBottom: 6,
              color: zoneView ? '#1e293b' : '#ffffff'
            }}>
              <span style={{display:'flex',alignItems:'center',gap:5}}><Icon name={zoneView ? 'zone' : 'building'} size={12}/>{zoneView ? 'City Zones' : 'Placed Objects'}</span>
            </div>
            
            {/* Selected item details when open */}
            {selectedAssetIds && selectedAssetIds.length > 1 ? (
              <div style={{ padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#ffffff' }}>
                  Selected: {selectedAssetIds.length} Buildings
                </div>
                <button
                  className="glass-button danger"
                  style={{ width: '100%', padding: '4px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}
                  onClick={() => removeAssets(selectedAssetIds)}
                >
                  <Icon name="trash" size={11}/> Delete Selected
                </button>
              </div>
            ) : selectedAsset ? (
              <div style={{ padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '25vh', overflowY: 'auto' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#ffffff' }}>{selectedAsset.name}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>
                  Placed by @{selectedAsset.placedBy} · ({selectedAsset.col.toFixed(1)}, {selectedAsset.row.toFixed(1)})
                </div>
                
                {/* Scale */}
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
                    <span>Scale</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      {(selectedAsset.scaleMultiplier !== undefined ? selectedAsset.scaleMultiplier : getDefaultScaleFactor(selectedAsset)).toFixed(2)}x
                    </span>
                  </label>
                  <input
                    type="range"
                    min={Math.min(0.1, getMaxScaleFactor(selectedAsset)).toFixed(2)}
                    max={getMaxScaleFactor(selectedAsset).toFixed(2)}
                    step="0.05"
                    value={selectedAsset.scaleMultiplier !== undefined ? selectedAsset.scaleMultiplier : getDefaultScaleFactor(selectedAsset)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateAsset(selectedAsset.id, { scaleMultiplier: val });
                    }}
                    disabled={selectedAsset.locked}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Nudge */}
                <div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 4 }}>Position Nudge</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, justifyItems: 'center', alignItems: 'center' }}>
                    <div />
                    <button
                      className="glass-button"
                      style={{ padding: '1px 5px', fontSize: 8 }}
                      onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row - 0.2 })}
                      disabled={selectedAsset.locked}
                    >
                      ▲
                    </button>
                    <div />
                    
                    <button
                      className="glass-button"
                      style={{ padding: '1px 5px', fontSize: 8 }}
                      onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col - 0.2 })}
                      disabled={selectedAsset.locked}
                    >
                      ◀
                    </button>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Move</div>
                    <button
                      className="glass-button"
                      style={{ padding: '1px 5px', fontSize: 8 }}
                      onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col + 0.2 })}
                      disabled={selectedAsset.locked}
                    >
                      ▶
                    </button>
                    
                    <div />
                    <button
                      className="glass-button"
                      style={{ padding: '1px 5px', fontSize: 8 }}
                      onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row + 0.2 })}
                      disabled={selectedAsset.locked}
                    >
                      ▼
                    </button>
                    <div />
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                    <span>Rotation</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={Math.round(((selectedAsset.rotation || 0) * 180 / Math.PI) % 360 + 360) % 360}
                        onChange={(e) => {
                          let deg = parseInt(e.target.value);
                          if (isNaN(deg)) deg = 0;
                          deg = (deg % 360 + 360) % 360;
                          const rad = (deg * Math.PI) / 180;
                          updateAsset(selectedAsset.id, { rotation: rad });
                        }}
                        disabled={selectedAsset.locked}
                        style={{
                          width: 32,
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 3,
                          color: '#60a5fa',
                          fontSize: 8,
                          textAlign: 'center',
                        }}
                      />
                      <span>°</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={Math.round(((selectedAsset.rotation || 0) * 180 / Math.PI) % 360 + 360) % 360}
                    onChange={(e) => {
                      const deg = parseInt(e.target.value);
                      const rad = (deg * Math.PI) / 180;
                      updateAsset(selectedAsset.id, { rotation: rad });
                    }}
                    disabled={selectedAsset.locked}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Colors */}
                {selectedAsset.objects && selectedAsset.objects.length > 0 && (
                  <div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 4 }}>Object Colors</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 60, overflowY: 'auto' }}>
                      {selectedAsset.objects.map((obj, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: 4 }}>
                          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
                            {idx + 1}. {obj.geometry}
                          </span>
                          <SmoothColorPicker
                            value={obj.color || '#4ECDC4'}
                            onChange={(e) => {
                              const newObjects = selectedAsset.objects.map((o, oIdx) => {
                                  if (oIdx === idx) {
                                    return { ...o, color: e.target.value };
                                  }
                                  return o;
                                });
                                updateAsset(selectedAsset.id, { objects: newObjects });
                            }}
                            disabled={selectedAsset.locked}
                            style={{
                              width: 14, height: 12, border: 'none', padding: 0,
                              background: 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button
                    className="glass-button danger"
                    style={{ flex: 1, height: 22, fontSize: 9 }}
                    onClick={() => {
                      removeAsset(selectedAsset.id);
                      selectAsset(null);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="glass-button"
                    style={{ flex: 1, height: 22, fontSize: 9 }}
                    onClick={() => {
                      updateAsset(selectedAsset.id, { locked: !selectedAsset.locked });
                    }}
                  >
                    {selectedAsset.locked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              </div>
            ) : selectedRoad ? (
              <div style={{ padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#ffffff' }}>Selected Road</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'capitalize' }}>
                    Type: {selectedRoad.roadType || 'standard'} · Nodes: {selectedRoad.points?.length || 0}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button
                    className="glass-button danger"
                    style={{ flex: 1, height: 22, fontSize: 9 }}
                    onClick={() => {
                      removeRoadSegment(selectedRoad.id);
                      setSelectedRoadId(null);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="glass-button"
                    style={{ flex: 1, height: 22, fontSize: 9 }}
                    onClick={() => {
                      updateRoad(selectedRoad.id, { locked: !selectedRoad.locked });
                    }}
                  >
                    {selectedRoad.locked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              </div>
            ) : selectedZone ? (
              <div style={{ padding: '8px 4px', borderBottom: zoneView ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: zoneView ? '#1e293b' : '#ffffff' }}>Edit Zone</div>
                  
                  {/* Name Input */}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 8, color: zoneView ? '#64748b' : 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 2 }}>Zone Name</div>
                    <input
                      type="text"
                      value={selectedZone.name}
                      onChange={(e) => {
                        updateZone(selectedZone.id, { name: e.target.value });
                      }}
                      className={zoneView ? "clay-input" : ""}
                      style={{
                        width: '100%',
                        fontSize: 10,
                        padding: '4px 6px',
                        background: zoneView ? '#ffffff' : 'rgba(0,0,0,0.3)',
                        border: zoneView ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 6,
                        color: zoneView ? '#1e293b' : '#ffffff',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Color Picker */}
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 8, color: zoneView ? '#64748b' : 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Zone Color</span>
                    <SmoothColorPicker
                      value={selectedZone.color || '#4ECDC4'}
                      onChange={(e) => {
                        updateZone(selectedZone.id, { color: e.target.value });
                      }}
                      style={{
                        width: 24, height: 16, border: 'none', padding: 0,
                        background: 'none', cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button
                    className={zoneView ? "clay-button danger" : "glass-button danger"}
                    style={{ flex: 1, height: 24, fontSize: 9 }}
                    onClick={() => {
                      removeZone(selectedZone.id);
                      setSelectedZoneId(null);
                    }}
                  >
                    🗑️ Delete Zone
                  </button>
                </div>
              </div>
            ) : null}

            {/* Main Object List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
              {zoneView ? (
                <>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#64748b', marginTop: 4 }}>
                    📐 Zones ({(city?.zones || []).length})
                  </div>
                  {(city?.zones || []).length === 0 ? (
                    <div style={{ padding: '8px 0', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                      No zones created yet.
                    </div>
                  ) : (
                    (city?.zones || []).map(zone => {
                      const isSel = zone.id === selectedZoneId;
                      return (
                        <div key={zone.id}
                          onClick={() => {
                            setSelectedZoneId(isSel ? null : zone.id);
                            selectAsset(null);
                            setSelectedRoadId(null);
                          }}
                          className={`clay-button ${isSel ? 'active' : ''}`}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 4,
                            marginBottom: 4,
                            border: '1px solid rgba(255, 255, 255, 0.65)'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: zone.color || '#4ECDC4', flexShrink: 0 }} />
                              <span style={{ fontSize: 10, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                {zone.name.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                <>
                  {/* Buildings & Trees Section */}
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                    Buildings & Trees ({(city?.placedAssets || []).length})
                  </div>
                  {(city?.placedAssets || []).length === 0 ? (
                    <div style={{ padding: '8px 0', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                      No objects placed.
                    </div>
                  ) : (
                    (city?.placedAssets || []).map(asset => {
                      const isSel = asset.id === selectedAssetId || (selectedAssetIds || []).includes(asset.id);
                      return (
                        <div key={asset.id}
                          onClick={() => {
                            selectAsset(asset.id === selectedAssetId ? null : asset.id);
                            setSelectedRoadId(null);
                          }}
                          style={{
                            padding: '4px 6px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isSel ? 'rgba(78,205,196,0.15)' : 'rgba(255,255,255,0.03)',
                            borderLeft: isSel ? '2px solid var(--accent)' : '2px solid transparent',
                            opacity: asset.locked ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 4
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: 1, background: asset.color || '#4ECDC4', flexShrink: 0 }} />
                              <span style={{ fontSize: 10, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {asset.name}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAsset(asset.id, { locked: !asset.locked });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 10,
                              padding: '2px',
                              opacity: 0.8
                            }}
                          >
                            {asset.locked ? '🔒' : '🔓'}
                          </button>
                        </div>
                      );
                    })
                  )}

                  {/* Roads Section */}
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                    Roads ({(city?.roads || []).length})
                  </div>
                  {(city?.roads || []).length === 0 ? (
                    <div style={{ padding: '8px 0', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                      No roads built.
                    </div>
                  ) : (
                    (city?.roads || []).map(road => {
                      const isSel = road.id === selectedRoadId;
                      const typeLabel = road.roadType === 'highway' ? 'Highway' : road.roadType === 'multilane' ? 'Multilane' : 'Standard Road';
                      return (
                        <div key={road.id}
                          onClick={() => {
                            setSelectedRoadId(isSel ? null : road.id);
                            selectAsset(null);
                          }}
                          style={{
                            padding: '4px 6px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isSel ? 'rgba(78,205,196,0.15)' : 'rgba(255,255,255,0.03)',
                            borderLeft: isSel ? '2px solid var(--accent)' : '2px solid transparent',
                            opacity: road.locked ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 4
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 10, color: '#ffffff' }}>🛣️ {typeLabel}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRoad(road.id, { locked: !road.locked });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 10,
                              padding: '2px',
                              opacity: 0.8
                            }}
                          >
                            {road.locked ? '🔒' : '🔓'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Cities Manager Landing Page Overlay */}
      {showCitiesManager && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            background: 'linear-gradient(135deg, rgba(6, 18, 22, 0.93) 0%, rgba(10, 24, 32, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            color: '#fff',
            padding: '40px 60px',
            fontFamily: 'Inter, sans-serif',
            overflowY: 'auto',
            animation: 'fadeIn 0.25s ease',
            pointerEvents: 'auto'
          }}>
            {/* Main Dashboard Layout */}
            <div style={{
              width: '100%',
              maxWidth: 1200,
              margin: 'auto',
              display: 'flex',
              flexDirection: 'row',
              gap: 40,
              flexWrap: 'wrap',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button 
                onClick={() => setShowCitiesManager(false)} 
                style={{ 
                  position: 'absolute', 
                  top: -10, 
                  right: -10, 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: 'none', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                ✕
              </button>

              {/* Left Column: Welcome & Creation Panel */}
              <div style={{ 
                flex: '1 1 320px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 24,
                borderRight: '1px solid rgba(255,255,255,0.08)',
                paddingRight: 40
              }}>
                <div>
                  <h1 style={{ 
                    fontSize: 28, 
                    fontWeight: 800, 
                    margin: 0, 
                    background: 'linear-gradient(135deg, #FFF 30%, #4ECDC4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  }}>
                    MyCities Dashboard
                  </h1>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 1.6 }}>
                    Manage, load, and preview your custom city territories. Seamlessly design and switch between different city layouts.
                  </p>
                </div>

                {/* Create New Territory Form */}
                <div className="glass-panel" style={{ 
                  padding: 20, 
                  borderRadius: 18, 
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', color: '#4ECDC4' }}>
                    Initialize New Territory
                  </div>
                  <input
                    type="text"
                    placeholder="Enter city name..."
                    value={newCityName}
                    onChange={e => setNewCityName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#4ECDC4'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newCityName.trim()) {
                        createCity(newCityName.trim().replace(/[^a-zA-Z0-9_-]/g, '_'));
                        setNewCityName('');
                        setShowCitiesManager(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newCityName.trim()) {
                        createCity(newCityName.trim().replace(/[^a-zA-Z0-9_-]/g, '_'));
                        setNewCityName('');
                        setShowCitiesManager(false);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 12,
                      background: 'linear-gradient(135deg, #4ECDC4 0%, #36B4A6 100%)',
                      color: '#fff',
                      borderRadius: 10,
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(78,205,196,0.3)',
                      transition: 'transform 0.15s, opacity 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Build Territory
                  </button>
                </div>
              </div>

              {/* Right Column: Territories List & Map Grid */}
              <div style={{ flex: '3 3 500px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                    SAVED TERRITORIES ({savedCitiesList?.length || 0})
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 20,
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  paddingRight: 6
                }}>
                  {savedCitiesList && savedCitiesList.length > 0 ? (
                    savedCitiesList.map(c => {
                      const isActive = c.isActive;
                      return (
                        <div 
                          key={c.name} 
                          className="glass-panel"
                          style={{
                            borderRadius: 16,
                            border: isActive ? '2px solid #4ECDC4' : '1px solid rgba(255,255,255,0.08)',
                            padding: 16,
                            background: isActive ? 'rgba(78, 205, 196, 0.05)' : 'rgba(255,255,255,0.01)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            position: 'relative',
                            transition: 'border-color 0.25s, transform 0.25s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {editingCityName === c.name ? (
                                <input 
                                  type="text"
                                  value={tempCityName}
                                  onChange={e => setTempCityName(e.target.value)}
                                  onBlur={() => {
                                    const trimmed = tempCityName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                                    if (trimmed && trimmed !== c.name) {
                                      renameCity(c.name, trimmed);
                                    }
                                    setEditingCityName(null);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      const trimmed = tempCityName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
                                      if (trimmed && trimmed !== c.name) {
                                        renameCity(c.name, trimmed);
                                      }
                                      setEditingCityName(null);
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    border: '1px solid #4ECDC4',
                                    borderRadius: 6,
                                    padding: '2px 6px',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    width: '120px',
                                    outline: 'none'
                                  }}
                                />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span 
                                    style={{ fontSize: 14, fontWeight: 800, color: isActive ? '#4ECDC4' : '#fff', cursor: 'pointer' }}
                                    onClick={() => {
                                      setEditingCityName(c.name);
                                      setTempCityName(c.name);
                                    }}
                                    title="Click to rename"
                                  >
                                    {c.name}
                                  </span>
                                  <span 
                                    style={{ cursor: 'pointer', fontSize: 10, opacity: 0.5, userSelect: 'none' }}
                                    onClick={() => {
                                      setEditingCityName(c.name);
                                      setTempCityName(c.name);
                                    }}
                                    title="Rename city"
                                  >
                                    ✏️
                                  </span>
                                </div>
                              )}
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                {(c.size / 1024).toFixed(1)} KB · {new Date(c.modifiedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {isActive && (
                              <span style={{ 
                                fontSize: 9, 
                                fontWeight: 700, 
                                color: '#4ECDC4', 
                                background: 'rgba(78, 205, 196, 0.15)', 
                                padding: '2px 8px', 
                                borderRadius: 10 
                              }}>
                                Active
                              </span>
                            )}
                          </div>

                          {/* Mini Roads Preview */}
                          <MiniRoadsMap roads={c.roads} />

                          {/* Card Footer Actions */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'center', alignItems: 'center' }}>
                            {!isActive ? (
                              <>
                                <button
                                  className="btn sm"
                                  onClick={() => {
                                    loadCity(c.name);
                                    setShowCitiesManager(false);
                                  }}
                                  style={{
                                    padding: '10px 24px',
                                    fontSize: 11,
                                    background: 'rgba(78, 205, 196, 0.1)',
                                    color: '#4ECDC4',
                                    borderRadius: 8,
                                    border: '1px solid rgba(78, 205, 196, 0.3)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(78, 205, 196, 0.25)';
                                    e.currentTarget.style.boxShadow = '0 0 10px rgba(78, 205, 196, 0.25)';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(78, 205, 196, 0.1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  Load Layout
                                </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete ${c.name}?`)) {
                                        deleteCity(c.name);
                                      }
                                    }}
                                    style={{
                                      padding: '10px 16px',
                                      fontSize: 11,
                                      background: 'rgba(255, 107, 107, 0.05)',
                                      color: '#FF6B6B',
                                      borderRadius: 8,
                                      border: '1px solid rgba(255, 107, 107, 0.2)',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
                                      e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.4)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'rgba(255, 107, 107, 0.05)';
                                      e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.2)';
                                    }}
                                  >
                                    Delete
                                  </button>
                              </>
                            ) : (
                              <button
                                disabled
                                style={{
                                  padding: '10px 24px',
                                  fontSize: 11,
                                  background: 'rgba(52, 211, 153, 0.08)',
                                  color: '#34D399',
                                  borderRadius: 8,
                                  border: '1px solid rgba(52, 211, 153, 0.25)',
                                  fontWeight: 700,
                                  cursor: 'not-allowed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 4
                                }}
                              >
                                <span>✓</span> Active Layout
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>
                      No saved territories found. Get started by initializing one!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      {/* ── Sub-menu Overlay for Build Categories (above build deck) ── */}
      {activeCategory && !zoneView && (
        <div className="glass-panel building-scrollbar" style={{
          position: 'absolute',
          bottom: 76,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          gap: 8,
          padding: '8px 12px',
          maxHeight: 140,
          maxWidth: '90vw',
          overflowX: 'auto',
          overflowY: 'hidden',
          alignItems: 'center',
          borderRadius: 16
        }}>
          {activeCategory === 'metro_stations' &&
            TEMPLATES.filter(t => t.id === 'metro_station').map(t => {
              const isAct = pendingPlacementAsset?.name === t.name;
              return (
                <button
                  key={t.id}
                  className={`glass-button ${isAct ? 'active' : ''}`}
                  onClick={() => {
                    selectPendingAsset({
                      name: t.name,
                      objects: t.objects,
                      color: '#334155',
                      width: t.width || 20.0,
                      height: t.height || 10.0,
                      isMetroStation: true
                    });
                  }}
                  title={t.name}
                  style={{ flexDirection: 'column', padding: '6px 10px', minWidth: 100, height: 88, gap: 4 }}
                >
                  <BuildingThumbnail asset={t} />
                  <span style={{ fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '85px', textAlign: 'center' }}>{t.name}</span>
                  <span style={{ fontSize: 7, opacity: 0.7 }}>{t.width || 20}x{t.height || 10} units</span>
                </button>
              );
            })
          }

          {activeCategory === 'metro' && (
            <>
              <button
                className={`glass-button ${cityTool === 'road' && activeRoadType === 'railway' ? 'active' : ''}`}
                onClick={() => {
                  setActiveRoadType('railway');
                  useStore.setState({ cityTool: 'road', pendingPlacementAsset: null });
                }}
                style={{ flexDirection: 'column', padding: '6px 10px', minWidth: 90, height: 88, gap: 4, justifyContent: 'center' }}
              >
                <Icon name="road" size={16} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>Metro Tracks</span>
                <span style={{ fontSize: 7, opacity: 0.7 }}>Elevated viaducts</span>
              </button>

              {TEMPLATES.filter(t => t.id === 'metro_station').map(t => {
                const isAct = pendingPlacementAsset?.name === t.name;
                return (
                  <button
                    key={t.id}
                    className={`glass-button ${isAct ? 'active' : ''}`}
                    onClick={() => {
                      selectPendingAsset({
                        name: t.name,
                        objects: t.objects,
                        color: '#334155',
                        width: t.width || 20.0,
                        height: t.height || 10.0,
                        isMetroStation: true
                      });
                    }}
                    title={t.name}
                    style={{ flexDirection: 'column', padding: '6px 10px', minWidth: 100, height: 88, gap: 4 }}
                  >
                    <BuildingThumbnail asset={t} />
                    <span style={{ fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '85px', textAlign: 'center' }}>{t.name}</span>
                    <span style={{ fontSize: 7, opacity: 0.7 }}>{t.width || 20}x{t.height || 10} units</span>
                  </button>
                );
              })}
            </>
          )}

          {activeCategory === 'roads' && [
            { id: 'standard', name: 'Standard Road', icon: '🛣️', desc: '2 lanes' },
            { id: 'multilane', name: 'Multi-lane Road', icon: '🛣️', desc: '4 lanes' },
            { id: 'highway', name: 'Highway', icon: '🛣️', desc: '4 lanes + Median' },
            { id: 'dirt', name: 'Dirt Road', icon: '🟫', desc: 'Brown trail' },
            { id: 'brick', name: 'Brick Road', icon: '🧱', desc: 'Red pavement' },
            { id: 'avenue', name: 'Avenue', icon: '🌳', desc: '4 lanes + Median' },
            { id: 'cyberway', name: 'Cyberway', icon: '🌐', desc: 'Neon cyan glow' },
          ].map(r => {
            const isAct = cityTool === 'road' && activeRoadType === r.id;
            return (
              <button
                key={r.id}
                className={`glass-button ${isAct ? 'active' : ''}`}
                onClick={() => {
                  setActiveRoadType(r.id);
                  useStore.setState({ cityTool: 'road', pendingPlacementAsset: null });
                }}
                style={{ flexDirection: 'column', padding: '6px 10px', minWidth: 90, height: 88, gap: 4, justifyContent: 'center' }}
              >
                <span style={{ fontSize: 16 }}>{r.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 7, opacity: 0.7 }}>{r.desc}</span>
              </button>
            );
          })}

          {/* Complexity Filter Buttons on the Left of templates */}
          {['residential', 'commercial', 'industrial', 'civic', 'green'].includes(activeCategory) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 8, borderRight: '1px solid rgba(255,255,255,0.15)', marginRight: 4 }}>
              <button
                className={`glass-button ${complexityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setComplexityFilter('all')}
                style={{ fontSize: 9, padding: '4px 8px', height: 24, justifyContent: 'center', minWidth: 64 }}
              >
                All
              </button>
              {activeCategory === 'green' ? (
                <>
                  <button
                    className={`glass-button ${complexityFilter === 'trees' ? 'active' : ''}`}
                    onClick={() => setComplexityFilter('trees')}
                    style={{ fontSize: 9, padding: '4px 8px', height: 24, justifyContent: 'center', minWidth: 64 }}
                  >
                    Trees
                  </button>
                  <button
                    className={`glass-button ${complexityFilter === 'buildings' ? 'active' : ''}`}
                    onClick={() => setComplexityFilter('buildings')}
                    style={{ fontSize: 9, padding: '4px 8px', height: 24, justifyContent: 'center', minWidth: 64 }}
                  >
                    Buildings
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`glass-button ${complexityFilter === 'simple' ? 'active' : ''}`}
                    onClick={() => setComplexityFilter('simple')}
                    style={{ fontSize: 9, padding: '4px 8px', height: 24, justifyContent: 'center', minWidth: 64 }}
                  >
                    Simple
                  </button>
                  <button
                    className={`glass-button ${complexityFilter === 'complex' ? 'active' : ''}`}
                    onClick={() => setComplexityFilter('complex')}
                    style={{ fontSize: 9, padding: '4px 8px', height: 24, justifyContent: 'center', minWidth: 64 }}
                  >
                    Complex
                  </button>
                  <button
                    className={`glass-button ${complexityFilter === 'historical' ? 'active' : ''}`}
                    onClick={() => setComplexityFilter('historical')}
                    style={{ fontSize: 9, padding: '4px 8px', height: 24, justifyContent: 'center', minWidth: 64 }}
                  >
                    Historical
                  </button>
                </>
              )}
            </div>
          )}

          {/* Preset templates for residential, commercial, industrial, civic, green */}
          {['residential', 'commercial', 'industrial', 'civic', 'green'].includes(activeCategory) &&
            TEMPLATES.filter(t => {
              let matchesCategory = false;
              if (activeCategory === 'green') {
                matchesCategory = t.category === 'green' || [
                  'tree_goldenoak', 'tree_banyan', 'tree_pine', 'tree_birch', 'tree_maple', 'tree_cherry', 'tree_palm', 'tree_cypress', 'tree_willow'
                ].includes(t.id);
              } else {
                matchesCategory = t.category === activeCategory;
              }
              if (!matchesCategory) return false;

              const objCount = t.objects ? t.objects.length : 0;
              if (activeCategory === 'green') {
                const isTree = t.isTree === true || t.id.startsWith('tree_');
                if (complexityFilter === 'trees') {
                  return isTree;
                }
                if (complexityFilter === 'buildings') {
                  return !isTree;
                }
              } else {
                if (complexityFilter === 'simple') {
                  return objCount < 100 && !t.isHistorical;
                }
                if (complexityFilter === 'complex') {
                  return objCount >= 100 && !t.isHistorical;
                }
                if (complexityFilter === 'historical') {
                  return !!t.isHistorical;
                }
              }
              return true;
            }).map(t => {
              const isAct = pendingPlacementAsset?.name === t.name;
              return (
                <button
                  key={t.id}
                  className={`glass-button ${isAct ? 'active' : ''}`}
                  onClick={() => {
                    selectPendingAsset({
                      name: t.name,
                      objects: t.objects,
                      color: t.objects[0]?.color || '#4ECDC4',
                      width: t.width || 2.0,
                      height: t.height || 2.0,
                    });
                  }}
                  title={t.name}
                  style={{ flexDirection: 'column', padding: '6px 10px', minWidth: 100, height: 88, gap: 4 }}
                >
                  <BuildingThumbnail asset={t} />
                  <span style={{ fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '85px', textAlign: 'center' }}>{t.name}</span>
                  <span style={{ fontSize: 7, opacity: 0.7 }}>{t.width || 2}x{t.height || 2} units</span>
                </button>
              );
            })
          }

          {/* Custom published buildings */}
          {activeCategory === 'custom' && (
            publishedBuildings && publishedBuildings.length === 0 ? (
              <div style={{ padding: '8px 16px', fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                No custom buildings published yet.<br />Design a building in the 3D Editor and click "Publish Selected".
              </div>
            ) : (
              (publishedBuildings || []).map(b => {
                const isAct = pendingPlacementAsset?.name === b.name;
                return (
                  <div key={b.id} style={{ display: 'flex', position: 'relative' }}>
                    <button
                      className={`glass-button ${isAct ? 'active' : ''}`}
                      onClick={() => {
                        selectPendingAsset({
                          name: b.name,
                          objects: b.objects,
                          color: b.objects[0]?.color || '#4ECDC4',
                          width: b.width || 2.0,
                          height: b.height || 2.0,
                        });
                      }}
                      title={b.name}
                      style={{ flexDirection: 'column', padding: '6px 20px 6px 10px', minWidth: 100, height: 88, gap: 4 }}
                    >
                      <BuildingThumbnail asset={b} />
                      <span style={{ fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '65px', textAlign: 'center' }}>{b.name}</span>
                      <span style={{ fontSize: 7, opacity: 0.7 }}>Custom</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${b.name}" from your library?`)) {
                          deletePublishedBuilding(b.id);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        fontSize: 9,
                        padding: 1,
                      }}
                      title="Delete custom building"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )
          )}
        </div>
      )}

      {/* ── Colors & Size panels positioned dynamically above building choices ── */}
      {/* ── Colors & Size panels positioned dynamically above building choices ── */}
      {!zoneView && (
        <div style={{
          position: 'absolute',
          bottom: activeCategory ? 190 : 74,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          transition: 'bottom 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Size Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {/* Main Size Customization Toggle */}
            <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 20,
              pointerEvents: 'auto',
              fontSize: 10,
              fontWeight: 600
            }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', padding: '0 4px' }}>📐 Size</span>
              <button
                className={zoneView || metroView ? `clay-button ${sizeRandomizeMode === 'default' ? 'active' : ''}` : `glass-button ${sizeRandomizeMode === 'default' ? 'active' : ''}`}
                onClick={() => setSizeRandomizeMode('default')}
                style={{ borderRadius: 12, padding: '2px 8px', fontSize: 9, border: 'none', height: 20 }}
              >
                Default
              </button>
              <button
                className={zoneView || metroView ? `clay-button ${sizeRandomizeMode === 'randomize' ? 'active' : ''}` : `glass-button ${sizeRandomizeMode === 'randomize' ? 'active' : ''}`}
                onClick={() => setSizeRandomizeMode('randomize')}
                style={{ borderRadius: 12, padding: '2px 8px', fontSize: 9, border: 'none', height: 20 }}
              >
                Randomize
              </button>
            </div>

            {/* Size Dual Slider Controls */}
            {sizeRandomizeMode === 'randomize' && (
              <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 14,
                pointerEvents: 'auto',
                fontSize: 9,
                width: 220
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Min: <strong style={{ color: '#4ECDC4' }}>{sizeRandomizeMin.toFixed(1)}x</strong></span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5.0" 
                    step="0.1" 
                    value={sizeRandomizeMin}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSizeRandomizeMin(val);
                      if (val > sizeRandomizeMax) setSizeRandomizeMax(val);
                    }}
                    style={{ width: 120, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Max: <strong style={{ color: '#4ECDC4' }}>{sizeRandomizeMax.toFixed(1)}x</strong></span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5.0" 
                    step="0.1" 
                    value={sizeRandomizeMax}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSizeRandomizeMax(val);
                      if (val < sizeRandomizeMin) setSizeRandomizeMin(val);
                    }}
                    style={{ width: 120, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', outline: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Colors Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {/* Main Color Customization Toggle */}
            <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 20,
              pointerEvents: 'auto',
              fontSize: 10,
              fontWeight: 600
            }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', padding: '0 4px' }}>🎨 Colors</span>
              <button
                className={zoneView || metroView ? `clay-button ${!randomiseAssetColors ? 'active' : ''}` : `glass-button ${!randomiseAssetColors ? 'active' : ''}`}
                onClick={() => { if (randomiseAssetColors) toggleRandomiseAssetColors(); }}
                style={{ borderRadius: 12, padding: '2px 8px', fontSize: 9, border: 'none', height: 20 }}
              >
                Default
              </button>
              <button
                className={zoneView || metroView ? `clay-button ${randomiseAssetColors ? 'active' : ''}` : `glass-button ${randomiseAssetColors ? 'active' : ''}`}
                onClick={() => { if (!randomiseAssetColors) toggleRandomiseAssetColors(); }}
                style={{ borderRadius: 12, padding: '2px 8px', fontSize: 9, border: 'none', height: 20 }}
              >
                Random
              </button>
            </div>

            {/* Palette Preset Selectors */}
            {randomiseAssetColors && (
              <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 6px',
                borderRadius: 14,
                pointerEvents: 'auto'
              }}>
                {PRESET_PALETTES.map(p => {
                  const isSel = p.id === activePaletteId;
                  return (
                    <button
                      key={p.id}
                      className={zoneView || metroView ? `clay-button ${isSel ? 'active' : ''}` : `glass-button ${isSel ? 'active' : ''}`}
                      onClick={() => selectActivePalette(p.id)}
                      style={{
                        borderRadius: 10,
                        padding: '2px 8px',
                        fontSize: 8,
                        border: 'none',
                        height: 18,
                        fontWeight: isSel ? 700 : 500
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Color Pool Selector */}
            {randomiseAssetColors && (
              <div className={zoneView ? "clay-panel" : "glass-panel"} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                pointerEvents: 'auto'
              }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginRight: 2 }}>Colors:</span>
                {(PRESET_PALETTES.find(p => p.id === activePaletteId)?.colors || []).map(colorFamily => {
                  const isActive = randomColorPalette.includes(colorFamily.id);
                  return (
                    <button
                      key={colorFamily.id}
                      onClick={() => toggleColorFamilyInPalette(colorFamily.id)}
                      title={`Toggle ${colorFamily.label}`}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: colorFamily.color,
                        border: isActive ? '2px solid #ffffff' : '2px solid transparent',
                        boxShadow: isActive ? '0 0 3px rgba(255,255,255,0.8)' : 'none',
                        cursor: 'pointer',
                        opacity: isActive ? 1.0 : 0.35,
                        transform: isActive ? 'scale(1.15)' : 'scale(1.0)',
                        transition: 'all 0.15s ease',
                        padding: 0
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom-Center: Main Build Categories Dock ── */}
      {!zoneView && (
        <div className="glass-panel" style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 30,
          alignItems: 'center'
        }}>
          {metroView ? (
            // Metro-specific categories
            [
              { id: 'metro_tracks', label: 'Tracks', iconName: 'road' },
              { id: 'metro_stations', label: 'Stations', iconName: 'building' },
            ].map(cat => {
              const isAct = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`glass-button ${isAct ? 'active' : ''}`}
                  onClick={() => {
                    const nextCat = activeCategory === cat.id ? null : cat.id;
                    setActiveCategory(nextCat);
                    setComplexityFilter('all');
                    if (nextCat === 'metro_tracks') {
                      setActiveRoadType('railway');
                      useStore.setState({ cityTool: 'road', pendingPlacementAsset: null });
                    } else if (nextCat === 'metro_stations') {
                      const stationTemplate = TEMPLATES.find(t => t.id === 'metro_station');
                      selectPendingAsset({
                        name: stationTemplate.name,
                        objects: stationTemplate.objects,
                        color: '#334155',
                        width: stationTemplate.width || 20.0,
                        height: stationTemplate.height || 10.0,
                        isMetroStation: true,
                      });
                    } else {
                      useStore.setState({ pendingPlacementAsset: null, cityTool: 'select' });
                    }
                  }}
                  style={{
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name={cat.iconName} size={13} />
                  <span style={{ fontSize: 10 }}>{cat.label}</span>
                </button>
              );
            })
          ) : (
            // Standard categories
            [
              { id: 'roads', label: 'Roads', iconName: 'road' },
              { id: 'metro', label: 'Metro', iconName: 'train' },
              { id: 'residential', label: 'Residency', iconName: 'building' },
              { id: 'commercial', label: 'Commercial', iconName: 'city' },
              { id: 'industrial', label: 'Industrial', iconName: 'stats' },
              { id: 'civic', label: 'Civic', iconName: 'zone' },
              { id: 'green', label: 'Green', iconName: 'palette' },
              { id: 'custom', label: 'Custom', iconName: 'pencil' },
            ].map(cat => {
              const isAct = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`glass-button ${isAct ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(activeCategory === cat.id ? null : cat.id);
                    setComplexityFilter('all');
                    useStore.setState({ pendingPlacementAsset: null });
                  }}
                  style={{
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name={cat.iconName} size={13} />
                  <span style={{ fontSize: 10 }}>{cat.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* ── Right-Side: Floating Zoom Controls ── */}
      {!streetView && (
        <div style={{ position:'absolute', bottom: 100, right: 16, display:'flex', flexDirection:'column', gap:6, zIndex: 100 }}>
          <button className="glass-button" onClick={() => handleZoomButton(true)} style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 14 }}>＋</button>
          <button className="glass-button" onClick={() => handleZoomButton(false)} style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 14 }}>－</button>
          <button className="glass-button" onClick={() => { targetZoomRef.current = 1.0; targetOffsetRef.current = {x:16,y:16}; }} style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 12 }}>⟳</button>
        </div>
      )}



    </div>
  );
}

// ── Street View: simple Three.js first-person walk ────────────────────────
function StreetView({ city, onExit, selectedRoadId, setSelectedRoadId, intersections = [], gameTime, metroView, setAssetContextMenu, containerRef, getInitialClampedCoords, showColorRandomizer, waypoint }) {
  const mountRef = useRef(null);
  const animRef = useRef(null);
  const keys = useRef({});
  const camRef = useRef(null);
  const sceneRef = useRef(null);
  const meshesRef = useRef([]);
  const humansRef = useRef([]);
  const trainsRef = useRef([]);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  
  const sunLightRef = useRef(null);
  const moonLightRef = useRef(null);
  const ambientLightRef = useRef(null);
  const rendererRef = useRef(null);
  const gameTimeRef = useRef(360);
  const streetlightsRef = useRef([]);
  const bulbOnMatRef = useRef(null);
  const bulbOffMatRef = useRef(null);
  
  useEffect(() => {
    gameTimeRef.current = gameTime;
  }, [gameTime]);
  const isDraggingMouse = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const [birdsEye, setBirdsEye] = useState(false);
  const birdsEyeRef = useRef(false);
  useEffect(() => {
    birdsEyeRef.current = birdsEye;
  }, [birdsEye]);

  const cityRef = useRef(city);
  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  const { selectedAssetId, selectAsset, removeAsset, updateAsset, removeRoadSegment, updateRoad } = useStore();
  const selectedRoadIdRef = useRef(selectedRoadId);
  useEffect(() => {
    selectedRoadIdRef.current = selectedRoadId;
  }, [selectedRoadId]);
  const selectedRoad = selectedRoadId ? (city?.roads || []).find(r => r.id === selectedRoadId) : null;
  const materialCacheRef = useRef({});
  const draggingAssetIdRef = useRef(null);
  const dragOffset3D = useRef({ x: 0, z: 0 });
  const dragStartPos3D = useRef(null);
  const renderedAssetsRef = useRef(new Map()); // assetId -> { group, hash }
  const minimapCanvasRef = useRef(null);
  const minimapContainerRef = useRef(null);
  const minimapZoomRef = useRef(18);
  const grassTextureRef = useRef(null);
  const asphaltTextureRef = useRef(null);
  const dirtTextureRef = useRef(null);
  const brickTextureRef = useRef(null);
  const targetYRef = useRef(1.7);
  const currentYRef = useRef(1.7);
  const cloudsRef = useRef([]);

  const rebuildStreetScene = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene || !city) {
      console.log("[StreetView] rebuildStreetScene skipped: scene or city not ready", { scene: !!scene, city: !!city });
      return;
    }
    streetlightsRef.current = [];
    if (trainsRef.current) {
      trainsRef.current.forEach(t => {
        if (t.group && scene) scene.remove(t.group);
      });
      trainsRef.current = [];
    }

    console.log("[StreetView] rebuildStreetScene started", {
      placedAssetsCount: (city.placedAssets || []).length,
      cachedRenderedAssets: renderedAssetsRef.current.size
    });

    // Clear old road and markings meshes
    meshesRef.current.forEach(m => {
      if (m.userData && m.userData.roadId) {
        scene.remove(m);
        
        const disposeMeshObj = (obj) => {
          if (obj.geometry && !Object.values(STREET_GEO).includes(obj.geometry)) {
            obj.geometry.dispose();
          }
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(mat => {
              const isCached = materialCacheRef.current && Object.values(materialCacheRef.current).includes(mat);
              if (!isCached) {
                if (mat.map) mat.map.dispose();
                mat.dispose();
              }
            });
          }
          if (obj.children) {
            obj.children.forEach(disposeMeshObj);
          }
        };
        disposeMeshObj(m);
      }
    });
    meshesRef.current = [];

    const cellS = 3.4;

    const getCachedMaterial = (colorHex, isSelected) => {
      const key = `${colorHex}_${isSelected}`;
      if (!materialCacheRef.current) materialCacheRef.current = {};
      if (!materialCacheRef.current[key]) {
        const mat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.65,
          metalness: 0.08
        });
        if (isSelected) {
          mat.emissive.set(0x4ECDC4);
          mat.emissiveIntensity = 0.28;
        }
        materialCacheRef.current[key] = mat;
      }
      return materialCacheRef.current[key];
    };

    const isPointInIntersection = (pos, currentRoadId) => {
      const gridPt = { x: pos.x / cellS, z: pos.z / cellS };
      return isSampleCulled(gridPt, currentRoadId, intersections);
    };

    const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
    const greenGrassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.95 });
    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
 
    // Render curvy roads
    (city.roads || []).forEach(road => {
      if (road.points.length < 2) return;
      
      const type = road.roadType || 'standard';
      let radius = 1.8;
      if (type === 'multilane') radius = 3.0;
      else if (type === 'highway') radius = 6.0;
      else if (type === 'dirt') radius = 1.5;
      else if (type === 'brick') radius = 1.8;
      else if (type === 'avenue') radius = 4.0;
      else if (type === 'cyberway') radius = 2.2;
      else if (type === 'railway') radius = 2.4;

      const roadIndex = (city.roads || []).findIndex(r => r.id === road.id);
      let yOffset = 0.01;
      if (type === 'railway') {
        yOffset = 9.0;
      } else {
        if (type === 'dirt') yOffset = 0.010;
        else if (type === 'brick') yOffset = 0.011;
        else if (type === 'standard') yOffset = 0.012;
        else if (type === 'multilane') yOffset = 0.013;
        else if (type === 'highway') yOffset = 0.014;
        else if (type === 'avenue') yOffset = 0.015;
        else if (type === 'cyberway') yOffset = 0.016;
        yOffset += roadIndex * 0.0001;
      }

      const points3d = road.points.map(pt => new THREE.Vector3(pt.x * cellS, yOffset, pt.z * cellS));
      const curve = new THREE.CatmullRomCurve3(points3d);
  
      const isRoadSel = road.id === selectedRoadId;
      let currentRoadMat;
      if (isRoadSel) {
        currentRoadMat = new THREE.MeshStandardMaterial({
          color: 0x3c1e22,
          roughness: 0.85,
          emissive: new THREE.Color(0xef4444),
          emissiveIntensity: 0.35
        });
      } else {
        let tex = null;
        let roughness = 0.85;
        if (type === 'dirt' && dirtTextureRef.current) {
          tex = dirtTextureRef.current.clone();
          roughness = 0.9;
        } else if (type === 'brick' && brickTextureRef.current) {
          tex = brickTextureRef.current.clone();
          roughness = 0.75;
        } else if (asphaltTextureRef.current) {
          tex = asphaltTextureRef.current.clone();
          roughness = 0.85;
        }

        if (tex) {
          const rLen = curve.getLength();
          const repeatScale = type === 'brick' ? 0.75 : type === 'dirt' ? 0.6 : 0.5;
          tex.repeat.set(Math.max(2, Math.floor(rLen * repeatScale)), 1);
          tex.needsUpdate = true;
        }

        if (type === 'railway') {
          currentRoadMat = new THREE.MeshStandardMaterial({
            color: metroView ? 0x1e293b : 0xe2e8f0,
            roughness: 0.5,
            metalness: 0.15
          });
        } else if (type === 'cyberway') {
          currentRoadMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.9,
            metalness: 0.1
          });
        } else {
          currentRoadMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: roughness
          });
        }
      }

      // Squashed TubeGeometry for road surface
      const roadGeo = new THREE.TubeGeometry(curve, Math.max(30, road.points.length * 10), radius, 8, false);
      if (type === 'railway') {
        roadGeo.scale(1, 0.18, 1); // Thick concrete deck slab
      } else {
        roadGeo.scale(1, 0.01, 1); // squash the geometry itself to keep raycasting precise
      }
      const roadMesh = new THREE.Mesh(roadGeo, currentRoadMat);
      roadMesh.receiveShadow = true;
      roadMesh.userData = { roadId: road.id };
      scene.add(roadMesh);
      meshesRef.current.push(roadMesh);

      if (type === 'railway') {
        try {
          const len = curve.getLength();
          const numPillars = Math.max(2, Math.floor(len / 12.0));
          
          // 1. Futuristic Y-Shaped Column Piers (Concrete + Metal Accents)
          const pillarGeo = new THREE.CylinderGeometry(0.28, 0.44, 8.6, 6);
          const yokeBaseGeo = new THREE.BoxGeometry(0.7, 0.5, 0.7);
          const yokeArmLGeo = new THREE.BoxGeometry(1.6, 0.3, 0.5);
          const yokeArmRGeo = new THREE.BoxGeometry(1.6, 0.3, 0.5);
          
          const concreteColor = metroView ? 0x0f172a : 0xe2e8f0;
          const metallicAccent = metroView ? 0x00f2ff : 0x475569;
          
          const pillarMat = new THREE.MeshStandardMaterial({ 
            color: concreteColor, 
            roughness: 0.45, 
            metalness: 0.15 
          });
          const metalMat = new THREE.MeshStandardMaterial({
            color: metallicAccent,
            roughness: 0.3,
            metalness: 0.8,
            emissive: metroView ? new THREE.Color(0x00f2ff) : new THREE.Color(0x000000),
            emissiveIntensity: metroView ? 1.0 : 0.0
          });

          for (let i = 0; i <= numPillars; i++) {
            const t = i / numPillars;
            const pos = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const angle = Math.atan2(tangent.x, tangent.z);

            const supportGroup = new THREE.Group();
            supportGroup.position.set(pos.x, 0, pos.z);
            supportGroup.rotation.y = angle;

            // Main tapered hexagonal column
            const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
            pillarMesh.position.y = 4.3;
            pillarMesh.castShadow = true;
            pillarMesh.receiveShadow = true;
            supportGroup.add(pillarMesh);

            // Metal structural connector collar
            const yokeBase = new THREE.Mesh(yokeBaseGeo, metalMat);
            yokeBase.position.y = 8.5;
            supportGroup.add(yokeBase);

            // Angle wings supporting the dual tracks
            const armL = new THREE.Mesh(yokeArmLGeo, pillarMat);
            armL.position.set(-0.8, 8.65, 0);
            armL.rotation.z = 0.18;
            armL.castShadow = true;
            supportGroup.add(armL);

            const armR = new THREE.Mesh(yokeArmRGeo, pillarMat);
            armR.position.set(0.8, 8.65, 0);
            armR.rotation.z = -0.18;
            armR.castShadow = true;
            supportGroup.add(armR);

            supportGroup.userData = { roadId: road.id };
            scene.add(supportGroup);
            meshesRef.current.push(supportGroup);
          }

          // 2. Broad Sleepers / Ties (Width 2.4)
          const sleeperGeo = new THREE.BoxGeometry(2.4, 0.08, 0.22);
          const sleeperMat = new THREE.MeshStandardMaterial({
            color: metroView ? 0x334155 : 0x78350f,
            roughness: 0.9
          });
          const numSleepers = Math.max(8, Math.floor(len / 1.1));
          const sleeperTransforms = [];

          for (let i = 0; i <= numSleepers; i++) {
            const t = i / numSleepers;
            const pos = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const angle = Math.atan2(tangent.x, tangent.z);

            sleeperTransforms.push({
              position: new THREE.Vector3(pos.x, 9.12, pos.z),
              rotationY: angle,
              scale: new THREE.Vector3(1, 1, 1)
            });
          }

          if (sleeperTransforms.length > 0) {
            const inst = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperTransforms.length);
            inst.castShadow = true;
            inst.receiveShadow = true;
            const dummy = new THREE.Object3D();
            sleeperTransforms.forEach((tr, idx) => {
              dummy.position.copy(tr.position);
              dummy.rotation.y = tr.rotationY;
              dummy.scale.copy(tr.scale);
              dummy.updateMatrix();
              inst.setMatrixAt(idx, dummy.matrix);
            });
            inst.instanceMatrix.needsUpdate = true;
            inst.userData = { roadId: road.id };
            scene.add(inst);
            meshesRef.current.push(inst);
          }

          // 3. Side Parapet Guide Barriers + Steel Rails
          const leftPoints = [];
          const rightPoints = [];
          const parapetLPoints = [];
          const parapetRPoints = [];
          const numPoints = Math.max(30, road.points.length * 10);
          for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const pos = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const lenT = Math.sqrt(tangent.x ** 2 + tangent.z ** 2);
            const nx = -tangent.z / (lenT || 1);
            const nz = tangent.x / (lenT || 1);

            leftPoints.push(new THREE.Vector3(pos.x + nx * 0.65, 9.22, pos.z + nz * 0.65));
            rightPoints.push(new THREE.Vector3(pos.x - nx * 0.65, 9.22, pos.z - nz * 0.65));

            parapetLPoints.push(new THREE.Vector3(pos.x + nx * 1.5, 9.30, pos.z + nz * 1.5));
            parapetRPoints.push(new THREE.Vector3(pos.x - nx * 1.5, 9.30, pos.z - nz * 1.5));
          }

          const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
          const rightCurve = new THREE.CatmullRomCurve3(rightPoints);
          const railGeoLeft = new THREE.TubeGeometry(leftCurve, numPoints, 0.06, 6, false);
          const railGeoRight = new THREE.TubeGeometry(rightCurve, numPoints, 0.06, 6, false);

          const railMat = new THREE.MeshStandardMaterial({
            color: metroView ? 0x00f2ff : 0xcbd5e1,
            roughness: 0.3,
            metalness: 0.8,
            emissive: metroView ? new THREE.Color(0x00f2ff) : new THREE.Color(0x000000),
            emissiveIntensity: metroView ? 3.0 : 0.0
          });
          const leftRailMesh = new THREE.Mesh(railGeoLeft, railMat);
          const rightRailMesh = new THREE.Mesh(railGeoRight, railMat);
          leftRailMesh.userData = { roadId: road.id };
          rightRailMesh.userData = { roadId: road.id };
          scene.add(leftRailMesh);
          scene.add(rightRailMesh);
          meshesRef.current.push(leftRailMesh);
          meshesRef.current.push(rightRailMesh);

          // Render Guide Parapet tubes
          const pLCurve = new THREE.CatmullRomCurve3(parapetLPoints);
          const pRCurve = new THREE.CatmullRomCurve3(parapetRPoints);
          const pGeoL = new THREE.TubeGeometry(pLCurve, numPoints, 0.12, 6, false);
          const pGeoR = new THREE.TubeGeometry(pRCurve, numPoints, 0.12, 6, false);

          const parapetMat = new THREE.MeshStandardMaterial({
            color: metroView ? 0x00f2ff : 0x94a3b8,
            roughness: 0.7,
            emissive: metroView ? new THREE.Color(0x00f2ff) : new THREE.Color(0x000000),
            emissiveIntensity: metroView ? 1.5 : 0.0
          });
          const pMeshL = new THREE.Mesh(pGeoL, parapetMat);
          const pMeshR = new THREE.Mesh(pGeoR, parapetMat);
          pMeshL.userData = { roadId: road.id };
          pMeshR.userData = { roadId: road.id };
          scene.add(pMeshL);
          scene.add(pMeshR);
          meshesRef.current.push(pMeshL);
          meshesRef.current.push(pMeshR);

          // 3b. High-Tech Rib Arches Portals (Structure + Center Neon Light)
          const numArches = Math.max(3, Math.floor(len / 6.0));
          const archPostGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.2, 5);
          const archCrossbarGeo = new THREE.BoxGeometry(3.6, 0.08, 0.16);
          const neonFixtureGeo = new THREE.BoxGeometry(0.35, 0.05, 0.12);
          
          const neonMat = new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            emissive: new THREE.Color(0x00f2ff),
            emissiveIntensity: 3.5
          });

          for (let i = 0; i <= numArches; i++) {
            const t = i / numArches;
            const pos = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const angle = Math.atan2(tangent.x, tangent.z);

            const archGroup = new THREE.Group();
            archGroup.position.set(pos.x, 9.0, pos.z);
            archGroup.rotation.y = angle;

            // Left side arch post
            const postL = new THREE.Mesh(archPostGeo, pillarMat);
            postL.position.set(-1.8, 1.1, 0);
            postL.rotation.z = 0.08;
            postL.castShadow = true;
            archGroup.add(postL);

            // Right side arch post
            const postR = new THREE.Mesh(archPostGeo, pillarMat);
            postR.position.set(1.8, 1.1, 0);
            postR.rotation.z = -0.08;
            postR.castShadow = true;
            archGroup.add(postR);

            // Overhead crossbar
            const crossbar = new THREE.Mesh(archCrossbarGeo, pillarMat);
            crossbar.position.set(0, 2.2, 0);
            crossbar.castShadow = true;
            archGroup.add(crossbar);

            // Hanging central neon power rail/light strip
            const neon = new THREE.Mesh(neonFixtureGeo, neonMat);
            neon.position.set(0, 2.1, 0);
            archGroup.add(neon);

            archGroup.userData = { roadId: road.id };
            scene.add(archGroup);
            meshesRef.current.push(archGroup);
          }

          // 4. Spawn 3D Train carriage groups (Locomotive + 3 Carts)
          const trainGroup = new THREE.Group();
          const trainMaterialLoco = new THREE.MeshStandardMaterial({ 
            color: 0xef4444, 
            roughness: 0.3,
            metalness: 0.8
          });
          const trainMaterialCart = new THREE.MeshStandardMaterial({ 
            color: 0x1e3a8a, 
            roughness: 0.3,
            metalness: 0.8
          });
          const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x38bdf8, 
            roughness: 0.1, 
            metalness: 0.9,
            transparent: true,
            opacity: 0.75
          });
          
          const locoGeo = new THREE.BoxGeometry(0.72, 0.64, 3.8);
          const cartGeo = new THREE.BoxGeometry(0.72, 0.60, 3.4);
          const glassGeo = new THREE.BoxGeometry(0.64, 0.22, 0.8);
          
          const loco = new THREE.Mesh(locoGeo, trainMaterialLoco);
          loco.castShadow = true;
          const windshield = new THREE.Mesh(glassGeo, glassMat);
          windshield.position.set(0, 0.12, 1.55);
          loco.add(windshield);
          trainGroup.add(loco);
          
          const carts = [];
          for (let c = 0; c < 3; c++) {
            const cart = new THREE.Mesh(cartGeo, trainMaterialCart);
            cart.castShadow = true;
            
            // Side window bands
            const windowL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 2.8), glassMat);
            windowL.position.set(0.37, 0.1, 0);
            const windowR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 2.8), glassMat);
            windowR.position.set(-0.37, 0.1, 0);
            
            cart.add(windowL);
            cart.add(windowR);
            trainGroup.add(cart);
            carts.push(cart);
          }
          
          scene.add(trainGroup);
          trainsRef.current.push({
            group: trainGroup,
            loco,
            carts,
            curve,
            totalLen: len
          });
        } catch (err) {
          console.error("Error drawing elevated rails: ", err);
        }
        return;
      }

      const markingsGroup = new THREE.Group();
      const midPoint = road.points[Math.floor(road.points.length / 2)];
      markingsGroup.userData = {
        isRoadMarkings: true,
        roadId: road.id,
        centerX: midPoint.x * cellS,
        centerZ: midPoint.z * cellS
      };
 
      const length = curve.getLength();
      const step = 0.4;
      const numSteps = Math.max(10, Math.floor(length / step));
 
      const whiteTransforms = [];
      const yellowTransforms = [];
      const concreteTransforms = [];
      const greenGrassTransforms = [];
      const cyanGlowTransforms = [];

      if (type !== 'dirt' && type !== 'brick') {
        for (let i = 0; i <= numSteps; i++) {
          const t = i / numSteps;
          const pos = curve.getPointAt(t);
          const tangent = curve.getTangentAt(t);
          const angle = Math.atan2(tangent.x, tangent.z);

          const len = Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z);
          if (len === 0) continue;
          const nx = -tangent.z / len;
          const nz = tangent.x / len;

          const addMarking = (offsetDist, mWidth, mHeight, mLength, material) => {
            const markingPos = new THREE.Vector3(
              pos.x + nx * offsetDist,
              pos.y + mHeight / 2 + 0.005,
              pos.z + nz * offsetDist
            );
            if (isPointInIntersection(markingPos, road.id)) {
              return;
            }
            
            const tObj = {
              position: markingPos.clone(),
              rotationY: angle,
              scale: new THREE.Vector3(mWidth, mHeight, mLength)
            };

            if (material === yellowMat) {
              yellowTransforms.push(tObj);
            } else if (material === concreteMat) {
              concreteTransforms.push(tObj);
            } else if (material === greenGrassMat) {
              greenGrassTransforms.push(tObj);
            } else if (material === cyanGlowMat) {
              cyanGlowTransforms.push(tObj);
            } else {
              whiteTransforms.push(tObj);
            }
          };

          if (type === 'multilane') {
            // Double yellow lines in center
            addMarking(0.08, 0.04, 0.015, 0.42, yellowMat);
            addMarking(-0.08, 0.04, 0.015, 0.42, yellowMat);

            // Dashed lane lines (alternate)
            if (i % 3 === 0) {
              addMarking(0.75, 0.04, 0.015, 0.42, whiteMat);
              addMarking(-0.75, 0.04, 0.015, 0.42, whiteMat);
            }
          } else if (type === 'highway') {
            // Concrete median jersey barrier
            addMarking(0, 0.24, 0.5, 0.42, concreteMat);

            // Solid yellow inner lines
            addMarking(0.22, 0.04, 0.015, 0.42, yellowMat);
            addMarking(-0.22, 0.04, 0.015, 0.42, yellowMat);

            // Dashed lane lines (alternate)
            if (i % 3 === 0) {
              addMarking(1.05, 0.04, 0.015, 0.42, whiteMat);
              addMarking(-1.05, 0.04, 0.015, 0.42, whiteMat);
            }

            // Solid white outer shoulders
            addMarking(1.9, 0.04, 0.015, 0.42, whiteMat);
            addMarking(-1.9, 0.04, 0.015, 0.42, whiteMat);
          } else if (type === 'avenue') {
            // green grass center median strip
            addMarking(0, 0.4, 0.02, 0.42, greenGrassMat);

            // double white line shoulders
            addMarking(0.24, 0.04, 0.015, 0.42, whiteMat);
            addMarking(-0.24, 0.04, 0.015, 0.42, whiteMat);

            // dashed white lanes
            if (i % 3 === 0) {
              addMarking(1.1, 0.04, 0.015, 0.42, whiteMat);
              addMarking(-1.1, 0.04, 0.015, 0.42, whiteMat);
            }
          } else if (type === 'cyberway') {
            // neon cyan glowing borders at the edges
            addMarking(1.1, 0.06, 0.02, 0.42, cyanGlowMat);
            addMarking(-1.1, 0.06, 0.02, 0.42, cyanGlowMat);

            // blue/cyan dash markers in center
            if (i % 3 === 0) {
              addMarking(0, 0.04, 0.018, 0.35, cyanGlowMat);
            }
          } else {
            // Standard center dashes
            if (i % 2 === 0) {
              addMarking(0, 0.06, 0.015, 0.4, dashMat);
            }
          }
        }
      }

      const baseGeo = getStreetGeo('unit_box');

      if (whiteTransforms.length > 0) {
        const inst = new THREE.InstancedMesh(baseGeo, whiteMat, whiteTransforms.length);
        inst.receiveShadow = true;
        const dummy = new THREE.Object3D();
        whiteTransforms.forEach((t, idx) => {
          dummy.position.copy(t.position);
          dummy.rotation.y = t.rotationY;
          dummy.scale.copy(t.scale);
          dummy.updateMatrix();
          inst.setMatrixAt(idx, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
        markingsGroup.add(inst);
      }

      if (yellowTransforms.length > 0) {
        const inst = new THREE.InstancedMesh(baseGeo, yellowMat, yellowTransforms.length);
        inst.receiveShadow = true;
        const dummy = new THREE.Object3D();
        yellowTransforms.forEach((t, idx) => {
          dummy.position.copy(t.position);
          dummy.rotation.y = t.rotationY;
          dummy.scale.copy(t.scale);
          dummy.updateMatrix();
          inst.setMatrixAt(idx, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
        markingsGroup.add(inst);
      }

      if (concreteTransforms.length > 0) {
        const inst = new THREE.InstancedMesh(baseGeo, concreteMat, concreteTransforms.length);
        inst.receiveShadow = true;
        const dummy = new THREE.Object3D();
        concreteTransforms.forEach((t, idx) => {
          dummy.position.copy(t.position);
          dummy.rotation.y = t.rotationY;
          dummy.scale.copy(t.scale);
          dummy.updateMatrix();
          inst.setMatrixAt(idx, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
        markingsGroup.add(inst);
      }

      if (greenGrassTransforms.length > 0) {
        const inst = new THREE.InstancedMesh(baseGeo, greenGrassMat, greenGrassTransforms.length);
        inst.receiveShadow = true;
        const dummy = new THREE.Object3D();
        greenGrassTransforms.forEach((t, idx) => {
          dummy.position.copy(t.position);
          dummy.rotation.y = t.rotationY;
          dummy.scale.copy(t.scale);
          dummy.updateMatrix();
          inst.setMatrixAt(idx, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
        markingsGroup.add(inst);
      }

      if (cyanGlowTransforms.length > 0) {
        const inst = new THREE.InstancedMesh(baseGeo, cyanGlowMat, cyanGlowTransforms.length);
        inst.receiveShadow = true;
        const dummy = new THREE.Object3D();
        cyanGlowTransforms.forEach((t, idx) => {
          dummy.position.copy(t.position);
          dummy.rotation.y = t.rotationY;
          dummy.scale.copy(t.scale);
          dummy.updateMatrix();
          inst.setMatrixAt(idx, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
        markingsGroup.add(inst);
      }

      if (markingsGroup.children.length > 0) {
        scene.add(markingsGroup);
        meshesRef.current.push(markingsGroup);
      }

      // ── Spawn 3D streetlights along standard, multilane, and highway roads ──
      if (type !== 'dirt') {
        const length = curve.getLength();
        const lightStep = 10.0; // Spaced every 10 units
        const numLights = Math.floor(length / lightStep);
        
        for (let i = 1; i < numLights; i++) {
          const t = i / numLights;
          const pos = curve.getPointAt(t);
          const tangent = curve.getTangentAt(t);
          const angle = Math.atan2(tangent.x, tangent.z);
          
          const len = Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z);
          if (len === 0) continue;
          const nx = -tangent.z / len;
          const nz = tangent.x / len;
          
          // Alternate sides of the road
          const offsetDist = radius + 0.15;
          const side = i % 2 === 0 ? 1 : -1;
          const lightPos = new THREE.Vector3(
            pos.x + nx * offsetDist * side,
            yOffset,
            pos.z + nz * offsetDist * side
          );
          
          if (isPointInIntersection(lightPos, road.id)) {
            continue;
          }
          
          const streetlightGroup = new THREE.Group();
          streetlightGroup.position.copy(lightPos);
          streetlightGroup.rotation.y = angle + (side > 0 ? 0 : Math.PI);
          streetlightGroup.userData = { roadId: road.id, isStreetlight: true };
          
          // 1. Pole (tall vertical cylinder)
          const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 3.2, 6);
          // MeshLambertMaterial: per-vertex Gouraud shading instead of PBR per-fragment — no visible difference on metal poles
          const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.y = 1.6;
          pole.castShadow = true;
          streetlightGroup.add(pole);
          
          // 2. Arm (horizontal arm extending over the road)
          const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
          const arm = new THREE.Mesh(armGeo, poleMat);
          arm.rotation.x = Math.PI / 2;
          arm.position.set(0, 3.2, 0.4);
          streetlightGroup.add(arm);
          
          // 3. Light head (fixture)
          const headGeo = new THREE.BoxGeometry(0.12, 0.08, 0.25);
          const head = new THREE.Mesh(headGeo, poleMat);
          head.position.set(0, 3.2, 0.8);
          streetlightGroup.add(head);
          
          // 4. PointLight (actual light source, turned on dynamically based on gameTime and culling)
          const pointLight = new THREE.PointLight(0xfde047, 0, 15, 1.2);
          pointLight.position.set(0, 3.1, 0.8);
          pointLight.userData = { isStreetlightSource: true };
          pointLight.visible = false;
          streetlightGroup.add(pointLight);
          
          // 5. Light bulb mesh (utilize shared flat material reference to prevent GC/shader allocation overhead)
          const bulbGeo = new THREE.SphereGeometry(0.06, 6, 6);
          const bulb = new THREE.Mesh(bulbGeo, bulbOffMatRef.current);
          bulb.position.set(0, 3.1, 0.8);
          bulb.userData = { isStreetlightBulb: true };
          streetlightGroup.add(bulb);
          
          streetlightsRef.current.push({
            position: lightPos,
            source: pointLight,
            bulb: bulb
          });
          
          scene.add(streetlightGroup);
          meshesRef.current.push(streetlightGroup);
        }
      }
    });

    const disposeAsset3D = (group) => {
      scene.remove(group);
      
      const disposeNode = (node) => {
        if (node.geometry) {
          const isStreetGeo = Object.values(STREET_GEO).includes(node.geometry);
          const isCSGGeo = cityCSGGeometriesSet.has(node.geometry);
          if (!isStreetGeo && !isCSGGeo) {
            node.geometry.dispose();
          }
        }
        if (node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach(mat => {
            const isCached = materialCacheRef.current && Object.values(materialCacheRef.current).includes(mat);
            if (!isCached) {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            }
          });
        }
        if (node.children) {
          node.children.forEach(disposeNode);
        }
      };
      disposeNode(group);
    };

    const buildAssetGroup = (asset, isSel) => {
      const pos = getAdjustedAssetPosition(asset, city.roads);
      const wx = pos.col * cellS; const wz = pos.row * cellS;
      const aw = (asset.width || 2) * cellS; const ah = (asset.height || 2) * cellS;
      const centerX = wx;
      const centerZ = wz;

      const maxSF = getMaxScaleFactor(asset);
      const defaultSF = Math.min(1.0, maxSF);
      const scaleFactor = asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : defaultSF;

      let buildingMainObject;

      let objectsToRender = asset.objects;
      const isStation = asset.isMetroStation || asset.name === 'Elevated Metro Station' || asset.name === 'Metro Station';
      if (isStation) {
        const template = TEMPLATES.find(t => t.id === 'metro_station');
        if (template && template.objects) {
          objectsToRender = template.objects;
        }
      }

      if (objectsToRender && objectsToRender.length > 0) {
        const lod = new THREE.LOD();
        lod.position.set(centerX, 0, centerZ);
        lod.rotation.y = asset.rotation || 0;
        lod.userData = { assetId: asset.id };

        // Level 0: Detailed model (Group of meshes - optimized via geometry merging)
        const detailedGroup = new THREE.Group();
        const geometriesToMerge = [];
        const materialsToUse = [];

        objectsToRender.forEach(obj => {
          let meshGeom;
          let materials;

          if (obj.geometry === 'csg') {
            const compiled = buildCSGGeometryInStreetView(obj);
            meshGeom = compiled.geometry;
            materials = compiled.materials;
          } else {
            meshGeom = getStreetGeo(obj.geometry);
            let texture = null;
            if (obj.text) {
              const canvas = document.createElement('canvas');
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              ctx.fillStyle = obj.color;
              ctx.fillRect(0, 0, 256, 256);
              ctx.fillStyle = obj.textColor || '#ffffff';
              ctx.font = `bold ${obj.textSize || 32}px ${obj.textFont || 'sans-serif'}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(obj.text, 128, 128);
              texture = new THREE.CanvasTexture(canvas);
            }
            
            const faces = SHAPE_FACES[obj.geometry];
            if (texture) {
              if (faces) {
                const textSurfaces = obj.textSurfaces || [];
                materials = faces.map(faceName => {
                  const hasFaceText = textSurfaces.length === 0 || textSurfaces.includes(faceName);
                  return new THREE.MeshStandardMaterial({
                    color: hasFaceText ? 0xffffff : obj.color,
                    map: hasFaceText ? texture : null,
                    roughness: 0.65,
                    metalness: 0.08
                  });
                });
              } else {
                materials = new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  map: texture,
                  roughness: 0.65,
                  metalness: 0.08
                });
              }
            } else {
              materials = getCachedMaterial(obj.color, isSel);
            }
          }

          if (metroView && asset.isMetroStation) {
            materials = new THREE.MeshStandardMaterial({
              color: 0x00f2ff,
              roughness: 0.3,
              metalness: 0.5,
              emissive: new THREE.Color(0x00f2ff),
              emissiveIntensity: 1.2
            });
          }

          if (isSel) {
            if (Array.isArray(materials)) {
              materials.forEach(mat => {
                mat.emissive.set(0x4ECDC4);
                mat.emissiveIntensity = 0.28;
              });
            } else if (materials) {
              materials.emissive.set(0x4ECDC4);
              materials.emissiveIntensity = 0.28;
            }
          }

          const oPos = obj.position || { x: 0, y: 0, z: 0 };
          const oRot = obj.rotation || { x: 0, y: 0, z: 0 };
          const oScl = obj.scale || { x: 1, y: 1, z: 1 };

          const dummyObj = new THREE.Object3D();
          dummyObj.position.set(
            (oPos.x !== undefined ? oPos.x : 0) * scaleFactor,
            (oPos.y !== undefined ? oPos.y : 0) * scaleFactor,
            (oPos.z !== undefined ? oPos.z : 0) * scaleFactor
          );
          dummyObj.rotation.set(
            oRot.x !== undefined ? oRot.x : 0,
            oRot.y !== undefined ? oRot.y : 0,
            oRot.z !== undefined ? oRot.z : 0
          );
          dummyObj.scale.set(
            (oScl.x !== undefined ? oScl.x : 1) * scaleFactor,
            (oScl.y !== undefined ? oScl.y : 1) * scaleFactor,
            (oScl.z !== undefined ? oScl.z : 1) * scaleFactor
          );
          dummyObj.updateMatrix();

          const clonedGeom = meshGeom.clone().applyMatrix4(dummyObj.matrix);
          
          if (Array.isArray(materials)) {
            materials = materials[0] || getCachedMaterial(obj.color, isSel);
          }

          geometriesToMerge.push(clonedGeom);
          materialsToUse.push(materials);
        });

        if (geometriesToMerge.length > 0) {
          try {
            const mergedGeom = mergeGeometries(geometriesToMerge, true);
            const mergedMesh = new THREE.Mesh(mergedGeom, materialsToUse);
            mergedMesh.castShadow = true;
            mergedMesh.receiveShadow = true;
            detailedGroup.add(mergedMesh);
          } catch (err) {
            console.error("[StreetView] Failed to merge asset geometries:", err);
            objectsToRender.forEach((obj, idx) => {
              const mesh = new THREE.Mesh(geometriesToMerge[idx], materialsToUse[idx]);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              detailedGroup.add(mesh);
            });
          }
          geometriesToMerge.forEach(g => g.dispose());
        }

        const isStation = asset.isMetroStation || asset.name === 'Elevated Metro Station' || asset.name === 'Metro Station';
        if (isStation) {
          const connectorBaseGeo = new THREE.BoxGeometry(1.0, 0.32, 1.1);
          const connectorWallGeo = new THREE.BoxGeometry(1.0, 0.9, 0.15);
          const connectorRoofGeo = new THREE.BoxGeometry(1.0, 0.12, 1.25);
          
          const neonVGeo = new THREE.BoxGeometry(0.06, 0.9, 0.06);
          const neonHGeo = new THREE.BoxGeometry(0.06, 0.06, 1.25);

          const connectorMat = new THREE.MeshStandardMaterial({
            color: metroView ? 0x0f172a : 0xe2e8f0,
            roughness: 0.5,
            metalness: 0.2
          });
          const neonBandMat = new THREE.MeshStandardMaterial({
            color: 0x00f2ff,
            emissive: new THREE.Color(0x00f2ff),
            emissiveIntensity: 2.5
          });

          const portOffsets = [
            { x: -10.0, z: -1.8 },
            { x: -10.0, z: 1.8 },
            { x: 10.0, z: -1.8 },
            { x: 10.0, z: 1.8 }
          ];

          portOffsets.forEach(offset => {
            const shiftX = offset.x > 0 ? 0.45 : -0.45;
            const px = offset.x + (offset.x > 0 ? -0.1 : 0.1);

            // 1. Concrete Base support bed
            const base = new THREE.Mesh(connectorBaseGeo, connectorMat);
            base.position.set(px, 8.84, offset.z);
            base.castShadow = true;
            base.receiveShadow = true;
            detailedGroup.add(base);

            // 2. Concrete Left Wall
            const wallL = new THREE.Mesh(connectorWallGeo, connectorMat);
            wallL.position.set(px, 9.45, offset.z - 0.55);
            wallL.castShadow = true;
            detailedGroup.add(wallL);

            // 3. Concrete Right Wall
            const wallR = new THREE.Mesh(connectorWallGeo, connectorMat);
            wallR.position.set(px, 9.45, offset.z + 0.55);
            wallR.castShadow = true;
            detailedGroup.add(wallR);

            // 4. Concrete Roof Slab
            const roof = new THREE.Mesh(connectorRoofGeo, connectorMat);
            roof.position.set(px, 9.9, offset.z);
            roof.castShadow = true;
            detailedGroup.add(roof);

            // 5. Glowing Neon portal arch frames
            const neonV1 = new THREE.Mesh(neonVGeo, neonBandMat);
            neonV1.position.set(offset.x + shiftX, 9.45, offset.z - 0.55);
            detailedGroup.add(neonV1);

            const neonV2 = new THREE.Mesh(neonVGeo, neonBandMat);
            neonV2.position.set(offset.x + shiftX, 9.45, offset.z + 0.55);
            detailedGroup.add(neonV2);

            const neonH = new THREE.Mesh(neonHGeo, neonBandMat);
            neonH.position.set(offset.x + shiftX, 9.9, offset.z);
            detailedGroup.add(neonH);
          });
        }

        lod.addLevel(detailedGroup, 0);

        // Level 1: Low-detail model (Single simplified box mesh)
        let maxHeight = 2.0;
        objectsToRender.forEach(obj => {
          const h = (obj.position?.y || 0) + (obj.scale?.y || 1) / 2;
          if (h > maxHeight) maxHeight = h;
        });

        const fallbackMat = getCachedMaterial(asset.color || '#4ECDC4', isSel);
        const lowDetailMesh = new THREE.Mesh(
          new THREE.BoxGeometry(aw * 0.8, maxHeight * cellS * scaleFactor, ah * 0.8),
          fallbackMat
        );
        lowDetailMesh.position.y = (maxHeight * cellS * scaleFactor) / 2;
        lowDetailMesh.castShadow = true;
        lowDetailMesh.receiveShadow = true;
        lowDetailMesh.userData = { isLowDetail: true, assetId: asset.id };
        lowDetailMesh.raycast = () => {}; // prevent raycasting from hitting this low-detail bounding box
        lod.addLevel(lowDetailMesh, 75); // Swap to low detail at 75 units distance

        buildingMainObject = lod;
      } else {
        // Fallback simple block
        const buildingGroup = new THREE.Group();
        buildingGroup.position.set(centerX, 0, centerZ);
        buildingGroup.rotation.y = asset.rotation || 0;
        buildingGroup.userData = { assetId: asset.id };

        const fallbackMat = new THREE.MeshStandardMaterial({
          color: asset.color || 0x4ECDC4,
          roughness: 0.7,
          emissive: isSel ? new THREE.Color(0x4ECDC4) : new THREE.Color(0x000000),
          emissiveIntensity: isSel ? 0.28 : 0
        });
        const fallbackMesh = new THREE.Mesh(new THREE.BoxGeometry(aw * 0.8 * scaleFactor, 3 * scaleFactor, ah * 0.8 * scaleFactor), fallbackMat);
        fallbackMesh.position.y = 1.5 * scaleFactor;
        fallbackMesh.castShadow = true;
        fallbackMesh.receiveShadow = true;
        buildingGroup.add(fallbackMesh);

        buildingMainObject = buildingGroup;
      }

      return buildingMainObject;
    };

    // Diff and render buildings
    const getAssetHash = (asset, isSelected) => {
      const pos = getAdjustedAssetPosition(asset, city.roads);
      const objectsHash = (asset.objects || []).map(o => `${o.id}_${o.color}_${o.position?.x}_${o.position?.y}_${o.position?.z}`).join('|');
      return `${asset.id}_${pos.col}_${pos.row}_${asset.rotation || 0}_${asset.scaleMultiplier || 1.0}_${isSelected}_${objectsHash}`;
    };

    const newAssetsMap = new Map();
    (city.placedAssets || []).forEach(asset => {
      const isSelected = asset.id === selectedAssetId;
      newAssetsMap.set(asset.id, { asset, hash: getAssetHash(asset, isSelected) });
    });

    // Remove deleted or changed assets
    renderedAssetsRef.current.forEach((rendered, assetId) => {
      const current = newAssetsMap.get(assetId);
      if (!current || current.hash !== rendered.hash) {
        disposeAsset3D(rendered.group);
        renderedAssetsRef.current.delete(assetId);
      }
    });

    // Build new or modified assets
    (city.placedAssets || []).forEach(asset => {
      if (!renderedAssetsRef.current.has(asset.id)) {
        const isSelected = asset.id === selectedAssetId;
        const group = buildAssetGroup(asset, isSelected);
        scene.add(group);
        console.log("[StreetView] Built and added asset to scene:", asset.id, asset.name, "at col/row", asset.col, asset.row);
        
        renderedAssetsRef.current.set(asset.id, {
          group,
          hash: getAssetHash(asset, isSelected)
        });
      } else {
        console.log("[StreetView] Asset already rendered (hash match, skipped):", asset.id);
      }
    });

    // Populate meshesRef.current for culling and raycasting
    renderedAssetsRef.current.forEach(item => {
      meshesRef.current.push(item.group);
    });

    // Spawn roaming humans on roads
    humansRef.current.forEach(h => {
      scene.remove(h.mesh);
      h.mesh.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    humansRef.current = [];

    if (city.roads && city.roads.length > 0) {
      const CLOTHING_COLORS = [0xff5722, 0xe91e63, 0x9c27b0, 0x3f51b5, 0x00bcd4, 0x4caf50, 0xffeb3b, 0xff9800];
      const numHumans = Math.min(15, city.roads.length * 3);
      for (let i = 0; i < numHumans; i++) {
        const roadIndex = Math.floor(Math.random() * city.roads.length);
        const road = city.roads[roadIndex];
        if (road.points.length < 2) continue;
        const points3d = road.points.map(pt => new THREE.Vector3(pt.x * cellS, 0, pt.z * cellS));
        const curve = new THREE.CatmullRomCurve3(points3d);

        const color = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
        const mesh = createHumanMesh(color);

        const t = Math.random();
        const startPos = curve.getPointAt(t);
        mesh.position.copy(startPos);
        scene.add(mesh);

        humansRef.current.push({
          mesh,
          roadId: road.id,
          curve,
          t,
          direction: Math.random() > 0.5 ? 1 : -1,
          speed: 0.005 + Math.random() * 0.005,
          legSwing: Math.random() * 10
        });
      }
    }

    // Render zones in 3D (flat ground color, border loop, and floating sprite label)
    if (city.zones && city.zones.length > 0) {
      city.zones.forEach(zone => {
        if (!zone.points || zone.points.length < 3) return;
        
        // 1. Draw flat color zone shape on ground
        const shape = new THREE.Shape();
        zone.points.forEach((pt, idx) => {
          if (idx === 0) shape.moveTo(pt.x * cellS, -pt.z * cellS);
          else shape.lineTo(pt.x * cellS, -pt.z * cellS);
        });
        const shapeGeo = new THREE.ShapeGeometry(shape);
        const shapeMat = new THREE.MeshBasicMaterial({
          color: zone.color,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const shapeMesh = new THREE.Mesh(shapeGeo, shapeMat);
        shapeMesh.rotation.x = -Math.PI / 2;
        shapeMesh.position.y = 0.005;
        scene.add(shapeMesh);
        meshesRef.current.push(shapeMesh);
        
        // 2. Draw border line loop
        const points = zone.points.map(pt => new THREE.Vector3(pt.x * cellS, 0.006, pt.z * cellS));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: zone.color });
        const lineLoop = new THREE.LineLoop(lineGeo, lineMat);
        scene.add(lineLoop);
        meshesRef.current.push(lineLoop);
        
        // 3. Draw floating billboard label above centroid
        let sumX = 0, sumZ = 0;
        zone.points.forEach(pt => {
          sumX += pt.x;
          sumZ += pt.z;
        });
        const cx = sumX / zone.points.length;
        const cz = sumZ / zone.points.length;
        
        const labelSprite = createZoneLabelSprite(zone.name, zone.color);
        labelSprite.position.set(cx * cellS, 3.5, cz * cellS);
        scene.add(labelSprite);
        meshesRef.current.push(labelSprite);
      });
    }
  }, [city, selectedAssetId, selectedRoadId, intersections, metroView]);

  useEffect(() => {
const mount = mountRef.current;
    if (!mount || !city) return;

    const W = mount.clientWidth || 600, H = mount.clientHeight || 400;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x87CEEB);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Cheaper than PCFSoftShadowMap (1 sample vs 9)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    bulbOnMatRef.current = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    bulbOffMatRef.current = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    scene.fog = new THREE.Fog(0x87CEEB, 15, 60);
    scene.background = new THREE.Color(0x87CEEB);

    const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 1000);
    let startX = 0;
    let startZ = 0;
    if (waypoint) {
      startX = waypoint.col * 3.4;
      startZ = waypoint.row * 3.4;
    } else if (city.roads && city.roads.length > 0 && city.roads[0].points.length > 0) {
      startX = (city.roads[0].points[0].x || 0) * 3.4;
      startZ = (city.roads[0].points[0].z || 0) * 3.4;
    } else if (city.placedAssets && city.placedAssets.length > 0) {
      startX = (city.placedAssets[0].col || 0) * 3.4;
      startZ = (city.placedAssets[0].row || 0) * 3.4;
    }
    camera.position.set(startX, 1.7, startZ);
    camRef.current = camera;
    renderedAssetsRef.current.clear();

    grassTextureRef.current = createGrassTexture();
    asphaltTextureRef.current = createAsphaltTexture();
    dirtTextureRef.current = createDirtTexture();
    brickTextureRef.current = createBrickTexture();

    // Spawn fluffy clouds high in the sky
    const clouds = [];
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    for (let i = 0; i < 15; i++) {
      const group = new THREE.Group();
      const numParts = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numParts; j++) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(1.5 + Math.random() * 2, 8, 8),
          cloudMat
        );
        mesh.scale.set(1.5, 0.4, 2.0);
        mesh.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 4
        );
        group.add(mesh);
      }
      group.position.set(
        (Math.random() - 0.5) * 350,
        28 + Math.random() * 8,
        (Math.random() - 0.5) * 350
      );
      scene.add(group);
      clouds.push({
        group,
        speed: 0.02 + Math.random() * 0.04
      });
    }
    cloudsRef.current = clouds;

    // Lights - warm sunlighting and soft shadows
    const ambient = new THREE.AmbientLight(0xffffff, 0.26);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const sun = new THREE.DirectionalLight(0xfffbf0, 1.4);
    sun.position.set(40, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512); // Lowered from 2048: shadow covers wide area, resolution drop is imperceptible
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);
    sunLightRef.current = sun;

    const moon = new THREE.DirectionalLight(0x90b0ff, 0.35);
    moon.position.set(-40, 50, -20);
    moon.castShadow = false; // Disabled: moon shadow cube-map was re-rendering 6 faces/frame at night
    scene.add(moon);
    moonLightRef.current = moon;

    scene.add(new THREE.HemisphereLight(0x8bc7f7, 0x5c8240, 0.45));
    rendererRef.current = renderer;

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000),
      new THREE.MeshStandardMaterial({
        map: grassTextureRef.current,
        roughness: 0.95
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Initial build
    rebuildStreetScene();

    // Input
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault();
      }
      keys.current[e.code] = e.type === 'keydown';
      keys.current[k] = e.type === 'keydown';

      if (e.type === 'keydown' && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (document.activeElement && (
          document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' || 
          document.activeElement.isContentEditable
        )) {
          return;
        }
        const latestSelectedAssetId = useStore.getState().selectedAssetId;
        if (latestSelectedAssetId) {
          removeAsset(latestSelectedAssetId);
          selectAsset(null);
        } else if (selectedRoadId) {
          removeRoadSegment(selectedRoadId);
          setSelectedRoadId(null);
        }
      }
    };
    const onBlur = () => { keys.current = {}; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    window.addEventListener('contextmenu', onBlur);

    const cellS = 3.4;
    const mouseDownPos = { x: 0, y: 0 };
    const onMouseDown = (e) => {
      if (e.target !== renderer.domElement) return;

      isDraggingMouse.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      mouseDownPos.x = e.clientX;
      mouseDownPos.y = e.clientY;

      // Check if we clicked on an asset
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      const mouseVec = new THREE.Vector2(mouseX, mouseY);
      raycaster.setFromCamera(mouseVec, camera);
      
      const intersects = raycaster.intersectObjects(scene.children, true);
      let clickedAssetId = null;
      for (let i = 0; i < intersects.length; i++) {
        let obj = intersects[i].object;
        while (obj) {
          if (obj.userData && obj.userData.assetId) {
            clickedAssetId = obj.userData.assetId;
            break;
          }
          obj = obj.parent;
        }
        if (clickedAssetId) break;
      }

      const currentSelectedAssetId = useStore.getState().selectedAssetId;
      if (clickedAssetId && clickedAssetId === currentSelectedAssetId) {
        const currentCity = useStore.getState().city;
        const asset = (currentCity?.placedAssets || []).find(a => a.id === clickedAssetId);
        if (asset && !asset.locked) {
          // Start dragging asset in 3D instead of rotating camera
          isDraggingMouse.current = false;
          draggingAssetIdRef.current = clickedAssetId;

          const intersectionPoint = new THREE.Vector3();
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

          const assetX = asset.col * cellS;
          const assetZ = asset.row * cellS;
          dragOffset3D.current = {
            x: intersectionPoint.x - assetX,
            z: intersectionPoint.z - assetZ
          };
          dragStartPos3D.current = { col: asset.col, row: asset.row };
        }
      }
    };

    const onMouseMove = (e) => {
      if (draggingAssetIdRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        const mouseVec = new THREE.Vector2(mouseX, mouseY);
        raycaster.setFromCamera(mouseVec, camera);

        const intersectionPoint = new THREE.Vector3();
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

        const targetX = intersectionPoint.x - dragOffset3D.current.x;
        const targetZ = intersectionPoint.z - dragOffset3D.current.z;

        const buildingGroup = scene.children.find(c => c.userData && c.userData.assetId === draggingAssetIdRef.current);
        if (buildingGroup) {
          buildingGroup.position.set(targetX, 0, targetZ);
        }
        return;
      }

      if (!isDraggingMouse.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      yawRef.current -= dx * 0.004;
      pitchRef.current = Math.max(-1.2, Math.min(0.8, pitchRef.current - dy * 0.004));
    };

    const onMouseUp = (e) => {
      if (draggingAssetIdRef.current) {
        const buildingGroup = scene.children.find(c => c.userData && c.userData.assetId === draggingAssetIdRef.current);
        if (buildingGroup) {
          const finalCol = buildingGroup.position.x / cellS;
          const finalRow = buildingGroup.position.z / cellS;
          if (dragStartPos3D.current && (dragStartPos3D.current.col !== finalCol || dragStartPos3D.current.row !== finalRow)) {
            useStore.getState().pushCityUndo({
              type: 'UPDATE_ASSET',
              assetId: draggingAssetIdRef.current,
              updates: { col: dragStartPos3D.current.col, row: dragStartPos3D.current.row }
            });
          }
          updateAsset(draggingAssetIdRef.current, { col: finalCol, row: finalRow }, true, true);
        }
        draggingAssetIdRef.current = null;
        return;
      }

      isDraggingMouse.current = false;
      if (e.target !== renderer.domElement) return;

      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        const mouseVec = new THREE.Vector2(mouseX, mouseY);
        raycaster.setFromCamera(mouseVec, camera);
        
        const intersects = raycaster.intersectObjects(scene.children, true);
        let clickedAssetId = null;
        let clickedRoadId = null;
        for (let i = 0; i < intersects.length; i++) {
          let obj = intersects[i].object;
          while (obj) {
            if (obj.userData) {
              if (obj.userData.assetId) {
                clickedAssetId = obj.userData.assetId;
                break;
              }
              if (obj.userData.roadId) {
                clickedRoadId = obj.userData.roadId;
                break;
              }
            }
            obj = obj.parent;
          }
          if (clickedAssetId || clickedRoadId) break;
        }
        const latestCity = useStore.getState().city;
        const asset = clickedAssetId ? (latestCity?.placedAssets || []).find(a => a.id === clickedAssetId) : null;
        const road = clickedRoadId ? (latestCity?.roads || []).find(r => r.id === clickedRoadId) : null;
        
        if (clickedAssetId && asset) {
          if (e.button === 2) {
            selectAsset(clickedAssetId);
            setSelectedRoadId(null);
            
            const containerRect = containerRef.current?.getBoundingClientRect();
            const mx = containerRect ? e.clientX - containerRect.left : e.clientX;
            const my = containerRect ? e.clientY - containerRect.top : e.clientY;
            const coords = getInitialClampedCoords(mx, my, 'asset', showColorRandomizer);
            setAssetContextMenu({ ...coords, asset, type: 'asset' });
          } else if (e.button === 0) {
            selectAsset(clickedAssetId);
            setSelectedRoadId(null);
            setAssetContextMenu(null);
          }
        } else if (clickedRoadId && road) {
          if (clickedRoadId === selectedRoadIdRef.current) {
            setSelectedRoadId(null);
          } else {
            selectAsset(null);
            setSelectedRoadId(clickedRoadId);
          }
        } else {
          selectAsset(null);
          setSelectedRoadId(null);
          setAssetContextMenu(null);
        }
      }
    };
    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onWheel = (e) => {
      if (birdsEyeRef.current) return;
      e.preventDefault();
      targetYRef.current = Math.max(0.2, Math.min(25.0, targetYRef.current + e.deltaY * 0.0035));
    };
    mount.addEventListener('wheel', onWheel, { passive: false });

    const preventCtx = (e) => { e.preventDefault(); };
    mount.addEventListener('contextmenu', preventCtx);

    const handleMinimapWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      minimapZoomRef.current = Math.max(6, Math.min(60, minimapZoomRef.current - e.deltaY * 0.02));
    };
    const miniEl = minimapContainerRef.current;
    if (miniEl) {
      miniEl.addEventListener('wheel', handleMinimapWheel, { passive: false });
    }

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const SPEED = 0.25;
    const dir = new THREE.Vector3();

    // Persistent helper objects for day/night color lerps (prevents GC allocations inside animate loop)
    const skyColor = new THREE.Color(0xcbe6ff);
    const sunColorA = new THREE.Color(0xfffbf0);
    const sunColorB = new THREE.Color(0xf97316);
    const sunsetColor = new THREE.Color(0xf97316);
    const nightColor = new THREE.Color(0x0a0f1d);
    const dayColor = new THREE.Color(0xcbe6ff);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);

      // ── 3D Day/Night Cycle Updates ──
      const timeVal = gameTimeRef.current;
      const hours = timeVal / 60;
      const angle = (timeVal / 1440) * Math.PI * 2 - Math.PI / 2; // Noon is top
      const radius = 80;
      const lightX = Math.cos(angle) * radius;
      const lightY = Math.sin(angle) * radius;
      const lightZ = 20;

      // Fix 3: Toggle shadow map rendering off at night — no sun means no shadows needed.
      // This eliminates the entire shadow-pass GPU overhead (depth prerender) every frame at night.
      const isNighttime = hours >= 19.0 || hours < 6.0;
      if (rendererRef.current && rendererRef.current.shadowMap.enabled === isNighttime) {
        rendererRef.current.shadowMap.enabled = !isNighttime;
      }

      // Update Sun Directional Light
      if (sunLightRef.current) {
        sunLightRef.current.position.set(lightX, Math.max(0.1, lightY), lightZ);
        if (hours >= 6.0 && hours < 18.0) {
          sunLightRef.current.intensity = 1.4;
          sunLightRef.current.color.copy(sunColorA);
          sunLightRef.current.visible = true;
        } else if (hours >= 18.0 && hours < 19.5) {
          const t = (hours - 18.0) / 1.5;
          sunLightRef.current.intensity = 1.4 * (1 - t);
          sunLightRef.current.color.copy(sunColorA).lerp(sunColorB, t);
          sunLightRef.current.visible = true;
        } else if (hours >= 4.5 && hours < 6.0) {
          const t = (hours - 4.5) / 1.5;
          sunLightRef.current.intensity = 1.4 * t;
          sunLightRef.current.color.copy(sunColorB).lerp(sunColorA, t);
          sunLightRef.current.visible = true;
        } else {
          sunLightRef.current.visible = false;
        }
      }

      // Update Moon Directional Light
      if (moonLightRef.current) {
        const isNight = hours >= 19.0 || hours < 5.0;
        moonLightRef.current.visible = isNight;
        if (isNight) {
          moonLightRef.current.position.set(-lightX, Math.max(0.1, -lightY), -lightZ);
          moonLightRef.current.intensity = 0.35;
        }
      }

      // Ambient Light Intensity
      if (ambientLightRef.current) {
        let ambientIntensity = 0.26;
        if (hours >= 19.5 || hours < 4.5) {
          ambientIntensity = 0.08;
        } else if (hours >= 18.0 && hours < 19.5) {
          const t = (hours - 18.0) / 1.5;
          ambientIntensity = 0.26 * (1 - t) + 0.08 * t;
        } else if (hours >= 4.5 && hours < 6.0) {
          const t = (hours - 4.5) / 1.5;
          ambientIntensity = 0.08 * (1 - t) + 0.26 * t;
        }
        ambientLightRef.current.intensity = ambientIntensity;
      }

      // Sky Background & Fog Color
      if (rendererRef.current && sceneRef.current) {
        skyColor.copy(dayColor);
        if (hours >= 19.5 || hours < 4.5) {
          skyColor.copy(nightColor);
        } else if (hours >= 18.0 && hours < 19.5) {
          const t = (hours - 18.0) / 1.5;
          if (t < 0.5) {
            skyColor.copy(dayColor).lerp(sunsetColor, t * 2);
          } else {
            skyColor.copy(sunsetColor).lerp(nightColor, (t - 0.5) * 2);
          }
        } else if (hours >= 4.5 && hours < 6.0) {
          const t = (hours - 4.5) / 1.5;
          if (t < 0.5) {
            skyColor.copy(nightColor).lerp(sunsetColor, t * 2);
          } else {
            skyColor.copy(sunsetColor).lerp(dayColor, (t - 0.5) * 2);
          }
        }
        rendererRef.current.setClearColor(skyColor);
        sceneRef.current.background = skyColor;
        if (sceneRef.current.fog) {
          sceneRef.current.fog.color.copy(skyColor);
        }
      }

      // Toggle 3D Streetlights PointLights and Bulbs (Optimized: Flat Array + Closest-N Capping + State Guards)
      const lightsOn = hours >= 19.0 || hours < 6.0;
      const camPos = camera.position;
      // Fix 4: Cap active PointLights to MAX_ACTIVE_LIGHTS closest lamps.
      // Each active PointLight multiplies per-fragment shading cost across all lit meshes in its radius.
      // Limiting concurrent active lights is the single most effective forward-renderer optimization.
      const MAX_ACTIVE_LIGHTS = 4;
      const slList = streetlightsRef.current || [];
      
      if (lightsOn && slList.length > 0) {
        // Build { distSq, sl } list only for lamps within cull radius (45 units)
        const nearby = [];
        for (let i = 0; i < slList.length; i++) {
          const sl = slList[i];
          const dx = sl.position.x - camPos.x;
          const dz = sl.position.z - camPos.z;
          const distSq = dx * dx + dz * dz;
          if (distSq < 2025) nearby.push({ distSq, sl });
        }
        // Sort closest first and pick only the top MAX_ACTIVE_LIGHTS
        nearby.sort((a, b) => a.distSq - b.distSq);
        const activeSet = new Set(nearby.slice(0, MAX_ACTIVE_LIGHTS).map(n => n.sl));
        
        for (let i = 0; i < slList.length; i++) {
          const sl = slList[i];
          const shouldLightBeOn = activeSet.has(sl);
          
          // PointLight visibility update (state-change guard)
          if (sl.source.visible !== shouldLightBeOn) {
            sl.source.visible = shouldLightBeOn;
            if (shouldLightBeOn) sl.source.intensity = 1.8;
          }
          
          // Bulb glow: any lamp in 45-unit range glows, not just active ones
          const dx = sl.position.x - camPos.x;
          const dz = sl.position.z - camPos.z;
          const isNearby = (dx * dx + dz * dz) < 2025;
          const wantedMat = isNearby ? bulbOnMatRef.current : bulbOffMatRef.current;
          if (sl.bulb.material !== wantedMat) sl.bulb.material = wantedMat;
        }
      } else {
        // Daytime or no streetlights: turn everything off efficiently
        for (let i = 0; i < slList.length; i++) {
          const sl = slList[i];
          if (sl.source.visible) sl.source.visible = false;
          if (sl.bulb.material !== bulbOffMatRef.current) sl.bulb.material = bulbOffMatRef.current;
        }
      }


      const isBirdsEye = birdsEyeRef.current;
      const yaw = yawRef.current;
      const pitch = isBirdsEye ? -Math.PI / 3 : pitchRef.current;
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      if (scene.fog) {
        if (isBirdsEye) {
          scene.fog.near = 100;
          scene.fog.far = 400;
        } else {
          scene.fog.near = 15;
          scene.fog.far = 60;
        }
      }

      dir.set(0, 0, 0);
      if (keys.current['KeyW'] || keys.current['ArrowUp'] || keys.current['w'])    dir.z -= 1;
      if (keys.current['KeyS'] || keys.current['ArrowDown'] || keys.current['s'])  dir.z += 1;
      if (keys.current['KeyA'] || keys.current['ArrowLeft'] || keys.current['a'])  dir.x -= 1;
      if (keys.current['KeyD'] || keys.current['ArrowRight'] || keys.current['d']) dir.x += 1;
      if (dir.lengthSq() > 0) {
        const isSprinting = keys.current['ShiftLeft'] || keys.current['ShiftRight'] || keys.current['shift'];
        let moveSpeed = SPEED * (isBirdsEye ? 6 : 1);
        if (isSprinting) {
          moveSpeed *= 2.5;
        }
        dir.normalize().multiplyScalar(moveSpeed);
        dir.applyEuler(new THREE.Euler(0, yaw, 0));
        camera.position.add(dir);
      }
      if (isBirdsEye) {
        camera.position.y = 40.0;
      } else {
        currentYRef.current += (targetYRef.current - currentYRef.current) * 0.08;
        camera.position.y = currentYRef.current;
      }

      // Move clouds
      cloudsRef.current.forEach(c => {
        c.group.position.x += c.speed;
        if (c.group.position.x > 250) {
          c.group.position.x = -250;
          c.group.position.z = (Math.random() - 0.5) * 350;
        }
      });

      // Update 3D Trains
      if (trainsRef.current) {
        trainsRef.current.forEach(t => {
          try {
            const speedFactor = 0.22;
            const now = performance.now();
            const cycleMs = (t.totalLen / speedFactor) * 16.7;
            const trainT = (now / cycleMs) % 1.0;

            // 1. Update Locomotive
            const locoPos = t.curve.getPointAt(trainT);
            t.loco.position.set(locoPos.x, 9.3, locoPos.z);
            const tangent = t.curve.getTangentAt(trainT);
            t.loco.rotation.y = Math.atan2(tangent.x, tangent.z);

            // 2. Update Carriages
            const spacing = 3.8 / t.totalLen;
            t.carts.forEach((cart, idx) => {
              const cartT = (trainT - (idx + 1) * spacing + 1.0) % 1.0;
              const cartPos = t.curve.getPointAt(cartT);
              cart.position.set(cartPos.x, 9.3, cartPos.z);
              const cartTangent = t.curve.getTangentAt(cartT);
              cart.rotation.y = Math.atan2(cartTangent.x, cartTangent.z);
            });
          } catch (err) {}
        });
      }

      // Distance-based visibility culling for buildings and road markings
      const camX = camera.position.x;
      const camZ = camera.position.z;
      const cullDistSq = isBirdsEye ? 600 * 600 : 180 * 180;
      const markingsCullDistSq = isBirdsEye ? 150 * 150 : 100 * 100;

      meshesRef.current.forEach(m => {
        if (m.userData) {
          if (m.userData.assetId) {
            const dx = m.position.x - camX;
            const dz = m.position.z - camZ;
            const distSq = dx * dx + dz * dz;
            m.visible = distSq < cullDistSq;
          } else if (m.userData.isRoadMarkings) {
            const dx = m.userData.centerX - camX;
            const dz = m.userData.centerZ - camZ;
            const distSq = dx * dx + dz * dz;
            m.visible = distSq < markingsCullDistSq;
          }
        }
      });

      // Roaming humans update
      humansRef.current.forEach(h => {
        const mesh = h.mesh;

        // Update progress parameter t
        h.t += h.speed * h.direction;

        // Transition/turn back if target reaches bounds
        if (h.t >= 1 || h.t <= 0) {
          const currentCityObj = cityRef.current;
          if (currentCityObj && currentCityObj.roads && currentCityObj.roads.length > 0) {
            const roadIndex = Math.floor(Math.random() * currentCityObj.roads.length);
            const road = currentCityObj.roads[roadIndex];
            if (road.points.length >= 2) {
              const points3d = road.points.map(pt => new THREE.Vector3(pt.x * 3.4, 0, pt.z * 3.4));
              h.curve = new THREE.CatmullRomCurve3(points3d);
              h.roadId = road.id;
              h.direction = Math.random() > 0.5 ? 1 : -1;
              h.t = h.direction === 1 ? 0 : 1;
            } else {
              h.direction *= -1;
              h.t = Math.max(0, Math.min(1, h.t));
            }
          } else {
            h.direction *= -1;
            h.t = Math.max(0, Math.min(1, h.t));
          }
        }

        const pos = h.curve.getPointAt(h.t);
        mesh.position.copy(pos);

        // Rotate human to face walking direction
        const tangent = h.curve.getTangentAt(h.t);
        const angle = Math.atan2(tangent.x, tangent.z) + (h.direction === -1 ? Math.PI : 0);
        mesh.rotation.y = angle;

        // Leg swing animation
        h.legSwing += 0.15;
        const leftLeg = mesh.children[2];
        const rightLeg = mesh.children[3];
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = Math.sin(h.legSwing) * 0.5;
          rightLeg.rotation.x = -Math.sin(h.legSwing) * 0.5;
        }

        const torso = mesh.children[0];
        const head = mesh.children[1];
        if (torso && head) {
          const bob = Math.abs(Math.sin(h.legSwing)) * 0.04;
          torso.position.y = 0.5 - bob;
          head.position.y = 0.9 - bob;
        }
      });

      // Render minimap radar
      const miniCanvas = minimapCanvasRef.current;
      const currentCity = cityRef.current;
      if (miniCanvas && currentCity) {
        const miniCtx = miniCanvas.getContext('2d');
        const W_mini = miniCanvas.width;
        const H_mini = miniCanvas.height;
        
        miniCtx.save();
        miniCtx.clearRect(0, 0, W_mini, H_mini);
        
        // Circular clip
        miniCtx.beginPath();
        miniCtx.arc(75, 75, 70, 0, 2 * Math.PI);
        miniCtx.clip();
        
        // Draw minimap background (dark green ground)
        miniCtx.fillStyle = '#1b4332';
        miniCtx.fillRect(0, 0, W_mini, H_mini);
        
        const minimapCellSize = minimapZoomRef.current;
        const playerCol = camX / 3.4;
        const playerRow = camZ / 3.4;
        
        // Save context and apply translation/rotation for GTA-style map rotation
        miniCtx.save();
        miniCtx.translate(75, 75);
        miniCtx.rotate(yaw + Math.PI / 2);

        // 1. Draw roads (relative to player in rotated space)
        const drawMinimapRoad = (roadPoints, rType, roadId) => {
          if (roadPoints.length < 2) return;
          const samples = roadId ? getRoadSamples(roadId, roadPoints) : (() => {
            const points3d = roadPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
            const curve = new THREE.CatmullRomCurve3(points3d);
            return curve.getPoints(30);
          })();

          const segments = [];
          let currentSeg = [];
          for (const pt of samples) {
            const isCulled = roadId ? isSampleCulled(pt, roadId, intersections) : false;
            if (isCulled) {
              if (currentSeg.length >= 2) {
                segments.push(currentSeg);
              }
              currentSeg = [];
            } else {
              currentSeg.push(pt);
            }
          }
          if (currentSeg.length >= 2) {
            segments.push(currentSeg);
          }

          const untrimmedScreenPoints = [samples.map(pt => ({
            x: (pt.x - playerCol) * minimapCellSize,
            z: (pt.z - playerRow) * minimapCellSize
          }))];

          const segmentScreenPoints = segments.map(seg => seg.map(pt => ({
            x: (pt.x - playerCol) * minimapCellSize,
            z: (pt.z - playerRow) * minimapCellSize
          })));
          
          const drawCurve = (segList) => {
            segList.forEach(points => {
              if (points.length < 2) return;
              miniCtx.beginPath();
              points.forEach((pt, idx) => {
                if (idx === 0) miniCtx.moveTo(pt.x, pt.z);
                else miniCtx.lineTo(pt.x, pt.z);
              });
              miniCtx.stroke();
            });
          };

          if (rType === 'dirt') {
            miniCtx.strokeStyle = '#8b5a2b';
            miniCtx.lineWidth = 6;
          } else if (rType === 'brick') {
            miniCtx.strokeStyle = '#a63a3a';
            miniCtx.lineWidth = 8;
          } else if (rType === 'avenue') {
            miniCtx.strokeStyle = '#334155';
            miniCtx.lineWidth = 16;
          } else if (rType === 'cyberway') {
            miniCtx.strokeStyle = '#0f172a';
            miniCtx.lineWidth = 10;
          } else {
            miniCtx.strokeStyle = '#334155';
            miniCtx.lineWidth = (rType === 'highway' ? 18 : rType === 'multilane' ? 12 : 8);
          }
          miniCtx.lineCap = 'round';
          miniCtx.lineJoin = 'round';
          drawCurve(untrimmedScreenPoints);

          // Center markings
          if (rType === 'multilane') {
            miniCtx.strokeStyle = '#f59e0b';
            miniCtx.lineWidth = 1.0;
            drawCurve(segmentScreenPoints);
          } else if (rType === 'highway') {
            miniCtx.strokeStyle = '#cbd5e1';
            miniCtx.lineWidth = 1.5;
            drawCurve(segmentScreenPoints);
          } else if (rType === 'avenue') {
            // Green center median line on minimap
            miniCtx.strokeStyle = '#22c55e';
            miniCtx.lineWidth = 2.0;
            drawCurve(segmentScreenPoints);
          } else if (rType === 'cyberway') {
            // Neon cyan glowing edges
            miniCtx.strokeStyle = '#00ffff';
            miniCtx.lineWidth = 1.0;
            drawCurve(segmentScreenPoints.map(seg => getOffsetPoints(seg, 4.5)));
            drawCurve(segmentScreenPoints.map(seg => getOffsetPoints(seg, -4.5)));
          } else if (rType === 'standard') {
            miniCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            miniCtx.lineWidth = 0.8;
            miniCtx.setLineDash([2, 3]);
            drawCurve(segmentScreenPoints);
            miniCtx.setLineDash([]);
          }
        };

        const getRoadPriority = (type) => {
          if (type === 'highway') return 6;
          if (type === 'avenue') return 5;
          if (type === 'multilane') return 4;
          if (type === 'cyberway') return 3;
          if (type === 'brick') return 2;
          if (type === 'standard') return 1;
          return 0; // dirt
        };

        const sortedRoads = [...(currentCity.roads || [])].sort((a, b) => {
          return getRoadPriority(a.roadType) - getRoadPriority(b.roadType);
        });

        sortedRoads.forEach(road => {
          drawMinimapRoad(road.points, road.roadType || 'standard', road.id);
        });

        // 2. Draw placed assets with detailed constituent sub-objects (relative to player position)
        (currentCity.placedAssets || []).forEach(asset => {
          const scaleFactor = asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : 1.0;
          const aw = (asset.width || 2) * minimapCellSize * scaleFactor;
          const ah = (asset.height || 2) * minimapCellSize * scaleFactor;
          
          const pos = getAdjustedAssetPosition(asset, currentCity.roads);
          const cx = (pos.col - playerCol) * minimapCellSize;
          const cy = (pos.row - playerRow) * minimapCellSize;

          // Distance culling from player center
          if (cx * cx + cy * cy > 95 * 95) return;

          miniCtx.save();
          miniCtx.translate(cx, cy);
          miniCtx.rotate(-(asset.rotation || 0));

          const ax = -aw / 2;
          const ay = -ah / 2;

          if (asset.objects && asset.objects.length > 0) {
            asset.objects.forEach(obj => {
              miniCtx.save();
              const ox = (obj.position?.x !== undefined ? obj.position.x : 0) * minimapCellSize * scaleFactor;
              const oz = (obj.position?.z !== undefined ? obj.position.z : 0) * minimapCellSize * scaleFactor;
              miniCtx.translate(ox, oz);
              miniCtx.rotate(-(obj.rotation?.y || 0));
              drawObject2D(miniCtx, obj, minimapCellSize * scaleFactor, asset.color);
              miniCtx.restore();
            });
          } else {
            miniCtx.fillStyle = asset.color || '#4ECDC4';
            miniCtx.fillRect(ax, ay, aw, ah);
            
            // Draw outline to separate buildings
            miniCtx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
            miniCtx.lineWidth = 0.8;
            miniCtx.strokeRect(ax, ay, aw, ah);
          }
          miniCtx.restore();
        });

        // Restore context to static clipped space
        miniCtx.restore();

        // 3. Draw player white teardrop at center (75, 75) pointing straight UP (static, GTA-style)
        miniCtx.save();
        miniCtx.translate(75, 75);
        miniCtx.rotate(-Math.PI / 2); // Always pointing straight UP

        miniCtx.fillStyle = '#ffffff';
        miniCtx.strokeStyle = '#0f172a';
        miniCtx.lineWidth = 2.0;

        miniCtx.beginPath();
        miniCtx.moveTo(9, 0); // pointing forward
        miniCtx.bezierCurveTo(4, 5.5, -6, 5.5, -6, 0);
        miniCtx.bezierCurveTo(-6, -5.5, 4, -5.5, 9, 0);
        miniCtx.fill();
        miniCtx.stroke();
        miniCtx.restore();

        miniCtx.restore(); // end of circular clip
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('contextmenu', onBlur);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('wheel', onWheel);
      mount.removeEventListener('contextmenu', preventCtx);
      if (miniEl) {
        miniEl.removeEventListener('wheel', handleMinimapWheel);
      }
      window.removeEventListener('resize', onResize);
      
      // Clean up humans meshes
      humansRef.current.forEach(h => {
        scene.remove(h.mesh);
        h.mesh.children.forEach(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      });

      // Clean up building/road meshes
      meshesRef.current.forEach(m => {
        scene.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach(mat => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (m.material.map) m.material.map.dispose();
            m.material.dispose();
          }
        }
        if (m.children) {
          m.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat.map) mat.map.dispose();
                  mat.dispose();
                });
              } else {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
              }
            }
          });
        }
      });
      
      if (bulbOnMatRef.current) { bulbOnMatRef.current.dispose(); bulbOnMatRef.current = null; }
      if (bulbOffMatRef.current) { bulbOffMatRef.current.dispose(); bulbOffMatRef.current = null; }

      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);

      if (materialCacheRef.current) {
        Object.values(materialCacheRef.current).forEach(mat => mat.dispose());
        materialCacheRef.current = {};
      }

      if (grassTextureRef.current) { grassTextureRef.current.dispose(); grassTextureRef.current = null; }
      if (asphaltTextureRef.current) { asphaltTextureRef.current.dispose(); asphaltTextureRef.current = null; }
      if (dirtTextureRef.current) { dirtTextureRef.current.dispose(); dirtTextureRef.current = null; }
      if (brickTextureRef.current) { brickTextureRef.current.dispose(); brickTextureRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rebuildStreetScene();
  }, [city, selectedAssetId, selectedRoadId, rebuildStreetScene]);

  const selectedAsset = selectedAssetId ? (city?.placedAssets || []).find(a => a.id === selectedAssetId) : null;

  return (
    <div ref={mountRef} onContextMenu={(e) => e.preventDefault()} style={{ width:'100%', height:'100%', position:'relative', cursor:'crosshair' }}>
      <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.55)', borderRadius:8, padding:'8px 14px', fontSize:12, color:'#fff', lineHeight:1.8, pointerEvents:'none' }}>
        🚶 <strong>Street View</strong><br />
        WASD / Arrows: walk<br />
        Drag: look around<br />
        Click on building to select/edit
      </div>
      <div style={{ position:'absolute', top:12, right:12, zIndex:10, display: 'flex', gap: 8 }}>
        <button
          className={`btn ${birdsEye ? 'primary' : ''}`}
          onClick={() => setBirdsEye(!birdsEye)}
          style={{
            background: birdsEye ? 'rgba(78, 205, 196, 0.2)' : 'rgba(22, 27, 38, 0.85)',
            color: birdsEye ? '#4ECDC4' : '#fff',
            border: birdsEye ? '1px solid #4ECDC4' : '1px solid rgba(255,255,255,0.25)',
            fontWeight: '600'
          }}
        >
          {birdsEye ? '🚶 First-Person View' : '🦅 Bird\'s Eye View'}
        </button>
        <button
          className="btn"
          onClick={onExit}
          style={{
            background: 'rgba(22, 27, 38, 0.85)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.25)'
          }}
        >
          🗺️ Back to Map
        </button>
      </div>

      {/* Floating Edit Panel in Street View */}
      {selectedAsset && (
        <div style={{
          position: 'absolute', top: 60, right: 12, width: 280,
          background: 'rgba(22, 27, 38, 0.85)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
          padding: '16px', color: '#fff', zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', gap: 12,
          maxHeight: 'calc(100% - 80px)', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#4ECDC4' }}>🏢 Edit Placed Asset</span>
            <button onClick={() => selectAsset(null)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{selectedAsset.name}</div>
            <div style={{ fontSize: 10, color: '#aaa' }}>Placed by @{selectedAsset.placedBy}</div>
          </div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span>Scale Multiplier</span>
              <span style={{ fontWeight: 600, color: '#4ECDC4' }}>
                {(selectedAsset.scaleMultiplier !== undefined ? selectedAsset.scaleMultiplier : getDefaultScaleFactor(selectedAsset)).toFixed(2)}x
              </span>
            </label>
            <input
              type="range"
              min={Math.min(0.1, getMaxScaleFactor(selectedAsset)).toFixed(2)}
              max={getMaxScaleFactor(selectedAsset).toFixed(2)}
              step="0.05"
              value={selectedAsset.scaleMultiplier !== undefined ? selectedAsset.scaleMultiplier : getDefaultScaleFactor(selectedAsset)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                updateAsset(selectedAsset.id, { scaleMultiplier: val });
              }}
              disabled={selectedAsset.locked}
              style={{ width: '100%', cursor: selectedAsset.locked ? 'not-allowed' : 'pointer', accentColor: '#4ECDC4' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#888', marginTop: 2 }}>
              <span>{Math.min(0.1, getMaxScaleFactor(selectedAsset)).toFixed(2)}x</span>
              <span>Max: {getMaxScaleFactor(selectedAsset).toFixed(2)}x</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Position Nudge</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, justifyItems: 'center', alignItems: 'center', width: '100%' }}>
              <div />
              <button
                className="btn sm"
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: selectedAsset.locked ? 'not-allowed' : 'pointer' }}
                onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row - 0.2 })}
                disabled={selectedAsset.locked}
                title="Move North"
              >
                ▲
              </button>
              <div />
              
              <button
                className="btn sm"
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: selectedAsset.locked ? 'not-allowed' : 'pointer' }}
                onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col - 0.2 })}
                disabled={selectedAsset.locked}
                title="Move West"
              >
                ◀
              </button>
              <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center' }}>Move</div>
              <button
                className="btn sm"
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: selectedAsset.locked ? 'not-allowed' : 'pointer' }}
                onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col + 0.2 })}
                disabled={selectedAsset.locked}
                title="Move East"
              >
                ▶
              </button>
              
              <div />
              <button
                className="btn sm"
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: selectedAsset.locked ? 'not-allowed' : 'pointer' }}
                onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row + 0.2 })}
                disabled={selectedAsset.locked}
                title="Move South"
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
              <span>Rotation</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="number"
                  min="0"
                  max="360"
                  value={Math.round(((selectedAsset.rotation || 0) * 180 / Math.PI) % 360 + 360) % 360}
                  onChange={(e) => {
                    let deg = parseInt(e.target.value);
                    if (isNaN(deg)) deg = 0;
                    deg = (deg % 360 + 360) % 360;
                    const rad = (deg * Math.PI) / 180;
                    updateAsset(selectedAsset.id, { rotation: rad });
                  }}
                  disabled={selectedAsset.locked}
                  style={{
                    width: 45,
                    background: 'rgba(22, 27, 38, 0.95)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 4,
                    color: '#4ECDC4',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 4px',
                    textAlign: 'center',
                    cursor: selectedAsset.locked ? 'not-allowed' : 'text'
                  }}
                />
                <span>°</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={Math.round(((selectedAsset.rotation || 0) * 180 / Math.PI) % 360 + 360) % 360}
              onChange={(e) => {
                const deg = parseInt(e.target.value);
                const rad = (deg * Math.PI) / 180;
                updateAsset(selectedAsset.id, { rotation: rad });
              }}
              disabled={selectedAsset.locked}
              style={{ width: '100%', cursor: selectedAsset.locked ? 'not-allowed' : 'pointer', accentColor: '#4ECDC4' }}
            />
          </div>
          
          {selectedAsset.objects && selectedAsset.objects.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Objects Colors</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                {selectedAsset.objects.map((obj, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6 }}>
                    <span style={{ fontSize: 10, color: '#ddd', textTransform: 'capitalize' }}>
                      {idx + 1}. {obj.geometry}
                    </span>
                    <SmoothColorPicker
                      value={obj.color || '#4ECDC4'}
                      onChange={(e) => {
                        const newObjects = selectedAsset.objects.map((o, oIdx) => {
                          if (oIdx === idx) {
                            return { ...o, color: e.target.value };
                          }
                          return o;
                        });
                        updateAsset(selectedAsset.id, { objects: newObjects });
                      }}
                      disabled={selectedAsset.locked}
                      style={{
                        width: 24, height: 20, border: 'none', padding: 0,
                        background: 'none', cursor: selectedAsset.locked ? 'not-allowed' : 'pointer', borderRadius: 4
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10, display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                removeAsset(selectedAsset.id);
                selectAsset(null);
              }}
              style={{
                flex: 1, padding: '6px 12px', background: '#e53e3e',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#c53030'}
              onMouseLeave={(e) => e.target.style.background = '#e53e3e'}
            >
              🗑️ Delete
            </button>
            <button
              onClick={() => {
                updateAsset(selectedAsset.id, { locked: !selectedAsset.locked });
              }}
              style={{
                flex: 1, padding: '6px 12px', background: 'rgba(255,255,255,0.1)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              {selectedAsset.locked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Road Info Panel in Street View */}
      {selectedRoad && (
        <div style={{
          position: 'absolute', top: 60, right: 12, width: 280,
          background: 'rgba(22, 27, 38, 0.85)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
          padding: '16px', color: '#fff', zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', gap: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#ef4444' }}>🛣️ Selected Road</span>
            <button onClick={() => setSelectedRoadId(null)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>Type: {selectedRoad.roadType || 'standard'}</div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>Nodes: {selectedRoad.points?.length || 0}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => {
                removeRoadSegment(selectedRoad.id);
                setSelectedRoadId(null);
              }}
              style={{
                flex: 1, padding: '8px 12px', background: '#e53e3e',
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#c53030'}
              onMouseLeave={(e) => e.target.style.background = '#e53e3e'}
            >
              🗑️ Delete
            </button>
            <button
              onClick={() => {
                updateRoad(selectedRoad.id, { locked: !selectedRoad.locked });
              }}
              style={{
                flex: 1, padding: '8px 12px', background: selectedRoad.locked ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255,255,255,0.1)',
                color: selectedRoad.locked ? '#4ECDC4' : '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              {selectedRoad.locked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
          </div>
        </div>
      )}
      {/* GTA Minimap Radar Overlay */}
      <div 
        ref={minimapContainerRef}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: '4px solid rgba(22, 27, 38, 0.95)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          background: '#1b4332',
          zIndex: 10,
          cursor: 'zoom-in'
        }}
      >
        <canvas ref={minimapCanvasRef} width={150} height={150} />
      </div>
    </div>
  );
}

function createHumanMesh(clothingColor) {
  const group = new THREE.Group();
  
  // Torso
  const torsoMat = new THREE.MeshStandardMaterial({ color: clothingColor, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), torsoMat);
  torso.position.y = 0.5;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);
  
  // Head
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skinMat);
  head.position.y = 0.9;
  head.castShadow = true;
  group.add(head);
  
  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.8 });
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), legMat);
  legL.position.set(-0.06, 0.2, 0);
  legL.castShadow = true;
  group.add(legL);
  
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), legMat);
  legR.position.set(0.06, 0.2, 0);
  legR.castShadow = true;
  group.add(legR);
  
  return group;
}

function isPointInPolygon(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z;
    const xj = poly[j].x, zj = poly[j].z;
    
    const intersect = ((zi > pt.z) !== (zj > pt.z))
        && (pt.x < (xj - xi) * (pt.z - zi) / (zj - zi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function doSegmentsCross(A, B, C, D) {
  function isSamePoint(p1, p2, epsilon = 0.01) {
    return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.z - p2.z) < epsilon;
  }
  if (isSamePoint(A, C) || isSamePoint(A, D) || isSamePoint(B, C) || isSamePoint(B, D)) {
    return false;
  }
  function ccw(p1, p2, p3) {
    return (p3.z - p1.z) * (p2.x - p1.x) - (p2.z - p1.z) * (p3.x - p1.x);
  }
  const cp1 = ccw(A, B, C);
  const cp2 = ccw(A, B, D);
  const cp3 = ccw(C, D, A);
  const cp4 = ccw(C, D, B);
  if (((cp1 > 0.0001 && cp2 < -0.0001) || (cp1 < -0.0001 && cp2 > 0.0001)) &&
      ((cp3 > 0.0001 && cp4 < -0.0001) || (cp3 < -0.0001 && cp4 > 0.0001))) {
    return true;
  }
  return false;
}

function getInteriorPoint(poly, idx, epsilon = 0.05) {
  const n = poly.length;
  const len = poly[0].x === poly[n-1].x && poly[0].z === poly[n-1].z ? n - 1 : n;
  const curr = poly[idx];
  const prev = poly[(idx - 1 + len) % len];
  const next = poly[(idx + 1) % len];
  let dx1 = prev.x - curr.x;
  let dz1 = prev.z - curr.z;
  let dx2 = next.x - curr.x;
  let dz2 = next.z - curr.z;
  let len1 = Math.sqrt(dx1*dx1 + dz1*dz1);
  let len2 = Math.sqrt(dx2*dx2 + dz2*dz2);
  if (len1 === 0 || len2 === 0) return curr;
  dx1 /= len1; dz1 /= len1;
  dx2 /= len2; dz2 /= len2;
  let bx = dx1 + dx2;
  let bz = dz1 + dz2;
  let blen = Math.sqrt(bx*bx + bz*bz);
  if (blen < 0.0001) {
    bx = -dz1;
    bz = dx1;
  } else {
    bx /= blen;
    bz /= blen;
  }
  const p1 = { x: curr.x + bx * epsilon, z: curr.z + bz * epsilon };
  const p2 = { x: curr.x - bx * epsilon, z: curr.z - bz * epsilon };
  if (isPointInPolygon(p1, poly)) return p1;
  if (isPointInPolygon(p2, poly)) return p2;
  let sumX = 0, sumZ = 0;
  for (let i = 0; i < len; i++) {
    sumX += poly[i].x;
    sumZ += poly[i].z;
  }
  const centroid = { x: sumX / len, z: sumZ / len };
  return { x: (curr.x + centroid.x) / 2, z: (curr.z + centroid.z) / 2 };
}

function doPolygonsOverlap(polyA, polyB) {
  if (!polyA || !polyB || polyA.length < 3 || polyB.length < 3) return false;
  for (let i = 0; i < polyA.length - 1; i++) {
    for (let j = 0; j < polyB.length - 1; j++) {
      if (doSegmentsCross(polyA[i], polyA[i+1], polyB[j], polyB[j+1])) {
        return true;
      }
    }
  }
  const lenA = polyA[0].x === polyA[polyA.length-1].x && polyA[0].z === polyA[polyA.length-1].z ? polyA.length - 1 : polyA.length;
  for (let i = 0; i < lenA; i++) {
    const ptA = getInteriorPoint(polyA, i);
    if (isPointInPolygon(ptA, polyB)) {
      return true;
    }
  }
  const lenB = polyB[0].x === polyB[polyB.length-1].x && polyB[0].z === polyB[polyB.length-1].z ? polyB.length - 1 : polyB.length;
  for (let j = 0; j < lenB; j++) {
    const ptB = getInteriorPoint(polyB, j);
    if (isPointInPolygon(ptB, polyA)) {
      return true;
    }
  }
  return false;
}

function getClosestPointOnSegment(p, a, b) {
  const abX = b.x - a.x;
  const abZ = b.z - a.z;
  const apX = p.x - a.x;
  const apZ = p.z - a.z;
  
  const abLen2 = abX * abX + abZ * abZ;
  if (abLen2 === 0) return a;
  
  let t = (apX * abX + apZ * abZ) / abLen2;
  t = Math.max(0, Math.min(1, t)); // clamp to segment
  
  return {
    x: a.x + t * abX,
    z: a.z + t * abZ
  };
}

function snapZonePointsToSurrounding(newPoints, existingZones, threshold = 0.8) {
  if (!existingZones || existingZones.length === 0) return newPoints;
  
  const snapped = newPoints.map((pt, idx) => {
    if (idx === newPoints.length - 1 && idx > 0) {
      return pt; // handle closing loop separately
    }
    
    let closestPt = null;
    let minD = Infinity;
    
    existingZones.forEach(zone => {
      if (!zone.points || zone.points.length < 2) return;
      
      for (let i = 0; i < zone.points.length - 1; i++) {
        const a = zone.points[i];
        const b = zone.points[i+1];
        const q = getClosestPointOnSegment(pt, a, b);
        const dist = Math.sqrt((pt.x - q.x)**2 + (pt.z - q.z)**2);
        if (dist < minD) {
          minD = dist;
          closestPt = q;
        }
      }
    });
    
    if (minD < threshold && closestPt) {
      return closestPt;
    }
    return pt;
  });
  
  if (snapped.length > 0) {
    snapped[snapped.length - 1] = { x: snapped[0].x, z: snapped[0].z };
  }
  return snapped;
}

function createZoneLabelSprite(name, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw nice pill background
  ctx.fillStyle = 'rgba(22, 27, 38, 0.85)';
  ctx.strokeStyle = color || '#4ECDC4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 32);
  ctx.fill();
  ctx.stroke();
  
  // Draw text in uppercase with monospace map font
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // make it always draw on top
    sizeAttenuation: true
  });
  
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(6.0, 1.5, 1.0);
  return sprite;
}

// Need THREE in StreetView

// Need THREE in StreetView
