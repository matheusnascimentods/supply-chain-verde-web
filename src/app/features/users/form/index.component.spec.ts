import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserFormComponent } from './index.component';
describe('UserFormComponent', () => { let fixture: ComponentFixture<UserFormComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [UserFormComponent], providers: [provideRouter([]), { provide: UsersService, useValue: {} }] }).compileComponents(); fixture = TestBed.createComponent(UserFormComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
