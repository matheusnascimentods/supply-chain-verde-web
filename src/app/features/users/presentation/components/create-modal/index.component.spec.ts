import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/index.use-case';
import { CreateUserModalComponent } from './index.component';

describe('CreateUserModalComponent', () => {
  let fixture: ComponentFixture<CreateUserModalComponent>;
  let createUser: { execute: ReturnType<typeof vi.fn> };
  let created: number;

  beforeEach(() => {
    created = 0;
    createUser = { execute: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({ providers: [{ provide: CreateUserUseCase, useValue: createUser }] });
    fixture = TestBed.createComponent(CreateUserModalComponent);
    fixture.componentInstance.created.subscribe(() => created++);
    fixture.detectChanges();
  });

  const validUser = { name: 'Ana', email: 'ana@example.com', password: 'secret', role: 'manager' };

  it('does not submit an invalid form', () => {
    fixture.componentInstance.submit();
    expect(createUser.execute).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.name.touched).toBe(true);
  });

  it('creates the user and notifies the page', () => {
    fixture.componentInstance.form.setValue(validUser);
    fixture.componentInstance.submit();
    expect(createUser.execute).toHaveBeenCalledWith(validUser);
    expect(created).toBe(1);
    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('shows an error when the creation fails', () => {
    createUser.execute.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.form.setValue(validUser);
    fixture.componentInstance.submit();
    expect(created).toBe(0);
    expect(fixture.componentInstance.error()).toBe('Não foi possível salvar. Confira os dados e tente novamente.');
  });
});
