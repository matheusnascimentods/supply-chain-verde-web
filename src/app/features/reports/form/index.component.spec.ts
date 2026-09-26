import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReportFormComponent } from './index.component';
describe('ReportFormComponent', () => { let fixture: ComponentFixture<ReportFormComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ReportFormComponent], providers: [provideRouter([]), { provide: ReportsService, useValue: {} }] }).compileComponents(); fixture = TestBed.createComponent(ReportFormComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
