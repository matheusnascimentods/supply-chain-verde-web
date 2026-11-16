import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NewInvite } from '../../../domain/index.model';
import { UsersRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class SendInviteUseCase {
  private readonly repository = inject(UsersRepository);

  execute(invite: NewInvite): Observable<void> {
    return this.repository.invite(invite);
  }
}
