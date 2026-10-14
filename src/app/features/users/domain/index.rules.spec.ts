import { USER_ROLES } from '../../../core/auth/session/index.model';
import { newUserSchema } from './index.model';
import { canChangeRoles, canManageUsers, creatableRoles } from './index.rules';

describe('users rules', () => {
  it('lets administrators and managers manage users', () => {
    expect(canManageUsers('admin')).toBe(true);
    expect(canManageUsers('manager')).toBe(true);
    expect(canManageUsers('auditor')).toBe(false);
    expect(canManageUsers('supplier')).toBe(false);
    expect(canManageUsers(null)).toBe(false);
  });

  it('lets only administrators change roles', () => {
    expect(canChangeRoles('admin')).toBe(true);
    expect(canChangeRoles('manager')).toBe(false);
    expect(canChangeRoles(null)).toBe(false);
  });

  it('limits managers to creating supplier users', () => {
    expect(creatableRoles('admin')).toEqual(USER_ROLES);
    expect(creatableRoles('manager')).toEqual(['supplier']);
    expect(creatableRoles('auditor')).toEqual([]);
  });

  it('requires a supplier only for supplier users', () => {
    const user = { name: 'Ana', email: 'ana@example.com', password: 'secret' };
    expect(newUserSchema.safeParse({ ...user, role: 'supplier', supplierId: null }).success).toBe(false);
    expect(newUserSchema.parse({ ...user, role: 'supplier', supplierId: 7 })).toEqual({ ...user, role: 'supplier', supplierId: 7 });
    expect(newUserSchema.parse({ ...user, role: 'manager', supplierId: 7 })).toEqual({ ...user, role: 'manager' });
  });
});
