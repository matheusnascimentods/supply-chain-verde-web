import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { CurrentUserService } from '../../auth/session/current-user/index.service';
import { SessionService } from '../../auth/session/index.service';
import { TopNavComponent } from './index.component';

@Component({ template: '' })
class TestPageComponent {}

const tokenFor = (companyType: string | null) => `header.${btoa(JSON.stringify({ companyType }))}.signature`;

describe('TopNavComponent', () => {
  let session: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [TopNavComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: TestPageComponent },
          { path: 'batches', component: TestPageComponent },
          { path: 'profile', component: TestPageComponent },
        ]),
        SessionService,
        { provide: CurrentUserService, useValue: { load: () => of({ companyName: 'Mercado Bom Preço' }) } },
      ],
    });
    session = TestBed.inject(SessionService);
    session.setSession(tokenFor('MARKET'), 'admin', 'admin@example.com');
  });

  afterEach(() => sessionStorage.clear());

  const navigationText = (companyType: string | null, role: 'admin' | 'manager' | 'auditor' | 'supplier' | 'platform_admin') => {
    session.setSession(tokenFor(companyType), role, `${role}@example.com`);
    const fixture = TestBed.createComponent(TopNavComponent);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('nav[aria-label="Navegação principal"] a') as NodeListOf<HTMLElement>;
    return [...links].map((link) => link.textContent?.trim()).join(' ');
  };

  it.each([
    ['MARKET', 'admin', 'Dashboard Fornecedores Lotes Usuários Auditoria'],
    ['MARKET', 'manager', 'Dashboard Fornecedores Lotes Usuários'],
    ['MARKET', 'auditor', 'Dashboard Auditoria Fornecedores Lotes Usuários'],
    ['SUPPLIER', 'admin', 'Dashboard Lotes Produtos Usuários Auditoria'],
    ['SUPPLIER', 'supplier', 'Dashboard Lotes Produtos Usuários'],
    [null, 'platform_admin', 'Dashboard Fornecedores Lotes Usuários Auditoria'],
  ] as const)('shows the %s %s menu', (companyType, role, menu) => {
    expect(navigationText(companyType, role)).toBe(menu);
  });

  it('shows only the dashboard when the token has no company', () => {
    expect(navigationText(null, 'admin')).toBe('Dashboard');
  });

  it('shows the company name next to the role, and "Plataforma" for the platform admin', () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.profile-role').textContent).toContain('Administrador · Mercado Bom Preço');

    session.setSession(tokenFor(null), 'platform_admin', 'root@example.com');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.profile-role').textContent).toContain('Admin da plataforma · Plataforma');
  });

  it('marks the active route and closes the mobile menu after navigation', async () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/batches');
    fixture.detectChanges();

    expect(fixture.componentInstance.isLinkActive('/batches')).toBe(true);
    fixture.componentInstance.mobileMenuOpen.set(true);
    await router.navigateByUrl('/dashboard');
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
  });

  it.each(['admin', 'manager', 'auditor', 'supplier'] as const)('shows Meu perfil above Sair for %s', (role) => {
    session.setSession('test-token', role, `${role}@example.com`);
    const fixture = TestBed.createComponent(TopNavComponent);
    fixture.detectChanges();

    const items = [...fixture.nativeElement.querySelectorAll('.profile-dropdown a, .profile-dropdown button')] as HTMLElement[];
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Meu perfil', 'Sair']);
    expect(items[0].getAttribute('href')).toBe('/profile');
  });

  it('keeps Meu perfil out of the supplier navigation bar', () => {
    session.setSession(tokenFor('SUPPLIER'), 'supplier', 'supplier@example.com');
    const fixture = TestBed.createComponent(TopNavComponent);
    fixture.detectChanges();

    const navigation = fixture.nativeElement.querySelector('nav[aria-label="Navegação principal"]');
    expect(navigation.textContent).not.toContain('Meu perfil');
  });

  it('marks no link as active on /profile', async () => {
    session.setSession('test-token', 'supplier', 'supplier@example.com');
    const fixture = TestBed.createComponent(TopNavComponent);
    await TestBed.inject(Router).navigateByUrl('/profile');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-current]')).toBeNull();
  });

  it('delegates sign out to the session service', () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    const logout = vi.spyOn(session, 'logout');
    fixture.componentInstance.logout();
    expect(logout).toHaveBeenCalledOnce();
  });

  it('toggles the mobile navigation state', () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
    fixture.componentInstance.toggleMobileMenu();
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(true);
  });
});
