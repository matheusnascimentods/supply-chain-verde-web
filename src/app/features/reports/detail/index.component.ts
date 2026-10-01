import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReportResponseDTO } from '../index.schema';
import { ReportsService } from '../index.service';

@Component({
  selector: 'app-report-detail',
  imports: [RouterLink],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDetailComponent {
  private readonly service = inject(ReportsService);
  private readonly route = inject(ActivatedRoute);

  readonly report = signal<ReportResponseDTO | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    const reportId = Number(this.route.snapshot.paramMap.get('reportId'));
    if (!Number.isInteger(reportId) || reportId <= 0) {
      this.error.set('O identificador do relatório é inválido.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.service.get(reportId).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar este relatório. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  supplierName(report: ReportResponseDTO): string {
    return report.supplierName ?? `Fornecedor #${report.supplierId}`;
  }

  cnpj(value: string | null | undefined): string {
    if (!value) return '—';
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) return value;
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  date(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(parsed);
  }

  period(report: ReportResponseDTO): string {
    const start = report.periodStartAt ?? report.startDate;
    const end = report.periodEndAt ?? report.endDate;
    if (!start || !end) return '—';
    return `${this.date(start)} – ${this.date(end)}`;
  }

  co2(value: number): string {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} kg`;
  }

  batchCount(report: ReportResponseDTO): number | null {
    return report.totalBatchCount ?? null;
  }
}
