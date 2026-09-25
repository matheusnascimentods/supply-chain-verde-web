import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarbonChartComponent } from './index.component';

describe('CarbonChartComponent', () => {
  let fixture: ComponentFixture<CarbonChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CarbonChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(CarbonChartComponent);
  });

  it('renders a proportional, labeled bar for each stage emission', () => {
    fixture.componentRef.setInput('emissions', [
      { emissionId: 1, chainId: 5, emissionFactor: 1, co2Kg: 4, calculationMethod: 'IPCC', calculatedAt: '2026-01-01' },
      { emissionId: 2, chainId: 6, emissionFactor: 1, co2Kg: 2, calculationMethod: 'IPCC', calculatedAt: '2026-01-01' },
    ]);
    fixture.componentRef.setInput('stages', [
      { chainId: 5, batchId: 10, originAddress: null, destinationAddress: null, responsibleUserId: 1, responsibleUserName: 'Ana', stageType: 'PRODUCTION', startedAt: '2026-01-01T10:00:00', endedAt: null, transport: null, emission: null },
      { chainId: 6, batchId: 10, originAddress: null, destinationAddress: null, responsibleUserId: 1, responsibleUserName: 'Ana', stageType: 'TRANSPORT', startedAt: '2026-01-02T10:00:00', endedAt: null, transport: null, emission: null },
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Produção');
    expect(compiled.textContent).toContain('Transporte');
    expect(compiled.textContent).toContain('4 kg CO₂e');
    const bars = compiled.querySelectorAll('li > div:last-child > div');
    expect((bars[0] as HTMLElement).style.width).toBe('100%');
    expect((bars[1] as HTMLElement).style.width).toBe('50%');
  });

  it('shows an empty state when there are no emissions', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ainda não há emissões calculadas');
  });
});
