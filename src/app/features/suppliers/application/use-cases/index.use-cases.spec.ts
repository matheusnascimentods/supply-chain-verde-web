import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ReportPdfExporter } from '../../infrastructure/report-pdf/index.exporter';
import { ReportsRepository } from '../../infrastructure/report/index.repository';
import { DownloadReportPdfUseCase } from './download-report-pdf/index.use-case';
import { GenerateReportUseCase } from './generate-report/index.use-case';

describe('supplier report use cases', () => {
  let reports: { generate: ReturnType<typeof vi.fn>; loadDetail: ReturnType<typeof vi.fn> };
  let exporter: { export: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    reports = { generate: vi.fn().mockReturnValue(of({})), loadDetail: vi.fn() };
    exporter = { export: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        { provide: ReportsRepository, useValue: reports },
        { provide: ReportPdfExporter, useValue: exporter },
      ],
    });
  });

  it('generates a report for the supplier and period', () => {
    const period = { periodStartAt: '2026-01-01', periodEndAt: '2026-01-31' };
    TestBed.inject(GenerateReportUseCase).execute(9, period).subscribe();
    expect(reports.generate).toHaveBeenCalledWith(9, period);
  });

  it('exports the report detail filled in the template', async () => {
    reports.loadDetail.mockReturnValue(
      of({
        reportId: 15,
        supplierId: 3,
        supplierCnpj: '12345678000190',
        supplierName: 'Fazenda Verde',
        periodStartAt: '2026-01-01',
        periodEndAt: '2026-06-30',
        totalCo2Kg: 10,
        totalBatchCount: 1,
        supplier: {},
        emissions: { byStage: [], byBatch: [], byMethod: [] },
        certifications: [],
      }),
    );
    await firstValueFrom(TestBed.inject(DownloadReportPdfUseCase).execute(15));
    expect(reports.loadDetail).toHaveBeenCalledWith(15);
    const [markdown, fileName] = exporter.export.mock.calls[0];
    expect(fileName).toBe('relatorio-sustentabilidade-12345678000190-2026-01-01-2026-06-30');
    expect(markdown).toContain('| Razão social | Fazenda Verde |');
    expect(markdown).toContain('| Telefone | — |');
    expect(markdown).toContain('Nenhuma certificação vigente no período.');
    expect(markdown).not.toContain('{{');
  });
});
