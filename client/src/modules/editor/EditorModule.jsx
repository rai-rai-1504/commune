import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SUBTRACTION, ADDITION, Evaluator, Brush } from 'three-bvh-csg';
import { useStore } from '../../store/useStore';
import AssetLibrary from '../../components/AssetLibrary';
import Icon from '../../components/Icon';

const CameraIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

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
  { id: 'box', label: 'Cube' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'cylinder', label: 'Cylinder' },
  { id: 'cone', label: 'Cone' },
  { id: 'torus', label: 'Torus' },
  { id: 'wedge', label: 'Wedge' },
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
  const [stackPrompt, setStackPrompt] = useState(null);
  const isMarqueeSelecting = useRef(false);
  const marqueeStartPos = useRef({ x: 0, y: 0 });
  const [fixCamera, setFixCamera] = useState(false);
  const [showCameraHelp, setShowCameraHelp] = useState(false); // camera help starts minimized (icon only) on default
  const [showObjectsList, setShowObjectsList] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState('transform');
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
    stackingObjectId, setStackingObjectId,
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
      mesh.userData.isSolid = !!obj.isSolid;
      mesh.userData.isStacked = !!obj.isStacked;
      
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
      const isGlowingPlatform = stackingObjectId && obj.isSolid && id !== stackingObjectId;
      const emissiveColor = isGlowingPlatform ? 0xffd700 : (sel ? 0x4ECDC4 : 0x000000);
      const emissiveIntensity = isGlowingPlatform ? 0.6 : (sel ? 0.28 : 0);

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          mat.emissive.set(emissiveColor);
          mat.emissiveIntensity = emissiveIntensity;
        });
      } else if (mesh.material) {
        mesh.material.emissive.set(emissiveColor);
        mesh.material.emissiveIntensity = emissiveIntensity;
      }
    }
  }, [editorObjects, selectedObjectId, selectedObjectIds, stackingObjectId]);

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

  const fitToBottomObject = useCallback((objectId) => {
    const obj = editorObjects[objectId];
    if (!obj) return;
    
    const meshesToHit = Object.values(meshMapRef.current).filter(m => m.name !== objectId && m.userData.isSolid);
    const downRay = new THREE.Raycaster(
      new THREE.Vector3(obj.position.x, obj.position.y + 0.1, obj.position.z),
      new THREE.Vector3(0, -1, 0)
    );
    const downHits = downRay.intersectObjects(meshesToHit);
    if (downHits.length > 0) {
      const baseMesh = downHits[0].object;
      const baseObjId = baseMesh.name;
      const baseObj = editorObjects[baseObjId];
      if (baseObj) {
        updateObjectProp(objectId, 'scale', { ...obj.scale, x: baseObj.scale.x, z: baseObj.scale.z });
      }
    }
  }, [editorObjects, updateObjectProp]);

  const handleTemplateDrop = useCallback((e) => {
    e.preventDefault();
    const geometry = e.dataTransfer.getData('text/plain');
    if (!geometry || !GEOMETRY_LIST.find(g => g.id === geometry)) return;

    if (!cameraRef.current || !mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const dropMouse = new THREE.Vector2(mouseX, mouseY);
    const dropRaycaster = new THREE.Raycaster();
    dropRaycaster.setFromCamera(dropMouse, cameraRef.current);

    const meshes = Object.values(meshMapRef.current);
    const hits = dropRaycaster.intersectObjects(meshes);
    let spawnPos = { x: 0, y: 0.5, z: 0 };
    if (hits.length > 0) {
      const hit = hits[0];
      spawnPos = {
        x: Math.max(-20, Math.min(20, parseFloat(hit.point.x.toFixed(2)))),
        y: parseFloat((hit.point.y + 0.5).toFixed(2)),
        z: Math.max(-20, Math.min(20, parseFloat(hit.point.z.toFixed(2))))
      };
    } else {
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const pt = new THREE.Vector3();
      if (dropRaycaster.ray.intersectPlane(groundPlane, pt)) {
        spawnPos = {
          x: Math.max(-20, Math.min(20, parseFloat(pt.x.toFixed(2)))),
          y: 0.5,
          z: Math.max(-20, Math.min(20, parseFloat(pt.z.toFixed(2))))
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
      if (stackingObjectId) {
        const m = canvasMouse(e);
        mouseVec.current.set(m.x, m.y);
        raycasterRef.current.setFromCamera(mouseVec.current, cameraRef.current);
        const meshes = Object.values(meshMapRef.current);
        const hits = raycasterRef.current.intersectObjects(meshes);
        if (hits.length) {
          const hit = hits[0];
          const hitId = hit.object.name;
          const targetObj = editorObjects[hitId];
          if (targetObj && targetObj.isSolid && hitId !== stackingObjectId) {
            const stackedCount = Object.values(editorObjects).filter(o => o.stackedOnObjectId === hitId).length;
            if (stackedCount >= 10) {
              alert("This platform cannot support more than 10 stacked objects!");
            } else {
              setStackPrompt({ childId: stackingObjectId, parentId: hitId });
            }
          }
        }
        setStackingObjectId(null);
        return;
      }

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

        const nextPositions = {};
        Object.entries(startPositions.current).forEach(([id, startPos]) => {
          const cur = editorObjects[id];
          if (cur) {
            let nextX = cur.lockX ? startPos.x : +(startPos.x + clampedDeltaX).toFixed(2);
            let nextZ = cur.lockZ ? startPos.z : +(startPos.z + clampedDeltaZ).toFixed(2);
            let nextY = startPos.y;

            if (!cur.lockY && cur.isSolid && cur.isStacked) {
              const meshesToHit = Object.values(meshMapRef.current).filter(m => m.name !== id && m.userData.isSolid);
              const downRay = new THREE.Raycaster(
                new THREE.Vector3(nextX, 50, nextZ),
                new THREE.Vector3(0, -1, 0)
              );
              const downHits = downRay.intersectObjects(meshesToHit);
              let targetSurfaceY = 0;
              if (downHits.length > 0) {
                targetSurfaceY = downHits[0].point.y;
              }

              const mesh = meshMapRef.current[id];
              let bottomOffset = 0.5 * cur.scale.y;
              if (mesh && mesh.geometry) {
                const geom = mesh.geometry;
                if (!geom.boundingBox) geom.computeBoundingBox();
                if (geom.boundingBox) {
                  bottomOffset = -geom.boundingBox.min.y * cur.scale.y;
                }
              }
              nextY = +(targetSurfaceY + bottomOffset).toFixed(2);
            }
            nextPositions[id] = { x: nextX, y: nextY, z: nextZ };
          }
        });

        // Temporarily apply positions to Three.js meshes for collision resolution
        Object.entries(nextPositions).forEach(([id, pos]) => {
          const mesh = meshMapRef.current[id];
          if (mesh) {
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.updateMatrixWorld(true);
          }
        });

        // Resolve collisions against all other solid objects in the scene
        const maxIterations = 5;
        let collided = true;
        for (let iter = 0; iter < maxIterations && collided; iter++) {
          collided = false;

          for (const id of Object.keys(nextPositions)) {
            const mesh = meshMapRef.current[id];
            if (!mesh) continue;

            const draggedBox = new THREE.Box3().setFromObject(mesh);
            
            const solidMeshes = Object.values(meshMapRef.current).filter(m => 
              m.name !== id && 
              !Object.keys(nextPositions).includes(m.name) && 
              m.userData.isSolid
            );

            for (const solidMesh of solidMeshes) {
              const solidBox = new THREE.Box3().setFromObject(solidMesh);
              if (draggedBox.intersectsBox(solidBox)) {
                collided = true;
                
                // Calculate overlap on X and Z axes
                const overlapX = Math.min(draggedBox.max.x, solidBox.max.x) - Math.max(draggedBox.min.x, solidBox.min.x);
                const overlapZ = Math.min(draggedBox.max.z, solidBox.max.z) - Math.max(draggedBox.min.z, solidBox.min.z);

                if (overlapX < overlapZ) {
                  // Push along X
                  const draggedCenterX = (draggedBox.min.x + draggedBox.max.x) / 2;
                  const solidCenterX = (solidBox.min.x + solidBox.max.x) / 2;
                  const pushX = draggedCenterX < solidCenterX ? -overlapX : overlapX;
                  
                  // Adjust position of all dragged objects by pushX so the group moves together
                  Object.keys(nextPositions).forEach(dragId => {
                    const m = meshMapRef.current[dragId];
                    if (m) {
                      m.position.x += pushX;
                      m.updateMatrixWorld(true);
                    }
                  });
                } else {
                  // Push along Z
                  const draggedCenterZ = (draggedBox.min.z + draggedBox.max.z) / 2;
                  const solidCenterZ = (solidBox.min.z + solidBox.max.z) / 2;
                  const pushZ = draggedCenterZ < solidCenterZ ? -overlapZ : overlapZ;

                  // Adjust position of all dragged objects by pushZ so the group moves together
                  Object.keys(nextPositions).forEach(dragId => {
                    const m = meshMapRef.current[dragId];
                    if (m) {
                      m.position.z += pushZ;
                      m.updateMatrixWorld(true);
                    }
                  });
                }
                break;
              }
            }
            if (collided) break;
          }
        }

        // Apply final resolved positions back to the state
        Object.keys(nextPositions).forEach(id => {
          const mesh = meshMapRef.current[id];
          if (mesh) {
            updateObjectProp(id, 'position', { 
              x: parseFloat(mesh.position.x.toFixed(2)), 
              y: parseFloat(mesh.position.y.toFixed(2)), 
              z: parseFloat(mesh.position.z.toFixed(2)) 
            });
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
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', outline: 'none', zIndex: 10, background: '#0f172a' }} tabIndex={0} onKeyDown={onKeyDown}>
      
      {/* ── Background Three.js View Canvas ── */}
      <div
        ref={mountRef}
        style={{ position: 'absolute', inset: 0, cursor: isOrbiting.current ? 'grabbing' : 'default' }}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleTemplateDrop}
      />

      {/* ── Floating Left Panel: View & Camera Locks ── */}
      <div className="glass-panel" style={{ position: 'absolute', left: 16, top: 76, width: 200, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6, marginBottom: 4 }}>Camera Settings</div>
        <button
          className={`glass-button ${fixCamera ? 'active' : ''}`}
          onClick={() => setFixCamera(!fixCamera)}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: 11 }}
        >
          <span>{fixCamera ? '🔒' : '🔓'}</span>
          {fixCamera ? 'Camera: Fixed' : 'Camera: Free'}
        </button>
        <button
          className={`glass-button ${isOrtho ? 'active' : ''}`}
          onClick={() => setIsOrtho(!isOrtho)}
          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: 11 }}
        >
          <span>📐</span>
          {isOrtho ? 'Orthographic' : 'Perspective'}
        </button>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {[{ key: '1', label: 'Front' }, { key: '3', label: 'Right' }, { key: '7', label: 'Top' }].map(snap => (
            <button
              key={snap.key}
              className="glass-button"
              style={{ flex: 1, padding: '4px 0', fontSize: 10 }}
              onClick={() => {
                setIsOrtho(true);
                if (snap.key === '1') {
                  targetPhiRef.current = Math.PI / 2 - 0.04;
                  targetThetaRef.current = -Math.PI / 2;
                } else if (snap.key === '3') {
                  targetPhiRef.current = Math.PI / 2 - 0.04;
                  targetThetaRef.current = 0;
                } else {
                  targetPhiRef.current = 0.08;
                  targetThetaRef.current = -Math.PI / 2;
                }
              }}
            >
              {snap.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Center/Right: Floating Camera Guide Toggle ── */}
      <div style={{ position: 'absolute', top: 76, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <button
          className="glass-button"
          onClick={() => setShowCameraHelp(!showCameraHelp)}
          style={{ width: 36, height: 36, borderRadius: '50%', padding: 0 }}
          title="Camera Guide"
        >
          <CameraIcon />
        </button>
        
        {showCameraHelp && (
          <div className="glass-panel" style={{ padding: 12, width: 220, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>🎥 Camera Navigation</div>
            <div><strong>Orbit:</strong> RMB / Alt + Drag</div>
            <div><strong>Pan:</strong> Shift + Drag</div>
            <div><strong>Zoom:</strong> Scroll Wheel</div>
            <div><strong>Focus Object:</strong> Select & press <code>F</code></div>
            <div><strong>Snap Axis:</strong> <code>1</code>, <code>3</code>, <code>7</code> keys</div>
          </div>
        )}
      </div>

      {/* ── Bottom Center: Draggable Shape Templates Bar ── */}
      <div className="glass-panel" style={{ position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)', display: 'flex', gap: 6, padding: '6px 10px', alignItems: 'center', zIndex: 50 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', paddingRight: 4, borderRight: '1px solid rgba(255,255,255,0.1)' }}>Drag Templates</div>
        {GEOMETRY_LIST.map(g => {
          const emoji = g.id === 'box' ? '⬜' : g.id === 'sphere' ? '⚪' : g.id === 'cylinder' ? '💈' : g.id === 'cone' ? '📐' : g.id === 'torus' ? '🍩' : '🔺';
          return (
            <div
              key={g.id}
              className="glass-button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', g.id)}
              onClick={() => handleAddObject(g.id)}
              style={{ cursor: 'grab', padding: '6px 10px', fontSize: 10, fontWeight: 600, userSelect: 'none', gap: 4 }}
            >
              <span>{emoji}</span>
              {g.label}
            </div>
          );
        })}
        <button
          className="glass-button"
          onClick={() => setShowLibrary(true)}
          style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, background: 'rgba(99,102,241,0.25)' }}
        >
          📂 Templates
        </button>
      </div>

      {/* ── Bottom Left: Scene Objects List Button & Dropdown ── */}
      <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 50 }}>
        {showObjectsList && (
          <div className="glass-panel" style={{ width: 230, maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, padding: 10, marginBottom: 8, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>Placed Objects ({objList.length})</span>
              {objList.length > 0 && (
                <button className="glass-button danger" onClick={clearScene} style={{ padding: '2px 6px', fontSize: 9 }}>Clear</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {objList.map(obj => (
                <div
                  key={obj.id}
                  className={`glass-button ${selectedObjectIds.includes(obj.id) ? 'active' : ''}`}
                  onClick={(e) => selectObject(obj.id, e.ctrlKey)}
                  style={{ justifyContent: 'flex-start', padding: '4px 8px', fontSize: 10, width: '100%', gap: 6 }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: obj.isSubtractive ? '#ef4444' : obj.color }} />
                  <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {obj.name}
                  </span>
                  <span style={{ fontSize: 9, opacity: 0.4 }}>{obj.geometry}</span>
                </div>
              ))}
              {!objList.length && (
                <div style={{ padding: '12px 6px', fontSize: 10, opacity: 0.5, textAlign: 'center' }}>No objects. Drag some in!</div>
              )}
            </div>
          </div>
        )}
        <button
          className={`glass-button ${showObjectsList ? 'active' : ''}`}
          onClick={() => setShowObjectsList(!showObjectsList)}
          style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600 }}
        >
          📁 Placed Objects ({objList.length})
        </button>
      </div>

      {/* ── Floating Right Side Panel: Tabbed Edit Tools (Selection Active Only) ── */}
      {selected && (
        <div className="glass-panel" style={{ position: 'absolute', right: 16, top: 76, bottom: 16, width: 270, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 50, overflowY: 'auto' }}>
          
          {/* Header */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, wordBreak: 'break-all' }}>{selected.name}</div>
            <div style={{ fontSize: 9, opacity: 0.5 }}>@{selected.createdBy} · {selected.geometry}</div>
          </div>

          {/* Three Tab Icon selector */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 8, gap: 2 }}>
            {[
              { id: 'transform', label: '📐 Layout' },
              { id: 'aesthetics', label: '🎨 Visual' },
              { id: 'physics', label: '⚙️ Physics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveRightTab(tab.id)}
                className={`glass-button ${activeRightTab === tab.id ? 'active' : ''}`}
                style={{ flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 700 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content tabs */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeRightTab === 'transform' && (
              <>
                <PropSection title="Position" obj={selected} prop="position" fields={['x','y','z']} id={selectedObjectId} update={updateObjectProp} step={0.1} />
                <PropSection title="Rotation" obj={selected} prop="rotation" fields={['x','y','z']} id={selectedObjectId} update={updateObjectProp} step={0.05} deg />
                <PropSection title="Scale" obj={selected} prop="scale" fields={['x','y','z']} id={selectedObjectId} update={updateObjectProp} step={0.05} />
                
                {selected.isStacked && (
                  <button
                    className="glass-button"
                    style={{ marginTop: 4, width: '100%', fontSize: 10, padding: '6px 0', fontWeight: 600, background: 'rgba(59,130,246,0.2)' }}
                    onClick={() => fitToBottomObject(selectedObjectId)}
                  >
                    📐 Fit to Base Size (Auto XZ)
                  </button>
                )}
              </>
            )}

            {activeRightTab === 'aesthetics' && (
              <>
                {/* Color section */}
                <div className="panel-section">
                  <div className="panel-label" style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Object Color</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                    <SmoothColorPicker value={selected.color}
                      onChange={e => {
                        const color = e.target.value;
                        if (selectedObjectIds.length > 1) updateObjectsProp(selectedObjectIds, 'color', color);
                        else updateObjectProp(selectedObjectId, 'color', color);
                      }}
                      style={{ width:28, height:24, border:'none', borderRadius:4, cursor:'pointer', background:'transparent', padding:0 }} />
                    <input className="form-input" value={selected.color}
                      onChange={e => {
                        const color = e.target.value;
                        if (selectedObjectIds.length > 1) updateObjectsProp(selectedObjectIds, 'color', color);
                        else updateObjectProp(selectedObjectId, 'color', color);
                      }}
                      style={{ fontFamily:'monospace', fontSize:10, padding: '3px 6px', height: 24, flex: 1 }} />
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#F7DC6F','#C8A028','#378ADD','#E24B4A','#fff','#888'].map(c => (
                      <div key={c} onClick={() => {
                        if (selectedObjectIds.length > 1) updateObjectsProp(selectedObjectIds, 'color', c);
                        else updateObjectProp(selectedObjectId, 'color', c);
                      }}
                        style={{ width:18, height:18, borderRadius:3, background:c, cursor:'pointer', border:selected.color===c?'2px solid var(--accent)':'1px solid rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                </div>

                {/* Text overlay section */}
                <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="panel-label" style={{ fontSize: 10, fontWeight: 700, marginBottom: 0 }}>Text Overlay</div>
                  <input className="form-input" value={selected.text || ''} placeholder="Type text content..."
                    onChange={e => updateObjectProp(selectedObjectId, 'text', e.target.value)} style={{ padding: '4px 6px', fontSize: 10 }} />
                  
                  {selected.text && (
                    <div style={{ display:'flex', flexDirection:'column', gap:6, animation: 'fadeIn 0.2s ease' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        <div>
                          <label style={{ fontSize: 8, opacity: 0.6, display:'block', marginBottom:2 }}>Text Color</label>
                          <div style={{ display: 'flex', gap: 3 }}>
                            <SmoothColorPicker value={selected.textColor || '#ffffff'}
                              onChange={e => updateObjectProp(selectedObjectId, 'textColor', e.target.value)}
                              style={{ width: 22, height: 20, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0 }} />
                            <input className="form-input" value={selected.textColor || '#ffffff'}
                              onChange={e => updateObjectProp(selectedObjectId, 'textColor', e.target.value)}
                              style={{ fontFamily: 'monospace', fontSize: 8, padding: '2px', width: '100%' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 8, opacity: 0.6, display:'block', marginBottom:2 }}>Font Size</label>
                          <input className="form-input" type="number" min={12} max={100} value={selected.textSize || 32}
                            onChange={e => {
                              const size = parseInt(e.target.value);
                              if (!isNaN(size)) updateObjectProp(selectedObjectId, 'textSize', size);
                            }}
                            style={{ fontSize: 9, padding: '2px 4px', height: 20 }} />
                        </div>
                      </div>

                      {/* Surface selection */}
                      {SHAPE_FACES[selected.geometry] && (
                        <div>
                          <label style={{ fontSize: 8, opacity: 0.6, display:'block', marginBottom:2 }}>Surfaces (None=All)</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {SHAPE_FACES[selected.geometry].map(faceName => {
                              const activeSurfaces = selected.textSurfaces || [];
                              const isSelected = activeSurfaces.includes(faceName);
                              return (
                                <button
                                  key={faceName}
                                  onClick={() => {
                                    const nextSurfaces = isSelected ? activeSurfaces.filter(f => f !== faceName) : [...activeSurfaces, faceName];
                                    updateObjectProp(selectedObjectId, 'textSurfaces', nextSurfaces);
                                  }}
                                  style={{ fontSize: '9px', padding: '2px 4px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)', background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}
                                >
                                  {faceName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: 8, opacity: 0.6, display:'block', marginBottom:2 }}>Font Family</label>
                        <select className="form-input" value={selected.textFont || 'sans-serif'}
                          onChange={e => updateObjectProp(selectedObjectId, 'textFont', e.target.value)}
                          style={{ width: '100%', fontSize: 9, height: 22, padding: '2px' }}>
                          <option value="sans-serif">Sans-serif</option>
                          <option value="serif">Serif</option>
                          <option value="monospace">Monospace</option>
                          <option value="cursive">Cursive</option>
                          <option value="Impact">Impact</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="panel-section">
                  <div className="panel-label" style={{ fontSize: 10, fontWeight: 700, marginBottom: 2 }}>Rename Asset</div>
                  <input className="form-input" value={selected.name}
                    onChange={e => updateObjectProp(selectedObjectId, 'name', e.target.value)} style={{ padding: '4px 6px', fontSize: 10 }} />
                </div>
              </>
            )}

            {activeRightTab === 'physics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Solidity Toggle */}
                <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>Solid Object 🧱</span>
                    <input
                      type="checkbox"
                      checked={!!selected.isSolid}
                      onChange={(e) => {
                        const val = e.target.checked;
                        if (selectedObjectIds.length > 1) updateObjectsProp(selectedObjectIds, 'isSolid', val);
                        else updateObjectProp(selectedObjectId, 'isSolid', val);
                      }}
                      style={{ cursor: 'pointer', width: 14, height: 14 }}
                    />
                  </div>
                  <div style={{ fontSize: 9, opacity: 0.5, lineHeight: 1.3 }}>
                    Solid objects block other objects from penetrating and act as platforms.
                  </div>
                </div>

                {/* Stacking Actions */}
                <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.stackedOnObjectId ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>Stacked Status 📚</span>
                      <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 4 }}>
                        Stacked on: {editorObjects[selected.stackedOnObjectId]?.name || selected.stackedOnObjectId}
                      </div>
                      <button
                        className="glass-button"
                        style={{ width: '100%', fontSize: 10, padding: '6px 0', fontWeight: 600, background: 'rgba(239,68,68,0.2)' }}
                        onClick={() => {
                          updateObjectProp(selectedObjectId, 'stackedOnObjectId', null);
                        }}
                      >
                        Unstack Object
                      </button>
                    </div>
                  ) : (
                    Object.values(editorObjects).some(obj => obj.isSolid && obj.id !== selectedObjectId) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700 }}>Stacking Controls 📚</span>
                        <button
                          className={`glass-button ${stackingObjectId === selectedObjectId ? 'active' : ''}`}
                          style={{ width: '100%', fontSize: 10, padding: '6px 0', fontWeight: 600 }}
                          onClick={() => {
                            if (stackingObjectId === selectedObjectId) {
                              setStackingObjectId(null);
                            } else {
                              setStackingObjectId(selectedObjectId);
                            }
                          }}
                        >
                          {stackingObjectId === selectedObjectId ? '❌ Cancel Stacking' : '🥞 Stack on...'}
                        </button>
                        <div style={{ fontSize: 9, opacity: 0.5, lineHeight: 1.3 }}>
                          {stackingObjectId === selectedObjectId ? 'Click on a highlighted platform in the scene.' : 'Click to select a platform to stack this object on.'}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Subtractive toggle */}
                {selected.geometry !== 'csg' && (
                  <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>Subtractive (Cutter) 🕳️</span>
                      <input
                        type="checkbox"
                        checked={!!selected.isSubtractive}
                        onChange={(e) => {
                          const val = e.target.checked;
                          if (selectedObjectIds.length > 1) updateObjectsProp(selectedObjectIds, 'isSubtractive', val);
                          else updateObjectProp(selectedObjectId, 'isSubtractive', val);
                        }}
                        style={{ cursor: 'pointer', width: 14, height: 14 }}
                      />
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.5, lineHeight: 1.3 }}>
                      Carves space out of solid shapes when grouped.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom actions list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 'auto' }}>
            {selectedObjectIds.length >= 2 && (
              <button className="glass-button" onClick={carveSelectedObjects} style={{ padding: '6px 0', fontSize: 10, background: 'var(--accent)' }}>
                🪓 Carve / Group (Ctrl+G)
              </button>
            )}
            {selectedObjectIds.length === 1 && selected.geometry === 'csg' && (
              <button className="glass-button" onClick={uncarveSelectedObject} style={{ padding: '6px 0', fontSize: 10, background: 'rgba(78,205,196,0.15)', color: '#4ECDC4' }}>
                🔓 Uncarve / Ungroup
              </button>
            )}
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="glass-button" onClick={() => duplicateObjects(selectedObjectIds)} style={{ flex: 1, padding: '5px 0', fontSize: 9 }}>⧉ Duplicate</button>
              <button className="glass-button danger" onClick={() => deleteObjects(selectedObjectIds)} style={{ flex: 1, padding: '5px 0', fontSize: 9 }}>🗑 Delete</button>
            </div>
            <button className="glass-button" onClick={undo} style={{ padding: '5px 0', fontSize: 9 }}>↩ Undo (⌘Z)</button>
            <button
              className="glass-button"
              onClick={() => setShowPublish(true)}
              style={{ padding: '7px 0', fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.3)' }}
            >
              ↑ Publish Selected ({selectedObjectIds.length})
            </button>
          </div>

        </div>
      )}

      {/* Marquee Select Box Overlay */}
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

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} onPublish={name => { publishToCity(name); setShowPublish(false); }} count={selectedObjectIds.length} />}
      {showLibrary && <AssetLibrary onClose={() => setShowLibrary(false)} spawnOffset={getSpawnOffset()} />}
      {stackPrompt && (
        <div className="modal-overlay" onClick={() => setStackPrompt(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Stacking Method</div>
              <button className="modal-close" onClick={() => setStackPrompt(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>
              Choose how you want to stack this object on the platform:
            </p>
            <div className="modal-footer" style={{ gap: 10 }}>
              <button className="btn" onClick={() => {
                const child = editorObjects[stackPrompt.childId];
                const parent = editorObjects[stackPrompt.parentId];
                if (child && parent) {
                  const posY = parent.position.y + parent.scale.y/2 + child.scale.y/2;
                  updateObjectProp(stackPrompt.childId, 'stackedOnObjectId', stackPrompt.parentId);
                  updateObjectProp(stackPrompt.childId, 'position', { ...child.position, y: posY });
                }
                setStackPrompt(null);
              }}>
                Stack
              </button>
              <button className="btn primary" onClick={() => {
                const child = editorObjects[stackPrompt.childId];
                const parent = editorObjects[stackPrompt.parentId];
                if (child && parent) {
                  const posY = parent.position.y + parent.scale.y/2 + child.scale.y/2;
                  updateObjectProp(stackPrompt.childId, 'stackedOnObjectId', stackPrompt.parentId);
                  updateObjectProp(stackPrompt.childId, 'scale', { ...child.scale, x: parent.scale.x, z: parent.scale.z });
                  updateObjectProp(stackPrompt.childId, 'position', { x: parent.position.x, y: posY, z: parent.position.z });
                }
                setStackPrompt(null);
              }}>
                Stack and Fit
              </button>
            </div>
          </div>
        </div>
      )}
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
        const lockPropName = 'lock' + f.toUpperCase();
        const isLocked = prop === 'position' ? ((f === 'y' && obj.stackedOnObjectId) ? true : !!obj[lockPropName]) : false;
        return (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:10, color:'var(--text3)', width:12, textAlign:'center', fontWeight:700, textTransform:'uppercase' }}>{f}</span>
            <input
              className="form-input"
              style={{ fontFamily:'monospace', fontSize:11, padding:'3px 6px', flex: 1 }}
              type="number" step={step || 0.1} value={display}
              disabled={isLocked}
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
            {prop === 'position' && (
              <button
                className={`glass-button ${isLocked ? 'active' : ''}`}
                style={{ padding: '3px 6px', fontSize: 10, minWidth: 26, height: 22, flexShrink: 0 }}
                onClick={() => {
                  if (f === 'y' && obj.stackedOnObjectId) return;
                  update(id, lockPropName, !isLocked);
                }}
                disabled={f === 'y' && obj.stackedOnObjectId}
                title={isLocked ? `Unlock ${f.toUpperCase()} axis` : `Lock ${f.toUpperCase()} axis`}
              >
                {isLocked ? '🔒' : '🔓'}
              </button>
            )}
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
