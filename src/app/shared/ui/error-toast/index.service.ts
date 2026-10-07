import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ErrorToastService {
  private readonly _toasts = signal<ToastItem[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private counter = 0;

  show(message: string, duration = 5000): string {
    this.counter += 1;
    const id = `toast-${Date.now()}-${this.counter}`;
    const newToast: ToastItem = { id, message, duration };

    this._toasts.update((current) => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  dismiss(id: string): void {
    this._toasts.update((current) => current.filter((item) => item.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
