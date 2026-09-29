import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SuppliersService } from '../index.service';
import { SupplierListComponent } from './index.component';
describe('SupplierListComponent', () => { let fixture: ComponentFixture<SupplierListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [SupplierListComponent], providers: [provideRouter([]), { provide: SuppliersService, useValue: { load: vi.fn().mockReturnValue(of([])), loadRanking: vi.fn().mockReturnValue(of([])), loadExpiringCertificationSupplierIds: vi.fn().mockReturnValue(of([])) } }] }).compileComponents(); fixture = TestBed.createComponent(SupplierListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
