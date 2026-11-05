import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/ui/button/index.component';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink, ButtonComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHeaderComponent {}
