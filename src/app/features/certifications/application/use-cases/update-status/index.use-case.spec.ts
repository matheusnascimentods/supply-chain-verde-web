import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CertificationsRepository } from '../../../infrastructure/index.repository';
import { UpdateCertificationStatusUseCase } from './index.use-case';

describe('UpdateCertificationStatusUseCase', () => {
  it('updates the status of the certification', () => {
    const repository = { updateStatus: vi.fn().mockReturnValue(of({})) };
    TestBed.configureTestingModule({ providers: [{ provide: CertificationsRepository, useValue: repository }] });

    TestBed.inject(UpdateCertificationStatusUseCase).execute(5, 'EXPIRED').subscribe();

    expect(repository.updateStatus).toHaveBeenCalledWith(5, 'EXPIRED');
  });
});
