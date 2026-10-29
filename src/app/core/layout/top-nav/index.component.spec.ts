import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SessionService } from '../../auth/session/index.service';
import { TopNavComponent } from './index.component';

@Component({ template: '' })
class TestPageComponent {}

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
      ],
    });
    session = TestBed.inject(SessionService);
    session.setSession('test-token', 'admin', 'admin@example.com');
  });

  afterEach(() => sessionStorage.clear());

  it('shows only navigation links available to the current role', () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    fixture.detectChanges();

    const navigation = fixture.nativeElement.querySelector('nav[aria-label="Navegação principal"]');
    expect(navigation.textContent).toContain('Usuários');
    expect(navigation.textContent).toContain('Auditoria');
    expect(navigation.textContent).not.toContain('Notificações');

    session.setSession('test-token', 'manager', 'manager@example.com');
    fixture.detectChanges();
    expect(navigation.textContent).toContain('Usuários');
    expect(navigation.textContent).not.toContain('Auditoria');

    session.setSession('test-token', 'auditor', 'auditor@example.com');
    fixture.detectChanges();
    expect(navigation.textContent).not.toContain('Usuários');
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
    session.setSession('test-token', 'supplier', 'supplier@example.com');
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
