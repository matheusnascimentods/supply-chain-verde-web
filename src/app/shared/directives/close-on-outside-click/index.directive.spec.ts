import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CloseOnOutsideClickDirective } from './index.directive';

@Component({
  imports: [CloseOnOutsideClickDirective],
  template: `
    <details appCloseOnOutsideClick open><summary>Menu</summary><button id="inside">Item</button></details>
    <button id="outside">Fora</button>
  `,
})
class HostComponent {}

describe('CloseOnOutsideClickDirective', () => {
  let root: HTMLElement;
  let details: HTMLDetailsElement;

  beforeEach(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    root = fixture.nativeElement;
    document.body.appendChild(root);
    details = root.querySelector('details')!;
  });

  afterEach(() => root.remove());

  it('closes the details element when clicking outside of it', () => {
    root.querySelector<HTMLButtonElement>('#outside')!.click();
    expect(details.open).toBe(false);
  });

  it('keeps the details element open when clicking inside of it', () => {
    root.querySelector<HTMLButtonElement>('#inside')!.click();
    expect(details.open).toBe(true);
  });
});
