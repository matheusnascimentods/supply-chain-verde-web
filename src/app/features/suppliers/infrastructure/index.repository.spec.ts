import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { SuppliersRepository } from './index.repository';

describe('SuppliersRepository', () => {
  let repository: SuppliersRepository;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/suppliers`;
  const supplier = { supplierId: 9, name: 'Fazenda Verde', cnpj: '12345678000190', address: null, phone: '11999999999', registeredAt: '2026-01-10' };
  const ranking = { ...supplier, sustainabilityScore: 87.5, activeCertificationCount: 2, totalCo2Kg: 120.4, reportCount: 3, certifications: [] };
  const newSupplier = {
    name: 'Fazenda Verde',
    cnpj: '12345678000190',
    phone: '11999999999',
    address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000-000', city: 'São Paulo', state: 'SP' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(SuppliersRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the ranking page with search and pagination', () => {
    repository.loadRanking({ limit: 20, offset: 20, search: ' verde ' }).subscribe((page) => {
      expect(page).toEqual({ items: [ranking], totalPages: 2 });
    });
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.get('ranked')).toBe('true');
    expect(request.request.params.get('offset')).toBe('20');
    expect(request.request.params.get('search')).toBe('verde');
    request.flush({ items: [ranking], limit: 20, offset: 20, hasNext: false, totalPages: 2 });
  });

  it('sends the recommendation criteria with the ranking query', () => {
    repository.loadRanking({ limit: 20, offset: 0 }, { productId: 12 }).subscribe((page) => {
      expect(page.items[0].co2KgPerUnit).toBe(0.421);
    });
    const byProduct = http.expectOne((req) => req.url === base);
    expect(byProduct.request.params.get('productId')).toBe('12');
    expect(byProduct.request.params.has('category')).toBe(false);
    byProduct.flush({ items: [{ ...ranking, co2KgPerUnit: 0.421 }], limit: 20, offset: 0, hasNext: false, totalPages: 1 });

    repository.loadRanking({ limit: 20, offset: 0 }, { category: 'AGRICULTURE', unit: 'KG' }).subscribe();
    const byCategory = http.expectOne((req) => req.url === base);
    expect(byCategory.request.params.get('category')).toBe('AGRICULTURE');
    expect(byCategory.request.params.get('unit')).toBe('KG');
    expect(byCategory.request.params.has('productId')).toBe(false);
    byCategory.flush({ items: [{ ...ranking, co2KgPerUnit: null }], limit: 20, offset: 0, hasNext: false, totalPages: 1 });
  });

  it('rejects a ranking item outside the contract', () => {
    let failed = false;
    repository.loadRanking({ limit: 20, offset: 0 }).subscribe({ error: () => (failed = true) });
    const { activeCertificationCount: _, ...withoutCount } = ranking;
    http.expectOne((req) => req.url === base).flush({ items: [{ ...withoutCount, activeCertifications: 2 }], limit: 20, offset: 0, hasNext: false, totalPages: 1 });
    expect(failed).toBe(true);
  });

  it('gets a supplier by id', () => {
    repository.get(9).subscribe((result) => expect(result).toEqual(supplier));
    const request = http.expectOne((req) => req.url === base && req.params.get('supplierId') === '9');
    request.flush(supplier);
  });

  it('loads every supplier', () => {
    repository.load().subscribe((result) => expect(result).toEqual([supplier]));
    http.expectOne(base).flush([ranking]);
  });

  it('creates and updates suppliers', () => {
    repository.create(newSupplier).subscribe();
    const create = http.expectOne(base);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(newSupplier);
    create.flush(supplier);

    repository.update(9, newSupplier).subscribe();
    const update = http.expectOne(`${base}/9`);
    expect(update.request.method).toBe('PUT');
    update.flush(supplier);
  });
});
