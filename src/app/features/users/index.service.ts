import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { UserRequestDTO, UserResponseDTO, userResponseSchema, updateUserRoleSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient); private readonly base = `${environment.apiUrl}/users`;
  private readonly _users = signal<UserResponseDTO[]>([]); readonly users = this._users.asReadonly();
  load(): Observable<UserResponseDTO[]> { return this.http.get<unknown>(this.base).pipe(map((raw) => z.array(userResponseSchema).parse(raw)), tap((items) => this._users.set(items))); }
  create(data: UserRequestDTO): Observable<UserResponseDTO> { return this.http.post<unknown>(this.base, data).pipe(map((raw) => userResponseSchema.parse(raw))); }
  updateRole(id: number, role: string): Observable<UserResponseDTO> { return this.http.patch<unknown>(`${this.base}/${id}/role`, updateUserRoleSchema.parse({ role })).pipe(map((raw) => userResponseSchema.parse(raw))); }
}
