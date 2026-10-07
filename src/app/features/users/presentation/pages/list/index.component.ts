import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';
import { DataTableComponent } from '../../../../../shared/ui/data-table/index.component';
import { PaginationComponent } from '../../../../../shared/ui/pagination/index.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/index.component';
import { UsersListFacade } from '../../../application/index.facade';
import { CreateUserModalComponent } from '../../components/create-modal/index.component';
import { RoleBadgeComponent } from '../../components/role-badge/index.component';
import { RoleMenuComponent } from '../../components/role-menu/index.component';

@Component({
  selector: 'app-users-list',
  imports: [
    DatePipe,
    FormsModule,
    ButtonComponent,
    DataTableComponent,
    PaginationComponent,
    TextFieldComponent,
    CreateUserModalComponent,
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
  readonly createModalOpen = signal(false);

  userCreated(): void {
    this.createModalOpen.set(false);
    this.facade.reloadFromFirstPage();
  }
}
