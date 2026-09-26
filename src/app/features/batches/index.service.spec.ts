import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BatchesService } from './index.service';

describe('BatchesService', () => {
  let service: BatchesService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(BatchesService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('should be created', () => expect(service).toBeTruthy());
});
