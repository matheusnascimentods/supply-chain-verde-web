import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './index.routes';

@Component({ template: '' })
class TestPageComponent {}

describe('suppliers routes', () => {
  it('redirects the old /suppliers/me to /profile', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'suppliers', children: routes }, { path: 'profile', component: TestPageComponent }])],
    });
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/suppliers/me');

    expect(router.url).toBe('/profile');
  });
});
