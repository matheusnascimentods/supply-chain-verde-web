import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BatchPageDTO, BatchRequestDTO, BatchResponseDTO, batchPageSchema, batchResponseSchema } from './index.schema';

@Injectable({ providedIn: 'root' })
export class BatchesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/batches`;
  private readonly _batches = signal<BatchResponseDTO[]>([]);
  readonly batches = this._batches.asReadonly();

  load(params: { page?: number; size?: number } = {}): Observable<BatchPageDTO> {
    return this.http.get<unknown>(this.base, {
      params: { page: String(params.page ?? 0), size: String(params.size ?? 20) },
    }).pipe(
      map((raw) => batchPageSchema.parse(raw)),
      tap((result) => this._batches.set(result.content)),
    );
  }

  create(data: BatchRequestDTO): Observable<BatchResponseDTO> {
    return this.http.post<unknown>(this.base, data).pipe(map((raw) => batchResponseSchema.parse(raw)));
  }
}
