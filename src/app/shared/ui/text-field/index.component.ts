import { ChangeDetectionStrategy, Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TextFieldType = 'text' | 'search' | 'email' | 'password' | 'date' | 'datetime-local' | 'number' | 'tel';
export type TextFieldValue = string | number | null;

@Component({
  selector: 'app-text-field',
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextFieldComponent), multi: true }],
})
export class TextFieldComponent implements ControlValueAccessor {
  readonly id = input.required<string>();
  readonly label = input('');
  readonly labelHidden = input(false);
  readonly type = input<TextFieldType>('text');
  readonly name = input('');
  readonly placeholder = input('');
  readonly autocomplete = input('');
  readonly inputMode = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly error = input('');
  readonly min = input<string | number | null>(null);
  readonly max = input<string | number | null>(null);
  readonly step = input<string | number | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly valueChange = output<TextFieldValue>();

  protected readonly value = signal('');
  protected readonly formDisabled = signal(false);
  private onChange: (value: TextFieldValue) => void = () => {};
  private onTouched: () => void = () => {};

  protected updateValue(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    const value = this.type() === 'number' ? (next === '' ? null : Number(next)) : next;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  protected markTouched(): void { this.onTouched(); }
  protected get isDisabled(): boolean { return this.disabled() || this.formDisabled(); }

  writeValue(value: TextFieldValue | undefined): void { this.value.set(value == null ? '' : String(value)); }
  registerOnChange(fn: (value: TextFieldValue) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.formDisabled.set(disabled); }
}
