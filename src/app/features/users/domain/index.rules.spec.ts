import { newUserSchema } from './index.model';
import { canChangeRoles, canCreateUsers, creatableRoles } from './index.rules';

describe('users rules', () => {
  it('lets only company administrators create users', () => {
    expect(canCreateUsers('admin')).toBe(true);
    expect(canCreateUsers('platform_admin')).toBe(false);
    expect(canCreateUsers('manager')).toBe(false);
    expect(canCreateUsers('auditor')).toBe(false);
    expect(canCreateUsers('supplier')).toBe(false);
    expect(canCreateUsers(null)).toBe(false);
  });

  it('lets administrators and the platform admin change roles', () => {
    expect(canChangeRoles('admin')).toBe(true);
    expect(canChangeRoles('platform_admin')).toBe(true);
    expect(canChangeRoles('manager')).toBe(false);
    expect(canChangeRoles(null)).toBe(false);
  });

  it('offers only the roles of the company type', () => {
    expect(creatableRoles('market')).toEqual(['admin', 'manager', 'auditor']);
    expect(creatableRoles('supplier')).toEqual(['admin', 'supplier']);
    expect(creatableRoles(null)).toEqual([]);
  });

  it('creates users without a supplier link', () => {
    const user = { name: 'Ana', email: 'ana@example.com', password: 'secret', role: 'supplier' };
    expect(newUserSchema.parse({ ...user, supplierId: 7 })).toEqual(user);
  });
});
