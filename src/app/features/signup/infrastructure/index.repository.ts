import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CompanySignup } from '../domain/index.model';
import { SignUpResponseDTO, signUpResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class SignupRepository {
  private readonly http = inject(HttpClient);

  register(signup: CompanySignup): Observable<SignUpResponseDTO> {
    return this.http
      .post<unknown>(`${environment.apiUrl}/companies`, signup)
      .pipe(map((response) => signUpResponseSchema.parse(response)));
  }
}
