import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { InvitesRepository } from './index.repository';

describe('InvitesRepository', () => {
  let repository: InvitesRepository;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/invites`;
  const apiInvite = { email: 'ana@example.com', role: 'MANAGER', companyName: 'Mercado Bom Preço', expiresAt: '2026-11-17T12:00:00Z' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(InvitesRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('finds the invite by token, with the role in lower case', () => {
    let result: unknown;
    repository.find('abc 123').subscribe((value) => (result = value));
    const request = http.expectOne(`${base}/abc%20123`);
    expect(request.request.method).toBe('GET');
    request.flush(apiInvite);
    expect(result).toEqual({ ...apiInvite, role: 'manager' });
  });

  it('fails when the invite payload is invalid', () => {
    let failed = false;
    repository.find('abc').subscribe({ error: () => (failed = true) });
    http.expectOne(`${base}/abc`).flush({ ...apiInvite, role: 'CEO' });
    expect(failed).toBe(true);
  });

  it('accepts the invite sending the token in the body and parses the login-like response', () => {
    const acceptance = { token: 'abc', name: 'Ana', password: 'segredo123' };
    let result: unknown;
    repository.accept(acceptance).subscribe((value) => (result = value));
    const request = http.expectOne(`${base}/accept`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(acceptance);
    request.flush({ token: 'jwt', expiresAt: '2099-01-01', role: 'MANAGER', companyId: 7, companyType: 'MARKET' });
    expect(result).toEqual({ token: 'jwt', expiresAt: '2099-01-01', role: 'manager' });
  });
});
