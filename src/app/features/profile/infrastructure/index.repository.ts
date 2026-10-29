import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CurrentUserDTO, currentUserResponseSchema } from '../../../core/auth/session/current-user/index.dto';
import { AccountPatch } from '../domain/index.model';

@Injectable({ providedIn: 'root' })
export class ProfileRepository {
  private readonly http = inject(HttpClient);

  updateMe(patch: AccountPatch): Observable<CurrentUserDTO> {
    return this.http
      .patch<unknown>(`${environment.apiUrl}/users/me`, patch)
      .pipe(map((raw) => currentUserResponseSchema.parse(raw)));
  }
}
