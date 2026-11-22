import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SpinnerComponent } from '../../../../../shared/ui/spinner/index.component';
import { ErrorToastComponent } from '../../../../../shared/ui/error-toast/index.component';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { LoginUseCase } from '../../../application/use-cases/login/index.use-case';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, SpinnerComponent, ErrorToastComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly login = inject(LoginUseCase);
  private readonly router = inject(Router);
  private readonly toastService = inject(ErrorToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  isFieldInvalid(fieldName: 'email' | 'password'): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getEmailErrorMessage(): string | null {
    const control = this.loginForm.get('email');
    if (control?.hasError('required')) {
      return 'O e-mail é obrigatório.';
    }
    if (control?.hasError('email')) {
      return 'Informe um e-mail com formato válido.';
    }
    return null;
  }

  getPasswordErrorMessage(): string | null {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) {
      return 'A senha é obrigatória.';
    }
    return null;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    if (!email || !password) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.login.execute({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        // O 401 não está entre os status do apiErrorMessage: credencial errada cai sempre na mensagem genérica,
        // que não diz se o email existe. O 429 (rate limit) mostra a mensagem da API.
        const message = apiErrorMessage(
          error,
          'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
        );
        this.errorMessage.set(message);
        this.toastService.show(message);
        this.cdr.markForCheck();
      },
    });
  }
}
