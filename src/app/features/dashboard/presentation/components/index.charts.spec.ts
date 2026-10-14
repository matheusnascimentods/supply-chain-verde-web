import { TestBed } from '@angular/core/testing';
import { StageShare } from '../../domain/index.model';
import { EmissionLineChartComponent } from './emission-line-chart/index.component';
import { MetricCardComponent } from './metric-card/index.component';
import { StageBarChartComponent } from './stage-bar-chart/index.component';
import { StagePieChartComponent } from './stage-pie-chart/index.component';

describe('dashboard charts', () => {
  const shares: StageShare[] = [
    { stage: 'PRODUCTION', count: 1, percent: 25 },
    { stage: 'TRANSPORT', count: 3, percent: 75 },
  ];

  it('metric card shows label and value with a tone for the accent color', () => {
    const fixture = TestBed.createComponent(MetricCardComponent);
    fixture.componentRef.setInput('label', 'Lotes Ativos');
    fixture.componentRef.setInput('value', '12');
    fixture.componentRef.setInput('tone', 'batches');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Lotes Ativos');
    expect(fixture.nativeElement.getAttribute('data-tone')).toBe('batches');
  });

  it('bar chart scales bars to the largest stage with a minimum height', () => {
    const fixture = TestBed.createComponent(StageBarChartComponent);
    fixture.componentRef.setInput('shares', shares);
    fixture.detectChanges();
    const bars: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.bar'));
    const heights = bars.map((bar) => parseFloat(bar.style.height));
    expect(heights[0]).toBeCloseTo(33.33, 1);
    expect(heights[1]).toBe(100);
    expect(bars[1].getAttribute('data-stage')).toBe('TRANSPORT');
    expect(fixture.nativeElement.querySelector('[role="img"]').getAttribute('aria-label')).toBe('Lotes por etapa: Produção: 1, Transporte: 3');
  });

  it('pie chart draws consecutive arcs for each stage', () => {
    const fixture = TestBed.createComponent(StagePieChartComponent);
    fixture.componentRef.setInput('shares', shares);
    fixture.componentRef.setInput('total', 4);
    fixture.detectChanges();
    const segments: SVGElement[] = Array.from(fixture.nativeElement.querySelectorAll('.pie-segment'));
    expect(segments.map((segment) => segment.getAttribute('stroke-dasharray'))).toEqual(['25 75', '75 25']);
    expect(segments.map((segment) => segment.getAttribute('stroke-dashoffset'))).toEqual(['0', '-25']);
    expect(fixture.nativeElement.textContent).toContain('4');
  });

  it('line chart places each month on a rounded scale and lists the values for screen readers', () => {
    const fixture = TestBed.createComponent(EmissionLineChartComponent);
    fixture.componentRef.setInput('series', [
      { month: '2026-01', co2Kg: 366.42 },
      { month: '2026-02', co2Kg: 50 },
      { month: '2026-03', co2Kg: 200 },
    ]);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(Array.from(element.querySelectorAll('.emission-chart-tick')).map((tick) => tick.textContent)).toEqual(['0', '100', '200', '300', '400']);
    const slots = Array.from(element.querySelectorAll<HTMLElement>('.emission-chart-slot'));
    expect(slots.map((slot) => slot.style.left)).toEqual(['0%', '50%', '100%']);
    expect(parseFloat(element.querySelector<HTMLElement>('.emission-chart-dot')!.style.top)).toBeCloseTo(8.395);
    expect(slots[0].textContent).toContain('366,42 kg CO₂e');
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Emissões mensais de jan/2026 a mar/2026. Pico em jan/2026: 366,42 kg CO₂e.');
    expect(element.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('line chart shows at most six month labels, always the first and the last', () => {
    const fixture = TestBed.createComponent(EmissionLineChartComponent);
    fixture.componentRef.setInput('series', Array.from({ length: 12 }, (_, index) => ({ month: `2026-${String(index + 1).padStart(2, '0')}`, co2Kg: index })));
    fixture.detectChanges();
    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.emission-chart-month')).map((label) => label.textContent);
    expect(labels).toEqual(['jan/2026', 'mar/2026', 'mai/2026', 'jul/2026', 'set/2026', 'nov/2026', 'dez/2026']);
  });

  it('line chart keeps all-zero months on the baseline without dividing by zero', () => {
    const fixture = TestBed.createComponent(EmissionLineChartComponent);
    fixture.componentRef.setInput('series', [
      { month: '2026-01', co2Kg: 0 },
      { month: '2026-02', co2Kg: 0 },
    ]);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const tops = Array.from(element.querySelectorAll<HTMLElement>('.emission-chart-dot')).map((dot) => dot.style.top);
    expect(tops).toEqual(['100%', '100%']);
    expect(element.querySelector('.emission-chart-line')?.getAttribute('d')).not.toContain('NaN');
  });
});
