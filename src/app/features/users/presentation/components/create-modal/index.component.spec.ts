import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserRole } from '../../../../../core/auth/session/index.model';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { SuppliersRepository } from '../../../../suppliers';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/index.use-case';
import { CreateUserModalComponent } from './index.component';

describe('CreateUserModalComponent', () => {
  let fixture: ComponentFixture<CreateUserModalComponent>;
  let createUser: { execute: ReturnType<typeof vi.fn> };
  let suppliers: { loadRanking: ReturnType<typeof vi.fn> };
  let created: number;
  const fazenda = { supplierId: 7, name: 'Fazenda Verde', cnpj: '12345678000190' };

  function createModal(role: UserRole = 'admin'): CreateUserModalComponent {
    created = 0;
    createUser = { execute: vi.fn().mockReturnValue(of({})) };
    suppliers = { loadRanking: vi.fn().mockReturnValue(of({ items: [fazenda], totalPages: 1 })) };
    TestBed.configureTestingModule({
      providers: [
        { provide: CreateUserUseCase, useValue: createUser },
        { provide: SuppliersRepository, useValue: suppliers },
        { provide: SessionService, useValue: { role: () => role } },
      ],
    });
    fixture = TestBed.createComponent(CreateUserModalComponent);
    fixture.componentInstance.created.subscribe(() => created++);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  const validUser = { name: 'Ana', email: 'ana@example.com', password: 'secret', role: 'manager' };

  it('does not submit an invalid form', () => {
    const modal = createModal();
    modal.submit();
    expect(createUser.execute).not.toHaveBeenCalled();
    expect(modal.form.controls.name.touched).toBe(true);
  });

  it('creates the user and notifies the page', () => {
    const modal = createModal();
    modal.form.patchValue(validUser);
    modal.submit();
    expect(createUser.execute).toHaveBeenCalledWith(validUser);
    expect(suppliers.loadRanking).not.toHaveBeenCalled();
    expect(created).toBe(1);
    expect(modal.saving()).toBe(false);
  });

  it('requires a supplier without access for supplier users', () => {
    const modal = createModal();
    modal.form.patchValue({ ...validUser, role: 'supplier' });
    expect(suppliers.loadRanking).toHaveBeenCalledWith({ limit: 20, offset: 0, search: '', withoutUser: true });
    modal.submit();
    expect(createUser.execute).not.toHaveBeenCalled();

    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.create-user-supplier-option')!.click();
    modal.submit();
    expect(createUser.execute).toHaveBeenCalledWith({ ...validUser, role: 'supplier', supplierId: 7 });
  });

  it('only offers the supplier role to managers, already selected', () => {
    const modal = createModal('manager');
    expect(modal.form.controls.role.value).toBe('supplier');
    expect(suppliers.loadRanking).toHaveBeenCalled();
  });

  it('shows the API message when the creation is refused', () => {
    const modal = createModal();
    createUser.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Email já cadastrado: ana@example.com' } })));
    modal.form.patchValue(validUser);
    modal.submit();
    expect(created).toBe(0);
    expect(modal.error()).toBe('Email já cadastrado: ana@example.com');
  });

  it('shows the default error when the creation fails', () => {
    const modal = createModal();
    createUser.execute.mockReturnValue(throwError(() => new Error('500')));
    modal.form.patchValue(validUser);
    modal.submit();
    expect(modal.error()).toBe('Não foi possível salvar. Confira os dados e tente novamente.');
  });
});
