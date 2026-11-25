import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CalculationMethod, CarbonEmission, NewStage, NewTransport, Stage, Transport } from '../../domain/stage/index.model';
import { carbonEmissionResponseSchema, stageResponseSchema, transportResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class StagesRepository {
  private readonly http = inject(HttpClient);

  create(batchId: number, responsibleUserId: number, stage: NewStage): Observable<Stage> {
    const body = { ...stage, batchId };
    return this.http
      .post<unknown>(`${environment.apiUrl}/batches/${batchId}/stages`, body, {
        headers: new HttpHeaders({ 'X-Responsible-User-Id': String(responsibleUserId) }),
      })
      .pipe(map((raw) => stageResponseSchema.parse(raw)));
  }

  createTransport(chainId: number, transport: NewTransport): Observable<Transport> {
    return this.http
      .post<unknown>(`${environment.apiUrl}/stages/${chainId}/transport`, { ...transport, chainId })
      .pipe(map((raw) => transportResponseSchema.parse(raw)));
  }

  calculateEmission(chainId: number, calculationMethod: CalculationMethod): Observable<CarbonEmission> {
    return this.http
      .post<unknown>(`${environment.apiUrl}/stages/${chainId}/emission`, { chainId, calculationMethod })
      .pipe(map((raw) => carbonEmissionResponseSchema.parse(raw)));
  }
}
