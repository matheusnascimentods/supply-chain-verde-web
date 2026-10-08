import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReportsRepository } from '../../infrastructure/report/index.repository';
import { GenerateReportUseCase } from '../use-cases/generate-report/index.use-case';
import { SupplierReportsFacade } from './index.facade';

describe('SupplierReportsFacade', () => {
  const report = { reportId: 1, supplierId: 9, periodStartAt: '2026-01-01', periodEndAt: '2026-01-31', totalCo2Kg: 10, totalBatchCount: 2 };
  const period = { periodStartAt: '2026-01-01', periodEndAt: '2026-01-31' };
  let repository: { loadBySupplier: ReturnType<typeof vi.fn> };
  let generate: { execute: ReturnType<typeof vi.fn> };
  let facade: SupplierReportsFacade;

  beforeEach(() => {
    repository = { loadBySupplier: vi.fn().mockReturnValue(of({ items: [report], totalPages: 3 })) };
    generate = { execute: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({
      providers: [
        SupplierReportsFacade,
        { provide: ReportsRepository, useValue: repository },
        { provide: GenerateReportUseCase, useValue: generate },
      ],
    });
    facade = TestBed.inject(SupplierReportsFacade);
    facade.open(9);
  });

  it('loads the first page of reports of the supplier', () => {
    expect(repository.loadBySupplier).toHaveBeenCalledWith(9, { limit: 20, offset: 0 });
    expect(facade.items()).toEqual([report]);
    expect(facade.totalPages()).toBe(3);
  });

  it('paginates within the bounds', () => {
    facade.previousPage();
    expect(repository.loadBySupplier).toHaveBeenCalledTimes(1);
    facade.nextPage();
    expect(repository.loadBySupplier).toHaveBeenLastCalledWith(9, { limit: 20, offset: 20 });
    expect(facade.page()).toBe(1);
  });

  it('shows an error when the reports cannot be loaded', () => {
    repository.loadBySupplier.mockReturnValue(throwError(() => new Error('500')));
    facade.load();
    expect(facade.loadingError()).toBe('Não foi possível carregar os relatórios deste fornecedor.');
  });

  it('generates a report and reloads from the first page', () => {
    facade.nextPage();
    facade.generate(period).subscribe();
    expect(generate.execute).toHaveBeenCalledWith(9, period);
    expect(facade.success()).toBe('Relatório gerado com sucesso.');
    expect(repository.loadBySupplier).toHaveBeenLastCalledWith(9, { limit: 20, offset: 0 });
    expect(facade.saving()).toBe(false);
  });

  it('shows an error when the generation fails', () => {
    generate.execute.mockReturnValue(throwError(() => new Error('400')));
    facade.generate(period).subscribe({ error: () => undefined });
    expect(facade.saveError()).toBe('Não foi possível gerar o relatório. Confira o período e tente novamente.');
    expect(facade.saving()).toBe(false);
  });
});
