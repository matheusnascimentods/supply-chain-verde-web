import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewProduct } from '../../../domain/product/index.model';
import { NewProductFormComponent } from './index.component';

describe('NewProductFormComponent', () => {
  let fixture: ComponentFixture<NewProductFormComponent>;
  let submitted: NewProduct[];
  let invalid: number;

  beforeEach(() => {
    submitted = [];
    invalid = 0;
    fixture = TestBed.createComponent(NewProductFormComponent);
    fixture.componentInstance.submitted.subscribe((product) => submitted.push(product));
    fixture.componentInstance.incomplete.subscribe(() => invalid++);
    fixture.detectChanges();
  });

  it('lists the categories and units with their labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alimentos processados');
    expect(text).toContain('Metro cúbico (m³)');
  });

  it('reports an incomplete product', () => {
    fixture.componentInstance.submit();
    expect(invalid).toBe(1);
    expect(submitted).toEqual([]);
  });

  it('emits the new product', () => {
    fixture.componentInstance.form.setValue({ name: 'Café', description: 'Orgânico', category: 'AGRICULTURE', unit: 'KG' });
    fixture.componentInstance.submit();
    expect(submitted).toEqual([{ name: 'Café', description: 'Orgânico', category: 'AGRICULTURE', unit: 'KG' }]);
  });
});
