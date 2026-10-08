import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TraceabilityRepository } from '../infrastructure/index.repository';
import { TraceabilityFacade } from './index.facade';

describe('TraceabilityFacade', () => {
  const batch = { batchId: 42, productName: 'Café', supplierName: 'Fazenda', quantity: 1, producedAt: '2026-01-12', stages: [], totalCo2Kg: 8.5 };
  const footprint = { batchId: 42, totalCo2Kg: 8.5, emissionsByStage: [] };
  let repository: { getTraceability: ReturnType<typeof vi.fn>; getCarbonFootprint: ReturnType<typeof vi.fn> };
  let facade: TraceabilityFacade;
  const error = 'Não foi possível localizar as informações deste lote. Confira o código e tente novamente.';

  beforeEach(() => {
    repository = { getTraceability: vi.fn().mockReturnValue(of(batch)), getCarbonFootprint: vi.fn().mockReturnValue(of(footprint)) };
    TestBed.configureTestingModule({ providers: [TraceabilityFacade, { provide: TraceabilityRepository, useValue: repository }] });
    facade = TestBed.inject(TraceabilityFacade);
  });

  it('loads the journey and the carbon footprint of the batch', () => {
    facade.load('42');
    expect(repository.getTraceability).toHaveBeenCalledWith('42');
    expect(repository.getCarbonFootprint).toHaveBeenCalledWith('42');
    expect(facade.traceability()).toEqual(batch);
    expect(facade.footprint()).toEqual(footprint);
    expect(facade.isLoading()).toBe(false);
  });

  it('rejects an invalid batch code without calling the API', () => {
    facade.load('abc');
    expect(repository.getTraceability).not.toHaveBeenCalled();
    expect(facade.errorMessage()).toBe(error);
  });

  it('shows a generic message when any request fails', () => {
    repository.getCarbonFootprint.mockReturnValue(throwError(() => new Error('404 detalhe interno')));
    facade.load('42');
    expect(facade.traceability()).toBeNull();
    expect(facade.errorMessage()).toBe(error);
  });
});
