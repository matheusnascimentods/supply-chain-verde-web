import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { AcceptInviteUseCase } from '../../../application/use-cases/accept/index.use-case';
import { InvitesRepository } from '../../../infrastructure/index.repository';
import { AcceptInviteComponent } from './index.component';

@Component({ template: '' })
class BlankComponent {}

describe('AcceptInviteComponent', () => {
  const invite = { email: 'ana@example.com', role: 'manager', companyName: 'Mercado Bom Preço', expiresAt: '2026-11-17T12:00:00Z' };
  const find = vi.fn();
  const execute = vi.fn();
  let harness: RouterTestingHarness;
  let element: HTMLElement;
  let toast: ErrorToastService;

  const httpError = (status: number, message?: string) => throwError(() => new HttpErrorResponse({ status, error: { message } }));

  async function open(response: Observable<unknown> = of(invite)): Promise<void> {
    find.mockReset().mockReturnValue(response);
    execute.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'convites/:token', component: AcceptInviteComponent },
          { path: 'dashboard', component: BlankComponent },
          { path: 'login', component: BlankComponent },
        ]),
        { provide: InvitesRepository, useValue: { find } },
        { provide: AcceptInviteUseCase, useValue: { execute } },
      ],
    });
    toast = TestBed.inject(ErrorToastService);
    harness = await RouterTestingHarness.create('/convites/abc123');
    element = harness.routeNativeElement!;
  }

  function type(id: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function submit(): Promise<void> {
    element.querySelector<HTMLButtonElement>('[data-testid="invite-submit"]')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function fill(password = 'segredo123', confirmPassword = password): void {
    type('invite-name', ' Ana ');
    type('invite-password', password);
    type('invite-confirm-password', confirmPassword);
    harness.detectChanges();
  }

  afterEach(() => toast.clear());

  it('shows a spinner while the invite loads', async () => {
    await open(new Observable());
    expect(element.querySelector('app-spinner')).not.toBeNull();
    expect(element.querySelector('form')).toBeNull();
  });

  it('loads the invite of the link token and shows its details read-only', async () => {
    await open();
    expect(find).toHaveBeenCalledWith('abc123');
    const details = element.querySelector('dl')!.textContent;
    expect(details).toContain('ana@example.com');
    expect(details).toContain('Mercado Bom Preço');
    expect(details).toContain('Gestor');
    expect(element.querySelector('#invite-email')).toBeNull();
  });

  it('shows the invalid notice with a login link, without the form, when the invite is not found', async () => {
    await open(httpError(404));
    const notice = element.querySelector('[data-testid="invite-invalid"]')!;
    expect(notice.textContent).toContain('Convite inválido ou expirado. Peça um novo convite ao administrador da sua empresa.');
    expect(notice.querySelector('a')?.getAttribute('href')).toBe('/login');
    expect(element.querySelector('form')).toBeNull();
  });

  it('offers a retry when loading fails for another reason', async () => {
    await open(httpError(500));
    expect(element.querySelector('[data-testid="invite-error"]')).not.toBeNull();

    find.mockReturnValue(of(invite));
    element.querySelector<HTMLButtonElement>('[data-testid="invite-error"] button')!.click();
    harness.detectChanges();
    expect(find).toHaveBeenCalledTimes(2);
    expect(element.querySelector('form')).not.toBeNull();
  });

  it.each([
    ['segredo', 'segredo', 'A senha precisa ter pelo menos 8 caracteres.'],
    ['segredo123', 'segredo321', 'As senhas não conferem.'],
  ])('does not submit with password %s / %s', async (password, confirmPassword, message) => {
    await open();
    fill(password, confirmPassword);
    await submit();
    expect(execute).not.toHaveBeenCalled();
    expect(element.textContent).toContain(message);
  });

  it('accepts the invite and goes to the dashboard', async () => {
    await open();
    execute.mockReturnValue(of({ token: 'jwt', expiresAt: '2099-01-01', role: 'manager' }));
    fill();
    await submit();
    expect(execute).toHaveBeenCalledWith({ token: 'abc123', name: 'Ana', password: 'segredo123' }, 'ana@example.com');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('switches to the invalid notice when the invite expires before the submit', async () => {
    await open();
    execute.mockReturnValue(httpError(404));
    fill();
    await submit();
    expect(element.querySelector('[data-testid="invite-invalid"]')).not.toBeNull();
    expect(element.querySelector('form')).toBeNull();
  });

  it('shows a 409 as a toast with the API message and keeps the form', async () => {
    await open();
    execute.mockReturnValue(httpError(409, 'Limite de usuários do plano Basic atingido.'));
    fill();
    await submit();
    expect(toast.toasts().map((item) => item.message)).toEqual(['Limite de usuários do plano Basic atingido.']);
    expect(element.querySelector('form')).not.toBeNull();
  });
});
