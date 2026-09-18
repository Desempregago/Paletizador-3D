import React from 'react';
import { BoxItem, PalletConfig, ColumnSummary } from '../types';
import { 
  Trash2, 
  Columns3, 
  RotateCw, 
  Scale, 
  AlertTriangle, 
  Move, 
  Ruler
} from 'lucide-react';
import { DEFAULT_ITEM_COLORS } from '../utils/packing';

interface ItemConfigCardProps {
  item: BoxItem;
  index: number;
  totalItems: number;
  pallet: PalletConfig;
  summary?: ColumnSummary;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate: (updated: BoxItem) => void;
  onRemove: () => void;
}

export const ItemConfigCard: React.FC<ItemConfigCardProps> = ({
  item,
  index,
  totalItems,
  pallet,
  summary,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}) => {
  const isRot = item.rotation === 90;
  const singleBoxW = isRot ? item.length : item.width;
  const singleBoxL = isRot ? item.width : item.length;
  const totalW = singleBoxW * (item.columnsCountX || 1);
  const totalL = singleBoxL * (item.columnsCountZ || 1);

  // Cálculo da capacidade de empilhamento vertical respeitando a altura máxima permitida do pallet
  const availableHeight = Math.max(0, pallet.maxAllowedHeight - pallet.height);
  const maxAllowedBoxes = Math.max(1, Math.floor(availableHeight / Math.max(1, item.height)));
  const currentStack = Math.min(item.stackCount || 1, maxAllowedBoxes);
  const totalItemBoxes = (item.columnsCountX || 1) * (item.columnsCountZ || 1) * currentStack;
  const columnLoadHeight = currentStack * item.height;
  const totalHeightWithPallet = Math.round((pallet.height + columnLoadHeight) * 10) / 10;
  const isAtMaxAllowed = currentStack >= maxAllowedBoxes;
  const singleBoxExceeds = (pallet.height + item.height) > pallet.maxAllowedHeight;

  const minX = -Math.floor(pallet.width / 2 - totalW / 2);
  const maxX = Math.floor(pallet.width / 2 - totalW / 2);
  const minZ = -Math.floor(pallet.length / 2 - totalL / 2);
  const maxZ = Math.floor(pallet.length / 2 - totalL / 2);

  return (
    <div
      id={`item-card-${item.id}`}
      onClick={onSelect}
      className={`bg-slate-900/95 border rounded-xl p-3 transition-all duration-200 shadow-md relative cursor-pointer ${
        summary?.hasCollision
          ? 'border-rose-500/80 bg-rose-950/20'
          : isSelected
          ? 'border-amber-500 ring-1 ring-amber-500/50 bg-slate-900'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header with color indicator, item name and action buttons */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Color Picker */}
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              id={`item-color-picker-${item.id}`}
              type="color"
              value={item.color}
              onChange={(e) => onUpdate({ ...item, color: e.target.value })}
              className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent"
              title="Mudar cor do produto"
            />
          </div>

          <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              id={`item-name-input-${item.id}`}
              type="text"
              value={item.name}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              className="bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none focus:bg-slate-800/80 px-1 py-0.5 rounded border border-transparent focus:border-amber-500/50 w-full truncate"
              placeholder={`Item ${index + 1}`}
            />
            <div className="text-[10px] text-slate-400 px-1 flex items-center gap-1.5 leading-none">
              <span>Item {index + 1}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                <Columns3 className="w-2.5 h-2.5" /> Coluna Independente
              </span>
            </div>
          </div>
        </div>

        {/* Rotate & Remove Button */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            id={`btn-rotate-item-${item.id}`}
            onClick={() => onUpdate({ ...item, rotation: item.rotation === 90 ? 0 : 90 })}
            title="Girar 90 graus no chão do pallet"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              item.rotation === 90
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800 border-slate-700/60'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          {totalItems > 1 && (
            <button
              id={`btn-delete-item-${item.id}`}
              onClick={onRemove}
              title="Remover este item do pallet"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Warning if collision with another item */}
      {summary?.hasCollision && (
        <div className="mb-2 p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
          <span>Atenção: Coluna sobreposta com outro produto. Reposicione-a.</span>
        </div>
      )}

      {/* Warning if height exceeds pallet limit */}
      {singleBoxExceeds && (
        <div className="mb-2 p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
          <span>Atenção: A caixa ({item.height} cm) + estrado ({pallet.height} cm) ultrapassa o limite do pallet ({pallet.maxAllowedHeight} cm).</span>
        </div>
      )}

      {/* Box Dimensions in Centimeters (Largura, Comprimento, Altura) */}
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <div className="flex items-center gap-1">
              <Ruler className="w-3 h-3 text-amber-400" />
              <span>Dimensões da Caixa (cm)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {item.width} × {item.length} × {item.height} cm
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* LARGURA (X) */}
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Largura (X)</label>
              <div className="relative">
                <input
                  id={`item-width-${item.id}`}
                  type="number"
                  min="5"
                  max="150"
                  value={item.width}
                  onChange={(e) =>
                    onUpdate({ ...item, width: Math.max(5, parseFloat(e.target.value) || 10) })
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none pr-5 h-7"
                />
                <span className="absolute right-1 top-1 text-[9px] text-slate-500 pointer-events-none">cm</span>
              </div>
            </div>

            {/* COMPRIMENTO (Z) */}
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Comprimento (Z)</label>
              <div className="relative">
                <input
                  id={`item-length-${item.id}`}
                  type="number"
                  min="5"
                  max="150"
                  value={item.length}
                  onChange={(e) =>
                    onUpdate({ ...item, length: Math.max(5, parseFloat(e.target.value) || 10) })
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none pr-5 h-7"
                />
                <span className="absolute right-1 top-1 text-[9px] text-slate-500 pointer-events-none">cm</span>
              </div>
            </div>

            {/* ALTURA (Y) */}
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Altura (Y)</label>
              <div className="relative">
                <input
                  id={`item-height-${item.id}`}
                  type="number"
                  min="5"
                  max="150"
                  value={item.height}
                  onChange={(e) => {
                    const newH = Math.max(5, parseFloat(e.target.value) || 10);
                    const newAvailH = Math.max(0, pallet.maxAllowedHeight - pallet.height);
                    const newMaxBoxes = Math.max(1, Math.floor(newAvailH / newH));
                    const newStack = Math.min(item.stackCount || 1, newMaxBoxes);
                    onUpdate({ ...item, height: newH, stackCount: newStack });
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:border-amber-400 focus:outline-none pr-5 h-7"
                />
                <span className="absolute right-1 top-1 text-[9px] text-slate-500 pointer-events-none">cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column Configuration: Stacking in height & Columns in base */}
        <div className="grid grid-cols-2 gap-2">
          {/* Stack in height (Alturas) */}
          <div className={`bg-slate-950/70 border rounded-lg p-2 flex flex-col justify-between ${
            isAtMaxAllowed ? 'border-amber-500/40' : 'border-slate-800/80'
          }`}>
            <label className="text-[10px] text-slate-300 font-medium flex items-center justify-between mb-1">
              <span>Empilhamento</span>
              <span className="text-amber-400 font-mono font-bold">{currentStack} / {maxAllowedBoxes} cx</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdate({ ...item, stackCount: Math.max(1, currentStack - 1) })}
                className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <input
                type="range"
                min="1"
                max={Math.max(1, maxAllowedBoxes)}
                value={currentStack}
                onChange={(e) =>
                  onUpdate({
                    ...item,
                    stackCount: Math.min(maxAllowedBoxes, Math.max(1, parseInt(e.target.value) || 1)),
                  })
                }
                className="flex-1 accent-amber-500 cursor-pointer h-1.5"
              />
              <button
                type="button"
                disabled={currentStack >= maxAllowedBoxes}
                onClick={() =>
                  onUpdate({
                    ...item,
                    stackCount: Math.min(maxAllowedBoxes, currentStack + 1),
                  })
                }
                title={
                  currentStack >= maxAllowedBoxes
                    ? `Altura máxima configurada do pallet atingida (${pallet.maxAllowedHeight} cm)`
                    : 'Aumentar empilhamento'
                }
                className="w-6 h-6 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 disabled:cursor-not-allowed rounded text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="text-[9px] text-slate-400 mt-1 flex justify-between items-center">
              <span>Alt. c/ pallet:</span>
              <span className={`font-mono font-semibold ${isAtMaxAllowed ? 'text-amber-400' : 'text-emerald-400'}`}>
                {totalHeightWithPallet} / {pallet.maxAllowedHeight} cm
              </span>
            </div>
          </div>

          {/* Base Layout: Columns in X & Z */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex flex-col justify-between">
            <label className="text-[10px] text-slate-300 font-medium flex items-center justify-between mb-1">
              <span>Base (X × Z)</span>
              <span className="text-sky-400 font-mono font-bold">{(item.columnsCountX || 1) * (item.columnsCountZ || 1)} cx</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Larg. (X):</span>
                <select
                  value={item.columnsCountX || 1}
                  onChange={(e) => onUpdate({ ...item, columnsCountX: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1 py-0.5 text-xs text-white font-mono cursor-pointer h-6"
                >
                  <option value="1">1 col</option>
                  <option value="2">2 col</option>
                  <option value="3">3 col</option>
                  <option value="4">4 col</option>
                </select>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Comp. (Z):</span>
                <select
                  value={item.columnsCountZ || 1}
                  onChange={(e) => onUpdate({ ...item, columnsCountZ: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-1 py-0.5 text-xs text-white font-mono cursor-pointer h-6"
                >
                  <option value="1">1 col</option>
                  <option value="2">2 col</option>
                  <option value="3">3 col</option>
                  <option value="4">4 col</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Free Positioning on Pallet: X and Z Sliders side by side for extreme vertical compactness */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-200">
              <Move className="w-3 h-3 text-amber-400" />
              <span>Posição no Chão do Pallet</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[9px] font-mono text-slate-300">
              <span>X: {Math.round(item.posX)} cm</span>
              <span className="text-slate-600">|</span>
              <span>Z: {Math.round(item.posZ)} cm</span>
            </div>
          </div>

          {/* Coordinate X and Z Sliders side-by-side in 2 columns */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {/* Eixo X */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Eixo X (Esq ↔ Dir):</span>
                <span className="font-mono text-slate-200">{Math.round(item.posX)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...item, posX: Math.max(minX, item.posX - 5), positionMode: 'manual' })}
                  className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-mono cursor-pointer"
                >
                  -5
                </button>
                <input
                  type="range"
                  min={minX}
                  max={maxX}
                  step="1"
                  value={item.posX}
                  onChange={(e) =>
                    onUpdate({ ...item, posX: parseFloat(e.target.value) || 0, positionMode: 'manual' })
                  }
                  className="flex-1 accent-amber-500 cursor-pointer h-1"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ ...item, posX: Math.min(maxX, item.posX + 5), positionMode: 'manual' })}
                  className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-mono cursor-pointer"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Eixo Z */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Eixo Z (Frente ↔ Fundo):</span>
                <span className="font-mono text-slate-200">{Math.round(item.posZ)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...item, posZ: Math.max(minZ, item.posZ - 5), positionMode: 'manual' })}
                  className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-mono cursor-pointer"
                >
                  -5
                </button>
                <input
                  type="range"
                  min={minZ}
                  max={maxZ}
                  step="1"
                  value={item.posZ}
                  onChange={(e) =>
                    onUpdate({ ...item, posZ: parseFloat(e.target.value) || 0, positionMode: 'manual' })
                  }
                  className="flex-1 accent-amber-500 cursor-pointer h-1"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ ...item, posZ: Math.min(maxZ, item.posZ + 5), positionMode: 'manual' })}
                  className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-mono cursor-pointer"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          {/* Quick Snap presets for this column */}
          <div className="flex items-center justify-between pt-0.5 text-[9px]">
            <span className="text-slate-500">Alinhar rápido:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdate({ ...item, posX: minX, posZ: minZ, positionMode: 'manual' })}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 text-[9px] transition-colors cursor-pointer"
              >
                Canto Sup.
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ ...item, posX: 0, posZ: 0, positionMode: 'manual' })}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 text-[9px] transition-colors cursor-pointer"
              >
                Centro
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ ...item, posX: maxX, posZ: maxZ, positionMode: 'manual' })}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 text-[9px] transition-colors cursor-pointer"
              >
                Canto Inf.
              </button>
            </div>
          </div>
        </div>

        {/* Weight and Color Presets */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5">
            <Scale className="w-3 h-3 text-slate-400" />
            <label className="text-[10px] text-slate-400">Peso:</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={item.weight}
              onChange={(e) => onUpdate({ ...item, weight: Math.max(0, parseFloat(e.target.value) || 0) })}
              className="w-12 bg-slate-950 border border-slate-700/80 rounded px-1 py-0.5 text-center font-mono text-xs text-white h-6"
            />
            <span className="text-[9px] text-slate-400">kg</span>
          </div>

          <div className="flex items-center gap-1">
            {DEFAULT_ITEM_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onUpdate({ ...item, color: col })}
                style={{ backgroundColor: col }}
                className={`w-3 h-3 rounded-full transition-transform cursor-pointer ${
                  item.color === col ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Real-time Sub-metrics for this Item */}
        <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800/80 flex items-center justify-between text-[10px]">
          <div>
            <span className="text-slate-400">Base: </span>
            <strong className="text-white font-mono">{totalW}×{totalL} cm</strong>
          </div>
          <div>
            <span className="text-slate-400">Alt. Carga: </span>
            <strong className="text-amber-400 font-mono">{totalHeightWithPallet} cm</strong>
            <span className="text-[9px] text-slate-500"> (lim: {pallet.maxAllowedHeight}cm)</span>
          </div>
          <div>
            <span className="text-slate-400">Total: </span>
            <strong className="text-emerald-400 font-mono">{totalItemBoxes} cx</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
