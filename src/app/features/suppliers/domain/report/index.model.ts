import type { CalculationMethod, ProductUnit, StageType } from '../../../batches';
import { SupplierAddress, SupplierCertification } from '../index.model';

export interface Report {
  reportId: number;
  supplierId: number;
  supplierCnpj?: string | null;
  supplierName?: string | null;
  periodStartAt: string;
  periodEndAt: string;
  totalCo2Kg: number;
  totalBatchCount: number;
  generatedAt?: string | null;
}

export interface ReportPeriod {
  periodStartAt: string;
  periodEndAt: string;
}

/** Detalhe do relatório com os dados do período usados no PDF. */
export interface ReportDetail extends Report {
  trackedProductCount?: number | null;
  supplier: { phone?: string | null; address?: SupplierAddress | null };
  emissions: {
    byStage: { stageType: StageType; co2Kg: number }[];
    byBatch: { batchId: number; productName: string; quantity: number; unit: ProductUnit; co2Kg: number }[];
    byMethod: { calculationMethod: CalculationMethod; emissionFactor: number; co2Kg: number }[];
  };
  certifications: SupplierCertification[];
}
