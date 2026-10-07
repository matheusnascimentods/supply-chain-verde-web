import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { AuthRepository } from '../../../infrastructure/index.repository';
import { LoginUseCase } from './index.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let repository: { login: ReturnType<typeof vi.fn> };
  let session: SessionService;
  const credentials = { email: 'test@example.com', password: 'password123' };

  beforeEach(() => {
    sessionStorage.clear();
    repository = { login: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: AuthRepository, useValue: repository }] });
    useCase = TestBed.inject(LoginUseCase);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => sessionStorage.clear());

  it('opens the session with the token, role and e-mail after a successful login', () => {
    repository.login.mockReturnValue(of({ token: 'jwt-token', expiresAt: '2099-01-01', role: 'admin' }));

    useCase.execute(credentials).subscribe();

    expect(repository.login).toHaveBeenCalledWith(credentials);
    expect(session.token).toBe('jwt-token');
    expect(session.role()).toBe('admin');
    expect(session.email()).toBe('test@example.com');
    expect(session.isAuthenticated()).toBe(true);
  });

  it('does not open a session when the login fails', () => {
    repository.login.mockReturnValue(throwError(() => new Error('401')));
    let failed = false;

    useCase.execute(credentials).subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
    expect(session.hasSession()).toBe(false);
  });
});
