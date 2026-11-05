import { Stage, StageType } from './stage/index.model';

export const BATCH_STATUSES = ['PENDING', 'ACTIVE', 'REJECTED'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Em andamento',
  REJECTED: 'Recusado',
};

export interface Batch {
  batchId: number;
  productId: number | null;
  productName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  // Mercado que pediu o lote (RF-13).
  marketId: number | null;
  marketName: string | null;
  status: BatchStatus;
  rejectionReason: string | null;
  quantity: number;
  // Lote pedido e ainda não produzido não tem data de produção.
  producedAt: string | null;
  currentStage: StageType | null;
  stages: Stage[];
}

export interface BatchPage {
  items: Batch[];
  page: number;
  totalPages: number;
  totalElements: number;
}

export interface NewBatch {
  productId: number;
  supplierId: number;
  quantity: number;
  producedAt: string;
}

export interface Page<T> {
  items: T[];
  totalPages: number;
}
