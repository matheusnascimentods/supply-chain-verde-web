import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRole } from '../../../../../core/auth/session/index.model';
import { User } from '../../../domain/index.model';
import { UsersRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class UpdateUserRoleUseCase {
  private readonly repository = inject(UsersRepository);

  execute(user: User, role: UserRole): Observable<User> {
    return this.repository.updateRole(user.userId, role);
  }
}
