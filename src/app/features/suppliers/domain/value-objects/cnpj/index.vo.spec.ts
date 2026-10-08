import { displayCnpj } from './index.vo';

describe('displayCnpj', () => {
  it('formats a 14-digit CNPJ', () => {
    expect(displayCnpj('12345678000190')).toBe('12.345.678/0001-90');
    expect(displayCnpj('12.345.678/0001-90')).toBe('12.345.678/0001-90');
  });

  it('shows a dash when missing and keeps incomplete values as they are', () => {
    expect(displayCnpj(null)).toBe('—');
    expect(displayCnpj('123')).toBe('123');
  });
});
