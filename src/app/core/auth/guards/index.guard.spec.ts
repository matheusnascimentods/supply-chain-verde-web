import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, roleGuard } from './index.guard';
import { SessionService } from '../session/index.service';
import { routes as appRoutes } from '../../../app.routes';
import { routes as supplierRoutes } from '../../../features/suppliers/index.routes';

describe('Guards', () => {
  let sessionService: SessionService;
  let router: Router;

  const mockRouteSnapshot = (data: Record<string, unknown> = {}): ActivatedRouteSnapshot => {
    return { data } as unknown as ActivatedRouteSnapshot;
  };

  const mockRouterStateSnapshot = (): RouterStateSnapshot => {
    return { url: '/test' } as RouterStateSnapshot;
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        SessionService,
      ],
    });

    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('authGuard', () => {
    it('should allow activation when user has active session', () => {
      sessionService.setSession('test-token', 'admin');

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRouteSnapshot(), mockRouterStateSnapshot())
      );

      expect(result).toBe(true);
    });

    it('should redirect to /login when user has no active session', () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRouteSnapshot(), mockRouterStateSnapshot())
      );

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/login');
    });
  });

  describe('roleGuard', () => {
    it('should redirect to /login when user has no active session', () => {
      const route = mockRouteSnapshot({ roles: ['admin'] });

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(route, mockRouterStateSnapshot())
      );

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/login');
    });

    it('should allow access if route does not specify any roles', () => {
      sessionService.setSession('test-token', 'supplier');
      const route = mockRouteSnapshot();

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(route, mockRouterStateSnapshot())
      );

      expect(result).toBe(true);
    });

    it('should allow access if route has empty roles array', () => {
      sessionService.setSession('test-token', 'supplier');
      const route = mockRouteSnapshot({ roles: [] });

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(route, mockRouterStateSnapshot())
      );

      expect(result).toBe(true);
    });

    it('should allow access when user role matches allowed roles', () => {
      sessionService.setSession('test-token', 'manager');
      const route = mockRouteSnapshot({ roles: ['admin', 'manager'] });

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(route, mockRouterStateSnapshot())
      );

      expect(result).toBe(true);
    });

    it('should allow access case-insensitively', () => {
      sessionService.setSession('test-token', 'admin');
      const route = mockRouteSnapshot({ roles: ['ADMIN'] });

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(route, mockRouterStateSnapshot())
      );

      expect(result).toBe(true);
    });

    it('should redirect to /dashboard when user role is not authorized', () => {
      sessionService.setSession('test-token', 'supplier');
      const route = mockRouteSnapshot({ roles: ['admin', 'manager'] });

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(route, mockRouterStateSnapshot())
      );

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/dashboard');
    });

    it('should redirect to /login when session has token but role is null', () => {
      // Simulate token without valid role
      sessionStorage.setItem('token', 'token-without-role');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideRouter([]), SessionService],
      });
      const sService = TestBed.inject(SessionService);

      const route = mockRouteSnapshot({ roles: ['admin'] });

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(route, mockRouterStateSnapshot())
      );

      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/login');
    });
  });

  describe('user and supplier routes', () => {
    const shellRoutes = appRoutes.find((route) => route.children)!.children!;
    const usersRoute = shellRoutes.find((route) => route.path === 'users')!;
    const newSupplierRoute = supplierRoutes.find((route) => route.path === 'new')!;

    it.each([
      ['manager', true],
      ['admin', true],
      ['auditor', false],
      ['supplier', false],
    ] as const)('lets %s into /users and /suppliers/new: %s', (role, allowed) => {
      sessionService.setSession('test-token', role);
      for (const route of [usersRoute, newSupplierRoute]) {
        const result = TestBed.runInInjectionContext(() => roleGuard(mockRouteSnapshot(route.data), mockRouterStateSnapshot()));
        expect(result === true).toBe(allowed);
      }
    });
  });
});
