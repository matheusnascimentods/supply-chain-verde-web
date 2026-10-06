import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-spinner',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly message = input<string>('');
  readonly ariaLabel = input<string>('Carregando...');
  readonly fullScreen = input<boolean>(false);
}
