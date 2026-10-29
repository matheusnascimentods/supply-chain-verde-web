import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ProfileRepository } from './index.repository';

describe('ProfileRepository', () => {
  it('sends the patch to PATCH /users/me and parses the user', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    let name = '';

    TestBed.inject(ProfileRepository).updateMe({ userName: 'Ana S.' }).subscribe((user) => (name = user.name));
    const request = http.expectOne(`${environment.apiUrl}/users/me`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ userName: 'Ana S.' });
    request.flush({ userId: 4, name: 'Ana S.', email: 'ana@example.com', role: 'ADMIN' });

    expect(name).toBe('Ana S.');
    http.verify();
  });
});
