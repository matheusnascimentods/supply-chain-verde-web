import { STAGE_TYPES, STAGE_TYPE_LABELS } from '../../batches';
import { MAX_RANGE_MONTHS, MONTH_PATTERN, MonthRange, MonthlyEmission, RangeProblem, RecentBatch, StageShare } from './index.model';

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

// Meses contados a partir do ano zero, para comparar e subtrair `YYYY-MM`.
function monthIndex(month: string): number {
  const [year, value] = month.split('-').map(Number);
  return year * 12 + value - 1;
}

function toMonth(index: number): string {
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** Últimos 12 meses, incluindo o atual. */
export function defaultRange(today: Date): MonthRange {
  const current = today.getFullYear() * 12 + today.getMonth();
  return { from: toMonth(current - 11), to: toMonth(current) };
}

/** Problema do intervalo, ou nulo quando ele pode ir para a API. */
export function rangeProblem(range: MonthRange): RangeProblem | null {
  // Sem suporte a `type="month"`, o navegador cai para texto livre.
  if (!MONTH_PATTERN.test(range.from) || !MONTH_PATTERN.test(range.to)) return 'invalid';
  const months = monthIndex(range.to) - monthIndex(range.from) + 1;
  if (months < 1) return 'order';
  return months > MAX_RANGE_MONTHS ? 'tooLong' : null;
}

/** Soma das emissões do período. */
export function periodTotal(series: MonthlyEmission[]): number {
  return series.reduce((total, item) => total + item.co2Kg, 0);
}

/** Variação (%) entre o primeiro e o último mês com emissão; nula sem dois meses para comparar. */
export function periodVariation(series: MonthlyEmission[]): number | null {
  const withEmission = series.filter((item) => item.co2Kg > 0);
  if (withEmission.length < 2) return null;
  const first = withEmission[0].co2Kg;
  return ((withEmission[withEmission.length - 1].co2Kg - first) / first) * 100;
}
