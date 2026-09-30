import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { DashboardService } from './index.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DashboardService);
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

    service.loadSummary().subscribe((value) => (response = value));
    const request = http.expectOne(`${environment.apiUrl}/dashboard/summary?limit=10`);
    expect(request.request.method).toBe('GET');
    request.flush(result);

    expect(response).toEqual(result);
  });

  it('accepts an empty batch list when the summary contains no recent batches', () => {
    service.loadSummary(5).subscribe((response) => expect(response.recentBatches).toEqual([]));
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
    service.loadSummary().subscribe({
      next: () => expect.fail('invalid response should fail schema validation'),
      error: (error: unknown) => expect(error).toBeTruthy(),
    });
    http.expectOne(`${environment.apiUrl}/dashboard/summary?limit=10`).flush({ activeBatches: -1 });
  });
});
