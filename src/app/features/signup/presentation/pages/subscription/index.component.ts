import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from '../../components/public-header/index.component';

@Component({
  selector: 'app-subscription',
  imports: [RouterLink, PublicHeaderComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionComponent {
  // ponytail: teto fixo no texto; ler de um endpoint público se o teto virar variável por cliente.
  protected readonly maxUsers = 10;
  protected readonly features = [
    `Até ${this.maxUsers} usuários ativos`,
    'Desative quem saiu e libere a vaga na hora',
    'Convites pendentes reservam assento',
    'Rastreio de lotes da origem ao varejo',
    'Pegada de carbono por etapa',
    'Histórico de auditoria',
  ];
}
