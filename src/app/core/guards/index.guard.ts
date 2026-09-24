import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { SessionService } from '../session/index.service';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.hasSession()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.hasSession()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as string[] | readonly string[] | undefined;
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const currentRole = session.role();
  if (!currentRole) {
    return router.createUrlTree(['/login']);
  }

  const isAuthorized = allowedRoles.some(
    (role) => role.toLowerCase() === currentRole.toLowerCase()
  );

  if (isAuthorized) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
