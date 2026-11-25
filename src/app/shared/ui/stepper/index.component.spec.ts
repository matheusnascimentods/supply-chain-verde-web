import { TestBed } from '@angular/core/testing';
import { StepperComponent } from './index.component';

describe('StepperComponent', () => {
  it('lists the steps and marks only the current one', () => {
    const fixture = TestBed.createComponent(StepperComponent);
    fixture.componentRef.setInput('steps', ['Produto', 'Revisão']);
    fixture.componentRef.setInput('current', 1);
    fixture.componentRef.setInput('label', 'Etapas do pedido');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('ol')?.getAttribute('aria-label')).toBe('Etapas do pedido');
    expect([...element.querySelectorAll('.stepper-label')].map((node) => node.textContent)).toEqual(['Produto', 'Revisão']);
    expect([...element.querySelectorAll('li')].map((node) => node.getAttribute('aria-current'))).toEqual([null, 'step']);
  });
});
