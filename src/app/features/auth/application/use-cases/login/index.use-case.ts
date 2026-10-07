import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { Credentials } from '../../../domain/index.model';
import { LoginResponseDTO } from '../../../infrastructure/index.dto';
import { AuthRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly repository = inject(AuthRepository);
  private readonly session = inject(SessionService);

  execute(credentials: Credentials): Observable<LoginResponseDTO> {
    return this.repository
      .login(credentials)
      .pipe(tap((response) => this.session.setSession(response.token, response.role, credentials.email)));
  }
}
