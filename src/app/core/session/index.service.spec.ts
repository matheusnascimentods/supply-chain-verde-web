import { TestBed } from '@angular/core/testing';
import { SessionService } from './index.service';
import { UserRole, userRoleSchema, parseUserRole } from './index.schema';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('schema and parser', () => {
    it('should validate valid user roles', () => {
      expect(userRoleSchema.parse('admin')).toBe('admin');
      expect(userRoleSchema.parse('manager')).toBe('manager');
      expect(userRoleSchema.parse('auditor')).toBe('auditor');
      expect(userRoleSchema.parse('supplier')).toBe('supplier');
    });

    it('should fail on invalid role', () => {
      expect(() => userRoleSchema.parse('guest')).toThrow();
    });

    it('should parse case-insensitively using parseUserRole', () => {
      expect(parseUserRole('ADMIN')).toBe('admin');
      expect(parseUserRole('Manager')).toBe('manager');
      expect(parseUserRole('invalid')).toBeNull();
      expect(parseUserRole(null)).toBeNull();
    });
  });

  describe('service operations', () => {
    it('should initialize with null token and null role when storage is empty', () => {
      expect(service.token).toBeNull();
      expect(service.role()).toBeNull();
      expect(service.hasSession()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should store token and role in sessionStorage and update signals on setSession', () => {
      service.setSession('sample-jwt-token', 'admin');

      expect(sessionStorage.getItem('token')).toBe('sample-jwt-token');
      expect(sessionStorage.getItem('role')).toBe('admin');
      expect(service.token).toBe('sample-jwt-token');
      expect(service.role()).toBe('admin');
      expect(service.hasSession()).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should clear sessionStorage and reset role signal on clearSession', () => {
      service.setSession('sample-jwt-token', 'manager');
      expect(service.hasSession()).toBe(true);

      service.clearSession();

      expect(sessionStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('role')).toBeNull();
      expect(service.token).toBeNull();
      expect(service.role()).toBeNull();
      expect(service.hasSession()).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should restore role from sessionStorage upon instantiation', () => {
      sessionStorage.setItem('token', 'restored-token');
      sessionStorage.setItem('role', 'supplier');

      TestBed.resetTestingModule();
      const newService = TestBed.inject(SessionService);

      expect(newService.token).toBe('restored-token');
      expect(newService.role()).toBe('supplier');
      expect(newService.hasSession()).toBe(true);
      expect(newService.isAuthenticated()).toBe(true);
    });
  });
});
