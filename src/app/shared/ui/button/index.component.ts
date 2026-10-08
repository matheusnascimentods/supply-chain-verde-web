import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

@Component({
  selector: 'button[appButton], a[appButton]',
  template: '<ng-content />',
  styleUrl: './index.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.shared-button]': 'true',
    '[class.shared-button-primary]': "variant() === 'primary'",
    '[class.shared-button-secondary]': "variant() === 'secondary'",
    '[class.shared-button-danger]': "variant() === 'danger'",
    '[class.shared-button-text]': "variant() === 'text'",
    '[class.shared-button-small]': "size() === 'small'",
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<'normal' | 'small'>('normal');
}
