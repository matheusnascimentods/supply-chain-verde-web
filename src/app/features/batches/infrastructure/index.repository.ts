import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Batch, BatchPage, BatchStatus, NewBatch } from '../domain/index.model';
import { batchPageSchema, batchResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class BatchesRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/batches`;

  load(params: { page: number; size: number; status?: BatchStatus | null }): Observable<BatchPage> {
    const query = { page: String(params.page), size: String(params.size), ...(params.status ? { status: params.status } : {}) };
    return this.http.get<unknown>(this.base, { params: query }).pipe(
      map((raw) => {
        const page = batchPageSchema.parse(raw);
        return { items: page.content, page: page.page, totalPages: page.totalPages, totalElements: page.totalElements };
      }),
    );
  }

  reject(batchId: number, reason: string): Observable<Batch> {
    return this.http.patch<unknown>(`${this.base}/${batchId}/reject`, { reason }).pipe(map((raw) => batchResponseSchema.parse(raw)));
  }

  create(batch: NewBatch): Observable<Batch> {
    return this.http.post<unknown>(this.base, batch).pipe(map((raw) => batchResponseSchema.parse(raw)));
  }
}
