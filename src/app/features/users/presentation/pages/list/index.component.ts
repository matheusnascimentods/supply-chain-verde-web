import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { ErrorToastComponent } from '../../../../../shared/ui/error-toast/index.component';
import { ErrorToastService } from '../../../../../shared/ui/error-toast/index.service';
import { DataTableComponent } from '../../../../../shared/ui/data-table/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { UsersListFacade } from '../../../application/index.facade';
import { seatsUsage } from '../../../domain/index.rules';
import { InviteUserModalComponent } from '../../components/invite-modal/index.component';
import { RoleBadgeComponent } from '../../components/role-badge/index.component';
import { RoleMenuComponent } from '../../components/role-menu/index.component';

@Component({
  selector: 'app-users-list',
  imports: [
    DatePipe,
    FormsModule,
    ButtonComponent,
    ErrorToastComponent,
    DataTableComponent,
    PaginationComponent,
    TextFieldComponent,
    InviteUserModalComponent,
    RoleBadgeComponent,
    RoleMenuComponent,
  ],
  providers: [UsersListFacade],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  protected readonly facade = inject(UsersListFacade);
  private readonly toast = inject(ErrorToastService);
  protected readonly seatsUsage = seatsUsage;
  readonly inviteModalOpen = signal(false);

  // O convidado ainda não é usuário, então a lista não muda (RF-03); o convite pendente já ocupa assento.
  userInvited(email: string): void {
    this.inviteModalOpen.set(false);
    this.toast.success(`Convite enviado para ${email}.`);
    this.facade.loadSeats();
  }
}
