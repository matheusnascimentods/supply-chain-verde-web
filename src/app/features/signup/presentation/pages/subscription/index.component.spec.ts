import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SubscriptionComponent } from './index.component';

describe('SubscriptionComponent', () => {
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SubscriptionComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SubscriptionComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('shows the single subscription with its active-user ceiling', () => {
    expect(element.querySelector('[data-testid="subscription-card"]')?.textContent).toContain('10 usuários ativos');
  });

  it('links the CTA to the signup without a query param', () => {
    expect(element.querySelector('[data-testid="subscription-cta"]')?.getAttribute('href')).toBe('/cadastro');
  });

  it('links "Entrar" to the login', () => {
    expect(element.querySelector('[data-testid="public-header-login"]')?.getAttribute('href')).toBe('/login');
  });
});
