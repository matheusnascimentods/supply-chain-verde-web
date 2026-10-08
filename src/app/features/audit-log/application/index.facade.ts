import { Injectable, computed, inject, signal } from '@angular/core';
import { AuditAction, AuditLog, AuditLogFilters } from '../domain/index.model';
import { isValidPeriod } from '../domain/index.rules';
import { AuditLogRepository } from '../infrastructure/index.repository';

const PAGE_SIZE = 20;
const DEFAULT_PERIOD_DAYS = 6;

/** Data local (yyyy-MM-dd) de `days` dias atrás. */
export function localDateDaysAgo(days: number, today = new Date()): string {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

@Injectable()
export class AuditLogFacade {
  private readonly repository = inject(AuditLogRepository);
  private readonly offset = signal(0);

  readonly startDate = signal(localDateDaysAgo(DEFAULT_PERIOD_DAYS));
  readonly endDate = signal(localDateDaysAgo(0));
  readonly action = signal<AuditAction | ''>('');
  readonly email = signal('');
  readonly logs = signal<AuditLog[]>([]);
  readonly totalPages = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filterError = signal('');
  readonly pageNumber = computed(() =>
    this.totalPages() === 0 ? 0 : Math.min(Math.floor(this.offset() / PAGE_SIZE) + 1, this.totalPages()),
  );

  constructor() {
    this.load();
  }

  filters(): AuditLogFilters {
    return { startDate: this.startDate(), endDate: this.endDate(), action: this.action(), email: this.email() };
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.repository.load(this.filters(), { limit: PAGE_SIZE, offset: this.offset() }).subscribe({
      next: (page) => {
        this.logs.set(page.items);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os registros de auditoria.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    if (!isValidPeriod(this.startDate(), this.endDate())) {
      this.filterError.set('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    this.filterError.set('');
    this.offset.set(0);
    this.load();
  }

  previousPage(): void {
    if (this.pageNumber() <= 1 || this.loading()) return;
    this.offset.update((offset) => Math.max(0, offset - PAGE_SIZE));
    this.load();
  }

  nextPage(): void {
    if (this.pageNumber() >= this.totalPages() || this.loading()) return;
    this.offset.update((offset) => offset + PAGE_SIZE);
    this.load();
  }
}
