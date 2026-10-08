import { TestBed } from '@angular/core/testing';
import { StageBadgeComponent } from './index.component';

describe('StageBadgeComponent', () => {
  it('shows the stage label and exposes the stage for styling', () => {
    const fixture = TestBed.createComponent(StageBadgeComponent);
    fixture.componentRef.setInput('stage', 'DISTRIBUTION');
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent?.trim()).toBe('Distribuição');
    expect(host.getAttribute('data-stage')).toBe('DISTRIBUTION');
  });
});
