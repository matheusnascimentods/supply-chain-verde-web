import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../core/auth/session/index.service';
import { NewSupplier, Supplier, SupplierRanking, SuppliersRepository } from '../../../suppliers';
import { NewProduct, Product } from '../../domain/product/index.model';
import { ProductsRepository } from '../../infrastructure/product/index.repository';
import { PagedSearch } from '../paged-search/index.helper';
import { CreateBatchError, CreateBatchProgress, CreateBatchStep, CreateBatchUseCase } from '../use-cases/create-batch/index.use-case';

export type CreationStep = 0 | 1 | 2;

const FAILURE_MESSAGES: Record<CreateBatchStep, string> = {
  product: 'Não foi possível cadastrar o produto. Seus dados continuam preenchidos.',
  supplier: 'Não foi possível cadastrar o fornecedor. Seus dados continuam preenchidos.',
  batch: 'Não foi possível criar o lote. Os cadastros já salvos foram preservados; tente novamente.',
};

@Injectable()
export class BatchCreationFacade {
  private readonly productsRepository = inject(ProductsRepository);
  private readonly suppliersRepository = inject(SuppliersRepository);
  private readonly currentUser = inject(CurrentUserService);
  private readonly createBatch = inject(CreateBatchUseCase);
  private readonly role = inject(SessionService).role();
  private readonly destroyRef = inject(DestroyRef);

  readonly isAdmin = this.role === 'admin';
  readonly isSupplier = this.role === 'supplier';
  readonly step = signal<CreationStep>(0);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly savedNotice = signal('');

  readonly products = new PagedSearch<Product>(
    (query) => this.productsRepository.load(query),
    { load: 'Não foi possível carregar os produtos. Tente novamente.', page: 'Não foi possível carregar esta página de produtos.' },
    (message) => this.error.set(message),
    this.destroyRef,
  );
  readonly suppliers = new PagedSearch<SupplierRanking>(
    (query) => this.suppliersRepository.loadRanking(query),
    { load: 'Não foi possível carregar os fornecedores. Tente novamente.', page: 'Não foi possível carregar esta página de fornecedores.' },
    (message) => this.error.set(message),
    this.destroyRef,
  );

  readonly selectedProduct = signal<Product | null>(null);
  readonly pendingProduct = signal<NewProduct | null>(null);
  readonly createdProduct = signal<Product | null>(null);
  readonly selectedSupplier = signal<Supplier | null>(null);
  readonly pendingSupplier = signal<NewSupplier | null>(null);
  readonly createdSupplier = signal<Supplier | null>(null);
  readonly ownSupplier = signal<Supplier | null>(null);
  private readonly ownSupplierId = signal<number | null>(null);
  private readonly loadingOwnSupplier = signal(this.isSupplier);

  readonly loadingSuppliers = computed(() => (this.isAdmin ? this.suppliers.loading() : this.loadingOwnSupplier()));
  readonly hasProductChoice = computed(() => !!(this.selectedProduct() || this.createdProduct() || this.pendingProduct()));
  readonly hasSupplierChoice = computed(
    () => !!(this.selectedSupplier() || this.createdSupplier() || this.pendingSupplier() || this.ownSupplierId()),
  );
  readonly hasPartialCreation = computed(() => !!(this.createdProduct() || this.createdSupplier()));
  readonly productName = computed(
    () => this.selectedProduct()?.name ?? this.createdProduct()?.name ?? this.pendingProduct()?.name ?? '',
  );
  readonly supplierName = computed(
    () => (this.selectedSupplier() ?? this.ownSupplier() ?? this.createdSupplier() ?? this.pendingSupplier())?.name ?? '',
  );
  readonly canRetryChoices = computed(
    () =>
      !this.products.loading() &&
      !this.loadingSuppliers() &&
      this.step() < 2 &&
      (!this.products.items().length ||
        (this.isAdmin && !this.suppliers.items().length) ||
        (this.isSupplier && !this.ownSupplier())),
  );

  constructor() {
    this.products.load();
    if (this.isAdmin) this.suppliers.load();
    else if (this.isSupplier) this.loadOwnSupplier();
  }

  selectProduct(product: Product): void {
    if (this.createdProduct()) return;
    this.selectedProduct.set(product);
    this.pendingProduct.set(null);
    this.savedNotice.set('');
  }

  useNewProduct(product: NewProduct): void {
    if (!this.isAdmin || this.createdProduct()) return;
    this.pendingProduct.set({ ...product, name: product.name.trim() });
    this.selectedProduct.set(null);
    this.savedNotice.set('Produto preenchido. Ele será cadastrado ao confirmar o lote.');
    this.error.set('');
  }

  selectSupplier(supplier: Supplier): void {
    if (this.createdSupplier()) return;
    this.selectedSupplier.set(supplier);
    this.pendingSupplier.set(null);
    this.savedNotice.set('');
  }

  useNewSupplier(supplier: NewSupplier): void {
    if (!this.isAdmin || this.createdSupplier()) return;
    this.pendingSupplier.set({ ...supplier, name: supplier.name.trim() });
    this.selectedSupplier.set(null);
    this.savedNotice.set('Fornecedor preenchido. Ele será cadastrado ao confirmar o lote.');
    this.error.set('');
  }

  reportError(message: string): void {
    this.error.set(message);
  }

  /** Avança o assistente; `batchValid` informa se quantidade e data de produção são válidas. */
  next(batchValid: boolean): boolean {
    if (this.step() === 0) {
      if (!this.hasProductChoice() || !batchValid) {
        this.error.set(
          !this.hasProductChoice()
            ? 'Selecione ou preencha um produto para continuar.'
            : 'Informe uma quantidade maior que zero e a data de produção.',
        );
        return false;
      }
    } else if (this.step() === 1 && !this.hasSupplierChoice()) {
      this.error.set('Selecione ou preencha um fornecedor para continuar.');
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
    if (!this.hasProductChoice()) this.products.load();
    if (this.isAdmin && !this.selectedSupplier() && !this.pendingSupplier() && !this.createdSupplier()) {
      this.suppliers.load();
    } else if (this.isSupplier && !this.ownSupplier()) {
      this.loadOwnSupplier();
    }
  }

  /** Cadastra o que for novo e o lote; completa só quando o lote é criado. */
  submit(batch: { quantity: number; producedAt: string }): Observable<CreateBatchProgress> {
    const product = this.createdProduct() ?? this.selectedProduct() ?? this.pendingProduct();
    const supplierId = (this.selectedSupplier() ?? this.createdSupplier())?.supplierId ?? this.ownSupplierId();
    const supplier = supplierId !== null ? { supplierId } : this.pendingSupplier();
    this.saving.set(true);
    this.error.set('');
    this.savedNotice.set('');
    return this.createBatch.execute({ product: product!, supplier: supplier!, ...batch }).pipe(
      tap({
        next: (progress) => {
          if (progress.step === 'product') {
            this.createdProduct.set(progress.product);
            this.savedNotice.set('Produto cadastrado. Continuando a criação do lote…');
          } else if (progress.step === 'supplier') {
            this.createdSupplier.set(progress.supplier);
            this.savedNotice.set('Fornecedor cadastrado. Continuando a criação do lote…');
          } else {
            this.saving.set(false);
          }
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const step = error instanceof CreateBatchError ? error.step : 'batch';
          this.error.set(
            step === 'supplier' && this.createdProduct()
              ? 'Não foi possível cadastrar o fornecedor. O produto já salvo foi mantido para a próxima tentativa.'
              : FAILURE_MESSAGES[step],
          );
        },
      }),
    );
  }

  private loadOwnSupplier(): void {
    this.loadingOwnSupplier.set(true);
    this.currentUser
      .load()
      .pipe(
        switchMap((user) => {
          this.ownSupplierId.set(user.userId);
          return this.suppliersRepository.get(user.userId);
        }),
      )
      .subscribe({
        next: (supplier) => {
          this.ownSupplier.set(supplier);
          this.selectedSupplier.set(supplier);
          this.loadingOwnSupplier.set(false);
        },
        error: () => {
          this.loadingOwnSupplier.set(false);
          this.error.set('Não foi possível identificar o fornecedor vinculado à sua conta.');
        },
      });
  }
}
