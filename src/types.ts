export interface PalletConfig {
  name: string;
  width: number; // Largura em cm (e.g. 100 cm para PBR)
  length: number; // Comprimento/Profundidade em cm (e.g. 120 cm para PBR)
  height: number; // Altura do estrado de madeira em cm (e.g. 14.4 cm)
  maxAllowedHeight: number; // Altura máxima permitida com carga em cm (e.g. 180 cm)
  maxAllowedWeight: number; // Peso máximo em kg (e.g. 1500 kg)
  woodColor: string;
}

export interface BoxItem {
  id: string;
  name: string;
  width: number; // cm (largura da caixa)
  length: number; // cm (comprimento / profundidade da caixa)
  height: number; // cm (altura da caixa)
  weight: number; // kg por caixa
  color: string;
  
  // Configuração de Coluna (Produtos lado a lado sem sobreposição entre itens)
  stackCount: number; // Quantidade de caixas empilhadas verticalmente nesta coluna (1 a 15)
  columnsCountX: number; // Quantidade de colunas deste item ao longo do eixo X (1 a 10)
  columnsCountZ: number; // Quantidade de colunas deste item ao longo do eixo Z (1 a 10)
  rotation: 0 | 90; // Rotação da caixa na base (0° ou 90°)
  
  // Posicionamento no Lastro do Pallet (cm em relação ao centro do pallet)
  posX: number; // cm
  posZ: number; // cm
  positionMode: 'auto' | 'manual'; // auto ou manual

  layersCount?: number;
  orientationPreference?: 'best_fit' | 'lengthwise' | 'widthwise';
  alternatePattern?: boolean;
}

export interface PlacedBox {
  id: string;
  itemId: string;
  itemName: string;
  color: string;
  columnIndex: number; // Índice da coluna
  stackIndex: number; // 0 = caixa no lastro (piso), 1 = segundo nível, etc.
  layerIndex: number; // Compatibilidade
  // Posição do centro da caixa no espaço 3D (em cm)
  x: number;
  y: number; // Altura
  z: number;
  // Dimensões da caixa instalada (cm)
  width: number; // ao longo do eixo X
  height: number; // ao longo do eixo Y
  length: number; // ao longo do eixo Z
  weight: number;
  isRotated: boolean;
}

export interface ColumnSummary {
  itemId: string;
  itemName: string;
  color: string;
  boxesCount: number;
  columnsCount: number;
  columnHeight: number; // Altura do topo da coluna (cm)
  totalHeightWithPallet?: number; // Altura total considerando o estrado de madeira (cm)
  maxAllowedBoxes?: number; // Quantidade máxima permitida de caixas empilhadas
  exceedsMaxHeight?: boolean; // Se esta coluna ultrapassa a altura máxima permitida do pallet
  footprintWidth: number; // Largura ocupada no lastro (cm)
  footprintLength: number; // Comprimento ocupado no lastro (cm)
  posX: number;
  posZ: number;
  totalWeight: number;
  areaUtilizationPct: number;
  hasCollision: boolean;
  isOutOfBounds: boolean;
}

export interface LastroMetrics {
  totalBoxesOnLastro: number; // Caixas na base de contato do pallet
  totalPalletAreaCm2: number;
  occupiedAreaCm2: number;
  freeAreaCm2: number;
  utilizationPct: number;
}

export interface PalletMetrics {
  totalBoxes: number;
  totalColumns: number;
  totalHeight: number; // Altura máxima observada com pallet (cm)
  totalWeight: number; // kg
  totalVolumeM3: number; // m³
  floorAreaEfficiency: number; // % do chão do pallet ocupado pelas bases das colunas
  hasCollisions: boolean;
  hasOutOfBounds: boolean;
  exceedsMaxHeight: boolean;
  exceedsMaxWeight: boolean;
  lastro: LastroMetrics;
}
