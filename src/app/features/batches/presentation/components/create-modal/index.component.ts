import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { BatchCreationFacade } from '../../../application/create-batch/index.facade';
import { isRecommended } from '../../../domain/index.rules';
import { NewProductFormComponent } from '../new-product-form/index.component';
import { NewSupplierFormComponent } from '../new-supplier-form/index.component';

@Component({
  selector: 'app-batch-create-modal',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    PaginationComponent,
    TextFieldComponent,
    ModalComponent,
    NewProductFormComponent,
    NewSupplierFormComponent,
  ],
  providers: [BatchCreationFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchCreateModalComponent {
  protected readonly facade = inject(BatchCreationFacade);
  protected readonly steps = ['Produto', 'Fornecedor', 'Revisão'];
  protected readonly score = formatNumberBr;
  protected readonly isRecommended = isRecommended;

  readonly dismiss = output<void>();
  readonly created = output<void>();

  readonly batchForm = inject(FormBuilder).nonNullable.group({
    quantity: [null as number | null, [Validators.required, Validators.min(0.000001)]],
    producedAt: ['', Validators.required],
  });

  next(): void {
    const advanced = this.facade.next(this.batchForm.valid);
    if (!advanced && this.facade.step() === 0) this.batchForm.markAllAsTouched();
  }

  back(): void {
    if (this.facade.step() === 0) this.requestDismiss();
    else this.facade.previous();
  }

  submit(): void {
    const facade = this.facade;
    if (facade.step() !== 2 || facade.saving() || !facade.hasProductChoice() || !facade.hasSupplierChoice()) return;
    if (this.batchForm.invalid) {
      facade.step.set(0);
      this.batchForm.markAllAsTouched();
      return;
    }
    const { quantity, producedAt } = this.batchForm.getRawValue();
    facade.submit({ quantity: Number(quantity), producedAt }).subscribe({
      complete: () => this.created.emit(),
      error: () => undefined,
    });
  }

  requestDismiss(): void {
    if (!this.facade.saving() && !this.facade.hasPartialCreation()) this.dismiss.emit();
  }
}
