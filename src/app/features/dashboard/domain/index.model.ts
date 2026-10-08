import type { ProductUnit, StageType } from '../../batches';

export interface RecentBatch {
  batchId: number;
  productName: string;
  supplierName: string;
  quantity: number;
  unit: ProductUnit;
  status: StageType;
}

export interface DashboardSummary {
  activeBatches: number;
  expiringCertifications: number;
  suppliers: number;
  monthlyEmissionKgCo2e: number;
  recentBatches: RecentBatch[];
}

/** Quantos dos lotes recentes estão em cada etapa. */
export interface StageShare {
  stage: StageType;
  count: number;
  percent: number;
}
