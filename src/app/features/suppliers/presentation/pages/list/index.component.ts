import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { DataTableComponent } from '../../../../../shared/ui/data-table/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { formatNumberBr } from '../../../../../shared/utils/format/index.utils';
import { SuppliersListFacade } from '../../../application/index.facade';
import { SupplierRanking } from '../../../domain/index.model';
import { certificationTone } from '../../../domain/index.rules';
import { displayCnpj } from '../../../domain/value-objects/cnpj/index.vo';
import { SupplierCertificationsModalComponent } from '../../components/certifications-modal/index.component';
import { SupplierReportsModalComponent } from '../../components/reports-modal/index.component';

@Component({
  selector: 'app-suppliers-list',
  imports: [
    RouterLink,
    FormsModule,
    SupplierReportsModalComponent,
    SupplierCertificationsModalComponent,
    ButtonComponent,
    DataTableComponent,
    PaginationComponent,
    TextFieldComponent,
  ],
  providers: [SuppliersListFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierListComponent {
  protected readonly facade = inject(SuppliersListFacade);
  protected readonly cnpj = displayCnpj;
  protected readonly number = formatNumberBr;
  protected readonly certificationTone = certificationTone;

  protected certificationLabel(supplier: SupplierRanking): string {
    const expired = supplier.certifications.filter((certification) => certification.status === 'EXPIRED').length;
    if (expired > 0) return `${expired} ${expired === 1 ? 'expirada' : 'expiradas'}`;
    const active = supplier.activeCertificationCount;
    return active > 0 ? `${active} ${active === 1 ? 'ativa' : 'ativas'}` : 'Nenhuma ativa';
  }
}
