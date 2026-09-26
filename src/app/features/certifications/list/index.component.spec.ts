import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CertificationListComponent } from './index.component';
describe('CertificationListComponent', () => { let fixture: ComponentFixture<CertificationListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [CertificationListComponent], providers: [provideRouter([]), { provide: CertificationsService, useValue: { load: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }) } }] }).compileComponents(); fixture = TestBed.createComponent(CertificationListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
