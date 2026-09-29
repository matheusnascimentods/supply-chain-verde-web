import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CertificationsService } from '../index.service';
import { CertificationFormComponent } from './index.component';
describe('CertificationFormComponent', () => { let fixture: ComponentFixture<CertificationFormComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [CertificationFormComponent], providers: [provideRouter([]), { provide: CertificationsService, useValue: {} }] }).compileComponents(); fixture = TestBed.createComponent(CertificationFormComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
