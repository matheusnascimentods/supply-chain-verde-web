import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NewSupplier, Supplier } from '../../../domain/index.model';
import { normalizeNewSupplier } from '../../../domain/index.rules';
import { SuppliersRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class UpdateSupplierUseCase {
  private readonly repository = inject(SuppliersRepository);

  execute(supplierId: number, supplier: NewSupplier): Observable<Supplier> {
    return this.repository.update(supplierId, normalizeNewSupplier(supplier));
  }
}
