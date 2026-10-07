import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../core/auth/session/index.model';
import { NewUser, User, UserPage } from '../domain/index.model';
import { userPageSchema, userResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class UsersRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  load(params: { limit: number; offset: number; email?: string }): Observable<UserPage> {
    const email = params.email?.trim();
    const query = { limit: String(params.limit), offset: String(params.offset), ...(email ? { email } : {}) };
    return this.http.get<unknown>(this.base, { params: query }).pipe(
      map((raw) => {
        const page = userPageSchema.parse(raw);
        return { items: page.items, totalPages: page.totalPages };
      }),
    );
  }

  create(user: NewUser): Observable<User> {
    return this.http
      .post<unknown>(this.base, { ...user, role: user.role.toUpperCase() })
      .pipe(map((raw) => userResponseSchema.parse(raw)));
  }

  updateRole(userId: number, role: UserRole): Observable<User> {
    return this.http
      .patch<unknown>(`${this.base}/${userId}/role`, { role: role.toUpperCase() })
      .pipe(map((raw) => userResponseSchema.parse(raw)));
  }
}
