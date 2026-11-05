import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { EnumSelectComponent } from '../../../../../shared/ui/enum-select/index.component';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/index.use-case';
import { newUserSchema } from '../../../domain/index.model';
import { creatableRoles } from '../../../domain/index.rules';

@Component({
  selector: 'app-create-user-modal',
  imports: [ReactiveFormsModule, EnumSelectComponent, ModalComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createUser = inject(CreateUserUseCase);
  private readonly toast = inject(ErrorToastService);

  readonly created = output<void>();
  readonly dismissed = output<void>();

  // O usuário nasce na companhia de quem cria, então só os perfis do tipo dela (RF-11).
  protected readonly roles = creatableRoles(inject(SessionService).companyType());
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    role: ['', [Validators.required]],
  });

  submit(): void {
    const parsed = newUserSchema.safeParse(this.form.getRawValue());
    if (this.form.invalid || !parsed.success) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.createUser.execute(parsed.data).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const message = apiErrorMessage(error, 'Não foi possível salvar. Confira os dados e tente novamente.');
        // 409 (limite do plano ou email em uso) vira toast com a mensagem da API (RF-11); o resto fica no modal.
        if (error instanceof HttpErrorResponse && error.status === 409) this.toast.show(message);
        else this.error.set(message);
      },
    });
  }
}
