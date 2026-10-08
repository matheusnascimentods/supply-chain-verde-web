import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogFacade } from '../../../application/index.facade';
import { ExportAuditLogsUseCase } from '../../../application/use-cases/export-csv/index.use-case';
import { AuditLog } from '../../../domain/index.model';
import { AuditLogComponent } from './index.component';

describe('AuditLogComponent', () => {
  let fixture: ComponentFixture<AuditLogComponent>;
  const log: AuditLog = {
    logId: 1, userId: 2, userEmail: 'ana@example.com', action: 'DELETE', affectedTable: 'batch', affectedEntityId: 4,
    beforeData: { quantity: 10 }, afterData: null, performedAt: '2026-10-01T10:00:00',
  };

  function render(overrides: Record<string, unknown> = {}): HTMLElement {
    const facade = {
      startDate: signal('2026-10-01'),
      endDate: signal('2026-10-07'),
      action: signal(''),
      email: signal(''),
      logs: signal([log]),
      totalPages: signal(1),
      pageNumber: signal(1),
      loading: signal(false),
      error: signal(''),
      filterError: signal(''),
      filters: () => ({ startDate: '2026-10-01', endDate: '2026-10-07', action: '', email: '' }),
      load: vi.fn(),
      applyFilters: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      ...overrides,
    };
    TestBed.configureTestingModule({ providers: [{ provide: ExportAuditLogsUseCase, useValue: { execute: vi.fn() } }] });
    TestBed.overrideComponent(AuditLogComponent, { set: { providers: [{ provide: AuditLogFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(AuditLogComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders each record with user, action badge and description', () => {
    const row = render().querySelector('tbody tr') as HTMLElement;
    expect(row.textContent).toContain('ana@example.com');
    expect(row.textContent).toContain('ID 2');
    expect(row.querySelector('.audit-action')?.getAttribute('data-action')).toBe('DELETE');
    expect(row.textContent).toContain('Exclusão');
    expect(row.textContent).toContain('Lote #4 removido — Quantidade: 10');
  });

  it('opens the export modal with the current filters', () => {
    render();
    fixture.componentInstance.exportOpen.set(true);
    fixture.detectChanges();
    expect(document.body.querySelector('app-audit-export-modal')).not.toBeNull();
  });

  it('shows the error with a retry action', () => {
    const load = vi.fn();
    const page = render({ error: signal('Não foi possível carregar os registros de auditoria.'), load });
    page.querySelector<HTMLButtonElement>('.audit-retry')!.click();
    expect(load).toHaveBeenCalled();
  });
});
