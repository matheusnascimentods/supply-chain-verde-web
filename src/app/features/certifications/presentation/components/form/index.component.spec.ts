import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { localDateDaysAgo } from '../../../../../shared/utils/date/index.utils';
import { CreateCertificationUseCase } from '../../../application/use-cases/create-certification/index.use-case';
import { CertificationFormComponent } from './index.component';

describe('CertificationFormComponent', () => {
  let fixture: ComponentFixture<CertificationFormComponent>;
  let createCertification: { execute: ReturnType<typeof vi.fn> };
  let saved: number;
  const certification = { certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: localDateDaysAgo(300), expiresAt: localDateDaysAgo(-65) };

  beforeEach(() => {
    saved = 0;
    createCertification = { execute: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({ providers: [{ provide: CreateCertificationUseCase, useValue: createCertification }] });
    fixture = TestBed.createComponent(CertificationFormComponent);
    fixture.componentRef.setInput('supplierId', 9);
    fixture.componentInstance.saved.subscribe(() => saved++);
    fixture.detectChanges();
  });

  it('shows the required messages and does not submit an invalid form', () => {
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(createCertification.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Informe o nome da certificação.');
  });

  it('registers the certification, resets the form and notifies the parent', () => {
    fixture.componentInstance.form.setValue(certification);
    fixture.componentInstance.submit();
    expect(createCertification.execute).toHaveBeenCalledWith(9, certification);
    expect(saved).toBe(1);
    expect(fixture.componentInstance.form.getRawValue().certification).toBe('');
  });

  it('keeps the data and shows an error when saving fails', () => {
    createCertification.execute.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.form.setValue(certification);
    fixture.componentInstance.submit();
    expect(saved).toBe(0);
    expect(fixture.componentInstance.form.getRawValue()).toEqual(certification);
    expect(fixture.componentInstance.error()).toBe('Não foi possível salvar. Confira os dados e tente novamente.');
  });

  it('blocks an expiry date in the past without calling the API', () => {
    fixture.componentInstance.form.setValue({ ...certification, expiresAt: localDateDaysAgo(1) });
    fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(createCertification.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('A validade não pode estar no passado.');
  });

  it('blocks an expiry date before the issue date', () => {
    fixture.componentInstance.form.setValue({ ...certification, issuedAt: localDateDaysAgo(-10), expiresAt: localDateDaysAgo(-5) });
    fixture.componentInstance.submit();
    expect(createCertification.execute).not.toHaveBeenCalled();
    expect(fixture.componentInstance.fieldError('expiresAt')).toBe('A validade deve ser igual ou posterior à emissão.');
  });

  it('revalidates the expiry date when the issue date changes', () => {
    const { issuedAt, expiresAt } = fixture.componentInstance.form.controls;
    expiresAt.setValue(localDateDaysAgo(-5));
    issuedAt.setValue(localDateDaysAgo(-10));
    expect(expiresAt.hasError('beforeIssue')).toBe(true);
    issuedAt.setValue(localDateDaysAgo(0));
    expect(expiresAt.valid).toBe(true);
  });

  it('accepts today as the expiry date and limits the date picker', () => {
    fixture.componentInstance.form.setValue({ ...certification, expiresAt: localDateDaysAgo(0) });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#certification-expires-at').getAttribute('min')).toBe(localDateDaysAgo(0));
    fixture.componentInstance.submit();
    expect(createCertification.execute).toHaveBeenCalled();
  });

  it('uses the issue date as the picker minimum when it is in the future', () => {
    fixture.componentInstance.form.controls.issuedAt.setValue(localDateDaysAgo(-10));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#certification-expires-at').getAttribute('min')).toBe(localDateDaysAgo(-10));
  });

  it('shows the API message when the API refuses the certification', () => {
    const message = 'Não é possível cadastrar uma certificação já vencida.';
    createCertification.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message } })));
    fixture.componentInstance.form.setValue(certification);
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe(message);
  });
});
