import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type EnumInputSource =
  | readonly string[]
  | { options: readonly string[] }
  | null
  | undefined;

@Component({
  selector: 'app-enum-select',
  templateUrl: './index.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EnumSelectComponent),
      multi: true,
    },
  ],
})
export class EnumSelectComponent implements ControlValueAccessor {
  readonly options = input<EnumInputSource>(null);
  readonly value = input<string>('');
  readonly id = input<string>('enum-select');
  readonly name = input<string>('');
  readonly label = input<string>('');
  readonly placeholder = input<string>('Selecione...');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly error = input<string>('');
  readonly labels = input<Record<string, string>>({});

  readonly valueChange = output<string>();

  private readonly internalValue = signal<string>('');
  private readonly isFormDisabled = signal<boolean>(false);

  protected readonly effectiveValue = computed(() => {
    return this.internalValue() || this.value();
  });

  protected readonly effectiveDisabled = computed(() => {
    return this.isFormDisabled() || this.disabled();
  });

  protected readonly parsedOptions = computed<readonly string[]>(() => {
    const opts = this.options();
    if (!opts) {
      return [];
    }
    if (Array.isArray(opts)) {
      return opts;
    }
    if (typeof opts === 'object' && 'options' in opts && Array.isArray(opts.options)) {
      return opts.options;
    }
    return [];
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  getOptionLabel(opt: string): string {
    return this.labels()[opt] ?? opt;
  }

  onSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newValue = select.value;
    this.internalValue.set(newValue);
    this.onChange(newValue);
    this.onTouched();
    this.valueChange.emit(newValue);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(val: string | null | undefined): void {
    this.internalValue.set(val ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isFormDisabled.set(isDisabled);
  }
}
