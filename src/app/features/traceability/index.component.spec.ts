import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TraceabilityComponent } from './index.component';
import { TraceabilityService } from './index.service';

describe('TraceabilityComponent', () => {
  let fixture: ComponentFixture<TraceabilityComponent>;
  let service: { getTraceability: ReturnType<typeof vi.fn>; getCarbonFootprint: ReturnType<typeof vi.fn> };

  const batch = {
    batchId: 42, productName: 'Café orgânico', supplierName: 'Fazenda Verde', quantity: 100,
    producedAt: '2026-01-12', stages: [], totalCo2Kg: 8.5,
  };
  const footprint = { batchId: 42, totalCo2Kg: 8.5, emissionsByStage: [] };

  beforeEach(async () => {
    service = { getTraceability: vi.fn(), getCarbonFootprint: vi.fn() };
    service.getTraceability.mockReturnValue(of(batch));
    service.getCarbonFootprint.mockReturnValue(of(footprint));
    await TestBed.configureTestingModule({
      imports: [TraceabilityComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ batchId: '42' })) } },
        { provide: TraceabilityService, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TraceabilityComponent);
    fixture.detectChanges();
  });

  it('loads both public endpoints and renders batch details and carbon total', () => {
    expect(service.getTraceability).toHaveBeenCalledWith('42');
    expect(service.getCarbonFootprint).toHaveBeenCalledWith('42');
    expect(fixture.nativeElement.textContent).toContain('Café orgânico');
    expect(fixture.nativeElement.textContent).toContain('Fazenda Verde');
    expect(fixture.nativeElement.textContent).toContain('8.5 kg CO₂e');
  });

  it('shows a friendly error if either public endpoint fails', async () => {
    service.getTraceability.mockReturnValue(throwError(() => new Error('404 internal detail')));
    fixture.destroy();
    fixture = TestBed.createComponent(TraceabilityComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Lote não encontrado');
    expect(fixture.nativeElement.textContent).not.toContain('404 internal detail');
  });

  it('shows an empty timeline message when the batch has no stages', () => {
    expect(fixture.nativeElement.textContent).toContain('Ainda não há etapas registradas');
  });
});
