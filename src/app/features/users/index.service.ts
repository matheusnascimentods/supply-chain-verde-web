import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { UserPageDTO, UserRequestDTO, UserResponseDTO, userPageSchema, userResponseSchema, updateUserRoleSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient); private readonly base = `${environment.apiUrl}/users`;
  load(params: { limit?: number; offset?: number; email?: string } = {}): Observable<UserPageDTO> {
    const query = {
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
      ...(params.email?.trim() ? { email: params.email.trim() } : {}),
    };
    return this.http.get<unknown>(this.base, { params: query }).pipe(
      map((raw) => {
        const parsed = userPageSchema.safeParse(raw);
        if (parsed.success) return parsed.data;
        if (typeof raw === 'object' && raw !== null && 'content' in raw) {
          const content = z.array(userResponseSchema).parse((raw as { content: unknown }).content);
          const response = raw as { hasNext?: unknown; totalPages?: unknown };
          return {
            items: content,
            limit: 20,
            offset: params.offset ?? 0,
            hasNext: response.hasNext === true,
            ...(typeof response.totalPages === 'number' ? { totalPages: response.totalPages } : {}),
          };
        }
        if (Array.isArray(raw)) {
          const items = z.array(userResponseSchema).parse(raw);
          return { items, limit: 20, offset: params.offset ?? 0, hasNext: items.length === 20 };
        }
        throw parsed.error;
      }),
    );
  }
  loadCurrentUser(): Observable<UserResponseDTO> { return this.http.get<unknown>(`${this.base}/me`).pipe(map((raw) => userResponseSchema.parse(raw))); }
  create(data: UserRequestDTO): Observable<UserResponseDTO> {
    return this.http.post<unknown>(this.base, { ...data, role: data.role.toUpperCase() }).pipe(
      map((raw) => userResponseSchema.parse(raw)),
    );
  }
  updateRole(id: number, role: string): Observable<UserResponseDTO> {
    const parsedRole = updateUserRoleSchema.parse({ role }).role;
    return this.http.patch<unknown>(`${this.base}/${id}/role`, { role: parsedRole.toUpperCase() }).pipe(
      map((raw) => userResponseSchema.parse(raw)),
    );
  }
}
