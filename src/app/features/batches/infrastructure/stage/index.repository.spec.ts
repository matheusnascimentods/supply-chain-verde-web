import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { carbonEmissionResponseSchema } from './index.dto';
import { StagesRepository } from './index.repository';

describe('StagesRepository', () => {
  let repository: StagesRepository;
  let http: HttpTestingController;
  const address = { addressId: 3, street: 'Rua A', number: '10', neighborhood: 'Centro', complement: null, zipCode: '01000-000', city: 'São Paulo', state: 'SP' };
  const stage = {
    chainId: 50, batchId: 7, originAddress: address, destinationAddress: null, responsibleUserId: 2, responsibleUserName: 'Ana',
    stageType: 'TRANSPORT', startedAt: '2026-10-05T08:30:00', endedAt: null, transport: null, emission: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(StagesRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registers a stage with the responsible user header and full date-times', () => {
    repository.create(7, 2, { stageType: 'TRANSPORT', destination: { street: 'Rua A', number: '1', neighborhood: 'Centro', complement: null, zipCode: '13000000', city: 'Campinas', state: 'SP' } })
      .subscribe((result) => expect(result.originAddress?.complement).toBeNull());
    const request = http.expectOne(`${environment.apiUrl}/batches/7/stages`);
    expect(request.request.headers.get('X-Responsible-User-Id')).toBe('2');
    expect(request.request.body).toEqual({
      batchId: 7, stageType: 'TRANSPORT', destination: { street: 'Rua A', number: '1', neighborhood: 'Centro', complement: null, zipCode: '13000000', city: 'Campinas', state: 'SP' },
    });
    request.flush(stage);
  });

  it('registers the transport repeating the chain id in the body', () => {
    const transport = { transportMode: 'ROAD' as const, distance: 120, fuelType: 'DIESEL' as const, capacity: 1000 };
    repository.createTransport(50, transport).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/stages/50/transport`);
    expect(request.request.body).toEqual({ ...transport, chainId: 50 });
    request.flush({ transportId: 1, chainId: 50, ...transport });
  });

  it('calculates the emission with the chosen method', () => {
    repository.calculateEmission(50, { calculationMethod: 'GHG_PROTOCOL', cargoWeightKg: 1000 }).subscribe((emission) => expect(emission.co2Kg).toBe(12.5));
    const request = http.expectOne(`${environment.apiUrl}/stages/50/emission`);
    expect(request.request.body).toEqual({ calculationMethod: 'GHG_PROTOCOL', cargoWeightKg: 1000 });
    request.flush({ emissionId: 1, chainId: 50, emissionFactor: 0.1, co2Kg: 12.5, calculationMethod: 'GHG_PROTOCOL', calculatedAt: '2026-10-05', cargoWeightKg: 1000, energySource: null, consumption: null });
  });

  it('lists emission factors', () => {
    repository.listEmissionFactors().subscribe((factors) => expect(factors).toHaveLength(1));
    const request = http.expectOne(`${environment.apiUrl}/emission-factors`);
    request.flush([{
      calculationMethod: 'GHG_PROTOCOL',
      transportMode: 'AIR',
      fuelType: 'AVIATION_KEROSENE',
      energySource: null,
      value: 0.75539,
      unit: 'kgCO2e/tkm',
      source: 'DESNZ 2026, short-haul freight flight',
      referenceYear: 2026,
    }]);
  });

  it('parses legacy emissions without the new activity fields', () => {
    expect(carbonEmissionResponseSchema.parse({
      emissionId: 1,
      chainId: 50,
      emissionFactor: 0.1,
      co2Kg: 12.5,
      calculationMethod: 'GHG_PROTOCOL',
      calculatedAt: '2026-10-05',
    })).toMatchObject({ emissionId: 1, co2Kg: 12.5 });
  });
});
