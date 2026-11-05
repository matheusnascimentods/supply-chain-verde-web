import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CompanySignup } from '../domain/index.model';
import { SignupRepository } from './index.repository';

describe('SignupRepository', () => {
  let repository: SignupRepository;
  let http: HttpTestingController;
  const plans = [
    { code: 'BASIC', name: 'Basic', maxUsers: 3 },
    { code: 'PRO', name: 'Pro', maxUsers: 10 },
    { code: 'PRO_MAX', name: 'Pro Max', maxUsers: 15 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(SignupRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets and parses the plans', () => {
    let result: unknown;
    repository.listPlans().subscribe((value) => (result = value));
    const request = http.expectOne(`${environment.apiUrl}/plans`);
    expect(request.request.method).toBe('GET');
    request.flush(plans);
    expect(result).toEqual(plans);
  });

  it('posts the company signup and parses the login-like response', () => {
    const signup = { planCode: 'PRO', type: 'MARKET' } as CompanySignup;
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
    repository.listPlans().subscribe({ error: () => (failed = true) });
    http.expectOne(`${environment.apiUrl}/plans`).flush([{ code: 'PRO', name: 'Pro', maxUsers: '10' }]);
    expect(failed).toBe(true);
  });
});
