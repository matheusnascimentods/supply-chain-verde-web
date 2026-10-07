import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CertificationsRepository } from './index.repository';

describe('CertificationsRepository', () => {
  let repository: CertificationsRepository;
  let http: HttpTestingController;
  const apiCertification = {
    certificationId: 5,
    supplierId: 9,
    certification: 'ISO 14001',
    issuingBody: 'ABNT',
    issuedAt: '2026-01-10',
    expiresAt: '2027-01-10',
    status: 'UNDER_REVIEW',
  };
  const newCertification = { certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: '2026-01-10', expiresAt: '2027-01-10' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(CertificationsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registers a certification for the supplier', () => {
    repository.create(9, newCertification).subscribe((certification) => expect(certification).toEqual(apiCertification));
    const request = http.expectOne(`${environment.apiUrl}/suppliers/9/certifications`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(newCertification);
    request.flush(apiCertification);
  });

  it('updates the status using the API enum value', () => {
    repository.updateStatus(5, 'SUSPENDED').subscribe();
    const request = http.expectOne(`${environment.apiUrl}/certifications/5/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'SUSPENDED' });
    request.flush({ ...apiCertification, status: 'SUSPENDED' });
  });

  it('rejects a response with an unknown status', () => {
    let failed = false;
    repository.updateStatus(5, 'ACTIVE').subscribe({ error: () => (failed = true) });
    http.expectOne(`${environment.apiUrl}/certifications/5/status`).flush({ ...apiCertification, status: 'active' });
    expect(failed).toBe(true);
  });
});
