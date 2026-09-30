import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavComponent } from '../top-nav/index.component';

@Component({
  selector: 'app-shell',
  imports: [TopNavComponent, RouterOutlet],
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {}
