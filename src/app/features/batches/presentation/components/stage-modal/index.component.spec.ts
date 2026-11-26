import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AddStageFacade } from '../../../application/add-stage/index.facade';
import { BatchStageModalComponent } from './index.component';

describe('BatchStageModalComponent', () => {
  let fixture: ComponentFixture<BatchStageModalComponent>;
  let facade: {
    factors: ReturnType<typeof signal<unknown[]>>;
    startPending: ReturnType<typeof vi.fn>;
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
      factors: signal([
        { calculationMethod: 'GHG_PROTOCOL', transportMode: 'ROAD', fuelType: 'DIESEL', energySource: null, value: 0.10356, unit: 'kg CO₂e/t·km', source: 'GHG Protocol', referenceYear: 2024 },
        { calculationMethod: 'DEFRA', transportMode: 'ROAD', fuelType: 'DIESEL', energySource: null, value: 0.107, unit: 'kg CO₂e/t·km', source: 'DEFRA', referenceYear: 2024 },
        { calculationMethod: 'GHG_PROTOCOL', transportMode: 'AIR', fuelType: 'AVIATION_KEROSENE', energySource: null, value: 1.1, unit: 'kg CO₂e/t·km', source: 'GHG Protocol', referenceYear: 2024 },
        { calculationMethod: 'GHG_PROTOCOL', transportMode: null, fuelType: null, energySource: 'ELECTRICITY', value: 0.0385, unit: 'kg CO₂e/kWh', source: 'MCTI', referenceYear: 2024 },
      ]),
      startPending: vi.fn(),
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

  const transport = { transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000 };

  function create(inputs: Record<string, unknown>): ComponentFixture<BatchStageModalComponent> {
    const other = TestBed.createComponent(BatchStageModalComponent);
    other.componentRef.setInput('batchId', 7);
    for (const [name, value] of Object.entries(inputs)) other.componentRef.setInput(name, value);
    other.detectChanges();
    return other;
  }

  function advanceToReview(component = fixture.componentInstance): void {
    component.form.patchValue({ destination });
    component.next();
    if (component.isTransport) component.form.patchValue({ transport: { ...transport, cargoWeightKg: 800 }, calculationMethod: 'GHG_PROTOCOL' });
    else component.form.patchValue({ consumption: { energySource: 'ELECTRICITY', consumption: 300 }, calculationMethod: 'GHG_PROTOCOL' });
    component.next();
  }

  it('asks the energy consumption of a fixed stage and does not advance without it', () => {
    const component = fixture.componentInstance;
    expect(component.form.controls.transport.disabled).toBe(true);
    component.form.patchValue({ destination });
    component.next();
    component.next();
    expect(component.step()).toBe(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Consumo de energia');
    expect(fixture.nativeElement.textContent).not.toContain('Calcular emissão desta etapa');

    component.form.patchValue({ consumption: { energySource: 'ELECTRICITY', consumption: 300 }, calculationMethod: 'GHG_PROTOCOL' });
    component.next();
    component.submit();
    expect(facade.submit).toHaveBeenCalledWith(
      expect.objectContaining({ transport: null, emission: { calculationMethod: 'GHG_PROTOCOL', energySource: 'ELECTRICITY', consumption: 300 } }),
    );
  });

  it('offers only the methods and fuels with a factor', () => {
    const distribution = create({ currentStage: 'TRANSPORT' });
    const component = distribution.componentInstance;
    component.form.patchValue({ destination });
    component.next();
    component.form.patchValue({ transport: { transportMode: 'AIR' } });
    distribution.detectChanges();
    const fuels = [...distribution.nativeElement.querySelectorAll('select[formControlName="fuelType"] option')].map((node: Element) => node.textContent);
    expect(fuels).toEqual(['Selecione', 'Querosene de aviação']);

    component.form.patchValue({ transport: { transportMode: 'ROAD', fuelType: 'DIESEL' }, calculationMethod: 'DEFRA' });
    expect(component.form.controls.calculationMethod.value).toBe('DEFRA');
    component.form.patchValue({ transport: { transportMode: 'AIR' } });
    expect(component.form.controls.transport.controls.fuelType.value).toBe('');
    expect(component.form.controls.calculationMethod.value).toBe('');
  });

  it('says when no method has a factor for the combination', () => {
    const component = fixture.componentInstance;
    component.form.patchValue({ destination });
    component.next();
    component.form.patchValue({ consumption: { energySource: 'LPG', consumption: 10 } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhuma metodologia tem fator para esta combinação');
  });

  it('submits stage, transport and emission and notifies each saved step', () => {
    const transportStage = create({ currentStage: 'PROCESSING', unit: 'UNIT', quantity: 40 });
    transportStage.componentInstance.changed.subscribe(() => events.push('changed'));
    transportStage.componentInstance.created.subscribe(() => events.push('created'));
    advanceToReview(transportStage.componentInstance);
    expect(transportStage.componentInstance.step()).toBe(2);
    transportStage.detectChanges();
    expect(transportStage.nativeElement.textContent).toContain('fator 0,10356 kg CO₂e/t·km (GHG Protocol, 2024)');
    transportStage.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith({
      batchId: 7,
      stage: { stageType: 'TRANSPORT', destination: sentDestination },
      transport,
      emission: { calculationMethod: 'GHG_PROTOCOL', cargoWeightKg: 800 },
    });
    expect(events).toEqual(['changed', 'changed', 'created']);
  });

  it('locks the cargo weight derived from a batch in tons and sends it as null', () => {
    const distribution = create({ currentStage: 'TRANSPORT', unit: 'TON', quantity: 2 });
    const cargo = distribution.componentInstance.form.controls.transport.controls.cargoWeightKg;
    expect(cargo.disabled).toBe(true);
    expect(cargo.value).toBe(2000);
    advanceToReview(distribution.componentInstance);
    distribution.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith(
      expect.objectContaining({ stage: expect.objectContaining({ stageType: 'DISTRIBUTION' }), emission: { calculationMethod: 'GHG_PROTOCOL', cargoWeightKg: null } }),
    );
  });

  it('requires the cargo weight of a batch in units', () => {
    const distribution = create({ currentStage: 'TRANSPORT', unit: 'UNIT', quantity: 40 });
    const form = distribution.componentInstance.form;
    form.patchValue({ transport, calculationMethod: 'GHG_PROTOCOL' });
    expect(form.controls.transport.valid).toBe(false);
    form.patchValue({ transport: { cargoWeightKg: 800 } });
    expect(form.controls.transport.valid).toBe(true);
  });

  it('calculates the pending emission of a saved stage starting at the emission step', () => {
    const stage = { chainId: 50, stageType: 'TRANSPORT', transport: { transportId: 1, chainId: 50, ...transport }, emission: null };
    const pending = create({ pendingStage: stage, unit: 'KG', quantity: 500 });
    const component = pending.componentInstance;
    expect(facade.startPending).toHaveBeenCalledWith(stage);
    expect([...pending.nativeElement.querySelectorAll('.stepper-label')].map((node: Element) => node.textContent)).toEqual(['Emissão', 'Revisão']);
    expect(pending.nativeElement.querySelector('#stage-modal-title').textContent).toBe('Calcular emissão');
    expect(component.form.controls.transport.controls.distance.disabled).toBe(true);

    component.form.patchValue({ calculationMethod: 'DEFRA' });
    component.next();
    component.submit();
    expect(facade.submit).toHaveBeenCalledWith({
      batchId: 7,
      stage: { stageType: 'TRANSPORT', destination: null },
      transport: null,
      emission: { calculationMethod: 'DEFRA', cargoWeightKg: null },
    });
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

    component.form.patchValue({ consumption: { energySource: 'ELECTRICITY', consumption: 300 }, calculationMethod: 'GHG_PROTOCOL' });
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

  it('requires a complete destination and shows the own company as the origin of production', () => {
    const destinationGroup = fixture.componentInstance.form.controls.destination;
    destinationGroup.patchValue({ ...destination, city: '' });
    expect(destinationGroup.valid).toBe(false);
    destinationGroup.patchValue(destination);
    expect(destinationGroup.valid).toBe(true);
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
    advanceToReview(retail.componentInstance);
    retail.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith(expect.objectContaining({ stage: expect.objectContaining({ stageType: 'RETAIL', destination: null }) }));
  });

  it('submits the next stage of the chain', () => {
    advanceToReview();
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith(expect.objectContaining({ stage: expect.objectContaining({ stageType: 'PRODUCTION' }), transport: null }));
  });
});
