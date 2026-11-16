import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CompanyType } from '../../../../../core/auth/session/index.model';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { SendInviteUseCase } from '../../../application/use-cases/send-invite/index.use-case';
import { InviteUserModalComponent } from './index.component';

describe('InviteUserModalComponent', () => {
  let fixture: ComponentFixture<InviteUserModalComponent>;
  let sendInvite: { execute: ReturnType<typeof vi.fn> };
  let toast: { show: ReturnType<typeof vi.fn> };
  let invited: string[];

  function openModal(companyType: CompanyType = 'market'): InviteUserModalComponent {
    invited = [];
    sendInvite = { execute: vi.fn().mockReturnValue(of(undefined)) };
    toast = { show: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: SendInviteUseCase, useValue: sendInvite },
        { provide: ErrorToastService, useValue: toast },
        { provide: SessionService, useValue: { role: () => 'admin', companyType: () => companyType } },
      ],
    });
    fixture = TestBed.createComponent(InviteUserModalComponent);
    fixture.componentInstance.invited.subscribe((email) => invited.push(email));
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const validInvite = { email: 'ana@example.com', role: 'manager' };

  it('asks only for the e-mail and the role', () => {
    openModal();
    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll('input');
    expect(Array.from(inputs).map((input) => input.id)).toEqual(['invite-email']);
    expect((fixture.nativeElement as HTMLElement).querySelector('app-enum-select')).not.toBeNull();
  });

  it('shows the roles with their Portuguese labels', () => {
    openModal();
    const options = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('option')).map((option) => option.textContent?.trim());
    expect(options).toEqual(['Selecione...', 'Administrador', 'Gestor', 'Auditor']);
  });

  it('does not submit an invalid form', () => {
    const modal = openModal();
    modal.submit();
    expect(sendInvite.execute).not.toHaveBeenCalled();
    expect(modal.form.controls.email.touched).toBe(true);
  });

  it('sends the invite and emits the invited e-mail', () => {
    const modal = openModal();
    modal.form.patchValue(validInvite);
    modal.submit();
    expect(sendInvite.execute).toHaveBeenCalledWith(validInvite);
    expect(invited).toEqual(['ana@example.com']);
    expect(modal.saving()).toBe(false);
  });

  it.each([
    ['market', ['admin', 'manager', 'auditor']],
    ['supplier', ['admin', 'supplier']],
  ] as const)('offers the %s company roles', (companyType, roles) => {
    openModal(companyType);
    expect((fixture.componentInstance as unknown as { roles: readonly string[] }).roles).toEqual(roles);
  });

  it.each([
    [409, 'Já existe um convite ativo para este email.'],
    [502, 'Não foi possível enviar o email de convite.'],
  ])('shows a %s as a toast with the API message and keeps the modal open', (status, message) => {
    const modal = openModal();
    sendInvite.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status, error: { message } })));
    modal.form.patchValue(validInvite);
    modal.submit();
    expect(invited).toEqual([]);
    expect(toast.show).toHaveBeenCalledWith(message);
    expect(modal.error()).toBe('');
  });

  it('shows other errors inside the modal', () => {
    const modal = openModal();
    sendInvite.execute.mockReturnValue(throwError(() => new Error('500')));
    modal.form.patchValue(validInvite);
    modal.submit();
    expect(toast.show).not.toHaveBeenCalled();
    expect(modal.error()).toBe('Não foi possível enviar o convite. Confira os dados e tente novamente.');
  });
});
