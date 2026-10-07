import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateCertificationUseCase } from '../../../application/use-cases/create-certification/index.use-case';
import { CertificationFormComponent } from './index.component';

describe('CertificationFormComponent', () => {
  let fixture: ComponentFixture<CertificationFormComponent>;
  let createCertification: { execute: ReturnType<typeof vi.fn> };
  let saved: number;
  const certification = { certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: '2026-01-10', expiresAt: '2027-01-10' };

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
});
