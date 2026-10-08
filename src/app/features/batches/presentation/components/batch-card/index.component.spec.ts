import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Batch } from '../../../domain/index.model';
import { BatchCardComponent } from './index.component';

describe('BatchCardComponent', () => {
  let fixture: ComponentFixture<BatchCardComponent>;
  const address = (city: string) => ({ addressId: 1, city, state: 'SP' });
  const batch: Batch = {
    batchId: 7,
    productId: 3,
    productName: 'Café orgânico',
    supplierId: 9,
    supplierName: 'Fazenda Verde',
    quantity: 1250.5,
    producedAt: '2026-05-20',
    currentStage: 'TRANSPORT',
    stages: [
      {
        chainId: 1, batchId: 7, originAddress: address('Campinas'), destinationAddress: address('Santos'), responsibleUserId: 2,
        responsibleUserName: 'Ana', stageType: 'TRANSPORT', startedAt: '2026-05-21T08:00:00', endedAt: null,
        transport: { transportId: 1, chainId: 1, transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 1000 },
        emission: { emissionId: 1, chainId: 1, emissionFactor: 0.1, co2Kg: 12.5, calculationMethod: 'IPCC', calculatedAt: '2026-05-21' },
      },
    ],
  };

  function render(value: Batch, canAddStage = true): HTMLElement {
    fixture = TestBed.createComponent(BatchCardComponent);
    fixture.componentRef.setInput('batch', value);
    fixture.componentRef.setInput('unit', 'KG');
    fixture.componentRef.setInput('canAddStage', canAddStage);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('exposes the current stage for the color tone', () => {
    expect(render(batch).getAttribute('data-stage')).toBe('TRANSPORT');
    expect(render({ ...batch, currentStage: null, stages: [] }).getAttribute('data-stage')).toBe('CREATED');
  });

  it('shows quantity with unit, journey and stage details', () => {
    const text = render(batch).textContent ?? '';
    expect(text).toContain('1.250,5 kg');
    expect(text).toContain('Campinas, SP');
    expect(text).toContain('Campinas, SP → Santos, SP');
    expect(text).toContain('Transporte');
    expect(text).toContain('Rodoviário · 120 km · DIESEL');
    expect(text).toContain('12.5 kg CO₂e');
  });

  it('falls back to the supplier and an empty journey message', () => {
    const text = render({ ...batch, currentStage: null, stages: [] }).textContent ?? '';
    expect(text).toContain('Etapas ainda não registradas');
    expect(text).toContain('Nenhuma etapa registrada');
  });

  it('emits addStage only when allowed', () => {
    let clicks = 0;
    const host = render(batch);
    fixture.componentInstance.addStage.subscribe(() => clicks++);
    host.querySelector<HTMLButtonElement>('.batch-add-stage')!.click();
    expect(clicks).toBe(1);
    expect(render(batch, false).querySelector('.batch-add-stage')).toBeNull();
  });
});
