import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BatchTraceabilityResponseDTO,
  CarbonFootprintResponseDTO,
  batchTraceabilityResponseSchema,
  carbonFootprintResponseSchema,
} from './index.schema';

@Injectable({ providedIn: 'root' })
export class TraceabilityService {
  private readonly http = inject(HttpClient);

  getTraceability(batchId: number | string): Observable<BatchTraceabilityResponseDTO> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/batches/${encodeURIComponent(batchId)}/traceability`)
      .pipe(map((response) => batchTraceabilityResponseSchema.parse(response)));
  }

  getCarbonFootprint(batchId: number | string): Observable<CarbonFootprintResponseDTO> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/batches/${encodeURIComponent(batchId)}/carbon-footprint`)
      .pipe(map((response) => carbonFootprintResponseSchema.parse(response)));
  }
}
