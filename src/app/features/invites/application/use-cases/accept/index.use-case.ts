import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { InviteAcceptance } from '../../../domain/index.model';
import { AcceptResponseDTO } from '../../../infrastructure/index.dto';
import { InvitesRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class AcceptInviteUseCase {
  private readonly repository = inject(InvitesRepository);
  private readonly session = inject(SessionService);

  // O aceite devolve o mesmo que o login: o convidado já entra logado (RF-09).
  execute(acceptance: InviteAcceptance, email: string): Observable<AcceptResponseDTO> {
    return this.repository
      .accept(acceptance)
      .pipe(tap((response) => this.session.setSession(response.token, response.role, email)));
  }
}
