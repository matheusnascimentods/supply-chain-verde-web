import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { CurrentUserService } from './index.service';

describe('CurrentUserService', () => {
  let service: CurrentUserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CurrentUserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the authenticated user from /users/me with a lowercased role', () => {
    service.load().subscribe((user) => {
      expect(user).toMatchObject({ userId: 4, name: 'Maria Gabriela Brito', email: 'maria@example.com', role: 'manager' });
    });
    const request = http.expectOne(`${environment.apiUrl}/users/me`);
    expect(request.request.method).toBe('GET');
    request.flush({ userId: 4, name: 'Maria Gabriela Brito', email: 'maria@example.com', role: 'MANAGER' });
  });

  it('fails when the API returns an unknown role', () => {
    let error: unknown;
    service.load().subscribe({ error: (err) => (error = err) });
    http.expectOne(`${environment.apiUrl}/users/me`).flush({ userId: 4, name: 'X', email: 'x@example.com', role: 'GUEST' });
    expect(error).toBeTruthy();
  });
});
