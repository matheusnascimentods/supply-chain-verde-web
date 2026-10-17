import { STAGE_TYPES, nextStage } from './index.model';

describe('nextStage', () => {
  it('starts a batch without stages at production', () => {
    expect(nextStage(null)).toBe('PRODUCTION');
  });

  it('follows the chain order and ends after retail', () => {
    expect(STAGE_TYPES.map(nextStage)).toEqual(['STORAGE', 'PROCESSING', 'TRANSPORT', 'DISTRIBUTION', 'RETAIL', null]);
  });
});
