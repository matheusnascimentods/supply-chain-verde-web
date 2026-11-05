import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyType, UserRole, parseCompanyType, parseUserRole } from './index.model';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const EMAIL_KEY = 'email';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly router = inject(Router, { optional: true });
  private readonly _role = signal<UserRole | null>(this.readInitialRole());
  private readonly _email = signal<string | null>(this.readInitialEmail());
  readonly role = this._role.asReadonly();
  readonly email = this._email.asReadonly();
  readonly isAuthenticated = computed(() => !!this._role() && !!this.token);

  setSession(token: string, role: UserRole, email?: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(ROLE_KEY, role);
      if (email) {
        sessionStorage.setItem(EMAIL_KEY, email);
      } else {
        sessionStorage.removeItem(EMAIL_KEY);
      }
    }
    this._role.set(role);
    this._email.set(email || null);
  }

  clearSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ROLE_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
    }
    this._role.set(null);
    this._email.set(null);
  }

  logout(): void {
    this.clearSession();
    this.router?.navigate(['/']);
  }

  get token(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  /** Fornecedor vinculado ao usuário (claim `supplierId` do token); nulo fora do role `supplier`. */
  supplierId(): number | null {
    return positiveId(this.claims()['supplierId']);
  }

  /** Companhia do usuário (claim `companyId`); nula para o `platform_admin`. */
  companyId(): number | null {
    return positiveId(this.claims()['companyId']);
  }

  /** Tipo da companhia (claim `companyType`, `MARKET` ou `SUPPLIER`); nulo para o `platform_admin`. */
  companyType(): CompanyType | null {
    return parseCompanyType(this.claims()['companyType']);
  }

  private claims(): Record<string, unknown> {
    const payload = this.token?.split('.')[1];
    if (!payload) return {};
    try {
      const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return claims && typeof claims === 'object' ? (claims as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  hasSession(): boolean {
    return !!this.token;
  }

  private readInitialRole(): UserRole | null {
    if (typeof sessionStorage !== 'undefined') {
      const storedRole = sessionStorage.getItem(ROLE_KEY);
      return parseUserRole(storedRole);
    }
    return null;
  }

  private readInitialEmail(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(EMAIL_KEY);
    }
    return null;
  }
}

function positiveId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
