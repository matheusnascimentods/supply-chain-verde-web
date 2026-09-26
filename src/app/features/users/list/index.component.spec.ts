import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserListComponent } from './index.component';
describe('UserListComponent', () => { let fixture: ComponentFixture<UserListComponent>; beforeEach(async () => { await TestBed.configureTestingModule({ imports: [UserListComponent], providers: [provideRouter([]), { provide: UsersService, useValue: { load: vi.fn().mockReturnValue({ subscribe: ({ next }: any) => next([]) }) } }] }).compileComponents(); fixture = TestBed.createComponent(UserListComponent); }); it('should create the component', () => expect(fixture.componentInstance).toBeTruthy()); });
