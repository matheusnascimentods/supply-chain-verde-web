import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Credentials } from '../domain/index.model';
import { LoginResponseDTO, loginResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private readonly http = inject(HttpClient);

  login(credentials: Credentials): Observable<LoginResponseDTO> {
    return this.http
      .post<unknown>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(map((raw) => loginResponseSchema.parse(raw)));
  }
}
