import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CurrentUserService } from '../../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../../core/auth/session/index.service';
import type { UserRole } from '../../../../../core/auth/session/index.model';
import { ProfileRepository } from '../../../infrastructure/index.repository';
import { ProfileComponent } from './index.component';

@Component({ template: '' })
class DashboardPage {}

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let repository: Record<'updateMe' | 'getMyCompany' | 'updateMyCompany' | 'countCompanyUsers', ReturnType<typeof vi.fn>>;
  const company = {
    companyId: 9,
    name: 'Fazenda Verde',
    cnpj: '12345678000190',
    email: 'contato@fazenda.com',
    phone: '1633332023',
    type: 'supplier',
    address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: null, zipCode: '01000000', city: 'São Paulo', state: 'SP' },
    plan: { code: 'BASIC', name: 'Basic', maxUsers: 3 },
  };

  function create(role: UserRole, overrides: Partial<typeof repository> = {}): ProfileComponent {
    repository = {
      updateMe: vi.fn().mockReturnValue(of({})),
      getMyCompany: vi.fn().mockReturnValue(of(company)),
      updateMyCompany: vi.fn().mockReturnValue(of(company)),
      countCompanyUsers: vi.fn().mockReturnValue(of(2)),
      ...overrides,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'dashboard', component: DashboardPage }]),
        { provide: SessionService, useValue: { role: () => role } },
        { provide: CurrentUserService, useValue: { load: () => of({ userId: 4, name: 'Ana', email: 'ana@fazenda.com', role }) } },
        { provide: ProfileRepository, useValue: repository },
      ],
    });
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const headings = () => [...fixture.nativeElement.querySelectorAll('h2')].map((h: HTMLElement) => h.textContent?.trim());

  it('loads the own company for the admin, formatted and with CNPJ and email read-only', () => {
    const component = create('admin');
    expect(headings()).toEqual(['Dados da empresa', 'Endereço', 'Plano', 'Meu acesso']);
    expect(component.form.controls.cnpj.disabled).toBe(true);
    expect(component.form.controls.cnpj.value).toBe('12.345.678/0001-90');
    expect(component.form.controls.phone.value).toBe('(16) 3333-2023');
    expect(component.form.controls.zipCode.value).toBe('01000-000');
    expect(component.form.controls.email.value).toBe('contato@fazenda.com');
    expect(component.account.controls.email.disabled).toBe(true);
  });

  it('shows the active plan and the account usage, read-only', () => {
    create('admin');
    const plan: HTMLElement = fixture.nativeElement.querySelector('[data-testid="company-plan"]');
    expect(plan.textContent).toContain('Basic');
    expect(plan.textContent).toContain('2 de 3 contas');
    expect(plan.querySelector('input')).toBeNull();
  });

  it('sends Voltar and Cancelar to the dashboard', () => {
    create('admin');
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.supplier-form-back')?.getAttribute('href')).toBe('/dashboard');
    expect(element.querySelector('.supplier-form-cancel')?.getAttribute('href')).toBe('/dashboard');
  });

  it('saves the company and the access separately, each with only what changed, then goes to the dashboard', async () => {
    const component = create('admin');
    component.form.patchValue({ phone: '(16) 3333-4444' });
    component.account.patchValue({ userName: 'Ana S.' });
    component.submit();
    await fixture.whenStable();
    expect(repository.updateMyCompany).toHaveBeenCalledWith({ phone: '1633334444' });
    expect(repository.updateMe).toHaveBeenCalledWith({ userName: 'Ana S.' });
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('does not call the company API when only the access changed', () => {
    const component = create('admin');
    component.account.patchValue({ currentPassword: 'atual', newPassword: 'nova', confirmPassword: 'nova' });
    component.submit();
    expect(repository.updateMyCompany).not.toHaveBeenCalled();
    expect(repository.updateMe).toHaveBeenCalledWith({ currentPassword: 'atual', newPassword: 'nova' });
  });

  it('blocks saving while the password confirmation does not match', () => {
    const component = create('admin');
    component.account.patchValue({ currentPassword: 'atual', newPassword: 'nova', confirmPassword: 'outra' });
    component.submit();
    expect(repository.updateMe).not.toHaveBeenCalled();
  });

  it('shows the API message when saving is refused', () => {
    const component = create('admin');
    repository.updateMe.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Senha atual incorreta.' } })));
    component.account.patchValue({ currentPassword: 'errada', newPassword: 'nova', confirmPassword: 'nova' });
    component.submit();
    expect(component.error()).toBe('Senha atual incorreta.');
    expect(component.saving()).toBe(false);
  });

  it('shows an error when the company cannot be loaded', () => {
    const component = create('admin', { getMyCompany: vi.fn().mockReturnValue(throwError(() => new Error('500'))) });
    expect(component.error()).toBe('Não foi possível carregar o seu perfil.');
    component.submit();
    expect(repository.updateMyCompany).not.toHaveBeenCalled();
  });

  it.each(['manager', 'auditor', 'supplier', 'platform_admin'] as const)('shows only Meu acesso to the %s', (role) => {
    const component = create(role);
    expect(headings()).toEqual(['Meu acesso']);
    expect(repository.getMyCompany).not.toHaveBeenCalled();
    expect(repository.countCompanyUsers).not.toHaveBeenCalled();
    expect(component.account.getRawValue()).toMatchObject({ userName: 'Ana', email: 'ana@fazenda.com' });
  });

  it('does not call the API when nothing changed', () => {
    const component = create('manager');
    component.submit();
    expect(repository.updateMe).not.toHaveBeenCalled();
    expect(repository.updateMyCompany).not.toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });
});
