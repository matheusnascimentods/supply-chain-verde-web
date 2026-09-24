import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './index.component';
import { AuthService } from '../index.service';
import { ErrorToastService } from '../../../shared/components/error-toast/index.service';
import { LoginResponseDTO } from '../index.schema';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let errorToastService: ErrorToastService;
  let router: Router;

  const mockLoginSuccess: LoginResponseDTO = {
    token: 'jwt-auth-token',
    expiresAt: '2026-09-24T20:00:00Z',
    role: 'manager',
  };

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            login: vi.fn(),
            isLoading: vi.fn().mockReturnValue(false),
          },
        },
        ErrorToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    errorToastService = TestBed.inject(ErrorToastService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form and invalid status', () => {
    expect(component.loginForm.value).toEqual({ email: '', password: '' });
    expect(component.loginForm.valid).toBe(false);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it('should mark fields as touched and display error messages when submitted empty', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(component.loginForm.touched).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();

    const emailError = fixture.nativeElement.querySelector('[data-testid="email-error"]');
    const passwordError = fixture.nativeElement.querySelector('[data-testid="password-error"]');

    expect(emailError).toBeTruthy();
    expect(emailError.textContent).toContain('O e-mail é obrigatório');
    expect(passwordError).toBeTruthy();
    expect(passwordError.textContent).toContain('A senha é obrigatória');
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.controls.email;
    emailControl.setValue('invalid-email-format');
    emailControl.markAsTouched();
    fixture.detectChanges();

    expect(emailControl.valid).toBe(false);
    expect(emailControl.hasError('email')).toBe(true);

    const emailError = fixture.nativeElement.querySelector('[data-testid="email-error"]');
    expect(emailError.textContent).toContain('formato válido');
  });

  it('should submit valid credentials, navigate to /dashboard on success', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.mocked(authService.login).mockReturnValue(of(mockLoginSuccess));

    component.loginForm.setValue({
      email: 'manager@supply.com',
      password: 'password123',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'manager@supply.com',
      password: 'password123',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it('should display generic error message and toast when authentication fails', () => {
    const toastSpy = vi.spyOn(errorToastService, 'show');
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.mocked(authService.login).mockReturnValue(throwError(() => new Error('401 Unauthorized')));

    component.loginForm.setValue({
      email: 'user@supply.com',
      password: 'wrongpassword',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@supply.com',
      password: 'wrongpassword',
    });
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);

    // Generic error message for security (does not disclose if email or password was wrong)
    const expectedError =
      'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    expect(component.errorMessage()).toBe(expectedError);

    const errorAlert = fixture.nativeElement.querySelector('[data-testid="error-alert"]');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.textContent).toContain(expectedError);

    expect(toastSpy).toHaveBeenCalledWith(expectedError);
  });

  it('should toggle password visibility between text and password', () => {
    const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="password-input"]',
    );
    const toggleButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="toggle-password-visibility"]',
    );

    expect(passwordInput.type).toBe('password');
    expect(component.showPassword()).toBe(false);

    toggleButton.click();
    fixture.detectChanges();

    expect(component.showPassword()).toBe(true);
    expect(passwordInput.type).toBe('text');

    toggleButton.click();
    fixture.detectChanges();

    expect(component.showPassword()).toBe(false);
    expect(passwordInput.type).toBe('password');
  });

  it('should have proper accessibility attributes on inputs', () => {
    const emailInput = fixture.nativeElement.querySelector('#email');
    const passwordInput = fixture.nativeElement.querySelector('#password');
    const emailLabel = fixture.nativeElement.querySelector('label[for="email"]');
    const passwordLabel = fixture.nativeElement.querySelector('label[for="password"]');

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(emailLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();

    component.loginForm.controls.email.markAsTouched();
    fixture.detectChanges();

    expect(emailInput.getAttribute('aria-invalid')).toBe('true');
    expect(emailInput.getAttribute('aria-describedby')).toBe('email-error');
  });
});
