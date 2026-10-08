import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { AuditLog, AuditLogFilters } from '../../../domain/index.model';
import { describeAuditLog } from '../../../domain/index.rules';
import { AuditLogRepository } from '../../../infrastructure/index.repository';

// Maior página aceita pela API: menos requisições para montar o arquivo.
const EXPORT_PAGE_SIZE = 100;
const COLUMNS = ['Email do usuário', 'Operação', 'Data e hora', 'Tabela afetada', 'Detalhes'];

export interface AuditLogCsv {
  filename: string;
  content: string;
}

export function toCsv(logs: AuditLog[]): string {
  const rows = logs.map((log) => [log.userEmail ?? '', log.action, log.performedAt, log.affectedTable ?? '', describeAuditLog(log)]);
  return [COLUMNS, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Busca todas as páginas do período e monta o CSV da auditoria. */
@Injectable({ providedIn: 'root' })
export class ExportAuditLogsUseCase {
  private readonly repository = inject(AuditLogRepository);

  execute(filters: AuditLogFilters): Observable<AuditLogCsv> {
    const page = (offset: number) => this.repository.load(filters, { limit: EXPORT_PAGE_SIZE, offset });
    return page(0).pipe(
      expand((result, index) => (result.hasNext ? page((index + 1) * EXPORT_PAGE_SIZE) : EMPTY)),
      reduce((logs, result) => [...logs, ...result.items], [] as AuditLog[]),
      map((logs) => ({ filename: `audit-logs-${filters.startDate}-${filters.endDate}.csv`, content: toCsv(logs) })),
    );
  }
}
