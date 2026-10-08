import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ExportAuditLogsUseCase } from '../../../application/use-cases/export-csv/index.use-case';
import { AuditExportModalComponent } from './index.component';

describe('AuditExportModalComponent', () => {
  let fixture: ComponentFixture<AuditExportModalComponent>;
  let exportLogs: { execute: ReturnType<typeof vi.fn> };
  const filters = { startDate: '2026-10-01', endDate: '2026-10-07', action: 'UPDATE' as const, email: 'ana@' };

  beforeEach(() => {
    exportLogs = { execute: vi.fn().mockReturnValue(of({ filename: 'audit-logs-2026-10-01-2026-10-07.csv', content: 'a,b' })) };
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [{ provide: ExportAuditLogsUseCase, useValue: exportLogs }] });
    fixture = TestBed.createComponent(AuditExportModalComponent);
    fixture.componentRef.setInput('initialFilters', filters);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts from the filters of the page and prepares the file', () => {
    (document.body.querySelector('[role="dialog"] button[type="submit"]') as HTMLButtonElement).click();
    expect(exportLogs.execute).toHaveBeenCalledWith(filters);
    expect(fixture.componentInstance.fileUrl()).toBe('blob:csv');
    expect(fixture.componentInstance.filename()).toBe('audit-logs-2026-10-01-2026-10-07.csv');
  });

  it('validates the period before exporting', () => {
    fixture.componentInstance.startDate.set('2026-10-09');
    fixture.componentInstance.prepare();
    expect(exportLogs.execute).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBe('Informe um intervalo de datas válido.');
  });

  it('shows an error when the export fails', () => {
    exportLogs.execute.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.prepare();
    expect(fixture.componentInstance.error()).toBe('Falha ao buscar os registros para exportação. Tente novamente.');
    expect(fixture.componentInstance.exporting()).toBe(false);
  });

  it('releases the prepared file when it is discarded or the modal closes', () => {
    fixture.componentInstance.prepare();
    fixture.componentInstance.discardFile();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:csv');
    fixture.componentInstance.prepare();
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
