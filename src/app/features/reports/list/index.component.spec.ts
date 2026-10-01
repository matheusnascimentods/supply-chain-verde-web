import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReportsService } from '../index.service';
import { ReportListComponent } from './index.component';

describe('ReportListComponent', () => {
  let fixture: ComponentFixture<ReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ReportsService,
          useValue: {
            loadPage: vi.fn().mockReturnValue(of({ items: [], limit: 20, offset: 0, hasNext: false })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportListComponent);
  });

  it('should create the component', () => expect(fixture.componentInstance).toBeTruthy());
});
