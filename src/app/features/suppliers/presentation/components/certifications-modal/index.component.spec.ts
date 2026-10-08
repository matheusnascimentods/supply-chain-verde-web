import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UpdateCertificationStatusUseCase } from '../../../../certifications';
import { SupplierCertificationsModalComponent } from './index.component';

describe('SupplierCertificationsModalComponent', () => {
  let fixture: ComponentFixture<SupplierCertificationsModalComponent>;
  let updateStatus: { execute: ReturnType<typeof vi.fn> };
  let updated: number;
  const iso = { certificationId: 5, certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: '2026-01-10', expiresAt: '2027-01-10', status: 'ACTIVE' as const };

  beforeEach(() => {
    updated = 0;
    updateStatus = { execute: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({ providers: [{ provide: UpdateCertificationStatusUseCase, useValue: updateStatus }] });
    fixture = TestBed.createComponent(SupplierCertificationsModalComponent);
    fixture.componentRef.setInput('supplierId', 9);
    fixture.componentRef.setInput('supplierName', 'Fazenda Verde');
    fixture.componentRef.setInput('certifications', [iso]);
    fixture.componentRef.setInput('canUpdateStatus', true);
    fixture.componentInstance.updated.subscribe(() => updated++);
    fixture.detectChanges();
  });

  it('shows the certification with formatted dates and a status badge for styling', () => {
    const text = document.body.textContent ?? '';
    expect(text).toContain('10/01/2026');
    expect(document.body.querySelector('summary.status-badge')?.getAttribute('data-status')).toBe('ACTIVE');
  });

  it('updates the status and notifies the page', () => {
    const menu = document.createElement('details');
    fixture.componentInstance.setStatus(iso, 'SUSPENDED', menu);
    expect(updateStatus.execute).toHaveBeenCalledWith(5, 'SUSPENDED');
    expect(updated).toBe(1);
  });

  it('ignores choosing the current status', () => {
    fixture.componentInstance.setStatus(iso, 'ACTIVE', document.createElement('details'));
    expect(updateStatus.execute).not.toHaveBeenCalled();
  });

  it('shows an error when the update fails', () => {
    updateStatus.execute.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.setStatus(iso, 'EXPIRED', document.createElement('details'));
    expect(fixture.componentInstance.error()).toBe('Não foi possível atualizar o status de ISO 14001.');
  });
});
