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
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, pallet }) => {
  const lastroBoxes = metrics.lastro?.totalBoxesOnLastro ?? metrics.totalColumns;
  const lastroPct = metrics.lastro?.utilizationPct ?? metrics.floorAreaEfficiency;

  return (
    <div
      id="metrics-bar"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
    >
      {/* Total Caixas na Carga */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Total de Caixas</span>
          <Package className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white">{metrics.totalBoxes}</span>
          <span className="text-xs text-slate-400">un</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">
          em {metrics.totalColumns} {metrics.totalColumns === 1 ? 'coluna' : 'colunas'}
        </div>
      </div>

      {/* Caixas no Lastro (Base de Contato) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Caixas no Lastro</span>
          <Compass className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-amber-400">{lastroBoxes}</span>
          <span className="text-xs text-slate-400">no piso</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">
          {lastroPct}% do estrado ocupado
        </div>
      </div>

      {/* Altura Máxima da Carga */}
      <div className={`bg-slate-900/90 border rounded-2xl p-3 flex flex-col justify-between ${
        metrics.exceedsMaxHeight ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Altura da Carga</span>
          <ArrowUpDown className={`w-4 h-4 ${metrics.exceedsMaxHeight ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className={`text-2xl font-bold font-mono ${metrics.exceedsMaxHeight ? 'text-rose-400' : 'text-white'}`}>
            {metrics.totalHeight}
          </span>
          <span className="text-xs text-slate-400">cm</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
          {metrics.exceedsMaxHeight ? (
            <span className="text-rose-400 flex items-center gap-0.5 font-medium">
              <AlertTriangle className="w-3 h-3" /> Excede ({pallet.maxAllowedHeight}cm)
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">
              ✓ Limite {pallet.maxAllowedHeight}cm (folga: {Math.max(0, pallet.maxAllowedHeight - metrics.totalHeight).toFixed(1)}cm)
            </span>
          )}
        </div>
      </div>

      {/* Peso Total Estimado */}
      <div className={`bg-slate-900/90 border rounded-2xl p-3 flex flex-col justify-between ${
        metrics.exceedsMaxWeight ? 'border-rose-500/60 bg-rose-950/20' : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Peso Total</span>
          <Weight className={`w-4 h-4 ${metrics.exceedsMaxWeight ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white">{metrics.totalWeight}</span>
          <span className="text-xs text-slate-400">kg</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">
          Pallet ({25}kg) + Carga
        </div>
      </div>

      {/* Volume da Carga */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Volume Útil</span>
          <Box className="w-4 h-4 text-violet-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white">{metrics.totalVolumeM3}</span>
          <span className="text-xs text-slate-400">m³</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">
          Volume útil total
        </div>
      </div>

      {/* Status de Coexistência no Lastro */}
      <div className={`rounded-2xl p-3 flex flex-col justify-between border ${
        metrics.hasCollisions
          ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
          : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
      }`}>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>Coexistência Lastro</span>
          {metrics.hasCollisions ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {metrics.hasCollisions ? (
            <span className="text-xs font-bold text-rose-300 leading-tight">
              Sobreposição no Piso!
            </span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-400 leading-tight">
                Lado a Lado (Livre)
              </span>
            </>
          )}
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-0.5">
          {metrics.hasCollisions ? 'Arraste para afastar' : 'Sem sobreposição'}
        </div>
      </div>
    </div>
  );
};
