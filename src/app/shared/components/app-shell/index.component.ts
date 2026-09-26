import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from '../app-sidebar/index.component';

@Component({
  selector: 'app-shell',
  imports: [AppSidebarComponent, RouterOutlet],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {}
