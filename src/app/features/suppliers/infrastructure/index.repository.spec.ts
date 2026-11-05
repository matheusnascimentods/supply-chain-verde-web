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
  const ranking = { ...supplier, sustainabilityScore: 87.5, activeCertificationCount: 2, totalCo2Kg: 120.4, reportCount: 3, certifications: [], workedWith: true };

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

  it('sends the recommendation criteria (category and unit) with the ranking query', () => {
    repository.loadRanking({ limit: 20, offset: 0 }, { category: 'AGRICULTURE', unit: 'KG' }).subscribe((page) => {
      expect(page.items[0].co2KgPerUnit).toBe(0.421);
    });
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.get('category')).toBe('AGRICULTURE');
    expect(request.request.params.get('unit')).toBe('KG');
    expect(request.request.params.has('productId')).toBe(false);
    request.flush({ items: [{ ...ranking, co2KgPerUnit: 0.421 }], limit: 20, offset: 0, hasNext: false, totalPages: 1 });
  });

  it('filters the ranking to suppliers the company worked with, and reads the flag', () => {
    repository.loadRanking({ limit: 20, offset: 0, workedWith: true }).subscribe((page) => expect(page.items[0].workedWith).toBe(false));
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.params.get('workedWith')).toBe('true');
    expect(request.request.params.has('withoutUser')).toBe(false);
    request.flush({ items: [{ ...ranking, workedWith: false }], limit: 20, offset: 0, hasNext: false, totalPages: 1 });

    repository.loadRanking({ limit: 20, offset: 0, workedWith: false }).subscribe();
    const unfiltered = http.expectOne((req) => req.url === base);
    expect(unfiltered.request.params.has('workedWith')).toBe(false);
    unfiltered.flush({ items: [], limit: 20, offset: 0, hasNext: false, totalPages: 0 });
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
});
