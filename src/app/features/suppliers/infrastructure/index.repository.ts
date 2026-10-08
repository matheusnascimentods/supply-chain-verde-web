import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../../environments/environment';
import { NewSupplier, Page, Supplier, SupplierRanking } from '../domain/index.model';
import { supplierRankingPageSchema, supplierResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class SuppliersRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/suppliers`;

  load(): Observable<Supplier[]> {
    return this.http.get<unknown>(this.base).pipe(map((raw) => z.array(supplierResponseSchema).parse(raw)));
  }

  get(supplierId: number): Observable<Supplier> {
    return this.http
      .get<unknown>(this.base, { params: { supplierId: String(supplierId) } })
      .pipe(map((raw) => supplierResponseSchema.parse(raw)));
  }

  create(supplier: NewSupplier): Observable<Supplier> {
    return this.http.post<unknown>(this.base, supplier).pipe(map((raw) => supplierResponseSchema.parse(raw)));
  }

  update(supplierId: number, supplier: NewSupplier): Observable<Supplier> {
    return this.http
      .put<unknown>(`${this.base}/${supplierId}`, supplier)
      .pipe(map((raw) => supplierResponseSchema.parse(raw)));
  }

  loadRanking(params: { limit: number; offset: number; search?: string }): Observable<Page<SupplierRanking>> {
    const search = params.search?.trim();
    const query = { ranked: 'true', limit: String(params.limit), offset: String(params.offset), ...(search ? { search } : {}) };
    return this.http.get<unknown>(this.base, { params: query }).pipe(
      map((raw) => {
        const page = supplierRankingPageSchema.parse(raw);
        return { items: page.items, totalPages: page.totalPages };
      }),
    );
  }
}
