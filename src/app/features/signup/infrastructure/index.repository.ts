import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Plan } from '../domain/index.model';
import { plansResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class SignupRepository {
  private readonly http = inject(HttpClient);

  listPlans(): Observable<Plan[]> {
    return this.http.get<unknown>(`${environment.apiUrl}/plans`).pipe(map((response) => plansResponseSchema.parse(response)));
  }
}
