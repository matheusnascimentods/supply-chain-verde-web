import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ConfirmDialogVariant = 'danger' | 'primary';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
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
  readonly cancelled = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
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
