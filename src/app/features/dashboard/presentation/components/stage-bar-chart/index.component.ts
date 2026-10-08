import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STAGE_TYPE_LABELS } from '../../../../batches';
import { StageShare } from '../../../domain/index.model';
import { describeDistribution } from '../../../domain/index.rules';

const MIN_BAR_HEIGHT = 8;

@Component({
  selector: 'app-stage-bar-chart',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageBarChartComponent {
  readonly shares = input.required<StageShare[]>();
  protected readonly labels = STAGE_TYPE_LABELS;
  protected readonly description = computed(() => describeDistribution(this.shares()));
  private readonly maxCount = computed(() => Math.max(1, ...this.shares().map((share) => share.count)));

  protected barHeight(count: number): number {
    return Math.max((count / this.maxCount()) * 100, MIN_BAR_HEIGHT);
  }
}
