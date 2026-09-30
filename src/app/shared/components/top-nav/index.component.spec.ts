import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../features/auth/index.service';
import { SessionService } from '../../../core/session/index.service';
import { TopNavComponent } from './index.component';

@Component({ template: '' })
class TestPageComponent {}

describe('TopNavComponent', () => {
  let auth: { logout: ReturnType<typeof vi.fn> };
  let session: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    auth = { logout: vi.fn() };
    TestBed.configureTestingModule({
      imports: [TopNavComponent],
      providers: [
        provideRouter([
          { path: 'dashboard', component: TestPageComponent },
          { path: 'products', component: TestPageComponent },
          { path: 'suppliers/me', component: TestPageComponent },
        ]),
        SessionService,
        { provide: AuthService, useValue: auth },
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
    expect(navigation.textContent).not.toContain('Usuários');
  });

  it('marks the active route and closes the mobile menu after navigation', async () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/products');
    fixture.detectChanges();

    expect(fixture.componentInstance.isLinkActive('/products')).toBe(true);
    fixture.componentInstance.mobileMenuOpen.set(true);
    await router.navigateByUrl('/dashboard');
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
  });

  it('provides the supplier profile link only when that route is available', () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Meu perfil');

    session.setSession('test-token', 'supplier', 'supplier@example.com');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Meu perfil');
    expect(fixture.nativeElement.textContent).toContain('supplier@example.com');
  });

  it('delegates sign out to the authentication service', () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    fixture.componentInstance.logout();
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('toggles the mobile navigation state', () => {
    const fixture = TestBed.createComponent(TopNavComponent);
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
    fixture.componentInstance.toggleMobileMenu();
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(true);
  });
});
