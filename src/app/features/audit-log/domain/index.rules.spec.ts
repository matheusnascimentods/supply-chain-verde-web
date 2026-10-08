import { AuditLog } from './index.model';
import { describeAuditLog, isValidPeriod, userLabel } from './index.rules';

describe('audit log rules', () => {
  const log = (partial: Partial<AuditLog>): AuditLog => ({ logId: 1, action: 'UPDATE', performedAt: '2026-10-01T10:00:00', ...partial });

  it('validates the period', () => {
    expect(isValidPeriod('2026-10-01', '2026-10-07')).toBe(true);
    expect(isValidPeriod('2026-10-07', '2026-10-07')).toBe(true);
    expect(isValidPeriod('2026-10-08', '2026-10-07')).toBe(false);
    expect(isValidPeriod('', '2026-10-07')).toBe(false);
  });

  it('identifies who performed the action', () => {
    expect(userLabel(log({ userEmail: 'ana@example.com', userId: 2 }))).toBe('ana@example.com');
    expect(userLabel(log({ userId: 2 }))).toBe('Usuário #2');
    expect(userLabel(log({}))).toBe('Sistema');
  });

  it('describes only the fields that changed in an update', () => {
    const description = describeAuditLog(log({
      affectedTable: 'suppliers',
      affectedEntityId: 3,
      beforeData: { name: 'Antigo', phone: '1', issuing_body: 'ABNT' },
      afterData: { name: 'Novo', phone: '1', issuing_body: 'INMETRO', customField: 'x' },
    }));
    expect(description).toBe('Fornecedor #3 — Nome: Antigo → Novo; Órgão emissor: ABNT → INMETRO; Custom Field: x');
  });

  it('describes created and removed records', () => {
    expect(describeAuditLog(log({ action: 'INSERT', affectedTable: 'products', affectedEntityId: 9, afterData: { name: 'Café', description: null } })))
      .toBe('Produto #9 cadastrado — Nome: Café; Descrição: vazio');
    expect(describeAuditLog(log({ action: 'DELETE', affectedTable: 'batch', affectedEntityId: 4, beforeData: { quantity: 10 } })))
      .toBe('Lote #4 removido — Quantidade: 10');
  });

  it('falls back when there is nothing to describe', () => {
    expect(describeAuditLog(log({}))).toBe('Detalhes indisponíveis');
    expect(describeAuditLog(log({ affectedTable: 'unknown_table', affectedEntityId: 5 }))).toBe('Registro #5');
  });
});
