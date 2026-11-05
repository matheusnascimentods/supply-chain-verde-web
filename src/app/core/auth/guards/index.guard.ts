import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { CompanyType } from '../session/index.model';
import { SessionService } from '../session/index.service';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.hasSession()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.hasSession()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.hasSession()) {
    return router.createUrlTree(['/login']);
  }

  const currentRole = session.role();
  if (!currentRole) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = (route.data?.['roles'] ?? []) as readonly string[];
  const roleAllowed = allowedRoles.length === 0 || allowedRoles.some((role) => role.toLowerCase() === currentRole);

  // `data.companyTypes` restringe pelo tipo da companhia; o platform_admin não tem companhia e sempre passa.
  const companyTypes = (route.data?.['companyTypes'] ?? []) as readonly CompanyType[];
  const companyTypeAllowed =
    companyTypes.length === 0 || currentRole === 'platform_admin' || companyTypes.some((type) => type === session.companyType());

  return roleAllowed && companyTypeAllowed ? true : router.createUrlTree(['/dashboard']);
};
