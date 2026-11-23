import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CompanySignup } from '../domain/index.model';
import { SignupRepository } from './index.repository';

describe('SignupRepository', () => {
  let repository: SignupRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(SignupRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the company signup and parses the login-like response', () => {
    const signup = { type: 'MARKET' } as CompanySignup;
    let result: unknown;
    repository.register(signup).subscribe((value) => (result = value));
    const request = http.expectOne(`${environment.apiUrl}/companies`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(signup);
    request.flush({ token: 'jwt', expiresAt: '2099-01-01', role: 'ADMIN', supplierId: null, companyId: 7, companyType: 'MARKET' });
    expect(result).toEqual({ token: 'jwt', expiresAt: '2099-01-01', role: 'admin' });
  });

  it('fails when the API returns an invalid payload', () => {
    let failed = false;
    repository.register({ type: 'MARKET' } as CompanySignup).subscribe({ error: () => (failed = true) });
    http.expectOne(`${environment.apiUrl}/companies`).flush({ token: 42 });
    expect(failed).toBe(true);
  });
});
