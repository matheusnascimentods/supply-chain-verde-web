import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { UsersRepository } from './index.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/users`;
  const apiUser = { userId: 7, name: 'Ana', email: 'ana@example.com', role: 'MANAGER' };

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

  it('creates a user sending the role in uppercase', () => {
    repository.create({ name: 'Ana', email: 'ana@example.com', password: 'secret', role: 'manager' }).subscribe((user) => {
      expect(user.role).toBe('manager');
    });
    const request = http.expectOne(base);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Ana', email: 'ana@example.com', password: 'secret', role: 'MANAGER' });
    request.flush(apiUser);
  });

  it('updates the role of a user', () => {
    repository.updateRole(7, 'auditor').subscribe();
    const request = http.expectOne(`${base}/7/role`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role: 'AUDITOR' });
    request.flush({ ...apiUser, role: 'AUDITOR' });
  });
});
