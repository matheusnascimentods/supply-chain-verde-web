import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CurrentUserDTO, currentUserResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly http = inject(HttpClient);

  load(): Observable<CurrentUserDTO> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/users/me`)
      .pipe(map((raw) => currentUserResponseSchema.parse(raw)));
  }
}
