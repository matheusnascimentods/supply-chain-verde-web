import { ENTITY_LABELS, FIELD_LABELS } from './index.labels';
import { AuditLog } from './index.model';

export function isValidPeriod(startDate: string, endDate: string): boolean {
  return !!startDate && !!endDate && startDate <= endDate;
}

export function userLabel(log: AuditLog): string {
  return log.userEmail ?? (log.userId ? `Usuário #${log.userId}` : 'Sistema');
}

/**
 * Resumo legível do que mudou, ex.: "Fornecedor #3 — Nome: Antigo → Novo; Telefone: 1199…".
 * Cadastro mostra só os valores novos e exclusão só os antigos.
 */
export function describeAuditLog(log: AuditLog): string {
  const entity = ENTITY_LABELS[log.affectedTable ?? ''] ?? 'Registro';
  const identity = log.affectedEntityId == null ? entity : `${entity} #${log.affectedEntityId}`;
  const before = log.beforeData ?? {};
  const after = log.afterData ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const changes = keys.flatMap((key) => {
    const hasBefore = Object.hasOwn(before, key);
    const hasAfter = Object.hasOwn(after, key);
    if (hasBefore && hasAfter && JSON.stringify(before[key]) === JSON.stringify(after[key])) return [];
    const field = fieldLabel(key);
    if (log.action === 'INSERT') return hasAfter ? [`${field}: ${valueLabel(after[key])}`] : [];
    if (log.action === 'DELETE') return hasBefore ? [`${field}: ${valueLabel(before[key])}`] : [];
    if (hasBefore && hasAfter) return [`${field}: ${valueLabel(before[key])} → ${valueLabel(after[key])}`];
    return [`${field}: ${valueLabel(hasAfter ? after[key] : before[key])}`];
  });
  const heading = log.action === 'INSERT' ? `${identity} cadastrado` : log.action === 'DELETE' ? `${identity} removido` : identity;
  if (changes.length) return `${heading} — ${changes.join('; ')}`;
  return log.affectedEntityId == null ? 'Detalhes indisponíveis' : heading;
}

function fieldLabel(field: string): string {
  const readable = field
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase());
  return FIELD_LABELS[field] ?? readable;
}

function valueLabel(value: unknown): string {
  if (value == null) return 'vazio';
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).join(', ');
  return String(value);
}
