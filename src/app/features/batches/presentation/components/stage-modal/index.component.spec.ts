import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AddStageFacade } from '../../../application/add-stage/index.facade';
import { BatchStageModalComponent } from './index.component';

describe('BatchStageModalComponent', () => {
  let fixture: ComponentFixture<BatchStageModalComponent>;
  let facade: {
    canCalculateEmission: boolean;
    loadingChoices: ReturnType<typeof signal<boolean>>;
    saving: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string>>;
    stageSaved: ReturnType<typeof signal<boolean>>;
    ownAddress: ReturnType<typeof signal<Record<string, string | null> | null>>;
    submit: ReturnType<typeof vi.fn>;
  };
  let events: string[];

  beforeEach(() => {
    events = [];
    facade = {
      canCalculateEmission: true,
      loadingChoices: signal(false),
      saving: signal(false),
      error: signal(''),
      stageSaved: signal(false),
      ownAddress: signal({ street: 'Estrada do Café', number: '100', city: 'Amparo', state: 'SP' }),
      submit: vi.fn().mockReturnValue(of({ step: 'stage', chainId: 50 }, { step: 'transport' })),
    };
    TestBed.overrideComponent(BatchStageModalComponent, { set: { providers: [{ provide: AddStageFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(BatchStageModalComponent);
    fixture.componentRef.setInput('batchId', 7);
    fixture.componentInstance.changed.subscribe(() => events.push('changed'));
    fixture.componentInstance.created.subscribe(() => events.push('created'));
    fixture.detectChanges();
  });

  const destination = { zipCode: '13069-000', state: 'sp', street: ' Rod. Anhanguera ', number: 'km 102', neighborhood: 'Distrito', complement: ' ', city: 'Campinas' };
  const sentDestination = { zipCode: '13069000', state: 'SP', street: 'Rod. Anhanguera', number: 'km 102', neighborhood: 'Distrito', complement: null, city: 'Campinas' };

  function advanceToReview(component = fixture.componentInstance): void {
    component.form.patchValue({ destination });
    component.next();
    if (component.isTransport) {
      component.form.patchValue({ transport: { transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000 } });
    }
    component.next();
  }

  it('requires the transport data only for transport stages', () => {
    const form = fixture.componentInstance.form;
    form.patchValue({ destination });
    expect(form.controls.transport.disabled).toBe(true);
    expect(form.valid).toBe(true);
  });

  it('submits stage, transport and emission and notifies each saved step', () => {
    fixture.componentInstance.form.patchValue({
      stageType: 'TRANSPORT', destination,
      transport: { transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000 }, calculateEmission: true, calculationMethod: 'GHG_PROTOCOL',
    });
    advanceToReview();
    expect(fixture.componentInstance.step()).toBe(2);
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith({
      batchId: 7,
      stage: { stageType: 'TRANSPORT', destination: sentDestination },
      transport: { transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000 },
      emissionMethod: 'GHG_PROTOCOL',
    });
    expect(events).toEqual(['changed', 'changed', 'created']);
  });

  it('does not submit an invalid new stage but retries a saved one', () => {
    fixture.componentInstance.submit();
    expect(facade.submit).not.toHaveBeenCalled();
    advanceToReview();
    facade.stageSaved.set(true);
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalled();
  });

  it('validates each step and waits for confirmation before submitting', () => {
    fixture.componentInstance.next();
    expect(fixture.componentInstance.step()).toBe(0);
    expect(fixture.componentInstance.form.controls.destination.controls.zipCode.touched).toBe(true);

    advanceToReview();
    expect(facade.submit).not.toHaveBeenCalled();
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledTimes(1);
  });

  it('advances on form submit and focuses the new step heading', async () => {
    const component = fixture.componentInstance;
    component.form.patchValue({ destination });
    component.submit();
    expect(component.step()).toBe(1);
    expect(facade.submit).not.toHaveBeenCalled();
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('stage-emission-heading');

    component.next();
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('stage-review-heading');
  });

  it('shows three wizard steps, the stage type in the first one and no date fields', () => {
    expect([...fixture.nativeElement.querySelectorAll('.stepper-label')].map((node: Element) => node.textContent)).toEqual([
      'Origem e destino',
      'Emissão',
      'Revisão',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Produção');
    expect(fixture.nativeElement.querySelector('input[type="datetime-local"]')).toBeNull();
  });

  it('starts a batch without stages at production', () => {
    expect(fixture.componentInstance.form.controls.stageType.value).toBe('PRODUCTION');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Produção');
    expect(text).toContain('Produção → Armazenagem → Processamento → Transporte → Distribuição → Varejo');
    expect(fixture.nativeElement.querySelector('select[formControlName="stageType"]')).toBeNull();
  });

  it('offers transport after processing and requires its data', () => {
    const next = TestBed.createComponent(BatchStageModalComponent);
    next.componentRef.setInput('batchId', 7);
    next.componentRef.setInput('currentStage', 'PROCESSING');
    next.detectChanges();
    const form = next.componentInstance.form;
    expect(form.controls.stageType.value).toBe('TRANSPORT');
    form.patchValue({ destination });
    next.componentInstance.next();
    next.detectChanges();
    expect(next.nativeElement.textContent).toContain('Dados do transporte');
    expect(form.valid).toBe(false);
    form.patchValue({ transport: { transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000 } });
    expect(form.valid).toBe(true);
  });

  it('requires a complete destination and shows the own company as the origin of production', () => {
    const form = fixture.componentInstance.form;
    form.patchValue({ destination: { ...destination, city: '' } });
    expect(form.valid).toBe(false);
    form.patchValue({ destination });
    expect(form.valid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Estrada do Café, 100 – Amparo/SP');
  });

  it('starts at the destination of the previous stage', () => {
    const next = TestBed.createComponent(BatchStageModalComponent);
    next.componentRef.setInput('batchId', 7);
    next.componentRef.setInput('currentStage', 'PRODUCTION');
    next.componentRef.setInput('origin', { addressId: 5, street: 'Rua do Silo', number: '9', city: 'Campinas', state: 'SP' });
    next.detectChanges();
    expect(next.nativeElement.textContent).toContain('Rua do Silo, 9 – Campinas/SP');
  });

  it('ends retail at the own market address without a destination form', () => {
    const retail = TestBed.createComponent(BatchStageModalComponent);
    retail.componentRef.setInput('batchId', 7);
    retail.componentRef.setInput('currentStage', 'DISTRIBUTION');
    retail.detectChanges();
    expect(retail.nativeElement.querySelector('fieldset[formGroupName="destination"]')).toBeNull();
    expect(retail.nativeElement.textContent).toContain('Destino Estrada do Café, 100 – Amparo/SP');
    retail.componentInstance.next();
    retail.componentInstance.next();
    retail.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith(expect.objectContaining({ stage: expect.objectContaining({ stageType: 'RETAIL', destination: null }) }));
  });

  it('submits the next stage of the chain', () => {
    advanceToReview();
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith(expect.objectContaining({ stage: expect.objectContaining({ stageType: 'PRODUCTION' }), transport: null }));
  });
});
