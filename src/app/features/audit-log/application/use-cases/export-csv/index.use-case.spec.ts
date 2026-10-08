import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuditLog } from '../../../domain/index.model';
import { AuditLogRepository } from '../../../infrastructure/index.repository';
import { ExportAuditLogsUseCase, toCsv } from './index.use-case';

describe('ExportAuditLogsUseCase', () => {
  const filters = { startDate: '2026-10-01', endDate: '2026-10-07', action: '' as const, email: '' };
  const log = (logId: number): AuditLog => ({ logId, userEmail: 'ana@example.com', action: 'UPDATE', affectedTable: 'suppliers', affectedEntityId: logId, beforeData: { name: 'A' }, afterData: { name: 'B "novo"' }, performedAt: '2026-10-01T10:00:00' });

  it('quotes every cell and escapes double quotes', () => {
    expect(toCsv([log(3)]).split('\r\n')).toEqual([
      '"Email do usuário","Operação","Data e hora","Tabela afetada","Detalhes"',
      '"ana@example.com","UPDATE","2026-10-01T10:00:00","suppliers","Fornecedor #3 — Nome: A → B ""novo"""',
    ]);
  });

  it('loads every page of the period before building the file', () => {
    const repository = {
      load: vi.fn()
        .mockReturnValueOnce(of({ items: [log(1)], hasNext: true, totalPages: 2 }))
        .mockReturnValueOnce(of({ items: [log(2)], hasNext: false, totalPages: 2 })),
    };
    TestBed.configureTestingModule({ providers: [{ provide: AuditLogRepository, useValue: repository }] });
    let csv: { filename: string; content: string } | undefined;

    TestBed.inject(ExportAuditLogsUseCase).execute(filters).subscribe((result) => (csv = result));

    expect(repository.load).toHaveBeenNthCalledWith(1, filters, { limit: 100, offset: 0 });
    expect(repository.load).toHaveBeenNthCalledWith(2, filters, { limit: 100, offset: 100 });
    expect(csv?.filename).toBe('audit-logs-2026-10-01-2026-10-07.csv');
    expect(csv?.content.split('\r\n')).toHaveLength(3);
  });
});
