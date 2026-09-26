import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SuppliersService } from '../index.service';
import { SupplierRankingComponent } from './index.component';
describe('SupplierRankingComponent', () => {
  let fixture: ComponentFixture<SupplierRankingComponent>;
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [SupplierRankingComponent], providers: [{ provide: SuppliersService, useValue: { loadRanking: vi.fn().mockReturnValue(of([])), load: vi.fn().mockReturnValue(of([])) } }] }).compileComponents(); fixture = TestBed.createComponent(SupplierRankingComponent); fixture.detectChanges(); });
  it('should create and request the default score ranking', () => { expect(fixture.componentInstance).toBeTruthy(); expect(fixture.componentInstance.items()).toEqual([]); });
});
