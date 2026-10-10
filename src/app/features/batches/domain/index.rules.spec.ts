import { Batch } from './index.model';
import type { SupplierRanking } from '../../suppliers';
import { canAddStageTo, canCalculateEmission, canCreateBatch, isRecommended } from './index.rules';

describe('batches rules', () => {
  const batch = { currentStage: 'TRANSPORT' } as Batch;

  it('lets admins and suppliers create batches', () => {
    expect(canCreateBatch('admin')).toBe(true);
    expect(canCreateBatch('supplier')).toBe(true);
    expect(canCreateBatch('manager')).toBe(false);
    expect(canCreateBatch('auditor')).toBe(false);
  });

  it('lets admins and managers calculate emissions', () => {
    expect(canCalculateEmission('admin')).toBe(true);
    expect(canCalculateEmission('manager')).toBe(true);
    expect(canCalculateEmission('supplier')).toBe(false);
  });

  it('allows new stages until the batch reaches retail', () => {
    expect(canAddStageTo('manager', batch)).toBe(true);
    expect(canAddStageTo('supplier', { ...batch, currentStage: null })).toBe(true);
    expect(canAddStageTo('admin', { ...batch, currentStage: 'RETAIL' })).toBe(false);
    expect(canAddStageTo('auditor', batch)).toBe(false);
  });

  it('recommends only the first supplier of the first page with emission history', () => {
    const withHistory = { co2KgPerUnit: 0.42 } as SupplierRanking;
    expect(isRecommended(withHistory, 0, 0)).toBe(true);
    expect(isRecommended(withHistory, 1, 0)).toBe(false);
    expect(isRecommended(withHistory, 0, 1)).toBe(false);
    expect(isRecommended({ co2KgPerUnit: null } as SupplierRanking, 0, 0)).toBe(false);
  });
});
