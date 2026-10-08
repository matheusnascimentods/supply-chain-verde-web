import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MetricTone = 'batches' | 'certifications' | 'suppliers' | 'emission';

@Component({
  selector: 'app-metric-card',
  template: `
    <span class="metric-accent" aria-hidden="true"></span>
    <h2 class="metric-label">{{ label() }}</h2>
    <p class="metric-value">{{ value() }}</p>
  `,
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-tone]': 'tone()' },
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly tone = input.required<MetricTone>();
}
