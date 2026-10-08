import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { ReportsRepository } from './index.repository';

describe('ReportsRepository', () => {
  let repository: ReportsRepository;
  let http: HttpTestingController;
  const report = {
    reportId: 4,
    supplierId: 9,
    supplierCnpj: '12345678000190',
    supplierName: 'Fazenda Verde',
    periodStartAt: '2026-01-01',
    periodEndAt: '2026-01-31',
    totalCo2Kg: 52.3,
    totalBatchCount: 7,
    generatedAt: '2026-02-01T10:00:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(ReportsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the reports of a supplier', () => {
    repository.loadBySupplier(9, { limit: 20, offset: 40 }).subscribe((page) => expect(page).toEqual({ items: [report], totalPages: 3 }));
    const request = http.expectOne((req) => req.url === `${environment.apiUrl}/reports`);
    expect(request.request.params.get('supplierId')).toBe('9');
    expect(request.request.params.get('offset')).toBe('40');
    request.flush({ items: [report], limit: 20, offset: 40, hasNext: false, totalPages: 3 });
  });

  it('generates a report for the period', () => {
    const period = { periodStartAt: '2026-01-01', periodEndAt: '2026-01-31' };
    repository.generate(9, period).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/suppliers/9/reports`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(period);
    request.flush({ reportId: 4, supplierId: 9, ...period, totalCo2Kg: 52.3, trackedProductCount: 2, generatedAt: '2026-02-01T10:00:00' });
  });
});
