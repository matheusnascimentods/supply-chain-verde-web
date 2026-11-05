import { Batch } from './index.model';
import type { SupplierRanking } from '../../suppliers';
import { canAddStageTo, canCalculateEmission, canCreateBatch, isRecommended } from './index.rules';

describe('batches rules', () => {
  const batch = { currentStage: 'TRANSPORT', status: 'ACTIVE' } as Batch;

  it('lets only retailer admins and managers request batches', () => {
    expect(canCreateBatch('admin', 'market')).toBe(true);
    expect(canCreateBatch('manager', 'market')).toBe(true);
    expect(canCreateBatch('auditor', 'market')).toBe(false);
    expect(canCreateBatch('admin', 'supplier')).toBe(false);
    expect(canCreateBatch('supplier', 'supplier')).toBe(false);
    expect(canCreateBatch('platform_admin', null)).toBe(false);
  });

  it('lets admins and managers calculate emissions', () => {
    expect(canCalculateEmission('admin')).toBe(true);
    expect(canCalculateEmission('manager')).toBe(true);
    expect(canCalculateEmission('supplier')).toBe(false);
  });

  it('allows new stages on an active batch until it reaches retail', () => {
    expect(canAddStageTo('manager', 'market', batch)).toBe(true);
    expect(canAddStageTo('supplier', 'supplier', { ...batch, currentStage: null })).toBe(true);
    expect(canAddStageTo('admin', 'market', { ...batch, currentStage: 'RETAIL' })).toBe(false);
    expect(canAddStageTo('auditor', 'market', batch)).toBe(false);
  });

  it('blocks rejected batches and leaves pending ones to the supplier company', () => {
    const pending = { ...batch, status: 'PENDING', currentStage: null } as Batch;
    expect(canAddStageTo('admin', 'supplier', { ...batch, status: 'REJECTED' })).toBe(false);
    expect(canAddStageTo('supplier', 'supplier', pending)).toBe(true);
    expect(canAddStageTo('admin', 'supplier', pending)).toBe(true);
    expect(canAddStageTo('admin', 'market', pending)).toBe(false);
    expect(canAddStageTo('manager', 'market', pending)).toBe(false);
  });

  it('recommends only the first supplier of the first page with emission history', () => {
    const withHistory = { co2KgPerUnit: 0.42 } as SupplierRanking;
    expect(isRecommended(withHistory, 0, 0)).toBe(true);
    expect(isRecommended(withHistory, 1, 0)).toBe(false);
    expect(isRecommended(withHistory, 0, 1)).toBe(false);
    expect(isRecommended({ co2KgPerUnit: null } as SupplierRanking, 0, 0)).toBe(false);
  });
});
