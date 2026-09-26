import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { z } from 'zod';
import { environment } from '../../../environments/environment';
import { ProductRequestDTO, ProductResponseDTO, productResponseSchema } from './index.schema';
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient); private readonly base = `${environment.apiUrl}/products`;
  private readonly _products = signal<ProductResponseDTO[]>([]); readonly products = this._products.asReadonly();
  load(): Observable<ProductResponseDTO[]> { return this.http.get<unknown>(this.base).pipe(map((raw) => z.array(productResponseSchema).parse(raw)), tap((items) => this._products.set(items))); }
  get(id: number): Observable<ProductResponseDTO> { return this.http.get<unknown>(`${this.base}/${id}`).pipe(map((raw) => productResponseSchema.parse(raw))); }
  create(data: ProductRequestDTO): Observable<ProductResponseDTO> { return this.http.post<unknown>(this.base, data).pipe(map((raw) => productResponseSchema.parse(raw))); }
  update(id: number, data: ProductRequestDTO): Observable<ProductResponseDTO> { return this.http.put<unknown>(`${this.base}/${id}`, data).pipe(map((raw) => productResponseSchema.parse(raw))); }
}
