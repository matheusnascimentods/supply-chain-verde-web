import { canManageUsers } from './index.rules';

describe('canManageUsers', () => {
  it('allows only administrators to manage users', () => {
    expect(canManageUsers('admin')).toBe(true);
    expect(canManageUsers('manager')).toBe(false);
    expect(canManageUsers('auditor')).toBe(false);
    expect(canManageUsers('supplier')).toBe(false);
    expect(canManageUsers(null)).toBe(false);
  });
});
