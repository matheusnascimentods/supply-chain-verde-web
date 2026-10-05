import { formatCnpj, formatPhone, formatZipCode, digitsOnly } from './index.utils';

describe('supplier input formatters', () => {
  it('formats CNPJ while the user types and strips punctuation for requests', () => {
    expect(formatCnpj('12345678000190')).toBe('12.345.678/0001-90');
    expect(formatCnpj('12345678')).toBe('12.345.678');
    expect(digitsOnly('12.345.678/0001-90')).toBe('12345678000190');
  });

  it('formats landline and mobile phone numbers', () => {
    expect(formatPhone('1633332023')).toBe('(16) 3333-2023');
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(digitsOnly('(11) 98765-4321')).toBe('11987654321');
  });

  it('formats Brazilian postal codes and limits input to eight digits', () => {
    expect(formatZipCode('01000000')).toBe('01000-000');
    expect(formatZipCode('01000')).toBe('01000');
    expect(formatZipCode('010000001234')).toBe('01000-000');
  });
});
