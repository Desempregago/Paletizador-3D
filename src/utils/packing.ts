import { BoxItem, PalletConfig, PlacedBox, ColumnSummary, PalletMetrics } from '../types';

export const PALLET_PRESETS: Record<string, PalletConfig> = {
  PBR: {
    name: 'Pallet PBR (Brasil)',
    width: 100,
    length: 120,
    height: 14.4,
    maxAllowedHeight: 180,
    maxAllowedWeight: 1500,
    woodColor: '#b48a56',
  },
  EURO: {
    name: 'Europallet (EPAL)',
    width: 80,
    length: 120,
    height: 14.4,
    maxAllowedHeight: 180,
    maxAllowedWeight: 1500,
    woodColor: '#b48a56',
  },
  ISO: {
    name: 'Pallet ISO / Industrial',
    width: 110,
    length: 110,
    height: 15,
    maxAllowedHeight: 200,
    maxAllowedWeight: 1800,
    woodColor: '#a87f4c',
  },
  CUSTOM: {
    name: 'Personalizado',
    width: 100,
    length: 120,
    height: 14.4,
    maxAllowedHeight: 180,
    maxAllowedWeight: 1500,
    woodColor: '#b48a56',
  },
};

export const DEFAULT_ITEM_COLORS = [
  '#3b82f6', // Azul Royal
  '#f59e0b', // Âmbar / Laranja
  '#10b981', // Esmeralda / Verde
  '#8b5cf6', // Roxo / Violeta
  '#ef4444', // Vermelho Coral
  '#06b6d4', // Ciano
];

/**
 * Calcula o espaço 2D ocupado por um item na base (chão do pallet)
 */
export function getItemFootprint(item: BoxItem) {
  const isRot = item.rotation === 90;
  const singleBoxW = isRot ? item.length : item.width;
  const singleBoxL = isRot ? item.width : item.length;

  const totalW = singleBoxW * Math.max(1, item.columnsCountX || 1);
  const totalL = singleBoxL * Math.max(1, item.columnsCountZ || 1);

  return {
    singleBoxW,
    singleBoxL,
    totalW,
    totalL,
    isRot,
  };
}

/**
 * Organiza automaticamente os produtos lado a lado no pallet sem sobreposição
 */
export function autoArrangeSideBySide(pallet: PalletConfig, items: BoxItem[]): BoxItem[] {
  if (items.length === 0) return [];

  // Ordena por maior área para empacotar melhor
  const itemsWithFootprint = items.map((it) => ({
    item: it,
    ...getItemFootprint(it),
  }));

  // Algoritmo de empacotamento em faixas (shelf/lane packing) no piso do pallet
  // Espaço disponível: de -pallet.width/2 a +pallet.width/2, e -pallet.length/2 a +pallet.length/2
  const updatedItems: BoxItem[] = [];
  
  let currentX = -pallet.width / 2;
  let currentZ = -pallet.length / 2;
  let laneDepth = 0; // maior comprimento Z nesta faixa

  for (const entry of itemsWithFootprint) {
    const { item, totalW, totalL } = entry;

    // Se ultrapassar a largura do pallet nesta faixa, inicia uma nova faixa ao longo de Z
    if (currentX + totalW > pallet.width / 2 && currentX > -pallet.width / 2) {
      currentX = -pallet.width / 2;
      currentZ += laneDepth + 2; // pequeno espaço entre faixas
      laneDepth = 0;
    }

    const posX = Math.round((currentX + totalW / 2) * 10) / 10;
    const posZ = Math.round((currentZ + totalL / 2) * 10) / 10;

    laneDepth = Math.max(laneDepth, totalL);
    currentX += totalW + 2; // pequeno espaço entre colunas adjacentes

    updatedItems.push({
      ...item,
      posX,
      posZ,
      positionMode: 'auto',
    });
  }

  return updatedItems;
}

/**
 * Constrói a pilha 3D completa baseada em COLUNAS LADO A LADO E LIVRES:
 * Os produtos NÃO se sobrepõem verticalmente; coexistem lado a lado na base do pallet
 * e cada produto empilha exclusivamente suas próprias caixas até 'stackCount'.
 */
export function buildPalletColumns(
  pallet: PalletConfig,
  items: BoxItem[]
): {
  placedBoxes: PlacedBox[];
  columnsSummary: ColumnSummary[];
  metrics: PalletMetrics;
} {
  const placedBoxes: PlacedBox[] = [];
  const columnsSummary: ColumnSummary[] = [];

  let totalBoxesCount = 0;
  let totalBoxesWeight = 0;
  let totalBoxesVolumeCm3 = 0;
  let maxTotalHeight = pallet.height;
  let totalFloorAreaOccupied = 0;

  // 1. Calcular footprints e verificar colisões entre itens no piso (plano X-Z)
  const footprints = items.map((it) => {
    const fp = getItemFootprint(it);
    const minX = it.posX - fp.totalW / 2;
    const maxX = it.posX + fp.totalW / 2;
    const minZ = it.posZ - fp.totalL / 2;
    const maxZ = it.posZ + fp.totalL / 2;

    const isOutOfBounds =
      minX < -pallet.width / 2 - 0.5 ||
      maxX > pallet.width / 2 + 0.5 ||
      minZ < -pallet.length / 2 - 0.5 ||
      maxZ > pallet.length / 2 + 0.5;

    return {
      item: it,
      ...fp,
      minX,
      maxX,
      minZ,
      maxZ,
      isOutOfBounds,
      hasCollision: false,
    };
  });

  // Verificar colisão par a par
  let anyCollision = false;
  let anyOutOfBounds = false;

  for (let i = 0; i < footprints.length; i++) {
    if (footprints[i].isOutOfBounds) {
      anyOutOfBounds = true;
    }
    for (let j = i + 1; j < footprints.length; j++) {
      const a = footprints[i];
      const b = footprints[j];

      // AABB 2D overlap check com tolerância de 0.5cm
      const overlapX = a.minX < b.maxX - 0.5 && a.maxX > b.minX + 0.5;
      const overlapZ = a.minZ < b.maxZ - 0.5 && a.maxZ > b.minZ + 0.5;

      if (overlapX && overlapZ) {
        a.hasCollision = true;
        b.hasCollision = true;
        anyCollision = true;
      }
    }
  }

  // 2. Gerar as caixas 3D para cada coluna de cada item
  let globalColIndex = 0;

  footprints.forEach((fp) => {
    const { item, singleBoxW, singleBoxL, totalW, totalL, isRot, hasCollision, isOutOfBounds } = fp;
    const colsX = Math.max(1, item.columnsCountX || 1);
    const colsZ = Math.max(1, item.columnsCountZ || 1);

    // Respeitar rigorosamente a altura máxima permitida do pallet
    const availableH = Math.max(0, pallet.maxAllowedHeight - pallet.height);
    const boxH = item.height > 0 ? item.height : 0.01;
    const maxAllowedBoxes = Math.max(1, Math.floor(availableH / boxH));
    const stackH = Math.min(Math.max(1, item.stackCount || 1), maxAllowedBoxes);

    const itemTotalBoxes = colsX * colsZ * stackH;
    const itemTotalWeight = itemTotalBoxes * (item.weight || 0);
    const itemVolume = itemTotalBoxes * (item.width * item.length * item.height);
    const itemStackHeight = stackH * item.height;
    const itemTotalHeightWithPallet = pallet.height + itemStackHeight;
    const itemExceedsMaxHeight = itemTotalHeightWithPallet > pallet.maxAllowedHeight;

    if (itemTotalHeightWithPallet > maxTotalHeight) {
      maxTotalHeight = itemTotalHeightWithPallet;
    }

    totalBoxesCount += itemTotalBoxes;
    totalBoxesWeight += itemTotalWeight;
    totalBoxesVolumeCm3 += itemVolume;
    totalFloorAreaOccupied += totalW * totalL;

    // Coordenadas das caixas em grid na base do item
    const startX = item.posX - totalW / 2 + singleBoxW / 2;
    const startZ = item.posZ - totalL / 2 + singleBoxL / 2;

    for (let cx = 0; cx < colsX; cx++) {
      for (let cz = 0; cz < colsZ; cz++) {
        const colCenterX = startX + cx * singleBoxW;
        const colCenterZ = startZ + cz * singleBoxL;

        // Empilhar verticalmente na coluna (de baixo para cima na base de madeira)
        for (let s = 0; s < stackH; s++) {
          const boxCenterY = pallet.height + s * item.height + item.height / 2;

          placedBoxes.push({
            id: `box-${item.id}-c${cx}_${cz}-s${s}`,
            itemId: item.id,
            itemName: item.name,
            color: item.color,
            columnIndex: globalColIndex,
            stackIndex: s,
            layerIndex: s, // para compatibilidade
            x: colCenterX,
            y: boxCenterY,
            z: colCenterZ,
            width: singleBoxW,
            height: item.height,
            length: singleBoxL,
            weight: item.weight || 0,
            isRotated: isRot,
          });
        }
        globalColIndex++;
      }
    }

    const palletArea = pallet.width * pallet.length;
    const itemAreaPct = palletArea > 0 ? ((totalW * totalL) / palletArea) * 100 : 0;

    columnsSummary.push({
      itemId: item.id,
      itemName: item.name,
      color: item.color,
      boxesCount: itemTotalBoxes,
      columnsCount: colsX * colsZ,
      columnHeight: itemStackHeight,
      totalHeightWithPallet: Math.round(itemTotalHeightWithPallet * 10) / 10,
      maxAllowedBoxes,
      exceedsMaxHeight: itemExceedsMaxHeight,
      footprintWidth: totalW,
      footprintLength: totalL,
      posX: item.posX,
      posZ: item.posZ,
      totalWeight: itemTotalWeight,
      areaUtilizationPct: Math.round(itemAreaPct * 10) / 10,
      hasCollision,
      isOutOfBounds,
    });
  });

  const palletArea = pallet.width * pallet.length;
  const floorEfficiency = palletArea > 0 ? (totalFloorAreaOccupied / palletArea) * 100 : 0;
  const palletWeight = 25; // kg
  const totalWeight = totalBoxesWeight + palletWeight;
  const totalVolumeM3 = totalBoxesVolumeCm3 / 1_000_000;

  // Lastro: quantidade de caixas no plano de base do estrado (stackIndex = 0)
  const boxesOnLastro = placedBoxes.filter((b) => b.stackIndex === 0).length;

  const metrics: PalletMetrics = {
    totalBoxes: totalBoxesCount,
    totalColumns: globalColIndex,
    totalHeight: Math.round(maxTotalHeight * 10) / 10,
    totalWeight: Math.round(totalWeight * 10) / 10,
    totalVolumeM3: Math.round(totalVolumeM3 * 100) / 100,
    floorAreaEfficiency: Math.round(floorEfficiency * 10) / 10,
    hasCollisions: anyCollision,
    hasOutOfBounds: anyOutOfBounds,
    exceedsMaxHeight: maxTotalHeight > pallet.maxAllowedHeight,
    exceedsMaxWeight: totalWeight > pallet.maxAllowedWeight,
    lastro: {
      totalBoxesOnLastro: boxesOnLastro,
      totalPalletAreaCm2: palletArea,
      occupiedAreaCm2: Math.round(totalFloorAreaOccupied),
      freeAreaCm2: Math.max(0, Math.round(palletArea - totalFloorAreaOccupied)),
      utilizationPct: Math.round(floorEfficiency * 10) / 10,
    },
  };

  return {
    placedBoxes,
    columnsSummary,
    metrics,
  };
}
