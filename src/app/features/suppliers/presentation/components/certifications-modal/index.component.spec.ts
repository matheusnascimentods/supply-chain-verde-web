import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateCertificationStatusUseCase } from '../../../../certifications';
import { SupplierCertificationsModalComponent } from './index.component';

describe('SupplierCertificationsModalComponent', () => {
  let fixture: ComponentFixture<SupplierCertificationsModalComponent>;
  const iso = { certificationId: 5, certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: '2026-01-10', expiresAt: '2099-01-10', status: 'ACTIVE' as const };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: UpdateCertificationStatusUseCase, useValue: { execute: vi.fn() } }] });
    fixture = TestBed.createComponent(SupplierCertificationsModalComponent);
    fixture.componentRef.setInput('supplierName', 'Fazenda Verde');
    fixture.componentRef.setInput('certifications', [iso]);
    fixture.detectChanges();
  });

  const modal = () => document.body.querySelector('[role="dialog"]') ?? (fixture.nativeElement as HTMLElement);

  it('shows the supplier certifications read-only: no status menu and no create form', () => {
    expect(modal().textContent).toContain('Certificações de Fazenda Verde');
    expect(modal().textContent).toContain('ISO 14001');
    expect(modal().querySelector('.status-badge')?.textContent?.trim()).toBe('Ativa');
    expect(modal().querySelector('details.status-menu')).toBeNull();
    expect(modal().querySelector('app-certification-form')).toBeNull();
  });

  it('explains when the supplier has no certifications', () => {
    fixture.componentRef.setInput('certifications', []);
    fixture.detectChanges();
    expect(modal().textContent).toContain('Nenhuma certificação cadastrada para este fornecedor.');
  });

  it('closes on the close button', () => {
    let dismissed = 0;
    fixture.componentInstance.dismissed.subscribe(() => dismissed++);
    modal().querySelector<HTMLButtonElement>('[aria-label="Fechar certificações"]')!.click();
    expect(dismissed).toBe(1);
  });
});
