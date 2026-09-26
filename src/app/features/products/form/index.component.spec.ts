import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductFormComponent } from './index.component';
describe('ProductFormComponent', () => { let fixture: ComponentFixture<ProductFormComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ProductFormComponent], providers: [provideRouter([]), { provide: ProductsService, useValue: {} }] }).compileComponents(); fixture = TestBed.createComponent(ProductFormComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
