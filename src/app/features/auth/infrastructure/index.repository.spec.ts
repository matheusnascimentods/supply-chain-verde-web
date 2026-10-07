import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { AuthRepository } from './index.repository';
import { LoginResponseDTO, loginResponseSchema } from './index.dto';

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let http: HttpTestingController;
  const credentials = { email: 'test@example.com', password: 'password123' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(AuthRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('loginResponseSchema', () => {
    it('validates the response and normalizes the role to lowercase', () => {
      const parsed = loginResponseSchema.parse({ token: 'token-abc', expiresAt: '2026-09-24T20:00:00Z', role: 'MANAGER' });
      expect(parsed).toEqual({ token: 'token-abc', expiresAt: '2026-09-24T20:00:00Z', role: 'manager' });
    });

    it('rejects an empty token or an unknown role', () => {
      expect(() => loginResponseSchema.parse({ token: '', expiresAt: '2026-09-24T20:00:00Z', role: 'admin' })).toThrow();
      expect(() => loginResponseSchema.parse({ token: 'valid-token', expiresAt: '2026-09-24T20:00:00Z', role: 'unknown_role' })).toThrow();
    });
  });

  it('posts the credentials to /auth/login and returns the parsed response', () => {
    let result: LoginResponseDTO | undefined;
    repository.login(credentials).subscribe((response) => (result = response));

    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    request.flush({ token: 'jwt-token-12345', expiresAt: '2026-09-24T18:00:00', role: 'ADMIN' });

    expect(result).toEqual({ token: 'jwt-token-12345', expiresAt: '2026-09-24T18:00:00', role: 'admin' });
  });

  it('fails when the response does not match the schema', () => {
    let failed = false;
    repository.login(credentials).subscribe({ error: () => (failed = true) });
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ role: 'super-admin' });
    expect(failed).toBe(true);
  });
});
