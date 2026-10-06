import { Injectable, computed, signal } from '@angular/core';
import { UserRole, parseUserRole } from './index.model';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const EMAIL_KEY = 'email';

@Injectable({ providedIn: 'root' })
export class SessionService {
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

  private readInitialEmail(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(EMAIL_KEY);
    }
    return null;
  }
}
