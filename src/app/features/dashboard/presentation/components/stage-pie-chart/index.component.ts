import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STAGE_TYPE_LABELS } from '../../../../batches';
import { StageShare } from '../../../domain/index.model';
import { describeDistribution } from '../../../domain/index.rules';

@Component({
  selector: 'app-stage-pie-chart',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StagePieChartComponent {
  readonly shares = input.required<StageShare[]>();
  readonly total = input.required<number>();
  protected readonly labels = STAGE_TYPE_LABELS;
  protected readonly description = computed(() => describeDistribution(this.shares()));

  // O círculo tem circunferência 100 (r = 15.9155), então o percentual vira o comprimento do arco.
  protected readonly segments = computed(() => {
    let offset = 0;
    return this.shares().map((share) => {
      const segment = { ...share, offset, dashArray: `${share.percent} ${100 - share.percent}` };
      offset += share.percent;
      return segment;
    });
  });
}
