import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { SupplierRequestDTO, SupplierResponseDTO, SupplierRankingPageDTO, ViaCepResponseDTO, supplierResponseSchema, supplierRankingPageSchema, viaCepResponseSchema } from './index.schema';
import { certificationListResponseSchema } from '../certifications/index.schema';

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
  get(id: number): Observable<SupplierResponseDTO> {
    return this.http.get<unknown>(this.base, { params: { supplierId: String(id) } })
      .pipe(map((raw) => supplierResponseSchema.parse(raw)));
  }
  create(data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.post<unknown>(this.base, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  update(id: number, data: SupplierRequestDTO): Observable<SupplierResponseDTO> { return this.http.put<unknown>(`${this.base}/${id}`, data).pipe(map((raw) => supplierResponseSchema.parse(raw))); }
  loadRanking(params: { limit?: number; offset?: number; search?: string } = {}): Observable<SupplierRankingPageDTO> {
    const query = {
      ranked: 'true',
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    };
    return this.http.get<unknown>(this.base, { params: query }).pipe(
      map((raw) => supplierRankingPageSchema.parse(raw)),
      tap((page) => this._ranking.set(page)),
    );
  }

  lookupZipCode(zipCode: string): Observable<ViaCepResponseDTO> {
    return this.http.get<unknown>(`https://viacep.com.br/ws/${zipCode}/json/`).pipe(
      map((raw) => viaCepResponseSchema.parse(raw)),
    );
  }

  loadExpiredCertificationCounts(): Observable<Map<number, number>> {
    const pageSize = 100;
    const loadPage = (page: number) =>
      this.http
        .get<unknown>(`${environment.apiUrl}/certifications`, {
          params: new HttpParams()
            .set('page', page)
            .set('size', pageSize)
            .set('status', 'EXPIRED'),
        })
        .pipe(map((raw) => certificationListResponseSchema.parse(raw)));

    return loadPage(0).pipe(
      switchMap((firstPage) => {
        const remainingPages = Array.from(
          { length: Math.max(firstPage.totalPages - 1, 0) },
          (_, index) => loadPage(index + 1),
        );
        return forkJoin([of(firstPage), ...remainingPages]);
      }),
      map((pages) =>
        pages.flatMap((page) => page.items).reduce((counts, item) => {
          counts.set(item.supplierId, (counts.get(item.supplierId) ?? 0) + 1);
          return counts;
        }, new Map<number, number>()),
      ),
    );
  }
}
