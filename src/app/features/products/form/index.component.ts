import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { ProductsService } from '../index.service';
import { EnumSelectComponent } from '../../../shared/components/enum-select/index.component';
import { productCategorySchema, productUnitSchema } from '../index.schema';

@Component({
  selector: 'app-products-form',
  imports: [ReactiveFormsModule, RouterLink, EnumSelectComponent, NgTemplateOutlet],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private previousFocus: HTMLElement | null = null;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  @ViewChild('firstField') private firstField?: ElementRef<HTMLInputElement>;

  readonly modal = input(false);
  readonly saved = output<void>();
  readonly dismissed = output<void>();

  readonly editing = signal(!!this.route.snapshot.paramMap.get('id'));
  readonly saving = signal(false);
  readonly error = signal('');

  readonly productCategorySchema = productCategorySchema;
  readonly productUnitSchema = productUnitSchema;
  readonly productCategoryLabels: Record<string, string> = {
    AGRICULTURE: 'Agricultura',
    LIVESTOCK: 'Pecuária',
    PROCESSED_FOOD: 'Alimentos processados',
    TEXTILE: 'Têxtil',
    FORESTRY: 'Silvicultura',
    OTHER: 'Outro',
  };
  readonly productUnitLabels: Record<string, string> = {
    KG: 'Quilograma (kg)',
    TON: 'Tonelada (t)',
    LITER: 'Litro (L)',
    UNIT: 'Unidade (un)',
    M3: 'Metro cúbico (m³)',
  };

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', []],
    category: ['', [Validators.required]],
    unit: ['', [Validators.required]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.service.get(Number(id)).subscribe({
        next: (product) =>
          this.form.patchValue({
            name: product.name,
            description: product.description,
            category: product.category,
            unit: product.unit,
          }),
        error: () => this.error.set('Não foi possível carregar o produto.'),
      });
    }
  }

  ngAfterViewInit(): void {
    if (!this.modal()) return;
    this.previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    queueMicrotask(() => this.firstField?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.previousFocus?.focus();
  }

  closeModal(): void {
    if (!this.saving()) this.dismissed.emit();
  }

  handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.dialog?.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) {
      event.preventDefault();
      this.dialog?.nativeElement.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private data(): any {
    const value = this.form.getRawValue();
    return value;
  }

  fieldError(field: 'name' | 'category' | 'unit'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.hasError('required')) return '';

    const labels = { name: 'o nome', category: 'a categoria', unit: 'a unidade' };
    return `Informe ${labels[field]}.`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    (this.editing()
      ? this.service.update(Number(this.route.snapshot.paramMap.get('id')), this.data())
      : this.service.create(this.data())
    ).subscribe({
      next: () => {
        this.saving.set(false);
        if (this.modal()) {
          this.saved.emit();
          return;
        }
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');
      },
    });
  }
}
