import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NewSupplier, Supplier } from '../../../domain/index.model';
import { normalizeNewSupplier } from '../../../domain/index.rules';
import { SuppliersRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class CreateSupplierUseCase {
  private readonly repository = inject(SuppliersRepository);

  execute(supplier: NewSupplier): Observable<Supplier> {
    return this.repository.create(normalizeNewSupplier(supplier));
  }
}
