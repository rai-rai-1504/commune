import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { TEMPLATES } from '../../components/AssetLibrary';

const CELL = 34;

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
        const v = new Float32Array([
          -0.5,0,-0.5,  0.5,0,-0.5,  0.5,0,0.5,  -0.5,0,0.5,
          -0.5,1,-0.5,  0.5,1,-0.5,
        ]);
        const idx = [0,1,2, 0,2,3, 0,1,5, 0,5,4, 0,4,3, 1,2,5, 3,4,5, 2,3,5];
        g.setAttribute('position', new THREE.BufferAttribute(v, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        STREET_GEO[type] = g;
        break;
      }
      default: STREET_GEO[type] = new THREE.BoxGeometry(1, 1, 1);
    }
  }
  return STREET_GEO[type];
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

export default function CityModule() {
  const {
    city, cityTool, setCityTool,
    presence, streetView, setStreetView,
    selectedAssetId, selectAsset, removeAsset, updateAsset,
    pendingPlacementAsset, placePendingAsset, clearCity,
    addRoadSegment, removeRoadSegment,
  } = useStore();

  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 16, y: 16 });
  const [zoom, setZoom] = useState(1.0);
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
    return !!city && !!pendingPlacementAsset;
  }, [city, pendingPlacementAsset]);

  const getRoadAlignment = useCallback((col, row) => {
    if (!city || !city.roads || city.roads.length === 0) return null;
    let closestDist = Infinity;
    let closestPt = null;
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

    if (closestDist < 2.2 && closestPt) {
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

    if (closestDist < 1.0 && closestPt) {
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

    // Background - soft grass green
    ctx.fillStyle = '#b7e4c7';
    ctx.fillRect(0, 0, W, H);

    // Decorative infinite grid overlay
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
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

    const drawRoad = (roadPoints, type, isPreview, isSelected) => {
      if (roadPoints.length < 2) return;
      
      const points3d = roadPoints.map(pt => new THREE.Vector3(pt.x, 0, pt.z));
      const curve = new THREE.CatmullRomCurve3(points3d);
      const samples = curve.getPoints(Math.max(30, roadPoints.length * 10));
      
      const screenPoints = samples.map(pt => ({
        x: offset.x + pt.x * cellSize,
        z: offset.y + pt.z * cellSize
      }));

      const opacity = isPreview ? 0.6 : 1.0;
      
      const drawCurvePoints = (points) => {
        ctx.beginPath();
        points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.z);
          else ctx.lineTo(pt.x, pt.z);
        });
        ctx.stroke();
      };

      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = (type === 'highway' ? 52 : type === 'multilane' ? 36 : 24) * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawCurvePoints(screenPoints);
        ctx.restore();
      }

      if (type === 'multilane') {
        // Main pavement
        ctx.strokeStyle = `rgba(51, 65, 85, ${opacity})`;
        ctx.lineWidth = 28 * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawCurvePoints(screenPoints);

        // Double yellow center lines
        ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
        ctx.lineWidth = 1.5 * zoom;
        ctx.lineCap = 'butt';
        drawCurvePoints(getOffsetPoints(screenPoints, 2 * zoom));
        drawCurvePoints(getOffsetPoints(screenPoints, -2 * zoom));

        // Dashed lane lines
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.45})`;
        ctx.lineWidth = 1.5 * zoom;
        ctx.setLineDash([5 * zoom, 8 * zoom]);
        drawCurvePoints(getOffsetPoints(screenPoints, 8 * zoom));
        drawCurvePoints(getOffsetPoints(screenPoints, -8 * zoom));
        ctx.setLineDash([]);
      } else if (type === 'highway') {
        // Main pavement
        ctx.strokeStyle = `rgba(30, 41, 59, ${opacity})`;
        ctx.lineWidth = 44 * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawCurvePoints(screenPoints);

        // Concrete median (center)
        ctx.strokeStyle = `rgba(203, 213, 225, ${opacity})`;
        ctx.lineWidth = 4 * zoom;
        ctx.lineCap = 'round';
        drawCurvePoints(screenPoints);

        // Solid yellow inner shoulders
        ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
        ctx.lineWidth = 1.5 * zoom;
        ctx.lineCap = 'butt';
        drawCurvePoints(getOffsetPoints(screenPoints, 4.5 * zoom));
        drawCurvePoints(getOffsetPoints(screenPoints, -4.5 * zoom));

        // Dashed lane lines
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.45})`;
        ctx.lineWidth = 1.5 * zoom;
        ctx.setLineDash([6 * zoom, 10 * zoom]);
        drawCurvePoints(getOffsetPoints(screenPoints, 12 * zoom));
        drawCurvePoints(getOffsetPoints(screenPoints, -12 * zoom));
        ctx.setLineDash([]);

        // Solid white outer shoulders
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
        ctx.lineWidth = 1.5 * zoom;
        drawCurvePoints(getOffsetPoints(screenPoints, 19 * zoom));
        drawCurvePoints(getOffsetPoints(screenPoints, -19 * zoom));
      } else {
        // Standard
        ctx.strokeStyle = `rgba(71, 85, 105, ${opacity})`;
        ctx.lineWidth = 16 * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawCurvePoints(screenPoints);

        // Center dashes
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.45})`;
        ctx.lineWidth = 2 * zoom;
        ctx.setLineDash([6 * zoom, 8 * zoom]);
        drawCurvePoints(screenPoints);
        ctx.setLineDash([]);
      }
    };

    // Render placed curvy roads
    (city.roads || []).forEach(road => {
      const isSel = road.id === selectedRoadId;
      drawRoad(road.points, road.roadType || 'standard', false, isSel);
    });

    // Render active road under construction
    if (cityTool === 'road' && activeRoadPoints.length > 0) {
      let pts = [...activeRoadPoints];
      if (hoveredFloat) {
        pts.push({ x: hoveredFloat.col, z: hoveredFloat.row });
      }
      drawRoad(pts, activeRoadType, true, false);

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

    // Render marquee selection box
    if (marqueeStart && marqueeEnd) {
      const sx = offset.x + marqueeStart.col * cellSize;
      const sy = offset.y + marqueeStart.row * cellSize;
      const ex = offset.x + marqueeEnd.col * cellSize;
      const ey = offset.y + marqueeEnd.row * cellSize;

      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(sx, sy, ex - sx, ey - sy);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5 * zoom;
      ctx.setLineDash([4 * zoom, 4 * zoom]);
      ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      ctx.restore();
    }

    // Placed assets are rendered below

    // Placed assets
    (city.placedAssets || []).forEach(asset => {
      const scaleFactor = asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : 1.0;
      const aw = (asset.width || 2) * (cellSize / 3.4) * scaleFactor;
      const ah = (asset.height || 2) * (cellSize / 3.4) * scaleFactor;
      const isSelected = asset.id === selectedAssetId;

      ctx.save();
      ctx.translate(offset.x + asset.col * cellSize, offset.y + asset.row * cellSize);
      ctx.rotate(-(asset.rotation || 0));

      const ax = -aw / 2;
      const ay = -ah / 2;

      // 1. Draw generic footprint shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(ax + 2, ay + 2, aw, ah);

      const objScale = (cellSize / 3.4) * scaleFactor;

      // 2. Draw actual constituent 3D primitives in 2D top view
      if (asset.objects && asset.objects.length > 0) {
        asset.objects.forEach(obj => {
          ctx.save();
          // Position relative to asset center
          const ox = (obj.position?.x !== undefined ? obj.position.x : 0) * objScale;
          const oz = (obj.position?.z !== undefined ? obj.position.z : 0) * objScale;
          ctx.translate(ox, oz);
          ctx.rotate(-(obj.rotation?.y || 0));

          const sx = (obj.scale?.x !== undefined ? obj.scale.x : 1) * objScale;
          const sz = (obj.scale?.z !== undefined ? obj.scale.z : 1) * objScale;

          ctx.fillStyle = obj.color || asset.color || '#4ECDC4';
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;

          if (obj.geometry === 'cylinder' || obj.geometry === 'sphere' || obj.geometry === 'cone' || obj.geometry === 'torus') {
            ctx.beginPath();
            ctx.ellipse(0, 0, sx / 2, sz / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          } else {
            // box or wedge
            ctx.beginPath();
            ctx.rect(-sx / 2, -sz / 2, sx, sz);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        });
      } else {
        // Fallback generic bounding box if no sub-objects
        ctx.fillStyle = asset.color || '#4ECDC4';
        ctx.globalAlpha = 0.82;
        ctx.beginPath();
        ctx.roundRect?.(ax, ay, aw, ah, 3) || ctx.rect(ax, ay, aw, ah);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = asset.color || '#4ECDC4';
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
    });

    // Hover highlight or pending placement
    if (hoveredFloat && pendingPlacementAsset) {
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

          const sx = (obj.scale?.x !== undefined ? obj.scale.x : 1) * objScale;
          const sz = (obj.scale?.z !== undefined ? obj.scale.z : 1) * objScale;

          ctx.fillStyle = obj.color || pendingPlacementAsset.color || '#4ECDC4';
          ctx.strokeStyle = isValid ? 'rgba(78, 205, 196, 0.4)' : 'rgba(226, 75, 74, 0.4)';
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
  }, [city, offset, cellSize, zoom, hoveredFloat, cityTool, selectedAssetId, selectedRoadId, selectedCell, pendingPlacementAsset, isPlacementValid, activeRoadPoints, getRoadAlignment, manualRotation, activeRoadType, marqueeStart, marqueeEnd]);

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
      const scaleFactor = a.scaleMultiplier !== undefined ? a.scaleMultiplier : 1.0;
      const hw = ((a.width || 2) * scaleFactor) / (2 * 3.4);
      const hh = ((a.height || 2) * scaleFactor) / (2 * 3.4);

      // Project click coordinates into the building's local rotated coordinate space
      const dx = col - a.col;
      const dy = row - a.row;
      const rot = a.rotation || 0;
      const localX = dx * Math.cos(rot) + dy * Math.sin(rot);
      const localY = -dx * Math.sin(rot) + dy * Math.cos(rot);

      return localX >= -hw && localX <= hw &&
             localY >= -hh && localY <= hh;
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
            addRoadSegment(uniquePoints, activeRoadType);
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
        if (selectedAssetId) {
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
  }, [cityTool, activeRoadPoints, addRoadSegment, streetView, pendingPlacementAsset, activeRoadType, selectedAssetId, selectedRoadId, removeAsset, selectAsset, removeRoadSegment]);

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

    // Right click completes the road segment
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
          addRoadSegment(uniquePoints, activeRoadType);
        }
      }
      setActiveRoadPoints([]);
      return;
    }

    if (e.button === 0) {
      if (pendingPlacementAsset) {
        if (isPlacementValid(floatCoords.col, floatCoords.row)) {
          const alignment = getRoadAlignment(floatCoords.col, floatCoords.row);
          const rotation = alignment ? alignment.rotation : manualRotation;
          placePendingAsset(floatCoords.col, floatCoords.row, rotation);
        }
        return;
      }
      if (cityTool === 'select') {
        const cell = cellFromEvent(e);
        const asset = assetAtCell(floatCoords.col, floatCoords.row);
        if (asset) {
          e.preventDefault();
          selectAsset(asset.id);
          setSelectedRoadId(null);
          setSelectedCell(null); // Clear confusing grid selection box
          setDraggingAssetId(asset.id);
          dragOffset.current = {
            col: floatCoords.col - asset.col,
            row: floatCoords.row - asset.row
          };
        } else {
          selectAsset(null);
          const road = roadAtCoords(floatCoords.col, floatCoords.row);
          setSelectedRoadId(road ? road.id : null);
          if (road) {
            setSelectedCell(null); // Clear confusing grid selection box
          } else {
            setSelectedCell(cell); // Show grid selection box only on empty tile click
          }
        }
        return;
      }
      if (cityTool === 'road') {
        const snap = getRoadSnapPoint(floatCoords.col, floatCoords.row);
        const finalCol = snap ? snap.x : floatCoords.col;
        const finalRow = snap ? snap.z : floatCoords.row;
        setActiveRoadPoints(prev => [...prev, { x: finalCol, z: finalRow }]);
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
        addRoadSegment(uniquePoints, activeRoadType);
      }
      setActiveRoadPoints([]);
    }
  }

  function onMouseMove(e) {
    if (panning && panStart.current) {
      setOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }
    let floatCoords = getFloatCoords(e);
    if (cityTool === 'road') {
      const snap = getRoadSnapPoint(floatCoords.col, floatCoords.row);
      if (snap) {
        floatCoords = { col: snap.x, row: snap.z };
      }
    }
    setHoveredFloat(floatCoords);

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
    if (draggingAssetId) {
      const latestCity = useStore.getState().city;
      const asset = (latestCity?.placedAssets || []).find(a => a.id === draggingAssetId);
      if (asset) {
        updateAsset(draggingAssetId, { col: asset.col, row: asset.row }, true); // save final to server
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

      if (width > 0.1 || height > 0.1) {
        // Marquee drag: Delete assets inside marquee box
        const assetsToDelete = (city?.placedAssets || []).filter(a => {
          return a.col >= minCol && a.col <= maxCol &&
                 a.row >= minRow && a.row <= maxRow;
        });
        assetsToDelete.forEach(a => removeAsset(a.id));

        // Delete roads inside marquee box
        const roadsToDelete = (city?.roads || []).filter(road => {
          return road.points.some(pt => pt.x >= minCol && pt.x <= maxCol && pt.z >= minRow && pt.z <= maxRow);
        });
        roadsToDelete.forEach(r => removeRoadSegment(r.id));
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
          }
        }
      }

      setMarqueeStart(null);
      setMarqueeEnd(null);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.88 : 1.13;
    setZoom(z => Math.max(0.35, Math.min(3.5, z * delta)));
  }

  const selectedAsset = selectedAssetId ? (city?.placedAssets || []).find(a => a.id === selectedAssetId) : null;
  const selectedRoad = selectedRoadId ? (city?.roads || []).find(r => r.id === selectedRoadId) : null;

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

        {cityTool === 'road' && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', borderRadius: 'var(--radius)', margin: '0 8px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6, fontWeight: '600', letterSpacing: '0.05em' }}>Road Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { id: 'standard', label: 'Standard (2 lanes)', color: '#445566' },
                { id: 'multilane', label: 'Multi-lane (4 lanes)', color: '#334155' },
                { id: 'highway', label: 'Highway (4 lanes + Median)', color: '#1e293b' },
              ].map(rt => (
                <button
                  key={rt.id}
                  className={`btn sm ${activeRoadType === rt.id ? 'primary' : ''}`}
                  style={{ justifyContent: 'flex-start', width: '100%', padding: '6px 10px' }}
                  onClick={() => setActiveRoadType(rt.id)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: rt.color, marginRight: 6 }} />
                  {rt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Presets Library */}
        <div className="panel-label" style={{ padding:'10px 12px 4px' }}>Build Presets</div>
        <div className="tool-group" style={{ paddingTop:2, paddingBottom:6, overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
          {TEMPLATES.filter(t => [
            'house', 'suburban', 'apartment', 'villa', 'manor',
            'skyscraper', 'office', 'mall', 'diner', 'factory', 'refinery', 'warehouse',
            'park', 'greenhouse', 'fountain',
            'townhall', 'hospital', 'solar', 'turbine', 'watertower', 'bridge', 'station',
            'cathedral', 'megamall', 'techhq', 'resort', 'nuclear', 'skygarden', 'cargoport', 'university', 'ecodome', 'hyperloop',
            'tree_oak', 'tree_pine', 'tree_birch', 'tree_maple', 'tree_cherry', 'tree_palm', 'tree_baobab', 'tree_cypress', 'tree_willow'
          ].includes(t.id)).map(t => (
            <button
              key={t.id}
              className={`tool-btn ${pendingPlacementAsset?.name === t.name ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => {
                useStore.setState({
                  pendingPlacementAsset: {
                    name: t.name,
                    objects: t.objects,
                    color: t.objects[0]?.color || '#4ECDC4',
                    width: t.width || 2.0,
                    height: t.height || 2.0,
                  },
                  cityTool: 'select',
                });
              }}
            >
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
          <button className={`btn full ${streetView?'primary':''}`} onClick={() => setStreetView(!streetView)}>
            {streetView ? '🗺️ Map View' : '🚶 Street View'}
          </button>
          {!streetView && (
            <button
              className="btn full danger"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                if (window.confirm("Are you sure you want to clean the entire city? This will remove all zones, roads, and placed buildings!")) {
                  clearCity();
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.25)';
              }}
            >
              <span>🧹</span> Clean City
            </button>
          )}
          <div style={{ fontSize:10, color:'var(--text3)', marginTop:2, lineHeight:1.6 }}>
            Click: select/place · Right Click/Enter: finish road · Esc: cancel · Alt+drag: pan · Scroll: zoom
          </div>
        </div>
      </div>

      {/* ── Map / Street view ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {pendingPlacementAsset && !streetView && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(22, 27, 38, 0.95)', border: '2px solid var(--accent)',
            borderRadius: 8, padding: '10px 20px', zIndex: 100, display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}>
            <span style={{ fontSize: 16 }}>🏗️</span>
            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
              Click on the city map to place "{pendingPlacementAsset.name}" ({pendingPlacementAsset.width.toFixed(1)}x{pendingPlacementAsset.height.toFixed(1)} units)
            </span>
            <button className="btn sm danger" onClick={() => useStore.setState({ pendingPlacementAsset: null })} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        )}
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
            onDoubleClick={onDoubleClick}
            onContextMenu={(e) => { if (cityTool === 'road') e.preventDefault(); }}
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
        {hoveredFloat && !streetView && (
          <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', background:'rgba(10,17,24,0.92)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 14px', fontSize:11, color:'var(--text2)', pointerEvents:'none', whiteSpace:'nowrap' }}>
            ({hoveredFloat.col.toFixed(1)}, {hoveredFloat.row.toFixed(1)}) · {assetAtCell(hoveredFloat.col, hoveredFloat.row) ? `🏢 ${assetAtCell(hoveredFloat.col, hoveredFloat.row).name}` : (roadAtCoords(hoveredFloat.col, hoveredFloat.row) ? '🛣️ Road' : 'Empty')} · Tool: {TOOLS.find(t=>t.id===cityTool)?.label}
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
          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{selectedAsset.name}</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>
                Placed by @{selectedAsset.placedBy}<br />
                Position: ({selectedAsset.col}, {selectedAsset.row})
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginBottom: 2 }}>
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
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Position Nudge</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, justifyItems: 'center', alignItems: 'center', width: '100%' }}>
                <div />
                <button
                  className="btn sm"
                  style={{ padding: '4px 8px', fontSize: 10 }}
                  onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row - 0.2 })}
                  title="Move North"
                >
                  ▲
                </button>
                <div />
                
                <button
                  className="btn sm"
                  style={{ padding: '4px 8px', fontSize: 10 }}
                  onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col - 0.2 })}
                  title="Move West"
                >
                  ◀
                </button>
                <div style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center' }}>Move</div>
                <button
                  className="btn sm"
                  style={{ padding: '4px 8px', fontSize: 10 }}
                  onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col + 0.2 })}
                  title="Move East"
                >
                  ▶
                </button>
                
                <div />
                <button
                  className="btn sm"
                  style={{ padding: '4px 8px', fontSize: 10 }}
                  onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row + 0.2 })}
                  title="Move South"
                >
                  ▼
                </button>
                <div />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginBottom: 2 }}>
                <span>Rotation</span>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                  {Math.round(((selectedAsset.rotation || 0) * 180 / Math.PI) % 360 + 360) % 360}°
                </span>
              </label>
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
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

            {selectedAsset.objects && selectedAsset.objects.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Objects Colors</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
                  {selectedAsset.objects.map((obj, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: 4 }}>
                      <span style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'capitalize' }}>
                        {idx + 1}. {obj.geometry}
                      </span>
                      <input
                        type="color"
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
                        style={{
                          width: 18, height: 16, border: 'none', padding: 0,
                          background: 'none', cursor: 'pointer'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn sm danger full" style={{ marginTop: 4 }} onClick={() => { removeAsset(selectedAsset.id); selectAsset(null); }}>Remove Building</button>
          </div>
        )}
        {selectedRoad && (
          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>Selected Road</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2, textTransform: 'capitalize' }}>
                Type: {selectedRoad.roadType || 'standard'}<br />
                Nodes: {selectedRoad.points?.length || 0}
              </div>
            </div>
            <button className="btn sm danger full" style={{ marginTop: 4 }} onClick={() => { removeRoadSegment(selectedRoad.id); setSelectedRoadId(null); }}>
              Delete Road
            </button>
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
  const sceneRef = useRef(null);
  const meshesRef = useRef([]);
  const humansRef = useRef([]);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
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

  const { selectedAssetId, selectAsset, removeAsset, updateAsset } = useStore();
  const materialCacheRef = useRef({});
  const draggingAssetIdRef = useRef(null);
  const dragOffset3D = useRef({ x: 0, z: 0 });

  const rebuildStreetScene = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene || !city) return;

    // Clear old meshes
    meshesRef.current.forEach(m => {
      scene.remove(m);
      if (m.geometry && !Object.values(STREET_GEO).includes(m.geometry)) {
        m.geometry.dispose();
      }
      if (m.material) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach(mat => {
          const isCached = materialCacheRef.current && Object.values(materialCacheRef.current).includes(mat);
          if (!isCached) {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          }
        });
      }
      if (m.children) m.children.forEach(child => {
        if (child.geometry && !Object.values(STREET_GEO).includes(child.geometry)) {
          child.geometry.dispose();
        }
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => {
            const isCached = materialCacheRef.current && Object.values(materialCacheRef.current).includes(mat);
            if (!isCached) {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            }
          });
        }
      });
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

    const roadCurves = (city.roads || []).map(r => {
      if (r.points.length < 2) return null;
      const pts = r.points.map(pt => new THREE.Vector3(pt.x * cellS, 0.01, pt.z * cellS));
      const cv = new THREE.CatmullRomCurve3(pts);
      const rad = r.roadType === 'highway' ? 2.2 : r.roadType === 'multilane' ? 1.5 : 0.9;
      const samples = cv.getPoints(100);
      return { id: r.id, curve: cv, radius: rad, samples };
    }).filter(Boolean);

    const isPointInIntersection = (pos, currentRoadId, currentRadius) => {
      for (const other of roadCurves) {
        if (other.id === currentRoadId) continue;
        const hasHigherPriority = other.radius > currentRadius || 
          (Math.abs(other.radius - currentRadius) < 0.01 && other.id < currentRoadId);
        if (!hasHigherPriority) continue;

        let minDistSq = Infinity;
        for (let j = 0; j < other.samples.length; j++) {
          const distSq = pos.distanceToSquared(other.samples[j]);
          if (distSq < minDistSq) {
            minDistSq = distSq;
          }
        }
        const intersectionRadius = other.radius * 1.05;
        if (minDistSq < intersectionRadius * intersectionRadius) {
          return true;
        }
      }
      return false;
    };

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.85 });
    const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
 
    // Render curvy roads
    (city.roads || []).forEach(road => {
      if (road.points.length < 2) return;
      const points3d = road.points.map(pt => new THREE.Vector3(pt.x * cellS, 0.01, pt.z * cellS));
      const curve = new THREE.CatmullRomCurve3(points3d);

      const type = road.roadType || 'standard';
      let radius = 0.9;
      if (type === 'multilane') radius = 1.5;
      else if (type === 'highway') radius = 2.2;
 
      // Squashed TubeGeometry for road surface
      const roadGeo = new THREE.TubeGeometry(curve, Math.max(30, road.points.length * 10), radius, 8, false);
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.scale.set(1, 0.01, 1);
      roadMesh.receiveShadow = true;
      scene.add(roadMesh);
      meshesRef.current.push(roadMesh);
 
      const length = curve.getLength();
      const step = 0.4;
      const numSteps = Math.max(10, Math.floor(length / step));
 
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
          if (isPointInIntersection(markingPos, road.id, radius)) {
            return;
          }
          const m = new THREE.Mesh(new THREE.BoxGeometry(mWidth, mHeight, mLength), material);
          m.position.copy(markingPos);
          m.rotation.y = angle;
          scene.add(m);
          meshesRef.current.push(m);
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
        } else {
          // Standard center dashes
          if (i % 2 === 0) {
            addMarking(0, 0.06, 0.015, 0.4, dashMat);
          }
        }
      }
    });

    // Render placed assets with exact 3D sub-objects
    (city.placedAssets || []).forEach(asset => {
      const wx = asset.col * cellS; const wz = asset.row * cellS;
      const aw = (asset.width || 2) * cellS; const ah = (asset.height || 2) * cellS;
      const centerX = wx;
      const centerZ = wz;

      const buildingGroup = new THREE.Group();
      buildingGroup.position.set(centerX, 0, centerZ);
      buildingGroup.rotation.y = asset.rotation || 0;
      buildingGroup.userData = { assetId: asset.id };

      const isSel = asset.id === selectedAssetId;

      const maxSF = getMaxScaleFactor(asset);
      const defaultSF = Math.min(1.0, maxSF);
      const scaleFactor = asset.scaleMultiplier !== undefined ? asset.scaleMultiplier : defaultSF;

      if (asset.objects && asset.objects.length > 0) {
        asset.objects.forEach(obj => {
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
          
          let materials;
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

          if (isSel && texture) {
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
          
          const mesh = new THREE.Mesh(getStreetGeo(obj.geometry), materials);
          const oPos = obj.position || { x: 0, y: 0, z: 0 };
          const oRot = obj.rotation || { x: 0, y: 0, z: 0 };
          const oScl = obj.scale || { x: 1, y: 1, z: 1 };

          mesh.position.set(
            (oPos.x !== undefined ? oPos.x : 0) * scaleFactor,
            (oPos.y !== undefined ? oPos.y : 0) * scaleFactor,
            (oPos.z !== undefined ? oPos.z : 0) * scaleFactor
          );
          mesh.rotation.set(
            oRot.x !== undefined ? oRot.x : 0,
            oRot.y !== undefined ? oRot.y : 0,
            oRot.z !== undefined ? oRot.z : 0
          );
          mesh.scale.set(
            (oScl.x !== undefined ? oScl.x : 1) * scaleFactor,
            (oScl.y !== undefined ? oScl.y : 1) * scaleFactor,
            (oScl.z !== undefined ? oScl.z : 1) * scaleFactor
          );
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          buildingGroup.add(mesh);
        });
      } else {
        // Fallback simple block
        const fallbackMat = new THREE.MeshStandardMaterial({
          color: asset.color || 0x4ECDC4,
          roughness: 0.7,
          emissive: isSel ? new THREE.Color(0x4ECDC4) : new THREE.Color(0x000000),
          emissiveIntensity: isSel ? 0.28 : 0
        });
        const fallbackMesh = new THREE.Mesh(new THREE.BoxGeometry(aw * 0.8 * scaleFactor, 3 * scaleFactor, ah * 0.8 * scaleFactor), fallbackMat);
        fallbackMesh.position.y = 1.5 * scaleFactor;
        fallbackMesh.castShadow = true;
        buildingGroup.add(fallbackMesh);
      }

      scene.add(buildingGroup);
      meshesRef.current.push(buildingGroup);
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
  }, [city, selectedAssetId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !city) return;

    const W = mount.clientWidth || 600, H = mount.clientHeight || 400;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x87CEEB);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.Fog(0x87CEEB, 15, 60);
    scene.background = new THREE.Color(0x87CEEB);

    const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 1000);
    let startX = 0;
    let startZ = 0;
    if (city.roads && city.roads.length > 0 && city.roads[0].points.length > 0) {
      startX = (city.roads[0].points[0].x || 0) * 3.4;
      startZ = (city.roads[0].points[0].z || 0) * 3.4;
    } else if (city.placedAssets && city.placedAssets.length > 0) {
      startX = (city.placedAssets[0].col || 0) * 3.4;
      startZ = (city.placedAssets[0].row || 0) * 3.4;
    }
    camera.position.set(startX, 1.7, startZ);
    camRef.current = camera;

    // Lights - warm sunlighting and soft shadows
    scene.add(new THREE.AmbientLight(0xffffff, 0.26));
    const sun = new THREE.DirectionalLight(0xfffbf0, 1.4);
    sun.position.set(40, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x8bc7f7, 0x5c8240, 0.45));

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000),
      new THREE.MeshStandardMaterial({ color: 0x7cb342, roughness: 0.95 })
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
        // Start dragging asset in 3D instead of rotating camera
        isDraggingMouse.current = false;
        draggingAssetIdRef.current = clickedAssetId;

        const intersectionPoint = new THREE.Vector3();
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        raycaster.ray.intersectPlane(groundPlane, intersectionPoint);

        const currentCity = useStore.getState().city;
        const asset = (currentCity?.placedAssets || []).find(a => a.id === clickedAssetId);
        if (asset) {
          const assetX = asset.col * cellS;
          const assetZ = asset.row * cellS;
          dragOffset3D.current = {
            x: intersectionPoint.x - assetX,
            z: intersectionPoint.z - assetZ
          };
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

        const newCol = targetX / cellS;
        const newRow = targetZ / cellS;

        const buildingGroup = scene.children.find(c => c.userData && c.userData.assetId === draggingAssetIdRef.current);
        if (buildingGroup) {
          buildingGroup.position.set(targetX, 0, targetZ);
        }

        updateAsset(draggingAssetIdRef.current, { col: newCol, row: newRow }, false);
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
        const latestCity = useStore.getState().city;
        const asset = (latestCity?.placedAssets || []).find(a => a.id === draggingAssetIdRef.current);
        if (asset) {
          updateAsset(draggingAssetIdRef.current, { col: asset.col, row: asset.row }, true);
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
        selectAsset(clickedAssetId);
      }
    };
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

    const SPEED = 0.25;
    const dir = new THREE.Vector3();
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
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
      camera.position.y = isBirdsEye ? 40.0 : 1.7;

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
      
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);

      if (materialCacheRef.current) {
        Object.values(materialCacheRef.current).forEach(mat => mat.dispose());
        materialCacheRef.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rebuildStreetScene();
  }, [city, selectedAssetId, rebuildStreetScene]);

  const selectedAsset = selectedAssetId ? (city?.placedAssets || []).find(a => a.id === selectedAssetId) : null;

  return (
    <div ref={mountRef} style={{ width:'100%', height:'100%', position:'relative', cursor:'crosshair' }}>
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
              style={{ width: '100%', cursor: 'pointer', accentColor: '#4ECDC4' }}
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
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row - 0.2 })}
                title="Move North"
              >
                ▲
              </button>
              <div />
              
              <button
                className="btn sm"
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col - 0.2 })}
                title="Move West"
              >
                ◀
              </button>
              <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center' }}>Move</div>
              <button
                className="btn sm"
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                onClick={() => updateAsset(selectedAsset.id, { col: selectedAsset.col + 0.2 })}
                title="Move East"
              >
                ▶
              </button>
              
              <div />
              <button
                className="btn sm"
                style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                onClick={() => updateAsset(selectedAsset.id, { row: selectedAsset.row + 0.2 })}
                title="Move South"
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span>Rotation</span>
              <span style={{ fontWeight: 600, color: '#4ECDC4' }}>
                {Math.round(((selectedAsset.rotation || 0) * 180 / Math.PI) % 360 + 360) % 360}°
              </span>
            </label>
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
              style={{ width: '100%', cursor: 'pointer', accentColor: '#4ECDC4' }}
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
                    <input
                      type="color"
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
                      style={{
                        width: 24, height: 20, border: 'none', padding: 0,
                        background: 'none', cursor: 'pointer', borderRadius: 4
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
              🗑️ Delete Asset
            </button>
          </div>
        </div>
      )}
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

// Need THREE in StreetView

// Need THREE in StreetView
