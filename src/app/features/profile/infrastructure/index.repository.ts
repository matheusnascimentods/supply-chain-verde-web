import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../../environments/environment';
import { COMPANY_TYPES } from '../../../core/auth/session/index.model';
import { CurrentUserDTO, currentUserResponseSchema } from '../../../core/auth/session/current-user/index.dto';
import { AccountPatch, CompanyPatch, OwnCompany } from '../domain/index.model';

const ownCompanySchema = z.object({
  companyId: z.number(),
  name: z.string(),
  cnpj: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  type: z.preprocess((value) => (typeof value === 'string' ? value.toLowerCase() : value), z.enum(COMPANY_TYPES)),
  address: z
    .object({
      street: z.string().nullish(),
      number: z.string().nullish(),
      neighborhood: z.string().nullish(),
      complement: z.string().nullish(),
      zipCode: z.string().nullish(),
      city: z.string().nullish(),
      state: z.string().nullish(),
    })
    .nullable(),
  plan: z.object({ code: z.string(), name: z.string(), maxUsers: z.number() }).nullable(),
});

// O plano tem no máximo 15 contas, então uma página basta para contar os usuários da companhia.
const COMPANY_USERS_LIMIT = 100;
const usersPageSchema = z.object({ items: z.array(z.unknown()) });

@Injectable({ providedIn: 'root' })
export class ProfileRepository {
  private readonly http = inject(HttpClient);

  updateMe(patch: AccountPatch): Observable<CurrentUserDTO> {
    return this.http
      .patch<unknown>(`${environment.apiUrl}/users/me`, patch)
      .pipe(map((raw) => currentUserResponseSchema.parse(raw)));
  }

  getMyCompany(): Observable<OwnCompany> {
    return this.http.get<unknown>(`${environment.apiUrl}/companies/me`).pipe(map((raw) => ownCompanySchema.parse(raw)));
  }

  updateMyCompany(patch: CompanyPatch): Observable<OwnCompany> {
    return this.http.patch<unknown>(`${environment.apiUrl}/companies/me`, patch).pipe(map((raw) => ownCompanySchema.parse(raw)));
  }

  // ponytail: a API não devolve as contas usadas; conta a lista da própria companhia (RN-13b). Vira campo de /companies/me se a API passar a mandar.
  countCompanyUsers(): Observable<number> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/users`, { params: { limit: COMPANY_USERS_LIMIT, offset: 0 } })
      .pipe(map((raw) => usersPageSchema.parse(raw).items.length));
  }
}

