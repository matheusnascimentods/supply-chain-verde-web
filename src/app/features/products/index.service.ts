import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import {
  ProductPageDTO,
  ProductRequestDTO,
  ProductResponseDTO,
  productPageSchema,
  productResponseSchema,
} from './index.schema';
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products`;
  private readonly _products = signal<ProductResponseDTO[]>([]);
  readonly products = this._products.asReadonly();
  load(
    params: { limit?: number; offset?: number; search?: string } = {},
  ): Observable<ProductPageDTO> {
    const query = {
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    };
    return this.http.get<unknown>(this.base, { params: query }).pipe(
      map((raw) => productPageSchema.parse(raw)),
      tap((page) => this._products.set(page.items)),
    );
  }
  loadAll(): Observable<ProductResponseDTO[]> {
    const limit = 100;
    return this.load({ limit, offset: 0 }).pipe(
      switchMap((first) => {
        if (first.totalPages <= 1) return of(first.items);
        const pages = Array.from({ length: first.totalPages - 1 }, (_, index) =>
          this.load({ limit, offset: (index + 1) * limit }),
        );
        return forkJoin([of(first), ...pages]).pipe(
          map((results) => results.flatMap((page) => page.items)),
        );
      }),
    );
  }
  get(id: number): Observable<ProductResponseDTO> {
    return this.http
      .get<unknown>(`${this.base}/${id}`)
      .pipe(map((raw) => productResponseSchema.parse(raw)));
  }
  create(data: ProductRequestDTO): Observable<ProductResponseDTO> {
    return this.http
      .post<unknown>(this.base, data)
      .pipe(map((raw) => productResponseSchema.parse(raw)));
  }
  update(id: number, data: ProductRequestDTO): Observable<ProductResponseDTO> {
    return this.http
      .put<unknown>(`${this.base}/${id}`, data)
      .pipe(map((raw) => productResponseSchema.parse(raw)));
  }
}
