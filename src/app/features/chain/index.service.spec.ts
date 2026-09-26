import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChainService } from './index.service';

describe('ChainService', () => {
  let service: ChainService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(ChainService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('should be created', () => expect(service).toBeTruthy());
});
