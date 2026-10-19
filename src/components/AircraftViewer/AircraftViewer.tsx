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
  Layers,
  Box,
  MousePointer,
} from 'lucide-react';
import { AircraftData, AircraftComponentData } from '../../types/aircraft';

export interface AircraftViewerProps {
  aircraft: AircraftData;
  selectedComponent: AircraftComponentData | null;
  onSelectComponent: (comp: AircraftComponentData) => void;
  activeTab?: '3d' | 'components' | 'maintenance' | 'history';
  onTabChange?: (tab: '3d' | 'components' | 'maintenance' | 'history') => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  viewMode?: 'aircraft' | 'system';
  onViewModeChange?: (mode: 'aircraft' | 'system') => void;
}

// In-memory model cache for instant switching between Rafale and Tejas
const modelCache = new Map<string, THREE.Group>();

// Helper to resolve model assets relative to Vite base
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
  showLabels: externalShowLabels,
  onToggleLabels: externalToggleLabels,
  viewMode: externalViewMode,
  onViewModeChange: externalViewModeChange,
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
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [internalShowLabels, setInternalShowLabels] = useState<boolean>(true);
  const [internalViewMode, setInternalViewMode] = useState<'aircraft' | 'system'>('aircraft');
  const [controlMode, setControlMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');
  const [screenHotspots, setScreenHotspots] = useState<
    Array<{
      component: AircraftComponentData;
      x: number;
      y: number;
      visible: boolean;
    }>
  >([]);

  const showLabels = externalShowLabels !== undefined ? externalShowLabels : internalShowLabels;
  const toggleLabels = externalToggleLabels || (() => setInternalShowLabels((prev) => !prev));

  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const handleViewModeChange = (mode: 'aircraft' | 'system') => {
    if (externalViewModeChange) {
      externalViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // Smooth camera reset animation
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const initialPos = aircraft.modelConfig.initialCameraPosition;
    const initialTarget = aircraft.modelConfig.initialTarget;

    const startPos = cameraRef.current.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const endPos = new THREE.Vector3(
      initialPos[0] * 0.85,
      initialPos[1] * 0.85,
      initialPos[2] * 0.85
    );
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
        cameraRef.current.position.set(
          aircraft.modelConfig.initialCameraPosition[0] * 0.85,
          aircraft.modelConfig.initialCameraPosition[1] * 0.85,
          aircraft.modelConfig.initialCameraPosition[2] * 0.85
        );
        break;
      case 'top':
        cameraRef.current.position.set(0, 9.5, 0.1);
        break;
      case 'side':
        cameraRef.current.position.set(9.5, 0.8, 0);
        break;
      case 'front':
        cameraRef.current.position.set(0, 0.8, 9.5);
        break;
    }
    controlsRef.current.update();
  };

  // Toggle wireframe mode
  const toggleWireframe = () => {
    const nextState = !isWireframe;
    setIsWireframe(nextState);
    if (currentModelGroupRef.current) {
      currentModelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              if ('wireframe' in m) (m as any).wireframe = nextState;
            });
          } else if (mesh.material && 'wireframe' in mesh.material) {
            (mesh.material as any).wireframe = nextState;
          }
        }
      });
    }
  };

  // Setup Three.js scene once
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 460;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera: Framed with FOV 36 for prominent aircraft presence
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(
      aircraft.modelConfig.initialCameraPosition[0] * 0.85,
      aircraft.modelConfig.initialCameraPosition[1] * 0.85,
      aircraft.modelConfig.initialCameraPosition[2] * 0.85
    );
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
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.0;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(...aircraft.modelConfig.initialTarget);
    controlsRef.current = controls;

    // 5. Studio Aerospace Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.9);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    mainKeyLight.position.set(8, 12, 10);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.3);
    fillLight.position.set(-10, 6, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
    rimLight.position.set(0, 8, -12);
    scene.add(rimLight);

    // 6. Contact Shadow Ground Plane
    const groundGeo = new THREE.PlaneGeometry(32, 32);
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d');
    if (gctx) {
      const grad = gctx.createRadialGradient(256, 256, 10, 256, 256, 240);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.32)');
      grad.addColorStop(0.35, 'rgba(30, 41, 59, 0.16)');
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
      const h = containerRef.current.clientHeight || 460;
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
        const h = containerRef.current.clientHeight || 460;

        const updated = aircraft.components.map((comp) => {
          const pos = new THREE.Vector3(...comp.hotspotPosition);
          pos.applyMatrix4(pivot.matrixWorld);

          const projected = pos.clone().project(cameraRef.current!);
          const isBehind = projected.z > 1.0;
          const x = (projected.x * 0.5 + 0.5) * w;
          const y = (-(projected.y * 0.5) + 0.5) * h;
          const inBounds = x >= 15 && x <= w - 15 && y >= 15 && y <= h - 15;

          return {
            component: comp,
            x,
            y,
            visible: !isBehind && inBounds,
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

  // Load / Switch Aircraft Model (Centering and enlarged scale)
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
      cameraRef.current.position.set(
        aircraft.modelConfig.initialCameraPosition[0] * 0.85,
        aircraft.modelConfig.initialCameraPosition[1] * 0.85,
        aircraft.modelConfig.initialCameraPosition[2] * 0.85
      );
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
      // Enlarged target size to 10.4 so the aircraft fills the viewport with high presence
      const targetSize = 10.4 * (aircraft.modelConfig.scaleMultiplier || 1.0);
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
          }
        },
        (err) => {
          console.error('Failed to load GLB model:', err);
          setLoading(false);
        }
      );
    } else if (aircraft.modelFormat === 'obj') {
      const loader = new OBJLoader();
      loader.load(
        resolveModelUrl(aircraft.modelPath),
        (obj) => {
          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x94a3b8,
                metalness: 0.35,
                roughness: 0.45,
              });
            }
          });
          modelCache.set(cacheKey, obj);
          finalizeLoadedModel(obj.clone(true));
        },
        (xhr) => {
          if (xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            setLoadProgress(percent);
          }
        },
        (err) => {
          console.error('Failed to load OBJ model:', err);
          setLoading(false);
        }
      );
    }
  }, [aircraft]);

  // Color mapping helper for hotspot badges
  const getHotspotColor = (component: AircraftComponentData) => {
    if (component.status === 'Maintenance Required' || component.health < 70) {
      return { dot: 'bg-red-500', ring: 'ring-red-400', badge: 'border-red-400/50' };
    }
    if (component.status === 'Monitor' || component.health < 85) {
      return { dot: 'bg-amber-400', ring: 'ring-amber-400', badge: 'border-amber-400/50' };
    }
    if (component.category === 'landing' || component.category === 'electrical') {
      return { dot: 'bg-blue-400', ring: 'ring-blue-400', badge: 'border-blue-400/50' };
    }
    return { dot: 'bg-emerald-400', ring: 'ring-emerald-400', badge: 'border-emerald-400/50' };
  };

  return (
    <div className="w-full flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Top Bar above 3D Viewport matching reference screenshot */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
        {/* View Mode Toggle: Aircraft View | System View */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold text-slate-700">
          <button
            onClick={() => handleViewModeChange('aircraft')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'aircraft'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aircraft View
          </button>
          <button
            onClick={() => handleViewModeChange('system')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'system'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System View
          </button>
        </div>

        {/* Labels Toggle Switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Labels</span>
          <button
            onClick={toggleLabels}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              showLabels ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            title="Toggle component hotspot labels"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                showLabels ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[460px] bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 transition-opacity">
            <div className="w-14 h-14 relative flex items-center justify-center">
              <div className="w-full h-full rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin" />
              <Compass className="w-6 h-6 text-blue-600 absolute" />
            </div>
            <div className="mt-4 text-sm font-bold text-slate-800">
              Loading 3D Aircraft Model...
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {aircraft.name} ({aircraft.modelFormat.toUpperCase()}) — {loadProgress}%
            </p>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Floating Tool Strip on Left Edge matching screenshot */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 bg-white/95 p-1 rounded-xl border border-slate-200/90 shadow-md backdrop-blur-xs">
          <button
            onClick={() => setControlMode('rotate')}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              controlMode === 'rotate' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Selection & Rotate Tool"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPresetAngle('perspective')}
            className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Hero Perspective View"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleWireframe}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isWireframe ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Subsystem Wireframe Mode"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (cameraRef.current) {
                cameraRef.current.position.multiplyScalar(0.9);
                controlsRef.current?.update();
              }
            }}
            className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Reset Camera Framing"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3D Hotspot Tags Overlay */}
        {!loading &&
          showLabels &&
          screenHotspots.map(({ component, x, y, visible }) => {
            if (!visible) return null;
            const isSelected = selectedComponent?.id === component.id;
            const colors = getHotspotColor(component);

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
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black shadow-lg backdrop-blur-md transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border border-blue-400 ring-4 ring-blue-500/30 scale-105 z-20'
                      : 'bg-[#0F172A]/90 hover:bg-[#0F172A] text-white border border-slate-700/80 hover:scale-105 z-10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0 animate-pulse`} />
                  <span className="tracking-tight">{component.name}</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
