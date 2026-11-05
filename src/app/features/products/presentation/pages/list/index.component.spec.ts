import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductsRepository } from '../../../infrastructure/index.repository';
import { ProductListComponent } from './index.component';

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let load: ReturnType<typeof vi.fn>;
  const coffee = { productId: 3, name: 'Café orgânico', description: 'Grãos arábica', category: 'AGRICULTURE', unit: 'KG' };
  const cotton = { productId: 4, name: 'Algodão', description: null, category: 'TEXTILE', unit: 'TON' };

  function render(): HTMLElement {
    TestBed.configureTestingModule({ providers: [{ provide: ProductsRepository, useValue: { load, create: vi.fn() } }] });
    fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    load = vi.fn().mockReturnValue(of({ items: [coffee, cotton], totalPages: 2 }));
  });

  afterEach(() => vi.useRealTimers());

  it('lists the company products with readable category and unit', () => {
    const page = render();
    expect(load).toHaveBeenCalledWith({ limit: 20, offset: 0, search: '' });
    const rows = [...page.querySelectorAll('tbody tr')].map((row) => row.textContent?.replace(/\s+/g, ' ').trim());
    expect(rows[0]).toContain('Café orgânico');
    expect(rows[0]).toContain('Agricultura');
    expect(rows[0]).toContain('Quilograma (kg)');
    expect(rows[1]).toContain('—');
  });

  it('searches with debounce from the first page', () => {
    vi.useFakeTimers();
    render();
    fixture.componentInstance.changePage(1);
    fixture.componentInstance.searchFor('café');
    vi.advanceTimersByTime(300);
    expect(load).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: 'café' });
  });

  it('pages within the bounds', () => {
    render();
    fixture.componentInstance.changePage(-1);
    expect(load).toHaveBeenCalledTimes(1);
    fixture.componentInstance.changePage(1);
    expect(load).toHaveBeenLastCalledWith({ limit: 20, offset: 20, search: '' });
    fixture.componentInstance.changePage(1);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invites to register the first product when there is none', () => {
    load.mockReturnValue(of({ items: [], totalPages: 0 }));
    expect(render().textContent).toContain('Nenhum produto cadastrado ainda');
  });

  it('shows a retry when the list fails', () => {
    load.mockReturnValue(throwError(() => new Error('500')));
    const page = render();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível carregar os produtos.');
    load.mockReturnValue(of({ items: [coffee], totalPages: 1 }));
    page.querySelector<HTMLButtonElement>('.products-retry')!.click();
    fixture.detectChanges();
    expect(page.textContent).toContain('Café orgânico');
  });

  it('opens the create modal and reloads from the first page after creating', () => {
    const page = render();
    [...page.querySelectorAll('button')].find((button) => button.textContent?.includes('Novo produto'))!.click();
    fixture.detectChanges();
    expect(page.querySelector('app-product-create-modal')).not.toBeNull();

    fixture.componentInstance.changePage(1);
    fixture.componentInstance.productCreated();
    fixture.detectChanges();
    expect(page.querySelector('app-product-create-modal')).toBeNull();
    expect(load).toHaveBeenLastCalledWith({ limit: 20, offset: 0, search: '' });
  });
});
