import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PageLoader, PagedSearch } from './index.helper';

describe('PagedSearch', () => {
  const messages = { load: 'Falha ao carregar', page: 'Falha na página' };
  let loader: ReturnType<typeof vi.fn<PageLoader<string>>>;
  let errors: string[];
  let list: PagedSearch<string>;

  beforeEach(() => {
    errors = [];
    loader = vi.fn<PageLoader<string>>().mockReturnValue(of({ items: ['a', 'b'], totalPages: 3 }));
    list = TestBed.runInInjectionContext(
      () => new PagedSearch<string>(loader, messages, (message) => errors.push(message), TestBed.inject(DestroyRef)),
    );
  });

  afterEach(() => vi.useRealTimers());

  it('loads the first page', () => {
    list.load();
    expect(loader).toHaveBeenCalledWith({ limit: 20, offset: 0, search: '' });
    expect(list.items()).toEqual(['a', 'b']);
    expect(list.loading()).toBe(false);
  });

  it('pages within the bounds', () => {
    list.load();
    list.changePage(-1);
    expect(loader).toHaveBeenCalledTimes(1);
    list.changePage(1);
    expect(loader).toHaveBeenLastCalledWith({ limit: 20, offset: 20, search: '' });
    expect(list.page()).toBe(1);
  });

  it('debounces the search and restarts from the first page', () => {
    vi.useFakeTimers();
    list.load();
    list.changePage(1);
    list.searchFor('café');
    expect(list.page()).toBe(0);
    vi.advanceTimersByTime(250);
    expect(loader).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: 'café' });
  });

  it('reports load and page failures with their own messages', () => {
    loader.mockReturnValueOnce(throwError(() => new Error('500')));
    list.load();
    expect(errors).toEqual(['Falha ao carregar']);
    expect(list.loading()).toBe(false);

    list.load();
    loader.mockReturnValueOnce(throwError(() => new Error('500')));
    list.changePage(1);
    expect(errors).toEqual(['Falha ao carregar', 'Falha na página']);
  });
});
