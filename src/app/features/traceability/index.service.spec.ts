import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { TraceabilityService } from './index.service';
import { batchTraceabilityResponseSchema, carbonFootprintResponseSchema } from './index.schema';

describe('TraceabilityService', () => {
  let service: TraceabilityService;
  let http: HttpTestingController;
  const traceability = {
    batchId: 42, productName: 'Café orgânico', supplierName: 'Fazenda Verde', quantity: 100,
    producedAt: '2026-01-12', stages: [], totalCo2Kg: 8.5,
  };
  const footprint = { batchId: 42, totalCo2Kg: 8.5, emissionsByStage: [] };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), TraceabilityService] });
    service = TestBed.inject(TraceabilityService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('validates traceability DTOs against the backend contract', () => {
    expect(batchTraceabilityResponseSchema.parse(traceability)).toEqual(traceability);
    expect(() => batchTraceabilityResponseSchema.parse({ ...traceability, batchId: '42' })).toThrow();
  });

  it('validates carbon footprint DTOs', () => {
    expect(carbonFootprintResponseSchema.parse(footprint)).toEqual(footprint);
    expect(() => carbonFootprintResponseSchema.parse({ batchId: 42 })).toThrow();
  });

  it('gets and parses batch traceability', () => {
    let result: unknown;
    service.getTraceability(42).subscribe((value) => (result = value));
    const request = http.expectOne(`${environment.apiUrl}/batches/42/traceability`);
    expect(request.request.method).toBe('GET');
    request.flush(traceability);
    expect(result).toEqual(traceability);
  });

  it('gets and parses batch carbon footprint', () => {
    let result: unknown;
    service.getCarbonFootprint(42).subscribe((value) => (result = value));
    const request = http.expectOne(`${environment.apiUrl}/batches/42/carbon-footprint`);
    expect(request.request.method).toBe('GET');
    request.flush(footprint);
    expect(result).toEqual(footprint);
  });

  it('fails when the API returns an invalid payload', () => {
    let failed = false;
    service.getTraceability(42).subscribe({ error: () => (failed = true) });
    http.expectOne(`${environment.apiUrl}/batches/42/traceability`).flush({ batchId: 42 });
    expect(failed).toBe(true);
  });
});
