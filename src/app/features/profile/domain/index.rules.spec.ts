import { CompanyForm } from './index.model';
import { accountPatch, accountsUsage, companyPatch, passwordChangeErrors } from './index.rules';

describe('profile rules', () => {
  const blank = { currentPassword: '', newPassword: '', confirmPassword: '' };

  it('validates the password change only when a new password is typed', () => {
    expect(passwordChangeErrors(blank)).toBeNull();
    expect(passwordChangeErrors({ ...blank, currentPassword: 'atual' })).toBeNull();
    expect(passwordChangeErrors({ ...blank, newPassword: 'nova', confirmPassword: 'outra' })).toEqual({ passwordMismatch: true });
    expect(passwordChangeErrors({ ...blank, confirmPassword: 'nova' })).toEqual({ passwordMismatch: true });
    expect(passwordChangeErrors({ ...blank, newPassword: 'nova', confirmPassword: 'nova' })).toEqual({ currentPasswordRequired: true });
    expect(passwordChangeErrors({ currentPassword: 'atual', newPassword: 'nova', confirmPassword: 'nova' })).toBeNull();
  });

  it('builds the account patch with only the changed fields', () => {
    expect(accountPatch('Ana', 'Ana', blank)).toEqual({});
    expect(accountPatch('Ana', 'Ana S.', blank)).toEqual({ userName: 'Ana S.' });
    expect(accountPatch('Ana', 'Ana', { currentPassword: 'atual', newPassword: 'nova', confirmPassword: 'nova' })).toEqual({
      currentPassword: 'atual',
      newPassword: 'nova',
    });
  });

  describe('companyPatch', () => {
    const company: CompanyForm = {
      name: 'Mercado Bom Preço',
      email: 'contato@bompreco.com',
      phone: '(11) 99999-0000',
      address: { street: 'Praça da Sé', number: '10', neighborhood: 'Sé', complement: '', zipCode: '01001-000', city: 'São Paulo', state: 'SP' },
    };

    it('is empty when nothing changed, ignoring masks', () => {
      expect(companyPatch(company, { ...company, phone: '11999990000' })).toEqual({});
    });

    it('sends only the changed fields, with digits only and the whole address', () => {
      const current = { ...company, email: 'novo@bompreco.com', address: { ...company.address, number: '12', state: 'sp' } };
      expect(companyPatch(company, current)).toEqual({
        email: 'novo@bompreco.com',
        address: { street: 'Praça da Sé', number: '12', neighborhood: 'Sé', complement: '', zipCode: '01001000', city: 'São Paulo', state: 'SP' },
      });
      expect(companyPatch(company, { ...company, name: 'Bom Preço LTDA', phone: '(11) 3333-4444' })).toEqual({
        name: 'Bom Preço LTDA',
        phone: '1133334444',
      });
    });
  });

  it('describes the plan usage', () => {
    expect(accountsUsage(2, 3)).toBe('2 de 3 contas');
    expect(accountsUsage(1, 1)).toBe('1 de 1 conta');
  });
});
