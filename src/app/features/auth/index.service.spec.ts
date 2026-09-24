import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../core/session/index.service';
import { AuthService } from './index.service';
import {
  LoginRequestDTO,
  LoginResponseDTO,
  loginRequestSchema,
  loginResponseSchema,
} from './index.schema';

describe('AuthService', () => {
  let service: AuthService;
  let sessionService: SessionService;
  let httpTestingController: HttpTestingController;
  let router: Router;

  const mockCredentials: LoginRequestDTO = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRawResponse = {
    token: 'jwt-token-12345',
    expiresAt: '2026-09-24T18:00:00',
    role: 'ADMIN',
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        SessionService,
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    sessionService = TestBed.inject(SessionService);
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
    sessionStorage.clear();
  });

  describe('Schemas', () => {
    it('should validate valid login request', () => {
      const valid = { email: 'user@supply.com', password: 'secretpassword' };
      const parsed = loginRequestSchema.parse(valid);
      expect(parsed).toEqual(valid);
    });

    it('should fail login request on invalid email', () => {
      expect(() => loginRequestSchema.parse({ email: 'not-an-email', password: '123' })).toThrow();
    });

    it('should fail login request on empty password', () => {
      expect(() => loginRequestSchema.parse({ email: 'user@supply.com', password: '' })).toThrow();
    });

    it('should validate login response and normalize role to lowercase', () => {
      const parsed = loginResponseSchema.parse({
        token: 'token-abc',
        expiresAt: '2026-09-24T20:00:00Z',
        role: 'MANAGER',
      });

      expect(parsed.role).toBe('manager');
      expect(parsed.token).toBe('token-abc');
      expect(parsed.expiresAt).toBe('2026-09-24T20:00:00Z');
    });

    it('should throw validation error on invalid role or empty token in response', () => {
      expect(() =>
        loginResponseSchema.parse({
          token: '',
          expiresAt: '2026-09-24T20:00:00Z',
          role: 'admin',
        }),
      ).toThrow();

      expect(() =>
        loginResponseSchema.parse({
          token: 'valid-token',
          expiresAt: '2026-09-24T20:00:00Z',
          role: 'unknown_role',
        }),
      ).toThrow();
    });
  });

  describe('login()', () => {
    it('should post to /auth/login, parse response, set session, and return DTO', () => {
      let result: LoginResponseDTO | undefined;

      expect(service.isLoading()).toBe(false);

      service.login(mockCredentials).subscribe((res) => {
        result = res;
      });

      expect(service.isLoading()).toBe(true);

      const req = httpTestingController.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);

      req.flush(mockRawResponse);

      expect(result).toBeDefined();
      expect(result?.token).toBe('jwt-token-12345');
      expect(result?.role).toBe('admin');
      expect(service.isLoading()).toBe(false);

      expect(sessionService.token).toBe('jwt-token-12345');
      expect(sessionService.role()).toBe('admin');
      expect(sessionService.isAuthenticated()).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.role()).toBe('admin');
    });

    it('should handle HTTP error, not set session, and reset isLoading', () => {
      let errorOccurred = false;

      service.login(mockCredentials).subscribe({
        next: () => expect.fail('should not have succeeded'),
        error: () => {
          errorOccurred = true;
        },
      });

      expect(service.isLoading()).toBe(true);

      const req = httpTestingController.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Credenciais inválidas' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorOccurred).toBe(true);
      expect(service.isLoading()).toBe(false);
      expect(sessionService.hasSession()).toBe(false);
      expect(sessionService.isAuthenticated()).toBe(false);
    });

    it('should fail and not set session when API response fails schema validation', () => {
      let errorOccurred = false;

      service.login(mockCredentials).subscribe({
        next: () => expect.fail('should not have succeeded on invalid payload'),
        error: () => {
          errorOccurred = true;
        },
      });

      const req = httpTestingController.expectOne(`${environment.apiUrl}/auth/login`);
      // Malformed response (missing token and invalid role)
      req.flush({ role: 'super-admin' });

      expect(errorOccurred).toBe(true);
      expect(service.isLoading()).toBe(false);
      expect(sessionService.hasSession()).toBe(false);
    });
  });

  describe('logout()', () => {
    it('should clear session and navigate to /login', () => {
      sessionService.setSession('sample-token', 'auditor');
      expect(service.isAuthenticated()).toBe(true);

      const navigateSpy = vi.spyOn(router, 'navigate');

      service.logout();

      expect(sessionService.hasSession()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
