import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BatchFormComponent } from './index.component';
describe('BatchFormComponent', () => { let fixture: ComponentFixture<BatchFormComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [BatchFormComponent], providers: [provideRouter([]), { provide: BatchesService, useValue: {} }] }).compileComponents(); fixture = TestBed.createComponent(BatchFormComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
