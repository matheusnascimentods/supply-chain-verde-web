import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ProfileRepository } from './index.repository';

describe('ProfileRepository', () => {
  let repository: ProfileRepository;
  let http: HttpTestingController;
  const apiCompany = {
    companyId: 7,
    name: 'Mercado Bom Preço',
    cnpj: '12345678000190',
    email: 'contato@bompreco.com',
    phone: '11999990000',
    type: 'MARKET',
    address: { addressId: 3, street: 'Praça da Sé', number: '10', neighborhood: 'Sé', complement: null, zipCode: '01001000', city: 'São Paulo', state: 'SP' },
    registeredAt: '2026-11-01',
    maxUsers: 10,
    seatsUsed: 8,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(ProfileRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the patch to PATCH /users/me and parses the user', () => {
    let name = '';
    repository.updateMe({ userName: 'Ana S.' }).subscribe((user) => (name = user.name));
    const request = http.expectOne(`${environment.apiUrl}/users/me`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ userName: 'Ana S.' });
    request.flush({ userId: 4, name: 'Ana S.', email: 'ana@example.com', role: 'ADMIN' });
    expect(name).toBe('Ana S.');
  });

  it('loads the own company', () => {
    let company: unknown;
    repository.getMyCompany().subscribe((value) => (company = value));
    const request = http.expectOne(`${environment.apiUrl}/companies/me`);
    expect(request.request.method).toBe('GET');
    request.flush(apiCompany);
    expect(company).toMatchObject({ companyId: 7, type: 'market', name: 'Mercado Bom Preço' });
  });

  it('accepts a company without email or phone', () => {
    let company: unknown;
    repository.getMyCompany().subscribe((value) => (company = value));
    http.expectOne(`${environment.apiUrl}/companies/me`).flush({ ...apiCompany, email: null, phone: null });
    expect(company).toMatchObject({ email: null, phone: null });
  });

  it('sends the company patch to PATCH /companies/me', () => {
    repository.updateMyCompany({ phone: '1133334444' }).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/companies/me`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ phone: '1133334444' });
    request.flush(apiCompany);
  });
});
