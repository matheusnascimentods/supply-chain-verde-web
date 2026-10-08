import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Page } from '../../domain/index.model';
import { NewProduct, Product } from '../../domain/product/index.model';
import { productPageSchema, productResponseSchema } from './index.dto';

const MAX_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class ProductsRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products`;

  load(params: { limit: number; offset: number; search?: string }): Observable<Page<Product>> {
    const search = params.search?.trim();
    const query = { limit: String(params.limit), offset: String(params.offset), ...(search ? { search } : {}) };
    return this.http.get<unknown>(this.base, { params: query }).pipe(
      map((raw) => {
        const page = productPageSchema.parse(raw);
        return { items: page.items, totalPages: page.totalPages };
      }),
    );
  }

  // A API não tem busca por id; a lista de lotes precisa do catálogo inteiro para exibir a unidade.
  loadAll(): Observable<Product[]> {
    return this.load({ limit: MAX_PAGE_SIZE, offset: 0 }).pipe(
      switchMap((first) => {
        if (first.totalPages <= 1) return of(first.items);
        const rest = Array.from({ length: first.totalPages - 1 }, (_, index) =>
          this.load({ limit: MAX_PAGE_SIZE, offset: (index + 1) * MAX_PAGE_SIZE }),
        );
        return forkJoin(rest).pipe(map((pages) => [...first.items, ...pages.flatMap((page) => page.items)]));
      }),
    );
  }

  create(product: NewProduct): Observable<Product> {
    return this.http.post<unknown>(this.base, product).pipe(map((raw) => productResponseSchema.parse(raw)));
  }
}
