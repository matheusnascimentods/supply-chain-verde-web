import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SessionService } from '../../../core/auth/session/index.service';
import { SupplierRanking } from '../domain/index.model';
import {
  canCreateCertification,
  canGenerateReports,
  canManageSuppliers,
  canOpenReports,
  canUpdateCertificationStatus,
} from '../domain/index.rules';
import { SuppliersRepository } from '../infrastructure/index.repository';

const PAGE_SIZE = 20;
const PODIUM_SIZE = 3;

@Injectable()
export class SuppliersListFacade {
  private readonly repository = inject(SuppliersRepository);
  private readonly session = inject(SessionService);
  private readonly searchChanges = new Subject<string>();
  private readonly offset = signal(0);
  private loadSequence = 0;

  readonly ranking = signal<SupplierRanking[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly totalPages = signal(0);
  readonly reportsSupplier = signal<SupplierRanking | null>(null);
  readonly certificationsSupplier = signal<SupplierRanking | null>(null);

  readonly pageNumber = computed(() =>
    this.totalPages() === 0 ? 0 : Math.min(Math.floor(this.offset() / PAGE_SIZE) + 1, this.totalPages()),
  );
  private readonly showsPodium = computed(() => this.offset() === 0 && !this.search().trim());
  readonly podium = computed(() => (this.showsPodium() ? this.ranking().slice(0, PODIUM_SIZE) : []));
  readonly tableItems = computed(() => (this.showsPodium() ? this.ranking().slice(PODIUM_SIZE) : this.ranking()));
  readonly firstTablePosition = computed(() => this.offset() + (this.podium().length ? PODIUM_SIZE : 0) + 1);

  readonly canManage = computed(() => canManageSuppliers(this.session.role()));
  readonly canGenerateReports = computed(() => canGenerateReports(this.session.role()));
  readonly canUpdateCertificationStatus = computed(() => canUpdateCertificationStatus(this.session.role()));

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.load());
    this.load();
  }

  load(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.repository.loadRanking({ limit: PAGE_SIZE, offset: this.offset(), search: this.search() }).subscribe({
      next: (page) => {
        if (sequence !== this.loadSequence) return;
        this.ranking.set(page.items);
        this.totalPages.set(page.totalPages);
        this.refreshSelectedCertificationsSupplier(page.items);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar os fornecedores e o ranking. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  searchFor(value: string): void {
    this.search.set(value);
    this.offset.set(0);
    this.searchChanges.next(value.trim());
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

  canOpenReports(supplier: SupplierRanking): boolean {
    return canOpenReports(this.session.role(), this.session.userId(), supplier.supplierId);
  }

  canCreateCertificationFor(supplier: SupplierRanking): boolean {
    return canCreateCertification(this.session.role(), this.session.userId(), supplier.supplierId);
  }

  // Mantém o modal de certificações aberto com os dados recarregados após um cadastro ou troca de status.
  private refreshSelectedCertificationsSupplier(items: SupplierRanking[]): void {
    const selected = this.certificationsSupplier();
    const refreshed = selected && items.find((item) => item.supplierId === selected.supplierId);
    if (refreshed) this.certificationsSupplier.set(refreshed);
  }
}
