import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NewProduct,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_UNITS,
  PRODUCT_UNIT_LABELS,
  ProductCategory,
  ProductUnit,
} from '../../../domain/product/index.model';

@Component({
  selector: 'app-new-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProductFormComponent {
  readonly submitted = output<NewProduct>();
  readonly incomplete = output<void>();

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly categoryLabels = PRODUCT_CATEGORY_LABELS;
  protected readonly units = PRODUCT_UNITS;
  protected readonly unitLabels = PRODUCT_UNIT_LABELS;

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    unit: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.incomplete.emit();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      name: value.name,
      description: value.description,
      category: value.category as ProductCategory,
      unit: value.unit as ProductUnit,
    });
  }
}
