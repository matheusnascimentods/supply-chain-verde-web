import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SessionService } from '../../../../core/session/index.service';
import { UsersService } from '../../../users/index.service';
import { ProductResponseDTO } from '../../../products/index.schema';
import { ProductsService } from '../../../products/index.service';
import { SupplierResponseDTO } from '../../../suppliers/index.schema';
import { SuppliersService } from '../../../suppliers/index.service';
import { BatchesService } from '../../index.service';

@Component({
  selector: 'app-batch-create-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchCreateModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  private readonly previousFocus = typeof document === 'undefined' ? null : document.activeElement as HTMLElement;
  private readonly fb = inject(FormBuilder);
  private readonly batches = inject(BatchesService);
  private readonly productsService = inject(ProductsService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly usersService = inject(UsersService);
  private readonly session = inject(SessionService);

  readonly dismiss = output<void>();
  readonly created = output<void>();
  readonly products = signal<ProductResponseDTO[]>([]);
  readonly suppliers = signal<SupplierResponseDTO[]>([]);
  readonly loadingChoices = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly isAdmin = this.session.role() === 'admin';
  private currentUserId: number | null = null;

  readonly form = this.fb.group({
    productId: ['', Validators.required],
    supplierId: ['', this.isAdmin ? Validators.required : []],
    quantity: [null as number | null, [Validators.required, Validators.min(0.000001)]],
    producedAt: ['', Validators.required],
  });

  constructor() {
    const products$ = this.productsService.loadAll();
    const user$ = this.usersService.loadCurrentUser();
    if (this.isAdmin) {
      forkJoin({ products: products$, user: user$, suppliers: this.suppliersService.load() }).subscribe({
        next: ({ products, user, suppliers }) => this.setChoices(products, user.userId, suppliers),
        error: () => this.failChoices(),
      });
    } else {
      forkJoin({ products: products$, user: user$ }).subscribe({
        next: ({ products, user }) => this.setChoices(products, user.userId, []),
        error: () => this.failChoices(),
      });
    }
  }

  ngAfterViewInit(): void { this.dialog?.nativeElement.focus(); }
  ngOnDestroy(): void { this.previousFocus?.focus(); }

  @HostListener('keydown', ['$event'])
  keepFocusInDialog(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestDismiss();
      return;
    }
    if (event.key !== 'Tab' || !this.dialog) return;
    const focusable = Array.from(this.dialog.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.offsetParent !== null);
    if (!focusable.length) { event.preventDefault(); this.dialog.nativeElement.focus(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !this.dialog.nativeElement.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !this.dialog.nativeElement.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }

  submit(): void {
    if (this.form.invalid || this.loadingChoices() || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const supplierId = this.isAdmin ? Number(value.supplierId) : this.currentUserId;
    if (!supplierId) {
      this.error.set('Não foi possível identificar o fornecedor vinculado à sua conta.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.batches.create({
      productId: Number(value.productId),
      supplierId,
      quantity: Number(value.quantity),
      producedAt: value.producedAt!,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível cadastrar o lote. Confira os dados e tente novamente.');
      },
    });
  }

  requestDismiss(): void {
    if (!this.saving()) this.dismiss.emit();
  }

  backdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.requestDismiss();
  }

  private setChoices(products: ProductResponseDTO[], userId: number, suppliers: SupplierResponseDTO[]): void {
    this.products.set(products);
    this.suppliers.set(suppliers);
    this.currentUserId = userId;
    this.loadingChoices.set(false);
  }

  private failChoices(): void {
    this.error.set('Não foi possível carregar produtos e fornecedores. Tente fechar e abrir o formulário novamente.');
    this.loadingChoices.set(false);
  }
}
