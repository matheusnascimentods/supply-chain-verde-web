import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../core/session/index.service';
import { ReportResponseDTO } from '../index.schema';
import { ReportsService } from '../index.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-reports-list',
  imports: [RouterLink],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportListComponent {
  private readonly service = inject(ReportsService);
  private readonly session = inject(SessionService);
  private loadSequence = 0;

  readonly items = signal<ReportResponseDTO[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly offset = signal(0);
  readonly totalPages = signal(0);
  readonly canGenerate = () => ['admin', 'manager'].includes(this.session.role() ?? '');

  constructor() {
    this.reload();
  }

  reload(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.service.loadPage({ limit: PAGE_SIZE, offset: this.offset() }).subscribe({
      next: (page) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(page.items);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar os relatórios. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.pageNumber() <= 1 || this.loading()) return;
    this.offset.update((offset) => Math.max(0, offset - PAGE_SIZE));
    this.reload();
  }

  nextPage(): void {
    if (this.pageNumber() >= this.totalPages() || this.loading()) return;
    this.offset.update((offset) => offset + PAGE_SIZE);
    this.reload();
  }

  pageNumber(): number {
    return this.totalPages() === 0 ? 0 : Math.min(Math.floor(this.offset() / PAGE_SIZE) + 1, this.totalPages());
  }

  period(report: ReportResponseDTO): string {
    const start = report.periodStartAt ?? report.startDate;
    const end = report.periodEndAt ?? report.endDate;
    if (!start || !end) return '—';
    return `${this.date(start)} – ${this.date(end)}`;
  }

  date(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(parsed);
  }

  cnpj(value: string | null | undefined): string {
    if (!value) return '—';
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) return value;
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  co2(value: number): string {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} kg`;
  }

  batchCount(report: ReportResponseDTO): number | null {
    return report.totalBatchCount ?? null;
  }
}
