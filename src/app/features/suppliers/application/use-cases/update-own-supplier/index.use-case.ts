import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { digitsOnly } from '../../../../../shared/utils/format/index.utils';
import { OwnSupplierPatch, OwnSupplierProfile, PasswordChange, Supplier } from '../../../domain/index.model';
import { SuppliersRepository } from '../../../infrastructure/index.repository';

@Injectable({ providedIn: 'root' })
export class UpdateOwnSupplierUseCase {
  private readonly repository = inject(SuppliersRepository);

  /** Envia só o que mudou em relação ao carregado; sem mudanças, não chama a API. */
  execute(initial: OwnSupplierProfile, current: OwnSupplierProfile, password: PasswordChange): Observable<Supplier | null> {
    const patch: OwnSupplierPatch = {};
    if (current.name !== initial.name) patch.name = current.name;
    if (digitsOnly(current.phone) !== digitsOnly(initial.phone)) patch.phone = digitsOnly(current.phone);
    if (JSON.stringify(current.address) !== JSON.stringify(initial.address)) patch.address = current.address;
    if (current.userName !== initial.userName) patch.userName = current.userName;
    if (password.newPassword) {
      patch.currentPassword = password.currentPassword;
      patch.newPassword = password.newPassword;
    }
    return Object.keys(patch).length ? this.repository.updateOwn(patch) : of(null);
  }
}
