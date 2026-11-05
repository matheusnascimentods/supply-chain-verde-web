import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserRole } from '../../../../../core/auth/session/index.model';
import { RoleMenuComponent } from './index.component';

describe('RoleMenuComponent', () => {
  let fixture: ComponentFixture<RoleMenuComponent>;
  let selected: UserRole[];

  beforeEach(() => {
    selected = [];
    fixture = TestBed.createComponent(RoleMenuComponent);
    fixture.componentRef.setInput('user', { userId: 1, name: 'Ana', email: 'ana@example.com', role: 'manager', companyType: 'market' });
    fixture.componentInstance.roleSelected.subscribe((role) => selected.push(role));
    fixture.detectChanges();
  });

  function option(label: string): HTMLButtonElement {
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('[role="menuitemradio"]'));
    return buttons.find((button) => button.textContent?.includes(label))!;
  }

  const labels = () => Array.from(fixture.nativeElement.querySelectorAll('[role="menuitemradio"]') as NodeListOf<HTMLElement>).map((button) => button.textContent?.trim());

  it('lists the roles of the user company and marks the current one', () => {
    expect(labels()).toEqual(['Administrador', 'Gestor ✓', 'Auditor']);
    expect(option('Gestor').getAttribute('aria-checked')).toBe('true');
  });

  it('lists only admin and supplier for a supplier company', () => {
    fixture.componentRef.setInput('user', { userId: 2, name: 'Bia', email: 'bia@example.com', role: 'supplier', companyType: 'supplier' });
    fixture.detectChanges();
    expect(labels()).toEqual(['Administrador', 'Fornecedor ✓']);
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
