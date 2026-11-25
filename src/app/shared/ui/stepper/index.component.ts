import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-stepper',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  readonly steps = input.required<readonly string[]>();
  readonly current = input.required<number>();
  readonly label = input.required<string>();
}
