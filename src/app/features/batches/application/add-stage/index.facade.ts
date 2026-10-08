import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { SessionService } from '../../../../core/auth/session/index.service';
import { Supplier, SuppliersRepository } from '../../../suppliers';
import { canCalculateEmission } from '../../domain/index.rules';
import {
  AdvanceStageError,
  AdvanceStageProgress,
  AdvanceStageStep,
  AdvanceStageUseCase,
  StageProgress,
  StageSubmission,
} from '../use-cases/advance-stage/index.use-case';

export interface AddressOption {
  addressId: number;
  label: string;
}

const FAILURE_MESSAGES: Record<AdvanceStageStep, string> = {
  stage: 'Não foi possível registrar a etapa. Confira os dados e tente novamente.',
  transport: 'A etapa foi registrada, mas não foi possível salvar os dados do transporte. Você pode tentar novamente.',
  emission: 'A etapa foi registrada, mas não foi possível calcular a emissão. Você pode tentar novamente.',
};

@Injectable()
export class AddStageFacade {
  private readonly currentUser = inject(CurrentUserService);
  private readonly suppliers = inject(SuppliersRepository);
  private readonly advanceStage = inject(AdvanceStageUseCase);
  private readonly role = inject(SessionService).role();
  private responsibleUserId: number | null = null;
  private progress: StageProgress = { chainId: null, transportSaved: false, emissionSaved: false };

  readonly canCalculateEmission = canCalculateEmission(this.role);
  readonly loadingChoices = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly addresses = signal<AddressOption[]>([]);
  readonly stageSaved = signal(false);

  constructor() {
    this.loadChoices();
  }

  submit(submission: Omit<StageSubmission, 'responsibleUserId'>): Observable<AdvanceStageProgress> | null {
    if (!this.responsibleUserId) {
      this.error.set('Não foi possível identificar o usuário responsável pela etapa.');
      return null;
    }
    this.saving.set(true);
    this.error.set('');
    return this.advanceStage.execute({ ...submission, responsibleUserId: this.responsibleUserId }, { ...this.progress }).pipe(
      tap({
        next: (event) => {
          if (event.step === 'stage') {
            this.progress.chainId = event.chainId;
            this.stageSaved.set(true);
          } else if (event.step === 'transport') {
            this.progress.transportSaved = true;
          } else {
            this.progress.emissionSaved = true;
          }
        },
        complete: () => this.saving.set(false),
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(FAILURE_MESSAGES[error instanceof AdvanceStageError ? error.step : 'stage']);
        },
      }),
    );
  }

  // Fornecedor só registra etapas com o próprio endereço; os demais perfis escolhem entre todos os fornecedores.
  private loadChoices(): void {
    const choices$ =
      this.role === 'supplier'
        ? this.currentUser.load().pipe(
            switchMap((user) => this.suppliers.get(user.userId).pipe(map((supplier) => ({ user, suppliers: [supplier] })))),
          )
        : forkJoin({
            user: this.currentUser.load(),
            suppliers: this.suppliers.load().pipe(catchError(() => of([] as Supplier[]))),
          });
    choices$.subscribe({
      next: ({ user, suppliers }) => {
        this.responsibleUserId = user.userId;
        this.addresses.set(suppliers.flatMap((supplier) => toAddressOptions(supplier)));
        this.loadingChoices.set(false);
      },
      error: () => {
        this.loadingChoices.set(false);
        this.error.set('Não foi possível identificar o usuário responsável pela etapa.');
      },
    });
  }
}

function toAddressOptions(supplier: Supplier): AddressOption[] {
  const address = supplier.address;
  if (!address?.addressId) return [];
  const place = [address.city, address.state].filter(Boolean).join('/');
  return [{ addressId: address.addressId, label: `${supplier.name}${place ? ` — ${place}` : ''}` }];
}
