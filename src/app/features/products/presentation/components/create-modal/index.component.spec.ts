import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductsRepository } from '../../../infrastructure/index.repository';
import { ProductCreateModalComponent } from './index.component';

describe('ProductCreateModalComponent', () => {
  let fixture: ComponentFixture<ProductCreateModalComponent>;
  let create: ReturnType<typeof vi.fn>;
  let created: number;

  beforeEach(() => {
    created = 0;
    create = vi.fn().mockReturnValue(of({ productId: 11 }));
    TestBed.configureTestingModule({ providers: [{ provide: ProductsRepository, useValue: { create } }] });
    fixture = TestBed.createComponent(ProductCreateModalComponent);
    fixture.componentInstance.created.subscribe(() => created++);
    fixture.detectChanges();
  });

  const element = () => fixture.nativeElement as HTMLElement;
  const submitForm = () => {
    element().querySelector('form')!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  it('requires name, category and unit, ignoring a blank name', () => {
    fixture.componentInstance.form.patchValue({ name: '   ' });
    submitForm();
    expect(create).not.toHaveBeenCalled();
    expect(element().textContent).toContain('Informe o nome do produto.');
    expect(element().textContent).toContain('Selecione a categoria.');
    expect(element().textContent).toContain('Selecione a unidade.');
  });

  it('creates the product through the form submit, trimming the text', () => {
    fixture.componentInstance.form.setValue({ name: ' Café orgânico ', category: 'AGRICULTURE', unit: 'KG', description: ' Grãos arábica ' });
    const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
    element().querySelector('form')!.dispatchEvent(submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
    expect(create).toHaveBeenCalledWith({ name: 'Café orgânico', category: 'AGRICULTURE', unit: 'KG', description: 'Grãos arábica' });
    expect(created).toBe(1);
  });

  it('shows the API message when the creation is refused', () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Nome do produto é obrigatório.' } })));
    fixture.componentInstance.form.setValue({ name: 'Café', category: 'AGRICULTURE', unit: 'KG', description: '' });
    submitForm();
    expect(created).toBe(0);
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('Nome do produto é obrigatório.');
    expect(fixture.componentInstance.saving()).toBe(false);
  });
});
