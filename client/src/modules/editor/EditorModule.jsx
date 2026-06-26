import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SUBTRACTION, ADDITION, Evaluator, Brush } from 'three-bvh-csg';
import { useStore } from '../../store/useStore';
import AssetLibrary from '../../components/AssetLibrary';

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

const evaluator = new Evaluator();

const getCSGKey = (obj) => {
  return (obj.children || []).map(c => 
    `${c.id}_${c.geometry}_${c.color}_${c.isSubtractive}_` +
    `${c.position.x},${c.position.y},${c.position.z}_` +
    `${c.rotation.x},${c.rotation.y},${c.rotation.z}_` +
    `${c.scale.x},${c.scale.y},${c.scale.z}` +
    (c.geometry === 'csg' ? `_CSG_${getCSGKey(c)}` : '')
  ).join('|');
};

function buildCSGGeometry(obj) {
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
      const compiled = buildCSGGeometry(solid);
      geom = compiled.geometry;
      mat = compiled.materials;
    } else {
      geom = getGeo(solid.geometry);
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
      resultBrush = evaluator.evaluate(resultBrush, brush, ADDITION);
    }
  });

  subtractives.forEach(sub => {
    let geom;
    let mat;
    if (sub.geometry === 'csg') {
      const compiled = buildCSGGeometry(sub);
      geom = compiled.geometry;
      mat = compiled.materials;
    } else {
      geom = getGeo(sub.geometry);
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

    resultBrush = evaluator.evaluate(resultBrush, brush, SUBTRACTION);
  });

  return {
    geometry: resultBrush.geometry,
    materials: resultBrush.material || brushMaterials
  };
}

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

const SHAPE_FACES = {
  box: ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'],
  cylinder: ['Side', 'Top', 'Bottom'],
  cone: ['Side', 'Bottom']
};

function clearMeshMaterials(mesh) {
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(mat => {
      if (mat.map) mat.map.dispose();
      mat.dispose();
    });
  } else if (mesh.material) {
    if (mesh.material.map) mesh.material.map.dispose();
    mesh.material.dispose();
  }
}

function createTextCanvas(color, text, textColor, font, size) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  
  if (text) {
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `bold ${size || 32}px ${font || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);
  }
  
  return canvas;
}

export default function EditorModule() {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshMapRef = useRef({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseVec = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0,1,0), 0));
  const isDragging = useRef(false);
  const isOrbiting = useRef(false);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const orb = useRef({ theta: 0.7, phi: 1.0, radius: 12, lastX: 0, lastY: 0 });
  const animRef = useRef(null);
  const dragStartPt = useRef(new THREE.Vector3());
  const startPositions = useRef({});
  const hasDragged = useRef(false);
  const targetRadiusRef = useRef(12);
  const targetCameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetThetaRef = useRef(0.7);
  const targetPhiRef = useRef(1.0);
  const [showPublish, setShowPublish] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [marqueeBox, setMarqueeBox] = useState(null);
  const isMarqueeSelecting = useRef(false);
  const marqueeStartPos = useRef({ x: 0, y: 0 });
  const [fixCamera, setFixCamera] = useState(false);
  const [showCameraHelp, setShowCameraHelp] = useState(true);
  const isPanning = useRef(false);
  const panLastX = useRef(0);
  const panLastY = useRef(0);
  const arrowKeysPressed = useRef({ ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false });
  const perspCameraRef = useRef(null);
  const orthoCameraRef = useRef(null);
  const [isOrtho, setIsOrtho] = useState(false);

  useEffect(() => {
    cameraRef.current = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
  }, [isOrtho]);

  const {
    editorObjects, selectedObjectId, selectedObjectIds, editorTool,
    addObject, deleteObjects, duplicateObjects, selectObject, selectObjects,
    updateObjectProp, updateObjectsProp, setEditorTool, publishToCity, clearScene,
    undo, pushUndoAction, carveSelectedObjects, uncarveSelectedObject,
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
    renderer.setClearColor(0xdbeafe);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    perspCameraRef.current = camera;

    const orthoCamera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
    orthoCameraRef.current = orthoCamera;

    cameraRef.current = isOrtho ? orthoCamera : camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfffbf0, 1.35);
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
    const fill = new THREE.DirectionalLight(0xa5cbf7, 0.4);
    fill.position.set(-8, 5, -8);
    scene.add(fill);
    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x8bc34a, 0.45));

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x6e8e5e, roughness: 0.95, metalness: 0.0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = '__ground';
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(40, 40, 0x5e7e4e, 0x688d57);
    grid.position.y = 0.001;
    scene.add(grid);

    // Small axis indicator in corner
    const axesHelper = new THREE.AxesHelper(1.5);
    axesHelper.position.set(-14, 0.01, -14);
    scene.add(axesHelper);

    updateCameraPos();

    let lastTime = performance.now();
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      
      // Key-based camera panning
      const { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } = arrowKeysPressed.current;
      if ((ArrowLeft || ArrowRight || ArrowUp || ArrowDown) && cameraRef.current) {
        let vHeight;
        if (isOrtho && orthoCameraRef.current) {
          vHeight = orthoCameraRef.current.top - orthoCameraRef.current.bottom;
        } else {
          const dist = cameraRef.current.position.distanceTo(cameraTarget.current);
          const fovRad = (cameraRef.current.fov * Math.PI) / 180;
          vHeight = 2 * dist * Math.tan(fovRad / 2);
        }
        
        const speed = Math.max(2, Math.min(40, vHeight * 0.75));
        const step = speed * dt;
        
        const camRight = new THREE.Vector3();
        const camUp = new THREE.Vector3();
        const camForward = new THREE.Vector3();
        cameraRef.current.matrix.extractBasis(camRight, camUp, camForward);
        
        camRight.y = 0;
        camRight.normalize();
        
        const forwardXZ = new THREE.Vector3(-camForward.x, 0, -camForward.z);
        forwardXZ.normalize();
        
        const translation = new THREE.Vector3();
        if (ArrowLeft)  translation.addScaledVector(camRight, -step);
        if (ArrowRight) translation.addScaledVector(camRight, step);
        if (ArrowUp)    translation.addScaledVector(forwardXZ, step);
        if (ArrowDown)  translation.addScaledVector(forwardXZ, -step);
        
        if (translation.lengthSq() > 0) {
          targetCameraTargetRef.current.add(translation);
          targetCameraTargetRef.current.x = Math.max(-20, Math.min(20, targetCameraTargetRef.current.x));
          targetCameraTargetRef.current.z = Math.max(-20, Math.min(20, targetCameraTargetRef.current.z));
          targetCameraTargetRef.current.y = Math.max(0, Math.min(15, targetCameraTargetRef.current.y));
        }
      }
      
      let hasChanged = false;
      const currentTarget = cameraTarget.current;
      const targetTarget = targetCameraTargetRef.current;
      
      const lerpFactor = 1 - Math.exp(-8 * dt);
      
      if (currentTarget.distanceToSquared(targetTarget) > 0.0001) {
        currentTarget.lerp(targetTarget, lerpFactor);
        hasChanged = true;
      }
      
      const currentRadius = orb.current.radius;
      const targetRadius = targetRadiusRef.current;
      if (Math.abs(currentRadius - targetRadius) > 0.001) {
        orb.current.radius += (targetRadius - currentRadius) * lerpFactor;
        hasChanged = true;
      }
      
      const currentTheta = orb.current.theta;
      const targetTheta = targetThetaRef.current;
      let diffTheta = targetTheta - currentTheta;
      diffTheta = Math.atan2(Math.sin(diffTheta), Math.cos(diffTheta));
      if (Math.abs(diffTheta) > 0.001) {
        orb.current.theta += diffTheta * lerpFactor;
        if (orb.current.theta > Math.PI) orb.current.theta -= 2 * Math.PI;
        else if (orb.current.theta < -Math.PI) orb.current.theta += 2 * Math.PI;
        hasChanged = true;
      }
      
      const currentPhi = orb.current.phi;
      const targetPhi = targetPhiRef.current;
      if (Math.abs(currentPhi - targetPhi) > 0.001) {
        orb.current.phi += (targetPhi - currentPhi) * lerpFactor;
        hasChanged = true;
      }
      
      if (hasChanged) {
        updateCameraPos();
      }
      
      if (cameraRef.current) {
        renderer.render(scene, cameraRef.current);
      }
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H);
      const aspect = W / H;
      if (perspCameraRef.current) {
        perspCameraRef.current.aspect = aspect;
        perspCameraRef.current.updateProjectionMatrix();
      }
      updateCameraPos();
    };
    const handleGlobalKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const hasSelection = useStore.getState().selectedObjectId;
        if (hasSelection && !e.shiftKey) {
          return;
        }
        e.preventDefault();
        arrowKeysPressed.current[e.key] = true;
      }
    };

    const handleGlobalKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        arrowKeysPressed.current[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
      window.removeEventListener('resize', onResize);
      
      // Clean up meshes
      Object.values(meshMapRef.current).forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        clearMeshMaterials(mesh);
      });
      meshMapRef.current = {};
      
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        clearMeshMaterials(mesh);
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
        const initialGeom = obj.geometry === 'csg' ? new THREE.BufferGeometry() : getGeo(obj.geometry);
        const mesh = new THREE.Mesh(initialGeom, mat);
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
      
      if (obj.geometry === 'csg') {
        const csgKey = getCSGKey(obj);
        if (!mesh.userData.csgKey || mesh.userData.csgKey !== csgKey) {
          // Clean up old custom geometry
          if (mesh.geometry && mesh.geometry !== GEO[obj.geometry]) {
            mesh.geometry.dispose();
          }
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }

          const { geometry, materials } = buildCSGGeometry(obj);
          mesh.geometry = geometry;
          mesh.material = materials;
          mesh.userData.csgKey = csgKey;
          mesh.userData.textureKey = 'csg_rendered';
        }
      } else {
        const hasText = !!obj.text;
        const textSurfacesStr = (obj.textSurfaces || []).join(',');
        const textureKey = `${obj.color}_${obj.text}_${obj.textColor}_${obj.textFont}_${obj.textSize}_${textSurfacesStr}_${obj.geometry}_${obj.isSubtractive}`;
        
        if (!mesh.userData.textureKey || mesh.userData.textureKey !== textureKey) {
          clearMeshMaterials(mesh);
          
          if (obj.isSubtractive) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0xef4444,
              roughness: 0.8,
              metalness: 0.1,
              transparent: true,
              opacity: 0.45,
              emissive: 0xff0000,
              emissiveIntensity: 0.25,
              side: THREE.DoubleSide
            });
          } else if (hasText) {
            const canvas = createTextCanvas(obj.color, obj.text, obj.textColor, obj.textFont, obj.textSize);
            const texture = new THREE.CanvasTexture(canvas);
            const faces = SHAPE_FACES[obj.geometry];
            
            if (faces) {
              const textSurfaces = obj.textSurfaces || [];
              const materials = faces.map(faceName => {
                const hasFaceText = textSurfaces.length === 0 || textSurfaces.includes(faceName);
                return new THREE.MeshStandardMaterial({
                  color: hasFaceText ? 0xffffff : obj.color,
                  map: hasFaceText ? texture : null,
                  roughness: 0.65,
                  metalness: 0.08
                });
              });
              mesh.material = materials;
            } else {
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: texture,
                roughness: 0.65,
                metalness: 0.08
              });
            }
          } else {
            mesh.material = new THREE.MeshStandardMaterial({
              color: obj.color,
              roughness: 0.65,
              metalness: 0.08
            });
          }
          mesh.userData.textureKey = textureKey;
        }
      }
      
      const sel = selectedObjectIds.includes(id);
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          mat.emissive.set(sel ? 0x4ECDC4 : 0x000000);
          mat.emissiveIntensity = sel ? 0.28 : 0;
        });
      } else if (mesh.material) {
        mesh.material.emissive.set(sel ? 0x4ECDC4 : 0x000000);
        mesh.material.emissiveIntensity = sel ? 0.28 : 0;
      }
    }
  }, [editorObjects, selectedObjectId, selectedObjectIds]);

  const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));

  const getSpawnOffset = useCallback(() => {
    if (cameraRef.current) {
      const target = cameraTarget.current;
      const toCamera = new THREE.Vector3().subVectors(cameraRef.current.position, target);
      toCamera.y = 0;
      if (toCamera.lengthSq() > 0.1) {
        toCamera.normalize();
        const pos = new THREE.Vector3().addVectors(target, toCamera.multiplyScalar(2.0));
        return {
          x: Math.max(-20, Math.min(20, parseFloat(pos.x.toFixed(2)))),
          y: 0,
          z: Math.max(-20, Math.min(20, parseFloat(pos.z.toFixed(2))))
        };
      }
    }
    return { x: 0, y: 0, z: 0 };
  }, []);

  const handleAddObject = useCallback((geometry) => {
    let spawnPos = null;
    if (cameraRef.current) {
      const target = cameraTarget.current;
      const toCamera = new THREE.Vector3().subVectors(cameraRef.current.position, target);
      toCamera.y = 0;
      if (toCamera.lengthSq() > 0.1) {
        toCamera.normalize();
        const pos = new THREE.Vector3().addVectors(target, toCamera.multiplyScalar(2.0));
        spawnPos = {
          x: Math.max(-20, Math.min(20, parseFloat(pos.x.toFixed(2)))),
          y: 0.5,
          z: Math.max(-20, Math.min(20, parseFloat(pos.z.toFixed(2))))
        };
      }
    }
    addObject(geometry, spawnPos);
  }, [addObject]);

  const updateCameraPos = useCallback(() => {
    const { theta, phi, radius } = orb.current;
    const target = cameraTarget.current;
    const x = target.x + radius * Math.sin(phi) * Math.cos(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.sin(theta);
    
    if (perspCameraRef.current) {
      perspCameraRef.current.position.set(x, y, z);
      perspCameraRef.current.lookAt(target);
    }
    if (orthoCameraRef.current) {
      orthoCameraRef.current.position.set(x, y, z);
      orthoCameraRef.current.lookAt(target);
      
      const aspect = perspCameraRef.current ? perspCameraRef.current.aspect : 1.2;
      const fovRad = (55 * Math.PI) / 180;
      const halfHeight = radius * Math.tan(fovRad / 2);
      const halfWidth = halfHeight * aspect;
      
      orthoCameraRef.current.left = -halfWidth;
      orthoCameraRef.current.right = halfWidth;
      orthoCameraRef.current.top = halfHeight;
      orthoCameraRef.current.bottom = -halfHeight;
      orthoCameraRef.current.updateProjectionMatrix();
    }
  }, []);


  // Automatic camera target snapping removed to comply with standard 3D viewport navigation

  function canvasMouse(e) {
    const rect = mountRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }

  function projectPointToClient(pos) {
    if (!cameraRef.current || !mountRef.current) return { x: 0, y: 0 };
    const tempV = new THREE.Vector3(pos.x, pos.y, pos.z);
    tempV.project(cameraRef.current);
    const rect = mountRef.current.getBoundingClientRect();
    const x = (tempV.x * 0.5 + 0.5) * rect.width;
    const y = (-tempV.y * 0.5 + 0.5) * rect.height;
    return { x, y };
  }

  function onMouseDown(e) {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };

    if (e.shiftKey && (e.button === 0 || e.button === 1 || e.button === 2)) {
      isPanning.current = true;
      panLastX.current = e.clientX;
      panLastY.current = e.clientY;
      return;
    }

    if (e.button === 2 || e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && fixCamera)) {
      isOrbiting.current = true;
      orb.current.lastX = e.clientX;
      orb.current.lastY = e.clientY;
      targetThetaRef.current = orb.current.theta;
      targetPhiRef.current = orb.current.phi;
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
        const hitId = hit.object.name;

        // Selection update
        if (e.ctrlKey) {
          selectObject(hitId, true);
        } else {
          if (!selectedObjectIds.includes(hitId)) {
            selectObject(hitId, false);
          }
        }

        isDragging.current = true;
        hasDragged.current = false;
        dragPlane.current.setFromNormalAndCoplanarPoint(new THREE.Vector3(0,1,0), hit.point);
        const pt = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(dragPlane.current, pt);
        dragStartPt.current.copy(pt);

        // Get active selection list synchronously to avoid state lag
        let activeIds = [...selectedObjectIds];
        if (e.ctrlKey) {
          if (activeIds.includes(hitId)) {
            activeIds = activeIds.filter(x => x !== hitId);
          } else {
            activeIds.push(hitId);
          }
        } else {
          if (!activeIds.includes(hitId)) {
            activeIds = [hitId];
          }
        }

        startPositions.current = {};
        activeIds.forEach(id => {
          const obj = editorObjects[id];
          if (obj) {
            startPositions.current[id] = { ...obj.position };
          }
        });
      } else {
        // Start marquee select
        const rect = mountRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        setMarqueeBox({ start: { x: clientX, y: clientY }, end: { x: clientX, y: clientY } });
        isMarqueeSelecting.current = true;
        marqueeStartPos.current = { x: clientX, y: clientY };

        if (!e.ctrlKey && !e.shiftKey) {
          selectObject(null, false);
        }
      }
    }
  }

  function onMouseMove(e) {
    if (isPanning.current) {
      const W = mountRef.current.clientWidth || 600;
      const H = mountRef.current.clientHeight || 500;
      const target = cameraTarget.current;
      
      let vWidth, vHeight;
      if (isOrtho && orthoCameraRef.current) {
        vWidth = orthoCameraRef.current.right - orthoCameraRef.current.left;
        vHeight = orthoCameraRef.current.top - orthoCameraRef.current.bottom;
      } else if (cameraRef.current) {
        const dist = cameraRef.current.position.distanceTo(target);
        const fovRad = (cameraRef.current.fov * Math.PI) / 180;
        vHeight = 2 * dist * Math.tan(fovRad / 2);
        vWidth = vHeight * cameraRef.current.aspect;
      } else {
        vWidth = 10;
        vHeight = 10;
      }
      
      const dx = e.clientX - panLastX.current;
      const dy = e.clientY - panLastY.current;
      panLastX.current = e.clientX;
      panLastY.current = e.clientY;
      
      const worldX = (dx / W) * vWidth;
      const worldY = (dy / H) * vHeight;
      
      const camRight = new THREE.Vector3();
      const camUp = new THREE.Vector3();
      if (cameraRef.current) {
        cameraRef.current.matrix.extractBasis(camRight, camUp, new THREE.Vector3());
      }
      
      const translation = new THREE.Vector3()
        .addScaledVector(camRight, -worldX)
        .addScaledVector(camUp, worldY);
        
      const oldTarget = cameraTarget.current.clone();
      cameraTarget.current.add(translation);
      cameraTarget.current.x = Math.max(-20, Math.min(20, cameraTarget.current.x));
      cameraTarget.current.z = Math.max(-20, Math.min(20, cameraTarget.current.z));
      cameraTarget.current.y = Math.max(0, Math.min(15, cameraTarget.current.y));
      
      targetCameraTargetRef.current.copy(cameraTarget.current);
      
      const actualTranslation = new THREE.Vector3().subVectors(cameraTarget.current, oldTarget);
      
      if (perspCameraRef.current) {
        perspCameraRef.current.position.add(actualTranslation);
      }
      if (orthoCameraRef.current) {
        orthoCameraRef.current.position.add(actualTranslation);
      }
      if (cameraRef.current) {
        cameraRef.current.lookAt(cameraTarget.current);
      }
      return;
    }
    if (isMarqueeSelecting.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      setMarqueeBox(box => box ? { ...box, end: { x: clientX, y: clientY } } : null);
      return;
    }
    if (isOrbiting.current) {
      const dx = e.clientX - orb.current.lastX;
      const dy = e.clientY - orb.current.lastY;
      orb.current.lastX = e.clientX;
      orb.current.lastY = e.clientY;
      
      // Slower rotation speed
      targetThetaRef.current -= dx * 0.005;
      targetPhiRef.current = Math.max(0.08, Math.min(Math.PI - 0.08, targetPhiRef.current - dy * 0.005));
      return;
    }
    if (isDragging.current && selectedObjectIds.length > 0) {
      const m = canvasMouse(e);
      mouseVec.current.set(m.x, m.y);
      raycasterRef.current.setFromCamera(mouseVec.current, cameraRef.current);
      const pt = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(dragPlane.current, pt)) {
        const deltaX = pt.x - dragStartPt.current.x;
        const deltaZ = pt.z - dragStartPt.current.z;

        if (!hasDragged.current) {
          hasDragged.current = true;
          pushUndoAction({ type: 'MOVE_GROUP', positions: { ...startPositions.current } });
        }

        // Clamp the drag delta to keep all objects inside the [-20, 20] plane bounds
        let minStartX = Infinity, maxStartX = -Infinity;
        let minStartZ = Infinity, maxStartZ = -Infinity;
        Object.values(startPositions.current).forEach(pos => {
          if (pos.x < minStartX) minStartX = pos.x;
          if (pos.x > maxStartX) maxStartX = pos.x;
          if (pos.z < minStartZ) minStartZ = pos.z;
          if (pos.z > maxStartZ) maxStartZ = pos.z;
        });

        const clampedDeltaX = Math.max(-20 - minStartX, Math.min(20 - maxStartX, deltaX));
        const clampedDeltaZ = Math.max(-20 - minStartZ, Math.min(20 - maxStartZ, deltaZ));

        Object.entries(startPositions.current).forEach(([id, startPos]) => {
          const cur = editorObjects[id];
          if (cur) {
            const nextPos = {
              x: +(startPos.x + clampedDeltaX).toFixed(2),
              y: startPos.y,
              z: +(startPos.z + clampedDeltaZ).toFixed(2)
            };
            updateObjectProp(id, 'position', nextPos);
          }
        });
      }
    }
  }

  function onMouseUp(e) {
    if (isMarqueeSelecting.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const minX = Math.min(marqueeStartPos.current.x, clientX);
      const maxX = Math.max(marqueeStartPos.current.x, clientX);
      const minY = Math.min(marqueeStartPos.current.y, clientY);
      const maxY = Math.max(marqueeStartPos.current.y, clientY);

      if (maxX - minX > 3 && maxY - minY > 3) {
        const matchingIds = [];
        Object.entries(editorObjects).forEach(([id, obj]) => {
          if (obj && obj.position) {
            const clientPos = projectPointToClient(obj.position);
            if (clientPos.x >= minX && clientPos.x <= maxX && clientPos.y >= minY && clientPos.y <= maxY) {
              matchingIds.push(id);
            }
          }
        });
        selectObjects(matchingIds, e.ctrlKey || e.shiftKey);
      }
      isMarqueeSelecting.current = false;
      setMarqueeBox(null);
    }
    isDragging.current = false;
    isOrbiting.current = false;
    isPanning.current = false;
  }

  function onWheel(e) {
    e.preventDefault();
    if (!cameraRef.current || !mountRef.current) return;

    const m = canvasMouse(e);
    mouseVec.current.set(m.x, m.y);
    raycasterRef.current.setFromCamera(mouseVec.current, cameraRef.current);
    const meshes = Object.values(meshMapRef.current);
    const hits = raycasterRef.current.intersectObjects(meshes);

    let zoomCenter = new THREE.Vector3();
    if (hits.length) {
      zoomCenter.copy(hits[0].point);
    } else {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      if (raycasterRef.current.ray.intersectPlane(groundPlane, intersectPoint)) {
        zoomCenter.copy(intersectPoint);
      } else {
        zoomCenter.copy(targetCameraTargetRef.current);
      }
    }

    let delta = e.deltaY;
    if (e.deltaMode === 1) {
      delta *= 16;
    } else if (e.deltaMode === 2) {
      delta *= 800;
    }

    const zoomSpeed = 0.0006;
    const f = Math.exp(delta * zoomSpeed);
    const nextRadius = targetRadiusRef.current * f;
    const clampedRadius = Math.max(1.0, Math.min(100.0, nextRadius));
    if (clampedRadius === targetRadiusRef.current) return;

    const fActual = clampedRadius / targetRadiusRef.current;
    targetRadiusRef.current = clampedRadius;

    targetCameraTargetRef.current.copy(zoomCenter).sub(new THREE.Vector3().subVectors(zoomCenter, targetCameraTargetRef.current).multiplyScalar(fActual));
    targetCameraTargetRef.current.x = Math.max(-20, Math.min(20, targetCameraTargetRef.current.x));
    targetCameraTargetRef.current.z = Math.max(-20, Math.min(20, targetCameraTargetRef.current.z));
    targetCameraTargetRef.current.y = Math.max(0, Math.min(15, targetCameraTargetRef.current.y));
  }

  function onDoubleClick(e) {
    if (e.button === 0) {
      const m = canvasMouse(e);
      mouseVec.current.set(m.x, m.y);
      raycasterRef.current.setFromCamera(mouseVec.current, cameraRef.current);
      const meshes = Object.values(meshMapRef.current);
      const hits = raycasterRef.current.intersectObjects(meshes);
      if (hits.length) {
        const hit = hits[0];
        const hitId = hit.object.name;
        const obj = editorObjects[hitId];
        if (obj && obj.position) {
          targetCameraTargetRef.current.set(obj.position.x, obj.position.y, obj.position.z);
          targetCameraTargetRef.current.x = Math.max(-20, Math.min(20, targetCameraTargetRef.current.x));
          targetCameraTargetRef.current.z = Math.max(-20, Math.min(20, targetCameraTargetRef.current.z));
          targetCameraTargetRef.current.y = Math.max(0, Math.min(15, targetCameraTargetRef.current.y));
          targetRadiusRef.current = 8.0;
        }
      }
    }
  }

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      carveSelectedObjects();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selectObjects(Object.keys(editorObjects), false);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if (e.key === 'f' || e.key === 'F') {
      const activeId = selectedObjectId || (selectedObjectIds.length > 0 ? selectedObjectIds[0] : null);
      if (activeId) {
        const obj = editorObjects[activeId];
        if (obj && obj.position) {
          targetCameraTargetRef.current.set(obj.position.x, obj.position.y, obj.position.z);
          targetCameraTargetRef.current.x = Math.max(-20, Math.min(20, targetCameraTargetRef.current.x));
          targetCameraTargetRef.current.z = Math.max(-20, Math.min(20, targetCameraTargetRef.current.z));
          targetCameraTargetRef.current.y = Math.max(0, Math.min(15, targetCameraTargetRef.current.y));
          targetRadiusRef.current = 8.0;
        }
      }
      return;
    }
    if (e.key === '5') {
      e.preventDefault();
      setIsOrtho(prev => !prev);
      return;
    }
    if (e.key === '1') {
      e.preventDefault();
      setIsOrtho(true);
      targetPhiRef.current = Math.PI / 2 - 0.04;
      targetThetaRef.current = e.ctrlKey ? Math.PI / 2 : -Math.PI / 2;
      return;
    }
    if (e.key === '3') {
      e.preventDefault();
      setIsOrtho(true);
      targetPhiRef.current = Math.PI / 2 - 0.04;
      targetThetaRef.current = e.ctrlKey ? Math.PI : 0;
      return;
    }
    if (e.key === '7') {
      e.preventDefault();
      setIsOrtho(true);
      targetPhiRef.current = e.ctrlKey ? Math.PI - 0.08 : 0.08;
      targetThetaRef.current = -Math.PI / 2;
      return;
    }
    if (!selectedObjectId) return;
    const obj = editorObjects[selectedObjectId];
    if (!obj) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && e.shiftKey) {
      return; // Let global window keydown handler pan camera instead
    }
    const S = 0.25, R = 0.15, SF = 1.12;
    e.preventDefault();
    if (e.key === 'Delete' || e.key === 'Backspace') { deleteObjects(selectedObjectIds); return; }
    if (e.key === 'd' && (e.metaKey || e.ctrlKey)) { duplicateObjects(selectedObjectIds); return; }
    const pos = { ...obj.position };
    const rot = { ...obj.rotation };
    const scl = { ...obj.scale };
    if (e.key === 'ArrowLeft' && !e.shiftKey)  updateObjectProp(selectedObjectId, 'position', { ...pos, x: Math.max(-20, Math.min(20, pos.x - S)) });
    if (e.key === 'ArrowRight' && !e.shiftKey) updateObjectProp(selectedObjectId, 'position', { ...pos, x: Math.max(-20, Math.min(20, pos.x + S)) });
    if (e.key === 'ArrowUp' && !e.shiftKey)    updateObjectProp(selectedObjectId, 'position', { ...pos, z: Math.max(-20, Math.min(20, pos.z - S)) });
    if (e.key === 'ArrowDown' && !e.shiftKey)  updateObjectProp(selectedObjectId, 'position', { ...pos, z: Math.max(-20, Math.min(20, pos.z + S)) });
    if (e.key === 'q') updateObjectProp(selectedObjectId, 'rotation', { ...rot, y: rot.y - R });
    if (e.key === 'e') updateObjectProp(selectedObjectId, 'rotation', { ...rot, y: rot.y + R });
    if (e.key === 'r' || e.key === 'R') updateObjectProp(selectedObjectId, 'position', { ...pos, y: pos.y + S });
    if (e.key === 'v' || e.key === 'V') updateObjectProp(selectedObjectId, 'position', { ...pos, y: Math.max(0.01, pos.y - S) });
    if (e.key === 'w') { const s = +(scl.x * SF).toFixed(3); updateObjectProp(selectedObjectId, 'scale', { x:s,y:s,z:s }); }
    if (e.key === 's') { const s = +(scl.x / SF).toFixed(3); updateObjectProp(selectedObjectId, 'scale', { x:s,y:s,z:s }); }
  }

  const objList = Object.values(editorObjects);
  const selected = selectedObjectId ? editorObjects[selectedObjectId] : null;

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden', outline:'none' }} tabIndex={0} onKeyDown={onKeyDown}>

      {/* ── Left panel ── */}
      <div className="side-panel">
        <div className="panel-section">
          <div className="panel-label">Add Geometry</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
            {GEOMETRY_LIST.map(g => (
              <button key={g.id} className="btn sm" onClick={() => handleAddObject(g.id)} style={{ justifyContent:'center', fontSize:11 }}>
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

        <div className="panel-section">
          <div className="panel-label">Camera Settings</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <button
              className={`tool-btn ${fixCamera ? 'active' : ''}`}
              onClick={() => setFixCamera(!fixCamera)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>{fixCamera ? '🔒' : '🔓'}</span>
              {fixCamera ? 'Camera: Fixed' : 'Camera: Free'}
              <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>Revolve only</span>
            </button>
            <button
              className={`tool-btn ${isOrtho ? 'active' : ''}`}
              onClick={() => setIsOrtho(!isOrtho)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>📐</span>
              {isOrtho ? 'Orthographic' : 'Perspective'}
              <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>Press 5</span>
            </button>
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
            <div key={obj.id} className={`obj-item ${selectedObjectIds.includes(obj.id)?'selected':''}`} onClick={(e) => selectObject(obj.id, e.ctrlKey)}>
              <div className="obj-dot" style={{ background: obj.isSubtractive ? '#ef4444' : obj.color, border: obj.isSubtractive ? '1px dashed #ff8888' : 'none' }} />
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:11, color: obj.isSubtractive ? '#ff8888' : 'inherit' }}>
                {obj.name} {obj.isSubtractive && ' 🕳️'}
              </span>
              <span style={{ fontSize:10, opacity:0.35 }}>{obj.geometry === 'csg' ? 'carved' : obj.geometry}</span>
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
              {selectedObjectIds.length >= 2 && (
                <button
                  className="btn sm"
                  style={{ justifyContent:'center', background: 'var(--accent)', color: '#fff' }}
                  onClick={carveSelectedObjects}
                >
                  🪓 Carve / Group (Ctrl+G)
                </button>
              )}
              {selectedObjectIds.length === 1 && selected.geometry === 'csg' && (
                <button
                  className="btn sm"
                  style={{ justifyContent:'center', background: 'rgba(78, 205, 196, 0.2)', color: '#4ECDC4', border: '1px solid #4ECDC4' }}
                  onClick={uncarveSelectedObject}
                >
                  🔓 Uncarve / Ungroup
                </button>
              )}
              <button className="btn sm" style={{ justifyContent:'center' }} onClick={() => duplicateObjects(selectedObjectIds)}>⧉ Duplicate</button>
              <button className="btn sm danger" style={{ justifyContent:'center' }} onClick={() => deleteObjects(selectedObjectIds)}>🗑 Delete</button>
            </>
          )}
          <button className="btn sm" style={{ justifyContent:'center' }} onClick={undo}>↩ Undo (⌘Z)</button>
          <button
            className="btn primary"
            style={{ justifyContent:'center' }}
            onClick={() => setShowPublish(true)}
            disabled={selectedObjectIds.length === 0}
            title={selectedObjectIds.length === 0 ? "Select one or more objects to publish" : ""}
          >
            ↑ Publish Selected ({selectedObjectIds.length})
          </button>
        </div>
      </div>

      <div
        ref={mountRef}
        style={{ flex:1, position:'relative', overflow:'hidden', cursor: isOrbiting.current ? 'grabbing' : editorTool==='move' ? 'grab' : 'default' }}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
      >
        {/* HUD hints */}
        <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', background:'rgba(255,255,255,0.92)', border:'1px solid var(--border2)', borderRadius:6, padding:'4px 14px', fontSize:11, color:'var(--text2)', pointerEvents:'none', whiteSpace:'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          RMB / Alt+drag: orbit · Scroll: zoom · Arrow keys: move · Q/E: rotate · W/S: scale · R/V: up/down · F: focus · Del: delete
        </div>
        {/* Object count badge */}
        <div style={{ position:'absolute', top:10, left:10, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 10px', fontSize:11, color:'var(--text2)' }}>
          {objList.length} object{objList.length!==1?'s':''}
        </div>
        {/* Camera guide floating help section */}
        {showCameraHelp ? (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 10, padding: '12px 16px', width: 240,
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)', zIndex: 100,
            fontSize: 12, color: 'var(--text)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontWeight: 700 }}>
              <span style={{ fontSize: 13 }}>🎥 Camera Navigation</span>
              <button onClick={() => setShowCameraHelp(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5 }}>
              <div><strong>Orbit:</strong> RMB / Alt + Drag</div>
              <div><strong>Pan:</strong> Shift + Left/RMB Drag</div>
              <div><strong>Zoom to Cursor:</strong> Scroll Wheel</div>
              <div><strong>Focus Object:</strong> Select shape & press <code>F</code></div>
              <div><strong>Snap Axis:</strong> <code>1</code> (Front), <code>3</code> (Right), <code>7</code> (Top) <span style={{ opacity: 0.6 }}>(Ctrl for reverse)</span></div>
              <div><strong>Persp/Ortho:</strong> Press <code>5</code> to toggle</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCameraHelp(true)}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'var(--bg2)', border: '1px solid var(--border2)',
              borderRadius: 6, padding: '5px 12px', fontSize: 11,
              cursor: 'pointer', color: 'var(--text2)', zIndex: 100,
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <span>❓ Navigation Guide</span>
          </button>
        )}
        {/* Marquee select box overlay */}
        {marqueeBox && (
          <div style={{
            position: 'absolute',
            left: Math.min(marqueeBox.start.x, marqueeBox.end.x),
            top: Math.min(marqueeBox.start.y, marqueeBox.end.y),
            width: Math.abs(marqueeBox.end.x - marqueeBox.start.x),
            height: Math.abs(marqueeBox.end.y - marqueeBox.start.y),
            border: '1.5px dashed var(--accent)',
            background: 'rgba(37, 99, 235, 0.08)',
            pointerEvents: 'none',
            zIndex: 10,
          }} />
        )}
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
                <SmoothColorPicker value={selected.color}
                  onChange={e => {
                    const color = e.target.value;
                    if (selectedObjectIds.length > 1) {
                      updateObjectsProp(selectedObjectIds, 'color', color);
                    } else {
                      updateObjectProp(selectedObjectId, 'color', color);
                    }
                  }}
                  style={{ width:32, height:28, border:'none', borderRadius:4, cursor:'pointer', background:'transparent', padding:0 }} />
                <input className="form-input" value={selected.color}
                  onChange={e => {
                    const color = e.target.value;
                    if (selectedObjectIds.length > 1) {
                      updateObjectsProp(selectedObjectIds, 'color', color);
                    } else {
                      updateObjectProp(selectedObjectId, 'color', color);
                    }
                  }}
                  style={{ fontFamily:'monospace', fontSize:11 }} />
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F7DC6F','#C8A028','#378ADD','#E24B4A','#fff','#888'].map(c => (
                  <div key={c} onClick={() => {
                    if (selectedObjectIds.length > 1) {
                      updateObjectsProp(selectedObjectIds, 'color', c);
                    } else {
                      updateObjectProp(selectedObjectId, 'color', c);
                    }
                  }}
                    style={{ width:20, height:20, borderRadius:3, background:c, cursor:'pointer', border:selected.color===c?'2px solid var(--accent)':'1px solid rgba(255,255,255,0.15)', flexShrink:0 }} />
                ))}
              </div>
            </div>

            {selected.geometry !== 'csg' && (
              <div className="panel-section">
                <div className="panel-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Subtractive (Cutter) 🕳️</span>
                  <input
                    type="checkbox"
                    checked={!!selected.isSubtractive}
                    onChange={(e) => {
                      const val = e.target.checked;
                      if (selectedObjectIds.length > 1) {
                        updateObjectsProp(selectedObjectIds, 'isSubtractive', val);
                      } else {
                        updateObjectProp(selectedObjectId, 'isSubtractive', val);
                      }
                    }}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, lineHeight: 1.4 }}>
                  Subtractive shapes carve space out of other Solid shapes when merged.
                </div>
              </div>
            )}

            <div className="panel-section">
              <div className="panel-label">Text Overlay</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div>
                  <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Text Content</label>
                  <input className="form-input" value={selected.text || ''} placeholder="Type text to display..."
                    onChange={e => updateObjectProp(selectedObjectId, 'text', e.target.value)} />
                </div>
                
                {selected.text && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Text Color</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <SmoothColorPicker value={selected.textColor || '#ffffff'}
                            onChange={e => updateObjectProp(selectedObjectId, 'textColor', e.target.value)}
                            style={{ width: 28, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
                          <input className="form-input" value={selected.textColor || '#ffffff'}
                            onChange={e => updateObjectProp(selectedObjectId, 'textColor', e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: 10, padding: '3px 4px', width: '100%' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Font Size</label>
                        <input className="form-input" type="number" min={12} max={100} value={selected.textSize || 32}
                          onChange={e => {
                            const size = parseInt(e.target.value);
                            if (!isNaN(size)) {
                              updateObjectProp(selectedObjectId, 'textSize', size);
                            }
                          }}
                          style={{ fontSize: 11, padding: '3px 4px' }} />
                      </div>
                    </div>

                    {/* Surface Selection */}
                    {SHAPE_FACES[selected.geometry] && (
                      <div style={{ marginTop: 4, marginBottom: 4 }}>
                        <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:4 }}>
                          Target Surfaces (None = All)
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {SHAPE_FACES[selected.geometry].map(faceName => {
                            const activeSurfaces = selected.textSurfaces || [];
                            const isSelected = activeSurfaces.includes(faceName);
                            return (
                              <button
                                key={faceName}
                                onClick={() => {
                                  const nextSurfaces = isSelected
                                    ? activeSurfaces.filter(f => f !== faceName)
                                    : [...activeSurfaces, faceName];
                                  updateObjectProp(selectedObjectId, 'textSurfaces', nextSurfaces);
                                }}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  border: '1px solid var(--border)',
                                  background: isSelected ? 'var(--accent)' : 'var(--bg3)',
                                  color: isSelected ? '#fff' : 'var(--text2)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {faceName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize:10, color:'var(--text3)', display:'block', marginBottom:3 }}>Font Family</label>
                      <select className="form-input" value={selected.textFont || 'sans-serif'}
                        onChange={e => updateObjectProp(selectedObjectId, 'textFont', e.target.value)}
                        style={{ width: '100%', fontSize: 11, height: 26, padding: '2px 4px' }}>
                        <option value="sans-serif">Sans-serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="cursive">Cursive</option>
                        <option value="Impact">Impact</option>
                      </select>
                    </div>
                  </>
                )}
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
              R / V → move up / down<br />
              Q / E → rotate Y<br />
              W / S → scale ±<br />
              F → focus selection<br />
              Del → delete<br />
              ⌘A → select all<br />
              ⌘D → duplicate<br />
              ⌘Z → undo
            </div>
          </div>
        )}
      </div>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} onPublish={name => { publishToCity(name); setShowPublish(false); }} count={selectedObjectIds.length} />}
      {showLibrary && <AssetLibrary onClose={() => setShowLibrary(false)} spawnOffset={getSpawnOffset()} />}
    </div>
  );
}

function PropSection({ title, obj, prop, fields, id, update, step, deg }) {
  return (
    <div className="panel-section">
      <div className="panel-label">{title}</div>
      {fields.map(f => {
        const raw = (obj[prop] && obj[prop][f] !== undefined) ? obj[prop][f] : (prop === 'scale' ? 1.0 : 0.0);
        const display = deg ? +(raw * 180 / Math.PI).toFixed(2) : +raw.toFixed(3);
        return (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:10, color:'var(--text3)', width:12, textAlign:'center', fontWeight:700, textTransform:'uppercase' }}>{f}</span>
            <input
              className="form-input"
              style={{ fontFamily:'monospace', fontSize:11, padding:'3px 6px' }}
              type="number" step={step || 0.1} value={display}
              onChange={e => {
                let v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                  if (prop === 'position' && (f === 'x' || f === 'z')) {
                    v = Math.max(-20, Math.min(20, v));
                  }
                  const currentPropVal = obj[prop] || (prop === 'scale' ? { x: 1, y: 1, z: 1 } : { x: 0, y: 0, z: 0 });
                  update(id, prop, { ...currentPropVal, [f]: deg ? v * Math.PI / 180 : v });
                }
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
