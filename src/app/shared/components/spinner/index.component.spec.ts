import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { SpinnerComponent } from './index.component';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;
  let component: SpinnerComponent;
  let componentRef: ComponentRef<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default size md and default ariaLabel', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('[data-testid="spinner-svg"]');
    const srOnly = compiled.querySelector('.sr-only');

    expect(svg?.getAttribute('class')).toContain('h-8 w-8');
    expect(srOnly?.textContent?.trim()).toBe('Carregando...');
  });

  it('should render custom size sm and lg correctly', () => {
    componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('[data-testid="spinner-svg"]');
    expect(svg?.getAttribute('class')).toContain('h-4 w-4');

    componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(svg?.getAttribute('class')).toContain('h-12 w-12');
  });

  it('should render message when provided', () => {
    componentRef.setInput('message', 'Carregando dados da cadeia...');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const messageEl = compiled.querySelector('[data-testid="spinner-message"]');
    expect(messageEl?.textContent?.trim()).toBe('Carregando dados da cadeia...');
  });

  it('should not render message paragraph when message is empty', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const messageEl = compiled.querySelector('[data-testid="spinner-message"]');
    expect(messageEl).toBeNull();
  });

  it('should apply fullScreen styles when fullScreen is true', () => {
    componentRef.setInput('fullScreen', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('[data-testid="spinner-container"]');
    expect(container?.classList.contains('fixed')).toBe(true);
    expect(container?.classList.contains('inset-0')).toBe(true);
  });

  it('should satisfy accessibility requirements (role="status" and aria-live="polite")', () => {
    componentRef.setInput('ariaLabel', 'Aguarde um momento');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('[role="status"]');
    const srOnly = compiled.querySelector('.sr-only');

    expect(container).toBeTruthy();
    expect(container?.getAttribute('aria-live')).toBe('polite');
    expect(srOnly?.textContent?.trim()).toBe('Aguarde um momento');
  });
});
