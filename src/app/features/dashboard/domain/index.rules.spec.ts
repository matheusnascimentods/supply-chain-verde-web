import { RecentBatch } from './index.model';
import { defaultRange, describeDistribution, greetingFor, monthLabel, periodVariation, stageDistribution, validateRange } from './index.rules';

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

  it('validates order and the 24-month limit of the range', () => {
    expect(validateRange({ from: '2026-01', to: '2026-01' })).toBe('');
    expect(validateRange({ from: '2024-11', to: '2026-10' })).toBe('');
    expect(validateRange({ from: '2024-10', to: '2026-10' })).toBe('Escolha um intervalo de até 24 meses.');
    expect(validateRange({ from: '2026-02', to: '2026-01' })).toBe('O mês inicial deve ser anterior ou igual ao final.');
    expect(validateRange({ from: '', to: '2026-01' })).toBe('Informe o mês inicial e o final.');
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

  it('labels months in Portuguese', () => {
    expect(monthLabel('2026-01')).toBe('jan/2026');
    expect(monthLabel('2025-12')).toBe('dez/2025');
  });
});
