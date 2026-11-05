import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { RecommendationCriteria, SupplierRanking, SuppliersRepository } from '../../../suppliers';
import { apiErrorMessage } from '../../../../shared/utils/http/index.utils';
import { PRODUCT_UNIT_SYMBOLS, Product } from '../../domain/product/index.model';
import { ProductsRepository } from '../../infrastructure/product/index.repository';
import { PagedSearch } from '../paged-search/index.helper';
import { CreateBatchError, CreateBatchProgress, CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';

export type CreationStep = 0 | 1 | 2;

/**
 * Assistente de pedido de lote pelo varejista (RF-13): escolhe um produto e um fornecedor
 * já cadastrados. A criação inline de produto e de fornecedor saiu.
 */
@Injectable()
export class BatchCreationFacade {
  private readonly productsRepository = inject(ProductsRepository);
  private readonly suppliersRepository = inject(SuppliersRepository);
  private readonly createBatch = inject(CreateBatchUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<CreationStep>(0);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly products = new PagedSearch<Product>(
    (query) => this.productsRepository.load(query),
    { load: 'Não foi possível carregar os produtos. Tente novamente.', page: 'Não foi possível carregar esta página de produtos.' },
    (message) => this.error.set(message),
    this.destroyRef,
  );
  readonly suppliers = new PagedSearch<SupplierRanking>(
    (query) => this.suppliersRepository.loadRanking(query, this.recommendationCriteria()),
    { load: 'Não foi possível carregar os fornecedores. Tente novamente.', page: 'Não foi possível carregar esta página de fornecedores.' },
    (message) => this.error.set(message),
    this.destroyRef,
  );

  readonly selectedProduct = signal<Product | null>(null);
  readonly selectedSupplier = signal<SupplierRanking | null>(null);

  readonly recommendationCriteria = computed<RecommendationCriteria | undefined>(
    () => {
      const product = this.selectedProduct();
      return product ? { category: product.category, unit: product.unit } : undefined;
    },
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );
  readonly productUnitSymbol = computed(() => {
    const unit = this.selectedProduct()?.unit;
    return unit ? PRODUCT_UNIT_SYMBOLS[unit] : '';
  });
  readonly productName = computed(() => this.selectedProduct()?.name ?? '');
  readonly supplierName = computed(() => this.selectedSupplier()?.name ?? '');
  readonly canRetryChoices = computed(
    () =>
      !this.products.loading() &&
      !this.suppliers.loading() &&
      this.step() < 2 &&
      (!this.products.items().length || !this.suppliers.items().length),
  );

  constructor() {
    this.products.load();
    // Recarrega o ranking do início sempre que a categoria ou a unidade do produto muda.
    effect(() => {
      this.recommendationCriteria();
      untracked(() => this.suppliers.load());
    });
  }

  selectProduct(product: Product): void {
    this.selectedProduct.set(product);
  }

  selectSupplier(supplier: SupplierRanking): void {
    this.selectedSupplier.set(supplier);
  }

  /** Avança o assistente; `batchValid` informa se quantidade e data de produção são válidas. */
  next(batchValid: boolean): boolean {
    if (this.step() === 0) {
      if (!this.selectedProduct() || !batchValid) {
        this.error.set(
          !this.selectedProduct()
            ? 'Selecione um produto para continuar.'
            : 'Informe uma quantidade maior que zero e a data de produção.',
        );
        return false;
      }
    } else if (this.step() === 1 && !this.selectedSupplier()) {
      this.error.set('Selecione um fornecedor para continuar.');
      return false;
    }
    this.error.set('');
    this.step.update((step) => Math.min(step + 1, 2) as CreationStep);
    return true;
  }

  previous(): void {
    if (this.step() > 0 && !this.saving()) {
      this.error.set('');
      this.step.update((step) => (step - 1) as CreationStep);
    }
  }

  retryChoices(): void {
    this.error.set('');
    if (!this.products.items().length) this.products.load();
    if (!this.suppliers.items().length) this.suppliers.load();
  }

  /** Cria o lote com o produto e o fornecedor escolhidos; completa quando o lote é criado. */
  submit(batch: { quantity: number; producedAt: string }): Observable<CreateBatchProgress> {
    const product = this.selectedProduct()!;
    const supplier = this.selectedSupplier()!;
    this.saving.set(true);
    this.error.set('');
    return this.createBatch
      .execute({ product: { productId: product.productId }, supplier: { supplierId: supplier.supplierId }, ...batch })
      .pipe(
        tap({
          next: () => this.saving.set(false),
          error: (error: unknown) => {
            this.saving.set(false);
            // 400/409 trazem a regra da API, ex.: "O produto 3 não é do fornecedor 9.".
            const cause = error instanceof CreateBatchError ? error.cause : error;
            this.error.set(apiErrorMessage(cause, 'Não foi possível criar o lote. Tente novamente.'));
          },
        }),
      );
  }
}
