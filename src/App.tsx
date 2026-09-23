import React, { useState, useMemo } from 'react';
import { PalletConfig, BoxItem, PlacedBox } from './types';
import { 
  PALLET_PRESETS, 
  DEFAULT_ITEM_COLORS, 
  buildPalletColumns, 
  autoArrangeSideBySide 
} from './utils/packing';
import { PalletViewer3D } from './components/PalletViewer3D';
import { LastroCanvasEditor } from './components/LastroCanvasEditor';
import { ItemConfigCard } from './components/ItemConfigCard';
import { MetricsBar } from './components/MetricsBar';
import { PalletSettingsModal } from './components/PalletSettingsModal';
import { 
  Plus, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  Compass,
  Eye,
  LayoutGrid,
  Grid2X2,
  List
} from 'lucide-react';

const INITIAL_COLUMN_ITEMS: BoxItem[] = [
  {
    id: 'col-item-1',
    name: 'Coluna A (Produto Azul)',
    width: 40,
    length: 35,
    height: 30,
    weight: 15,
    color: '#3b82f6', // Azul
    stackCount: 3, // 3 caixas empilhadas verticalmente
    columnsCountX: 1,
    columnsCountZ: 1,
    rotation: 0,
    posX: -25,
    posZ: -25,
    positionMode: 'manual',
  },
  {
    id: 'col-item-2',
    name: 'Coluna B (Produto Laranja)',
    width: 35,
    length: 35,
    height: 25,
    weight: 10,
    color: '#f59e0b', // Laranja
    stackCount: 4, // 4 caixas empilhadas verticalmente
    columnsCountX: 1,
    columnsCountZ: 1,
    rotation: 0,
    posX: 25,
    posZ: -25,
    positionMode: 'manual',
  },
  {
    id: 'col-item-3',
    name: 'Coluna C (Produto Verde)',
    width: 45,
    length: 30,
    height: 20,
    weight: 8,
    color: '#10b981', // Verde
    stackCount: 4, // 4 caixas empilhadas verticalmente
    columnsCountX: 1,
    columnsCountZ: 1,
    rotation: 0,
    posX: 0,
    posZ: 25,
    positionMode: 'manual',
  },
];

export default function App() {
  // Pallet base config (Default: PBR Standard 100 x 120 cm)
  const [pallet, setPallet] = useState<PalletConfig>(PALLET_PRESETS.PBR);
  const [isPalletModalOpen, setIsPalletModalOpen] = useState(false);

  // 1 to 6 items list (configured as side-by-side columns with free positioning)
  const [items, setItems] = useState<BoxItem[]>(INITIAL_COLUMN_ITEMS);

  // View Mode: 'split' (3D + Lastro 2D), '3d' (Full 3D), 'lastro' (Full 2D Lastro Drawing)
  const [viewMode, setViewMode] = useState<'split' | '3d' | 'lastro'>('split');
  // Metrics bar density state
  const [isMetricsCompact, setIsMetricsCompact] = useState<boolean>(false);

  // Cards display density / layout: 'grid' (2 side-by-side columns to see multiple cards at once) or 'list' (1 column)
  const [cardLayout, setCardLayout] = useState<'grid' | 'list'>('grid');

  // 3D Visualizer settings
  const [explodedOffset, setExplodedOffset] = useState<number>(0);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [selectedBox, setSelectedBox] = useState<PlacedBox | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(INITIAL_COLUMN_ITEMS[0].id);

  // Calculate full stack & metrics for side-by-side columns and lastro
  const { placedBoxes, columnsSummary, metrics } = useMemo(() => {
    return buildPalletColumns(pallet, items);
  }, [pallet, items]);

  // Função utilitária para garantir o cumprimento estrito da altura máxima do pallet
  const enforceItemLimits = (item: BoxItem, currentPallet: PalletConfig): BoxItem => {
    const availableH = Math.max(0, currentPallet.maxAllowedHeight - currentPallet.height);
    const boxH = item.height > 0 ? item.height : 0.01;
    const maxStack = Math.max(1, Math.floor(availableH / boxH));
    const safeStack = Math.min(Math.max(1, item.stackCount || 1), maxStack);
    return { ...item, stackCount: safeStack };
  };

  // Atualização do Pallet garantindo ajuste de todas as colunas existentes
  const handleUpdatePallet = (newPallet: PalletConfig) => {
    setPallet(newPallet);
    setItems((prevItems) =>
      prevItems.map((item) => enforceItemLimits(item, newPallet))
    );
  };

  // Handle Item Operations
  const handleUpdateItem = (index: number, updatedItem: BoxItem) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = enforceItemLimits(updatedItem, pallet);
      return copy;
    });
  };

  const handleUpdateSingleItem = (updatedItem: BoxItem) => {
    setItems((prev) =>
      prev.map((it) => (it.id === updatedItem.id ? enforceItemLimits(updatedItem, pallet) : it))
    );
  };

  const handleAddItem = () => {
    if (items.length >= 6) return;

    const newIndex = items.length;
    const nextColor = DEFAULT_ITEM_COLORS[newIndex % DEFAULT_ITEM_COLORS.length];

    const availableH = Math.max(0, pallet.maxAllowedHeight - pallet.height);
    const maxStack = Math.max(1, Math.floor(availableH / 25));
    const initialStack = Math.min(3, maxStack);

    const newItem: BoxItem = {
      id: `col-item-${Date.now()}`,
      name: `Coluna ${String.fromCharCode(65 + newIndex)}`,
      width: 30,
      length: 30,
      height: 25,
      weight: 8,
      color: nextColor,
      stackCount: initialStack,
      columnsCountX: 1,
      columnsCountZ: 1,
      rotation: 0,
      posX: 0,
      posZ: 0,
      positionMode: 'auto',
    };

    const newItemsList = [...items, newItem];
    const arranged = autoArrangeSideBySide(pallet, newItemsList);
    setItems(arranged);
    setSelectedItemId(newItem.id);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const removedId = items[index]?.id;
    const remaining = items.filter((_, i) => i !== index);
    setItems(remaining);
    if (selectedItemId === removedId) {
      setSelectedItemId(remaining[0]?.id || null);
    }
  };

  const handleAutoArrange = () => {
    const arranged = autoArrangeSideBySide(pallet, items);
    setItems(arranged);
  };

  const handleSelectPresetScenario = (type: '3cols' | '4quads' | '2towers') => {
    if (type === '3cols') {
      const safeItems = INITIAL_COLUMN_ITEMS.map((it) => enforceItemLimits(it, pallet));
      setItems(safeItems);
      setSelectedItemId(safeItems[0]?.id || null);
    } else if (type === '4quads') {
      const q: BoxItem[] = [
        {
          id: 'q1',
          name: 'Coluna 1 (Noroeste)',
          width: 35,
          length: 35,
          height: 25,
          weight: 12,
          color: '#3b82f6',
          stackCount: 4,
          columnsCountX: 1,
          columnsCountZ: 1,
          rotation: 0,
          posX: -25,
          posZ: -30,
          positionMode: 'manual',
        },
        {
          id: 'q2',
          name: 'Coluna 2 (Nordeste)',
          width: 35,
          length: 35,
          height: 25,
          weight: 12,
          color: '#f59e0b',
          stackCount: 4,
          columnsCountX: 1,
          columnsCountZ: 1,
          rotation: 0,
          posX: 25,
          posZ: -30,
          positionMode: 'manual',
        },
        {
          id: 'q3',
          name: 'Coluna 3 (Sudoeste)',
          width: 35,
          length: 35,
          height: 20,
          weight: 10,
          color: '#10b981',
          stackCount: 5,
          columnsCountX: 1,
          columnsCountZ: 1,
          rotation: 0,
          posX: -25,
          posZ: 30,
          positionMode: 'manual',
        },
        {
          id: 'q4',
          name: 'Coluna 4 (Sudeste)',
          width: 35,
          length: 35,
          height: 20,
          weight: 10,
          color: '#8b5cf6',
          stackCount: 5,
          columnsCountX: 1,
          columnsCountZ: 1,
          rotation: 0,
          posX: 25,
          posZ: 30,
          positionMode: 'manual',
        },
      ];
      const safeItems = q.map((it) => enforceItemLimits(it, pallet));
      setItems(safeItems);
      setSelectedItemId(safeItems[0].id);
    } else if (type === '2towers') {
      const t: BoxItem[] = [
        {
          id: 't1',
          name: 'Coluna Setor Esquerdo',
          width: 45,
          length: 50,
          height: 30,
          weight: 25,
          color: '#3b82f6',
          stackCount: 3,
          columnsCountX: 1,
          columnsCountZ: 2,
          rotation: 0,
          posX: -24,
          posZ: 0,
          positionMode: 'manual',
        },
        {
          id: 't2',
          name: 'Coluna Setor Direito',
          width: 45,
          length: 50,
          height: 25,
          weight: 20,
          color: '#ef4444',
          stackCount: 4,
          columnsCountX: 1,
          columnsCountZ: 2,
          rotation: 0,
          posX: 24,
          posZ: 0,
          positionMode: 'manual',
        },
      ];
      const safeItems = t.map((it) => enforceItemLimits(it, pallet));
      setItems(safeItems);
      setSelectedItemId(safeItems[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-4 py-1.5 sm:py-2">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Compass className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight">
                  Visualizador 3D & Lastro
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Planta Baixa & 3D
                </span>
              </div>
              <p className="hidden xl:block text-[11px] text-slate-400">
                Desenhe o lastro na planta 2D ou posicione colunas no estrado 3D lado a lado
              </p>
            </div>
          </div>

          {/* Quick Actions / Pallet Presets */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
              <button
                id="btn-mode-split"
                onClick={() => setViewMode('split')}
                title="Visualização 3D e Desenho do Lastro 2D integrados"
                className={`flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>3D + Lastro</span>
              </button>
              <button
                id="btn-mode-lastro"
                onClick={() => setViewMode('lastro')}
                title="Desenho do Lastro em tela ampla"
                className={`flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] transition-colors cursor-pointer ${
                  viewMode === 'lastro'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3" />
                <span>Lastro 2D</span>
              </button>
              <button
                id="btn-mode-3d"
                onClick={() => setViewMode('3d')}
                title="Visualizador 3D exclusivo"
                className={`flex items-center gap-1 px-2 py-1 rounded font-medium text-[11px] transition-colors cursor-pointer ${
                  viewMode === '3d'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>3D Puro</span>
              </button>
            </div>

            {/* Pallet Settings */}
            <button
              id="btn-open-pallet-settings"
              onClick={() => setIsPalletModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700/80 transition-all cursor-pointer shadow-sm"
            >
              <Settings className="w-3 h-3 text-amber-400" />
              <span>Pallet: <strong className="text-white font-mono">{pallet.width}×{pallet.length}</strong></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1720px] mx-auto w-full px-2 sm:px-4 py-2 sm:py-2.5 flex-1 flex flex-col gap-2.5">
        {/* KPI Metrics Dashboard Bar */}
        <MetricsBar
          metrics={metrics}
          pallet={pallet}
          isCompact={isMetricsCompact}
          onToggleCompact={() => setIsMetricsCompact((v) => !v)}
        />

        {/* Quick Layout Presets & Info Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              <strong>Cenários Prontos:</strong> Posicionamento inteligente no estrado sem sobreposição.
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="btn-preset-3cols"
              onClick={() => handleSelectPresetScenario('3cols')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
            >
              3 Colunas
            </button>
            <button
              id="btn-preset-4quads"
              onClick={() => handleSelectPresetScenario('4quads')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
            >
              4 Quadrantes
            </button>
            <button
              id="btn-preset-2towers"
              onClick={() => handleSelectPresetScenario('2towers')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
            >
              2 Setores
            </button>
            <button
              id="btn-auto-align-banner"
              onClick={handleAutoArrange}
              className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Alinhar Tudo
            </button>
          </div>
        </div>

        {/* Visualizers & Config Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
          {/* Main Visual Display (Left Column) */}
          <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-5 flex flex-col gap-3">
            {/* View Mode: SPLIT (3D on top, 2D Lastro underneath) */}
            {viewMode === 'split' && (
              <div className="flex flex-col gap-3">
                {/* 3D Pallet View with responsive height */}
                <div className="w-full h-[300px] sm:h-[340px] xl:h-[380px] 2xl:h-[450px] shrink-0 rounded-2xl overflow-hidden shadow-lg">
                  <PalletViewer3D
                    pallet={pallet}
                    boxes={placedBoxes}
                    columnsSummary={columnsSummary}
                    explodedOffset={explodedOffset}
                    onExplodedOffsetChange={setExplodedOffset}
                    showDimensions={showDimensions}
                    onToggleDimensions={() => setShowDimensions((v) => !v)}
                    showWireframe={showWireframe}
                    onToggleWireframe={() => setShowWireframe((v) => !v)}
                    onSelectBox={setSelectedBox}
                    selectedBoxId={selectedBox?.id}
                    selectedItemId={selectedItemId}
                    onSelectItemId={setSelectedItemId}
                  />
                </div>

                {/* 2D Lastro Interactive Drawing Canvas */}
                <LastroCanvasEditor
                  pallet={pallet}
                  items={items}
                  columnsSummary={columnsSummary}
                  lastroMetrics={metrics.lastro}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onUpdateItem={handleUpdateSingleItem}
                  onAutoArrange={handleAutoArrange}
                  onAddItem={handleAddItem}
                />
              </div>
            )}

            {/* View Mode: 2D LASTRO FULL */}
            {viewMode === 'lastro' && (
              <div className="flex flex-col gap-2.5">
                <LastroCanvasEditor
                  pallet={pallet}
                  items={items}
                  columnsSummary={columnsSummary}
                  lastroMetrics={metrics.lastro}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                  onUpdateItem={handleUpdateSingleItem}
                  onAutoArrange={handleAutoArrange}
                  onAddItem={handleAddItem}
                />
              </div>
            )}

            {/* View Mode: 3D FULL */}
            {viewMode === '3d' && (
              <div className="flex flex-col gap-2.5">
                <div className="w-full h-[460px] sm:h-[540px] xl:h-[620px] 2xl:h-[720px]">
                  <PalletViewer3D
                    pallet={pallet}
                    boxes={placedBoxes}
                    columnsSummary={columnsSummary}
                    explodedOffset={explodedOffset}
                    onExplodedOffsetChange={setExplodedOffset}
                    showDimensions={showDimensions}
                    onToggleDimensions={() => setShowDimensions((v) => !v)}
                    showWireframe={showWireframe}
                    onToggleWireframe={() => setShowWireframe((v) => !v)}
                    onSelectBox={setSelectedBox}
                    selectedBoxId={selectedBox?.id}
                    selectedItemId={selectedItemId}
                    onSelectItemId={setSelectedItemId}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: 1 to 6 Configurable Columns */}
          <div className="lg:col-span-6 xl:col-span-6 2xl:col-span-7 flex flex-col gap-2.5">
            {/* Items Header */}
            <div className="flex items-center justify-between bg-slate-900/85 px-2.5 py-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-bold text-white">Produtos & Colunas</h2>
                  <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                    {items.length} / 6
                  </span>
                </div>
                <span className="hidden sm:inline text-slate-600">|</span>
                <p className="hidden sm:block text-[11px] text-slate-400 truncate">
                  Configuração de caixas e posição
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {/* View Density Toggle: Grid (2 cols side-by-side) vs List (1 col) */}
                <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
                  <button
                    id="btn-layout-grid"
                    type="button"
                    onClick={() => setCardLayout('grid')}
                    title="Exibir em 2 colunas lado a lado (exibe muito mais cards sem rolar)"
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                      cardLayout === 'grid'
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Grid2X2 className="w-3 h-3" />
                    <span className="hidden md:inline text-[11px]">2 Colunas</span>
                  </button>
                  <button
                    id="btn-layout-list"
                    type="button"
                    onClick={() => setCardLayout('list')}
                    title="Exibir em lista única"
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                      cardLayout === 'list'
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3 h-3" />
                    <span className="hidden md:inline text-[11px]">Lista</span>
                  </button>
                </div>

                {/* Add Column Button (1 to 6 limit) */}
                <button
                  id="btn-add-item"
                  onClick={handleAddItem}
                  disabled={items.length >= 6}
                  title={items.length >= 6 ? 'Limite máximo de 6 itens atingido' : 'Adicionar novo produto'}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-slate-950 font-semibold text-[11px] rounded-lg shadow transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo Produto</span>
                </button>
              </div>
            </div>

            {/* Config Cards for each Item Column */}
            <div
              className={`overflow-y-auto max-h-[calc(100vh-170px)] sm:max-h-[calc(100vh-150px)] pr-1 custom-scrollbar ${
                cardLayout === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-2 items-start'
                  : 'flex flex-col gap-2'
              }`}
            >
              {items.map((item, idx) => {
                const summary = columnsSummary.find((c) => c.itemId === item.id);
                return (
                  <ItemConfigCard
                    key={item.id}
                    item={item}
                    index={idx}
                    totalItems={items.length}
                    pallet={pallet}
                    summary={summary}
                    isSelected={selectedItemId === item.id}
                    onSelect={() => setSelectedItemId(item.id)}
                    onUpdate={(updated) => handleUpdateItem(idx, updated)}
                    onRemove={() => handleRemoveItem(idx)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Pallet Settings Modal */}
      <PalletSettingsModal
        isOpen={isPalletModalOpen}
        onClose={() => setIsPalletModalOpen(false)}
        pallet={pallet}
        onUpdatePallet={handleUpdatePallet}
      />
    </div>
  );
}
