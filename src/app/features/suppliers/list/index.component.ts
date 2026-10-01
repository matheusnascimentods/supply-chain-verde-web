import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SessionService } from '../../../core/session/index.service';
import { SuppliersService } from '../index.service';
import { SupplierFormComponent } from '../form/index.component';
import { SupplierRankingResponseDTO, SupplierResponseDTO } from '../index.schema';

const PAGE_SIZE = 20;

@Component({ selector: 'app-suppliers-list', imports: [RouterLink, FormsModule, SupplierFormComponent], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SupplierListComponent {
  private readonly service = inject(SuppliersService);
  private readonly session = inject(SessionService);
  private readonly searchChanges = new Subject<string>();
  private loadSequence = 0;

  readonly items = signal<SupplierResponseDTO[]>([]);
  readonly ranking = signal<SupplierRankingResponseDTO[]>([]);
  readonly expiredCertificationCounts = signal<Map<number, number>>(new Map());
  readonly loading = signal(true);
  readonly error = signal('');
  readonly rankingAvailable = signal(true);
  readonly search = signal('');
  readonly offset = signal(0);
  readonly totalPages = signal(0);
  readonly createModalOpen = signal(false);
  readonly pageNumber = computed(() => this.totalPages() === 0 ? 0 : Math.min(Math.floor(this.offset() / PAGE_SIZE) + 1, this.totalPages()));
  readonly canManage = computed(() => ['admin', 'manager'].includes(this.session.role() ?? ''));
  readonly rankedSuppliers = computed(() => this.ranking().map((item) => ({
    ranking: item,
    supplier: item,
  })));
  readonly fallbackSuppliers = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('pt-BR');
    const digits = term.replace(/\D/g, '');
    if (!term) return this.items();
    return this.items().filter((supplier) =>
      supplier.name.toLocaleLowerCase('pt-BR').includes(term) ||
      (digits.length > 0 && (supplier.cnpj ?? '').replace(/\D/g, '').includes(digits)),
    );
  });
  readonly podium = computed(() => this.offset() === 0 && !this.search().trim() ? this.rankedSuppliers().slice(0, 3) : []);
  readonly tableItems = computed(() => this.offset() === 0 && !this.search().trim() ? this.rankedSuppliers().slice(3) : this.rankedSuppliers());

  constructor() {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      ranking: this.service
        .loadRanking({ limit: PAGE_SIZE, offset: this.offset(), search: this.search() })
        .pipe(catchError(() => of(null))),
      expiredCertificationCounts: this.service
        .loadExpiredCertificationCounts()
        .pipe(catchError(() => of(new Map<number, number>()))),
    }).subscribe({
      next: ({ ranking, expiredCertificationCounts }) => {
        if (sequence !== this.loadSequence) return;
        this.rankingAvailable.set(ranking !== null);
        const rankingItems = ranking === null ? [] : Array.isArray(ranking) ? ranking : ranking.items;
        this.ranking.set(rankingItems);
        this.items.set([]);
        this.expiredCertificationCounts.set(expiredCertificationCounts);
        this.totalPages.set(ranking === null || Array.isArray(ranking) ? 0 : ranking.totalPages);
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

  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  dismissCreateModal(): void {
    this.createModalOpen.set(false);
  }

  supplierCreated(): void {
    this.createModalOpen.set(false);
    this.load();
  }

  certificationLabel(supplierId: number, item: SupplierRankingResponseDTO): string {
    const expiredCount = this.expiredCertificationCounts().get(supplierId) ?? 0;
    if (expiredCount > 0) return `${expiredCount} ${expiredCount === 1 ? 'expirada' : 'expiradas'}`;
    const count = item.activeCertificationCount ?? item.activeCertifications ?? item.activeCertificationsCount ?? 0;
    return count > 0 ? `${count} ${count === 1 ? 'ativa' : 'ativas'}` : 'Nenhuma ativa';
  }

  certificationTone(supplierId: number, item: SupplierRankingResponseDTO): 'expired' | 'active' | 'none' {
    if ((this.expiredCertificationCounts().get(supplierId) ?? 0) > 0) return 'expired';
    const count = item.activeCertificationCount ?? item.activeCertifications ?? item.activeCertificationsCount ?? 0;
    return count > 0 ? 'active' : 'none';
  }

  name(item: SupplierRankingResponseDTO): string {
    return item.name ?? item.supplierName ?? `Fornecedor ${item.supplierId}`;
  }

  score(value: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
  }

  co2(value: number | undefined): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value ?? 0);
  }

  cnpj(value: string | null | undefined): string {
    if (!value) return '—';
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) return value;
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}
