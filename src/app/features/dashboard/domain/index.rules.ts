import { STAGE_TYPES, STAGE_TYPE_LABELS } from '../../batches';
import { RecentBatch, StageShare } from './index.model';

/** Distribuição dos lotes por etapa, na ordem da cadeia, sem etapas vazias. */
export function stageDistribution(batches: RecentBatch[]): StageShare[] {
  return STAGE_TYPES.flatMap((stage) => {
    const count = batches.filter((batch) => batch.status === stage).length;
    return count > 0 ? [{ stage, count, percent: (count / batches.length) * 100 }] : [];
  });
}

/** Texto acessível da distribuição, ex.: "Produção: 2, Transporte: 1". */
export function describeDistribution(shares: StageShare[]): string {
  return shares.map((share) => `${STAGE_TYPE_LABELS[share.stage]}: ${share.count}`).join(', ');
}

export function greetingFor(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `Olá, ${trimmed}` : 'Bem-vindo(a)';
}
