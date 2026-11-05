import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BATCH_STATUS_LABELS, BatchStatus } from '../../../domain/index.model';

@Component({
  selector: 'app-status-badge',
  template: '{{ label() }}',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-status]': 'status()' },
})
export class StatusBadgeComponent {
  readonly status = input.required<BatchStatus>();
  protected readonly label = computed(() => BATCH_STATUS_LABELS[this.status()]);
}
