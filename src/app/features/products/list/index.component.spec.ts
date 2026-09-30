import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductsService } from '../index.service';
import { ProductListComponent } from './index.component';
describe('ProductListComponent', () => { let fixture: ComponentFixture<ProductListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ProductListComponent], providers: [provideRouter([]), { provide: ProductsService, useValue: { load: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next({ items: [], limit: 20, offset: 0, hasNext: false }) }) } }] }).compileComponents(); fixture = TestBed.createComponent(ProductListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
