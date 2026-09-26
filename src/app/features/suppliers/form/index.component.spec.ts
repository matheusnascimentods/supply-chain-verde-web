import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SupplierFormComponent } from './index.component';
describe('SupplierFormComponent', () => { let fixture: ComponentFixture<SupplierFormComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [SupplierFormComponent], providers: [provideRouter([]), { provide: SuppliersService, useValue: {} }] }).compileComponents(); fixture = TestBed.createComponent(SupplierFormComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
