import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { MonthlyEmission } from '../../../domain/index.model';
import { monthLabel } from '../../../domain/index.rules';

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 32, left: 64 };
const PLOT_WIDTH = WIDTH - PAD.left - PAD.right;
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom;

interface ChartPoint {
  x: number;
  y: number;
  label: string;
  value: string;
  showLabel: boolean;
}

@Component({
  selector: 'app-emission-line-chart',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmissionLineChartComponent {
  readonly series = input.required<MonthlyEmission[]>();

  protected readonly viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  protected readonly pad = PAD;
  protected readonly plotRight = WIDTH - PAD.right;
  protected readonly baseline = PAD.top + PLOT_HEIGHT;
  // Com todos os meses zerados, a escala usa 1 para não dividir por zero.
  private readonly max = computed(() => Math.max(...this.series().map((item) => item.co2Kg), 0) || 1);
  protected readonly maxLabel = computed(() => formatNumberBr(this.max()));

  protected readonly points = computed<ChartPoint[]>(() => {
    const series = this.series();
    const step = series.length > 1 ? PLOT_WIDTH / (series.length - 1) : 0;
    return series.map((item, index) => ({
      x: PAD.left + (series.length > 1 ? index * step : PLOT_WIDTH / 2),
      y: this.baseline - (item.co2Kg / this.max()) * PLOT_HEIGHT,
      label: monthLabel(item.month),
      value: `${formatNumberBr(item.co2Kg)} kg CO₂e`,
      // Até 12 meses cabem todos os rótulos; acima disso, um sim, outro não.
      showLabel: series.length <= 12 || index % 2 === 0,
    }));
  });
  protected readonly polyline = computed(() => this.points().map((point) => `${point.x},${point.y}`).join(' '));

  protected readonly description = computed(() => {
    const points = this.points();
    if (!points.length) return 'Emissões mensais: sem dados.';
    const peak = points.reduce((top, point) => (point.y < top.y ? point : top));
    return `Emissões mensais de ${points[0].label} a ${points[points.length - 1].label}. Pico em ${peak.label}: ${peak.value}.`;
  });
}
