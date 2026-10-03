import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '../../../core/session/index.service';
import { ProductsService } from '../../products/index.service';
import { BatchesService } from '../index.service';
import { BatchListComponent } from './index.component';

describe('BatchListComponent', () => {
  let fixture: ComponentFixture<BatchListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchListComponent],
      providers: [
        provideRouter([]),
        {
          provide: BatchesService,
          useValue: {
            load: vi.fn().mockReturnValue({
              subscribe: ({ next }: any) =>
                next({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
            }),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            loadAll: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }),
          },
        },
        { provide: SessionService, useValue: { role: () => 'manager' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BatchListComponent);
  });

  it('should create the component', () => expect(fixture.componentInstance).toBeTruthy());
});
