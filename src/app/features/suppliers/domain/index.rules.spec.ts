import {
  canGenerateReports,
  canOpenReports,
  certificationTone,
} from './index.rules';
import { SupplierRanking } from './index.model';

describe('suppliers rules', () => {
  it('lets admins, managers and auditors generate reports', () => {
    expect(canGenerateReports('auditor')).toBe(true);
    expect(canGenerateReports('supplier')).toBe(false);
    expect(canGenerateReports(null)).toBe(false);
  });

  it('lets a supplier open only its own reports', () => {
    expect(canOpenReports('supplier', 9, 9)).toBe(true);
    expect(canOpenReports('supplier', 9, 10)).toBe(false);
    expect(canOpenReports('manager', null, 10)).toBe(true);
  });

  it('classifies the certification situation of a supplier', () => {
    const base = { activeCertificationCount: 0, certifications: [] } as unknown as SupplierRanking;
    const expired = { certificationId: 1, certification: 'ISO', issuingBody: 'ABNT', issuedAt: '', expiresAt: '', status: 'EXPIRED' as const };
    expect(certificationTone(base)).toBe('none');
    expect(certificationTone({ ...base, activeCertificationCount: 2 })).toBe('active');
    expect(certificationTone({ ...base, activeCertificationCount: 2, certifications: [expired] })).toBe('expired');
  });
});
