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
    addresses: ReturnType<typeof signal<{ addressId: number; label: string }[]>>;
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
      addresses: signal([{ addressId: 10, label: 'Fazenda — Campinas/SP' }]),
      submit: vi.fn().mockReturnValue(of({ step: 'stage', chainId: 50 }, { step: 'transport' })),
    };
    TestBed.overrideComponent(BatchStageModalComponent, { set: { providers: [{ provide: AddStageFacade, useValue: facade }] } });
    fixture = TestBed.createComponent(BatchStageModalComponent);
    fixture.componentRef.setInput('batchId', 7);
    fixture.componentInstance.changed.subscribe(() => events.push('changed'));
    fixture.componentInstance.created.subscribe(() => events.push('created'));
    fixture.detectChanges();
  });

  it('requires the transport data only for transport stages', () => {
    const form = fixture.componentInstance.form;
    form.patchValue({ stageType: 'TRANSPORT', startedAt: '2026-10-05T08:30' });
    expect(form.valid).toBe(false);
    form.patchValue({ stageType: 'STORAGE' });
    expect(form.valid).toBe(true);
  });

  it('submits stage, transport and emission and notifies each saved step', () => {
    fixture.componentInstance.form.patchValue({
      stageType: 'TRANSPORT', startedAt: '2026-10-05T08:30', originAddressId: '10',
      transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000, calculateEmission: true, calculationMethod: 'IPCC',
    });
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalledWith({
      batchId: 7,
      stage: { stageType: 'TRANSPORT', startedAt: '2026-10-05T08:30', endedAt: null, originAddressId: 10, destinationAddressId: null },
      transport: { transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000 },
      emissionMethod: 'IPCC',
    });
    expect(events).toEqual(['changed', 'changed', 'created']);
  });

  it('does not submit an invalid new stage but retries a saved one', () => {
    fixture.componentInstance.submit();
    expect(facade.submit).not.toHaveBeenCalled();
    facade.stageSaved.set(true);
    fixture.componentInstance.submit();
    expect(facade.submit).toHaveBeenCalled();
  });
});
