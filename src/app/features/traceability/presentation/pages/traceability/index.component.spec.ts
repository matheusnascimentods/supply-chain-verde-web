import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { TraceabilityFacade } from '../../../application/index.facade';
import { BatchTraceability } from '../../../domain/index.model';
import { TraceabilityComponent } from './index.component';

describe('TraceabilityComponent', () => {
  let fixture: ComponentFixture<TraceabilityComponent>;
  const address = (city: string | null, state: string | null) => ({ addressId: 1, city, state });
  const batch: BatchTraceability = {
    batchId: 42, productName: 'Café orgânico', supplierName: 'Fazenda Verde', quantity: 100, producedAt: '2026-01-12', totalCo2Kg: 8.5,
    stages: [
      {
        chainId: 1, batchId: 42, originAddress: address('Campinas', 'SP'), destinationAddress: address(null, null), responsibleUserId: 1,
        responsibleUserName: 'Ana', stageType: 'TRANSPORT', startedAt: '2026-01-13T08:00:00', endedAt: null,
        transport: { transportId: 1, chainId: 1, transportMode: 'RAIL', distance: 300, fuelType: 'ELECTRIC', capacity: 1 }, emission: null,
      },
    ],
  };

  function render(state: Record<string, unknown>): { page: HTMLElement; load: ReturnType<typeof vi.fn> } {
    const load = vi.fn();
    const facade = {
      isLoading: signal(false),
      errorMessage: signal<string | null>(null),
      traceability: signal<BatchTraceability | null>(batch),
      footprint: signal({ batchId: 42, totalCo2Kg: 8.5, emissionsByStage: [] }),
      load,
      ...state,
    };
    TestBed.configureTestingModule({ providers: [{ provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ batchId: '42' })) } }] });
    TestBed.overrideComponent(TraceabilityComponent, { set: { providers: [{ provide: TraceabilityFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(TraceabilityComponent);
    fixture.detectChanges();
    return { page: fixture.nativeElement, load };
  }

  it('loads the batch from the URL and renders the journey', () => {
    const { page, load } = render({});
    expect(load).toHaveBeenCalledWith('42');
    const text = page.textContent ?? '';
    expect(text).toContain('Café orgânico');
    expect(text).toContain('8.5 kg CO₂e');
    expect(text).toContain('Transporte');
    expect(text).toContain('Ferroviário · ELECTRIC · 300 km');
  });

  it('shows only the parts of the address that exist', () => {
    const place = render({}).page.querySelector('.journey-place')!.textContent!.trim();
    expect(place).toBe('Campinas, SP');
  });

  it('shows the friendly error message', () => {
    const { page } = render({ traceability: signal(null), errorMessage: signal('Não foi possível localizar as informações deste lote.') });
    expect(page.textContent).toContain('Lote não encontrado');
  });

  it('shows an empty timeline message when the batch has no stages', () => {
    const { page } = render({ traceability: signal({ ...batch, stages: [] }) });
    expect(page.textContent).toContain('Ainda não há etapas registradas');
  });

  it('names the product and supplier generically when the batch has none linked', () => {
    const { page } = render({ traceability: signal({ ...batch, productName: null, supplierName: null }) });
    expect(page.textContent).toContain('Produto não identificado');
    expect(page.textContent).toContain('Fornecedor não identificado');
  });
});
