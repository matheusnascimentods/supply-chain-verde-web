import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChainListComponent } from './index.component';
describe('ChainListComponent', () => { let fixture: ComponentFixture<ChainListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ChainListComponent], providers: [provideRouter([]), { provide: ChainService, useValue: { load: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }) } }] }).compileComponents(); fixture = TestBed.createComponent(ChainListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
