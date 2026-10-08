import { TestBed } from '@angular/core/testing';
import { StageShare } from '../../domain/index.model';
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
});
