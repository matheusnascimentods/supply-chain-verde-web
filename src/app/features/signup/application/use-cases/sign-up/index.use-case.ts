import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { CompanySignup } from '../../../domain/index.model';
import { SignUpResponseDTO } from '../../../infrastructure/index.dto';
import { SignupRepository } from '../../../infrastructure/index.repository';

export type SignUpStep = 'company' | 'admin';

/** 409 de CNPJ ou email: `step` diz em qual passo do cadastro mostrar a mensagem da API. */
export class SignUpConflict extends Error {
  constructor(
    readonly step: SignUpStep,
    message: string,
  ) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class SignUpUseCase {
  private readonly repository = inject(SignupRepository);
  private readonly session = inject(SessionService);

  execute(signup: CompanySignup): Observable<SignUpResponseDTO> {
    return this.repository.register(signup).pipe(
      tap((response) => this.session.setSession(response.token, response.role, signup.admin.email)),
      catchError((error: unknown) => throwError(() => conflictOf(error) ?? error)),
    );
  }
}

// A API responde "CNPJ já cadastrado: …" ou "Email já cadastrado: …" (só o email do admin é único).
function conflictOf(error: unknown): SignUpConflict | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 409) return null;
  const message: unknown = error.error?.message;
  if (typeof message !== 'string') return null;
  if (/cnpj/i.test(message)) return new SignUpConflict('company', message);
  if (/email/i.test(message)) return new SignUpConflict('admin', message);
  return null;
}
