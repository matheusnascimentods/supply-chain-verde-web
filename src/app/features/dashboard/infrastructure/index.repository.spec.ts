import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { DashboardRepository } from './index.repository';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(DashboardRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and parses the role-independent summary with the requested batch limit', () => {
    const result = {
      activeBatches: 12,
      expiringCertifications: 3,
      suppliers: 8,
      monthlyEmissionKgCo2e: 42.5,
      recentBatches: [
        {
          batchId: 101,
          productName: 'Café orgânico',
          supplierName: 'Fazenda Verde',
          quantity: 500,
          unit: 'KG',
          status: 'TRANSPORT',
        },
      ],
    };
    let response: unknown;

    repository.loadSummary(10).subscribe((value) => (response = value));
    const request = http.expectOne(`${environment.apiUrl}/dashboard/summary?limit=10`);
    expect(request.request.method).toBe('GET');
    request.flush(result);

    expect(response).toEqual(result);
  });

  it('accepts an empty batch list when the summary contains no recent batches', () => {
    repository.loadSummary(5).subscribe((response) => expect(response.recentBatches).toEqual([]));
    const request = http.expectOne(`${environment.apiUrl}/dashboard/summary?limit=5`);
    request.flush({
      activeBatches: 0,
      expiringCertifications: 0,
      suppliers: 0,
      monthlyEmissionKgCo2e: 0,
      recentBatches: [],
    });
  });

  it('rejects an invalid API payload', () => {
    repository.loadSummary(10).subscribe({
      next: () => expect.fail('invalid response should fail schema validation'),
      error: (error: unknown) => expect(error).toBeTruthy(),
    });
    http.expectOne(`${environment.apiUrl}/dashboard/summary?limit=10`).flush({ activeBatches: -1 });
  });

  it('loads the monthly emissions of the range', () => {
    const series = [{ month: '2026-01', co2Kg: 1250.4 }, { month: '2026-02', co2Kg: 0 }];
    repository.loadEmissions({ from: '2026-01', to: '2026-02' }).subscribe((response) => expect(response).toEqual(series));
    http.expectOne(`${environment.apiUrl}/dashboard/emissions?from=2026-01&to=2026-02`).flush(series);
  });

  it('rejects a monthly emission outside the contract', () => {
    let failed = false;
    repository.loadEmissions({ from: '2026-01', to: '2026-01' }).subscribe({ error: () => (failed = true) });
    http.expectOne((req) => req.url.endsWith('/dashboard/emissions')).flush([{ month: '01/2026', co2Kg: 1 }]);
    expect(failed).toBe(true);
  });
});
