import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { InvitesRepository } from '../../../infrastructure/index.repository';
import { AcceptInviteUseCase } from './index.use-case';

describe('AcceptInviteUseCase', () => {
  const accept = vi.fn();
  const acceptance = { token: 'abc', name: 'Ana', password: 'segredo123' };
  let useCase: AcceptInviteUseCase;
  let session: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    accept.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: InvitesRepository, useValue: { accept } }] });
    useCase = TestBed.inject(AcceptInviteUseCase);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => sessionStorage.clear());

  it('opens the session with the role of the invite', () => {
    accept.mockReturnValue(of({ token: 'jwt', expiresAt: '2099-01-01', role: 'manager' }));

    useCase.execute(acceptance, 'ana@example.com').subscribe();

    expect(accept).toHaveBeenCalledWith(acceptance);
    expect(session.token).toBe('jwt');
    expect(session.role()).toBe('manager');
    expect(session.email()).toBe('ana@example.com');
  });

  it('keeps the session closed when the invite is refused', () => {
    accept.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    let failed = false;
    useCase.execute(acceptance, 'ana@example.com').subscribe({ error: () => (failed = true) });
    expect(failed).toBe(true);
    expect(session.hasSession()).toBe(false);
  });
});
