import { accountPatch, passwordChangeErrors } from './index.rules';

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
});
