import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionService } from '../../../../../core/auth/session/index.service';
import { EnumSelectComponent } from '../../../../../shared/ui/enum-select/index.component';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { apiErrorMessage } from '../../../../../shared/utils/http/index.utils';
import { PagedSearch } from '../../../../batches/application/paged-search/index.helper';
import { SupplierRanking, SuppliersRepository } from '../../../../suppliers';
import { CreateUserUseCase } from '../../../application/use-cases/create-user/index.use-case';
import { newUserSchema } from '../../../domain/index.model';
import { creatableRoles } from '../../../domain/index.rules';

@Component({
  selector: 'app-create-user-modal',
  imports: [ReactiveFormsModule, EnumSelectComponent, ModalComponent, PaginationComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly createUser = inject(CreateUserUseCase);
  private readonly suppliersRepository = inject(SuppliersRepository);

  readonly created = output<void>();
  readonly dismissed = output<void>();

  protected readonly roles = creatableRoles(inject(SessionService).role());
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    role: ['', [Validators.required]],
    supplierId: [null as number | null],
  });
  // Só fornecedores ainda sem usuário podem receber um acesso SUPPLIER.
  readonly suppliers = new PagedSearch<SupplierRanking>(
    (query) => this.suppliersRepository.loadRanking({ ...query, withoutUser: true }),
    { load: 'Não foi possível carregar os fornecedores.', page: 'Não foi possível carregar esta página de fornecedores.' },
    (message) => this.error.set(message),
    inject(DestroyRef),
  );

  constructor() {
    const { role, supplierId } = this.form.controls;
    role.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value === 'supplier') {
        supplierId.setValidators(Validators.required);
        this.suppliers.load();
      } else {
        supplierId.clearValidators();
        supplierId.setValue(null);
      }
      supplierId.updateValueAndValidity();
    });
    if (this.roles.length === 1) role.setValue(this.roles[0]);
  }

  searchSuppliers(event: Event): void {
    this.suppliers.searchFor((event.target as HTMLInputElement).value);
  }

  submit(): void {
    const parsed = newUserSchema.safeParse(this.form.getRawValue());
    if (this.form.invalid || !parsed.success) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.createUser.execute(parsed.data).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(error, 'Não foi possível salvar. Confira os dados e tente novamente.'));
      },
    });
  }
}
