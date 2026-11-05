import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EnumSelectComponent } from '../../../../../shared/ui/enum-select/index.component';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_UNITS,
  PRODUCT_UNIT_LABELS,
  ProductCategory,
  ProductUnit,
} from '../../../../products';
import { BatchCreationFacade } from '../../../application/create-batch/index.facade';
import { isRecommended } from '../../../domain/index.rules';

@Component({
  selector: 'app-batch-create-modal',
  imports: [ReactiveFormsModule, FormsModule, EnumSelectComponent, PaginationComponent, TextFieldComponent, ModalComponent],
  providers: [BatchCreationFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchCreateModalComponent {
  protected readonly facade = inject(BatchCreationFacade);
  protected readonly steps = ['Produto', 'Fornecedor', 'Produto do fornecedor', 'Revisão'];
  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly categoryLabels = PRODUCT_CATEGORY_LABELS;
  protected readonly units = PRODUCT_UNITS;
  protected readonly unitLabels = PRODUCT_UNIT_LABELS;
  protected readonly score = formatNumberBr;
  protected readonly isRecommended = isRecommended;

  readonly dismiss = output<void>();
  readonly created = output<void>();

  // A quantidade é informada na revisão (RF-13).
  readonly quantity = inject(FormBuilder).control<number | null>(null, [Validators.required, Validators.min(0.000001)]);

  protected setCategory(value: string): void {
    this.facade.setCategory(PRODUCT_CATEGORIES.find((category) => category === value) ?? null);
  }

  protected setUnit(value: string): void {
    this.facade.setUnit(PRODUCT_UNITS.find((unit) => unit === value) ?? null);
  }

  protected quantityError(): string {
    return this.quantity.touched && this.quantity.invalid ? 'Informe uma quantidade maior que zero.' : '';
  }

  next(): void {
    this.facade.next();
  }

  back(): void {
    if (this.facade.step() === 0) this.requestDismiss();
    else this.facade.previous();
  }

  submit(): void {
    const facade = this.facade;
    if (facade.step() !== 3 || facade.saving() || !facade.selectedProduct() || !facade.selectedSupplier()) return;
    if (this.quantity.invalid) {
      this.quantity.markAsTouched();
      return;
    }
    facade.submit(Number(this.quantity.value)).subscribe({
      next: () => this.created.emit(),
      error: () => undefined,
    });
  }

  requestDismiss(): void {
    if (!this.facade.saving()) this.dismiss.emit();
  }

  protected categoryOf(value: ProductCategory | null): string {
    return value ? PRODUCT_CATEGORY_LABELS[value] : '';
  }

  protected unitOf(value: ProductUnit | null): string {
    return value ? PRODUCT_UNIT_LABELS[value] : '';
  }
}
