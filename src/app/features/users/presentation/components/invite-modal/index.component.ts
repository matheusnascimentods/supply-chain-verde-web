import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ROLE_LABELS } from '../../../../../core/auth/session/index.model';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { EnumSelectComponent } from '../../../../../shared/ui/enum-select/index.component';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { SendInviteUseCase } from '../../../application/use-cases/send-invite/index.use-case';
import { newInviteSchema } from '../../../domain/index.model';
import { creatableRoles } from '../../../domain/index.rules';

@Component({
  selector: 'app-invite-user-modal',
  imports: [ReactiveFormsModule, EnumSelectComponent, ModalComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly sendInvite = inject(SendInviteUseCase);
  private readonly toast = inject(ErrorToastService);

  // Emite o email convidado.
  readonly invited = output<string>();
  readonly dismissed = output<void>();

  // O convidado entra na companhia de quem convida, então só os perfis do tipo dela (RF-02).
  protected readonly roles = creatableRoles(inject(SessionService).companyType());
  protected readonly roleLabels = ROLE_LABELS;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['', [Validators.required]],
  });

  submit(): void {
    const parsed = newInviteSchema.safeParse(this.form.getRawValue());
    if (this.form.invalid || !parsed.success) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.sendInvite.execute(parsed.data).subscribe({
      next: () => {
        this.saving.set(false);
        this.invited.emit(parsed.data.email);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const message = apiErrorMessage(error, 'Não foi possível enviar o convite. Confira os dados e tente novamente.');
        // 409 (email em uso, convite ativo, limite do plano) e 502 (falha no envio) viram toast (RF-04); o resto fica no modal.
        if (error instanceof HttpErrorResponse && (error.status === 409 || error.status === 502)) this.toast.show(message);
        else this.error.set(message);
      },
    });
  }
}
