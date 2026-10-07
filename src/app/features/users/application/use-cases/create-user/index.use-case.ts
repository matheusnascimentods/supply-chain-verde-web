import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NewUser, User } from '../../../domain/index.model';
import { UsersRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class CreateUserUseCase {
  private readonly repository = inject(UsersRepository);

  execute(user: NewUser): Observable<User> {
    return this.repository.create(user);
  }
}
