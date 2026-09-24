import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../core/session/index.service';
import { LoginRequestDTO, LoginResponseDTO, loginResponseSchema } from './index.schema';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router, { optional: true });

  private readonly _isLoading = signal<boolean>(false);
  readonly isLoading = this._isLoading.asReadonly();

  readonly role = this.sessionService.role;
  readonly isAuthenticated = this.sessionService.isAuthenticated;

  login(credentials: LoginRequestDTO): Observable<LoginResponseDTO> {
    this._isLoading.set(true);

    return this.http.post<unknown>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      map((raw) => loginResponseSchema.parse(raw)),
      tap({
        next: (response) => {
          this._isLoading.set(false);
          this.sessionService.setSession(response.token, response.role);
        },
        error: () => {
          this._isLoading.set(false);
        },
      }),
    );
  }

  logout(): void {
    this.sessionService.clearSession();
    this.router?.navigate(['/login']);
  }
}
