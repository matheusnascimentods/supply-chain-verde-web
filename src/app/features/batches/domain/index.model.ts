import { Stage, StageType } from './stage/index.model';

export interface Batch {
  batchId: number;
  productId: number | null;
  productName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  quantity: number;
  producedAt: string;
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
