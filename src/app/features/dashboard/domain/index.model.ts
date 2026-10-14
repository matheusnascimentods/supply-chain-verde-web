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

/** Emissão de CO₂ de um mês (`YYYY-MM`); meses sem emissão vêm com zero. */
export interface MonthlyEmission {
  month: string;
  co2Kg: number;
}

/** Intervalo de meses (`YYYY-MM`) do gráfico de emissões. */
export interface MonthRange {
  from: string;
  to: string;
}

/** Por que um intervalo não pode ir para a API. */
export type RangeProblem = 'missing' | 'order' | 'tooLong';
