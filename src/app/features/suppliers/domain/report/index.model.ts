export interface Report {
  reportId: number;
  supplierId: number;
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
