import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SessionService } from '../../../core/session/index.service';
import { SuppliersService } from '../index.service';
import { SupplierRankingResponseDTO, SupplierResponseDTO } from '../index.schema';

const PAGE_SIZE = 20;

@Component({ selector: 'app-suppliers-list', imports: [RouterLink, FormsModule], templateUrl: './index.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SupplierListComponent {
  private readonly service = inject(SuppliersService);
  private readonly session = inject(SessionService);
  private readonly searchChanges = new Subject<string>();
  private loadSequence = 0;

  readonly items = signal<SupplierResponseDTO[]>([]);
  readonly ranking = signal<SupplierRankingResponseDTO[]>([]);
  readonly expiringSupplierIds = signal<number[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly offset = signal(0);
  readonly hasNext = signal(false);
  readonly pageNumber = computed(() => Math.floor(this.offset() / PAGE_SIZE) + 1);
  readonly canManage = computed(() => ['admin', 'manager'].includes(this.session.role() ?? ''));
  readonly rankedSuppliers = computed(() => this.ranking().map((item) => ({
    ranking: item,
    supplier: this.items().find((supplier) => supplier.supplierId === item.supplierId),
  })));
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
      ranking: this.service.loadRanking({ limit: PAGE_SIZE, offset: this.offset(), search: this.search() }),
      suppliers: this.service.load(),
      expiringSupplierIds: this.service.loadExpiringCertificationSupplierIds(),
    }).subscribe({
      next: ({ ranking, suppliers, expiringSupplierIds }) => {
        if (sequence !== this.loadSequence) return;
        const rankingItems = Array.isArray(ranking) ? ranking : ranking.items;
        this.ranking.set(rankingItems);
        this.items.set(suppliers);
        this.expiringSupplierIds.set(expiringSupplierIds);
        this.hasNext.set(Array.isArray(ranking) ? false : ranking.hasNext);
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
    if (this.offset() === 0) return;
    this.offset.update((offset) => Math.max(0, offset - PAGE_SIZE));
    this.load();
  }

  nextPage(): void {
    if (!this.hasNext()) return;
    this.offset.update((offset) => offset + PAGE_SIZE);
    this.load();
  }

  certificationLabel(supplierId: number, item: SupplierRankingResponseDTO): string {
    if (this.expiringSupplierIds().includes(supplierId)) return 'Expirando';
    const count = item.activeCertificationCount ?? item.activeCertifications ?? item.activeCertificationsCount ?? 0;
    return count > 0 ? `${count} ativas` : 'Sem certificação';
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
}
