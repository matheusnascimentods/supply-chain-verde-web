import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { SessionService } from '../../../../core/session/index.service';
import { ProductRequestDTO, ProductResponseDTO } from '../../../products/index.schema';
import { ProductsService } from '../../../products/index.service';
import {
  SupplierRankingResponseDTO,
  SupplierRequestDTO,
  SupplierResponseDTO,
} from '../../../suppliers/index.schema';
import { SuppliersService } from '../../../suppliers/index.service';
import { UsersService } from '../../../users/index.service';
import { BatchRequestDTO } from '../../index.schema';
import { BatchesService } from '../../index.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-batch-create-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchCreateModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  private readonly previousFocus =
    typeof document === 'undefined' ? null : (document.activeElement as HTMLElement);
  private readonly fb = inject(FormBuilder);
  private readonly batches = inject(BatchesService);
  private readonly productsService = inject(ProductsService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly usersService = inject(UsersService);
  private readonly session = inject(SessionService);
  private readonly productSearchChanges = new Subject<string>();
  private readonly supplierSearchChanges = new Subject<string>();

  readonly dismiss = output<void>();
  readonly created = output<void>();
  readonly step = signal(0);
  readonly products = signal<ProductResponseDTO[]>([]);
  readonly suppliers = signal<SupplierRankingResponseDTO[]>([]);
  readonly selectedProduct = signal<ProductResponseDTO | null>(null);
  readonly selectedSupplier = signal<SupplierRankingResponseDTO | SupplierResponseDTO | null>(null);
  readonly ownSupplier = signal<SupplierResponseDTO | null>(null);
  readonly productPage = signal(0);
  readonly productTotalPages = signal(0);
  readonly productSearch = signal('');
  readonly supplierPage = signal(0);
  readonly supplierTotalPages = signal(0);
  readonly supplierSearch = signal('');
  readonly loadingProducts = signal(true);
  readonly loadingSuppliers = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly savedNotice = signal('');
  readonly isAdmin = this.session.role() === 'admin';
  readonly isSupplier = this.session.role() === 'supplier';

  readonly productForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    unit: ['', Validators.required],
  });
  readonly batchForm = this.fb.nonNullable.group({
    quantity: [null as number | null, [Validators.required, Validators.min(0.000001)]],
    producedAt: ['', Validators.required],
  });
  readonly supplierForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    cnpj: ['', Validators.required],
    phone: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    neighborhood: ['', Validators.required],
    complement: [''],
    zipCode: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
  });

  private pendingProduct: ProductRequestDTO | null = null;
  private createdProduct: ProductResponseDTO | null = null;
  private pendingSupplier: SupplierRequestDTO | null = null;
  private createdSupplier: SupplierResponseDTO | null = null;
  private ownSupplierId: number | null = null;

  constructor() {
    this.productSearchChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((search) => this.productsService.load({ limit: PAGE_SIZE, offset: 0, search })),
      )
      .subscribe({
        next: (page) => {
          this.products.set(page.items);
          this.productPage.set(0);
          this.productTotalPages.set(page.totalPages);
          this.loadingProducts.set(false);
        },
        error: () => {
          this.error.set('Não foi possível carregar os produtos. Tente novamente.');
          this.loadingProducts.set(false);
        },
      });

    this.supplierSearchChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((search) =>
          this.suppliersService.loadRanking({ limit: PAGE_SIZE, offset: 0, search }),
        ),
      )
      .subscribe({
        next: (page) => {
          this.suppliers.set(page.items);
          this.supplierPage.set(0);
          this.supplierTotalPages.set(page.totalPages);
          this.loadingSuppliers.set(false);
        },
        error: () => {
          this.error.set('Não foi possível carregar os fornecedores. Tente novamente.');
          this.loadingSuppliers.set(false);
        },
      });

    this.loadProducts();
    if (this.isAdmin) this.loadSuppliers();
    else if (this.isSupplier) this.loadOwnSupplier();
  }

  ngAfterViewInit(): void {
    this.dialog?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.previousFocus?.focus();
  }

  @HostListener('keydown', ['$event'])
  keepFocusInDialog(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestDismiss();
      return;
    }
    if (event.key !== 'Tab' || !this.dialog) return;
    const focusable = Array.from(
      this.dialog.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    if (!focusable.length) {
      event.preventDefault();
      this.dialog.nativeElement.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || !this.dialog.nativeElement.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || !this.dialog.nativeElement.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  selectProduct(product: ProductResponseDTO): void {
    if (this.createdProduct) return;
    this.selectedProduct.set(product);
    this.pendingProduct = null;
    this.createdProduct = null;
    this.productForm.reset({ name: '', description: '', category: '', unit: '' });
    this.savedNotice.set('');
  }

  useNewProduct(): void {
    if (!this.isAdmin || this.createdProduct) return;
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.error.set('Preencha nome, categoria e unidade para usar o novo produto.');
      return;
    }
    const value = this.productForm.getRawValue();
    this.pendingProduct = {
      name: value.name.trim(),
      description: value.description,
      category: value.category as ProductRequestDTO['category'],
      unit: value.unit as ProductRequestDTO['unit'],
    };
    this.createdProduct = null;
    this.selectedProduct.set(null);
    this.savedNotice.set('Produto preenchido. Ele será cadastrado ao confirmar o lote.');
    this.error.set('');
  }

  selectSupplier(supplier: SupplierRankingResponseDTO): void {
    if (this.createdSupplier) return;
    this.selectedSupplier.set(supplier);
    this.pendingSupplier = null;
    this.createdSupplier = null;
    this.supplierForm.reset(this.emptySupplierForm());
    this.savedNotice.set('');
  }

  useNewSupplier(): void {
    if (!this.isAdmin || this.createdSupplier) return;
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.error.set('Preencha os dados obrigatórios do fornecedor para continuar.');
      return;
    }
    const value = this.supplierForm.getRawValue();
    this.pendingSupplier = {
      name: value.name.trim(),
      cnpj: value.cnpj,
      phone: value.phone,
      address: {
        street: value.street,
        number: value.number,
        neighborhood: value.neighborhood,
        complement: value.complement,
        zipCode: value.zipCode,
        city: value.city,
        state: value.state,
      },
    };
    this.createdSupplier = null;
    this.selectedSupplier.set(null);
    this.savedNotice.set('Fornecedor preenchido. Ele será cadastrado ao confirmar o lote.');
    this.error.set('');
  }

  productSearchFor(value: string): void {
    this.productSearch.set(value);
    this.productPage.set(0);
    this.loadingProducts.set(true);
    this.productSearchChanges.next(value.trim());
  }

  supplierSearchFor(value: string): void {
    this.supplierSearch.set(value);
    this.supplierPage.set(0);
    this.loadingSuppliers.set(true);
    this.supplierSearchChanges.next(value.trim());
  }

  changeProductPage(direction: -1 | 1): void {
    const next = this.productPage() + direction;
    if (next < 0 || next >= this.productTotalPages()) return;
    this.loadingProducts.set(true);
    this.productsService.load({ limit: PAGE_SIZE, offset: next * PAGE_SIZE, search: this.productSearch() }).subscribe({
      next: (page) => {
        this.products.set(page.items);
        this.productPage.set(next);
        this.productTotalPages.set(page.totalPages);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
        this.error.set('Não foi possível carregar esta página de produtos.');
      },
    });
  }

  changeSupplierPage(direction: -1 | 1): void {
    const next = this.supplierPage() + direction;
    if (next < 0 || next >= this.supplierTotalPages()) return;
    this.loadingSuppliers.set(true);
    this.suppliersService.loadRanking({ limit: PAGE_SIZE, offset: next * PAGE_SIZE, search: this.supplierSearch() }).subscribe({
      next: (page) => {
        this.suppliers.set(page.items);
        this.supplierPage.set(next);
        this.supplierTotalPages.set(page.totalPages);
        this.loadingSuppliers.set(false);
      },
      error: () => {
        this.loadingSuppliers.set(false);
        this.error.set('Não foi possível carregar esta página de fornecedores.');
      },
    });
  }

  next(): void {
    if (this.step() === 0) {
      if (!this.hasProductChoice() || this.batchForm.invalid) {
        this.batchForm.markAllAsTouched();
        this.error.set(
          !this.hasProductChoice()
            ? 'Selecione ou preencha um produto para continuar.'
            : 'Informe uma quantidade maior que zero e a data de produção.',
        );
        return;
      }
      this.error.set('');
      this.step.set(1);
      return;
    }
    if (this.step() === 1) {
      if (!this.hasSupplierChoice()) {
        this.error.set('Selecione ou preencha um fornecedor para continuar.');
        return;
      }
      this.error.set('');
      this.step.set(2);
    }
  }

  previous(): void {
    if (this.step() > 0 && !this.saving()) {
      this.error.set('');
      this.step.update((step) => step - 1);
    }
  }

  submit(): void {
    if (this.step() !== 2 || this.saving() || !this.hasProductChoice() || !this.hasSupplierChoice()) {
      return;
    }
    if (this.batchForm.invalid) {
      this.step.set(0);
      this.batchForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.savedNotice.set('');
    this.resolveProduct((productId) => this.resolveSupplier((supplierId) => this.createBatch(productId, supplierId)));
  }

  requestDismiss(): void {
    if (!this.saving() && !this.hasPartialCreation()) this.dismiss.emit();
  }

  backdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.requestDismiss();
  }

  productName(): string {
    return this.selectedProduct()?.name ?? this.createdProduct?.name ?? this.pendingProduct?.name ?? '';
  }

  supplierName(): string {
    const supplier = this.selectedSupplier() ?? this.ownSupplier();
    return supplier?.name ?? (this.createdSupplier ? this.createdSupplier.name : this.pendingSupplier?.name ?? '');
  }

  supplierScore(supplier: SupplierRankingResponseDTO): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(
      supplier.sustainabilityScore,
    );
  }

  isPendingProduct(): boolean {
    return !!this.pendingProduct;
  }

  isPendingSupplier(): boolean {
    return !!this.pendingSupplier;
  }

  hasProductChoice(): boolean {
    return !!(this.selectedProduct() || this.createdProduct || this.pendingProduct);
  }

  hasSupplierChoice(): boolean {
    return !!(this.selectedSupplier() || this.createdSupplier || this.pendingSupplier || this.ownSupplierId);
  }

  hasPartialCreation(): boolean {
    return !!(this.createdProduct || this.createdSupplier);
  }

  persistedProductName(): string {
    return this.createdProduct?.name ?? '';
  }

  persistedSupplierName(): string {
    return this.createdSupplier?.name ?? '';
  }

  hasPersistedProduct(): boolean {
    return !!this.createdProduct;
  }

  hasPersistedSupplier(): boolean {
    return !!this.createdSupplier;
  }

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsService.load({ limit: PAGE_SIZE, offset: 0 }).subscribe({
      next: (page) => {
        this.products.set(page.items);
        this.productTotalPages.set(page.totalPages);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os produtos. Tente novamente.');
        this.loadingProducts.set(false);
      },
    });
  }

  private loadSuppliers(): void {
    this.loadingSuppliers.set(true);
    this.suppliersService.loadRanking({ limit: PAGE_SIZE, offset: 0 }).subscribe({
      next: (page) => {
        this.suppliers.set(page.items);
        this.supplierTotalPages.set(page.totalPages);
        this.loadingSuppliers.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar os fornecedores. Tente novamente.');
        this.loadingSuppliers.set(false);
      },
    });
  }

  private loadOwnSupplier(): void {
    this.usersService.loadCurrentUser().pipe(
      switchMap((user) => {
        this.ownSupplierId = user.userId;
        return this.suppliersService.get(user.userId);
      }),
    ).subscribe({
      next: (supplier) => {
        this.ownSupplier.set(supplier);
        this.selectedSupplier.set(supplier);
        this.loadingSuppliers.set(false);
      },
      error: () => {
        this.loadingSuppliers.set(false);
        this.error.set('Não foi possível identificar o fornecedor vinculado à sua conta.');
      },
    });
  }

  retryChoices(): void {
    this.error.set('');
    if (!this.selectedProduct() && !this.pendingProduct && !this.createdProduct) this.loadProducts();
    if (this.isAdmin && !this.selectedSupplier() && !this.pendingSupplier && !this.createdSupplier) {
      this.loadSuppliers();
    } else if (this.isSupplier && !this.ownSupplier()) {
      this.loadingSuppliers.set(true);
      this.loadOwnSupplier();
    }
  }

  private resolveProduct(done: (productId: number) => void): void {
    const existing = this.createdProduct ?? this.selectedProduct();
    if (existing) {
      done(existing.productId);
      return;
    }
    if (!this.pendingProduct || !this.isAdmin) {
      this.fail('Selecione um produto existente.');
      return;
    }
    this.productsService.create(this.pendingProduct).subscribe({
      next: (product) => {
        this.createdProduct = product;
        this.savedNotice.set('Produto cadastrado. Continuando a criação do lote…');
        done(product.productId);
      },
      error: () => this.fail('Não foi possível cadastrar o produto. Seus dados continuam preenchidos.'),
    });
  }

  private resolveSupplier(done: (supplierId: number) => void): void {
    const selected = this.selectedSupplier() ?? this.createdSupplier;
    if (selected) {
      done(selected.supplierId);
      return;
    }
    if (this.ownSupplierId) {
      done(this.ownSupplierId);
      return;
    }
    if (!this.pendingSupplier || !this.isAdmin) {
      this.fail('Selecione um fornecedor existente.');
      return;
    }
    this.suppliersService.create(this.pendingSupplier).subscribe({
      next: (supplier) => {
        this.createdSupplier = supplier;
        this.savedNotice.set('Fornecedor cadastrado. Continuando a criação do lote…');
        done(supplier.supplierId);
      },
      error: () =>
        this.fail(
          this.createdProduct
            ? 'Não foi possível cadastrar o fornecedor. O produto já salvo foi mantido para a próxima tentativa.'
            : 'Não foi possível cadastrar o fornecedor. Seus dados continuam preenchidos.',
        ),
    });
  }

  private createBatch(productId: number, supplierId: number): void {
    const request: BatchRequestDTO = {
      productId,
      supplierId,
      quantity: Number(this.batchForm.controls.quantity.value),
      producedAt: this.batchForm.controls.producedAt.value,
    };
    this.batches.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit();
      },
      error: () => this.fail('Não foi possível criar o lote. Os cadastros já salvos foram preservados; tente novamente.'),
    });
  }

  private fail(message: string): void {
    this.saving.set(false);
    this.error.set(message);
  }

  private emptySupplierForm() {
    return {
      name: '', cnpj: '', phone: '', street: '', number: '', neighborhood: '',
      complement: '', zipCode: '', city: '', state: '',
    };
  }
}
