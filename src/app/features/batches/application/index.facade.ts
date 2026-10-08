import { Injectable, computed, inject, signal } from '@angular/core';
import { SessionService } from '../../../core/auth/session/index.service';
import { Batch } from '../domain/index.model';
import { ProductUnit } from '../domain/product/index.model';
import { canAddStageTo, canCreateBatch } from '../domain/index.rules';
import { BatchesRepository } from '../infrastructure/index.repository';
import { ProductsRepository } from '../infrastructure/product/index.repository';

const PAGE_SIZE = 20;

@Injectable()
export class BatchesListFacade {
  private readonly repository = inject(BatchesRepository);
  private readonly products = inject(ProductsRepository);
  private readonly session = inject(SessionService);
  private loadSequence = 0;

  readonly items = signal<Batch[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  private readonly productUnits = signal(new Map<number, ProductUnit>());
  readonly pageNumber = computed(() => (this.totalPages() === 0 ? 0 : this.page() + 1));
  readonly canCreate = computed(() => canCreateBatch(this.session.role()));

  constructor() {
    this.load();
    this.products.loadAll().subscribe({
      next: (products) => this.productUnits.set(new Map(products.map((product) => [product.productId, product.unit]))),
      error: () => this.productUnits.set(new Map()),
    });
  }

  load(): void {
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.error.set('');
    this.repository.load({ page: this.page(), size: PAGE_SIZE }).subscribe({
      next: (result) => {
        if (sequence !== this.loadSequence) return;
        this.items.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => {
        if (sequence !== this.loadSequence) return;
        this.error.set('Não foi possível carregar os lotes. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.page() <= 0 || this.loading()) return;
    this.page.update((page) => page - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() + 1 >= this.totalPages() || this.loading()) return;
    this.page.update((page) => page + 1);
    this.load();
  }

  reloadFromFirstPage(): void {
    this.page.set(0);
    this.load();
  }

  canAddStageTo(batch: Batch): boolean {
    return canAddStageTo(this.session.role(), batch);
  }

  unitOf(batch: Batch): ProductUnit | undefined {
    return batch.productId === null ? undefined : this.productUnits().get(batch.productId);
  }
}
