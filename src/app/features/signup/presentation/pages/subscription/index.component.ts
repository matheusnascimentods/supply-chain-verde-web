import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicHeaderComponent } from '../../components/public-header/index.component';

type Seat = 'active' | 'pending' | 'free';

// ponytail: teto fixo no texto; ler de um endpoint público se o teto virar variável por cliente.
const MAX_USERS = 10;

@Component({
  selector: 'app-subscription',
  imports: [RouterLink, PublicHeaderComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionComponent {
  protected readonly maxUsers = MAX_USERS;
  // Exemplo ilustrativo da grade de assentos: 7 ativos, 1 convite pendente, 2 livres.
  protected readonly seats: Seat[] = [...Array(7).fill('active'), 'pending', 'free', 'free'];
  protected readonly steps = [
    { title: 'Convide', text: 'Um convite pendente já reserva o assento até ser aceito ou expirar.' },
    { title: 'Trabalhe', text: 'Cada usuário ativo ocupa um assento, seja qual for o perfil.' },
    { title: 'Desative', text: 'Quem saiu da equipe libera a vaga na hora, sem perder o histórico.' },
  ];
  // Ícones no estilo stroke 24×24 do resto da app.
  protected readonly features = [
    { title: 'Rastreio de lotes', text: 'Da origem ao varejo, etapa por etapa.', icon: 'M3 7l9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4' },
    { title: 'Pegada de carbono', text: 'CO₂ calculado em cada etapa do lote.', icon: 'M20 4c-7 0-12 2-13 7-1 4 2 7 6 6 5-1 7-6 7-13ZM4 21c2-5 5-8 11-11' },
    { title: 'Auditoria', text: 'Histórico de quem mudou o quê e quando.', icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Zm-3 9 2 2 4-4' },
    { title: 'Perfis por função', text: 'Admin, gestor, auditor e fornecedor.', icon: 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 8v-1a3 3 0 0 0-2-2.8M17 5.2a3 3 0 0 1 0 5.6' },
  ];
}
