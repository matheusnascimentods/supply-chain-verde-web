import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { EnumSelectComponent } from '../../../../../shared/ui/enum-select/index.component';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, PRODUCT_UNITS, PRODUCT_UNIT_LABELS, ProductCategory, ProductUnit } from '../../../domain/index.model';
import { ProductsRepository } from '../../../infrastructure/index.repository';

/** RF-16: o produto nasce no fornecedor do usuário logado (RN-16 da API). */
@Component({
  selector: 'app-product-create-modal',
  imports: [ReactiveFormsModule, ButtonComponent, EnumSelectComponent, ModalComponent, TextFieldComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCreateModalComponent {
  private readonly repository = inject(ProductsRepository);

  readonly created = output<void>();
  readonly dismissed = output<void>();

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly categoryLabels = PRODUCT_CATEGORY_LABELS;
  protected readonly units = PRODUCT_UNITS;
  protected readonly unitLabels = PRODUCT_UNIT_LABELS;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    category: ['', Validators.required],
    unit: ['', Validators.required],
    description: [''],
  });

  protected fieldError(name: 'name' | 'category' | 'unit'): string {
    const control = this.form.controls[name];
    if (!control.touched || control.valid) return '';
    return name === 'name' ? 'Informe o nome do produto.' : name === 'category' ? 'Selecione a categoria.' : 'Selecione a unidade.';
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, category, unit, description } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    this.repository
      .create({ name: name.trim(), category: category as ProductCategory, unit: unit as ProductUnit, description: description.trim() })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.created.emit();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(apiErrorMessage(error, 'Não foi possível cadastrar o produto. Tente novamente.'));
        },
      });
  }
}
