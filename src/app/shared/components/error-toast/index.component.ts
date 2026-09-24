import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ErrorToastService } from './index.service';

@Component({
  selector: 'app-error-toast',
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorToastComponent {
  readonly toastService = inject(ErrorToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
