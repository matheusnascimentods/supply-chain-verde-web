import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { localDateDaysAgo } from '../../../../../shared/utils/date/index.utils';
import { UpdateCertificationStatusUseCase } from '../../../../certifications';
import { SupplierCertificationsModalComponent } from './index.component';

describe('SupplierCertificationsModalComponent', () => {
  let fixture: ComponentFixture<SupplierCertificationsModalComponent>;
  let updateStatus: { execute: ReturnType<typeof vi.fn> };
  let updated: number;
  const iso = { certificationId: 5, certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: '2026-01-10', expiresAt: localDateDaysAgo(-30), status: 'ACTIVE' as const };
  const expired = { ...iso, certificationId: 6, certification: 'FSC', expiresAt: localDateDaysAgo(1), status: 'EXPIRED' as const };

  function options(certification: string): HTMLButtonElement[] {
    const menu = document.body.querySelector(`[aria-label="Alterar status de ${certification}"]`);
    return Array.from(menu?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
  }

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

  it('disables Active only for expired certifications and explains why', () => {
    fixture.componentRef.setInput('certifications', [iso, expired]);
    fixture.detectChanges();
    expect(options('ISO 14001').every((option) => !option.disabled)).toBe(true);
    const [active, ...others] = options('FSC');
    expect(active.disabled).toBe(true);
    expect(others.every((option) => !option.disabled)).toBe(true);
    const hint = document.getElementById(active.getAttribute('aria-describedby') ?? '');
    expect(hint?.textContent).toContain(`Vencida em ${localDateDaysAgo(1).split('-').reverse().join('/')}: não pode voltar a ficar ativa.`);
  });

  it('skips the disabled option when navigating with the keyboard', () => {
    fixture.componentRef.setInput('certifications', [expired]);
    fixture.detectChanges();
    const menu = document.body.querySelector('details') as HTMLDetailsElement;
    menu.open = true;
    const [, second, , last] = options('FSC');
    fixture.componentInstance.handleStatusMenuKeydown(new KeyboardEvent('keydown', { key: 'Home' }), menu);
    expect(document.activeElement).toBe(second);
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    Object.defineProperty(event, 'target', { value: last });
    fixture.componentInstance.handleStatusMenuKeydown(event, menu);
    expect(document.activeElement).toBe(second);
  });

  it('refuses to reactivate an expired certification', () => {
    fixture.componentInstance.setStatus(expired, 'ACTIVE', document.createElement('details'));
    expect(updateStatus.execute).not.toHaveBeenCalled();
  });

  it('shows the API message when the API refuses the status', () => {
    const message = 'Certificação vencida não pode ser reativada.';
    updateStatus.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message } })));
    fixture.componentInstance.setStatus(iso, 'SUSPENDED', document.createElement('details'));
    expect(fixture.componentInstance.error()).toBe(message);
  });
});
