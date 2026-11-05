import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { apiErrorMessage } from '../../../../shared/utils/http/index.utils';
import { PRODUCT_UNIT_SYMBOLS, Product, ProductCategory, ProductUnit, ProductsRepository } from '../../../products';
import { RecommendationCriteria, SupplierRanking, SuppliersRepository } from '../../../suppliers';
import { Batch } from '../../domain/index.model';
import { PagedSearch } from '../paged-search/index.helper';
import { CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';

export type CreationStep = 0 | 1 | 2 | 3;

/**
 * Pedido de lote pelo varejista (RF-13), em 4 passos:
 * 1. categoria e unidade; 2. fornecedor (recomendação global); 3. produto desse fornecedor; 4. revisão com a quantidade.
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

  readonly category = signal<ProductCategory | null>(null);
  readonly unit = signal<ProductUnit | null>(null);
  readonly selectedSupplier = signal<SupplierRanking | null>(null);
  readonly supplierProducts = signal<Product[]>([]);
  readonly loadingProducts = signal(false);
  readonly selectedProduct = signal<Product | null>(null);

  readonly recommendationCriteria = computed<RecommendationCriteria | undefined>(
    () => {
      const category = this.category();
      const unit = this.unit();
      return category && unit ? { category, unit } : undefined;
    },
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );
  readonly suppliers = new PagedSearch<SupplierRanking>(
    (query) => this.suppliersRepository.loadRanking(query, this.recommendationCriteria()),
    { load: 'Não foi possível carregar os fornecedores. Tente novamente.', page: 'Não foi possível carregar esta página de fornecedores.' },
    (message) => this.error.set(message),
    this.destroyRef,
  );
  readonly unitSymbol = computed(() => {
    const unit = this.unit();
    return unit ? PRODUCT_UNIT_SYMBOLS[unit] : '';
  });

  constructor() {
    // O ranking só faz sentido com categoria e unidade; recarrega do início quando elas mudam.
    effect(() => {
      const criteria = this.recommendationCriteria();
      untracked(() => {
        this.selectedSupplier.set(null);
        if (criteria) this.suppliers.load();
      });
    });
  }

  setCategory(category: ProductCategory | null): void {
    this.category.set(category);
  }

  setUnit(unit: ProductUnit | null): void {
    this.unit.set(unit);
  }

  selectSupplier(supplier: SupplierRanking): void {
    this.selectedSupplier.set(supplier);
  }

  selectProduct(product: Product): void {
    this.selectedProduct.set(product);
  }

  /** Avança o assistente se o passo atual estiver completo; a quantidade é validada pelo formulário da revisão. */
  next(): boolean {
    const problem = this.stepProblem();
    if (problem) {
      this.error.set(problem);
      return false;
    }
    this.error.set('');
    this.step.update((step) => (step + 1) as CreationStep);
    if (this.step() === 2) this.loadSupplierProducts();
    return true;
  }

  previous(): void {
    if (this.step() > 0 && !this.saving()) {
      this.error.set('');
      this.step.update((step) => (step - 1) as CreationStep);
    }
  }

  retrySuppliers(): void {
    this.error.set('');
    this.suppliers.load();
  }

  /** Pede o lote com o produto do fornecedor escolhido; completa quando a API cria o lote (PENDING). */
  submit(quantity: number): Observable<Batch> {
    this.saving.set(true);
    this.error.set('');
    return this.createBatch
      .execute({ productId: this.selectedProduct()!.productId, supplierId: this.selectedSupplier()!.supplierId, quantity })
      .pipe(
        tap({
          next: () => this.saving.set(false),
          error: (error: unknown) => {
            this.saving.set(false);
            // 400/409 trazem a regra da API, ex.: "O produto 3 não é do fornecedor 9.".
            this.error.set(apiErrorMessage(error, 'Não foi possível pedir o lote. Tente novamente.'));
          },
        }),
      );
  }

  private stepProblem(): string {
    switch (this.step()) {
      case 0:
        return this.recommendationCriteria() ? '' : 'Escolha a categoria e a unidade do produto para continuar.';
      case 1:
        return this.selectedSupplier() ? '' : 'Selecione um fornecedor para continuar.';
      case 2:
        return this.selectedProduct() ? '' : 'Selecione um produto do fornecedor para continuar.';
      default:
        return '';
    }
  }

  // Passo 3: os produtos do fornecedor escolhido na categoria e unidade do passo 1.
  private loadSupplierProducts(): void {
    const supplier = this.selectedSupplier();
    const category = this.category();
    const unit = this.unit();
    if (!supplier || !category || !unit) return;
    this.selectedProduct.set(null);
    this.supplierProducts.set([]);
    this.loadingProducts.set(true);
    this.productsRepository.loadBySupplier(supplier.supplierId, { category, unit }).subscribe({
      next: (products) => {
        this.supplierProducts.set(products);
        // Com um único produto, ele já vem escolhido.
        if (products.length === 1) this.selectedProduct.set(products[0]);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
        this.error.set('Não foi possível carregar os produtos deste fornecedor. Volte e tente novamente.');
      },
    });
  }
}
