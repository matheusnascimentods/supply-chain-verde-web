import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { USER_ROLES } from '../../../../../core/auth/session/index.model';
import { EnumSelectComponent } from '../../../../../shared/ui/enum-select/index.component';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/index.use-case';
import { newUserSchema } from '../../../domain/index.model';

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

  readonly created = output<void>();
  readonly dismissed = output<void>();

  protected readonly roles = USER_ROLES;
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
      error: () => {
        this.saving.set(false);
        this.error.set('Não foi possível salvar. Confira os dados e tente novamente.');
      },
    });
  }
}
