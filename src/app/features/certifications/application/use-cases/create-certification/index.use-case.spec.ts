import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CertificationsRepository } from '../../../infrastructure/index.repository';
import { CreateCertificationUseCase } from './index.use-case';

describe('CreateCertificationUseCase', () => {
  it('registers the certification for the given supplier', () => {
    const repository = { create: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({ providers: [{ provide: CertificationsRepository, useValue: repository }] });
    const input = { certification: 'ISO 14001', issuingBody: 'ABNT', issuedAt: '2026-01-10', expiresAt: '2027-01-10' };

    TestBed.inject(CreateCertificationUseCase).execute(9, input).subscribe();

    expect(repository.create).toHaveBeenCalledWith(9, input);
  });
});
