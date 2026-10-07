import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/index.component';

@Component({
  selector: 'app-pagination',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly disabled = input(false);
  readonly label = input('Paginação');
  readonly previous = output<void>();
  readonly next = output<void>();
}
