import { newInviteSchema } from './index.model';
import { canChangeRoles, canCreateUsers, canToggleStatus, creatableRoles, seatsFull, seatsUsage } from './index.rules';

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

  it('lets who changes roles toggle the status, except on the own row and on users without company', () => {
    const ana = { userId: 1, name: 'Ana', email: 'ana@example.com', role: 'manager' as const, active: true, companyType: 'market' as const };
    expect(canToggleStatus('admin', 'boss@example.com', ana)).toBe(true);
    expect(canToggleStatus('platform_admin', 'root@example.com', ana)).toBe(true);
    expect(canToggleStatus('admin', 'ana@example.com', ana)).toBe(false);
    expect(canToggleStatus('manager', 'boss@example.com', ana)).toBe(false);
    expect(canToggleStatus('platform_admin', 'root@example.com', { ...ana, companyType: null })).toBe(false);
  });

  it('offers only the roles of the company type', () => {
    expect(creatableRoles('market')).toEqual(['admin', 'manager', 'auditor']);
    expect(creatableRoles('supplier')).toEqual(['admin', 'supplier']);
    expect(creatableRoles(null)).toEqual([]);
  });

  it('describes the seats usage and tells when they are full', () => {
    expect(seatsUsage({ used: 8, max: 10 })).toBe('8 de 10 assentos em uso');
    expect(seatsFull({ used: 9, max: 10 })).toBe(false);
    expect(seatsFull({ used: 10, max: 10 })).toBe(true);
    expect(seatsFull(null)).toBe(false);
  });

  it('invites with only the e-mail and the role', () => {
    const invite = { email: 'ana@example.com', role: 'supplier' };
    expect(newInviteSchema.parse({ ...invite, name: 'Ana', password: 'secret', supplierId: 7 })).toEqual(invite);
  });
});
