import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type ConfirmDialogVariant = 'danger' | 'primary';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onEscape()',
  },
})
export class ConfirmDialogComponent {
  readonly isOpen = input<boolean>(true);
  readonly title = input<string>('Confirmação');
  readonly message = input<string>('');
  readonly confirmText = input<string>('Confirmar');
  readonly cancelText = input<string>('Cancelar');
  readonly variant = input<ConfirmDialogVariant>('danger');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected readonly confirmButtonClasses = computed(() => {
    const baseClasses =
      'inline-flex justify-center items-center px-4 py-2 text-sm font-semibold rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 cursor-pointer';

    if (this.variant() === 'danger') {
      return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
    }

    return `${baseClasses} text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500`;
  });

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onEscape(): void {
    if (this.isOpen()) {
      this.onCancel();
    }
  }
}
