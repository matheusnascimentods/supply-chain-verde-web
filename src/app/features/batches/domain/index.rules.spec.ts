import { Batch } from './index.model';
import { canAddStageTo, canCalculateEmission, canCreateBatch } from './index.rules';

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
});
