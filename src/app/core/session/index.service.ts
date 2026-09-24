import { Injectable, computed, signal } from '@angular/core';
import { UserRole, parseUserRole } from './index.schema';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _role = signal<UserRole | null>(this.readInitialRole());
  readonly role = this._role.asReadonly();
  readonly isAuthenticated = computed(() => !!this._role() && !!this.token);

  setSession(token: string, role: UserRole): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(ROLE_KEY, role);
    }
    this._role.set(role);
  }

  clearSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ROLE_KEY);
    }
    this._role.set(null);
  }

  get token(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY);
    }
    return null;
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
}
