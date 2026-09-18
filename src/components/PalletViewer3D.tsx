import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PalletConfig, PlacedBox, ColumnSummary } from '../types';
import { 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Columns3,
  AlertTriangle,
  ShieldCheck,
  Check
} from 'lucide-react';

interface PalletViewer3DProps {
  pallet: PalletConfig;
  boxes: PlacedBox[];
  columnsSummary: ColumnSummary[];
  explodedOffset: number; // 0 a 100% (eleva verticalmente as caixas nas colunas)
  showDimensions: boolean;
  showWireframe: boolean;
  onSelectBox?: (box: PlacedBox | null) => void;
  selectedBoxId?: string | null;
  selectedItemId?: string | null;
  onSelectItemId?: (id: string | null) => void;
}

export const PalletViewer3D: React.FC<PalletViewer3DProps> = ({
  pallet,
  boxes,
  columnsSummary,
  explodedOffset,
  showDimensions,
  showWireframe,
  onSelectBox,
  selectedBoxId,
  selectedItemId,
  onSelectItemId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBox, setHoveredBox] = useState<PlacedBox | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boxesGroupRef = useRef<THREE.Group | null>(null);
  const palletGroupRef = useRef<THREE.Group | null>(null);
  const footprintGroupRef = useRef<THREE.Group | null>(null);
  const dimensionsGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseCoordsRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Set up scene, camera, renderer on mount
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1120'); // slate-950
    sceneRef.current = scene;

    // Camera (Y is up, Z is depth, X is width)
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(150, 160, 210);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.minDistance = 30;
    controls.maxDistance = 600;
    controls.target.set(0, 45, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.45);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(150, 260, 180);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 800;
    const d = 180;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.4);
    fillLight.position.set(-140, 100, -180);
    scene.add(fillLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(600, 600);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.95,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid
    const grid = new THREE.GridHelper(500, 50, 0x1e293b, 0x0f172a);
    grid.position.y = 0;
    scene.add(grid);

    // Groups
    const palletGroup = new THREE.Group();
    scene.add(palletGroup);
    palletGroupRef.current = palletGroup;

    const footprintGroup = new THREE.Group();
    scene.add(footprintGroup);
    footprintGroupRef.current = footprintGroup;

    const boxesGroup = new THREE.Group();
    scene.add(boxesGroup);
    boxesGroupRef.current = boxesGroup;

    const dimGroup = new THREE.Group();
    scene.add(dimGroup);
    dimensionsGroupRef.current = dimGroup;

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer with requestAnimationFrame to prevent feedback loops
    let resizeFrameId: number | null = null;
    let lastWidth = width;
    let lastHeight = height;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: rawW, height: rawH } = entry.contentRect;
        const newW = Math.floor(rawW);
        const newH = Math.floor(rawH);

        if (newW > 0 && newH > 0 && (Math.abs(newW - lastWidth) > 1 || Math.abs(newH - lastHeight) > 1)) {
          if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
          resizeFrameId = requestAnimationFrame(() => {
            if (!cameraRef.current || !rendererRef.current) return;
            lastWidth = newW;
            lastHeight = newH;
            cameraRef.current.aspect = newW / newH;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH, false);
          });
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Build Wooden Pallet Geometry
  useEffect(() => {
    const palletGroup = palletGroupRef.current;
    if (!palletGroup) return;

    while (palletGroup.children.length > 0) {
      const child = palletGroup.children[0];
      palletGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    const { width: pW, length: pL, height: pH } = pallet;

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xc49a62,
      roughness: 0.85,
      metalness: 0.05,
    });
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0xa87d46,
      roughness: 0.9,
      metalness: 0.05,
    });

    // 1. Bottom runner skids
    const bottomBoardThick = 2.2;
    const bottomBoardWidth = 14;
    const runnerXPositions = [-pW / 2 + bottomBoardWidth / 2, 0, pW / 2 - bottomBoardWidth / 2];

    runnerXPositions.forEach((posX) => {
      const geo = new THREE.BoxGeometry(bottomBoardWidth, bottomBoardThick, pL - 1);
      const mesh = new THREE.Mesh(geo, woodMat);
      mesh.position.set(posX, bottomBoardThick / 2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      palletGroup.add(mesh);
    });

    // 2. Nine blocks (3x3)
    const blockHeight = pH - bottomBoardThick * 2 - 2.2;
    const blockSize = 14;
    const blockZPositions = [-pL / 2 + blockSize / 2, 0, pL / 2 - blockSize / 2];

    runnerXPositions.forEach((bx) => {
      blockZPositions.forEach((bz) => {
        const blockGeo = new THREE.BoxGeometry(blockSize, blockHeight, blockSize);
        const blockMesh = new THREE.Mesh(blockGeo, blockMat);
        blockMesh.position.set(bx, bottomBoardThick + blockHeight / 2, bz);
        blockMesh.castShadow = true;
        blockMesh.receiveShadow = true;
        palletGroup.add(blockMesh);
      });
    });

    // 3. Middle cross boards
    const midBoardThick = 2.2;
    const midBoardWidth = 14;
    blockZPositions.forEach((bz) => {
      const midGeo = new THREE.BoxGeometry(pW, midBoardThick, midBoardWidth);
      const midMesh = new THREE.Mesh(midGeo, woodMat);
      midMesh.position.set(0, bottomBoardThick + blockHeight + midBoardThick / 2, bz);
      midMesh.castShadow = true;
      midMesh.receiveShadow = true;
      palletGroup.add(midMesh);
    });

    // 4. Top deck boards
    const topBoardThick = 2.2;
    const numTopBoards = 7;
    const boardWidth = 13;
    const spacing = (pL - numTopBoards * boardWidth) / (numTopBoards - 1);

    for (let i = 0; i < numTopBoards; i++) {
      const topGeo = new THREE.BoxGeometry(pW, topBoardThick, boardWidth);
      const topMesh = new THREE.Mesh(topGeo, woodMat);
      const posZ = -pL / 2 + boardWidth / 2 + i * (boardWidth + spacing);
      topMesh.position.set(0, pH - topBoardThick / 2, posZ);
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      palletGroup.add(topMesh);
    }
  }, [pallet]);

  // Build Base Footprint zones on the wood floor (Shows side-by-side product boundaries)
  useEffect(() => {
    const fpGroup = footprintGroupRef.current;
    if (!fpGroup) return;

    while (fpGroup.children.length > 0) {
      const child = fpGroup.children[0];
      fpGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    // Render footprint outlines on top of the pallet floor
    columnsSummary.forEach((cs) => {
      const isSelected = selectedItemId === cs.itemId;
      const footprintColor = cs.hasCollision
        ? 0xf43f5e // Rose / Red if collision
        : isSelected
        ? 0xf59e0b // Amber if selected
        : new THREE.Color(cs.color);

      // Floor plane highlight
      const planeGeo = new THREE.PlaneGeometry(cs.footprintWidth, cs.footprintLength);
      const planeMat = new THREE.MeshBasicMaterial({
        color: footprintColor,
        transparent: true,
        opacity: cs.hasCollision ? 0.35 : isSelected ? 0.25 : 0.12,
        side: THREE.DoubleSide,
      });
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.rotation.x = -Math.PI / 2;
      planeMesh.position.set(cs.posX, pallet.height + 0.05, cs.posZ);
      fpGroup.add(planeMesh);

      // Border outline of the footprint
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(cs.footprintWidth, 0.4, cs.footprintLength));
      const lineMat = new THREE.LineBasicMaterial({
        color: cs.hasCollision ? 0xf43f5e : isSelected ? 0xffffff : footprintColor,
        linewidth: isSelected || cs.hasCollision ? 2 : 1,
      });
      const wire = new THREE.LineSegments(edges, lineMat);
      wire.position.set(cs.posX, pallet.height + 0.2, cs.posZ);
      fpGroup.add(wire);
    });
  }, [columnsSummary, pallet.height, selectedItemId]);

  // Update Boxes Geometries & Positions for Columns
  useEffect(() => {
    const boxesGroup = boxesGroupRef.current;
    if (!boxesGroup) return;

    while (boxesGroup.children.length > 0) {
      const child = boxesGroup.children[0];
      boxesGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    const boxGap = 0.3; // 3mm visual gap

    boxes.forEach((box) => {
      const geoW = Math.max(1, box.width - boxGap);
      const geoH = Math.max(1, box.height - boxGap);
      const geoL = Math.max(1, box.length - boxGap);

      const boxGeo = new THREE.BoxGeometry(geoW, geoH, geoL);

      const isSelected = selectedBoxId === box.id || selectedItemId === box.itemId;
      const isHovered = hoveredBox?.id === box.id;

      // Base Box Material
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(box.color),
        roughness: 0.65,
        metalness: 0.05,
        wireframe: showWireframe,
      });

      const mesh = new THREE.Mesh(boxGeo, boxMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Exploded Y: eleva verticalmente as caixas na própria coluna (stackIndex)
      const explodedY = box.stackIndex * (explodedOffset * 0.4);
      mesh.position.set(box.x, box.y + explodedY, box.z);

      // Edge outline
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeColor = isSelected ? 0xffffff : isHovered ? 0xfde047 : 0x0f172a;
      const lineMat = new THREE.LineBasicMaterial({
        color: edgeColor,
        linewidth: isSelected || isHovered ? 2 : 1,
      });
      const wire = new THREE.LineSegments(edges, lineMat);
      mesh.add(wire);

      // Top packaging tape stripe
      const tapeGeo = new THREE.PlaneGeometry(geoW * 0.94, Math.min(4.5, geoL * 0.28));
      const tapeMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.5,
        opacity: 0.7,
        transparent: true,
      });
      const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
      tapeMesh.rotation.x = -Math.PI / 2;
      tapeMesh.position.y = geoH / 2 + 0.01;
      mesh.add(tapeMesh);

      // Metadata for raycaster
      mesh.userData = { box };
      boxesGroup.add(mesh);
    });

    // Center camera target
    if (controlsRef.current && boxes.length > 0) {
      const maxY = boxes.reduce((m, b) => Math.max(m, b.y), pallet.height);
      controlsRef.current.target.set(0, (pallet.height + maxY) / 2, 0);
    }
  }, [boxes, pallet, explodedOffset, showWireframe, selectedBoxId, selectedItemId, hoveredBox?.id]);

  // Dimension Lines
  useEffect(() => {
    const dimGroup = dimensionsGroupRef.current;
    if (!dimGroup) return;

    while (dimGroup.children.length > 0) {
      dimGroup.remove(dimGroup.children[0]);
    }

    if (!showDimensions) return;

    const { width: pW, length: pL, height: pH } = pallet;
    const maxBoxY = boxes.length > 0 ? boxes.reduce((m, b) => Math.max(m, b.y + b.height / 2), pH) : pH;

    const createDimLine = (points: THREE.Vector3[], color: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
      return new THREE.Line(geo, mat);
    };

    const cyanColor = 0x38bdf8;
    const amberColor = 0xf59e0b;
    const emeraldColor = 0x34d399;

    // Width line (X)
    const lineZ = pL / 2 + 12;
    dimGroup.add(createDimLine([new THREE.Vector3(-pW / 2, 2, lineZ), new THREE.Vector3(pW / 2, 2, lineZ)], cyanColor));
    dimGroup.add(createDimLine([new THREE.Vector3(-pW / 2, 0, lineZ - 4), new THREE.Vector3(-pW / 2, 4, lineZ + 4)], cyanColor));
    dimGroup.add(createDimLine([new THREE.Vector3(pW / 2, 0, lineZ - 4), new THREE.Vector3(pW / 2, 4, lineZ + 4)], cyanColor));

    // Length line (Z)
    const lineX = pW / 2 + 14;
    dimGroup.add(createDimLine([new THREE.Vector3(lineX, 2, -pL / 2), new THREE.Vector3(lineX, 2, pL / 2)], amberColor));
    dimGroup.add(createDimLine([new THREE.Vector3(lineX - 4, 2, -pL / 2), new THREE.Vector3(lineX + 4, 2, -pL / 2)], amberColor));
    dimGroup.add(createDimLine([new THREE.Vector3(lineX - 4, 2, pL / 2), new THREE.Vector3(lineX + 4, 2, pL / 2)], amberColor));

    // Height vertical line (Y) - Altura da Carga Atual
    const cornerX = -pW / 2 - 12;
    const cornerZ = -pL / 2 - 12;
    dimGroup.add(createDimLine([new THREE.Vector3(cornerX, 0, cornerZ), new THREE.Vector3(cornerX, maxBoxY, cornerZ)], emeraldColor));
    dimGroup.add(createDimLine([new THREE.Vector3(cornerX - 4, 0, cornerZ), new THREE.Vector3(cornerX + 4, 0, cornerZ)], emeraldColor));
    dimGroup.add(createDimLine([new THREE.Vector3(cornerX - 4, maxBoxY, cornerZ), new THREE.Vector3(cornerX + 4, maxBoxY, cornerZ)], emeraldColor));

    // Altura Máxima Permitida do Pallet (Guia de Teto e Marcador 3D)
    const maxH = pallet.maxAllowedHeight;
    const ceilingColor = maxBoxY > maxH ? 0xf43f5e : 0xf59e0b;

    // Extensão da linha vertical até a altura máxima permitida
    if (maxH > maxBoxY) {
      const vertGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(cornerX, maxBoxY, cornerZ),
        new THREE.Vector3(cornerX, maxH, cornerZ)
      ]);
      const vertMat = new THREE.LineDashedMaterial({
        color: ceilingColor,
        dashSize: 4,
        gapSize: 3,
      });
      const vertLine = new THREE.Line(vertGeo, vertMat);
      vertLine.computeLineDistances();
      dimGroup.add(vertLine);
    }

    // Marcador de teto máximo na régua vertical
    dimGroup.add(createDimLine([new THREE.Vector3(cornerX - 6, maxH, cornerZ), new THREE.Vector3(cornerX + 6, maxH, cornerZ)], ceilingColor));
    dimGroup.add(createDimLine([new THREE.Vector3(cornerX, maxH, cornerZ - 6), new THREE.Vector3(cornerX, maxH, cornerZ + 6)], ceilingColor));

    // Gabarito / Moldura do teto máximo do pallet no espaço 3D (linha tracejada)
    const ceilPts = [
      new THREE.Vector3(-pW / 2, maxH, -pL / 2),
      new THREE.Vector3(pW / 2, maxH, -pL / 2),
      new THREE.Vector3(pW / 2, maxH, pL / 2),
      new THREE.Vector3(-pW / 2, maxH, pL / 2),
      new THREE.Vector3(-pW / 2, maxH, -pL / 2),
    ];
    const ceilGeo = new THREE.BufferGeometry().setFromPoints(ceilPts);
    const ceilMat = new THREE.LineDashedMaterial({
      color: ceilingColor,
      dashSize: 6,
      gapSize: 4,
      transparent: true,
      opacity: 0.85,
    });
    const ceilLine = new THREE.Line(ceilGeo, ceilMat);
    ceilLine.computeLineDistances();
    dimGroup.add(ceilLine);
  }, [pallet, boxes, showDimensions]);

  // Raycasting
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !boxesGroupRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    setMousePos({ x: e.clientX, y: e.clientY });

    mouseCoordsRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseCoordsRef.current, cameraRef.current);

    const intersects = raycasterRef.current.intersectObjects(boxesGroupRef.current.children, true);

    if (intersects.length > 0) {
      let targetObj: THREE.Object3D | null = intersects[0].object;
      while (targetObj && !targetObj.userData?.box) {
        targetObj = targetObj.parent;
      }
      if (targetObj && targetObj.userData?.box) {
        setHoveredBox(targetObj.userData.box);
        return;
      }
    }
    setHoveredBox(null);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredBox) {
      onSelectBox?.(hoveredBox);
      onSelectItemId?.(hoveredBox.itemId);
    } else {
      onSelectBox?.(null);
      onSelectItemId?.(null);
    }
  }, [hoveredBox, onSelectBox, onSelectItemId]);

  const setCameraPreset = (view: 'iso' | 'top' | 'front' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    const maxBoxY = boxes.length > 0 ? boxes.reduce((m, b) => Math.max(m, b.y), pallet.height) : pallet.height;
    const centerY = (pallet.height + maxBoxY) / 2;
    controls.target.set(0, centerY, 0);

    const distance = Math.max(pallet.width, pallet.length, maxBoxY) * 2.1;

    switch (view) {
      case 'iso':
        camera.position.set(distance * 0.8, distance * 0.7, distance * 0.9);
        break;
      case 'top':
        camera.position.set(0.1, distance * 1.5, 0.1);
        break;
      case 'front':
        camera.position.set(0, centerY, distance * 1.4);
        break;
      case 'side':
        camera.position.set(distance * 1.4, centerY, 0);
        break;
    }
    controls.update();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      id="pallet-3d-container"
      className="relative w-full h-full min-h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none"
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        id="pallet-canvas-3d"
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Camera & View Controls */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs z-10">
        <span className="text-slate-400 font-medium px-1 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          Vistas:
        </span>
        <button
          id="btn-cam-iso"
          onClick={() => setCameraPreset('iso')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
        >
          3D Isométrica
        </button>
        <button
          id="btn-cam-top"
          onClick={() => setCameraPreset('top')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
        >
          Topo (Planta)
        </button>
        <button
          id="btn-cam-front"
          onClick={() => setCameraPreset('front')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
        >
          Frontal
        </button>
        <button
          id="btn-cam-side"
          onClick={() => setCameraPreset('side')}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-lg transition-colors font-medium cursor-pointer"
        >
          Lateral
        </button>
        <button
          id="btn-cam-reset"
          onClick={() => setCameraPreset('iso')}
          title="Centralizar Câmera"
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top-Right Control Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          id="btn-toggle-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          className="p-2 bg-slate-900/85 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 shadow-lg transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Floating Legend / Dimension Badges */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
        {/* Dimension indicator badge */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/70 shadow-lg flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400"></span>
            <span>Largura: <strong className="text-white font-mono">{pallet.width} cm</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
            <span>Comprimento: <strong className="text-white font-mono">{pallet.length} cm</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
            <span>Altura Base: <strong className="text-white font-mono">{pallet.height} cm</strong></span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
            <span>Teto Máx: <strong className="text-amber-400 font-mono">{pallet.maxAllowedHeight} cm</strong></span>
          </div>
        </div>

        {/* Orbit Helper Tip */}
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <span>Girar: <strong>Botão Esquerdo</strong></span>
          <span>•</span>
          <span>Zoom: <strong>Scroll</strong></span>
          <span>•</span>
          <span>Mover: <strong>Botão Direito</strong></span>
        </div>
      </div>

      {/* Hover Tooltip for Box / Column Details */}
      {hoveredBox && (
        <div
          id="box-hover-tooltip"
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 shadow-2xl rounded-xl p-3 text-xs text-slate-100 min-w-[210px]"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y - 10}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm shadow-sm"
                style={{ backgroundColor: hoveredBox.color }}
              ></span>
              <span className="font-semibold text-white">{hoveredBox.itemName}</span>
            </div>
            <span className="bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded text-[10px]">
              Nível {hoveredBox.stackIndex + 1}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300">
            <div>Dimensões:</div>
            <div className="font-mono text-white text-right">
              {hoveredBox.width} × {hoveredBox.length} × {hoveredBox.height} cm
            </div>
            <div>Posição Pallet:</div>
            <div className="font-mono text-slate-300 text-right">
              X: {hoveredBox.x.toFixed(0)} | Z: {hoveredBox.z.toFixed(0)} cm
            </div>
            {hoveredBox.weight > 0 && (
              <>
                <div>Peso caixa:</div>
                <div className="font-mono text-white text-right">{hoveredBox.weight} kg</div>
              </>
            )}
            <div>Orientação:</div>
            <div className="text-right text-slate-400">
              {hoveredBox.isRotated ? 'Giro 90°' : 'Padrão'}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Coluna exclusiva (produtos lado a lado)
          </div>
        </div>
      )}
    </div>
  );
};
