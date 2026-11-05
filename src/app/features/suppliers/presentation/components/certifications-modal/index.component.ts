import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../../../../../shared/ui/modal/index.component';
import { CertificationListComponent } from '../../../../certifications';
import { SupplierCertification } from '../../../domain/index.model';

/**
 * Consulta das certificações de um fornecedor pelo varejista, só leitura (RF-17): só o próprio fornecedor
 * cadastra e muda o status das certificações (RN-22 da API), na tela Certificações.
 */
@Component({
  selector: 'app-supplier-certifications-modal',
  imports: [CertificationListComponent, ModalComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierCertificationsModalComponent {
  readonly supplierName = input.required<string>();
  readonly certifications = input.required<SupplierCertification[]>();
  readonly dismissed = output<void>();
}
