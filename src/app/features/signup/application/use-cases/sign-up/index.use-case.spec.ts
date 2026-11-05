import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { CompanySignup } from '../../../domain/index.model';
import { SignupRepository } from '../../../infrastructure/index.repository';
import { SignUpConflict, SignUpUseCase } from './index.use-case';

describe('SignUpUseCase', () => {
  let useCase: SignUpUseCase;
  let session: SessionService;
  const register = vi.fn();
  const signup = { planCode: 'PRO', admin: { email: 'ana@bompreco.com' } } as CompanySignup;
  const conflict = (message: string) => throwError(() => new HttpErrorResponse({ status: 409, error: { message } }));

  function failure(): unknown {
    let error: unknown;
    useCase.execute(signup).subscribe({ error: (value) => (error = value) });
    return error;
  }

  beforeEach(() => {
    sessionStorage.clear();
    register.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: SignupRepository, useValue: { register } }] });
    useCase = TestBed.inject(SignUpUseCase);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => sessionStorage.clear());

  it('opens the session like the login after the company is created', () => {
    register.mockReturnValue(of({ token: 'jwt', expiresAt: '2099-01-01', role: 'admin' }));

    useCase.execute(signup).subscribe();

    expect(register).toHaveBeenCalledWith(signup);
    expect(session.token).toBe('jwt');
    expect(session.role()).toBe('admin');
    expect(session.email()).toBe('ana@bompreco.com');
  });

  it('maps a CNPJ conflict to the company step', () => {
    register.mockReturnValue(conflict('CNPJ já cadastrado: 12345678000190'));
    expect(failure()).toEqual(new SignUpConflict('company', 'CNPJ já cadastrado: 12345678000190'));
    expect(session.hasSession()).toBe(false);
  });

  it('maps an e-mail conflict to the admin step', () => {
    register.mockReturnValue(conflict('Email já cadastrado: ana@bompreco.com'));
    const error = failure();
    expect(error).toBeInstanceOf(SignUpConflict);
    expect((error as SignUpConflict).step).toBe('admin');
  });

  it('passes other errors through untouched', () => {
    const serverError = new HttpErrorResponse({ status: 500 });
    register.mockReturnValue(throwError(() => serverError));
    expect(failure()).toBe(serverError);
  });
});
