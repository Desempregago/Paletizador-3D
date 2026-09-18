import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PalletConfig, BoxItem, ColumnSummary, LastroMetrics } from '../types';
import { 
  RotateCw, 
  Move, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Printer, 
  Grid, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  Minus,
  Check,
  Compass,
  Layers,
  ArrowUpLeft,
  ArrowDownRight,
  Crosshair
} from 'lucide-react';

interface LastroCanvasEditorProps {
  pallet: PalletConfig;
  items: BoxItem[];
  columnsSummary: ColumnSummary[];
  lastroMetrics: LastroMetrics;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateItem: (item: BoxItem) => void;
  onAutoArrange: () => void;
  onAddItem?: () => void;
}

export const LastroCanvasEditor: React.FC<LastroCanvasEditorProps> = ({
  pallet,
  items,
  columnsSummary,
  lastroMetrics,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
  onAutoArrange,
  onAddItem,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [snapSize, setSnapSize] = useState<number>(5); // 1cm ou 5cm
  const [isDragging, setIsDragging] = useState(false);
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Canvas scaling to fit container
  const [scale, setScale] = useState<number>(2.5); // pixels por cm
  const paddingCm = 15; // margem em cm ao redor do pallet

  const palletW = pallet.width;
  const palletL = pallet.length;

  const totalWidthCm = palletW + paddingCm * 2;
  const totalLengthCm = palletL + paddingCm * 2;

  // Responsive scale calculation based on container width
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.clientWidth - 32;
      const calculatedScale = Math.min(Math.max(1.8, containerW / totalWidthCm), 4.2);
      setScale(calculatedScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [totalWidthCm]);

  // Coordinate Conversion: (cm in pallet space with (0,0) at center) to (px on 2D Lastro SVG)
  const cmToSvgX = useCallback(
    (xCm: number) => {
      return (xCm + palletW / 2 + paddingCm) * scale;
    },
    [palletW, paddingCm, scale]
  );

  const cmToSvgZ = useCallback(
    (zCm: number) => {
      return (zCm + palletL / 2 + paddingCm) * scale;
    },
    [palletL, paddingCm, scale]
  );

  const svgXToCm = useCallback(
    (svgX: number) => {
      return svgX / scale - palletW / 2 - paddingCm;
    },
    [palletW, paddingCm, scale]
  );

  const svgZToCm = useCallback(
    (svgZ: number) => {
      return svgZ / scale - palletL / 2 - paddingCm;
    },
    [palletL, paddingCm, scale]
  );

  // Snap helper
  const snap = (val: number, step: number) => {
    return Math.round(val / step) * step;
  };

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent, item: BoxItem) => {
    e.stopPropagation();
    onSelectItem(item.id);
    setIsDragging(true);
    setDragItemId(item.id);

    const svgElement = e.currentTarget.ownerSVGElement;
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const clickSvgX = e.clientX - rect.left;
    const clickSvgZ = e.clientY - rect.top;

    const clickCmX = svgXToCm(clickSvgX);
    const clickCmZ = svgZToCm(clickSvgZ);

    setDragOffset({
      x: clickCmX - item.posX,
      z: clickCmZ - item.posZ,
    });

    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragItemId) return;

    const svgElement = e.currentTarget as SVGSVGElement;
    const rect = svgElement.getBoundingClientRect();
    const currentSvgX = e.clientX - rect.left;
    const currentSvgZ = e.clientY - rect.top;

    const targetItem = items.find((it) => it.id === dragItemId);
    if (!targetItem) return;

    const rawCmX = svgXToCm(currentSvgX) - dragOffset.x;
    const rawCmZ = svgZToCm(currentSvgZ) - dragOffset.z;

    const snappedX = snap(rawCmX, snapSize);
    const snappedZ = snap(rawCmZ, snapSize);

    // Bounded within pallet boundaries
    const isRot = targetItem.rotation === 90;
    const singleW = isRot ? targetItem.length : targetItem.width;
    const singleL = isRot ? targetItem.width : targetItem.length;
    const totalW = singleW * (targetItem.columnsCountX || 1);
    const totalL = singleL * (targetItem.columnsCountZ || 1);

    const limitX = palletW / 2 - totalW / 2;
    const limitZ = palletL / 2 - totalL / 2;

    const clampedX = Math.max(-limitX, Math.min(limitX, snappedX));
    const clampedZ = Math.max(-limitZ, Math.min(limitZ, snappedZ));

    if (clampedX !== targetItem.posX || clampedZ !== targetItem.posZ) {
      onUpdateItem({
        ...targetItem,
        posX: clampedX,
        posZ: clampedZ,
        positionMode: 'manual',
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setDragItemId(null);
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    }
  };

  // Quick Alignments for Selected Item
  const selectedItem = items.find((it) => it.id === selectedItemId);
  const selectedSummary = columnsSummary.find((c) => c.itemId === selectedItemId);

  const alignItemTo = (pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center') => {
    if (!selectedItem) return;
    const isRot = selectedItem.rotation === 90;
    const singleW = isRot ? selectedItem.length : selectedItem.width;
    const singleL = isRot ? selectedItem.width : selectedItem.length;
    const totalW = singleW * (selectedItem.columnsCountX || 1);
    const totalL = singleL * (selectedItem.columnsCountZ || 1);

    const limitX = palletW / 2 - totalW / 2;
    const limitZ = palletL / 2 - totalL / 2;

    let newX = selectedItem.posX;
    let newZ = selectedItem.posZ;

    switch (pos) {
      case 'top-left':
        newX = -limitX;
        newZ = -limitZ;
        break;
      case 'top-right':
        newX = limitX;
        newZ = -limitZ;
        break;
      case 'bottom-left':
        newX = -limitX;
        newZ = limitZ;
        break;
      case 'bottom-right':
        newX = limitX;
        newZ = limitZ;
        break;
      case 'center':
        newX = 0;
        newZ = 0;
        break;
    }

    onUpdateItem({
      ...selectedItem,
      posX: Math.round(newX),
      posZ: Math.round(newZ),
      positionMode: 'manual',
    });
  };

  const rotateSelectedItem = () => {
    if (!selectedItem) return;
    onUpdateItem({
      ...selectedItem,
      rotation: selectedItem.rotation === 90 ? 0 : 90,
      positionMode: 'manual',
    });
  };

  return (
    <div
      ref={containerRef}
      id="lastro-canvas-editor"
      className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl"
    >
      {/* Top Header & Lastro Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Desenho Técnico do Lastro (Planta Baixa 2D)
              </h3>
              <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {pallet.width} × {pallet.length} cm
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Arraste e posicione as caixas diretamente no piso do estrado de madeira
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Snap Grid Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Grid className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <span className="text-[11px] text-slate-400 mr-1">Snap:</span>
            <button
              id="btn-snap-1cm"
              onClick={() => setSnapSize(1)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                snapSize === 1 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              1 cm
            </button>
            <button
              id="btn-snap-5cm"
              onClick={() => setSnapSize(5)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                snapSize === 5 ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              5 cm
            </button>
          </div>

          {/* Auto-Align Button */}
          <button
            id="btn-auto-arrange-lastro"
            onClick={onAutoArrange}
            title="Alinha todas as caixas lado a lado no lastro sem espaços vazios"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alinhar Lastro</span>
          </button>

          {/* Print/Export Button */}
          <button
            id="btn-print-lastro"
            onClick={() => setShowPrintModal(true)}
            title="Imprimir ou exportar desenho técnico do lastro com cotas"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Exportar Ficha</span>
          </button>
        </div>
      </div>

      {/* Lastro KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Caixas no Lastro</span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-amber-400">
              {lastroMetrics.totalBoxesOnLastro}
            </span>
            <span className="text-[10px] text-slate-500">un no piso</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Ocupação do Lastro</span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-white">
              {lastroMetrics.utilizationPct}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({(lastroMetrics.occupiedAreaCm2 / 10000).toFixed(2)} m²)
            </span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Área Livre Restante</span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-emerald-400">
              {(lastroMetrics.freeAreaCm2 / 10000).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500">m² livres</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Status do Desenho</span>
          <div className="mt-0.5 flex items-center gap-1.5">
            {columnsSummary.some((c) => c.hasCollision) ? (
              <span className="text-rose-400 text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Sobreposição!
              </span>
            ) : (
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                Sem colisão
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Box Floating Quick Inspector Bar */}
      {selectedItem && (
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-3.5 h-3.5 rounded-sm shadow-sm flex-shrink-0"
              style={{ backgroundColor: selectedItem.color }}
            />
            <div className="min-w-0">
              <span className="font-bold text-white truncate block">{selectedItem.name}</span>
              <span className="text-xs text-slate-300 font-mono font-medium">
                Caixa: <strong className="text-amber-400 font-bold">{selectedItem.width}L × {selectedItem.length}C × {selectedItem.height}A cm</strong> • Posição: (X: {Math.round(selectedItem.posX)}, Z: {Math.round(selectedItem.posZ)}) cm
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Rotate 90° button */}
            <button
              id="btn-quick-rotate-selected"
              onClick={rotateSelectedItem}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium rounded-lg border border-slate-700 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Girar 90° ({selectedItem.rotation}°)</span>
            </button>

            {/* Column Count X & Z quick adjust */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
              <span className="text-[10px] text-slate-400">Colunas:</span>
              <span className="font-mono text-white font-semibold">
                {(selectedItem.columnsCountX || 1)}×{(selectedItem.columnsCountZ || 1)}
              </span>
              <button
                onClick={() =>
                  onUpdateItem({
                    ...selectedItem,
                    columnsCountX: Math.min(6, (selectedItem.columnsCountX || 1) + 1),
                  })
                }
                title="Adicionar coluna no lastro (X)"
                className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center justify-center text-white cursor-pointer ml-1"
              >
                +
              </button>
            </div>

            {/* Quick Corners Align */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => alignItemTo('top-left')}
                title="Alinhar no Canto Noroeste (Topo Esquerdo)"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              >
                <ArrowUpLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => alignItemTo('center')}
                title="Centralizar no Lastro"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              >
                <Crosshair className="w-3 h-3" />
              </button>
              <button
                onClick={() => alignItemTo('bottom-right')}
                title="Alinhar no Canto Sudeste (Inferior Direito)"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              >
                <ArrowDownRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive 2D SVG Canvas of the Pallet Lastro */}
      <div className="relative w-full overflow-x-auto overflow-y-hidden bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center p-4 select-none">
        <svg
          id="lastro-svg-canvas"
          width={totalWidthCm * scale}
          height={totalLengthCm * scale}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="cursor-crosshair block shadow-inner"
        >
          <defs>
            {/* Grid Pattern: 10cm major, 5cm minor */}
            <pattern
              id="lastro-grid"
              width={10 * scale}
              height={10 * scale}
              patternUnits="userSpaceOnUse"
            >
              <line
                x1={5 * scale}
                y1="0"
                x2={5 * scale}
                y2={10 * scale}
                stroke="#1e293b"
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
              <line
                x1="0"
                y1={5 * scale}
                x2={10 * scale}
                y2={5 * scale}
                stroke="#1e293b"
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
              <rect
                x="0"
                y="0"
                width={10 * scale}
                height={10 * scale}
                fill="none"
                stroke="#334155"
                strokeWidth="1"
                opacity="0.4"
              />
            </pattern>

            {/* Wooden Planks Pattern for Pallet Base */}
            <pattern
              id="pallet-wood-planks"
              width={palletW * scale}
              height={(palletL / 7) * scale}
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="0"
                y="0"
                width={palletW * scale}
                height={(palletL / 7 - 1) * scale}
                fill="#855829"
                opacity="0.25"
              />
              <line
                x1="0"
                y1={(palletL / 7 - 1) * scale}
                x2={palletW * scale}
                y2={(palletL / 7 - 1) * scale}
                stroke="#45270c"
                strokeWidth="1.5"
                opacity="0.4"
              />
            </pattern>

            {/* Collision Hatching Pattern */}
            <pattern
              id="collision-hatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#f43f5e" strokeWidth="2.5" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect
            x="0"
            y="0"
            width={totalWidthCm * scale}
            height={totalLengthCm * scale}
            fill="#090d16"
          />
          <rect
            x="0"
            y="0"
            width={totalWidthCm * scale}
            height={totalLengthCm * scale}
            fill="url(#lastro-grid)"
          />

          {/* PALLET FLOOR AREA (O Lastro de Madeira) */}
          <g id="pallet-floor-boundary">
            {/* Outer Drop Shadow */}
            <rect
              x={cmToSvgX(-palletW / 2) + 4}
              y={cmToSvgZ(-palletL / 2) + 4}
              width={palletW * scale}
              height={palletL * scale}
              rx={4}
              fill="#000000"
              opacity="0.6"
            />
            {/* Wooden Deck Base */}
            <rect
              x={cmToSvgX(-palletW / 2)}
              y={cmToSvgZ(-palletL / 2)}
              width={palletW * scale}
              height={palletL * scale}
              rx={3}
              fill="#b2844c"
              stroke="#593b16"
              strokeWidth="2.5"
            />
            {/* Wood Planks Overlay */}
            <rect
              x={cmToSvgX(-palletW / 2)}
              y={cmToSvgZ(-palletL / 2)}
              width={palletW * scale}
              height={palletL * scale}
              fill="url(#pallet-wood-planks)"
            />

            {/* Center Origin Mark (0, 0) */}
            <circle
              cx={cmToSvgX(0)}
              cy={cmToSvgZ(0)}
              r="4"
              fill="#f59e0b"
              opacity="0.75"
            />
            <line
              x1={cmToSvgX(-6)}
              y1={cmToSvgZ(0)}
              x2={cmToSvgX(6)}
              y2={cmToSvgZ(0)}
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <line
              x1={cmToSvgX(0)}
              y1={cmToSvgZ(-6)}
              x2={cmToSvgX(0)}
              y2={cmToSvgZ(6)}
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          </g>

          {/* Pallet Edge Dimension Labels */}
          {/* Width (Top) */}
          <g>
            <line
              x1={cmToSvgX(-palletW / 2)}
              y1={cmToSvgZ(-palletL / 2) - 8}
              x2={cmToSvgX(palletW / 2)}
              y2={cmToSvgZ(-palletL / 2) - 8}
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <text
              x={cmToSvgX(0)}
              y={cmToSvgZ(-palletL / 2) - 12}
              fill="#38bdf8"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              Largura do Pallet: {palletW} cm
            </text>
          </g>

          {/* Length (Left) */}
          <g>
            <line
              x1={cmToSvgX(-palletW / 2) - 8}
              y1={cmToSvgZ(-palletL / 2)}
              x2={cmToSvgX(-palletW / 2) - 8}
              y2={cmToSvgZ(palletL / 2)}
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            <text
              x={cmToSvgX(-palletW / 2) - 12}
              y={cmToSvgZ(0)}
              fill="#f59e0b"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              transform={`rotate(-90 ${cmToSvgX(-palletW / 2) - 12} ${cmToSvgZ(0)})`}
            >
              Comprimento: {palletL} cm
            </text>
          </g>

          {/* ITEMS / BOX FOOTPRINTS ON THE LASTRO */}
          {items.map((item, idx) => {
            const isSelected = selectedItemId === item.id;
            const isDraggingThis = isDragging && dragItemId === item.id;
            const summary = columnsSummary.find((c) => c.itemId === item.id);
            const hasCollision = summary?.hasCollision ?? false;

            const isRot = item.rotation === 90;
            const singleBoxW = isRot ? item.length : item.width;
            const singleBoxL = isRot ? item.width : item.length;
            const colsX = Math.max(1, item.columnsCountX || 1);
            const colsZ = Math.max(1, item.columnsCountZ || 1);
            const totalW = singleBoxW * colsX;
            const totalL = singleBoxL * colsZ;

            const topLeftX = item.posX - totalW / 2;
            const topLeftZ = item.posZ - totalL / 2;

            const svgX = cmToSvgX(topLeftX);
            const svgZ = cmToSvgZ(topLeftZ);
            const svgW = totalW * scale;
            const svgL = totalL * scale;

            return (
              <g
                key={`lastro-item-${item.id}`}
                id={`lastro-box-group-${item.id}`}
                onPointerDown={(e) => handlePointerDown(e, item)}
                className="cursor-move group"
              >
                {/* Product Area Base Rectangle */}
                <rect
                  x={svgX}
                  y={svgZ}
                  width={svgW}
                  height={svgL}
                  rx={4}
                  fill={item.color}
                  fillOpacity={isSelected ? 0.95 : 0.85}
                  stroke={
                    hasCollision
                      ? '#f43f5e'
                      : isSelected
                      ? '#ffffff'
                      : '#0f172a'
                  }
                  strokeWidth={isSelected || hasCollision ? 3 : 1.5}
                  filter={isDraggingThis ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'}
                />

                {/* Collision Overlay Hatching */}
                {hasCollision && (
                  <rect
                    x={svgX}
                    y={svgZ}
                    width={svgW}
                    height={svgL}
                    rx={4}
                    fill="url(#collision-hatch)"
                    fillOpacity={0.6}
                    pointerEvents="none"
                  />
                )}

                {/* Grid of Individual Boxes within this Item Column */}
                {Array.from({ length: colsX }).map((_, cx) =>
                  Array.from({ length: colsZ }).map((_, cz) => {
                    const bX = svgX + cx * singleBoxW * scale;
                    const bZ = svgZ + cz * singleBoxL * scale;
                    const bW = singleBoxW * scale;
                    const bL = singleBoxL * scale;

                    return (
                      <rect
                        key={`subbox-${item.id}-${cx}-${cz}`}
                        x={bX}
                        y={bZ}
                        width={bW}
                        height={bL}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="1"
                        strokeDasharray={colsX > 1 || colsZ > 1 ? '3,2' : undefined}
                        pointerEvents="none"
                      />
                    );
                  })
                )}

                {/* Label inside footprint */}
                <text
                  x={svgX + svgW / 2}
                  y={svgZ + svgL / 2 - 4}
                  fill="#ffffff"
                  fontSize={Math.max(10, Math.min(13, svgW / 6))}
                  fontWeight="bold"
                  textAnchor="middle"
                  pointerEvents="none"
                  className="drop-shadow-md"
                >
                  {item.name}
                </text>
                <text
                  x={svgX + svgW / 2}
                  y={svgZ + svgL / 2 + 10}
                  fill="#f1f5f9"
                  fontSize={Math.max(9, Math.min(11, svgW / 7))}
                  fontFamily="monospace"
                  textAnchor="middle"
                  pointerEvents="none"
                  className="drop-shadow-sm"
                >
                  {totalW}×{totalL} cm ({colsX * colsZ} un)
                </text>

                {/* Selected Ring and Coordinate Bubble */}
                {isSelected && (
                  <g pointerEvents="none">
                    <rect
                      x={svgX - 3}
                      y={svgZ - 3}
                      width={svgW + 6}
                      height={svgL + 6}
                      rx={6}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                    />
                    {/* Badge top right of box */}
                    <rect
                      x={svgX + svgW - 32}
                      y={svgZ - 14}
                      width="36"
                      height="16"
                      rx="4"
                      fill="#0f172a"
                      stroke="#f59e0b"
                      strokeWidth="1"
                    />
                    <text
                      x={svgX + svgW - 14}
                      y={svgZ - 3}
                      fill="#f59e0b"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {item.rotation}°
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Help & Quick Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-amber-400" />
          <span>
            <strong>Dica de Desenho:</strong> Clique e arraste qualquer caixa no lastro para reposicionar. As caixas alinham automaticamente com a grade ({snapSize} cm).
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span>Madeira do Pallet</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span>Sobreposição</span>
          </span>
        </div>
      </div>

      {/* Export / Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <h4 className="text-base font-bold text-white">Ficha Técnica do Lastro</h4>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3 font-mono text-slate-200">
              <div className="text-center font-bold text-sm text-white border-b border-slate-800 pb-2">
                PLANO DE LASTRO • PALLET {pallet.name} ({pallet.width}×{pallet.length} cm)
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Total de Caixas no Piso: <strong>{lastroMetrics.totalBoxesOnLastro} caixas</strong></div>
                <div>Aproveitamento do Piso: <strong>{lastroMetrics.utilizationPct}%</strong></div>
                <div>Área Ocupada: <strong>{lastroMetrics.occupiedAreaCm2} cm²</strong></div>
                <div>Área Livre: <strong>{lastroMetrics.freeAreaCm2} cm²</strong></div>
              </div>

              <div className="border-t border-slate-800 pt-2">
                <div className="font-bold text-slate-300 mb-1.5">Produtos no Lastro:</div>
                <div className="space-y-1">
                  {columnsSummary.map((cs, i) => (
                    <div key={cs.itemId} className="flex justify-between text-[11px] bg-slate-900/60 p-1.5 rounded">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cs.color }} />
                        {cs.itemName}
                      </span>
                      <span>
                        {cs.columnsCount} colunas ({cs.footprintWidth}×{cs.footprintLength}cm) • Alt: {cs.columnHeight}cm
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Desenho
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
