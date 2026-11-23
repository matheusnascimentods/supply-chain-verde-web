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
});

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
}

