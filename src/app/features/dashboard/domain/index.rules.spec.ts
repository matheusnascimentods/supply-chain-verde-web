import { RecentBatch } from './index.model';
import { defaultRange, describeDistribution, greetingFor, periodVariation, rangeProblem, stageDistribution } from './index.rules';

describe('dashboard rules', () => {
  const batch = (status: RecentBatch['status']) => ({ status }) as RecentBatch;

  it('distributes the batches by stage in chain order, skipping empty stages', () => {
    const shares = stageDistribution([batch('TRANSPORT'), batch('PRODUCTION'), batch('TRANSPORT'), batch('RETAIL')]);
    expect(shares).toEqual([
      { stage: 'PRODUCTION', count: 1, percent: 25 },
      { stage: 'TRANSPORT', count: 2, percent: 50 },
      { stage: 'RETAIL', count: 1, percent: 25 },
    ]);
    expect(stageDistribution([])).toEqual([]);
  });

  it('describes the distribution for screen readers', () => {
    expect(describeDistribution(stageDistribution([batch('PRODUCTION'), batch('PRODUCTION'), batch('TRANSPORT')]))).toBe('Produção: 2, Transporte: 1');
  });

  it('greets by name or with a neutral welcome', () => {
    expect(greetingFor(' Maria ')).toBe('Olá, Maria');
    expect(greetingFor('  ')).toBe('Bem-vindo(a)');
  });

  it('defaults to the last 12 months including the current one', () => {
    expect(defaultRange(new Date(2026, 9, 14))).toEqual({ from: '2025-11', to: '2026-10' });
    expect(defaultRange(new Date(2026, 0, 5))).toEqual({ from: '2025-02', to: '2026-01' });
  });

  it('validates format, order and the 24-month limit of the range', () => {
    expect(rangeProblem({ from: '2026-01', to: '2026-01' })).toBeNull();
    expect(rangeProblem({ from: '2024-11', to: '2026-10' })).toBeNull();
    expect(rangeProblem({ from: '2024-10', to: '2026-10' })).toBe('tooLong');
    expect(rangeProblem({ from: '2026-02', to: '2026-01' })).toBe('order');
    expect(rangeProblem({ from: '', to: '2026-01' })).toBe('invalid');
    expect(rangeProblem({ from: 'jan 2026', to: '2026-01' })).toBe('invalid');
    expect(rangeProblem({ from: '2026-13', to: '2026-12' })).toBe('invalid');
  });

  it('measures the variation between the first and last months with emissions', () => {
    const series = [
      { month: '2026-01', co2Kg: 0 },
      { month: '2026-02', co2Kg: 1000 },
      { month: '2026-03', co2Kg: 500 },
      { month: '2026-04', co2Kg: 696 },
      { month: '2026-05', co2Kg: 0 },
    ];
    expect(periodVariation(series)).toBeCloseTo(-30.4);
    expect(periodVariation([{ month: '2026-01', co2Kg: 10 }, { month: '2026-02', co2Kg: 0 }])).toBeNull();
    expect(periodVariation([])).toBeNull();
  });
});
