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
    marketId: 2,
    marketName: 'Mercado Bom Preço',
    status: 'ACTIVE',
    rejectionReason: null,
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

  it('starts the route at the supplier when the first stage has no origin', () => {
    const bare = { ...batch.stages[0], chainId: 2, stageType: 'PRODUCTION' as const, originAddress: null, destinationAddress: null, transport: null, emission: null };
    const host = render({ ...batch, currentStage: 'TRANSPORT', stages: [bare, batch.stages[0]] });
    expect(host.querySelector('.batch-route-origin')!.textContent).toContain('Fazenda Verde');
    expect(host.querySelector('.batch-timeline-address')!.textContent).toBe('Local não informado');
    expect(host.querySelectorAll('.batch-timeline-details')).toHaveLength(1);
  });

  it('shows the batch status badge', () => {
    expect(render(batch).querySelector('app-status-badge')?.textContent?.trim()).toBe('Em andamento');
  });

  it('shows a pending batch as not produced yet, without a rejection reason', () => {
    const card = render({ ...batch, status: 'PENDING', producedAt: null, stages: [], currentStage: null });
    expect(card.querySelector('app-status-badge')?.textContent?.trim()).toBe('Pendente');
    expect(card.textContent).toContain('Ainda não produzido');
    expect(card.querySelector('[data-testid="batch-rejection"]')).toBeNull();
  });

  it('shows the reason of a rejected batch', () => {
    const card = render({ ...batch, status: 'REJECTED', rejectionReason: 'Produto em entressafra.', producedAt: null, stages: [] });
    expect(card.querySelector('[data-testid="batch-rejection"]')?.textContent).toContain('Produto em entressafra.');
  });

  it('emits reject only when allowed', () => {
    const pending = { ...batch, status: 'PENDING' as const, producedAt: null, stages: [], currentStage: null };
    expect(render(pending).querySelector('.batch-reject')).toBeNull();

    fixture.componentRef.setInput('canReject', true);
    fixture.detectChanges();
    let rejected = 0;
    fixture.componentInstance.reject.subscribe(() => rejected++);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.batch-reject')!.click();
    expect(rejected).toBe(1);
  });
});
