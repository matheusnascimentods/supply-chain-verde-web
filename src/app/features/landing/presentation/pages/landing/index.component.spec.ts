import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './index.component';

describe('LandingComponent', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('renders the title as the page heading', () => {
    expect(element.querySelector('h1')?.textContent).toContain('O futuro da cadeia de suprimentos é verde');
  });

  it('links the CTA to /login', () => {
    const cta = element.querySelector('[data-testid="landing-cta"]');
    expect(cta?.getAttribute('href')).toBe('/login');
    expect(cta?.textContent).toContain('Entrar');
  });

  it('hides the decorative word from assistive technology', () => {
    const word = [...element.querySelectorAll('span')].find((span) => span.textContent?.trim() === 'VERDE');
    expect(word?.getAttribute('aria-hidden')).toBe('true');
  });
});
