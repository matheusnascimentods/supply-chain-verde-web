import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SupplierReportsFacade } from '../../../application/report/index.facade';
import { SupplierReportsModalComponent } from './index.component';

describe('SupplierReportsModalComponent', () => {
  let fixture: ComponentFixture<SupplierReportsModalComponent>;
  let facade: Record<string, unknown> & { open: ReturnType<typeof vi.fn>; generate: ReturnType<typeof vi.fn> };
  let generated: number;

  beforeEach(() => {
    generated = 0;
    facade = {
      items: signal([{ reportId: 4, supplierId: 9, periodStartAt: '2026-01-01', periodEndAt: '2026-01-31', totalCo2Kg: 52.3, totalBatchCount: 7, generatedAt: '2026-02-01T10:00:00' }]),
      loading: signal(false),
      loadingError: signal(''),
      saving: signal(false),
      saveError: signal(''),
      success: signal(''),
      page: signal(0),
      totalPages: signal(1),
      open: vi.fn(),
      load: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      generate: vi.fn().mockReturnValue(of({})),
    };
    TestBed.overrideComponent(SupplierReportsModalComponent, { set: { providers: [{ provide: SupplierReportsFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(SupplierReportsModalComponent);
    fixture.componentRef.setInput('supplierId', 9);
    fixture.componentRef.setInput('supplierName', 'Fazenda Verde');
    fixture.componentRef.setInput('canGenerate', true);
    fixture.componentInstance.generated.subscribe(() => generated++);
    fixture.detectChanges();
  });

  it('opens the reports of the supplier and shows them formatted', () => {
    expect(facade.open).toHaveBeenCalledWith(9);
    const text = document.body.textContent ?? '';
    expect(text).toContain('01/01/2026 – 31/01/2026');
    expect(text).toContain('52,3 kg');
    expect(text).toContain('01/02/2026');
  });

  it('does not generate a report for an inverted period', () => {
    fixture.componentInstance.form.setValue({ startDate: '2026-02-01', endDate: '2026-01-01' });
    fixture.componentInstance.submit();
    expect(facade.generate).not.toHaveBeenCalled();
  });

  it('generates the report, resets the form and notifies the page', () => {
    fixture.componentInstance.form.setValue({ startDate: '2026-01-01', endDate: '2026-01-31' });
    fixture.componentInstance.submit();
    expect(facade.generate).toHaveBeenCalledWith({ periodStartAt: '2026-01-01', periodEndAt: '2026-01-31' });
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ startDate: '', endDate: '' });
    expect(generated).toBe(1);
  });
});
