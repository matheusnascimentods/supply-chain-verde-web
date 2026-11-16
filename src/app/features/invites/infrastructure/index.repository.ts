import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { InviteAcceptance, InviteDetails } from '../domain/index.model';
import { AcceptResponseDTO, acceptResponseSchema, inviteDetailsSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class InvitesRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/invites`;

  find(token: string): Observable<InviteDetails> {
    return this.http
      .get<unknown>(`${this.base}/${encodeURIComponent(token)}`)
      .pipe(map((response) => inviteDetailsSchema.parse(response)));
  }

  // O token vai no corpo para não ficar nos logs de acesso.
  accept(acceptance: InviteAcceptance): Observable<AcceptResponseDTO> {
    return this.http
      .post<unknown>(`${this.base}/accept`, acceptance)
      .pipe(map((response) => acceptResponseSchema.parse(response)));
  }
}
