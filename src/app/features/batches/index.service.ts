import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { BatchRequestDTO, BatchResponseDTO, batchResponseSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class BatchesService {
  private readonly http = inject(HttpClient); private readonly base = `${environment.apiUrl}/batches`;
  private readonly _batches = signal<BatchResponseDTO[]>([]); readonly batches = this._batches.asReadonly();
  loadBySupplier(supplierId: number): Observable<BatchResponseDTO[]> { return this.http.get<unknown>(`${environment.apiUrl}/suppliers/${supplierId}/batches`).pipe(map((raw) => z.array(batchResponseSchema).parse(raw)), tap((items) => this._batches.set(items))); }
  create(data: BatchRequestDTO): Observable<BatchResponseDTO> { return this.http.post<unknown>(this.base, data).pipe(map((raw) => batchResponseSchema.parse(raw))); }
}
