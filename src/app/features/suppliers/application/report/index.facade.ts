import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { Report, ReportPeriod } from '../../domain/report/index.model';
import { GeneratedReportDTO } from '../../infrastructure/report/index.dto';
import { ReportsRepository } from '../../infrastructure/report/index.repository';
import { GenerateReportUseCase } from '../use-cases/generate-report/index.use-case';

const PAGE_SIZE = 20;

@Injectable()
export class SupplierReportsFacade {
  private readonly repository = inject(ReportsRepository);
  private readonly generateReport = inject(GenerateReportUseCase);
  private supplierId = 0;

  readonly items = signal<Report[]>([]);
  readonly loading = signal(true);
  readonly loadingError = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly success = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);

  open(supplierId: number): void {
    this.supplierId = supplierId;
    this.load(0);
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.loadingError.set('');
    this.repository.loadBySupplier(this.supplierId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.totalPages.set(result.totalPages);
        this.page.set(result.totalPages === 0 ? 0 : Math.min(page, result.totalPages - 1));
        this.loading.set(false);
      },
      error: () => {
        this.loadingError.set('Não foi possível carregar os relatórios deste fornecedor.');
        this.loading.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.page() > 0 && !this.loading()) this.load(this.page() - 1);
  }

  nextPage(): void {
    if (this.page() + 1 < this.totalPages() && !this.loading()) this.load(this.page() + 1);
  }

  generate(period: ReportPeriod): Observable<GeneratedReportDTO> {
    this.saving.set(true);
    this.saveError.set('');
    this.success.set('');
    return this.generateReport.execute(this.supplierId, period).pipe(
      tap({
        next: () => {
          this.success.set('Relatório gerado com sucesso.');
          this.load(0);
        },
        error: () => this.saveError.set('Não foi possível gerar o relatório. Confira o período e tente novamente.'),
      }),
      finalize(() => this.saving.set(false)),
    );
  }
}
