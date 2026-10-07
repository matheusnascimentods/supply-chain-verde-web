import { TestBed } from '@angular/core/testing';
import { RoleBadgeComponent } from './index.component';

describe('RoleBadgeComponent', () => {
  it('shows the role label and exposes the role for styling', () => {
    const fixture = TestBed.createComponent(RoleBadgeComponent);
    fixture.componentRef.setInput('role', 'auditor');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent?.trim()).toBe('Auditor');
    expect(host.getAttribute('data-role')).toBe('auditor');
  });
});
