import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { EnumSelectComponent } from './index.component';

describe('EnumSelectComponent', () => {
  let fixture: ComponentFixture<EnumSelectComponent>;
  let component: EnumSelectComponent;
  let componentRef: ComponentRef<EnumSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnumSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnumSelectComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render options passed as string array', () => {
    componentRef.setInput('options', ['AGRICULTURE', 'PROCESSING', 'LOGISTICS']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const options = compiled.querySelectorAll('select option');

    // 1 placeholder + 3 options = 4
    expect(options.length).toBe(4);
    expect(options[1].getAttribute('value')).toBe('AGRICULTURE');
    expect(options[1].textContent?.trim()).toBe('AGRICULTURE');
    expect(options[2].getAttribute('value')).toBe('PROCESSING');
    expect(options[3].getAttribute('value')).toBe('LOGISTICS');
  });

  it('should render options passed from a ZodEnum object with options property', () => {
    const mockZodEnum = {
      options: ['PENDING', 'VALID', 'EXPIRED'],
    };
    componentRef.setInput('options', mockZodEnum);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const options = compiled.querySelectorAll('select option');

    expect(options.length).toBe(4);
    expect(options[1].getAttribute('value')).toBe('PENDING');
    expect(options[2].getAttribute('value')).toBe('VALID');
    expect(options[3].getAttribute('value')).toBe('EXPIRED');
  });

  it('should use custom label mapping from labels input', () => {
    componentRef.setInput('options', ['PENDING', 'VALID']);
    componentRef.setInput('labels', {
      PENDING: 'Pendente de Análise',
      VALID: 'Válida',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const options = compiled.querySelectorAll('select option');

    expect(options[1].textContent?.trim()).toBe('Pendente de Análise');
    expect(options[2].textContent?.trim()).toBe('Válida');
  });

  it('should emit valueChange on change event', () => {
    componentRef.setInput('options', ['A', 'B']);
    fixture.detectChanges();

    let selectedValue = '';
    component.valueChange.subscribe((val) => {
      selectedValue = val;
    });

    const selectEl = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    selectEl.value = 'B';
    selectEl.dispatchEvent(new Event('change'));

    expect(selectedValue).toBe('B');
  });

  it('should support ControlValueAccessor writeValue and setDisabledState', () => {
    componentRef.setInput('options', ['ITEM_1', 'ITEM_2']);
    fixture.detectChanges();

    component.writeValue('ITEM_2');
    fixture.detectChanges();

    const selectEl = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(selectEl.value).toBe('ITEM_2');

    component.setDisabledState(true);
    fixture.detectChanges();
    expect(selectEl.disabled).toBe(true);
  });

  it('should call onChange and onTouched when value changes', () => {
    let changedVal = '';
    let touched = false;

    component.registerOnChange((val) => {
      changedVal = val;
    });
    component.registerOnTouched(() => {
      touched = true;
    });

    componentRef.setInput('options', ['OPTION_1']);
    fixture.detectChanges();

    const selectEl = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    selectEl.value = 'OPTION_1';
    selectEl.dispatchEvent(new Event('change'));

    expect(changedVal).toBe('OPTION_1');
    expect(touched).toBe(true);
  });

  it('should render error message and set aria-invalid when error input is provided', () => {
    componentRef.setInput('error', 'Campo obrigatório');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const selectEl = compiled.querySelector('select');
    const errorEl = compiled.querySelector('[data-testid="enum-select-error"]');

    expect(selectEl?.getAttribute('aria-invalid')).toBe('true');
    expect(errorEl?.textContent?.trim()).toBe('Campo obrigatório');
  });
});
