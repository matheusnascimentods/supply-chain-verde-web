import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: 'details[appCloseOnOutsideClick]',
  host: { '(document:click)': 'closeIfOutside($event)' },
})
export class CloseOnOutsideClickDirective {
  private readonly host = inject<ElementRef<HTMLDetailsElement>>(ElementRef);

  protected closeIfOutside(event: MouseEvent): void {
    const details = this.host.nativeElement;
    if (details.open && event.target instanceof Node && !details.contains(event.target)) {
      details.open = false;
    }
  }
}
