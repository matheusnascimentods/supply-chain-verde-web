import { localDateDaysAgo, localDateTimeNow } from './index.utils';

describe('localDateTimeNow', () => {
  it('formats the local wall-clock time without timezone', () => {
    expect(localDateTimeNow(new Date(2026, 10, 25, 9, 5, 7))).toBe('2026-11-25T09:05:07');
  });
});

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
