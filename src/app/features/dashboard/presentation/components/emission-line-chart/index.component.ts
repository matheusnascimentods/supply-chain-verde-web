import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { MonthlyEmission } from '../../../domain/index.model';
import { monthLabel } from '../../../domain/index.rules';

const MAX_X_LABELS = 6;

interface ChartPoint {
  month: string;
  label: string;
  value: string;
  /** Posição em % da área do gráfico; y cresce para baixo, como no SVG. */
  x: number;
  y: number;
}

/** Passo "redondo" (1, 2, 2,5, 5 × 10ⁿ) para as linhas de grade. */
function niceStep(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10) * magnitude;
}

// Curva suave (Catmull-Rom → Bézier) com os pontos de controle presos à área, para não passar abaixo de zero.
function smoothPath(points: ChartPoint[]): string {
  if (!points.length) return '';
  const clamp = (y: number) => Math.min(100, Math.max(0, y));
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    const c1 = `${p1.x + (p2.x - p0.x) / 6},${clamp(p1.y + (p2.y - p0.y) / 6)}`;
    const c2 = `${p2.x - (p3.x - p1.x) / 6},${clamp(p2.y - (p3.y - p1.y) / 6)}`;
    path += ` C ${c1} ${c2} ${p2.x},${p2.y}`;
  }
  return path;
}

@Component({
  selector: 'app-emission-line-chart',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmissionLineChartComponent {
  readonly series = input.required<MonthlyEmission[]>();

  private readonly step = computed(() => niceStep(Math.max(...this.series().map((item) => item.co2Kg), 0) / 4 || 1));
  // Topo da escala: múltiplo do passo logo acima do maior valor (com tudo zerado, um passo, sem dividir por zero).
  private readonly top = computed(() => {
    const max = Math.max(...this.series().map((item) => item.co2Kg), 0);
    return Math.max(1, Math.ceil(max / this.step())) * this.step();
  });

  protected readonly ticks = computed(() => {
    const count = Math.round(this.top() / this.step());
    return Array.from({ length: count + 1 }, (_, index) => ({
      label: formatNumberBr(index * this.step()),
      percent: (index / count) * 100,
    }));
  });

  protected readonly points = computed<ChartPoint[]>(() => {
    const series = this.series();
    return series.map((item, index) => ({
      month: item.month,
      label: monthLabel(item.month),
      value: `${formatNumberBr(item.co2Kg)} kg CO₂e`,
      x: series.length > 1 ? (index / (series.length - 1)) * 100 : 50,
      y: 100 - (item.co2Kg / this.top()) * 100,
    }));
  });

  protected readonly linePath = computed(() => smoothPath(this.points()));
  protected readonly areaPath = computed(() => {
    const points = this.points();
    return points.length ? `${this.linePath()} L ${points[points.length - 1].x},100 L ${points[0].x},100 Z` : '';
  });

  // No máximo 6 rótulos de mês, sempre incluindo o primeiro e o último.
  protected readonly xLabels = computed(() => {
    const points = this.points();
    const every = Math.ceil(points.length / MAX_X_LABELS);
    return points.filter((_, index) => index % every === 0 || index === points.length - 1);
  });

  protected readonly description = computed(() => {
    const points = this.points();
    if (!points.length) return 'Emissões mensais: sem dados.';
    const peak = points.reduce((top, point) => (point.y < top.y ? point : top));
    return `Emissões mensais de ${points[0].label} a ${points[points.length - 1].label}. Pico em ${peak.label}: ${peak.value}.`;
  });
}
