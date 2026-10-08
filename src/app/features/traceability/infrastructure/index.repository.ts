import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BatchTraceability, CarbonFootprint } from '../domain/index.model';
import { batchTraceabilityResponseSchema, carbonFootprintResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class TraceabilityRepository {
  private readonly http = inject(HttpClient);

  getTraceability(batchId: string): Observable<BatchTraceability> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/batches/${encodeURIComponent(batchId)}/traceability`)
      .pipe(map((response) => batchTraceabilityResponseSchema.parse(response)));
  }

  getCarbonFootprint(batchId: string): Observable<CarbonFootprint> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/batches/${encodeURIComponent(batchId)}/carbon-footprint`)
      .pipe(map((response) => carbonFootprintResponseSchema.parse(response)));
  }
}
