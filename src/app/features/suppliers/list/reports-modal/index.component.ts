import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReportsService } from '../../../reports/index.service';
import { ReportResponseDTO } from '../../../reports/index.schema';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-supplier-reports-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierReportsModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly reports = inject(ReportsService);
  private previousFocus: HTMLElement | null = null;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  readonly supplierId = input.required<number>();
  readonly supplierName = input.required<string>();
  readonly canGenerate = input(false);
  readonly dismissed = output<void>();
  readonly generated = output<void>();

  readonly items = signal<ReportResponseDTO[]>([]);
  readonly loading = signal(true);
  readonly loadingError = signal('');
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly success = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly form = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadReports();
  }

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    queueMicrotask(() => this.dialog?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.previousFocus?.focus();
  }

  close(): void {
    if (!this.saving()) this.dismissed.emit();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const elements = this.dialog?.nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!elements?.length) {
      event.preventDefault();
      this.dialog?.nativeElement.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  invalidPeriod(): boolean {
    const { startDate, endDate } = this.form.getRawValue();
    return !!startDate && !!endDate && startDate > endDate;
  }

  submit(): void {
    if (this.form.invalid || this.invalidPeriod() || !this.canGenerate()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    this.success.set('');
    const { startDate, endDate } = this.form.getRawValue();
    this.reports.generate(this.supplierId(), { periodStartAt: startDate, periodEndAt: endDate }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Relatório gerado com sucesso.');
        this.form.reset();
        this.page.set(0);
        this.loadReports();
        this.generated.emit();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Não foi possível gerar o relatório. Confira o período e tente novamente.');
      },
    });
  }

  loadReports(page = this.page()): void {
    this.loading.set(true);
    this.loadingError.set('');
    this.reports.loadBySupplier(this.supplierId(), { limit: PAGE_SIZE, offset: page * PAGE_SIZE }).subscribe({
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
    if (this.page() > 0 && !this.loading()) this.loadReports(this.page() - 1);
  }

  nextPage(): void {
    if (this.page() + 1 < this.totalPages() && !this.loading()) this.loadReports(this.page() + 1);
  }

  period(report: ReportResponseDTO): string {
    const start = report.periodStartAt ?? report.startDate;
    const end = report.periodEndAt ?? report.endDate;
    return start && end ? `${this.date(start)} – ${this.date(end)}` : 'Período indisponível';
  }

  date(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(parsed);
  }

  co2(value: number): string {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} kg`;
  }

  batchCount(report: ReportResponseDTO): number | string {
    return report.totalBatchCount ?? '—';
  }
}
