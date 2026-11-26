import { Batch } from './index.model';
import type { Product } from '../../products';
import {
  canAddStageTo,
  canCalculateEmission,
  canCalculatePendingEmission,
  canCancel,
  canCreateBatch,
  canReject,
  derivedCargoWeightKg,
  fuelsFor,
  isRecommended,
  methodsFor,
  pendingEmissionStage,
} from './index.rules';

describe('batches rules', () => {
  const batch = { currentStage: 'TRANSPORT', status: 'ACTIVE', stages: [] } as unknown as Batch;

  it('lets only retailer admins and managers request batches', () => {
    expect(canCreateBatch('admin', 'market')).toBe(true);
    expect(canCreateBatch('manager', 'market')).toBe(true);
    expect(canCreateBatch('auditor', 'market')).toBe(false);
    expect(canCreateBatch('admin', 'supplier')).toBe(false);
    expect(canCreateBatch('supplier', 'supplier')).toBe(false);
    expect(canCreateBatch('platform_admin', null)).toBe(false);
  });

  it('lets admins, managers and suppliers calculate emissions', () => {
    expect(canCalculateEmission('admin')).toBe(true);
    expect(canCalculateEmission('manager')).toBe(true);
    expect(canCalculateEmission('supplier')).toBe(true);
    expect(canCalculateEmission('auditor')).toBe(false);
  });

  // [etapa atual, status, fornecedor (supplier e admin), mercado (manager e admin)]
  it.each([
    [null, 'PENDING', true, false],
    ['STORAGE', 'ACTIVE', true, false],
    ['TRANSPORT', 'ACTIVE', true, false],
    ['DISTRIBUTION', 'ACTIVE', false, true],
    ['RETAIL', 'COMPLETED', false, false],
    [null, 'REJECTED', false, false],
    [null, 'CANCELED', false, false],
  ] as const)('leaves the stage after %s (%s) to its owner side', (currentStage, status, supplier, market) => {
    const target = { currentStage, status, stages: [] } as unknown as Batch;
    expect(canAddStageTo('supplier', 'supplier', target)).toBe(supplier);
    expect(canAddStageTo('admin', 'supplier', target)).toBe(supplier);
    expect(canAddStageTo('manager', 'market', target)).toBe(market);
    expect(canAddStageTo('admin', 'market', target)).toBe(market);
    expect(canAddStageTo('auditor', 'market', target)).toBe(false);
    expect(canAddStageTo('platform_admin', null, target)).toBe(false);
  });

  const withLast = (stageType: string, emission: unknown, status = 'ACTIVE') =>
    ({ currentStage: stageType, status, stages: [{ chainId: 1, stageType, emission: {} }, { chainId: 2, stageType, emission }] }) as unknown as Batch;

  it('finds the last stage without emission', () => {
    expect(pendingEmissionStage(withLast('STORAGE', null))?.chainId).toBe(2);
    expect(pendingEmissionStage(withLast('STORAGE', {}))).toBeNull();
    expect(pendingEmissionStage(batch)).toBeNull();
  });

  it('blocks the next stage while the last one has no emission', () => {
    expect(canAddStageTo('supplier', 'supplier', withLast('STORAGE', {}))).toBe(true);
    expect(canAddStageTo('supplier', 'supplier', withLast('STORAGE', null))).toBe(false);
  });

  // [etapa pendente, status, fornecedor (supplier e admin), mercado (manager e admin)]
  it.each([
    ['STORAGE', 'ACTIVE', true, false],
    ['DISTRIBUTION', 'ACTIVE', true, false],
    ['RETAIL', 'COMPLETED', false, true],
  ] as const)('leaves the pending emission of %s (%s) to its owner side', (stageType, status, supplier, market) => {
    const target = withLast(stageType, null, status);
    expect(canCalculatePendingEmission('supplier', 'supplier', target)).toBe(supplier);
    expect(canCalculatePendingEmission('admin', 'supplier', target)).toBe(supplier);
    expect(canCalculatePendingEmission('manager', 'market', target)).toBe(market);
    expect(canCalculatePendingEmission('admin', 'market', target)).toBe(market);
    expect(canCalculatePendingEmission('auditor', 'market', target)).toBe(false);
    expect(canCalculatePendingEmission('platform_admin', null, target)).toBe(false);
    expect(canCalculatePendingEmission('supplier', 'supplier', withLast(stageType, {}, status))).toBe(false);
  });

  it('lets only the supplier company reject a pending batch', () => {
    const pending = { ...batch, status: 'PENDING' } as Batch;
    expect(canReject('supplier', 'supplier', pending)).toBe(true);
    expect(canReject('admin', 'supplier', pending)).toBe(true);
    expect(canReject('admin', 'market', pending)).toBe(false);
    expect(canReject('manager', 'market', pending)).toBe(false);
    expect(canReject('platform_admin', null, pending)).toBe(false);
    expect(canReject('supplier', 'supplier', batch)).toBe(false);
    expect(canReject('supplier', 'supplier', { ...batch, status: 'REJECTED' })).toBe(false);
    expect(canReject('supplier', 'supplier', { ...batch, status: 'COMPLETED' })).toBe(false);
    expect(canReject('supplier', 'supplier', { ...batch, status: 'CANCELED' })).toBe(false);
  });

  it('lets only the market company cancel a pending batch', () => {
    const pending = { ...batch, status: 'PENDING' } as Batch;
    expect(canCancel('manager', 'market', pending)).toBe(true);
    expect(canCancel('admin', 'market', pending)).toBe(true);
    expect(canCancel('auditor', 'market', pending)).toBe(false);
    expect(canCancel('admin', 'supplier', pending)).toBe(false);
    expect(canCancel('supplier', 'supplier', pending)).toBe(false);
    expect(canCancel('platform_admin', null, pending)).toBe(false);
    for (const status of ['ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELED'] as const) {
      expect(canCancel('manager', 'market', { ...batch, status })).toBe(false);
    }
  });

  it('recommends only the first product of the first page with emission history', () => {
    const withHistory = { co2KgPerUnit: 0.42 } as Product;
    expect(isRecommended(withHistory, 0, 0)).toBe(true);
    expect(isRecommended(withHistory, 1, 0)).toBe(false);
    expect(isRecommended(withHistory, 0, 1)).toBe(false);
    expect(isRecommended({ co2KgPerUnit: null } as Product, 0, 0)).toBe(false);
  });

  it('derives cargo weight only for KG and TON', () => {
    expect(derivedCargoWeightKg('KG', 125)).toBe(125);
    expect(derivedCargoWeightKg('TON', 2.5)).toBe(2500);
    expect(derivedCargoWeightKg('LITER', 10)).toBeNull();
    expect(derivedCargoWeightKg('UNIT', 10)).toBeNull();
    expect(derivedCargoWeightKg('M3', 10)).toBeNull();
    expect(derivedCargoWeightKg(undefined, 10)).toBeNull();
  });

  it('filters methods and fuels by emission factors', () => {
    const factors = [
      { calculationMethod: 'GHG_PROTOCOL', transportMode: 'ROAD', fuelType: 'DIESEL', energySource: null, value: 0.1, unit: 'kg CO₂e/t·km', source: 'Teste', referenceYear: 2026 },
      { calculationMethod: 'DEFRA', transportMode: 'AIR', fuelType: 'AVIATION_KEROSENE', energySource: null, value: 0.2, unit: 'kg CO₂e/t·km', source: 'Teste', referenceYear: 2026 },
      { calculationMethod: 'GHG_PROTOCOL', transportMode: null, fuelType: null, energySource: 'ELECTRICITY', value: 0.0461, unit: 'kgCO2/kWh', source: 'MCTI/SIRENE', referenceYear: 2025 },
    ] as const;
    expect(methodsFor([...factors], { transportMode: 'ROAD', fuelType: 'DIESEL' })).toEqual(['GHG_PROTOCOL']);
    expect(methodsFor([...factors], { transportMode: 'AIR', fuelType: 'AVIATION_KEROSENE' })).toEqual(['DEFRA']);
    expect(methodsFor([], { transportMode: 'ROAD', fuelType: 'DIESEL' })).toEqual([]);
    expect(methodsFor([...factors], { energySource: 'ELECTRICITY' })).toEqual(['GHG_PROTOCOL']);
    expect(fuelsFor([...factors], 'AIR')).toEqual(['AVIATION_KEROSENE']);
  });
});
