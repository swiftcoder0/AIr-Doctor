import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
  RotateCcw,
  ZoomIn,
  Move,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { AircraftData, AircraftComponentData } from '../../types/aircraft';

interface AircraftViewerProps {
  aircraft: AircraftData;
  selectedComponent: AircraftComponentData | null;
  onSelectComponent: (comp: AircraftComponentData) => void;
  activeTab: '3d' | 'components' | 'maintenance' | 'history';
  onTabChange: (tab: '3d' | 'components' | 'maintenance' | 'history') => void;
}

// In-memory model cache for instant switching
const modelCache = new Map<string, THREE.Group>();

// Helper to resolve model assets relative to Vite base (works for both root '/' and subpath deployments like GitHub Pages)
const resolveModelUrl = (path: string): string => {
  if (!path || path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = import.meta.env.BASE_URL || '/';
  return baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;
};

export const AircraftViewer: React.FC<AircraftViewerProps> = ({
  aircraft,
  selectedComponent,
  onSelectComponent,
  activeTab,
  onTabChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelGroupRef = useRef<THREE.Group | null>(null);
  const pivotGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [controlMode, setControlMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');
  const [screenHotspots, setScreenHotspots] = useState<
    Array<{
      component: AircraftComponentData;
      x: number;
      y: number;
      visible: boolean;
    }>
  >([]);

  // Smooth camera reset animation
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const initialPos = aircraft.modelConfig.initialCameraPosition;
    const initialTarget = aircraft.modelConfig.initialTarget;

    const startPos = cameraRef.current.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const endPos = new THREE.Vector3(...initialPos);
    const endTarget = new THREE.Vector3(...initialTarget);

    let progress = 0;
    const animateReset = () => {
      progress += 0.05;
      if (progress < 1) {
        cameraRef.current?.position.lerpVectors(startPos, endPos, progress);
        controlsRef.current?.target.lerpVectors(startTarget, endTarget, progress);
        controlsRef.current?.update();
        requestAnimationFrame(animateReset);
      } else {
        cameraRef.current?.position.copy(endPos);
        controlsRef.current?.target.copy(endTarget);
        controlsRef.current?.update();
      }
    };
    animateReset();
  }, [aircraft]);

  // View angle presets
  const setPresetAngle = (view: 'perspective' | 'top' | 'side' | 'front') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const target = new THREE.Vector3(...aircraft.modelConfig.initialTarget);
    controlsRef.current.target.copy(target);

    switch (view) {
      case 'perspective':
        cameraRef.current.position.set(...aircraft.modelConfig.initialCameraPosition);
        break;
      case 'top':
        cameraRef.current.position.set(0, 10, 0.1);
        break;
      case 'side':
        cameraRef.current.position.set(10, 0.8, 0);
        break;
      case 'front':
        cameraRef.current.position.set(0, 0.8, 10);
        break;
    }
    controlsRef.current.update();
  };

  // Setup Three.js scene once
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(...aircraft.modelConfig.initialCameraPosition);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.5;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(...aircraft.modelConfig.initialTarget);
    controlsRef.current = controls;

    // 5. Lighting: Studio aerospace lighting rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.8);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainKeyLight.position.set(8, 12, 10);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.camera.near = 0.5;
    mainKeyLight.shadow.camera.far = 30;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    fillLight.position.set(-10, 6, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(0, 8, -12);
    scene.add(rimLight);

    // 6. Contact Shadow Ground Plane
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d');
    if (gctx) {
      const grad = gctx.createRadialGradient(256, 256, 10, 256, 256, 240);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
      grad.addColorStop(0.35, 'rgba(30, 41, 59, 0.14)');
      grad.addColorStop(0.7, 'rgba(148, 163, 184, 0.05)');
      grad.addColorStop(1, 'rgba(248, 250, 252, 0)');
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 512, 512);
    }
    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    const groundMat = new THREE.MeshBasicMaterial({
      map: groundTexture,
      transparent: true,
      depthWrite: false,
    });
    const groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -1.2;
    scene.add(groundPlane);

    // 7. Pivot Group for active model
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotGroupRef.current = pivot;

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 520;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        if (isAutoRotating) {
          pivot.rotation.y += 0.005;
        }
        controlsRef.current.update();
      }

      // Update 2D positions of 3D hotspots
      if (cameraRef.current && containerRef.current && aircraft) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight || 520;

        const updated = aircraft.components.map((comp) => {
          const pos = new THREE.Vector3(...comp.hotspotPosition);
          pos.applyMatrix4(pivot.matrixWorld);

          const camPos = cameraRef.current!.position;
          const dist = pos.distanceTo(camPos);

          const projected = pos.clone().project(cameraRef.current!);

          const isBehind = projected.z > 1.0;
          const x = (projected.x * 0.5 + 0.5) * w;
          const y = (-(projected.y * 0.5) + 0.5) * h;

          const inBounds = x >= 10 && x <= w - 10 && y >= 10 && y <= h - 10;

          return {
            component: comp,
            x,
            y,
            visible: !isBehind && inBounds && dist < 25,
          };
        });

        setScreenHotspots(updated);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
    };
  }, []);

  // Update OrbitControls mode
  useEffect(() => {
    if (!controlsRef.current) return;
    if (controlMode === 'pan') {
      controlsRef.current.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
    } else {
      controlsRef.current.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      };
    }
  }, [controlMode]);

  // Load / Switch Aircraft Model
  useEffect(() => {
    const pivot = pivotGroupRef.current;
    if (!pivot) return;

    // Clear previous model from pivot
    while (pivot.children.length > 0) {
      pivot.remove(pivot.children[0]);
    }
    currentModelGroupRef.current = null;

    // Reset pivot transform
    pivot.rotation.set(...aircraft.modelConfig.rotationOffset);
    pivot.position.set(0, 0, 0);

    // Camera initial framing
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(...aircraft.modelConfig.initialCameraPosition);
      controlsRef.current.target.set(...aircraft.modelConfig.initialTarget);
      controlsRef.current.update();
    }

    const cacheKey = aircraft.id;

    const finalizeLoadedModel = (modelGroup: THREE.Group) => {
      const box = new THREE.Box3().setFromObject(modelGroup);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 6.8 * aircraft.modelConfig.scaleMultiplier;
      const scaleFactor = maxDim > 0 ? targetSize / maxDim : 1;

      modelGroup.scale.setScalar(scaleFactor);
      modelGroup.position.set(
        -center.x * scaleFactor,
        -center.y * scaleFactor,
        -center.z * scaleFactor
      );

      pivot.add(modelGroup);
      currentModelGroupRef.current = modelGroup;
      setLoading(false);
      setLoadProgress(100);
    };

    if (modelCache.has(cacheKey)) {
      setLoading(false);
      setLoadProgress(100);
      const cached = modelCache.get(cacheKey)!.clone(true);
      finalizeLoadedModel(cached);
      return;
    }

    setLoading(true);
    setLoadProgress(5);

    if (aircraft.modelFormat === 'glb') {
      const loader = new GLTFLoader();
      loader.load(
        resolveModelUrl(aircraft.modelPath),
        (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          modelCache.set(cacheKey, gltf.scene);
          finalizeLoadedModel(gltf.scene.clone(true));
        },
        (xhr) => {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadProgress(percent);
          } else {
            setLoadProgress((prev) => Math.min(prev + 15, 90));
          }
        },
        (error) => {
          console.error('Error loading Rafale GLB:', error);
          setLoading(false);
        }
      );
    } else {
      // Tejas OBJ
      const loader = new OBJLoader();
      loader.load(
        resolveModelUrl(aircraft.modelPath),
        (obj) => {
          const airframeMaterial = new THREE.MeshStandardMaterial({
            color: 0x7e8c9b,
            metalness: 0.28,
            roughness: 0.42,
          });

          const darkCompositeMaterial = new THREE.MeshStandardMaterial({
            color: 0x333b45,
            metalness: 0.4,
            roughness: 0.35,
          });

          const canopyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1e3a5f,
            metalness: 0.2,
            roughness: 0.08,
            transmission: 0.55,
            transparent: true,
            opacity: 0.88,
          });

          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (mesh.geometry) {
                mesh.geometry.computeVertexNormals();
              }

              const name = (mesh.name || '').toLowerCase();
              if (name.includes('glass') || name.includes('canopy') || name.includes('cockpit')) {
                mesh.material = canopyMaterial;
              } else if (
                name.includes('engine') ||
                name.includes('nozzle') ||
                name.includes('tire') ||
                name.includes('wheel')
              ) {
                mesh.material = darkCompositeMaterial;
              } else {
                mesh.material = airframeMaterial;
              }
            }
          });

          modelCache.set(cacheKey, obj);
          finalizeLoadedModel(obj.clone(true));
        },
        (xhr) => {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadProgress(percent);
          } else {
            setLoadProgress((prev) => Math.min(prev + 10, 85));
          }
        },
        (error) => {
          console.error('Error loading Tejas OBJ:', error);
          setLoading(false);
        }
      );
    }
  }, [aircraft]);

  // Focus camera on selected component if clicked
  useEffect(() => {
    if (!selectedComponent || !pivotGroupRef.current || !cameraRef.current || !controlsRef.current)
      return;
    const targetPos = new THREE.Vector3(...selectedComponent.hotspotPosition);
    targetPos.applyMatrix4(pivotGroupRef.current.matrixWorld);

    controlsRef.current.target.lerp(targetPos, 0.4);
    controlsRef.current.update();
  }, [selectedComponent]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden relative">
      {/* Top Header of the 3D Viewer */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* Aircraft ID & Status Header */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {aircraft.name}
            </h1>
            <span className="text-sm font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {aircraft.code}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                aircraft.status === 'READY'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {aircraft.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {aircraft.fullName}
          </p>
        </div>

        {/* Tabs: 3D View, Component Status, Maintenance, History */}
        <div className="flex items-center gap-1 border-b border-transparent">
          {[
            { id: '3d', label: '3D View' },
            { id: 'components', label: 'Component Status' },
            { id: 'maintenance', label: 'Maintenance' },
            { id: 'history', label: 'History' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  onTabChange(tab.id as '3d' | 'components' | 'maintenance' | 'history')
                }
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
                  isActive
                    ? 'text-blue-600 bg-blue-50/70 border border-blue-200/60 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[520px] bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 transition-opacity">
            <div className="w-14 h-14 relative flex items-center justify-center">
              <div className="w-full h-full rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin"></div>
              <Compass className="w-6 h-6 text-blue-600 absolute" />
            </div>
            <div className="mt-4 text-sm font-bold text-slate-800">
              Loading 3D Aircraft Model...
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {aircraft.name} ({aircraft.modelFormat.toUpperCase()}) — {loadProgress}%
            </p>
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 3D Hotspots Overlay */}
        {!loading &&
          screenHotspots.map(({ component, x, y, visible }) => {
            if (!visible) return null;
            const isSelected = selectedComponent?.id === component.id;
            const isWarning = component.status === 'Maintenance Required';
            const isMonitor = component.status === 'Monitor';

            return (
              <div
                key={component.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComponent(component);
                }}
                style={{
                  transform: `translate3d(${x}px, ${y}px, 0)`,
                  left: 0,
                  top: 0,
                }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-transform duration-75"
              >
                {/* Hotspot Pin */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`absolute w-6 h-6 rounded-full opacity-75 animate-ping ${
                        isWarning
                          ? 'bg-rose-400'
                          : isMonitor
                          ? 'bg-amber-400'
                          : 'bg-blue-400'
                      }`}
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-3 ring-blue-500 scale-125'
                          : 'group-hover:scale-115'
                      } ${
                        isWarning
                          ? 'bg-rose-600'
                          : isMonitor
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>

                  {/* Hotspot Label Pill */}
                  <div
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-tight shadow-md border backdrop-blur-md transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/30'
                        : 'bg-white/95 text-slate-800 border-slate-200/90 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {component.name}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Top-Right Quick Angle Selector */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-sm text-xs">
          <button
            onClick={() => setPresetAngle('perspective')}
            className="px-2 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-medium transition-colors"
            title="Hero Isometric View"
          >
            Perspective
          </button>
          <button
            onClick={() => setPresetAngle('top')}
            className="px-2 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-medium transition-colors"
            title="Top Elevation"
          >
            Top
          </button>
          <button
            onClick={() => setPresetAngle('side')}
            className="px-2 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-medium transition-colors"
            title="Side Profile"
          >
            Side
          </button>
          <button
            onClick={() => setPresetAngle('front')}
            className="px-2 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-medium transition-colors"
            title="Front Radial"
          >
            Front
          </button>
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/90 shadow-lg text-xs font-semibold text-slate-700">
          <button
            onClick={() => {
              setControlMode('rotate');
              setIsAutoRotating(!isAutoRotating);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              controlMode === 'rotate' || isAutoRotating
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Toggle 360 Turntable / Rotation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </button>

          <button
            onClick={() => setControlMode(controlMode === 'pan' ? 'rotate' : 'pan')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              controlMode === 'pan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Pan Camera"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Pan</span>
          </button>

          <button
            onClick={() => {
              if (cameraRef.current) {
                cameraRef.current.position.multiplyScalar(0.9);
                controlsRef.current?.update();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoom</span>
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Reset Camera to Default Angle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Hotspot count hint at bottom left */}
        <div className="absolute bottom-4 left-4 z-10 px-2.5 py-1 bg-white/80 backdrop-blur-xs rounded-lg border border-slate-200/60 text-[10px] font-medium text-slate-500 pointer-events-none">
          Click hotspot markers to inspect telemetry
        </div>
      </div>
    </div>
  );
};
