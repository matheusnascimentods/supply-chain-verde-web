import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { apiErrorMessage } from '../../../../shared/utils/http/index.utils';
import { PRODUCT_UNIT_SYMBOLS, Product, ProductCategory, ProductUnit, ProductsRepository } from '../../../products';
import { Batch } from '../../domain/index.model';
import { PagedSearch } from '../paged-search/index.helper';
import { CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';

export type CreationStep = 0 | 1;

/**
 * Pedido de lote pelo varejista (RF-13), em 2 passos:
 * 1. produto do catálogo de todos os fornecedores (busca e filtros opcionais); 2. revisão com a quantidade.
 * O produto já define o fornecedor.
 */
@Injectable()
export class BatchCreationFacade {
  private readonly productsRepository = inject(ProductsRepository);
  private readonly createBatch = inject(CreateBatchUseCase);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<CreationStep>(0);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly category = signal<ProductCategory | null>(null);
  readonly unit = signal<ProductUnit | null>(null);
  readonly selectedProduct = signal<Product | null>(null);

  // A ordem vem da API: mais pedidos pelo mercado nos últimos 30 dias, depois menor CO₂ por unidade.
  readonly products = new PagedSearch<Product>(
    (query) => this.productsRepository.load({ ...query, category: this.category() ?? undefined, unit: this.unit() ?? undefined }),
    { load: 'Não foi possível carregar os produtos. Tente novamente.', page: 'Não foi possível carregar esta página de produtos.' },
    (message) => this.error.set(message),
    this.destroyRef,
  );
  readonly unitSymbol = computed(() => {
    const unit = this.selectedProduct()?.unit;
    return unit ? PRODUCT_UNIT_SYMBOLS[unit] : '';
  });

  constructor() {
    this.products.load();
  }

  setCategory(category: ProductCategory | null): void {
    this.category.set(category);
    this.reload();
  }

  setUnit(unit: ProductUnit | null): void {
    this.unit.set(unit);
    this.reload();
  }

  searchFor(term: string): void {
    this.selectedProduct.set(null);
    this.products.searchFor(term);
  }

  selectProduct(product: Product): void {
    this.selectedProduct.set(product);
  }

  /** Avança o assistente se o passo atual estiver completo; a quantidade é validada pelo formulário da revisão. */
  next(): boolean {
    if (this.step() === 0 && !this.selectedProduct()) {
      this.error.set('Selecione um produto para continuar.');
      return false;
    }
    this.error.set('');
    this.step.set(1);
    return true;
  }

  previous(): void {
    if (this.step() > 0 && !this.saving()) {
      this.error.set('');
      this.step.set(0);
    }
  }

  retryProducts(): void {
    this.error.set('');
    this.products.load();
  }

  /** Pede o lote com o produto escolhido e o fornecedor dele; completa quando a API cria o lote (PENDING). */
  submit(quantity: number): Observable<Batch> {
    const product = this.selectedProduct()!;
    this.saving.set(true);
    this.error.set('');
    return this.createBatch.execute({ productId: product.productId, supplierId: product.supplierId!, quantity }).pipe(
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

  // RF-05: filtro novo recomeça da 1ª página e limpa a seleção.
  private reload(): void {
    this.selectedProduct.set(null);
    this.error.set('');
    this.products.load();
  }
}
