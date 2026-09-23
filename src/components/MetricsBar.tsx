import React from 'react';
import { PalletMetrics, PalletConfig } from '../types';
import { 
  Package, 
  ArrowUpDown, 
  Weight, 
  Box, 
  Compass, 
  AlertTriangle, 
  Columns3,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface MetricsBarProps {
  metrics: PalletMetrics;
  pallet: PalletConfig;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ 
  metrics, 
  pallet, 
  isCompact = false,
  onToggleCompact 
}) => {
  const lastroBoxes = metrics.lastro?.totalBoxesOnLastro ?? metrics.totalColumns;
  const lastroPct = metrics.lastro?.utilizationPct ?? metrics.floorAreaEfficiency;

  if (isCompact) {
    return (
      <div 
        id="metrics-bar-compact"
        className="bg-slate-900/95 border border-slate-800 rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs shadow-sm"
      >
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Caixas:</span>
            <span className="font-bold font-mono text-white">{metrics.totalBoxes} un</span>
            <span className="text-[10px] text-slate-500 font-mono">({metrics.totalColumns} col)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Lastro:</span>
            <span className="font-bold font-mono text-amber-400">{lastroBoxes} un</span>
            <span className="text-[10px] text-slate-500 font-mono">({lastroPct}%)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className={`w-3.5 h-3.5 ${metrics.exceedsMaxHeight ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400">Altura:</span>
            <span className={`font-bold font-mono ${metrics.exceedsMaxHeight ? 'text-rose-400' : 'text-white'}`}>
              {metrics.totalHeight} cm
            </span>
            <span className="text-[10px] text-slate-500 font-mono">(Máx: {pallet.maxAllowedHeight}cm)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Weight className={`w-3.5 h-3.5 ${metrics.exceedsMaxWeight ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400">Peso:</span>
            <span className="font-bold font-mono text-white">{metrics.totalWeight} kg</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-slate-400">Volume:</span>
            <span className="font-bold font-mono text-white">{metrics.totalVolumeM3} m³</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {metrics.hasCollisions ? (
            <span className="text-rose-400 text-[11px] font-bold flex items-center gap-1 bg-rose-950/40 border border-rose-500/40 px-2 py-0.5 rounded-md">
              <AlertTriangle className="w-3 h-3" /> Sobreposição!
            </span>
          ) : (
            <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" /> Lado a Lado
            </span>
          )}

          {onToggleCompact && (
            <button
              onClick={onToggleCompact}
              title="Expandir métricas detalhadas"
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Expandir
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        id="metrics-bar"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
      >
        {/* Total Caixas na Carga */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Total de Caixas</span>
            <Package className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">{metrics.totalBoxes}</span>
            <span className="text-[10px] text-slate-400">un</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            em {metrics.totalColumns} {metrics.totalColumns === 1 ? 'coluna' : 'colunas'}
          </div>
        </div>

        {/* Caixas no Lastro (Base de Contato) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Caixas no Lastro</span>
            <Compass className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-amber-400">{lastroBoxes}</span>
            <span className="text-[10px] text-slate-400">no piso</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {lastroPct}% estrado ocupado
          </div>
        </div>

        {/* Altura Máxima da Carga */}
        <div className={`bg-slate-900/90 border rounded-xl p-2 sm:p-2.5 flex flex-col justify-between ${
          metrics.exceedsMaxHeight ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Altura Carga</span>
            <ArrowUpDown className={`w-3.5 h-3.5 ${metrics.exceedsMaxHeight ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className={`text-lg sm:text-xl font-bold font-mono ${metrics.exceedsMaxHeight ? 'text-rose-400' : 'text-white'}`}>
              {metrics.totalHeight}
            </span>
            <span className="text-[10px] text-slate-400">cm</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
            {metrics.exceedsMaxHeight ? (
              <span className="text-rose-400 flex items-center gap-0.5 font-medium">
                <AlertTriangle className="w-2.5 h-2.5" /> Excede ({pallet.maxAllowedHeight}cm)
              </span>
            ) : (
              <span className="text-emerald-400 font-medium truncate">
                ✓ Máx {pallet.maxAllowedHeight}cm
              </span>
            )}
          </div>
        </div>

        {/* Peso Total Estimado */}
        <div className={`bg-slate-900/90 border rounded-xl p-2 sm:p-2.5 flex flex-col justify-between ${
          metrics.exceedsMaxWeight ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Peso Total</span>
            <Weight className={`w-3.5 h-3.5 ${metrics.exceedsMaxWeight ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">{metrics.totalWeight}</span>
            <span className="text-[10px] text-slate-400">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Pallet ({25}kg) + Carga
          </div>
        </div>

        {/* Volume da Carga */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Volume Útil</span>
            <Box className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">{metrics.totalVolumeM3}</span>
            <span className="text-[10px] text-slate-400">m³</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Volume útil total
          </div>
        </div>

        {/* Status de Coexistência no Lastro */}
        <div className={`rounded-xl p-2 sm:p-2.5 flex flex-col justify-between border ${
          metrics.hasCollisions
            ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span>Coexistência</span>
            {metrics.hasCollisions ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            {metrics.hasCollisions ? (
              <span className="text-xs font-bold text-rose-300 leading-tight">
                Sobreposição!
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-bold text-emerald-400 leading-tight">
                  Lado a Lado
                </span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center justify-between">
            <span>{metrics.hasCollisions ? 'Arraste p/ afastar' : 'Sem colisão'}</span>
            {onToggleCompact && (
              <button
                onClick={onToggleCompact}
                title="Minimizar barra de métricas"
                className="text-[9px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Recolher
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
