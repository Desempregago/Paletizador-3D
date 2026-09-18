import React from 'react';
import { ColumnSummary, PalletConfig } from '../types';
import { 
  Columns3, 
  Sliders, 
  Sparkles, 
  Move, 
  AlertTriangle, 
  Check, 
  Eye 
} from 'lucide-react';

interface ColumnLayoutInspectorProps {
  columnsSummary: ColumnSummary[];
  pallet: PalletConfig;
  explodedOffset: number;
  onExplodedOffsetChange: (val: number) => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  showWireframe: boolean;
  onToggleWireframe: () => void;
  onAutoArrange: () => void;
  selectedItemId?: string | null;
  onSelectItemId?: (id: string | null) => void;
}

export const ColumnLayoutInspector: React.FC<ColumnLayoutInspectorProps> = ({
  columnsSummary,
  pallet,
  explodedOffset,
  onExplodedOffsetChange,
  showDimensions,
  onToggleDimensions,
  showWireframe,
  onToggleWireframe,
  onAutoArrange,
  selectedItemId,
  onSelectItemId,
}) => {
  return (
    <div
      id="column-inspector-panel"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-md"
    >
      {/* Panel Header & Auto Arrange */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Mapa de Colunas no Pallet</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-auto-arrange-columns"
            onClick={onAutoArrange}
            title="Distribui os produtos automaticamente lado a lado sem sobreposição"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl shadow transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alinhar Lado a Lado</span>
          </button>

          <button
            id="btn-toggle-dimensions"
            onClick={onToggleDimensions}
            title="Exibir ou ocultar cotas e medidas em 3D"
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              showDimensions
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Cotas 3D
          </button>
        </div>
      </div>

      {/* Exploded View Slider for vertical inspection */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Separar Caixas na Coluna (Vista Vertical)
          </span>
          <span className="font-mono text-amber-400 font-semibold">{explodedOffset}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="slider-exploded-view"
            type="range"
            min="0"
            max="100"
            step="1"
            value={explodedOffset}
            onChange={(e) => onExplodedOffsetChange(parseInt(e.target.value) || 0)}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          {explodedOffset > 0 && (
            <button
              id="btn-reset-exploded"
              onClick={() => onExplodedOffsetChange(0)}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer whitespace-nowrap"
            >
              Resetar
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-400">
          Afasta verticalmente as caixas empilhadas dentro de cada coluna para inspecionar cada nível.
        </p>
      </div>

      {/* Columns List & Coordinates */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between px-1">
          <span>Setores e Posições no Piso</span>
          <span>{columnsSummary.length} {columnsSummary.length === 1 ? 'produto' : 'produtos'}</span>
        </div>

        {columnsSummary.map((cs) => {
          const isSelected = selectedItemId === cs.itemId;
          return (
            <div
              key={`column-summary-${cs.itemId}`}
              onClick={() => onSelectItemId?.(isSelected ? null : cs.itemId)}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                cs.hasCollision
                  ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400'
                  : isSelected
                  ? 'bg-slate-800 border-amber-500/80 ring-1 ring-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: cs.color }}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                    <span className="truncate">{cs.itemName}</span>
                    {cs.hasCollision && (
                      <span className="text-rose-400 flex items-center gap-0.5 text-[10px]">
                        <AlertTriangle className="w-3 h-3" /> Colisão
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Área: {cs.footprintWidth}×{cs.footprintLength} cm • Pos: (X: {Math.round(cs.posX)}, Z: {Math.round(cs.posZ)})
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <div className="font-mono font-semibold text-white">
                  {cs.boxesCount} caixas
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {cs.columnsCount} {cs.columnsCount === 1 ? 'coluna' : 'colunas'} • Alt. c/ pallet: {cs.totalHeightWithPallet ?? (pallet.height + cs.columnHeight)} cm
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
