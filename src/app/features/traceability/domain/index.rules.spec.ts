import { isValidBatchCode, placeOf } from './index.rules';

describe('traceability rules', () => {
  it('accepts only numeric batch codes', () => {
    expect(isValidBatchCode('42')).toBe(true);
    expect(isValidBatchCode('42a')).toBe(false);
    expect(isValidBatchCode('')).toBe(false);
    expect(isValidBatchCode(null)).toBe(false);
  });

  it('describes the place of an address with the parts it has', () => {
    expect(placeOf({ addressId: 1, city: 'Campinas', state: 'SP' })).toBe('Campinas, SP');
    expect(placeOf({ addressId: 1, city: null, state: 'SP' })).toBe('SP');
    expect(placeOf({ addressId: 1, city: null, state: null })).toBe('');
    expect(placeOf(null)).toBe('');
  });
});
