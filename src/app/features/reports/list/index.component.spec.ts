import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReportListComponent } from './index.component';
describe('ReportListComponent', () => { let fixture: ComponentFixture<ReportListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ReportListComponent], providers: [provideRouter([]), { provide: ReportsService, useValue: { load: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }) } }] }).compileComponents(); fixture = TestBed.createComponent(ReportListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
