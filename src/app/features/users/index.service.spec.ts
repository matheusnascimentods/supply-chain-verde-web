import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersService } from './index.service';

describe('UsersService', () => {
  let service: UsersService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(UsersService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('should be created', () => expect(service).toBeTruthy());
});
