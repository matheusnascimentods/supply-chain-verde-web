import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, input, output } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | '2xl' | 'xl';

@Component({
  selector: 'app-modal',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  readonly labelledBy = input.required<string>();
  readonly describedBy = input<string | null>(null);
  readonly size = input<ModalSize>('md');
  readonly flush = input(false);
  readonly initialFocusSelector = input('');
  readonly closeOnBackdrop = input(true);
  readonly closeOnEscape = input(true);
  readonly dismissed = output<void>();
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;
  private readonly previousFocus = typeof document === 'undefined' ? null : document.activeElement;

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      const panel = this.dialog?.nativeElement;
      const initialTarget = this.initialFocusSelector() ? panel?.querySelector<HTMLElement>(this.initialFocusSelector()) : null;
      (initialTarget ?? panel)?.focus();
    });
  }
  ngOnDestroy(): void {
    if (typeof HTMLElement !== 'undefined' && this.previousFocus instanceof HTMLElement) this.previousFocus.focus();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) this.dismissed.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnEscape()) {
      event.preventDefault();
      this.dismissed.emit();
      return;
    }
    if (event.key !== 'Tab' || !this.dialog) return;
    const focusable = Array.from(this.dialog.nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) {
      event.preventDefault();
      this.dialog.nativeElement.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }
}
