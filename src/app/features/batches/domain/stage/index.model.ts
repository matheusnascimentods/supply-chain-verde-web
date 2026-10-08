export const STAGE_TYPES = ['PRODUCTION', 'STORAGE', 'PROCESSING', 'TRANSPORT', 'DISTRIBUTION', 'RETAIL'] as const;
export type StageType = (typeof STAGE_TYPES)[number];
export const STAGE_TYPE_LABELS: Record<StageType, string> = {
  PRODUCTION: 'Produção',
  STORAGE: 'Armazenagem',
  PROCESSING: 'Processamento',
  TRANSPORT: 'Transporte',
  DISTRIBUTION: 'Distribuição',
  RETAIL: 'Varejo',
};

export const TRANSPORT_MODES = ['ROAD', 'RAIL', 'MARITIME', 'AIR'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];
export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  ROAD: 'Rodoviário',
  RAIL: 'Ferroviário',
  MARITIME: 'Marítimo',
  AIR: 'Aéreo',
};

export const FUEL_TYPES = ['DIESEL', 'BIODIESEL', 'ELECTRIC', 'GASOLINE', 'ETHANOL', 'AVIATION_KEROSENE', 'HEAVY_FUEL_OIL'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  DIESEL: 'Diesel',
  BIODIESEL: 'Biodiesel',
  ELECTRIC: 'Elétrico',
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  AVIATION_KEROSENE: 'Querosene de aviação',
  HEAVY_FUEL_OIL: 'Óleo combustível pesado',
};

export const CALCULATION_METHODS = ['DEFRA', 'GHG_PROTOCOL', 'IPCC', 'EMEP_EEA'] as const;
export type CalculationMethod = (typeof CALCULATION_METHODS)[number];
export const CALCULATION_METHOD_LABELS: Record<CalculationMethod, string> = {
  DEFRA: 'DEFRA',
  GHG_PROTOCOL: 'GHG Protocol',
  IPCC: 'IPCC',
  EMEP_EEA: 'EMEP/EEA',
};

export interface StageAddress {
  addressId: number;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  complement?: string | null;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface Transport {
  transportId: number;
  chainId: number;
  transportMode: TransportMode;
  distance: number;
  fuelType: FuelType;
  capacity: number;
}

export interface CarbonEmission {
  emissionId: number;
  chainId: number;
  emissionFactor: number;
  co2Kg: number;
  calculationMethod: CalculationMethod;
  calculatedAt: string;
}

export interface Stage {
  chainId: number;
  batchId: number;
  originAddress: StageAddress | null;
  destinationAddress: StageAddress | null;
  responsibleUserId: number;
  responsibleUserName: string;
  stageType: StageType;
  startedAt: string;
  endedAt: string | null;
  transport: Transport | null;
  emission: CarbonEmission | null;
}

export interface NewStage {
  stageType: StageType;
  startedAt: string;
  endedAt: string | null;
  originAddressId: number | null;
  destinationAddressId: number | null;
}

export interface NewTransport {
  transportMode: TransportMode;
  distance: number;
  fuelType: FuelType;
  capacity: number;
}
