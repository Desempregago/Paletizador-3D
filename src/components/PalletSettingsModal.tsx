import React from 'react';
import { PalletConfig } from '../types';
import { PALLET_PRESETS } from '../utils/packing';
import { X, Check, Settings2, Sliders } from 'lucide-react';

interface PalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pallet: PalletConfig;
  onUpdatePallet: (p: PalletConfig) => void;
}

export const PalletSettingsModal: React.FC<PalletSettingsModalProps> = ({
  isOpen,
  onClose,
  pallet,
  onUpdatePallet,
}) => {
  if (!isOpen) return null;

  const handleSelectPreset = (key: string) => {
    const preset = PALLET_PRESETS[key];
    if (preset) {
      onUpdatePallet({
        ...preset,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-semibold text-white">Configurar Dimensões do Pallet</h3>
          </div>
          <button
            id="btn-close-pallet-settings"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Padrões / Presets */}
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-2">
            Modelos Padrão de Pallet:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PALLET_PRESETS).filter(([k]) => k !== 'CUSTOM').map(([key, p]) => {
              const isSelected = pallet.width === p.width && pallet.length === p.length;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectPreset(key)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold">{key}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {p.width} × {p.length} cm
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Medidas em centímetros */}
        <div className="space-y-3 pt-2">
          <label className="text-xs text-slate-300 font-medium block">
            Medidas Personalizadas (Centímetros):
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-sky-400 block mb-1.5">Largura (X)</label>
              <div className="relative">
                <input
                  id="pallet-width-input"
                  type="number"
                  min="1"
                  step="any"
                  value={pallet.width || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdatePallet({
                      ...pallet,
                      width: isNaN(val) ? 0 : val,
                    });
                  }}
                  className="w-full h-10 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-center font-mono font-bold text-base text-white focus:outline-none pr-6 pl-2"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none font-mono">
                  cm
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-amber-400 block mb-1.5">Comprimento (Z)</label>
              <div className="relative">
                <input
                  id="pallet-length-input"
                  type="number"
                  min="1"
                  step="any"
                  value={pallet.length || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdatePallet({
                      ...pallet,
                      length: isNaN(val) ? 0 : val,
                    });
                  }}
                  className="w-full h-10 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-center font-mono font-bold text-base text-white focus:outline-none pr-6 pl-2"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none font-mono">
                  cm
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-emerald-400 block mb-1.5">Altura Madeira</label>
              <div className="relative">
                <input
                  id="pallet-height-input"
                  type="number"
                  min="0"
                  step="any"
                  value={pallet.height || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdatePallet({
                      ...pallet,
                      height: isNaN(val) ? 0 : val,
                    });
                  }}
                  className="w-full h-10 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-center font-mono font-bold text-base text-white focus:outline-none pr-6 pl-2"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none font-mono">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Altura Máxima Permitida (Limite de caminhão / porta-paletes) */}
          <div className="pt-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <span>Altura Máxima Permitida:</span>
              </label>
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {pallet.maxAllowedHeight} cm
              </span>
            </div>
            <div className="relative">
              <input
                id="pallet-max-height-input"
                type="number"
                min="1"
                step="any"
                value={pallet.maxAllowedHeight || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePallet({
                    ...pallet,
                    maxAllowedHeight: isNaN(val) ? 0 : val,
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                cm (Total com estrado)
              </span>
            </div>

            {/* Quick Presets for Logistics Heights */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Padrões:</span>
              {[150, 180, 200, 220, 240].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onUpdatePallet({ ...pallet, maxAllowedHeight: h })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                    pallet.maxAllowedHeight === h
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {h}cm
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              ✓ O empilhamento de todas as colunas é limitado automaticamente para não ultrapassar este teto.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            id="btn-confirm-pallet-settings"
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Salvar e Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
