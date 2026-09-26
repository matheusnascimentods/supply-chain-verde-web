import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BatchListComponent } from './index.component';
describe('BatchListComponent', () => { let fixture: ComponentFixture<BatchListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [BatchListComponent], providers: [provideRouter([]), { provide: BatchesService, useValue: { loadBySupplier: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }) } }] }).compileComponents(); fixture = TestBed.createComponent(BatchListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
