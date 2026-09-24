import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ConfirmDialogComponent } from './index.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;
  let componentRef: ComponentRef<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default title and button texts when open', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('#confirm-dialog-title');
    const cancelBtn = compiled.querySelector('[data-testid="dialog-cancel-button"]');
    const confirmBtn = compiled.querySelector('[data-testid="dialog-confirm-button"]');

    expect(titleEl?.textContent?.trim()).toBe('Confirmação');
    expect(cancelBtn?.textContent?.trim()).toBe('Cancelar');
    expect(confirmBtn?.textContent?.trim()).toBe('Confirmar');
  });

  it('should render custom inputs properly', () => {
    componentRef.setInput('title', 'Excluir Fornecedor?');
    componentRef.setInput('message', 'Esta ação é irreversível.');
    componentRef.setInput('confirmText', 'Sim, excluir');
    componentRef.setInput('cancelText', 'Não, voltar');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('#confirm-dialog-title');
    const descEl = compiled.querySelector('#confirm-dialog-description');
    const confirmBtn = compiled.querySelector('[data-testid="dialog-confirm-button"]');
    const cancelBtn = compiled.querySelector('[data-testid="dialog-cancel-button"]');

    expect(titleEl?.textContent?.trim()).toBe('Excluir Fornecedor?');
    expect(descEl?.textContent?.trim()).toBe('Esta ação é irreversível.');
    expect(confirmBtn?.textContent?.trim()).toBe('Sim, excluir');
    expect(cancelBtn?.textContent?.trim()).toBe('Não, voltar');
  });

  it('should not render dialog DOM when isOpen is false', () => {
    componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dialog = compiled.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
  });

  it('should emit confirm when confirm button is clicked', () => {
    let confirmed = false;
    component.confirm.subscribe(() => {
      confirmed = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const confirmBtn = compiled.querySelector('[data-testid="dialog-confirm-button"]') as HTMLButtonElement;
    confirmBtn.click();

    expect(confirmed).toBe(true);
  });

  it('should emit cancel when cancel button is clicked', () => {
    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const cancelBtn = compiled.querySelector('[data-testid="dialog-cancel-button"]') as HTMLButtonElement;
    cancelBtn.click();

    expect(cancelled).toBe(true);
  });

  it('should emit cancel when close (X) button is clicked', () => {
    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const closeBtn = compiled.querySelector('[data-testid="dialog-close-button"]') as HTMLButtonElement;
    closeBtn.click();

    expect(cancelled).toBe(true);
  });

  it('should emit cancel when clicking directly on the backdrop', () => {
    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const backdrop = compiled.querySelector('[data-testid="dialog-backdrop"]') as HTMLElement;
    backdrop.click();

    expect(cancelled).toBe(true);
  });

  it('should NOT emit cancel when clicking inside the dialog container', () => {
    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('[data-testid="dialog-container"]') as HTMLElement;
    container.click();

    expect(cancelled).toBe(false);
  });

  it('should emit cancel on Escape keydown when open', () => {
    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    fixture.nativeElement.dispatchEvent(event);

    expect(cancelled).toBe(true);
  });

  it('should NOT emit cancel on Escape keydown when isOpen is false', () => {
    componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    let cancelled = false;
    component.cancel.subscribe(() => {
      cancelled = true;
    });

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    fixture.nativeElement.dispatchEvent(event);

    expect(cancelled).toBe(false);
  });

  it('should satisfy accessibility requirements (role, aria-modal, labels)', () => {
    componentRef.setInput('message', 'Mensagem de teste de acessibilidade');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dialog = compiled.querySelector('[role="dialog"]');

    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('confirm-dialog-title');
    expect(dialog?.getAttribute('aria-describedby')).toBe('confirm-dialog-description');
  });

  it('should apply red styling for danger variant and emerald styling for primary variant', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const confirmBtn = compiled.querySelector('[data-testid="dialog-confirm-button"]') as HTMLButtonElement;

    expect(confirmBtn.className).toContain('bg-red-600');

    componentRef.setInput('variant', 'primary');
    fixture.detectChanges();

    expect(confirmBtn.className).toContain('bg-emerald-600');
  });
});
