import { RecentBatch } from './index.model';
import { describeDistribution, greetingFor, stageDistribution } from './index.rules';

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
});
