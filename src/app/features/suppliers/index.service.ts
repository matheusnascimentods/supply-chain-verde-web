import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { SupplierRequestDTO, SupplierResponseDTO, SupplierRankingResponseDTO, supplierResponseSchema, supplierRankingResponseSchema } from './index.schema';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/suppliers`;
  private readonly _suppliers = signal<SupplierResponseDTO[]>([]);
  private readonly _ranking = signal<SupplierRankingResponseDTO[]>([]);
  readonly suppliers = this._suppliers.asReadonly();
  readonly ranking = this._ranking.asReadonly();

  load(search = ''): Observable<SupplierResponseDTO[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<unknown>(this.base, { params }).pipe(map((raw) => z.array(supplierResponseSchema).parse(raw)), tap((items) => this._suppliers.set(items)));
  }
  get(id: number): Observable<SupplierResponseDTO> { return this.http.get<unknown>(`${this.base}/${id}`).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  create(data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.post<unknown>(this.base, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  update(id: number, data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.put<unknown>(`${this.base}/${id}`, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  loadRanking(sort = 'sustainabilityScore'): Observable<SupplierRankingResponseDTO[]> {
    const params = new HttpParams().set('sortBy', sort);
    return this.http.get<unknown>(`${this.base}/ranking`, { params }).pipe(map((raw) => z.array(supplierRankingResponseSchema).parse(raw)), tap((items) => this._ranking.set(items)));
  }
}
