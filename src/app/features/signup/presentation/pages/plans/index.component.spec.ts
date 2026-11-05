import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SignupRepository } from '../../../infrastructure/index.repository';
import { PlansComponent } from './index.component';

describe('PlansComponent', () => {
  const plans = [
    { code: 'BASIC', name: 'Basic', maxUsers: 3 },
    { code: 'PRO', name: 'Pro', maxUsers: 10 },
    { code: 'PRO_MAX', name: 'Pro Max', maxUsers: 15 },
  ];

  function render(listPlans: () => unknown): HTMLElement {
    TestBed.configureTestingModule({
      imports: [PlansComponent],
      providers: [provideRouter([]), { provide: SignupRepository, useValue: { listPlans } }],
    });
    const fixture = TestBed.createComponent(PlansComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders the three plans from the API with their account limit', () => {
    const cards = render(() => of(plans)).querySelectorAll('[data-testid="plan-card"]');
    expect(cards.length).toBe(3);
    expect(cards[1].textContent).toContain('Pro');
    expect(cards[1].textContent).toContain('10');
  });

  it('links "Escolher" to the signup with the plan code', () => {
    const cards = render(() => of(plans)).querySelectorAll('[data-testid="plan-card"]');
    expect(cards[1].querySelector('a')?.getAttribute('href')).toBe('/cadastro?plano=PRO');
  });

  it('links "Entrar" to the login', () => {
    const login = render(() => of(plans)).querySelector('[data-testid="public-header-login"]');
    expect(login?.getAttribute('href')).toBe('/login');
  });

  it('shows an error when the plans fail to load', () => {
    expect(render(() => throwError(() => new Error('x'))).querySelector('[role="alert"]')).not.toBeNull();
  });
});
