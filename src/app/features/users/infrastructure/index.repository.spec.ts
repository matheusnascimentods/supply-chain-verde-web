import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { UsersRepository } from './index.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/users`;
  const apiUser = { userId: 7, name: 'Ana', email: 'ana@example.com', role: 'MANAGER', active: true };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(UsersRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a page sending limit, offset and the trimmed e-mail filter', () => {
    repository.load({ limit: 20, offset: 40, email: '  ana@ ' }).subscribe((page) => {
      expect(page).toEqual({ items: [{ ...apiUser, role: 'manager' }], totalPages: 3 });
    });
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('offset')).toBe('40');
    expect(request.request.params.get('email')).toBe('ana@');
    request.flush({ items: [apiUser], limit: 20, offset: 40, hasNext: false, totalPages: 3 });
  });

  it('omits the e-mail filter when it is blank', () => {
    repository.load({ limit: 20, offset: 0, email: '   ' }).subscribe();
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.has('email')).toBe(false);
    request.flush({ items: [], limit: 20, offset: 0, hasNext: false, totalPages: 0 });
  });

  it('fails when the response is not the paginated envelope', () => {
    let failed = false;
    repository.load({ limit: 20, offset: 0 }).subscribe({ error: () => (failed = true) });
    http.expectOne((req) => req.url === base).flush([]);
    expect(failed).toBe(true);
  });

  it('sends an invite with the role in uppercase', () => {
    let done = false;
    repository.invite({ email: 'ana@example.com', role: 'manager' }).subscribe(() => (done = true));
    const request = http.expectOne(`${environment.apiUrl}/invites`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com', role: 'MANAGER' });
    request.flush(null, { status: 201, statusText: 'Created' });
    expect(done).toBe(true);
  });

  it('updates the role of a user', () => {
    repository.updateRole(7, 'auditor').subscribe();
    const request = http.expectOne(`${base}/7/role`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role: 'AUDITOR' });
    request.flush({ ...apiUser, role: 'AUDITOR' });
  });

  it('repeats the role filter and sends the status filter', () => {
    repository.load({ limit: 20, offset: 0, roles: ['manager', 'auditor'], active: false }).subscribe();
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.getAll('role')).toEqual(['MANAGER', 'AUDITOR']);
    expect(request.request.params.get('active')).toBe('false');
    request.flush({ items: [], limit: 20, offset: 0, hasNext: false, totalPages: 0 });
  });

  it('omits the role and status filters when they are empty', () => {
    repository.load({ limit: 20, offset: 0, roles: [], active: null }).subscribe();
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.has('role')).toBe(false);
    expect(request.request.params.has('active')).toBe(false);
    request.flush({ items: [], limit: 20, offset: 0, hasNext: false, totalPages: 0 });
  });

  it('sends the new status of a user', () => {
    let user: unknown;
    repository.updateStatus(7, false).subscribe((value) => (user = value));
    const request = http.expectOne(`${base}/7/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ active: false });
    request.flush({ ...apiUser, active: false });
    expect(user).toMatchObject({ userId: 7, active: false });
  });

  it('reads the seats from GET /companies/me', () => {
    let seats: unknown;
    repository.seats().subscribe((value) => (seats = value));
    const request = http.expectOne(`${environment.apiUrl}/companies/me`);
    expect(request.request.method).toBe('GET');
    request.flush({ companyId: 7, name: 'Mercado Bom Preço', maxUsers: 10, seatsUsed: 8 });
    expect(seats).toEqual({ used: 8, max: 10 });
  });
});
