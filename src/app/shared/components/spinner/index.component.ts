import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-spinner',
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly message = input<string>('');
  readonly ariaLabel = input<string>('Carregando...');
  readonly fullScreen = input<boolean>(false);

  protected readonly sizeClasses = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-12 w-12';
      case 'md':
      default:
        return 'h-8 w-8';
    }
  });

  protected readonly containerClasses = computed(() => {
    if (this.fullScreen()) {
      return 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4';
    }
    return 'inline-flex flex-col items-center justify-center gap-2 p-2';
  });
}
