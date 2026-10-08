import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { ProductsRepository } from './index.repository';

describe('ProductsRepository', () => {
  let repository: ProductsRepository;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/products`;
  const product = (productId: number) => ({ productId, name: `Produto ${productId}`, description: null, category: 'AGRICULTURE', unit: 'KG' });
  const page = (items: unknown[], totalPages: number, offset = 0) => ({ items, limit: 100, offset, hasNext: false, totalPages });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(ProductsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches products with pagination', () => {
    repository.load({ limit: 20, offset: 20, search: ' café ' }).subscribe((result) => expect(result.totalPages).toBe(2));
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.get('search')).toBe('café');
    expect(request.request.params.get('offset')).toBe('20');
    request.flush({ ...page([product(1)], 2, 20), limit: 20 });
  });

  it('loads every page of the catalog', () => {
    let all: unknown[] = [];
    repository.loadAll().subscribe((products) => (all = products));
    http.expectOne((req) => req.url === base && req.params.get('offset') === '0').flush(page([product(1)], 2));
    http.expectOne((req) => req.url === base && req.params.get('offset') === '100').flush(page([product(2)], 2, 100));
    expect(all).toEqual([product(1), product(2)]);
  });

  it('creates a product', () => {
    const newProduct = { name: 'Café', description: '', category: 'AGRICULTURE' as const, unit: 'KG' as const };
    repository.create(newProduct).subscribe();
    const request = http.expectOne(base);
    expect(request.request.body).toEqual(newProduct);
    request.flush(product(11));
  });
});
