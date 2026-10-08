import type { CarbonEmission, Stage, StageAddress } from '../../batches';

export interface BatchTraceability {
  batchId: number;
  productName: string | null;
  supplierName: string | null;
  quantity: number;
  producedAt: string;
  stages: Stage[];
  totalCo2Kg: number;
}

export interface CarbonFootprint {
  batchId: number;
  totalCo2Kg: number;
  emissionsByStage: CarbonEmission[];
}

export type { CarbonEmission, Stage, StageAddress };
