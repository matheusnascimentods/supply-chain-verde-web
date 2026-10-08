import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { Page } from '../../domain/index.model';

const PAGE_SIZE = 20;

export type PageLoader<T> = (query: { limit: number; offset: number; search: string }) => Observable<Page<T>>;

/** Lista com busca (debounce) e paginação usada pelos seletores do cadastro de lote. */
export class PagedSearch<T> {
  readonly items = signal<T[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly search = signal('');
  readonly loading = signal(true);
  private readonly searchChanges = new Subject<string>();

  constructor(
    private readonly loader: PageLoader<T>,
    private readonly messages: { load: string; page: string },
    private readonly onError: (message: string) => void,
    destroyRef: DestroyRef,
  ) {
    this.searchChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((search) => this.fetch(0, search)),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe();
  }

  load(): void {
    this.loading.set(true);
    this.fetch(0, this.search()).subscribe();
  }

  searchFor(value: string): void {
    this.search.set(value);
    this.page.set(0);
    this.loading.set(true);
    this.searchChanges.next(value.trim());
  }

  changePage(direction: -1 | 1): void {
    const next = this.page() + direction;
    if (next < 0 || next >= this.totalPages()) return;
    this.loading.set(true);
    this.fetch(next, this.search(), this.messages.page).subscribe();
  }

  private fetch(page: number, search: string, errorMessage = this.messages.load): Observable<unknown> {
    return this.loader({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search }).pipe(
      tap((result) => {
        this.items.set(result.items);
        this.page.set(page);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        this.onError(errorMessage);
        return of(null);
      }),
    );
  }
}
