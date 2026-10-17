import { localDateDaysAgo } from './index.utils';

describe('localDateDaysAgo', () => {
  it('computes local dates relative to today', () => {
    expect(localDateDaysAgo(6, new Date(2026, 9, 7, 23, 30))).toBe('2026-10-01');
    expect(localDateDaysAgo(0, new Date(2026, 0, 1, 0, 15))).toBe('2026-01-01');
  });

  it('returns the local date of today when no reference is given', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(localDateDaysAgo(0)).toBe(expected);
  });
});
