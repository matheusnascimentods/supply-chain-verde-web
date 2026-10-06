import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  template: '<div [class.shared-table-frame]="framed()"><div class="shared-table-scroll"><ng-content /></div></div>',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'region' },
})
export class DataTableComponent {
  readonly framed = input(true);
}
