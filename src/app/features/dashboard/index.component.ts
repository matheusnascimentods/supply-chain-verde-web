import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '../../core/session/index.schema';
import { SessionService } from '../../core/session/index.service';
import { DASHBOARDS } from './index.constants';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly session = inject(SessionService);

  readonly metrics = [
    { label: 'Lotes Ativos', value: '24' },
    { label: 'Certificações Expirando', value: '5' },
    { label: 'Fornecedores Ativos', value: '18' },
    { label: 'Emissão Total (mês)', value: '342 kg CO2e' },
  ];

  readonly recentBatches = [
    { product: 'Café Orgânico Especial', supplier: 'Fazenda Verde Ltda', quantity: '500 kg', status: 'Em trânsito' },
    { product: 'Cacau Fino', supplier: 'Sítio Bom Fruto', quantity: '320 kg', status: 'Concluído' },
    { product: 'Mel Silvestre', supplier: 'Apiário Cerrado', quantity: '150 kg', status: 'Concluído' },
    { product: 'Castanha do Pará', supplier: 'Coop. Amazônia', quantity: '800 kg', status: 'Pendente' },
  ];

  readonly role = this.session.role;
  readonly roleLabel = computed(() => {
    const role = this.role();
    if (!role) return 'Visitante';

    const labels: Record<UserRole, string> = {
      admin: 'Administrador',
      manager: 'Gestor',
      auditor: 'Auditor',
      supplier: 'Fornecedor',
    };
    return labels[role];
  });
  readonly content = computed(() => {
    const role = this.role();
    return role ? DASHBOARDS[role] : null;
  });
}
