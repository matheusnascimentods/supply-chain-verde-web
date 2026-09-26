import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductsService } from './index.service';

describe('ProductsService', () => {
  let service: ProductsService; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(ProductsService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('should be created', () => expect(service).toBeTruthy());
});
