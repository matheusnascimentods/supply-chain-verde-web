import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { SupplierRequestDTO, SupplierResponseDTO, SupplierRankingPageDTO, ViaCepResponseDTO, supplierResponseSchema, supplierRankingPageSchema, viaCepResponseSchema } from './index.schema';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/suppliers`;
  private readonly _suppliers = signal<SupplierResponseDTO[]>([]);
  private readonly _ranking = signal<SupplierRankingPageDTO | null>(null);
  readonly suppliers = this._suppliers.asReadonly();
  readonly ranking = this._ranking.asReadonly();

  load(): Observable<SupplierResponseDTO[]> {
    return this.http.get<unknown>(this.base).pipe(map((raw) => z.array(supplierResponseSchema).parse(raw)), tap((items) => this._suppliers.set(items)));
  }
  get(id: number): Observable<SupplierResponseDTO> { return this.http.get<unknown>(`${this.base}/${id}`).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  create(data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.post<unknown>(this.base, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  update(id: number, data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.put<unknown>(`${this.base}/${id}`, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  loadRanking(params: { limit?: number; offset?: number; search?: string } = {}): Observable<SupplierRankingPageDTO> {
    const query = {
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    };
    return this.http.get<unknown>(`${this.base}/ranking`, { params: query }).pipe(
      map((raw) => supplierRankingPageSchema.parse(raw)),
      tap((page) => this._ranking.set(page)),
    );
  }

  lookupZipCode(zipCode: string): Observable<ViaCepResponseDTO> {
    return this.http.get<unknown>(`https://viacep.com.br/ws/${zipCode}/json/`).pipe(
      map((raw) => viaCepResponseSchema.parse(raw)),
    );
  }

  loadExpiringCertificationSupplierIds(): Observable<number[]> {
    return this.http.get<unknown>(`${environment.apiUrl}/certifications/expiring`).pipe(
      map((raw) => z.array(z.object({ supplierId: z.number() }).passthrough()).parse(raw).map((item) => item.supplierId)),
    );
  }
}
