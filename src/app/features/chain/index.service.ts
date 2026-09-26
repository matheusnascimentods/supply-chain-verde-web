import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { stageResponseSchema, StageResponseDTO, StageRequestDTO, TransportRequestDTO, EmissionCalculationRequestDTO } from './index.schema';
import { carbonEmissionResponseSchema, chainResponseSchema } from '../traceability/index.schema';
@Injectable({ providedIn: 'root' })
export class ChainService {
  private readonly http = inject(HttpClient); private readonly base = environment.apiUrl;
  private readonly _stages = signal<StageResponseDTO[]>([]); readonly stages = this._stages.asReadonly();
  load(batchId: number): Observable<StageResponseDTO[]> { return this.http.get<unknown>(`${this.base}/batches/${batchId}/stages`).pipe(map((raw) => z.array(stageResponseSchema).parse(raw)), tap((items) => this._stages.set(items))); }
  createStage(batchId: number, data: StageRequestDTO): Observable<StageResponseDTO> { return this.http.post<unknown>(`${this.base}/batches/${batchId}/stages`, data).pipe(map((raw) => stageResponseSchema.parse(raw))); }
  createTransport(stageId: number, data: TransportRequestDTO): Observable<unknown> { return this.http.post<unknown>(`${this.base}/stages/${stageId}/transport`, data); }
  calculateEmission(stageId: number, data: EmissionCalculationRequestDTO): Observable<z.infer<typeof carbonEmissionResponseSchema>> { return this.http.post<unknown>(`${this.base}/stages/${stageId}/emission`, data).pipe(map((raw) => carbonEmissionResponseSchema.parse(raw))); }
}
