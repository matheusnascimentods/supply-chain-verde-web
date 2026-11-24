import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './index.component';

describe('StatusBadgeComponent', () => {
  it.each([
    ['PENDING', 'Pendente'],
    ['ACTIVE', 'Em andamento'],
    ['COMPLETED', 'Concluído'],
    ['REJECTED', 'Recusado'],
    ['CANCELED', 'Cancelado'],
  ] as const)('labels %s as "%s" and exposes the status for styling', (status, label) => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent?.trim()).toBe(label);
    expect(host.getAttribute('data-status')).toBe(status);
  });
});
