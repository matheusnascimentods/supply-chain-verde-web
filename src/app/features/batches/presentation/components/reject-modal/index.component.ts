import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { MAX_REJECTION_REASON_LENGTH, RejectBatchUseCase } from '../../../application/use-cases/reject-batch/index.use-case';
import { Batch } from '../../../domain/index.model';

@Component({
  selector: 'app-batch-reject-modal',
  imports: [ReactiveFormsModule, ButtonComponent, ModalComponent, TextFieldComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchRejectModalComponent {
  private readonly rejectBatch = inject(RejectBatchUseCase);

  readonly batch = input.required<Batch>();
  readonly rejected = output<void>();
  readonly dismissed = output<void>();

  protected readonly maxLength = MAX_REJECTION_REASON_LENGTH;
  readonly saving = signal(false);
  readonly error = signal('');
  // O [formGroup] no <form> é o que faz o (ngSubmit) do Angular existir; sem ele, o navegador envia o form sozinho.
  // Espaços em branco não contam como motivo.
  readonly form = inject(FormBuilder).nonNullable.group({ reason: ['', [Validators.required, Validators.pattern(/\S/)]] });
  readonly reason = this.form.controls.reason;

  protected reasonError(): string {
    return this.reason.touched && this.reason.invalid ? 'Informe o motivo da recusa.' : '';
  }

  submit(): void {
    if (this.reason.invalid || this.saving()) {
      this.reason.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.rejectBatch.execute(this.batch().batchId, this.reason.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.rejected.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        // 409 (o lote já saiu de PENDING) e 403 vêm com a mensagem da API.
        this.error.set(apiErrorMessage(error, 'Não foi possível recusar o lote. Tente novamente.'));
      },
    });
  }
}
