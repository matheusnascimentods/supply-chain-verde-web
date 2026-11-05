import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CompanyType } from '../../../../../core/auth/session/index.model';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/index.use-case';
import { CreateUserModalComponent } from './index.component';

describe('CreateUserModalComponent', () => {
  let fixture: ComponentFixture<CreateUserModalComponent>;
  let createUser: { execute: ReturnType<typeof vi.fn> };
  let toast: { show: ReturnType<typeof vi.fn> };
  let created: number;

  function createModal(companyType: CompanyType = 'market'): CreateUserModalComponent {
    created = 0;
    createUser = { execute: vi.fn().mockReturnValue(of({})) };
    toast = { show: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: CreateUserUseCase, useValue: createUser },
        { provide: ErrorToastService, useValue: toast },
        { provide: SessionService, useValue: { role: () => 'admin', companyType: () => companyType } },
      ],
    });
    fixture = TestBed.createComponent(CreateUserModalComponent);
    fixture.componentInstance.created.subscribe(() => created++);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const validUser = { name: 'Ana', email: 'ana@example.com', password: 'secret', role: 'manager' };

  it('does not submit an invalid form', () => {
    const modal = createModal();
    modal.submit();
    expect(createUser.execute).not.toHaveBeenCalled();
    expect(modal.form.controls.name.touched).toBe(true);
  });

  it('creates the user and notifies the page', () => {
    const modal = createModal();
    modal.form.patchValue(validUser);
    modal.submit();
    expect(createUser.execute).toHaveBeenCalledWith(validUser);
    expect(created).toBe(1);
    expect(modal.saving()).toBe(false);
  });

  it('has no supplier selector', () => {
    createModal('supplier');
    expect((fixture.nativeElement as HTMLElement).querySelector('fieldset')).toBeNull();
  });

  it.each([
    ['market', ['admin', 'manager', 'auditor']],
    ['supplier', ['admin', 'supplier']],
  ] as const)('offers the %s company roles', (companyType, roles) => {
    createModal(companyType);
    expect((fixture.componentInstance as unknown as { roles: readonly string[] }).roles).toEqual(roles);
  });

  it('shows a 409 (plan limit) as a toast with the API message and keeps the modal open', () => {
    const modal = createModal();
    createUser.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Limite de usuários do plano Basic atingido.' } })),
    );
    modal.form.patchValue(validUser);
    modal.submit();
    expect(created).toBe(0);
    expect(toast.show).toHaveBeenCalledWith('Limite de usuários do plano Basic atingido.');
    expect(modal.error()).toBe('');
  });

  it('shows other errors inside the modal', () => {
    const modal = createModal();
    createUser.execute.mockReturnValue(throwError(() => new Error('500')));
    modal.form.patchValue(validUser);
    modal.submit();
    expect(toast.show).not.toHaveBeenCalled();
    expect(modal.error()).toBe('Não foi possível salvar. Confira os dados e tente novamente.');
  });
});
