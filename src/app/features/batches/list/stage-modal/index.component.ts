import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of, catchError, map, switchMap } from 'rxjs';
import { SessionService } from '../../../../core/auth/session/index.service';
import { CurrentUserService } from '../../../../core/auth/session/current-user/index.service';
import { SuppliersService } from '../../../suppliers/index.service';
import { ModalComponent } from '../../../../shared/components/modal/index.component';
import { ChainService } from '../../../chain/index.service';
import {
  calculationMethodSchema,
  fuelTypeSchema,
  stageTypeSchema,
  transportModeSchema,
} from '../../../traceability/index.schema';
import { SupplierResponseDTO } from '../../../suppliers/index.schema';

interface AddressOption {
  addressId: number;
  label: string;
}

@Component({
  selector: 'app-batch-stage-modal',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchStageModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly chainService = inject(ChainService);
  private readonly currentUserService = inject(CurrentUserService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly session = inject(SessionService);

  readonly dismiss = output<void>();
  readonly created = output<void>();
  readonly changed = output<void>();
  readonly batchId = input.required<number>();
  readonly loadingChoices = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly addresses = signal<AddressOption[]>([]);
  readonly canCalculateEmission = ['admin', 'manager'].includes(this.session.role() ?? '');
  readonly stageTypes = stageTypeSchema.options;
  readonly transportModes = transportModeSchema.options;
  readonly fuelTypes = fuelTypeSchema.options;
  readonly calculationMethods = calculationMethodSchema.options;
  private responsibleUserId: number | null = null;
  readonly savedStageId = signal<number | null>(null);
  private transportSaved = false;
  private emissionSaved = false;

  readonly form = this.fb.group({
    stageType: ['', Validators.required],
    startedAt: ['', Validators.required],
    endedAt: [''],
    originAddressId: [''],
    destinationAddressId: [''],
    transportMode: [''],
    distance: [null as number | null],
    fuelType: [''],
    capacity: [null as number | null],
    calculationMethod: ['GHG_PROTOCOL', Validators.required],
    calculateEmission: [false],
  });

  constructor() {
    this.form.controls.stageType.valueChanges.pipe(takeUntilDestroyed()).subscribe((stageType) => {
      this.updateTransportValidators(stageType === 'TRANSPORT');
    });
    const choices$ =
      this.session.role() === 'supplier'
        ? this.currentUserService
            .load()
            .pipe(
              switchMap((user) =>
                this.suppliersService
                  .get(user.userId)
                  .pipe(map((supplier) => ({ user, suppliers: [supplier] }))),
              ),
            )
        : forkJoin({
            user: this.currentUserService.load(),
            suppliers: this.suppliersService
              .load()
              .pipe(catchError(() => of([] as SupplierResponseDTO[]))),
          });
    choices$.subscribe({
      next: ({ user, suppliers }) => {
        this.responsibleUserId = user.userId;
        this.addresses.set(suppliers.flatMap((supplier) => this.toAddressOptions(supplier)));
        this.loadingChoices.set(false);
      },
      error: () => {
        this.loadingChoices.set(false);
        this.error.set('Não foi possível identificar o usuário responsável pela etapa.');
      },
    });
  }

  get isTransport(): boolean {
    return this.form.controls.stageType.value === 'TRANSPORT';
  }

  submit(): void {
    if (this.loadingChoices() || this.saving()) return;
    if (this.savedStageId() !== null) {
      this.saving.set(true);
      this.error.set('');
      this.saveRemainingSteps();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.responsibleUserId) {
      this.error.set('Não foi possível identificar o usuário responsável pela etapa.');
      return;
    }

    const value = this.form.getRawValue();
    const stageType = value.stageType as (typeof stageTypeSchema.options)[number];
    this.saving.set(true);
    this.error.set('');
    this.chainService
      .createStage(this.batchId(), this.responsibleUserId, {
        batchId: this.batchId(),
        originAddressId: value.originAddressId ? Number(value.originAddressId) : null,
        destinationAddressId: value.destinationAddressId
          ? Number(value.destinationAddressId)
          : null,
        stageType,
        startedAt: this.toApiDateTime(value.startedAt!),
        endedAt: value.endedAt ? this.toApiDateTime(value.endedAt) : null,
      })
      .subscribe({
        next: (stage) => {
          this.savedStageId.set(stage.chainId);
          this.changed.emit();
          this.saveRemainingSteps();
        },
        error: () =>
          this.fail('Não foi possível registrar a etapa. Confira os dados e tente novamente.'),
      });
  }

  requestDismiss(): void {
    if (!this.saving()) this.dismiss.emit();
  }

  private saveRemainingSteps(): void {
    const chainId = this.savedStageId();
    if (chainId === null) {
      this.fail('Não foi possível recuperar a etapa criada.');
      return;
    }
    if (this.isTransport && !this.transportSaved) {
      const value = this.form.getRawValue();
      this.chainService
        .createTransport(chainId, {
          chainId,
          transportMode: value.transportMode as (typeof transportModeSchema.options)[number],
          distance: Number(value.distance),
          fuelType: value.fuelType as (typeof fuelTypeSchema.options)[number],
          capacity: Number(value.capacity),
        })
        .subscribe({
          next: () => {
            this.transportSaved = true;
            this.changed.emit();
            this.saveRemainingSteps();
          },
          error: () =>
            this.fail(
              'A etapa foi registrada, mas não foi possível salvar os dados do transporte. Você pode tentar novamente.',
            ),
        });
      return;
    }
    const value = this.form.getRawValue();
    if (this.canCalculateEmission && value.calculateEmission && !this.emissionSaved) {
      this.chainService
        .calculateEmission(chainId, {
          chainId,
          calculationMethod:
            value.calculationMethod as (typeof calculationMethodSchema.options)[number],
        })
        .subscribe({
          next: () => {
            this.emissionSaved = true;
            this.changed.emit();
            this.saveRemainingSteps();
          },
          error: () =>
            this.fail(
              'A etapa foi registrada, mas não foi possível calcular a emissão. Você pode tentar novamente.',
            ),
        });
      return;
    }
    this.saving.set(false);
    this.created.emit();
  }

  private fail(message: string): void {
    this.error.set(message);
    this.saving.set(false);
  }

  private updateTransportValidators(required: boolean): void {
    const controls = [
      this.form.controls.transportMode,
      this.form.controls.distance,
      this.form.controls.fuelType,
      this.form.controls.capacity,
    ];
    for (const control of controls) {
      control.setValidators(
        required
          ? [
              Validators.required,
              ...(control === this.form.controls.distance || control === this.form.controls.capacity
                ? [Validators.min(0.000001)]
                : []),
            ]
          : [],
      );
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private toApiDateTime(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }

  private toAddressOptions(supplier: SupplierResponseDTO): AddressOption[] {
    const address = supplier.address;
    if (!address?.addressId) return [];
    const place = [address.city, address.state].filter(Boolean).join('/');
    return [
      { addressId: address.addressId, label: `${supplier.name}${place ? ` — ${place}` : ''}` },
    ];
  }
}
