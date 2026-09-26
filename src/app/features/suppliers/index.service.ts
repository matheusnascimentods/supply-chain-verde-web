import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  load(): Observable<SupplierResponseDTO[]> {
    return this.http.get<unknown>(this.base).pipe(map((raw) => z.array(supplierResponseSchema).parse(raw)), tap((items) => this._suppliers.set(items)));
  }
  get(id: number): Observable<SupplierResponseDTO> { return this.http.get<unknown>(`${this.base}/${id}`).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  create(data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.post<unknown>(this.base, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  update(id: number, data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.put<unknown>(`${this.base}/${id}`, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  loadRanking(sort = 'sustainabilityScore'): Observable<SupplierRankingResponseDTO[]> {
    return this.http.get<unknown>(`${this.base}/ranking`).pipe(
      map((raw) => {
        const items = z.array(supplierRankingResponseSchema).parse(raw);
        const sortValue = (item: SupplierRankingResponseDTO): number => {
          if (sort === 'activeCertifications') return item.activeCertificationCount ?? item.activeCertifications ?? item.activeCertificationsCount ?? 0;
          if (sort === 'totalCo2Kg') return item.totalCo2Kg ?? 0;
          return item.sustainabilityScore;
        };
        return [...items].sort((left, right) => sortValue(right) - sortValue(left));
      }),
      tap((items) => this._ranking.set(items)),
    );
  }

  loadExpiringCertificationSupplierIds(): Observable<number[]> {
    return this.http.get<unknown>(`${environment.apiUrl}/certifications/expiring`).pipe(
      map((raw) => z.array(z.object({ supplierId: z.number() }).passthrough()).parse(raw).map((item) => item.supplierId)),
    );
  }
}
