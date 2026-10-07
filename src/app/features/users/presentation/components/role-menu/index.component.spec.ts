import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserRole } from '../../../../../core/auth/session/index.model';
import { RoleMenuComponent } from './index.component';

describe('RoleMenuComponent', () => {
  let fixture: ComponentFixture<RoleMenuComponent>;
  let selected: UserRole[];

  beforeEach(() => {
    selected = [];
    fixture = TestBed.createComponent(RoleMenuComponent);
    fixture.componentRef.setInput('user', { userId: 1, name: 'Ana', email: 'ana@example.com', role: 'manager' });
    fixture.componentInstance.roleSelected.subscribe((role) => selected.push(role));
    fixture.detectChanges();
  });

  function option(label: string): HTMLButtonElement {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="menuitemradio"]'));
    return buttons.find((button) => button.textContent?.includes(label))!;
  }

  it('lists every role and marks the current one', () => {
    expect(fixture.nativeElement.querySelectorAll('[role="menuitemradio"]').length).toBe(4);
    expect(option('Gestor').getAttribute('aria-checked')).toBe('true');
  });

  it('emits the chosen role and closes the menu', () => {
    const details: HTMLDetailsElement = fixture.nativeElement.querySelector('details');
    details.open = true;
    option('Auditor').click();
    expect(selected).toEqual(['auditor']);
    expect(details.open).toBe(false);
  });

  it('does not emit when the current role is chosen again', () => {
    option('Gestor').click();
    expect(selected).toEqual([]);
  });

  it('closes on Escape', () => {
    const details: HTMLDetailsElement = fixture.nativeElement.querySelector('details');
    details.open = true;
    details.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(details.open).toBe(false);
  });
});
