import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SupplierListComponent } from './index.component';
describe('SupplierListComponent', () => { let fixture: ComponentFixture<SupplierListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [SupplierListComponent], providers: [provideRouter([]), { provide: SuppliersService, useValue: { load: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }) } }] }).compileComponents(); fixture = TestBed.createComponent(SupplierListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
