import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ROLE_LABELS } from '../../../../../core/auth/session/index.model';
import { MIN_PASSWORD_LENGTH, passwordErrors } from '../../../../../shared/forms/password/index.validator';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { ErrorToastComponent } from '../../../../../shared/ui/error-toast/index.component';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { SpinnerComponent } from '../../../../../shared/ui/spinner/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { PublicHeaderComponent } from '../../../../signup';
import { AcceptInviteUseCase } from '../../../application/use-cases/accept/index.use-case';
import { InviteDetails } from '../../../domain/index.model';
import { InvitesRepository } from '../../../infrastructure/index.repository';

type State = 'loading' | 'invalid' | 'error' | 'form';

const isNotFound = (error: unknown) => error instanceof HttpErrorResponse && error.status === 404;

@Component({
  selector: 'app-accept-invite',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, ErrorToastComponent, SpinnerComponent, TextFieldComponent, PublicHeaderComponent],
  templateUrl: './index.component.html',
  // Mesmo visual do cadastro de empresa.
  styleUrl: '../../../../signup/presentation/pages/sign-up/index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInviteComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly repository = inject(InvitesRepository);
  private readonly acceptInvite = inject(AcceptInviteUseCase);
  private readonly toast = inject(ErrorToastService);
  // Texto puro do link; o hash fica só na API.
  private readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly state = signal<State>('loading');
  protected readonly invite = signal<InviteDetails | null>(null);
  protected readonly saving = signal(false);
  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: (group) => passwordErrors(group.getRawValue()) },
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.repository.find(this.token).subscribe({
      next: (invite) => {
        this.invite.set(invite);
        this.state.set('form');
      },
      error: (error: unknown) => this.state.set(isNotFound(error) ? 'invalid' : 'error'),
    });
  }

  protected nameError(): string {
    const { name } = this.form.controls;
    return name.touched && name.hasError('required') ? 'Campo obrigatório.' : '';
  }

  protected passwordError(): string {
    const { password } = this.form.controls;
    if (!password.touched) return '';
    if (password.hasError('required')) return 'Campo obrigatório.';
    return this.form.hasError('passwordTooShort') ? `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` : '';
  }

  protected confirmPasswordError(): string {
    const { confirmPassword } = this.form.controls;
    if (!confirmPassword.touched) return '';
    if (confirmPassword.hasError('required')) return 'Campo obrigatório.';
    return this.form.hasError('passwordMismatch') ? 'As senhas não conferem.' : '';
  }

  protected submit(): void {
    const invite = this.invite();
    if (!invite || this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, password } = this.form.getRawValue();
    this.saving.set(true);
    this.acceptInvite.execute({ token: this.token, name: name.trim(), password }, invite.email).subscribe({
      next: () => this.router.navigate(['/dashboard'], { replaceUrl: true }),
      error: (error: unknown) => {
        this.saving.set(false);
        // 404: expirou ou foi usado entre abrir e enviar (RF-10).
        if (isNotFound(error)) this.state.set('invalid');
        else this.toast.show(apiErrorMessage(error, 'Não foi possível aceitar o convite. Tente novamente.'));
      },
    });
  }
}
