import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STAGE_TYPE_LABELS, StageType } from '../../../domain/stage/index.model';

@Component({
  selector: 'app-stage-badge',
  template: '{{ label() }}',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-stage]': 'stage()' },
})
export class StageBadgeComponent {
  readonly stage = input.required<StageType>();
  protected readonly label = computed(() => STAGE_TYPE_LABELS[this.stage()]);
}
